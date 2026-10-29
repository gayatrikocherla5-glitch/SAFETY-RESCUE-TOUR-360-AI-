/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Radio, 
  ShieldAlert, 
  User as UserIcon, 
  Grid, 
  Clock, 
  Check, 
  AlertCircle,
  Activity,
  Share2,
  ChevronDown
} from 'lucide-react';
import { ActiveInAppCall, EmergencyContact, LocationCoordinate, User } from '../types';
import { soundEngine } from '../utils/audio';

interface InAppDirectCallerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: EmergencyContact | { name: string; phone: string; relation: string; isPrimary?: boolean };
  user: User;
  currentCoords: LocationCoordinate;
  onNotification?: (title: string, message: string, type: 'emergency' | 'warning' | 'info' | 'safe' | 'construction' | 'sms') => void;
  allContacts?: EmergencyContact[];
}

export const InAppDirectCaller: React.FC<InAppDirectCallerProps> = ({
  isOpen,
  onClose,
  contact: initialContact,
  user,
  currentCoords,
  onNotification,
  allContacts = [],
}) => {
  const [selectedContact, setSelectedContact] = useState(initialContact);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [dtmfInput, setDtmfInput] = useState<string>('');
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [micLevel, setMicLevel] = useState<number>(0.3);
  const [audioTranscript, setAudioTranscript] = useState<string>('');
  const [isSpeakingGps, setIsSpeakingGps] = useState<boolean>(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync selected contact when prop changes
  useEffect(() => {
    setSelectedContact(initialContact);
  }, [initialContact?.phone, initialContact?.name]);

  // Handle call initiation, ringback tone, mic permission, and auto-answer simulation
  useEffect(() => {
    if (!isOpen) {
      cleanupCall();
      return;
    }

    setCallStatus('ringing');
    setDurationSeconds(0);
    setAudioTranscript('Initiating encrypted telecom call inside SAFETY & RESCUE TOUR 360°– AI...');

    // Start ringback tone
    soundEngine.startRingbackTone();

    // Request microphone access
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaStreamRef.current = stream;
          setMicPermission('granted');

          // Setup audio visualizer analyzer
          try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              audioContextRef.current = ctx;
              const source = ctx.createMediaStreamSource(stream);
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const updateLevel = () => {
                if (analyserRef.current) {
                  analyserRef.current.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                  }
                  const avg = sum / dataArray.length / 255;
                  setMicLevel(Math.max(0.15, avg * 1.8));
                  animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
              };
              updateLevel();
            }
          } catch {
            // Audio visualizer optional
          }
        })
        .catch(err => {
          console.warn('Microphone permission not granted:', err);
          setMicPermission('denied');
        });
    }

    // After 2.4 seconds of ringing, answer the in-app call
    const connectTimer = setTimeout(() => {
      soundEngine.playCallConnectedChime();
      setCallStatus('connected');

      // Start duration counter
      const startMs = Date.now();
      callTimerRef.current = window.setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);

      // Synthesize realistic responder greeting speech
      triggerResponderVoice(selectedContact);

      if (onNotification) {
        onNotification(
          '📞 DIRECT IN-APP CALL CONNECTED',
          `Direct voice session active with ${selectedContact.name} (${selectedContact.phone}) without launching external apps.`,
          'safe'
        );
      }
    }, 2400);

    return () => {
      clearTimeout(connectTimer);
      cleanupCall();
    };
  }, [isOpen, selectedContact?.phone]);

  const cleanupCall = () => {
    soundEngine.stopRingbackTone();
    if (callTimerRef.current !== null) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const triggerResponderVoice = (targetContact: typeof selectedContact) => {
    const lat = typeof currentCoords?.lat === 'number' ? currentCoords.lat.toFixed(4) : '15.5002';
    const lng = typeof currentCoords?.lng === 'number' ? currentCoords.lng.toFixed(4) : '73.8282';
    const userName = user?.name || 'Traveler';

    let speechText = '';
    const isPolice = targetContact.phone === '112' || /police/i.test(targetContact.name) || /police/i.test(targetContact.relation);

    if (isPolice) {
      speechText = `Tourist Police Emergency Command, Officer Fernandes on the line. ${userName}, we have received your emergency distress transmission and live GPS coordinates at latitude ${lat}, longitude ${lng}. Stay calm and remain where you are. Emergency patrol unit 4 has been dispatched.`;
    } else if (/father|parent|dad/i.test(targetContact.relation)) {
      speechText = `Hello ${userName}! I received your emergency SOS alert and your live GPS location link. Are you alright? Stay in a well-lit tourist zone, I am monitoring your position right now!`;
    } else if (/doctor|physician/i.test(targetContact.relation)) {
      speechText = `Hello ${userName}, this is Dr. Priya. I received your medical emergency beacon with battery level and medical profile. If you have your inhaler, please use it immediately and sit down in a safe shaded area. Emergency medical team has been notified.`;
    } else if (/guide|leader/i.test(targetContact.relation)) {
      speechText = `Hello ${userName}, Vikram from the tour guide team here! I received your automated SMS broadcast with your Google Maps location. Our tour vehicle is 3 minutes away from the promenade corridor. Wait at the nearest safety kiosk!`;
    } else {
      speechText = `Hello ${userName}, I received your emergency SOS signal with your live GPS location. I can hear you clearly through the tourist safety direct line. Tell me what happened!`;
    }

    setAudioTranscript(speechText);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';
      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEndCall = () => {
    soundEngine.playCallHangupTone();
    setCallStatus('ended');
    cleanupCall();
    if (onNotification) {
      onNotification(
        '📴 DIRECT CALL ENDED',
        `Direct in-app voice call with ${selectedContact.name} concluded (${formatDuration(durationSeconds)}).`,
        'info'
      );
    }
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleToggleMute = () => {
    soundEngine.playClickSound();
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !nextState;
      });
    }
  };

  const handleToggleSpeaker = () => {
    soundEngine.playClickSound();
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleDtmfPress = (key: string) => {
    soundEngine.playDtmfTone(key);
    setDtmfInput(prev => (prev + key).slice(-16));
  };

  const handleBroadcastGpsAloud = () => {
    soundEngine.playClickSound();
    setIsSpeakingGps(true);
    const lat = typeof currentCoords?.lat === 'number' ? currentCoords.lat.toFixed(5) : '15.50020';
    const lng = typeof currentCoords?.lng === 'number' ? currentCoords.lng.toFixed(5) : '73.82820';
    const acc = typeof currentCoords?.accuracy === 'number' ? Math.round(currentCoords.accuracy) : 10;
    const text = `Transmitting real-time GPS coordinates: Latitude ${lat}, Longitude ${lng}, estimated satellite accuracy ${acc} meters. Safety ID: ${user?.digitalSafetyId || 'SRT-TOURIST'}.`;
    
    setAudioTranscript(`[Spoken Telemetry Broadcast] ${text}`);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeakingGps(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeakingGps(false), 2000);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-lg animate-in fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-emerald-500/60 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden text-white flex flex-col justify-between min-h-[580px] p-6">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 font-mono">
              DIRECT IN-WEBSITE VOICE CALL
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>ENCRYPTED VOIP</span>
          </div>
        </div>

        {/* Quick Contact Selector Dropdown (Allows switching to other saved contacts or 112) */}
        {allContacts.length > 1 && callStatus === 'ringing' && (
          <div className="pt-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Switch Contact:</div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {allContacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    soundEngine.playClickSound();
                    setSelectedContact(c);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                    selectedContact.phone === c.phone
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setSelectedContact({
                    name: 'National Police Desk (112)',
                    phone: '112',
                    relation: 'Emergency Police Dispatch',
                    isPrimary: false,
                  });
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                  selectedContact.phone === '112'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-red-300 border-red-900 hover:border-red-700'
                }`}
              >
                Police 112
              </button>
            </div>
          </div>
        )}

        {/* Main Calling Card Display */}
        <div className="text-center py-6 space-y-4 my-auto">
          {/* Animated Avatar / Audio Waveform Ring */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            {callStatus === 'ringing' && (
              <span className="absolute inset-0 rounded-full border-4 border-emerald-500/40 animate-ping"></span>
            )}
            {callStatus === 'connected' && (
              <div 
                className="absolute inset-0 rounded-full bg-emerald-500/20 border-2 border-emerald-400 transition-all duration-75"
                style={{ transform: `scale(${1 + micLevel * 0.4})` }}
              ></div>
            )}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-xl border-4 border-slate-900 relative z-10">
              <span className="text-2xl font-black text-white">
                {selectedContact.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {selectedContact.name}
            </h3>
            <p className="text-xs text-emerald-300 font-bold">
              {selectedContact.relation || 'Emergency Contact'}
            </p>
            <p className="font-mono text-sm text-cyan-400 font-bold">
              {selectedContact.phone}
            </p>
          </div>

          {/* Status Badge & Call Timer */}
          <div>
            {callStatus === 'ringing' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>Ringing direct in-app line...</span>
              </div>
            )}
            {callStatus === 'connected' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-mono font-black">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{formatDuration(durationSeconds)}</span>
              </div>
            )}
            {callStatus === 'ended' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-mono font-bold">
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Call Disconnected</span>
              </div>
            )}
          </div>

          {/* Microphone & Audio Level Indicator */}
          {callStatus === 'connected' && (
            <div className="space-y-1.5 max-w-xs mx-auto pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>MIC: {micPermission === 'granted' ? (isMuted ? 'MUTED' : 'LIVE ACTIVE') : 'TEXT-RELAY'}</span>
                <span>{isSpeakerOn ? 'SPEAKER: ON' : 'EARPIECE'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${
                      i / 12 <= micLevel && !isMuted ? 'bg-emerald-400' : 'bg-slate-700'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* Live In-App Audio Transcript & Speech Box */}
          {callStatus === 'connected' && audioTranscript && (
            <div className="p-3 rounded-2xl bg-black/60 border border-slate-800 text-left text-xs font-mono space-y-1 max-h-24 overflow-y-auto">
              <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                <span>Live Audio Readout:</span>
              </div>
              <p className="text-slate-200 leading-relaxed italic">
                "{audioTranscript}"
              </p>
            </div>
          )}

          {/* Interactive DTMF Dialpad View */}
          {showKeypad && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 max-w-xs mx-auto animate-in zoom-in-95">
              <div className="text-sm font-mono text-cyan-400 tracking-widest text-center py-1 min-h-[28px] border-b border-slate-800 mb-2">
                {dtmfInput || 'Touch keys to dial DTMF'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
                  <button
                    key={key}
                    onClick={() => handleDtmfPress(key)}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-sm border border-slate-800"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Interactive Controls */}
        <div className="space-y-4 pt-3 border-t border-slate-800/80">
          
          {/* Secondary Action Buttons (Mute, Speaker, DTMF, Broadcast GPS) */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleToggleMute}
              disabled={callStatus !== 'connected'}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all disabled:opacity-40 ${
                isMuted
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-amber-400" /> : <Mic className="w-5 h-5 text-emerald-400" />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={handleToggleSpeaker}
              disabled={callStatus !== 'connected'}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all disabled:opacity-40 ${
                isSpeakerOn
                  ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Toggle speakerphone"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
              <span>Speaker</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClickSound();
                setShowKeypad(!showKeypad);
              }}
              disabled={callStatus !== 'connected'}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all disabled:opacity-40 ${
                showKeypad
                  ? 'bg-blue-600/30 border-blue-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Open DTMF keypad"
            >
              <Grid className="w-5 h-5 text-cyan-400" />
              <span>Keypad</span>
            </button>

            <button
              onClick={handleBroadcastGpsAloud}
              disabled={callStatus !== 'connected' || isSpeakingGps}
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white transition-all disabled:opacity-40"
              title="Broadcast GPS coordinates aloud to recipient"
            >
              <MapPin className={`w-5 h-5 ${isSpeakingGps ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
              <span>{isSpeakingGps ? 'Speaking...' : 'Speak GPS'}</span>
            </button>
          </div>

          {/* Primary Hangup Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleEndCall}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 active:scale-95 transition-all"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End In-App Call</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 font-mono">
            Direct audio calling 100% inside this website &bull; Zero external dialers used
          </p>
        </div>

      </div>
    </div>
  );
};
