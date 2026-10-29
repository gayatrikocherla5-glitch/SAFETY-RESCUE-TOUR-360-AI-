/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Compass, 
  MapPin, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  UserCheck, 
  CheckCircle2, 
  Activity, 
  ShieldCheck,
  Radio,
  FileCheck,
  Clock,
  Zap
} from 'lucide-react';
import { LanguageCode, User } from '../types';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../utils/languages';
import { soundEngine } from '../utils/audio';
import { AppLogo } from './AppLogo';

interface LandingHeroProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onGetStarted: () => void;
  onTriggerSos: () => void;
  onRegisterUser: (userData: Partial<User>) => void;
  onSelectModule?: (tab: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  currentLanguage,
  onLanguageChange,
  onGetStarted,
  onTriggerSos,
  onRegisterUser,
  onSelectModule,
}) => {
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regContactName, setRegContactName] = useState('');
  const [regContactPhone, setRegContactPhone] = useState('');

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClickSound();
    onRegisterUser({
      name: regName || 'Gayatri Kocherla',
      email: regEmail || 'gayatrikocherla5@gmail.com',
      phone: regPhone || '+91 98490 12345',
      emergencyContacts: [
        {
          id: 'c_new',
          name: regContactName || 'Ramesh Kocherla',
          relation: 'Parent / Primary Guardian',
          phone: regContactPhone || '+91 98490 67890',
          isPrimary: true,
          shareLiveLocation: true,
        },
      ],
    });
    setShowAuthModal(null);
    onGetStarted();
    soundEngine.playSuccessChime();
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 py-12 overflow-hidden">
      
      {/* Background Graphic Elements & Radar Waves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-cyan-500/15 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-blue-500/10 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        
        {/* Prominent Official Emblem Showcase */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <AppLogo size={148} showText={false} allowUpload={true} className="relative z-10 drop-shadow-2xl" />
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[11px] font-bold text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>OFFICIAL SAFETY &amp; SECURE TOUR 360° - AI EMBLEM</span>
          </div>
        </div>

        {/* App Title Prominently Displayed */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase leading-tight">
          SAFETY &amp; SECURE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
            TOUR 360° - AI
          </span>
        </h1>

        {/* Official Tagline as Requested */}
        <p className="text-base sm:text-xl font-medium text-slate-300 max-w-2xl mx-auto leading-relaxed">
          “Travel Safely. Stay Connected. Get Help When You Need It.”
        </p>

        {/* Key Feature Highlights Pill Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI GPS Geo-fencing</span>
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Context-Aware Auto SOS</span>
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sepolia Blockchain ID</span>
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>18 Regional Languages</span>
          </span>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
          
          {/* Emergency SOS Button */}
          <button
            onClick={() => {
              soundEngine.playEmergencyAlarm();
              onTriggerSos();
            }}
            className="px-8 py-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm sm:text-base tracking-wider uppercase flex items-center gap-2.5 shadow-2xl shadow-red-600/50 border border-red-400/50 active:scale-95 transition-all animate-pulse"
          >
            <ShieldAlert className="w-5 h-5 text-white" />
            <span>EMERGENCY SOS</span>
          </button>

          {/* Launch Live Working Model Button */}
          <button
            onClick={() => {
              soundEngine.playClickSound();
              onGetStarted();
            }}
            className="px-8 py-4 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-2xl shadow-cyan-500/30 border border-cyan-300/50 active:scale-95 transition-all group"
          >
            <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
            <span>Launch Live Working Model</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Login / Register Row */}
        <div className="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setShowAuthModal('login');
            }}
            className="text-slate-300 hover:text-white hover:underline flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Login with ID / Email</span>
          </button>
          <span>&bull;</span>
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setShowAuthModal('register');
            }}
            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Create Digital Safety ID</span>
          </button>
        </div>

        {/* Interactive Live Modules Grid */}
        <div className="pt-10 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Interactive System Modules (Click to Test)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Click any core module to explore the live working model directly:</p>
            </div>
            <button
              onClick={() => {
                soundEngine.playClickSound();
                onGetStarted();
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>Full System View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
            {/* Map */}
            <div 
              onClick={() => {
                soundEngine.playClickSound();
                if (onSelectModule) onSelectModule('map');
                else onGetStarted();
              }}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-1.5 font-bold text-sm">
                <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>1. Live Geo-fence Map</span>
              </div>
              <p className="text-xs text-slate-400">Interactive GPS satellite map with 24/7 tourist corridors, safe havens, and danger zones.</p>
            </div>

            {/* Smart Check-In */}
            <div 
              onClick={() => {
                soundEngine.playClickSound();
                if (onSelectModule) onSelectModule('checkin');
                else onGetStarted();
              }}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5 font-bold text-sm">
                <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>2. Smart Journey Check-In</span>
              </div>
              <p className="text-xs text-slate-400">Solo traveler timer with "I'm Safe" verification and automatic distress escalation.</p>
            </div>

            {/* Digital ID */}
            <div 
              onClick={() => {
                soundEngine.playClickSound();
                if (onSelectModule) onSelectModule('digital_id');
                else onGetStarted();
              }}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2 text-blue-400 mb-1.5 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>3. Sepolia Digital ID Pass</span>
              </div>
              <p className="text-xs text-slate-400">Verifiable cryptographic ID with instant QR verification and medical vitals.</p>
            </div>

            {/* SAFETY AI */}
            <div 
              onClick={() => {
                soundEngine.playClickSound();
                if (onSelectModule) onSelectModule('ai');
                else onGetStarted();
              }}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2 text-indigo-400 mb-1.5 font-bold text-sm">
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>4. SAFETY AI Voice &amp; Chat</span>
              </div>
              <p className="text-xs text-slate-400">24/7 AI tourist safety assistant with real-time translation and voice synthesis.</p>
            </div>

            {/* Authority Desk */}
            <div 
              onClick={() => {
                soundEngine.playClickSound();
                if (onSelectModule) onSelectModule('admin');
                else onGetStarted();
              }}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2 text-amber-400 mb-1.5 font-bold text-sm">
                <Radio className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>5. Police &amp; Authority Hub</span>
              </div>
              <p className="text-xs text-slate-400">Official dispatch terminal for tourist police, lifeguards, and incident response.</p>
            </div>

            {/* Safe Places */}
            <div 
              onClick={() => {
                soundEngine.playClickSound();
                if (onSelectModule) onSelectModule('places');
                else onGetStarted();
              }}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2 text-teal-400 mb-1.5 font-bold text-sm">
                <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>6. Safe Havens &amp; 112 Help</span>
              </div>
              <p className="text-xs text-slate-400">Nearest hospitals, verified safe hotels, and immediate 1-tap emergency dialers.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Auth Modal: Register / Login */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">
                {showAuthModal === 'register' ? 'Register Digital Safety ID' : 'Sign In to SAFETY & RESCUE'}
              </h3>
              <button
                onClick={() => setShowAuthModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Gayatri Kocherla"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="traveler@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+91 98490 12345"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {showAuthModal === 'register' && (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    Emergency Contact Setup
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={regContactName}
                        onChange={e => setRegContactName(e.target.value)}
                        placeholder="Ramesh Kocherla"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={regContactPhone}
                        onChange={e => setRegContactPhone(e.target.value)}
                        placeholder="+91 98490 67890"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{showAuthModal === 'register' ? 'Mint Digital Safety ID & Continue' : 'Sign In'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
