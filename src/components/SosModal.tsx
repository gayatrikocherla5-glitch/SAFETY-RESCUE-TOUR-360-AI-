/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  Battery, 
  Wifi, 
  WifiOff, 
  Send, 
  Radio, 
  Volume2, 
  VolumeX, 
  X, 
  CheckCircle, 
  ExternalLink,
  Navigation,
  Target,
  Zap,
  Clock,
  ChevronRight,
  MessageSquare,
  Check,
  Copy,
  RotateCw,
  Users,
  FileText
} from 'lucide-react';
import { User, LocationCoordinate, EmergencyPlace, SosAlert, SosSignalRangeKm, SmsDispatchRecord, EmergencyContact } from '../types';
import { soundEngine } from '../utils/audio';
import { SOS_RANGE_CONFIGS } from './InteractiveMap';
import { 
  dispatchAutomatedSmsToContacts, 
  generateEmergencySmsText, 
  generateSmsUri, 
  generateMultiContactSmsUri,
  DEFAULT_EMERGENCY_CONTACTS
} from '../utils/smsService';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentCoords: LocationCoordinate;
  isOffline: boolean;
  activeSos: SosAlert | null;
  onConfirmSos: (emergencyType?: SosAlert['emergencyType'], signalRange?: SosSignalRangeKm) => void;
  onCancelActiveSos: () => void;
  onUpdateSignalRange?: (newRange: SosSignalRangeKm) => void;
  nearbyPlaces: EmergencyPlace[];
  onNotification?: (title: string, message: string, type: 'emergency' | 'warning' | 'info' | 'safe' | 'construction' | 'sms') => void;
  onStartInAppCall?: (contact: EmergencyContact | { name: string; phone: string; relation: string; isPrimary?: boolean }) => void;
  onViewMapLive?: () => void;
  onOpenDirectSmsModal?: () => void;
  isLiveLocationMoving?: boolean;
  liveTelemetry?: any;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  user,
  currentCoords,
  isOffline,
  activeSos,
  onConfirmSos,
  onCancelActiveSos,
  onUpdateSignalRange,
  nearbyPlaces,
  onNotification,
  onStartInAppCall,
  onViewMapLive,
  onOpenDirectSmsModal,
  isLiveLocationMoving = false,
  liveTelemetry,
}) => {
  // Local range selection (if modified within modal)
  const [overrideRange, setOverrideRange] = useState<SosSignalRangeKm | null>(null);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [smsSentNotice, setSmsSentNotice] = useState(false);
  const [autoEscalateActive, setAutoEscalateActive] = useState<boolean>(true);
  const [escalateSecondsLeft, setEscalateSecondsLeft] = useState<number>(180);
  const [countdown, setCountdown] = useState<number | null>(() => (activeSos ? null : 3));
  const [smsDispatchRecords, setSmsDispatchRecords] = useState<SmsDispatchRecord[]>(() => activeSos?.smsDispatchLog || []);
  const [isCopiedSms, setIsCopiedSms] = useState<boolean>(false);
  const [showSmsPreview, setShowSmsPreview] = useState<boolean>(false);
  const [isResendingSms, setIsResendingSms] = useState<boolean>(false);

  // Sync or auto-dispatch SMS to all saved contacts when activeSos becomes active
  useEffect(() => {
    if (isOpen && activeSos) {
      if (activeSos.smsDispatchLog && activeSos.smsDispatchLog.length > 0) {
        setSmsDispatchRecords(activeSos.smsDispatchLog);
      } else {
        const records = dispatchAutomatedSmsToContacts(
          user?.emergencyContacts || [],
          user,
          currentCoords,
          activeSos
        );
        setSmsDispatchRecords(records);
        activeSos.smsDispatchLog = records;
      }
    }
  }, [isOpen, Boolean(activeSos), activeSos?.id]);

  // Determine current active signal range safely
  const rawRange = overrideRange ?? activeSos?.signalRangeKm ?? 20;
  const safeRange: SosSignalRangeKm = (
    rawRange === 10 || rawRange === 20 || rawRange === 50 || rawRange === 100
  ) ? rawRange : 20;

  const currentRangeRef = useRef(safeRange);
  currentRangeRef.current = safeRange;

  const onConfirmSosRef = useRef(onConfirmSos);
  onConfirmSosRef.current = onConfirmSos;

  const onUpdateSignalRangeRef = useRef(onUpdateSignalRange);
  onUpdateSignalRangeRef.current = onUpdateSignalRange;

  const handleResendAllSms = () => {
    soundEngine.playClickSound();
    setIsResendingSms(true);
    const updated = dispatchAutomatedSmsToContacts(
      user?.emergencyContacts || [],
      user,
      currentCoords,
      activeSos || { signalRangeKm: safeRange }
    );
    setSmsDispatchRecords(updated);
    setSmsSentNotice(true);
    soundEngine.playSmsDispatchedTone();
    if (onNotification) {
      const contacts = user?.emergencyContacts || [];
      const contactNames = contacts.map(c => `${c.name} (${c.phone})`).join(', ');
      onNotification(
        '📱 AUTOMATIC SMS RE-SENT TO CONTACTS',
        `Emergency distress SMS re-broadcasted to all ${contacts.length} saved contacts: ${contactNames}. Live moving GPS tracking active on map.`,
        'sms'
      );
    }
    setTimeout(() => {
      setIsResendingSms(false);
    }, 700);
  };

  const handleCopySms = () => {
    soundEngine.playClickSound();
    const text = generateEmergencySmsText(
      user,
      currentCoords,
      safeRange,
      activeSos?.emergencyType || 'sos_manual'
    );
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setIsCopiedSms(true);
        setTimeout(() => setIsCopiedSms(false), 2200);
      }).catch(() => {});
    }
  };

  // 3-Second Safeguard Countdown when opening modal without pre-existing SOS
  useEffect(() => {
    if (!isOpen || activeSos) {
      setCountdown(null);
      return;
    }

    setCountdown(3);
    let secondsLeft = 3;
    soundEngine.playCountdownBeep();

    const timer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(timer);
        setCountdown(null);
        soundEngine.playEmergencyAlarm();
        const trigger = onConfirmSosRef.current;
        const range = currentRangeRef.current;
        trigger('sos_manual', range);
      } else {
        setCountdown(secondsLeft);
        soundEngine.playCountdownBeep();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, Boolean(activeSos)]);

  // Auto-escalation timer (10km -> 20km -> 50km -> 100km) every 3 minutes while SOS is active
  useEffect(() => {
    if (!isOpen || !activeSos || !autoEscalateActive) return;

    setEscalateSecondsLeft(180);

    const timer = setInterval(() => {
      setEscalateSecondsLeft(prev => {
        if (prev <= 1) {
          const current = currentRangeRef.current;
          let nextRange: SosSignalRangeKm = 20;
          if (current === 10) nextRange = 20;
          else if (current === 20) nextRange = 50;
          else if (current === 50) nextRange = 100;
          else nextRange = 100;

          if (nextRange !== current) {
            setOverrideRange(nextRange);
            onUpdateSignalRangeRef.current?.(nextRange);
            soundEngine.playWarningTone();
          }
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, Boolean(activeSos), autoEscalateActive]);

  // Vibrate mobile device when active
  useEffect(() => {
    if (isOpen && activeSos && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {
        // ignore
      }
    }
  }, [isOpen, Boolean(activeSos)]);

  // Guarantee emergency siren is playing whenever active SOS is opened and siren is unmuted
  useEffect(() => {
    if (isOpen && activeSos && !isSirenMuted) {
      soundEngine.playEmergencyAlarm();
    }
  }, [isOpen, Boolean(activeSos), isSirenMuted]);

  if (!isOpen) return null;

  const toggleSiren = () => {
    soundEngine.playClickSound();
    if (isSirenMuted) {
      soundEngine.playEmergencyAlarm();
      setIsSirenMuted(false);
    } else {
      soundEngine.stopEmergencyAlarm();
      setIsSirenMuted(true);
    }
  };

  const handleInstantConfirm = () => {
    soundEngine.playClickSound();
    soundEngine.playEmergencyAlarm();
    setCountdown(null);
    onConfirmSos('sos_manual', safeRange);
  };

  const handleSelectRange = (range: SosSignalRangeKm) => {
    soundEngine.playClickSound();
    setOverrideRange(range);
    if (activeSos && onUpdateSignalRange) {
      onUpdateSignalRange(range);
    }
  };

  const safeLat = typeof currentCoords?.lat === 'number' ? currentCoords.lat : 15.5002;
  const safeLng = typeof currentCoords?.lng === 'number' ? currentCoords.lng : 73.8282;
  const safeAccuracy = typeof currentCoords?.accuracy === 'number' ? currentCoords.accuracy : 10;
  const rawContacts = Array.isArray(user?.emergencyContacts) && user.emergencyContacts.length > 0 
    ? user.emergencyContacts 
    : DEFAULT_EMERGENCY_CONTACTS;
  const contacts = rawContacts;
  const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];

  const mapsUrl = `https://maps.google.com/?q=${safeLat},${safeLng}`;
  const smsBody = encodeURIComponent(
    `EMERGENCY SOS from ${user?.name || 'Traveler'} (Safety ID: ${user?.digitalSafetyId || 'SRT-TOURIST'})! Urgent assistance needed. Broadcast Envelope: ${safeRange} km. Live GPS: ${mapsUrl} (Accuracy: ~${safeAccuracy}m, Battery: ${user?.batteryLevel ?? 100}%). Sent via SAFETY & RESCUE TOUR 360°– AI.`
  );

  const safeNearby = Array.isArray(nearbyPlaces) ? nearbyPlaces : [];
  const hospitals = safeNearby.filter(p => p && p.type === 'hospital').slice(0, 2);
  const policeStations = safeNearby.filter(p => p && p.type === 'police').slice(0, 2);

  const rangeConfig = SOS_RANGE_CONFIGS[safeRange] || SOS_RANGE_CONFIGS[20] || {
    label: '20 km',
    scope: 'City & Coast Guard District',
    areaKm2: 1257,
    protocol: 'City TETRA Police Radio + GSM Cell Towers',
    authorities: 'Municipal Police HQ, General Trauma Hospital, Coastal Patrol',
    color: '#06b6d4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-red-500 rounded-3xl shadow-2xl shadow-red-900/50 overflow-hidden text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Pulsing Emergency Top Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-white tracking-wider flex items-center gap-2">
                {activeSos ? (isOffline ? 'OFFLINE SOS ACTIVE' : 'SOS ACTIVE') : 'CONFIRM EMERGENCY SOS'}
              </h2>
              <p className="text-xs text-red-100 font-medium">
                {activeSos
                  ? isOffline
                    ? 'Encrypted offline dispatch queued. Stored locally until link detected.'
                    : `Dispatched across ${safeRange} km signal envelope to Police & contacts.`
                  : '3-second accidental confirmation safeguard... Tap Abort if triggered by mistake.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSos && (
              <button
                onClick={toggleSiren}
                className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-colors"
                title={isSirenMuted ? 'Turn siren sound ON' : 'Turn siren sound OFF'}
              >
                {isSirenMuted ? <VolumeX className="w-5 h-5 text-red-200" /> : <Volume2 className="w-5 h-5 text-yellow-300 animate-bounce" />}
              </button>
            )}
            <button
              onClick={() => {
                soundEngine.playClickSound();
                soundEngine.stopEmergencyAlarm();
                onClose();
              }}
              className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Pre-SOS Countdown Confirmation State */}
          {!activeSos && countdown !== null && (
            <div className="text-center py-4 space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-600/20 border-4 border-red-500 flex items-center justify-center text-4xl font-black text-red-500 animate-pulse">
                {countdown}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">Broadcasting Emergency Signal in {countdown}s</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                  Automatically transmitting emergency SMS to <span className="text-emerald-400 font-bold">{contacts.length} saved contacts</span> ({contacts.map(c => c.name).join(', ')}) with live GPS coordinates ({safeLat.toFixed(4)}, {safeLng.toFixed(4)}) &amp; Digital ID.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatic SMS Active: No phone touch required</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    soundEngine.playClickSound();
                    soundEngine.stopEmergencyAlarm();
                    setCountdown(null);
                    onClose();
                  }}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700"
                >
                  Cancel / False Alarm
                </button>
                <button
                  onClick={handleInstantConfirm}
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/40"
                >
                  Confirm Immediately ({safeRange} km)
                </button>
              </div>
            </div>
          )}

          {/* AUTOMATIC SOS SIGNAL RANGE CONTROLLER (10 km, 20 km, 50 km, 100 km) */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Automatic SOS Signal Broadcast Range
                </h4>
              </div>

              {activeSos && autoEscalateActive && safeRange < 100 && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                  <span>
                    Auto-escalating in {Math.floor(escalateSecondsLeft / 60)}:{(escalateSecondsLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* 10km, 20km, 50km, 100km Range Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([10, 20, 50, 100] as const).map(range => {
                const isSelected = safeRange === range;
                const cfg = SOS_RANGE_CONFIGS[range] || SOS_RANGE_CONFIGS[20];
                return (
                  <button
                    key={range}
                    onClick={() => handleSelectRange(range)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-red-600/30 border-red-500 text-white shadow-md ring-1 ring-red-400/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-white flex items-center gap-1">
                        <Target className="w-3 h-3 text-red-400" />
                        <span>{cfg.label}</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        ~{cfg.areaKm2.toLocaleString()} km²
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 mt-1 truncate">{cfg.scope}</p>
                  </button>
                );
              })}
            </div>

            {/* Auto-escalation switch & scope details */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">
                <span className="font-bold text-slate-200">{rangeConfig.protocol}</span> ({rangeConfig.authorities})
              </span>

              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setAutoEscalateActive(!autoEscalateActive);
                }}
                className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-colors ${
                  autoEscalateActive
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Auto-Escalate: {autoEscalateActive ? 'ON (180s)' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Active SOS Content when alert is running */}
          {activeSos && (
            <>
              {/* Emergency Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" /> GPS Coordinates
                  </span>
                  <p className="font-mono text-white font-bold">{safeLat.toFixed(5)}, {safeLng.toFixed(5)}</p>
                  <p className="text-[10px] text-slate-400">Accuracy &plusmn;{safeAccuracy}m</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Battery className="w-3 h-3 text-emerald-400" /> Device Battery
                  </span>
                  <p className="font-mono text-emerald-400 font-bold">{user?.batteryLevel ?? 100}%</p>
                  <p className="text-[10px] text-slate-400">Power telemetry sync</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    {isOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3 text-cyan-400" />} Network Link
                  </span>
                  <p className={`font-mono font-bold ${isOffline ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {isOffline ? 'OFFLINE (QUEUED)' : 'LIVE ONLINE'}
                  </p>
                  <p className="text-[10px] text-slate-400">{isOffline ? 'Stored locally' : 'Broadcasting'}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" /> Emergency ID
                  </span>
                  <p className="font-mono text-cyan-400 font-bold truncate">{user?.digitalSafetyId || 'SRT-TOURIST'}</p>
                  <p className="text-[10px] text-slate-400">Sepolia smart proof</p>
                </div>
              </div>

              {/* AUTOMATED EMERGENCY SMS DISPATCH TO ALL SAVED CONTACTS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 animate-pulse">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                          Hands-Free SMS Broadcasted
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>All {contacts.length} Contacts Alerted (No Phone Touch Needed)</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Live GPS distress beacon automatically transmitted through Cellular Gateway to your saved emergency contacts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {onViewMapLive && (
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          onViewMapLive();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 active:scale-95"
                        title="Switch to interactive map and track live moving location"
                      >
                        <Navigation className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Watch Live Moving on Map</span>
                      </button>
                    )}

                    {onOpenDirectSmsModal && (
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          onOpenDirectSmsModal();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        title="Open Direct SMS Sharing hub with full multi-channel dispatch controls"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Direct SMS Hub</span>
                      </button>
                    )}

                    <button
                      onClick={handleResendAllSms}
                      disabled={isResendingSms}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      title="Re-broadcast automated SMS to all saved contacts"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isResendingSms ? 'animate-spin' : ''}`} />
                      <span>{isResendingSms ? 'Broadcasting...' : 'Resend SMS'}</span>
                    </button>

                    <button
                      onClick={handleCopySms}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                      title="Copy emergency SMS message to clipboard"
                    >
                      {isCopiedSms ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{isCopiedSms ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>

                {/* Saved Contacts SMS Dispatch List */}
                <div className="space-y-2">
                  {contacts.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No saved emergency contacts found. Please add contacts in the Emergency Contacts tab.</span>
                    </div>
                  ) : (
                    contacts.map((contact, index) => {
                      const record = smsDispatchRecords.find(r => r.contactPhone === contact.phone) || smsDispatchRecords[index];
                      const singleSmsUri = generateSmsUri(
                        contact.phone,
                        generateEmergencySmsText(user, currentCoords, safeRange, activeSos?.emergencyType || 'sos_manual')
                      );

                      return (
                        <div
                          key={contact.id}
                          className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-950 to-slate-800 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-white">
                              {contact.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-white">{contact.name}</span>
                                <span className="text-[10px] text-slate-400">({contact.relation || 'Contact'})</span>
                                {contact.isPrimary && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-cyan-300 font-bold rounded border border-blue-500/30">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-cyan-400 font-bold">{contact.phone}</span>
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>{record?.status === 'delivered' ? 'Direct SMS Delivered (No Phone Touch)' : 'Direct Gateway Sent'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                            {onStartInAppCall && (
                              <button
                                onClick={() => {
                                  soundEngine.playClickSound();
                                  onStartInAppCall(contact);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                                title="Call directly inside this website without launching any other app"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Direct In-App Call</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                soundEngine.playClickSound();
                                const records = dispatchAutomatedSmsToContacts(
                                  [contact],
                                  user,
                                  currentCoords,
                                  activeSos || { signalRangeKm: safeRange },
                                  'panic_button',
                                  { attemptDeviceSms: false }
                                );
                                setSmsDispatchRecords(prev => [
                                  ...prev.filter(r => r.contactPhone !== contact.phone),
                                  ...records,
                                ]);
                                soundEngine.playSmsDispatchedTone();
                                setSmsSentNotice(true);
                                if (onNotification) {
                                  onNotification(
                                    '📱 DIRECT SMS DISPATCHED',
                                    `Emergency SMS sent directly to ${contact.name} (${contact.phone}) through Cellular Gateway without touching phone.`,
                                    'sms'
                                  );
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                              title="Re-send emergency SMS directly via cellular gateway without touching phone"
                            >
                              <Zap className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Auto-SMS</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Live Google Maps Link Card */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Maps Link:</span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline truncate font-bold text-[11px]"
                      >
                        {mapsUrl}
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playClickSound();
                        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                          navigator.clipboard.writeText(mapsUrl);
                          if (onNotification) onNotification('📍 Copied', 'Google Maps link copied to clipboard', 'info');
                        }
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold shrink-0"
                    >
                      Copy Link
                    </button>
                  </div>
                  {isLiveLocationMoving && (
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-sans font-bold pt-1 border-t border-slate-800/80">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Live GPS Moving &bull; Speed: {liveTelemetry?.speedKmh || 5.2} km/h {liveTelemetry?.headingCardinal || 'NE'}</span>
                      </span>
                      {onViewMapLive && (
                        <button
                          onClick={() => {
                            soundEngine.playClickSound();
                            onViewMapLive();
                          }}
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>View on Map &rarr;</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* SMS Preview Toggle and Box */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowSmsPreview(!showSmsPreview)}
                    className="text-[11px] font-bold text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span>{showSmsPreview ? 'Hide Dispatched SMS Payload' : 'View Dispatched SMS Text Payload'}</span>
                  </button>

                  {showSmsPreview && (
                    <div className="mt-2 p-3 rounded-xl bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                      {generateEmergencySmsText(user, currentCoords, safeRange, activeSos?.emergencyType || 'sos_manual')}
                    </div>
                  )}
                </div>
              </div>

              {smsSentNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SMS client launched with live GPS coordinates, battery stats, and safety ID.</span>
                </div>
              )}

              {/* Nearest Emergency Services (Hospitals & Police) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {policeStations.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300">Nearest Tourist Police</span>
                      <span className="text-[10px] text-emerald-400 font-bold">24x7 Active</span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{policeStations[0].name}</p>
                    <div className="flex items-center gap-2 pt-1">
                      {onStartInAppCall ? (
                        <button
                          onClick={() => {
                            soundEngine.playClickSound();
                            onStartInAppCall({
                              name: 'Tourist Police Emergency Command (112)',
                              phone: '112',
                              relation: 'Official Police Dispatch Desk'
                            });
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
                        >
                          <PhoneCall className="w-3 h-3" /> Call 112 In-App
                        </button>
                      ) : (
                        <a
                          href={`tel:${policeStations[0].phone}`}
                          className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <PhoneCall className="w-3 h-3" /> Call 112
                        </a>
                      )}
                      <a
                        href={`https://maps.google.com/?q=${policeStations[0].lat},${policeStations[0].lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                        title="Directions"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {hospitals.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">Nearest Emergency Hospital</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Trauma Ward</span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{hospitals[0].name}</p>
                    <div className="flex items-center gap-2 pt-1">
                      {onStartInAppCall ? (
                        <button
                          onClick={() => {
                            soundEngine.playClickSound();
                            onStartInAppCall({
                              name: hospitals[0].name,
                              phone: hospitals[0].phone,
                              relation: 'Emergency Hospital Trauma Unit'
                            });
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30"
                        >
                          <PhoneCall className="w-3 h-3" /> Call Trauma In-App
                        </button>
                      ) : (
                        <a
                          href={`tel:${hospitals[0].phone}`}
                          className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <PhoneCall className="w-3 h-3" /> Call Trauma Desk
                        </a>
                      )}
                      <a
                        href={`https://maps.google.com/?q=${hospitals[0].lat},${hospitals[0].lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                        title="Directions"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Abort / Resolve active SOS button */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs text-slate-400">Emergency tracking streaming coordinates over {safeRange} km radius.</span>
                <button
                  onClick={() => {
                    soundEngine.playClickSound();
                    soundEngine.stopEmergencyAlarm();
                    onCancelActiveSos();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700"
                >
                  I Am Now Safe (Resolve SOS)
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
