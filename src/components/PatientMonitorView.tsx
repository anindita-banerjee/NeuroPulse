import React, { useState } from 'react';
import {
  UserRound,
  ShieldCheck,
  Activity,
  HeartPulse,
  Brain,
  Zap,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { Patient } from '../types';
import { NavTab } from './Sidebar';

interface PatientMonitorViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenNewPatientModal: () => void;
}

export const PatientMonitorView: React.FC<PatientMonitorViewProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onNavigateTab,
  onOpenNewPatientModal,
}) => {
  return (
    <div id="patient-monitor-view" className="space-y-6">
      {/* Patient Switcher Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-semibold">
              PATIENT COHORT · NEURO-REHABILITATION
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Paralysis Patient Dossier & BCI Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individualized neuro-telemetry, motor impairment severity, and BCI calibration parameters.
          </p>
        </div>

        <button
          id="btn-add-patient"
          onClick={onOpenNewPatientModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus size={15} />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Patient Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {patients.map((p) => {
          const isSelected = p.id === selectedPatient.id;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-400">{p.id}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase ${
                    p.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-1.5">{p.name}</div>
              <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.diagnosis}</div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">BCI Accuracy</span>
                <span className="text-emerald-400 font-semibold">{p.motorImageryAccuracy}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Patient Deep Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Neurological Diagnosis & Paralysis Profile (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                  {selectedPatient.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPatient.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{selectedPatient.gender}, {selectedPatient.age} yrs</span>
                    <span>·</span>
                    <span>ID: {selectedPatient.id}</span>
                    <span>·</span>
                    <span className="text-blue-400">{selectedPatient.roomBed}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('Doctor Prescriptions')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                >
                  <Stethoscope size={13} />
                  <span>View Prescriptions</span>
                </button>
                <button
                  onClick={() => onNavigateTab('History & Analytics')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Clock size={13} />
                  <span>History Logs</span>
                </button>
              </div>
            </div>

            {/* Medical Profiling Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  PRIMARY DIAGNOSIS
                </div>
                <div className="text-xs font-semibold text-white mt-1">
                  {selectedPatient.diagnosis}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  PARALYSIS SEVERITY
                </div>
                <div className="text-xs font-semibold text-rose-300 mt-1">
                  {selectedPatient.paralysisType}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  NEUROLOGICAL LESION / INJURY LEVEL
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-1">
                  {selectedPatient.injuryLevel}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  CLINICAL IMPAIRMENT SCALE
                </div>
                <div className="text-xs font-semibold text-amber-300 mt-1">
                  {selectedPatient.clinicalStage}
                </div>
              </div>

              <div className="md:col-span-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  MOBILITY & PRESERVED MOTOR STATUS
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {selectedPatient.mobilityStatus}
                </div>
              </div>

              <div className="md:col-span-2 p-3.5 rounded-lg bg-blue-950/20 border border-blue-500/30">
                <div className="text-[10px] font-mono text-blue-400 uppercase font-semibold">
                  BCI REHABILITATION PARADIGM
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {selectedPatient.bciParadigm}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: BCI Performance & Intent Decoding (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Intent Event Card */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                  ACTIVE INTENT DECODER
                </span>
                <h3 className="text-base font-semibold text-white">Current BCI Command</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                CONFIDENCE {(selectedPatient.currentIntent.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-blue-950/40 to-slate-950 border border-blue-500/40">
              <div className="text-xs text-slate-400 font-mono">Last Decoded Thought / Action:</div>
              <div className="text-base font-bold text-white mt-1">
                "{selectedPatient.currentIntent.command}"
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Trigger: {selectedPatient.currentIntent.channelTrigger}</span>
                <span className="text-blue-400">{selectedPatient.currentIntent.timestamp}</span>
              </div>
            </div>

            {/* Neurological Performance Gauges */}
            <div className="mt-5 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Motor Imagery Accuracy</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {selectedPatient.motorImageryAccuracy}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${selectedPatient.motorImageryAccuracy}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Attention Level</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {selectedPatient.attentionScore}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${selectedPatient.attentionScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Cognitive Fatigue Score</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {selectedPatient.fatigueScore}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${selectedPatient.fatigueScore}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('BCI Speller & Assistive')}
              className="w-full mt-5 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <span>Launch BCI Assistive Speller</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
