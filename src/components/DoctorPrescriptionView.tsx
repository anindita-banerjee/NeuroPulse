import React from 'react';
import {
  Stethoscope,
  Pill,
  Calendar,
  FileCheck,
  ShieldAlert,
  Plus,
  CheckCircle2,
  Clock,
  Building,
  User,
  Hash,
  AlertTriangle,
  Zap,
  Sliders
} from 'lucide-react';
import { Patient, DoctorPrescription } from '../types';

interface DoctorPrescriptionViewProps {
  patient: Patient;
  prescriptions: DoctorPrescription[];
  onOpenNewPrescription: () => void;
}

export const DoctorPrescriptionView: React.FC<DoctorPrescriptionViewProps> = ({
  patient,
  prescriptions,
  onOpenNewPrescription,
}) => {
  const activeRx = prescriptions[0];

  return (
    <div id="doctor-prescription-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              OFFICIAL CLINICAL PRESCRIPTION · {patient.name}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Doctor's Prescription & Neuro-BCI Rehabilitation Protocol
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individualized medical therapy, pharmacotherapy, and EEG-BCI stimulation dosage prescribed for {patient.diagnosis}.
          </p>
        </div>

        <button
          id="btn-prescribe-new"
          onClick={onOpenNewPrescription}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Write New Prescription</span>
        </button>
      </div>

      {activeRx ? (
        <div className="space-y-6">
          {/* Physician & Formal Prescription Credential Header */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900/90 to-slate-950 border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{activeRx.doctorName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      VERIFIED ATTENDING
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">{activeRx.doctorSpecialty}</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Building size={12} className="text-slate-400" />
                      {activeRx.hospitalAffiliation}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-slate-300">License: {activeRx.licenseNumber}</span>
                  </div>
                </div>
              </div>

              {/* Prescription metadata */}
              <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 text-xs font-mono">
                <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                  Prescription ID: <span className="text-emerald-400 font-semibold">{activeRx.id}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Date: {activeRx.datePrescribed}</span>
                  <span>·</span>
                  <span className="text-blue-400">Review: {activeRx.nextReviewDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Prescribed Pharmacotherapy / Medications */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Pill size={18} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Prescribed Medications</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {activeRx.medications.length} Active Prescriptions
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRx.medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-white">{med.name}</span>
                      <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-blue-300 mt-1">{med.frequency}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Route: {med.route}</div>
                    <p className="text-xs text-slate-300 mt-2.5 pt-2 border-t border-slate-800/80 leading-relaxed">
                      {med.purpose}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 text-[10px] font-mono text-slate-400">
                    Started: {med.startDate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Prescribed EEG-BCI Neuro-Rehabilitation Protocol */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  BCI Neuro-Rehabilitation Protocol Order
                </h3>
              </div>
              <span className="text-xs font-mono text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                CLINICAL DOSING
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  DAILY SESSION DURATION
                </div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  {activeRx.bciTherapyProtocol.dailyDurationMinutes} Minutes
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeRx.bciTherapyProtocol.sessionFrequency}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  TARGET BCI PARADIGM
                </div>
                <div className="text-xs font-bold text-blue-400 mt-1">
                  {activeRx.bciTherapyProtocol.targetParadigm}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  CLASSIFICATION THRESHOLD
                </div>
                <div className="text-base font-bold text-emerald-400 mt-1 font-mono">
                  {activeRx.bciTherapyProtocol.classificationThreshold}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">True-positive intent cutoff</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  ASSISTIVE INTEGRATION
                </div>
                <div className="text-xs font-bold text-purple-300 mt-1">
                  {activeRx.bciTherapyProtocol.assistiveDeviceIntegration}
                </div>
              </div>

              <div className="md:col-span-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  TARGET BRAINWAVE BANDS & SENSORIMOTOR FOCUS
                </div>
                <div className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {activeRx.bciTherapyProtocol.targetBands}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {activeRx.bciTherapyProtocol.sensorimotorFocus}
                </div>
              </div>

              <div className="md:col-span-2 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  NEUROPLASTICITY GOAL
                </div>
                <div className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {activeRx.bciTherapyProtocol.neuroplasticityGoal}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Notes & Warning Precautions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                ATTENDING PHYSICIAN'S CLINICAL OBSERVATIONS
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                "{activeRx.clinicalNotes}"
              </p>
              <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Cryptographic Signature: {activeRx.signatureHash.slice(0, 24)}...</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Validated
                </span>
              </div>
            </div>

            {/* Precautions */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-mono font-semibold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-400" />
                CONTRAINDICATIONS & SAFETY SAFEGUARDS
              </h4>
              <div className="space-y-2">
                {activeRx.warningPrecautions.map((warn, wIdx) => (
                  <div
                    key={wIdx}
                    className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-200 leading-relaxed"
                  >
                    • {warn}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800">
          <p className="text-sm text-slate-400">No active prescription found for this patient.</p>
          <button
            onClick={onOpenNewPrescription}
            className="mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white"
          >
            Create Initial Prescription
          </button>
        </div>
      )}
    </div>
  );
};
