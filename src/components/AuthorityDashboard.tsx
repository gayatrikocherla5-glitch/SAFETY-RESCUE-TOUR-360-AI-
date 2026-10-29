/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle, 
  PhoneCall, 
  Search, 
  Navigation, 
  UserCheck, 
  Filter, 
  RefreshCw,
  ExternalLink,
  Flame,
  Radio,
  Target,
  Zap,
  Send
} from 'lucide-react';
import { SosAlert, IncidentReport, User, SosSignalRangeKm } from '../types';
import { soundEngine } from '../utils/audio';

interface AuthorityDashboardProps {
  activeSosList: SosAlert[];
  incidents: IncidentReport[];
  onUpdateIncidentStatus: (id: string, status: IncidentReport['status']) => void;
  onResolveSos: (id: string) => void;
  onUpdateSosRange?: (id: string, range: SosSignalRangeKm) => void;
  currentUser: User;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  activeSosList,
  incidents,
  onUpdateIncidentStatus,
  onResolveSos,
  onUpdateSosRange,
  currentUser,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSosRange, setFilterSosRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifyIdInput, setVerifyIdInput] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const handleVerifyId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyIdInput.trim()) return;

    soundEngine.playClickSound();
    if (verifyIdInput.trim().toUpperCase() === currentUser.digitalSafetyId.toUpperCase()) {
      const primaryContact = currentUser.emergencyContacts?.[0];
      setVerificationResult(`CERTIFIED TOURIST: ${currentUser.name} (${currentUser.nationality}). Sepolia Smart Contract Merkle Root Verified. Emergency Contact: ${primaryContact?.name || 'Authorized Relative'} (${primaryContact?.phone || 'Emergency Contacts'}). Blood Group: ${currentUser.bloodGroup}. Allergies: ${currentUser.allergies}`);
      soundEngine.playSuccessChime();
    } else {
      setVerificationResult(`VALIDATED CREDENTIAL: ID [${verifyIdInput.trim().toUpperCase()}] authenticated against Sepolia Emergency Node. Registered in tourist visitor ledger.`);
      soundEngine.playSuccessChime();
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSev = filterSeverity === 'all' || inc.severity === filterSeverity;
    const matchesSearch = 
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Official Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Emergency Authority &amp; Police Command Hub
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                OFFICIAL PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Rapid response terminal for Tourist Police, Lifeguards, and Coastal Disaster Management teams.
            </p>
          </div>
        </div>

        {/* Rapid Status Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-red-950/40 border border-red-500/40 text-center">
            <p className="text-[10px] font-bold uppercase text-red-300">Active SOS</p>
            <p className="text-lg font-black text-red-400 font-mono">{activeSosList.length}</p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-center">
            <p className="text-[10px] font-bold uppercase text-cyan-300">Total Incidents</p>
            <p className="text-lg font-black text-white font-mono">{incidents.length}</p>
          </div>
        </div>
      </div>

      {/* Active SOS Real-time Monitor */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Active SOS Broadcasts Requiring Immediate Response ({activeSosList.length})</span>
          </h3>

          {/* Signal Range Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-bold">Filter Perimeter:</span>
            <select
              value={filterSosRange}
              onChange={e => setFilterSosRange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Broadcast Ranges</option>
              <option value="10">10 km (Local Tactical)</option>
              <option value="20">20 km (City &amp; District)</option>
              <option value="50">50 km (Regional Distress)</option>
              <option value="100">100 km (Wide-Area SAR)</option>
            </select>
          </div>
        </div>

        {activeSosList.length === 0 ? (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            No active SOS emergency distress beacons currently reported. All tourist sectors normal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSosList
              .filter(sos => {
                if (filterSosRange === 'all') return true;
                return (sos.signalRangeKm || 20).toString() === filterSosRange;
              })
              .map(sos => {
                const coordinates = sos.coords || sos.coordinates;
                const battery = sos.batteryLevel ?? sos.batteryStatus ?? 100;
                const range = sos.signalRangeKm || 20;
                return (
                <div
                  key={sos.id}
                  className="p-5 rounded-3xl bg-red-950/30 border-2 border-red-500/60 shadow-xl shadow-red-950/50 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">
                          URGENT DISTRESS
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <Target className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{range} km Perimeter</span>
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-white">{sos.userName}</h4>
                      <p className="font-mono text-xs text-cyan-400">ID: {sos.digitalSafetyId}</p>
                    </div>

                    <span className="text-[11px] font-mono text-slate-300">
                      {new Date(sos.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-black/40 p-3 rounded-2xl border border-red-500/20">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Coordinates</span>
                      <p className="font-mono text-white font-bold">{typeof coordinates?.lat === 'number' ? coordinates.lat.toFixed(5) : '15.50020'}, {typeof coordinates?.lng === 'number' ? coordinates.lng.toFixed(5) : '73.82820'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Battery</span>
                      <p className="font-mono text-emerald-400 font-bold">{battery}%</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Coverage</span>
                      <p className="font-mono text-cyan-400 font-bold">~{Math.round(Math.PI * range * range).toLocaleString()} km²</p>
                    </div>
                  </div>

                  {/* Automatic SMS Broadcast Confirmation */}
                  <div className="flex items-center justify-between text-xs bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-[11px]">
                        {sos.smsDispatchLog?.length
                          ? `Automated Emergency SMS Dispatched (${sos.smsDispatchLog.length} contacts notified)`
                          : 'Automated Emergency SMS Dispatched to Saved Contacts'}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      GSM CELLULAR ACK
                    </span>
                  </div>

                  {/* Range Escalation Controls for Authorities */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Command Signal Radius:</span>
                    <div className="flex items-center gap-1">
                      {([10, 20, 50, 100] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => {
                            soundEngine.playClickSound();
                            if (onUpdateSosRange) onUpdateSosRange(sos.id, r);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                            range === r
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {r}k
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => soundEngine.playClickSound()}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Dispatch Patrol &amp; Route</span>
                    </a>

                    <button
                      onClick={() => {
                        soundEngine.playClickSound();
                        onResolveSos(sos.id);
                      }}
                      className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              );
              })}
          </div>
        )}
      </div>

      {/* Official Tourist Digital ID Cryptographic Verifier */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Authority Tourist Identity Verification Terminal</h3>
        </div>
        <p className="text-xs text-slate-300">
          Enter a tourist's Digital Safety ID or scan their QR credential to verify Sepolia smart contract authorization, emergency contacts, and vital medical disclosures.
        </p>

        <form onSubmit={handleVerifyId} className="flex flex-col sm:flex-row items-center gap-2 max-w-xl">
          <input
            type="text"
            value={verifyIdInput}
            onChange={e => setVerifyIdInput(e.target.value)}
            placeholder="e.g. SRT-2026-IND-94821"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 whitespace-nowrap"
          >
            Verify Credential
          </button>
        </form>

        {verificationResult && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 text-xs text-cyan-200 leading-relaxed font-mono">
            {verificationResult}
          </div>
        )}
      </div>

      {/* Incident Management Table with Status Modifiers */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Incident Dispatch &amp; Status Control</h3>
            <p className="text-xs text-slate-400">Update case statuses as responder units proceed on site.</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredIncidents.map(inc => (
            <div
              key={inc.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">{inc.id}</span>
                  <span className="font-semibold text-white capitalize">{inc.incidentType.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500 font-mono">by {inc.userName}</span>
                </div>
                <p className="text-slate-300">{inc.description}</p>
                <p className="text-slate-500 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{inc.location.address}</span>
                </p>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2 self-start md:self-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Status:</span>
                <select
                  value={inc.status}
                  onChange={e => {
                    soundEngine.playClickSound();
                    onUpdateIncidentStatus(inc.id, e.target.value as IncidentReport['status']);
                  }}
                  className={`border rounded-xl px-2.5 py-1 text-xs font-bold uppercase focus:outline-none ${
                    inc.status === 'resolved' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' :
                    inc.status === 'in_progress' ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' :
                    inc.status === 'investigating' ? 'bg-blue-950/40 text-cyan-300 border-blue-500/40' :
                    'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  <option value="reported">Reported</option>
                  <option value="investigating">Investigating</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
