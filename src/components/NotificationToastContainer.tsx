/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
  X, 
  Info,
  ArrowRight,
  HardHat,
  Compass
} from 'lucide-react';
import { SafetyNotification } from '../types';

interface NotificationToastContainerProps {
  toasts: SafetyNotification[];
  onDismiss: (id: string) => void;
  onSelectTab?: (tab: string) => void;
}

interface ToastCardProps {
  toast: SafetyNotification;
  onDismiss: (id: string) => void;
  onSelectTab?: (tab: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss, onSelectTab }) => {
  // Auto-dismiss each toast individually after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const rawTitle = typeof toast.title === 'string' ? toast.title : '';
  const titleLower = rawTitle.toLowerCase();

  const isSms = toast.type === 'sms' || titleLower.includes('sms');
  const isSafe = toast.type === 'safe' || titleLower.includes('safety zone');
  const isConstruction = toast.type === 'construction' || titleLower.includes('construction');
  const isDanger = toast.type === 'emergency' || titleLower.includes('danger zone');
  const isWarning = toast.type === 'warning';

  let timeString = '';
  try {
    if (typeof toast.timestamp === 'number' && !isNaN(toast.timestamp)) {
      timeString = new Date(toast.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    }
  } catch {
    timeString = '';
  }

  return (
    <div
      className={`pointer-events-auto rounded-2xl border-2 p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-4 fade-in ${
        isSms
          ? 'bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 border-cyan-400 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/40'
          : isDanger
          ? 'bg-gradient-to-r from-slate-950 via-red-950 to-slate-950 border-red-500 text-white shadow-red-600/40 ring-2 ring-red-500/50'
          : isConstruction
          ? 'bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 border-amber-400 text-amber-50 shadow-amber-500/30 ring-2 ring-amber-400/40'
          : isSafe
          ? 'bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 border-emerald-400 text-emerald-50 shadow-emerald-500/30 ring-2 ring-emerald-400/40'
          : isWarning
          ? 'bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 border-yellow-500 text-yellow-100 shadow-yellow-500/20'
          : 'bg-slate-900/95 border-blue-500/50 text-slate-100 shadow-blue-500/20'
      }`}
    >
      {/* Top Bar with Badge, Time, and Close */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Icon Circle */}
          <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
            isSms
              ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/60 animate-pulse'
              : isDanger
              ? 'bg-red-600 text-white animate-bounce'
              : isConstruction
              ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/60'
              : isSafe
              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/60'
              : 'bg-blue-600/20 text-cyan-400'
          }`}>
            {isSms ? (
              <MessageSquare className="w-5 h-5 text-cyan-300" />
            ) : isDanger ? (
              <ShieldAlert className="w-5 h-5 text-white" />
            ) : isConstruction ? (
              <HardHat className="w-5 h-5 text-amber-400" />
            ) : isSafe ? (
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            ) : (
              <Info className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                isSms
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                  : isDanger
                  ? 'bg-red-600 text-white font-mono'
                  : isConstruction
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                  : isSafe
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                  : 'bg-blue-500/30 text-blue-200'
              }`}>
                {isSms 
                  ? '📱 AUTOMATIC SMS DISPATCHED' 
                  : isDanger 
                  ? '🔴 RESTRICTED DANGER ZONE' 
                  : isConstruction 
                  ? '🚧 CONSTRUCTION ZONE ACTIVE' 
                  : isSafe 
                  ? '🟢 SAFETY ZONE ENTERED' 
                  : 'ℹ️ SAFETY NOTICE'}
              </span>
              {timeString && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {timeString}
                </span>
              )}
            </div>
            <h4 className="font-black text-sm text-white tracking-tight mt-0.5">
              {rawTitle || 'Safety Notification'}
            </h4>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Body */}
      {toast.message && (
        <p className="text-xs text-slate-200 mt-2 leading-relaxed pl-11">
          {toast.message}
        </p>
      )}

      {/* Quick Action Footer */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs pl-11">
        <span className="text-[10px] text-slate-400 font-mono">
          {isSms ? 'Cellular / Satellite Dispatch Confirmed' : 'Geo-Fence Monitor Active'}
        </span>

        <div className="flex items-center gap-2">
          {isSms && onSelectTab && (
            <button
              onClick={() => {
                onDismiss(toast.id);
                onSelectTab('contacts');
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-[11px] font-bold border border-cyan-400/40 flex items-center gap-1 transition-all"
            >
              <span>View Contacts Hub</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {(isSafe || isConstruction || isDanger) && onSelectTab && (
            <button
              onClick={() => {
                onDismiss(toast.id);
                onSelectTab('map');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                isDanger
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-sm'
                  : isConstruction
                  ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border-amber-400/40'
                  : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border-emerald-400/40'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>View on Map</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  toasts,
  onDismiss,
  onSelectTab,
}) => {
  const safeToasts = Array.isArray(toasts) ? toasts : [];
  const displayToasts = safeToasts.slice(0, 3);

  if (displayToasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-3 space-y-2.5 pointer-events-none transition-all"
      role="region"
      aria-label="Safety Notifications"
    >
      {displayToasts.map(toast => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onSelectTab={onSelectTab}
        />
      ))}
    </div>
  );
};
