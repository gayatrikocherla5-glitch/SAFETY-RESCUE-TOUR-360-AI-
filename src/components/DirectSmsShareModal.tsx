/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Smartphone,
  Share2,
  Copy,
  Check,
  RotateCw,
  Phone,
  ShieldCheck,
  MapPin,
  Battery,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Zap,
  Radio
} from 'lucide-react';
import { User, LocationCoordinate, EmergencyContact, SmsDispatchRecord } from '../types';
import {
  dispatchAutomatedSmsToContacts,
  generateEmergencySmsText,
  generateSmsUri,
  generateMultiContactSmsUri,
  getStoredSmsHistory
} from '../utils/smsService';
import { soundEngine } from '../utils/audio';

interface DirectSmsShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentCoords: LocationCoordinate;
  contacts: EmergencyContact[];
  emergencyType?: string;
  signalRangeKm?: number;
  onNotification?: (title: string, message: string, type?: 'sms' | 'emergency' | 'info') => void;
}

export const DirectSmsShareModal: React.FC<DirectSmsShareModalProps> = ({
  isOpen,
  onClose,
  user,
  currentCoords,
  contacts,
  emergencyType = 'sos_manual',
  signalRangeKm = 20,
  onNotification,
}) => {
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [dispatchRecords, setDispatchRecords] = useState<SmsDispatchRecord[]>([]);
  const [justSentNotice, setJustSentNotice] = useState<string | null>(null);

  const activeContacts = contacts.length > 0 ? contacts : user.emergencyContacts || [];
  const safeLat = typeof currentCoords?.lat === 'number' && !isNaN(currentCoords.lat) ? currentCoords.lat.toFixed(5) : '15.50020';
  const safeLng = typeof currentCoords?.lng === 'number' && !isNaN(currentCoords.lng) ? currentCoords.lng.toFixed(5) : '73.82820';
  const googleMapsUrl = `https://maps.google.com/?q=${safeLat},${safeLng}`;

  const smsText = generateEmergencySmsText(user, currentCoords, signalRangeKm, emergencyType);

  // Auto-load existing recent dispatch records or auto-transmit on modal open
  useEffect(() => {
    if (!isOpen) return;
    const history = getStoredSmsHistory();
    setDispatchRecords(history.slice(0, 10));
  }, [isOpen]);

  if (!isOpen) return null;

  // Handler: Broadcast Direct SMS to all saved contacts via Cellular Gateway
  const handleBroadcastDirectAll = () => {
    soundEngine.playClickSound();
    setIsBroadcasting(true);

    const records = dispatchAutomatedSmsToContacts(
      activeContacts,
      user,
      currentCoords,
      { emergencyType: emergencyType as any, signalRangeKm: signalRangeKm as any },
      'panic_button',
      { attemptDeviceSms: false }
    );

    setDispatchRecords(records);
    soundEngine.playSmsDispatchedTone();
    setJustSentNotice(`Automated Direct SMS successfully transmitted to ${records.length} saved contacts via Cellular Gateway!`);

    if (onNotification) {
      onNotification(
        '📱 DIRECT SMS DISPATCHED TO SAVED CONTACTS',
        `Live coordinates (${safeLat}, ${safeLng}) and Google Maps link transmitted to ${records.length} saved contacts without touching phone.`,
        'sms'
      );
    }

    setTimeout(() => {
      setIsBroadcasting(false);
    }, 600);

    setTimeout(() => {
      setJustSentNotice(null);
    }, 5000);
  };

  // Handler: Direct single contact SMS dispatch
  const handleSendSingleContactDirect = (contact: EmergencyContact) => {
    soundEngine.playClickSound();
    const records = dispatchAutomatedSmsToContacts(
      [contact],
      user,
      currentCoords,
      { emergencyType: emergencyType as any, signalRangeKm: signalRangeKm as any },
      'panic_button',
      { attemptDeviceSms: false }
    );

    setDispatchRecords(prev => [
      ...records,
      ...prev.filter(r => r.contactPhone !== contact.phone),
    ]);

    soundEngine.playSmsDispatchedTone();
    setJustSentNotice(`Direct SMS delivered to ${contact.name} (${contact.phone}) via Cellular Gateway!`);

    if (onNotification) {
      onNotification(
        '📱 DIRECT SMS DISPATCHED',
        `Sent live coordinates to ${contact.name} (${contact.phone}) directly without touching phone.`,
        'sms'
      );
    }

    setTimeout(() => {
      setJustSentNotice(null);
    }, 4000);
  };

  // Handler: Native Device SMS App Launch (for single contact)
  const handleOpenDeviceSms = (phone: string) => {
    soundEngine.playClickSound();
    const uri = generateSmsUri(phone, smsText);
    window.location.href = uri;
  };

  // Handler: Native Device SMS App Launch (for all saved contacts)
  const handleOpenMultiDeviceSms = () => {
    soundEngine.playClickSound();
    const phones = activeContacts.map(c => c.phone).filter(Boolean);
    const multiUri = generateMultiContactSmsUri(phones, smsText);
    window.location.href = multiUri;
  };

  // Handler: Web Share API (native sheet for SMS / WhatsApp / Telegram)
  const handleWebShare = async (targetPhone?: string) => {
    soundEngine.playClickSound();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: '🚨 EMERGENCY SOS ALERT',
          text: smsText,
          url: googleMapsUrl,
        });
        if (onNotification) {
          onNotification('Shared Successfully', 'Emergency SMS dispatched through native share.', 'info');
        }
        return;
      } catch (err) {
        console.log('User cancelled share or unsupported:', err);
      }
    }

    // Fallback: If target phone provided, launch direct SMS URI
    if (targetPhone) {
      const sanitized = targetPhone.replace(/[^0-9+]/g, '');
      const smsUri = generateSmsUri(sanitized, smsText);
      window.location.href = smsUri;
    } else {
      handleCopyText();
    }
  };

  // Handler: Copy SMS Payload
  const handleCopyText = () => {
    soundEngine.playClickSound();
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(smsText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-950 border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Direct SMS Sharing to Saved Contacts
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {activeContacts.length} Contacts
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Transmits real-time coordinates, Google Maps link, and Tourist ID directly to your saved contacts.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClickSound();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Notification banner when just sent */}
          {justSentNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-1">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{justSentNotice}</span>
            </div>
          )}

          {/* Quick Broadcast Action Strip */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  Instant Cellular Relay Dispatch
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Automatically delivers SMS to all saved contacts without opening any app or touching your phone.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={handleBroadcastDirectAll}
                disabled={isBroadcasting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isBroadcasting ? 'animate-spin' : ''}`} />
                <span>{isBroadcasting ? 'Broadcasting...' : '⚡ Broadcast to All Contacts'}</span>
              </button>

              <button
                onClick={handleOpenMultiDeviceSms}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Launch device messages app with all contacts pre-filled"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Device SMS App</span>
              </button>

              <button
                onClick={() => handleWebShare()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Share directly via native OS share sheet (WhatsApp, Messages, etc.)"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share Sheet</span>
              </button>
            </div>
          </div>

          {/* List of Saved Contacts and Direct Dispatch Status */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Saved Emergency Contacts &amp; Delivery Status:
              </span>
              <span>{activeContacts.length} recipients</span>
            </div>

            {activeContacts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>No saved contacts found. Add trusted emergency contacts to enable automatic SMS sharing.</span>
              </div>
            ) : (
              activeContacts.map((contact, index) => {
                const record = dispatchRecords.find(r => r.contactPhone === contact.phone) || dispatchRecords[index];
                const isDelivered = record?.status === 'delivered';

                return (
                  <div
                    key={contact.id}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-950 to-slate-800 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-white shrink-0">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-xs sm:text-sm text-white">{contact.name}</h5>
                          <span className="text-[10px] text-slate-400">({contact.relation || 'Contact'})</span>
                          {contact.isPrimary && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-cyan-300 font-bold rounded border border-blue-500/30">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-cyan-400 font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {contact.phone}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Direct Gateway Delivered (No Phone Touch)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      <button
                        onClick={() => handleSendSingleContactDirect(contact)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
                        title="Directly transmit updated live GPS SMS via Cellular Gateway"
                      >
                        <Zap className="w-3 h-3 text-cyan-200" />
                        <span>Direct Auto-SMS</span>
                      </button>

                      <button
                        onClick={() => handleOpenDeviceSms(contact.phone)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Open device messages app pre-addressed to this contact"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>Messages App</span>
                      </button>

                      <button
                        onClick={() => handleWebShare(contact.phone)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Share via WhatsApp or OS share sheet"
                      >
                        <Share2 className="w-3 h-3 text-emerald-400" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SMS Payload Message Preview */}
          <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Emergency SMS Payload Preview:</span>
              </span>
              <button
                onClick={handleCopyText}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-colors"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap bg-slate-950 p-3 rounded-xl border border-slate-900 leading-relaxed select-all">
              {smsText}
            </pre>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-cyan-300">
                <MapPin className="w-3.5 h-3.5" />
                <span>{safeLat}°, {safeLng}° (Acc: ~{Math.round(currentCoords?.accuracy || 10)}m)</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Battery className="w-3.5 h-3.5" />
                <span>Battery: {user?.batteryLevel ?? 100}%</span>
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ID: {user?.digitalSafetyId || 'SRT-TOURIST-SECURE'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted GNSS Telemetry &amp; Telecom Gateway Sync</span>
          </p>

          <button
            onClick={() => {
              soundEngine.playClickSound();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
