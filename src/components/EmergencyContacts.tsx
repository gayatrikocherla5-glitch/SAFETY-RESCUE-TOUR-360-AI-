/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  PhoneCall, 
  MessageSquare, 
  Star, 
  Share2, 
  Trash2, 
  Check, 
  ShieldCheck,
  AlertCircle,
  Send,
  Radio,
  FileText,
  CheckCircle2,
  RotateCw,
  Copy,
  Zap,
  Smartphone,
  ShieldAlert,
  Flame,
  Clock,
  Settings,
  Navigation2
} from 'lucide-react';
import { EmergencyContact, User, LocationCoordinate, SmsDispatchRecord } from '../types';
import { soundEngine } from '../utils/audio';
import { dispatchAutomatedSmsToContacts, generateEmergencySmsText, generateSmsUri, getStoredSmsHistory, clearStoredSmsHistory } from '../utils/smsService';

interface EmergencyContactsProps {
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  userCoords: LocationCoordinate;
  user: User;
  onUpdateUser?: (updated: Partial<User>) => void;
  onNotification?: (title: string, message: string, type: 'emergency' | 'warning' | 'info' | 'safe' | 'construction' | 'sms') => void;
  onStartInAppCall?: (contact: EmergencyContact) => void;
  onActivateLiveMoving?: () => void;
  onOpenDirectSmsModal?: () => void;
}

