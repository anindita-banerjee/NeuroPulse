import React, { useState } from 'react';
import { X, Stethoscope, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Patient, DoctorPrescription, Medication } from '../types';
import { createPrescription } from '../api';

interface NewPrescriptionModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRx: DoctorPrescription) => void;
}

export const NewPrescriptionModal: React.FC<NewPrescriptionModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [doctorName, setDoctorName] = useState<string>('Dr. Riley Chen, MD, PhD');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('Chief Neurotechnologist');
  const [licenseNumber, setLicenseNumber] = useState<string>('MD-CAL-88914-NEU');
  const [hospitalAffiliation, setHospitalAffiliation] = useState<string>(
    'Center for Brain-Computer Rehabilitation'
  );
  const [dailyDuration, setDailyDuration] = useState<number>(45);
  const [sessionFreq, setSessionFreq] = useState<string>('Twice Daily (Morning / Afternoon)');
  const [targetParadigm, setTargetParadigm] = useState<string>(patient.bciParadigm);
  const [threshold, setThreshold] = useState<number>(0.75);
  const [targetBands, setTargetBands] = useState<string>(
    'C3/C4 Mu Rhythm (10-12 Hz) desynchronization > 45%'
  );
  const [assistiveDevice, setAssistiveDevice] = useState<string>(
    'AAC Virtual Keyboard + Emergency ICU Nurse Alert'
  );
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Patient demonstrates improved signal-to-noise ratio. Maintain electrode Cz impedance < 3.0 kΩ.'
  );

  const [medications, setMedications] = useState<Medication[]>([
    {
      name: 'Riluzole',
      dosage: '50 mg',
      frequency: 'BID (Every 12 hours)',
      route: 'Oral suspension',
      purpose: 'Glutamate neurotoxicity reduction',
      startDate: new Date().toISOString().split('T')[0],
    },
    {
      name: 'Baclofen',
      dosage: '10 mg',
      frequency: 'TID (Three times daily)',
      route: 'Oral',
      purpose: 'Spasticity reduction',
      startDate: new Date().toISOString().split('T')[0],
    },
  ]);

  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedDose, setNewMedDose] = useState<string>('');
  const [newMedFreq, setNewMedFreq] = useState<string>('');
  const [newMedPurpose, setNewMedPurpose] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    if (!newMedName.trim() || !newMedDose.trim()) return;
    setMedications([
      ...medications,
      {
        name: newMedName.trim(),
        dosage: newMedDose.trim(),
        frequency: newMedFreq.trim() || 'Daily',
        route: 'Oral',
        purpose: newMedPurpose.trim() || 'Clinical support',
        startDate: new Date().toISOString().split('T')[0],
      },
    ]);
    setNewMedName('');
    setNewMedDose('');
    setNewMedFreq('');
    setNewMedPurpose('');
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await createPrescription(patient.id, {
        doctorName,
        doctorSpecialty,
        licenseNumber,
        hospitalAffiliation,
        datePrescribed: new Date().toISOString().split('T')[0],
        nextReviewDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        medications,
        bciTherapyProtocol: {
          dailyDurationMinutes: dailyDuration,
          sessionFrequency: sessionFreq,
          targetParadigm,
          targetBands,
          classificationThreshold: threshold,
          assistiveDeviceIntegration: assistiveDevice,
          sensorimotorFocus: 'Active mental rehearsal with visual feedback',
          neuroplasticityGoal: 'Promote cortical reorganization and communication independence',
        },
        clinicalNotes,
        warningPrecautions: [
          'Monitor autonomic responses during active motor imagery trials',
          'Stop trial if patient exhibits mental exhaustion or headache',
        ],
      });
      onSuccess(created);
      onClose();
    } catch (err) {
      console.error('Failed to create prescription:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Write Doctor's Prescription & BCI Protocol
            </h3>
            <p className="text-xs text-slate-400">
              For Patient {patient.name} ({patient.id}) · {patient.diagnosis}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-xs">
          {/* Doctor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Doctor Name</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Specialty</label>
              <input
                type="text"
                value={doctorSpecialty}
                onChange={(e) => setDoctorSpecialty(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* BCI Rehabilitation Protocol */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-[11px] font-mono text-blue-400 uppercase font-bold">
              BCI REHABILITATION THERAPY PROTOCOL
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Daily Duration (Min)</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={dailyDuration}
                  onChange={(e) => setDailyDuration(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Classification Threshold</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="0.95"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Session Frequency</label>
                <input
                  type="text"
                  value={sessionFreq}
                  onChange={(e) => setSessionFreq(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Target BCI Paradigm</label>
              <input
                type="text"
                value={targetParadigm}
                onChange={(e) => setTargetParadigm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
              />
            </div>
          </div>

          {/* Medications list */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-[11px] font-mono text-emerald-400 uppercase font-bold">
              PRESCRIBED MEDICATIONS ({medications.length})
            </div>

            <div className="space-y-2">
              {medications.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div>
                    <span className="font-bold text-white mr-2">{m.name}</span>
                    <span className="font-mono text-emerald-400 mr-2">{m.dosage}</span>
                    <span className="text-slate-400">({m.frequency})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add medication row */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Drug (e.g. Baclofen)"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
              <input
                type="text"
                placeholder="Dose (e.g. 20 mg)"
                value={newMedDose}
                onChange={(e) => setNewMedDose(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
              <input
                type="text"
                placeholder="Frequency (e.g. BID)"
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddMedication}
                className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg py-1.5 text-xs font-semibold"
              >
                <Plus size={14} />
                <span>Add Med</span>
              </button>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Clinical Notes & Observations</label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Signing Prescription...' : 'Sign & Submit Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
