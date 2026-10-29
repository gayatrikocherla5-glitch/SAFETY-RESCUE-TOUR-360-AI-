/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  Hospital, 
  Shield, 
  Flame, 
  HelpCircle, 
  Pill, 
  Bed, 
  PhoneCall, 
  Navigation, 
  Clock, 
  Search,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { EmergencyPlace, PlaceType, LocationCoordinate } from '../types';
import { soundEngine } from '../utils/audio';

interface SafePlacesProps {
  places: EmergencyPlace[];
  userCoords: LocationCoordinate;
  isOffline: boolean;
}

export const SafePlaces: React.FC<SafePlacesProps> = ({
  places,
  userCoords,
  isOffline,
}) => {
  const [selectedType, setSelectedType] = useState<PlaceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate approximate distance
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredPlaces = places
    .map(p => ({
      ...p,
      distanceKm: getDistanceKm(userCoords.lat, userCoords.lng, p.lat, p.lng),
    }))
    .filter(p => {
      const matchesType = selectedType === 'all' || p.type === selectedType;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const filterTabs = [
    { id: 'all', label: 'All Services', icon: Building },
    { id: 'hospital', label: 'Hospitals', icon: Hospital },
    { id: 'police', label: 'Tourist Police', icon: Shield },
    { id: 'fire', label: 'Fire & Ocean Rescue', icon: Flame },
    { id: 'tourist_help', label: 'Help Desks', icon: HelpCircle },
    { id: 'pharmacy', label: 'Pharmacies', icon: Pill },
    { id: 'hotel', label: 'Safe Hotels', icon: Bed },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header and Search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-400" />
              <span>Verified Nearby Safe Places &amp; Essential Services</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Rapid access to verified trauma centers, police outposts, and tourist safe havens. Available {isOffline ? 'from local offline pack' : 'live with GPS range calculation'}.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search places or address..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterTabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClickSound();
                  setSelectedType(tab.id as typeof selectedType);
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap border transition-all ${
                  isSelected
                    ? 'bg-blue-600/30 text-cyan-300 border-blue-500/50 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlaces.map(place => (
          <div
            key={place.id}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border ${
                  place.type === 'hospital' ? 'bg-rose-950/40 text-rose-300 border-rose-500/30' :
                  place.type === 'police' ? 'bg-blue-950/40 text-cyan-300 border-blue-500/30' :
                  place.type === 'fire' ? 'bg-amber-950/40 text-amber-300 border-amber-500/30' :
                  place.type === 'hotel' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' :
                  'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                }`}>
                  {place.type.replace('_', ' ')}
                </span>

                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                  <MapPin className="w-3 h-3" />
                  <span>{place.distanceKm ? `${place.distanceKm.toFixed(2)} km` : '~300m'}</span>
                </div>
              </div>

              <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                {place.name}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2">{place.address}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">{place.phone}</span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {place.isOpen24x7 ? 'Open 24/7' : 'Regular Hours'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${place.phone}`}
                  onClick={() => soundEngine.playClickSound()}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Emergency</span>
                </a>

                <a
                  href={`https://maps.google.com/?q=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => soundEngine.playClickSound()}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1 border border-slate-700"
                  title="Open GPS Navigation"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Route</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
