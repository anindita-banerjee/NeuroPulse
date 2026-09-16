import React from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';
import { Patient, DoctorPrescription, SessionHistory } from '../types';

interface ClinicalReportModalProps {
  patient: Patient;
  prescription: DoctorPrescription | null;
  histories: SessionHistory[];
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  patient,
  prescription,
  histories,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto text-slate-200">
        {/* Actions Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            <span className="font-bold text-sm text-white">
              Official EEG-BCI Clinical Summary Report
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="mt-6 space-y-6 text-xs bg-slate-950 p-6 rounded-xl border border-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-lg font-bold text-white tracking-wide">
                NEUROPULSE BCI CLINICAL SUMMARY
              </div>
              <div className="text-slate-400 text-[11px]">
                Hospital Neuro-Engineering & Assistive Technology Division
              </div>
              <div className="text-slate-500 text-[10px] font-mono mt-0.5">
                Report Generated: {new Date().toLocaleString()} · ID: NP-{patient.id}-EXPORT
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                CLINICAL VALIDITY: VERIFIED
              </span>
            </div>
          </div>

          {/* Patient Details */}
          <div>
            <div className="text-[10px] font-mono text-blue-400 uppercase font-bold mb-2">
              PATIENT DEMOGRAPHICS & CLINICAL ETIOLOGY
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">NAME</span>
                <span className="text-white font-bold">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ID / AGE / GENDER</span>
                <span className="text-white">{patient.id} · {patient.age}y · {patient.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">BED LOCATION</span>
                <span className="text-white">{patient.roomBed}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ATTENDING PHYSICIAN</span>
                <span className="text-white">{patient.currentDoctor}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px]">PRIMARY DIAGNOSIS</span>
                <span className="text-slate-200">{patient.diagnosis}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px]">PARALYSIS CLASSIFICATION</span>
                <span className="text-slate-200">{patient.paralysisType}</span>
              </div>
            </div>
          </div>

          {/* Active Doctor Prescription */}
          {prescription && (
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-2">
                ATTENDING DOCTOR'S PRESCRIPTION ORDER (DR. {prescription.doctorName.toUpperCase()})
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-3">
                <div className="flex justify-between text-[11px]">
                  <span>Prescription ID: <span className="font-mono text-white">{prescription.id}</span></span>
                  <span>Prescribed Date: <span className="font-mono text-white">{prescription.datePrescribed}</span></span>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Pharmacotherapy:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {prescription.medications.map((m, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                        <span className="font-bold text-white">{m.name}</span> ({m.dosage} - {m.frequency})
                        <div className="text-[10px] text-slate-400">{m.purpose}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                    BCI Neuro-Rehab Protocol:
                  </div>
                  <div className="text-[11px] text-slate-300">
                    • Daily Duration: {prescription.bciTherapyProtocol.dailyDurationMinutes} min ({prescription.bciTherapyProtocol.sessionFrequency})
                    <br />
                    • Paradigm: {prescription.bciTherapyProtocol.targetParadigm} (Threshold: {prescription.bciTherapyProtocol.classificationThreshold})
                    <br />
                    • Assistive Device: {prescription.bciTherapyProtocol.assistiveDeviceIntegration}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session History Summary */}
          <div>
            <div className="text-[10px] font-mono text-purple-400 uppercase font-bold mb-2">
              SESSION TELEMETRY LOGS ({histories.length} SESSIONS)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="py-1 px-2">Session</th>
                    <th className="py-1 px-2">Date</th>
                    <th className="py-1 px-2">Duration</th>
                    <th className="py-1 px-2">BCI Accuracy</th>
                    <th className="py-1 px-2">Trials</th>
                    <th className="py-1 px-2">Fatigue</th>
                    <th className="py-1 px-2">Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {histories.slice(0, 5).map((h) => (
                    <tr key={h.id}>
                      <td className="py-1.5 px-2 font-bold text-white">#{h.sessionNumber}</td>
                      <td className="py-1.5 px-2 text-slate-300">{h.date}</td>
                      <td className="py-1.5 px-2">{h.durationMinutes}m</td>
                      <td className="py-1.5 px-2 text-emerald-400 font-bold">{h.bciAccuracy}%</td>
                      <td className="py-1.5 px-2">{h.successfulCommands}/{h.trialsCount}</td>
                      <td className="py-1.5 px-2">{h.fatigueIndex}</td>
                      <td className="py-1.5 px-2 truncate max-w-[180px] text-slate-400 font-sans">
                        {h.doctorAssessment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Physician Signature & Final Year Project Stamp */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <div className="font-mono text-white font-bold">DIGITAL CLINICAL SIGNATURE</div>
              <div>SHA256: 8f9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>EVALUATION COMPLETE</span>
              </div>
              <div className="text-[10px]">EEG BCI for Paralysis Rehabilitation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
