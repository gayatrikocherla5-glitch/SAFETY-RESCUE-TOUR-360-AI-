/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Globe, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  ShieldAlert, 
  User as UserIcon, 
  Bell, 
  Menu, 
  X,
  Compass,
  CheckCircle2,
  Building,
  ShieldCheck,
  ChevronDown,
  Zap,
  LayoutDashboard,
  Users,
  Send
} from 'lucide-react';
import { LanguageCode, User } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../utils/languages';
import { soundEngine } from '../utils/audio';
import { AppLogo } from './AppLogo';

interface NavbarProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  isRescueBattery: boolean;
  onToggleRescueBattery: () => void;
  user: User;
  onRoleChange: (role: User['role']) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadAlertsCount: number;
  onOpenNotifications: () => void;
  onTriggerSos: () => void;
  onOpenDirectSms?: () => void;
  isLandingVisible?: boolean;
  onToggleLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  isOffline,
  onToggleOffline,
  isRescueBattery,
  onToggleRescueBattery,
  user,
  onRoleChange,
  activeTab,
  onSelectTab,
  unreadAlertsCount,
  onOpenNotifications,
  onTriggerSos,
  onOpenDirectSms,
  isLandingVisible = false,
  onToggleLanding,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleAudioToggle = () => {
    const nextState = !isMuted;
    soundEngine.setMuted(nextState);
    setIsMuted(nextState);
    if (!nextState) soundEngine.playClickSound();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'map', label: 'Interactive Map', icon: Globe },
    { id: 'checkin', label: 'Smart Check-In', icon: CheckCircle2 },
    { id: 'contacts', label: 'SOS Contacts', icon: Users, badge: 'Auto-SMS' },
    { id: 'digital_id', label: 'Digital ID', icon: ShieldCheck },
    { id: 'places', label: 'Safe Places', icon: Building },
    { id: 'ai', label: 'SAFETY AI', icon: ShieldAlert },
    { id: 'admin', label: 'Authority Desk', icon: ShieldCheck, badge: 'Official' },
  ];

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
      isRescueBattery 
        ? 'bg-black border-slate-800' 
        : 'bg-slate-950/85 border-slate-800/80 shadow-lg shadow-black/40'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Brand & Logo */}
          <div 
            onClick={() => {
              soundEngine.playClickSound();
              onSelectTab('dashboard');
            }}
            className="flex items-center cursor-pointer group shrink-0"
          >
            <AppLogo size={42} showText={true} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEngine.playClickSound();
                    onSelectTab(item.id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Tools & Top Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Working Model Switcher Button */}
            {onToggleLanding && (
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  onToggleLanding();
                }}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                  isLandingVisible
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-cyan-500/30 ring-1 ring-cyan-400/60 animate-pulse'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:text-white'
                }`}
                title={isLandingVisible ? 'Switch to Live Working System Model' : 'View Presentation & Official Emblem'}
              >
                {isLandingVisible ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span className="hidden sm:inline">LAUNCH</span>
                    <span>WORKING MODEL</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">EMBLEM &amp;</span>
                    <span>OVERVIEW</span>
                  </>
                )}
              </button>
            )}

            {/* Direct SMS Share Button in Header */}
            {onOpenDirectSms && (
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  onOpenDirectSms();
                }}
                className="bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 border border-emerald-400/40 transition-all"
                title="Share Emergency SMS directly to saved contacts with live Google Maps GPS link"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">SHARE</span>
                <span>SMS</span>
              </button>
            )}

            {/* Quick SOS Trigger Button in Header */}
            <button
              onClick={() => {
                soundEngine.playEmergencyAlarm();
                onTriggerSos();
              }}
              className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-600/30 animate-pulse border border-red-400/50"
              title="Activate Emergency SOS: Automatically sends distress SMS to saved contacts with live GPS"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span className="tracking-wide">SOS</span>
            </button>

            {/* Offline Simulator Switch */}
            <button
              onClick={() => {
                soundEngine.playClickSound();
                onToggleOffline();
              }}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                isOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900/80 text-emerald-400 border-emerald-500/30'
              }`}
              title={isOffline ? 'Offline Mode active (Click to go Online)' : 'Online Mode (Click to simulate Offline Mode)'}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline font-mono font-bold text-[11px]">OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline font-mono font-bold text-[11px]">ONLINE</span>
                </>
              )}
            </button>

            {/* Battery / Rescue Battery Mode */}
            <button
              onClick={() => {
                soundEngine.playClickSound();
                onToggleRescueBattery();
              }}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                isRescueBattery 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' 
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/60'
              }`}
              title={isRescueBattery ? 'Rescue Battery Mode Active: Extra power conserved' : 'Toggle Rescue Battery Mode'}
            >
              {isRescueBattery ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="font-mono font-bold text-[11px]">{user.batteryLevel}%</span>
            </button>

            {/* Audio Mute/Unmute toggle */}
            <button
              onClick={handleAudioToggle}
              className={`p-2 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-slate-900 text-slate-500 border-slate-800' 
                  : 'bg-slate-900/80 text-blue-400 border-blue-500/30'
              }`}
              title={isMuted ? 'Unmute tactical and alert sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {
                soundEngine.playClickSound();
                onOpenNotifications();
              }}
              className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Safety Notifications & Geo-fence Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Language Selector (Top-Right Corner as requested) */}
            <div className="relative">
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setIsLangMenuOpen(!isLangMenuOpen);
                  setIsProfileMenuOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/40 text-cyan-300 hover:border-cyan-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[70px] truncate">{currentLangInfo.nativeName}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-xl">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Select Language ({SUPPORTED_LANGUAGES.length})
                  </div>
                  <div className="py-1 space-y-0.5">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          soundEngine.playClickSound();
                          onLanguageChange(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          lang.code === currentLanguage
                            ? 'bg-blue-600/30 text-cyan-300 font-bold border border-blue-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{lang.nativeName}</span>
                          <span className="text-[10px] text-slate-400">{lang.name}</span>
                        </div>
                        {lang.code === currentLanguage && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile & Role switcher button */}
            <div className="relative">
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsLangMenuOpen(false);
                }}
                className="p-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-slate-600 flex items-center gap-1.5"
                title="User Profile & Role Switcher"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
                  GK
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-xl">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
                      GK
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] font-mono text-cyan-400 truncate">{user.digitalSafetyId}</p>
                    </div>
                  </div>

                  {/* Role Switcher */}
                  <div className="pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Switch Role Mode:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          onRoleChange('tourist');
                          setIsProfileMenuOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center border ${
                          user.role === 'tourist' 
                            ? 'bg-blue-600/30 text-cyan-300 border-blue-500/40' 
                            : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                        }`}
                      >
                        Tourist
                      </button>
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          onRoleChange('admin');
                          onSelectTab('admin');
                          setIsProfileMenuOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center border ${
                          user.role === 'admin' 
                            ? 'bg-red-600/30 text-red-300 border-red-500/40' 
                            : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                        }`}
                      >
                        Authority
                      </button>
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          onRoleChange('hotel');
                          onSelectTab('hotel_portal');
                          setIsProfileMenuOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center border ${
                          user.role === 'hotel' 
                            ? 'bg-amber-600/30 text-amber-300 border-amber-500/40' 
                            : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                        }`}
                      >
                        Hotel Desk
                      </button>
                      <button
                        onClick={() => {
                          soundEngine.playClickSound();
                          onSelectTab('profile');
                          setIsProfileMenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center bg-slate-800 text-slate-400 hover:text-white border border-transparent"
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Nav Hamburger */}
            <button
              onClick={() => {
                soundEngine.playClickSound();
                setIsMobileNavOpen(!isMobileNavOpen);
              }}
              className="xl:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileNavOpen && (
        <div className="xl:hidden bg-slate-950/95 border-b border-slate-800 px-4 py-3 space-y-2">
          {onToggleLanding && (
            <button
              onClick={() => {
                soundEngine.playClickSound();
                onToggleLanding();
                setIsMobileNavOpen(false);
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                isLandingVisible
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
              }`}
            >
              {isLandingVisible ? (
                <>
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>LAUNCH LIVE WORKING MODEL</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>VIEW EMBLEM &amp; OVERVIEW</span>
                </>
              )}
            </button>
          )}

          {onOpenDirectSms && (
            <button
              onClick={() => {
                soundEngine.playClickSound();
                onOpenDirectSms();
                setIsMobileNavOpen(false);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 transition-all border border-emerald-400/40"
            >
              <Send className="w-4 h-4 text-white" />
              <span>SHARE SMS DIRECTLY TO CONTACTS</span>
            </button>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundEngine.playClickSound();
                  onSelectTab(item.id);
                  setIsMobileNavOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
