/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Download, 
  CheckCircle, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  HardDrive, 
  Map, 
  Layers, 
  Trash2, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { OfflinePack, SosAlert } from '../types';
import { soundEngine } from '../utils/audio';

interface OfflineSafetyPacksProps {
  packs: OfflinePack[];
  onToggleDownloadPack: (packId: string) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  isRescueBattery: boolean;
  onToggleRescueBattery: () => void;
  offlineSosQueue: SosAlert[];
  onClearOfflineQueue: () => void;
}

export const OfflineSafetyPacks: React.FC<OfflineSafetyPacksProps> = ({
  packs,
  onToggleDownloadPack,
  isOffline,
  onToggleOffline,
  isRescueBattery,
  onToggleRescueBattery,
  offlineSosQueue,
  onClearOfflineQueue,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadClick = (packId: string) => {
    soundEngine.playClickSound();
    setDownloadingId(packId);
    setTimeout(() => {
      onToggleDownloadPack(packId);
      setDownloadingId(null);
      soundEngine.playSuccessChime();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Toggle Hub */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <HardDrive className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Offline Safety Mode &amp; Downloaded Maps
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Never get stranded without navigation or emergency procedures in dense forests, remote mountain passes, or disconnected sea shores.
          </p>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2.5 self-start">
          <button
            onClick={() => {
              soundEngine.playClickSound();
              onToggleOffline();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all ${
              isOffline
                ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>{isOffline ? 'Offline Mode ACTIVE' : 'Simulate Offline Mode'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClickSound();
              onToggleRescueBattery();
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all ${
              isRescueBattery
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <BatteryCharging className="w-4 h-4" />
            <span>{isRescueBattery ? 'Rescue Battery ON' : 'Rescue Battery Mode'}</span>
          </button>
        </div>
      </div>

      {/* Offline Status Warning Banner */}
      {isOffline && (
        <div className="p-5 rounded-3xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-3 shadow-xl">
          <WifiOff className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-white">OFFLINE SAFETY MODE ACTIVE</h3>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Operating purely on locally cached safety blueprints, vector contours, and emergency contact registries.
              Emergency requests will automatically queue in local encrypted storage and transmit as soon as cell or satellite data is regained.
            </p>
          </div>
        </div>
      )}

      {/* Rescue Battery Mode Details Banner */}
      {isRescueBattery && (
        <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-start gap-3 shadow-xl">
          <BatteryCharging className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-white">RESCUE BATTERY MODE ACTIVE</h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Conserving maximum battery for emergency assistance. High contrast AMOLED black profile active, non-critical background polling deactivated, essential GPS radar, SOS button, and Digital ID stay ready.
            </p>
          </div>
        </div>
      )}

      {/* Offline SOS Queue Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Encrypted Local SOS Dispatch Queue ({offlineSosQueue.length})</h3>
          </div>
          {offlineSosQueue.length > 0 && (
            <button
              onClick={() => {
                soundEngine.playClickSound();
                onClearOfflineQueue();
              }}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          )}
        </div>

        {offlineSosQueue.length === 0 ? (
          <p className="text-xs text-slate-400">
            Queue is empty. Any emergency SOS triggered while disconnected will be stored here with coordinates and battery telemetry.
          </p>
        ) : (
          <div className="space-y-2">
            {offlineSosQueue.map(item => {
              const coordinates = item.coords || item.coordinates;
              const battery = item.batteryLevel ?? item.batteryStatus ?? 100;
              return (
              <div key={item.id} className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{item.id}</span>
                    <span className="text-slate-300 font-semibold">{item.userName}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                    Lat: {coordinates.lat.toFixed(5)}, Lng: {coordinates.lng.toFixed(5)} &bull; Battery: {battery}%
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase font-bold animate-pulse">
                  Pending Network
                </span>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Downloadable Regional Offline Packs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" />
            <span>Regional Offline Safety Packs</span>
          </h3>
          <span className="text-xs text-slate-400">Instant vector download</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packs.map(pack => (
            <div
              key={pack.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                pack.isDownloaded 
                  ? 'bg-slate-900/90 border-emerald-500/40' 
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">{pack.region}</span>
                  <span className="text-xs font-mono text-slate-400">{pack.sizeMb} MB</span>
                </div>

                <h4 className="text-lg font-black text-white">{pack.name}</h4>

                <div className="pt-2 space-y-1">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Included Offline Layers:</p>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {pack.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                {pack.isDownloaded ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Downloaded &bull; Ready Offline</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Not yet downloaded</span>
                )}

                <button
                  onClick={() => handleDownloadClick(pack.id)}
                  disabled={downloadingId === pack.id}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                    pack.isDownloaded
                      ? 'bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingId === pack.id ? 'animate-bounce' : ''}`} />
                  <span>
                    {downloadingId === pack.id
                      ? 'Downloading Pack...'
                      : pack.isDownloaded
                      ? 'Delete Local Data'
                      : 'Download Pack'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
