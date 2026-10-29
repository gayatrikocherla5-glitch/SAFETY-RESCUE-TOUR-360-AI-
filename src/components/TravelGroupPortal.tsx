/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Battery, 
  PhoneCall, 
  Hotel, 
  ShieldCheck, 
  Compass, 
  Share2, 
  QrCode,
  ArrowRight
} from 'lucide-react';
import { TravelGroup, User, LocationCoordinate } from '../types';
import { soundEngine } from '../utils/audio';

interface TravelGroupPortalProps {
  group: TravelGroup;
  user: User;
  userCoords: LocationCoordinate;
  onJoinGroup: (code: string) => void;
  onSetSafePoint: (name: string, lat: number, lng: number) => void;
}

export const TravelGroupPortal: React.FC<TravelGroupPortalProps> = ({
  group,
  user,
  userCoords,
  onJoinGroup,
  onSetSafePoint,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [hotelSafePoint, setHotelSafePoint] = useState(user.savedHotelSafePoint || {
    name: 'Grand Horizon Beach Resort & Suites',
    lat: 15.4989,
    lng: 73.8278,
    address: 'Seaside Boulevard, North Shore Enclave, Goa',
  });
  const [hasVerifiedReturn, setHasVerifiedReturn] = useState<boolean>(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    soundEngine.playClickSound();
    onJoinGroup(joinCodeInput.trim());
    soundEngine.playSuccessChime();
    setJoinCodeInput('');
  };

  const handleVerifySafeReturn = () => {
    soundEngine.playClickSound();
    soundEngine.playSuccessChime();
    setHasVerifiedReturn(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Hotel className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Hotel &amp; Travel Group Safety Ecosystem
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Boost tourist confidence and safety with hotel muster points, guided group tracking, and automated safe return confirmations.
          </p>
        </div>

        {/* Join Group Form */}
        <form onSubmit={handleJoin} className="flex items-center gap-2 self-start">
          <input
            type="text"
            value={joinCodeInput}
            onChange={e => setJoinCodeInput(e.target.value)}
            placeholder="Enter Join Code (e.g. TOUR-GOA)"
            className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 whitespace-nowrap"
          >
            Join Group
          </button>
        </form>
      </div>

      {/* Grid: Group Dashboard + Hotel Safe Point */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Group Details */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                  CODE: {group.joinCode}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  All {group.members.length} Members Safe
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">{group.name}</h3>
              <p className="text-xs text-slate-400">Leader: {group.leaderName}</p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase text-slate-400">Today's Itinerary</p>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">{group.itinerary}</p>
            </div>
          </div>

          {/* Members Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Registered Group Members ({group.members.length})</span>
            </h4>

            <div className="space-y-2">
              {group.members.map(member => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{member.name}</span>
                        {member.role === 'leader' && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Guide
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Last ping: {new Date(member.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <Battery className="w-3.5 h-3.5 text-blue-400" />
                      <span>{member.battery}%</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                      <span className="font-bold text-emerald-400 text-xs">Safe</span>
                    </div>

                    <a
                      href={`tel:${member.phone}`}
                      onClick={() => soundEngine.playClickSound()}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                      title="Contact member"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hotel Safe Point & Return Verification */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Hotel className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Partner Hotel Safe Haven</h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/30 text-amber-300">
                Official Tourist Safe Point
              </span>
              <h4 className="font-black text-sm text-white">{hotelSafePoint.name}</h4>
              <p className="text-xs text-slate-300">{hotelSafePoint.address}</p>
              <div className="pt-2 text-[11px] font-mono text-cyan-400">
                GPS: {hotelSafePoint.lat.toFixed(4)}, {hotelSafePoint.lng.toFixed(4)}
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Hotel Safety Amenities:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>24/7 Monitored Tourist Security Gate</li>
                <li>Emergency First Aid &amp; On-Call Physician</li>
                <li>Direct Hot-Line to Local Tourist Police</li>
                <li>Battery Charging &amp; Satellite WiFi Oasis</li>
              </ul>
            </div>
          </div>

          {/* Safe Return Verification Action */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {hasVerifiedReturn ? (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Safe return confirmed at hotel desk! Tour leader notified.</span>
              </div>
            ) : (
              <button
                onClick={handleVerifySafeReturn}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Safe Return to Hotel</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