export const EmergencyContacts: React.FC<EmergencyContactsProps> = ({
  contacts,
  onUpdateContacts,
  userCoords,
  user,
  onUpdateUser,
  onNotification,
  onStartInAppCall,
  onActivateLiveMoving,
  onOpenDirectSmsModal,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [relation, setRelation] = useState<string>('Family Member');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [shareLiveLocation, setShareLiveLocation] = useState<boolean>(true);
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);
  const [isTestingSms, setIsTestingSms] = useState<boolean>(false);
  const [showSmsPreview, setShowSmsPreview] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [smsHistory, setSmsHistory] = useState<SmsDispatchRecord[]>(() => getStoredSmsHistory());
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const handsFreeActive = user.handsFreeSmsEnabled ?? true;
  const autoDangerSms = user.autoSmsOnDangerZone ?? true;
  const autoTimeoutSms = user.autoSmsOnCheckInTimeout ?? true;

  const handleToggleHandsFree = () => {
    soundEngine.playClickSound();
    const nextVal = !handsFreeActive;
    onUpdateUser?.({ handsFreeSmsEnabled: nextVal });
    if (onNotification) {
      onNotification(
        nextVal ? '🤖 Hands-Free SMS Enabled' : '⏸️ Hands-Free SMS Paused',
        nextVal 
          ? 'Emergency SMS will be automatically dispatched to saved contacts without requiring phone touch.' 
          : 'Automatic dispatch paused. Manual confirmation will be required.',
        nextVal ? 'safe' : 'info'
      );
    }
  };

  const handleToggleDangerSms = () => {
    soundEngine.playClickSound();
    const nextVal = !autoDangerSms;
    onUpdateUser?.({ autoSmsOnDangerZone: nextVal });
  };

  const handleToggleTimeoutSms = () => {
    soundEngine.playClickSound();
    const nextVal = !autoTimeoutSms;
    onUpdateUser?.({ autoSmsOnCheckInTimeout: nextVal });
  };

  const handleTestSmsBroadcast = () => {
    soundEngine.playClickSound();
    setIsTestingSms(true);
    const records = dispatchAutomatedSmsToContacts(contacts, user, userCoords, {
      emergencyType: 'sos_manual',
      signalRangeKm: 20
    }, 'panic_button');
    setSmsHistory(getStoredSmsHistory());
    setTestSmsStatus(`Automated Emergency SMS successfully transmitted to ${records.length} contacts (${contacts.map(c => c.name).join(', ')}) with live GPS coordinates! Live location moving on map.`);
    soundEngine.playSmsDispatchedTone();
    if (onActivateLiveMoving) {
      onActivateLiveMoving();
    }
    if (onNotification) {
      onNotification(
        '📱 AUTOMATIC SMS SENT WITHOUT TOUCHING PHONE',
        `Cellular Gateway dispatched live coordinates (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}) to ${contacts.length} saved contacts: ${contacts.map(c => c.name).join(', ')}. Live moving map tracking active!`,
        'sms'
      );
    }
    setTimeout(() => {
      setIsTestingSms(false);
    }, 600);
    setTimeout(() => {
      setTestSmsStatus(null);
    }, 6000);
  };

  const handleSendDirectContactSms = (contact: EmergencyContact) => {
    soundEngine.playClickSound();
    const records = dispatchAutomatedSmsToContacts(
      [contact],
      user,
      userCoords,
      { emergencyType: 'sos_manual', signalRangeKm: 20 },
      'panic_button',
      { attemptDeviceSms: false }
    );
    setSmsHistory(getStoredSmsHistory());
    soundEngine.playSmsDispatchedTone();
    if (onActivateLiveMoving) {
      onActivateLiveMoving();
    }
    if (onNotification) {
      onNotification(
        '📱 AUTOMATIC SMS SENT DIRECTLY (NO PHONE TOUCH REQUIRED)',
        `Cellular Gateway dispatched live coordinates (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}) and Google Maps link to ${contact.name} (${contact.phone}) directly! Live moving location tracking on map.`,
        'sms'
      );
    }
  };

  const handleShareContactViaApp = async (contact: EmergencyContact) => {
    soundEngine.playClickSound();
    const smsText = generateEmergencySmsText(user, userCoords, 20, 'sos_manual');
    const mapsUrl = `https://maps.google.com/?q=${userCoords.lat.toFixed(5)},${userCoords.lng.toFixed(5)}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `🚨 Emergency SOS to ${contact.name}`,
          text: smsText,
          url: mapsUrl,
        });
        return;
      } catch (err) {
        console.log('User cancelled share:', err);
      }
    }
    // WhatsApp fallback
    const sanitized = contact.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${sanitized}?text=${encodeURIComponent(smsText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyPreviewText = () => {
    soundEngine.playClickSound();
    const text = generateEmergencySmsText(user, userCoords, 20, 'sos_manual');
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => {});
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    soundEngine.playClickSound();
    const newContact: EmergencyContact = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      relation,
      phone: phone.trim(),
      email: email.trim() || undefined,
      isPrimary,
      shareLiveLocation,
    };

    let updated = [...contacts];
    if (isPrimary) {
      updated = updated.map(c => ({ ...c, isPrimary: false }));
    }
    updated.push(newContact);
    onUpdateContacts(updated);

    setName('');
    setPhone('');
    setEmail('');
    setIsPrimary(false);
    setShowAddModal(false);
  };

  const handleTogglePrimary = (id: string) => {
    soundEngine.playClickSound();
    const updated = contacts.map(c => ({
      ...c,
      isPrimary: c.id === id,
    }));
    onUpdateContacts(updated);
  };

  const handleToggleShareLocation = (id: string) => {
    soundEngine.playClickSound();
    const updated = contacts.map(c => (
      c.id === id ? { ...c, shareLiveLocation: !c.shareLiveLocation } : c
    ));
    onUpdateContacts(updated);
  };

  const handleDelete = (id: string) => {
    soundEngine.playClickSound();
    if (contacts.length <= 1) {
      alert('You must have at least one emergency contact for SOS dispatch safety.');
      return;
    }
    const updated = contacts.filter(c => c.id !== id);
    onUpdateContacts(updated);
  };

  const generateSmsLink = (contactPhone: string) => {
    return generateSmsUri(contactPhone, generateEmergencySmsText(user, userCoords, 20, 'sos_manual'));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Authorized Emergency Contacts</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            These trusted contacts are immediately notified via SMS and cloud broadcast whenever you press SOS or miss a check-in.
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playClickSound();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Trusted Contact</span>
        </button>
      </div>

      {/* AUTOMATIC SOS SMS DISPATCH SYSTEM CARD - HANDS-FREE DISPATCH */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Hands-Free Automatic SMS Dispatch
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                  handsFreeActive 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>{handsFreeActive ? 'AUTO-DISPATCH: NO PHONE TOUCH REQUIRED' : 'PAUSED'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Transmits SMS directly via simulated Cellular Gateway without opening messages app or touching the device when emergencies occur.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleToggleHandsFree}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                handsFreeActive
                  ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50 hover:bg-emerald-600/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Hands-Free: {handsFreeActive ? 'ENABLED' : 'PAUSED'}
            </button>

            <button
              onClick={handleTestSmsBroadcast}
              disabled={isTestingSms || contacts.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
              title="Directly transmit automated emergency SMS to all saved contacts without touching phone"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isTestingSms ? 'animate-spin' : ''}`} />
              <span>{isTestingSms ? 'Transmitting via Gateway...' : '⚡ Broadcast Direct SMS to All Contacts'}</span>
            </button>

            {onOpenDirectSmsModal && (
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  onOpenDirectSmsModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                title="Open Direct SMS Sharing Console to view and dispatch SMS to saved contacts"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct SMS Console</span>
              </button>
            )}

            {onActivateLiveMoving && (
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  onActivateLiveMoving();
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                title="Switch to map and watch real-time moving location broadcast"
              >
                <Navigation2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Watch Live Moving on Map</span>
              </button>
            )}

            <button
              onClick={() => setShowSmsPreview(!showSmsPreview)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showSmsPreview ? 'Hide Payload' : 'Preview SMS'}</span>
            </button>
          </div>
        </div>

        {/* 3 AUTOMATIC HANDS-FREE TRIGGERS */}
        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Automated Hands-Free Trigger Conditions:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Trigger 1: Missed Check-in */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Unresponsive Check-In</span>
                </div>
                <button
                  onClick={handleToggleTimeoutSms}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                    autoTimeoutSms
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {autoTimeoutSms ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                Dispatches GPS SMS if timer expires and no safety heartbeat is confirmed within 15 seconds.
              </p>
            </div>

            {/* Trigger 2: Danger Zone Breach */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Danger Zone Breach</span>
                </div>
                <button
                  onClick={handleToggleDangerSms}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                    autoDangerSms
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {autoDangerSms ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                Geo-fence boundary breach into high-risk cliff faces or flood zones triggers instant SMS alert.
              </p>
            </div>

            {/* Trigger 3: SOS Distress Button */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Flame className="w-4 h-4" />
                  <span>SOS Beacon Activation</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  ALWAYS ON
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Immediate background broadcast to all saved contacts with Google Maps pin &amp; battery telemetry.
              </p>
            </div>

          </div>
        </div>

        {testSmsStatus && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{testSmsStatus}</span>
          </div>
        )}

        {showSmsPreview && (
          <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 font-bold">Standard Emergency SMS Payload:</span>
              <button
                onClick={handleCopyPreviewText}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px]"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy Template'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 text-xs font-mono text-slate-300 whitespace-pre-wrap select-all border border-slate-800/80">
              {generateEmergencySmsText(user, userCoords, 20, 'sos_manual')}
            </div>
          </div>
        )}

        {/* SMS Transmission History link */}
        {smsHistory.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              📡 Cellular Gateway Log: {smsHistory.length} broadcasts recorded
            </span>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-emerald-400 hover:underline font-bold"
            >
              View Dispatch History &amp; Delivery ACKs &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Contacts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map(contact => (
          <div
            key={contact.id}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden"
          >
            {contact.isPrimary && (
              <div className="absolute top-0 right-0 bg-blue-600/30 border-b border-l border-blue-500/40 text-cyan-300 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-2xl flex items-center gap-1">
                <Star className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                <span>Primary SOS Contact</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-base text-white">
                  {contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{contact.name}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {contact.relation}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs space-y-1 font-mono">
                <p className="text-white font-semibold flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] uppercase font-sans">Phone:</span>
                  <span>{contact.phone}</span>
                </p>
                {contact.email && (
                  <p className="text-slate-400 flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">Email:</span>
                    <span className="font-sans text-xs">{contact.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleShareLocation(contact.id)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold ${
                    contact.shareLiveLocation ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{contact.shareLiveLocation ? 'Live GPS Sharing: ON' : 'Live GPS: OFF'}</span>
                </button>

                {!contact.isPrimary && (
                  <button
                    onClick={() => handleTogglePrimary(contact.id)}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Make Primary
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onStartInAppCall ? (
                  <button
                    onClick={() => {
                      soundEngine.playClickSound();
                      onStartInAppCall(contact);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                    title="Direct voice call 100% inside this website without launching any other app"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-white" />
                    <span>Direct In-App Call</span>
                  </button>
                ) : (
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={() => soundEngine.playClickSound()}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Direct</span>
                  </a>
                )}

                <button
                  onClick={() => handleSendDirectContactSms(contact)}
                  className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                  title="Directly transmit emergency SMS with Google Maps link to this contact via Cellular Gateway without touching phone"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Auto-SMS (Direct)</span>
                </button>

                <a
                  href={generateSmsLink(contact.phone)}
                  onClick={() => soundEngine.playClickSound()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Open device Messages app pre-addressed to this contact"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                </a>

                <button
                  onClick={() => handleShareContactViaApp(contact)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Share live GPS SMS via WhatsApp or Web Share"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                  title="Remove Contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Add Emergency Contact</h3>
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setShowAddModal(false);
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kocherla"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Relationship</label>
                  <select
                    value={relation}
                    onChange={e => setRelation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Family Member">Family Member</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Friend">Friend</option>
                    <option value="Tour Group Leader">Tour Group Leader</option>
                    <option value="Hotel Concierge">Hotel Concierge</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98490 00000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={e => setIsPrimary(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Designate as Primary SOS Recipient</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={shareLiveLocation}
                    onChange={e => setShareLiveLocation(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Grant real-time GPS location sharing permission</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30"
                >
                  Save Emergency Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS DISPATCH HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Automated SMS Broadcast History</h3>
                  <p className="text-xs text-slate-400">Cellular gateway delivery acknowledgements &amp; timestamp logs</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundEngine.playClickSound();
                    clearStoredSmsHistory();
                    setSmsHistory([]);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30"
                >
                  Clear Log
                </button>
                <button
                  onClick={() => {
                    soundEngine.playClickSound();
                    setShowHistoryModal(false);
                  }}
                  className="text-slate-400 hover:text-white text-sm p-1.5"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {smsHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No automated SMS dispatches recorded yet. Use the test button or activate SOS to view live records.
                </div>
              ) : (
                smsHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{item.contactName}</span>
                        <span className="font-mono text-cyan-400 font-bold">{item.contactPhone}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.relation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>DELIVERED (GATEWAY)</span>
                        </span>
                        <span className="text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-all">
                      {item.messageText}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                      <span>ACK: <span className="text-emerald-400">{item.deliveryAckCode}</span></span>
                      <span>Gateway: <span className="text-cyan-400">{item.gateway}</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
