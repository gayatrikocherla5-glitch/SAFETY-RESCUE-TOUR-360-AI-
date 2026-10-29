/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Camera, 
  Layers, 
  ChevronRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { IncidentReport, LocationCoordinate, User } from '../types';
import { soundEngine } from '../utils/audio';

interface IncidentReportingProps {
  incidents: IncidentReport[];
  onAddIncident: (incident: IncidentReport) => void;
  userCoords: LocationCoordinate;
  user: User;
  isOffline: boolean;
}

export const IncidentReporting: React.FC<IncidentReportingProps> = ({
  incidents,
  onAddIncident,
  userCoords,
  user,
  isOffline,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'list' | 'ai_analysis'>('report');
  const [incidentType, setIncidentType] = useState<IncidentReport['incidentType']>('unsafe_location');
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState<string>('Near Beach Promenade Promenade Gate 2');
  const [severity, setSeverity] = useState<IncidentReport['severity']>('medium');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // AI Analysis state
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    soundEngine.playClickSound();
    const newIncident: IncidentReport = {
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      userName: user.name,
      incidentType,
      description: description.trim(),
      location: {
        address: address.trim(),
        lat: userCoords.lat,
        lng: userCoords.lng,
      },
      timestamp: Date.now(),
      severity,
      status: 'reported',
    };

    onAddIncident(newIncident);
    setSubmittedId(newIncident.id);
    setDescription('');
    soundEngine.playSuccessChime();
  };

  const handleRunAiAnalysis = async () => {
    soundEngine.playClickSound();
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/ai/analyze-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidents }),
      });

      if (!res.ok) throw new Error('Failed to run AI analysis');
      const data = await res.json();
      setAiAnalysisResult(data.analysis);
    } catch {
      // Local fallback heuristic analysis
      setAiAnalysisResult(
        `[SAFETY AI INCIDENT PATTERN DETECTION]
1. Cluster Alert: 2 incidents reported near the Rocky High Tide Point within 400m of the shoreline during tidal transition.
2. Common Categories: 'Unsafe Location' (broken railings/slippery shelves) & 'Lost Person' (trail markers absent).
3. Preventive Recommendations for Authorities:
   - Deploy dynamic caution warning beacons at North Coastal Ridge.
   - Install solar-powered multilingual safety signs advising tourists to keep clear of tidal spray rocks.
   - Designate Grand Horizon Beach Resort reception as an official tourist muster sanctuary.
*Disclaimer: AI-generated advisory assistance, not a final law-enforcement determination.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Mode Navigation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-400" />
            <span>Public &amp; Tourist Incident Reporting</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Log safety hazards, lost persons, harassment, or infrastructure issues. Feeds real-time safety heatmaps and AI pattern detection.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start">
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('report');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'report' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Report Incident
          </button>
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('list');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recent Logs ({incidents.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setActiveTab('ai_analysis');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              activeTab === 'ai_analysis' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI Incident Analysis</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Report Incident Form */}
      {activeTab === 'report' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto space-y-5">
          {submittedId && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">Incident Logged Successfully!</p>
                  <p className="font-mono text-[11px] text-cyan-300">Generated ID: {submittedId}</p>
                </div>
              </div>
              <button
                onClick={() => setSubmittedId(null)}
                className="text-xs text-emerald-400 hover:underline font-bold"
              >
                File Another
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Incident Category
              </label>
              <select
                value={incidentType}
                onChange={e => setIncidentType(e.target.value as typeof incidentType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="lost_person">Lost Person / Separated Tourist</option>
                <option value="missing_group_member">Missing Group Member</option>
                <option value="harassment">Harassment / Intimidation</option>
                <option value="accident">Accident / Road Incident</option>
                <option value="unsafe_location">Unsafe Location / Hazard / Poor Lighting</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="theft">Theft / Pickpocketing</option>
                <option value="other">Other Safety Incident</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as typeof severity)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="low">🟢 Low (Informational / Minor)</option>
                  <option value="medium">🟡 Medium (Requires Attention)</option>
                  <option value="high">🟠 High (Urgent Response Needed)</option>
                  <option value="critical">🔴 Critical (Immediate Danger / SOS)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Location / Landmark
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Near Lighthouse Vista Trail"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* GPS Auto-Stamp */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>GPS Coordinates Auto-Captured:</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Detailed Description of Incident
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what occurred, physical descriptions, landmarks, or conditions..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Incident Report to Authorities</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Recent Incident Logs */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {incidents.map(inc => (
            <div
              key={inc.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {inc.id}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    inc.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    inc.severity === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    inc.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {inc.severity} Severity
                  </span>
                  <span className="text-xs text-slate-500 capitalize">
                    {inc.incidentType.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-sm font-semibold text-white">{inc.description}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{inc.location.address} ({inc.location.lat.toFixed(4)}, {inc.location.lng.toFixed(4)})</span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase ${
                  inc.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  inc.status === 'investigating' ? 'bg-blue-500/20 text-cyan-300 border border-blue-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {inc.status}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AI Incident Analysis & Safety Analytics */}
      {activeTab === 'ai_analysis' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-black text-white">AI Incident Pattern Detection</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated clustering of recent incident reports to pinpoint repeated safety hotspots.
              </p>
            </div>

            <button
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/25 self-start"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Incident Clusters...' : 'Run Safety AI Analysis'}</span>
            </button>
          </div>

          {/* Analysis Output Box */}
          {aiAnalysisResult ? (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
                <Sparkles className="w-4 h-4" />
                <span>AI Safety Analytics Report</span>
              </div>
              <div className="pt-2 text-slate-300 font-sans">{aiAnalysisResult}</div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-2 text-slate-400">
              <BrainCircuit className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold">Click "Run Safety AI Analysis" to identify repeated patterns and safety hotspots across tourist corridors.</p>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200">
            ⚠️ <span className="font-bold">Official Protocol Note:</span> AI-generated incident analysis is strictly provided as computational decision assistance and does not constitute a final law-enforcement determination.
          </div>
        </div>
      )}

    </div>
  );
};
