/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Play, 
  Square, 
  RotateCcw, 
  Compass, 
  Navigation2, 
  Bed, 
  Mountain,
  BellRing,
  Radio,
  Target
} from 'lucide-react';
import { SmartCheckInSession, LocationCoordinate, User, SosSignalRangeKm } from '../types';
import { soundEngine } from '../utils/audio';

interface SmartCheckInProps {
  user: User;
  currentCoords: LocationCoordinate;
  isOffline: boolean;
  onTriggerSos: (reason: 'sos_auto_checkin' | 'sos_manual', signalRange?: SosSignalRangeKm) => void;
  onNotification: (title: string, message: string, type: 'warning' | 'emergency' | 'info') => void;
}

export const SmartCheckIn: React.FC<SmartCheckInProps> = ({
  user,
  currentCoords,
  isOffline,
  onTriggerSos,
  onNotification,
}) => {
  const [session, setSession] = useState<SmartCheckInSession | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<number>(30); // 30s demo interval or 300, 600, 900, 1800
  const [selectedMode, setSelectedMode] = useState<'active_journey' | 'hiking' | 'transit' | 'hotel_safe'>('active_journey');
  const [sosSignalRange, setSosSignalRange] = useState<SosSignalRangeKm>(20);
  const [journeyNote, setJourneyNote] = useState<string>('Solo evening walk to Fort Aguada view point');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [graceCountdown, setGraceCountdown] = useState<number>(15); // 15 seconds warning window before auto-SOS

  // Main countdown timer effect
  useEffect(() => {
    if (!session || session.status === 'sos_triggered') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((session.nextCheckAt - now) / 1000);

      if (diff <= 0) {
        // Time is up! Activate Prompt Modal
        if (!showPromptModal) {
          setShowPromptModal(true);
          setGraceCountdown(15);
          soundEngine.playWarningTone();
          onNotification(
            '⏰ Smart Check-In Alert',
            'ARE YOU SAFE or NOT? Please confirm your safety status within 15 seconds.',
            'warning'
          );
        }
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, showPromptModal, onNotification]);

  const handleAutoSosTriggerRef = useRef<() => void>(() => {});

  // Grace countdown effect when prompt is active
  useEffect(() => {
    if (!showPromptModal || !session) return;

    let countdown = 15;
    setGraceCountdown(15);

    const graceTimer = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(graceTimer);
        setGraceCountdown(0);
        // Missed check limit reached! Check travel context
        handleAutoSosTriggerRef.current();
      } else {
        setGraceCountdown(countdown);
        soundEngine.playCountdownBeep();
      }
    }, 1000);

    return () => clearInterval(graceTimer);
  }, [showPromptModal, session?.id]);

  const handleStartCheckIn = () => {
    soundEngine.playClickSound();
    const now = Date.now();
    const newSession: SmartCheckInSession = {
      id: `chk_${Date.now()}`,
      intervalSeconds: selectedInterval,
      startedAt: now,
      nextCheckAt: now + selectedInterval * 1000,
      status: 'monitoring',
      missedCount: 0,
      maxMissedAllowed: 1,
      travelMode: selectedMode,
      journeyNote: journeyNote,
    };
    setSession(newSession);
    setSecondsRemaining(selectedInterval);
    setShowPromptModal(false);
    onNotification(
      'Smart Check-In Started',
      `Monitoring active for interval of ${selectedInterval} seconds. Context: ${selectedMode}.`,
      'info'
    );
  };

  const handleStopCheckIn = () => {
    soundEngine.playClickSound();
    setSession(null);
    setShowPromptModal(false);
  };

  const handleSafeResponse = () => {
    soundEngine.playSuccessChime();
    setShowPromptModal(false);
    if (!session) return;

    const now = Date.now();
    setSession({
      ...session,
      nextCheckAt: now + session.intervalSeconds * 1000,
      status: 'monitoring',
      missedCount: 0,
    });
    setSecondsRemaining(session.intervalSeconds);
    onNotification(
      'Safety Confirmed',
      'You reported safe. Timer has been reset.',
      'info'
    );
  };

  const handleNeedHelp = () => {
    soundEngine.playClickSound();
    soundEngine.playEmergencyAlarm();
    setShowPromptModal(false);
    if (session) {
      setSession({ ...session, status: 'sos_triggered' });
    }
    onTriggerSos('sos_manual', sosSignalRange);
  };

  const handleMoreTime = () => {
    soundEngine.playClickSound();
    setShowPromptModal(false);
    if (!session) return;

    const extraSeconds = session.intervalSeconds === 30 ? 30 : 300; // +30s or +5m
    const now = Date.now();
    setSession({
      ...session,
      nextCheckAt: now + extraSeconds * 1000,
      status: 'monitoring',
    });
    setSecondsRemaining(extraSeconds);
  };

  const handleAutoSosTrigger = () => {
    setShowPromptModal(false);
    if (selectedMode === 'hotel_safe') {
      // Context aware suppression: user is safe in hotel/rest, don't trigger false alarm
      onNotification(
        'Check-In Missed (Suppressed)',
        'Check-in expired, but Automatic SOS was suppressed because current context is Hotel / Safe Rest.',
        'info'
      );
      handleSafeResponse();
      return;
    }

    // Active journey or trekking - escalate to automatic SOS!
    soundEngine.playEmergencyAlarm();
    if (session) {
      setSession({
        ...session,
        status: 'sos_triggered',
        missedCount: session.missedCount + 1,
      });
    }
    onNotification(
      '🚨 Context-Aware Automatic SOS Activated!',
      `Unresponsive traveler on ${selectedMode} (${journeyNote}). Live GPS coordinates shared with Police & Emergency Contacts over ${sosSignalRange} km broadcast envelope.`,
      'emergency'
    );
    onTriggerSos('sos_auto_checkin', sosSignalRange);
  };
  handleAutoSosTriggerRef.current = handleAutoSosTrigger;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Context-Aware Smart Check-In
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Periodic automated safety heartbeats during solo travel, night transit, or trekking. Escalates to automatic SOS if unresponsive.
            </p>
          </div>

          {session ? (
            <button
              onClick={handleStopCheckIn}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 shadow-md self-start"
            >
              <Square className="w-4 h-4 text-rose-400" />
              <span>Stop Check-In</span>
            </button>
          ) : (
            <button
              onClick={handleStartCheckIn}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 self-start"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Safety Check-In</span>
            </button>
          )}
        </div>

        {/* Live Timer Status Card when Active */}
        {session && (
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            
            {/* Visual Countdown Dial */}
            <div className="flex items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                <div className="text-xl font-black font-mono text-cyan-400">
                  {formatTime(secondsRemaining)}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400">Next Safety Heartbeat</p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Heartbeat Monitoring
                </p>
              </div>
            </div>

            {/* Context Badge */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] font-bold uppercase text-slate-400">Active Travel Context</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-cyan-300 font-bold text-xs border border-blue-400/30 capitalize">
                  {session.travelMode.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-300 truncate">{session.journeyNote}</span>
              </div>
            </div>

            {/* Quick Test Trigger */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400">Demo Simulator</p>
                <p className="text-xs text-slate-400">Simulate Timer Expiry</p>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setShowPromptModal(true);
                  setGraceCountdown(15);
                  soundEngine.playWarningTone();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-500/40 text-xs font-bold"
              >
                Trigger Prompt Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Settings (When not in active session) */}
      {!session && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Interval Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>1. Choose Check-In Frequency</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: '30 Seconds (Fast Demo)', value: 30, desc: 'For testing automatic SOS' },
                { label: '5 Minutes', value: 300, desc: 'High risk night walks' },
                { label: '10 Minutes', value: 600, desc: 'City public transit' },
                { label: '15 Minutes', value: 900, desc: 'Forest trails & hikes' },
                { label: '30 Minutes', value: 1800, desc: 'Standard daytime tours' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    soundEngine.playClickSound();
                    setSelectedInterval(opt.value);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    selectedInterval === opt.value
                      ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md shadow-blue-500/15'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs sm:text-sm text-cyan-300">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Context-Aware Travel Mode Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>2. Travel Context & False-Alarm Prevention</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'active_journey', label: 'Active Journey', icon: Navigation2, desc: 'Walking alone / Night trip' },
                { id: 'hiking', label: 'Mountain / Trek', icon: Mountain, desc: 'Trails & remote valleys' },
                { id: 'transit', label: 'Cab / Bus Transit', icon: Compass, desc: 'Intercity or airport ride' },
                { id: 'hotel_safe', label: 'Hotel / Safe Hub', icon: Bed, desc: 'Suppresses false auto-SOS' },
              ].map(mode => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      soundEngine.playClickSound();
                      setSelectedMode(mode.id as typeof selectedMode);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-400 text-white shadow-md shadow-emerald-500/15'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">{mode.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{mode.desc}</p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Trip Description (Shared with Responders on SOS):
              </label>
              <input
                type="text"
                value={journeyNote}
                onChange={e => setJourneyNote(e.target.value)}
                placeholder="e.g. Walking from beach to night market"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Automatic SOS Signal Range Perimeter Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400" />
                <span>3. Automatic SOS Signal Broadcast Perimeter</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30">
                Auto-Escalation Enabled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { range: 10 as const, label: '10 km', scope: 'Ward & Beach Patrol', area: '314 km²', color: 'text-emerald-400' },
                { range: 20 as const, label: '20 km', scope: 'City Police & Hospitals', area: '1,257 km²', color: 'text-cyan-400' },
                { range: 50 as const, label: '50 km', scope: 'Regional SDRF & Air Evac', area: '7,854 km²', color: 'text-amber-400' },
                { range: 100 as const, label: '100 km', scope: 'NDRF & Satellite Distress', area: '31,416 km²', color: 'text-red-400' },
              ].map(item => {
                const isSelected = sosSignalRange === item.range;
                return (
                  <button
                    key={item.range}
                    onClick={() => {
                      soundEngine.playClickSound();
                      setSosSignalRange(item.range);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-red-600/20 border-red-500 text-white shadow-md shadow-red-500/20 ring-1 ring-red-400/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black font-mono flex items-center gap-1 ${item.color}`}>
                        <Target className="w-3 h-3" />
                        <span>{item.label}</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{item.area}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 mt-1">{item.scope}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Safety Protocol Realism Box */}
      <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <BellRing className="w-4 h-4" />
          <span>Hands-Free Auto-SMS Protection (No Phone Touch Needed):</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          1. Periodic check-in prompt appears on time: <span className="text-white font-semibold">“⏰ ARE YOU SAFE or NOT?”</span><br />
          2. If confirmed with <span className="text-emerald-400 font-semibold">“🟢 I'm Safe”</span>, your safety is verified and the timer resets.<br />
          3. If you are incapacitated, unconscious, or cannot touch your phone for 15 seconds, the system activates <span className="text-rose-400 font-semibold">Automated Cellular Gateway SOS</span>.<br />
          4. Emergency SMS with live Google Maps GPS telemetry, battery level, and Sepolia Safety ID is <span className="text-emerald-300 font-bold">automatically dispatched to all your saved contacts without needing you to touch your phone</span>.
        </p>
      </div>

      {/* PROMPT MODAL: ARE YOU SAFE or NOT? */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">⏰ ARE YOU SAFE or NOT?</h3>
              <p className="text-xs text-slate-300 mt-1">
                Smart safety check-in for <span className="text-cyan-300 font-bold">{journeyNote}</span>.
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-rose-300 border border-red-500/40 text-xs font-mono font-bold">
                <span>Auto-SOS in {graceCountdown}s</span>
              </div>
            </div>

            {/* The 3 Action Buttons specified by the user */}
            <div className="space-y-2.5 pt-2">
              
              {/* Option 1: I'm Safe */}
              <button
                onClick={handleSafeResponse}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>🟢 I'm Safe</span>
              </button>

              {/* Option 2: I Need Help immediately */}
              <button
                onClick={handleNeedHelp}
                className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 active:scale-95 transition-all"
              >
                <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
                <span>🆘 I Need Help Immediately</span>
              </button>

              {/* Option 3: Give Me More Time */}
              <button
                onClick={handleMoreTime}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>⏳ Give Me More Time (+5 min)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
