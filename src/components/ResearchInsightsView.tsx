import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Brain,
  FileCheck,
  RefreshCw,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Patient, DoctorPrescription, SessionHistory } from '../types';
import { fetchAIAssessment } from '../api';

interface ResearchInsightsViewProps {
  patient: Patient;
  prescriptions: DoctorPrescription[];
  histories: SessionHistory[];
}

export const ResearchInsightsView: React.FC<ResearchInsightsViewProps> = ({
  patient,
  prescriptions,
  histories,
}) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [reportDate, setReportDate] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsLoadingAi(true);
    try {
      const data = await fetchAIAssessment(patient.id);
      setAiReport(data.assessment);
      setReportDate(new Date(data.generatedAt).toLocaleTimeString());
    } catch (err) {
      console.error('Failed to generate AI assessment:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div id="research-insights-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              AI-POWERED NEUROLOGICAL RESEARCH · {patient.name}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Clinical Neuroplasticity Insights & Model Synthesis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated event-related spectral perturbation (ERSP) and prescription adherence evaluation.
          </p>
        </div>

        <button
          id="btn-run-ai-assessment"
          onClick={handleGenerateReport}
          disabled={isLoadingAi}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-sm disabled:opacity-50"
        >
          {isLoadingAi ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Analyzing EEG Telemetry...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Generate AI Clinical Assessment</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Research Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-semibold">
            <TrendingUp size={16} />
            <span>SPECTRAL COHERENCE TREND</span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">+12.4%</div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Alpha band dominance is trending upward across the last 3 sessions, reflecting reduced ocular tremor and mental focus.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
            <CheckCircle2 size={16} />
            <span>P300 LATENCY JITTER</span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">14 ms</div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Latency jitter narrowed from 38ms to 14ms across Cz/Pz, allowing faster P300 letter selection with fewer flash repeats.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-semibold">
            <Award size={16} />
            <span>MOTOR IMAGERY ERD</span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">-52%</div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Mu rhythm suppression over the contralateral motor cortex exceeds the 0.42 threshold for accurate exoskeleton hand closure.
          </p>
        </div>
      </div>

      {/* AI Assessment Result Card */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            <h3 className="text-base font-bold text-white">
              AI Neurological & Prescription Synthesis Report
            </h3>
          </div>
          {reportDate && (
            <span className="text-xs font-mono text-slate-400">Generated: {reportDate}</span>
          )}
        </div>

        {aiReport ? (
          <div className="mt-4 p-5 bg-[#060a12] rounded-xl border border-slate-800 prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 space-y-4">
            <div className="whitespace-pre-wrap font-sans text-xs text-slate-200">
              {aiReport}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-8 text-center bg-[#060a12] rounded-xl border border-slate-800/80">
            <Brain size={32} className="mx-auto text-purple-400/60 mb-2" />
            <div className="text-sm font-semibold text-white">
              No AI evaluation generated for this session yet
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click the button above to execute a comprehensive neurological assessment combining {patient.name}'s real-time EEG band powers, active doctor prescription, and session histories.
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={isLoadingAi}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            >
              Generate Analysis Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
