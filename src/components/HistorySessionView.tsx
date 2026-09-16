import React, { useState } from 'react';
import {
  History,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileDown,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Patient, SessionHistory } from '../types';

interface HistorySessionViewProps {
  patient: Patient;
  histories: SessionHistory[];
  onOpenNewSession: () => void;
  onExportReport: () => void;
}

export const HistorySessionView: React.FC<HistorySessionViewProps> = ({
  patient,
  histories,
  onOpenNewSession,
  onExportReport,
}) => {
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(
    histories[0] || null
  );

  // Calculate longitudinal stats
  const totalSessions = histories.length;
  const avgAccuracy = totalSessions > 0
    ? (histories.reduce((acc, h) => acc + h.bciAccuracy, 0) / totalSessions).toFixed(1)
    : '0';
  const totalMinutes = histories.reduce((acc, h) => acc + h.durationMinutes, 0);

  return (
    <div id="history-session-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              LONGITUDINAL TELEMETRY · {patient.name}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            BCI Training Session Logs & Recovery Progression
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological multi-session database tracking decoded motor intentions, cognitive fatigue, and clinical progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-session-log"
            onClick={onOpenNewSession}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Record New Session</span>
          </button>
          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileDown size={14} className="text-blue-400" />
            <span className="hidden sm:inline">Export Log</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Total BCI Sessions</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{totalSessions}</div>
          <div className="text-[11px] text-blue-400 mt-1">{totalMinutes} Recorded Minutes</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Mean BCI Accuracy</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{avgAccuracy}%</div>
          <div className="text-[11px] text-slate-400 mt-1">+14.2% since Day 1 baseline</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Prescription Adherence</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">98.4%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Full compliance with doctor order</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Coherence Stability</div>
          <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">
            {histories[0]?.coherenceScore || 91}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Artifact rejection rate 99.2%</div>
        </div>
      </div>

      {/* Visual Longitudinal Accuracy Trend Chart */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
              HISTORICAL PROGRESSION
            </span>
            <h3 className="text-base font-semibold text-white">
              BCI Intent Decoding Accuracy Across Sessions
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
            Target &gt; 70% Communication Cutoff
          </span>
        </div>

        {/* SVG Longitudinal Graph */}
        <div className="mt-4 p-4 bg-[#060a12] rounded-lg border border-slate-800">
          <div className="h-44 w-full">
            <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="w-full h-full">
              {/* Horizontal gridlines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,3" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,3" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,3" />

              {/* 70% threshold line (80 on inverted scale) */}
              <line x1="0" y1="72" x2="600" y2="72" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />

              {/* Area fill */}
              {histories.length > 1 && (
                <path
                  d={`
                    M 0 160
                    ${[...histories].reverse().map((h, i, arr) => {
                      const x = (i / (arr.length - 1)) * 600;
                      const y = 160 - ((h.bciAccuracy - 50) / 50) * 140;
                      return `L ${x} ${Math.max(10, Math.min(150, y))}`;
                    }).join(' ')}
                    L 600 160 Z
                  `}
                  fill="url(#history-gradient)"
                  opacity="0.3"
                />
              )}

              {/* Trend Line */}
              {histories.length > 1 && (
                <path
                  d={`
                    ${[...histories].reverse().map((h, i, arr) => {
                      const x = (i / (arr.length - 1)) * 600;
                      const y = 160 - ((h.bciAccuracy - 50) / 50) * 140;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(150, y))}`;
                    }).join(' ')}
                  `}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
              )}

              {/* Plot points */}
              {[...histories].reverse().map((h, i, arr) => {
                const x = (i / (arr.length - 1)) * 600;
                const y = 160 - ((h.bciAccuracy - 50) / 50) * 140;
                return (
                  <circle
                    key={h.id}
                    cx={x}
                    cy={Math.max(10, Math.min(150, y))}
                    r="4"
                    fill="#0a0f1c"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                );
              })}

              <defs>
                <linearGradient id="history-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0a0f1c" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
            <span>Earliest Session Recorded</span>
            <span className="text-rose-400">--- 70% BCI Functional Threshold</span>
            <span className="text-emerald-400 font-bold">Latest: #{histories[0]?.sessionNumber || 1} ({histories[0]?.bciAccuracy}%)</span>
          </div>
        </div>
      </div>

      {/* Chronological Table of Recorded Sessions */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
              SESSION DATABASE
            </span>
            <h3 className="text-base font-semibold text-white">Chronological History Records</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{histories.length} Sessions Logged</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Dominant</th>
                <th className="py-2.5 px-3">BCI Accuracy</th>
                <th className="py-2.5 px-3">Trials</th>
                <th className="py-2.5 px-3">Fatigue</th>
                <th className="py-2.5 px-3">Doctor Assessment</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {histories.map((h) => {
                const isSelected = selectedSession?.id === h.id;
                return (
                  <tr
                    key={h.id}
                    onClick={() => setSelectedSession(h)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-950/40 text-blue-200' : 'hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white">#{h.sessionNumber}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{h.date}</div>
                      <div className="text-[10px] text-slate-400">{h.time}</div>
                    </td>
                    <td className="py-3 px-3">{h.durationMinutes} min</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-200">
                        {h.dominantWave}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          h.bciAccuracy >= 90
                            ? 'text-emerald-400'
                            : h.bciAccuracy >= 80
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {h.bciAccuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {h.successfulCommands}/{h.trialsCount}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={h.fatigueIndex > 35 ? 'text-amber-400' : 'text-slate-400'}
                      >
                        {h.fatigueIndex}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[220px] truncate text-[11px] font-sans text-slate-300">
                      {h.doctorAssessment}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(h);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Session Deep Clinical Details Inspector */}
      {selectedSession && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-blue-500/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                Session #{selectedSession.sessionNumber} Comprehensive Clinical Record
              </span>
              <span className="text-xs font-mono text-blue-400">
                ({selectedSession.date} · {selectedSession.time})
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              Protocol Adherence: {selectedSession.prescribedProtocolAdherence}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Alpha Band Avg</div>
              <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">
                {selectedSession.avgAlpha}%
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Beta Band Avg</div>
              <div className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                {selectedSession.avgBeta}%
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Theta Band Avg</div>
              <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                {selectedSession.avgTheta}%
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Coherence Score</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {selectedSession.coherenceScore}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold mb-1">
                SESSION TRAINING LOG
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedSession.notes}
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-blue-400 uppercase font-semibold mb-1">
                ATTENDING PHYSICIAN ASSESSMENT
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedSession.doctorAssessment}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
