import React, { useState } from 'react';
import { X, UserPlus, Brain } from 'lucide-react';
import { Patient } from '../types';
import { createPatient } from '../api';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPatient: Patient) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number>(42);
  const [gender, setGender] = useState<string>('Male');
  const [diagnosis, setDiagnosis] = useState<string>(
    'Amyotrophic Lateral Sclerosis (ALS) - Bulbar Onset'
  );
  const [paralysisType, setParalysisType] = useState<string>('Locked-in Syndrome (Anarthria & Quadriparesis)');
  const [injuryLevel, setInjuryLevel] = useState<string>('Motor neuron loss (Cranial & Cervical)');
  const [clinicalStage, setClinicalStage] = useState<string>('ALSFRS-R Score: 11/48');
  const [mobilityStatus, setMobilityStatus] = useState<string>('Wheelchair bound with ventilatory support');
  const [bciParadigm, setBciParadigm] = useState<string>('P300 Matrix Speller + Emergency Alert');
  const [roomBed, setRoomBed] = useState<string>('ICU-Neuro 04');
  const [attendingDoctor, setAttendingDoctor] = useState<string>('Dr. Riley Chen, MD, PhD');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createPatient({
        name: name.trim(),
        age,
        gender,
        diagnosis,
        paralysisType,
        injuryLevel,
        clinicalStage,
        mobilityStatus,
        bciParadigm,
        currentDoctor: attendingDoctor,
        roomBed,
        status: 'active',
        signalQuality: 96,
        attentionScore: 82,
        focusScore: 85,
        fatigueScore: 18,
        activeChannelCount: 16,
        samplingRate: 250,
        dominantWave: 'Alpha',
        bandPowers: {
          alpha: 48,
          beta: 22,
          theta: 18,
          delta: 12,
          mu: 16,
        },
        motorImageryAccuracy: 88,
        currentIntent: {
          command: 'System Initialized / Calibrating',
          confidence: 0.9,
          timestamp: 'Just now',
          channelTrigger: 'Cz/Pz',
        },
        eegConfig: {
          baselineAlpha: 45,
          baselineBeta: 20,
          baselineTheta: 18,
          baselineDelta: 12,
          muSuppressionThreshold: 0.72,
          filterNotch: true,
          filterBandpass: '0.5 - 40 Hz',
          impedanceCheck: { C3: 2.1, C4: 2.3, Cz: 1.9, Pz: 2.0 },
        },
        daysInProgram: 1,
      });
      onSuccess(created);
      onClose();
    } catch (err) {
      console.error('Failed to create patient:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Enroll New Paralysis Patient</h3>
            <p className="text-xs text-slate-400">
              Initialize individualized EEG montages and neuro-rehabilitation profiles
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Patient Full Name</label>
              <input
                type="text"
                placeholder="e.g. Maya Lin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Age</label>
              <input
                type="number"
                min="1"
                max="110"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">ICU Bed / Room</label>
              <input
                type="text"
                value={roomBed}
                onChange={(e) => setRoomBed(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Primary Neurological Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Paralysis Severity</label>
              <input
                type="text"
                value={paralysisType}
                onChange={(e) => setParalysisType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Lesion / Injury Level</label>
              <input
                type="text"
                value={injuryLevel}
                onChange={(e) => setInjuryLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Target BCI Paradigm</label>
            <input
              type="text"
              value={bciParadigm}
              onChange={(e) => setBciParadigm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Attending Physician</label>
            <input
              type="text"
              value={attendingDoctor}
              onChange={(e) => setAttendingDoctor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
            />
          </div>

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
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Enrolling Patient...' : 'Enroll Patient Dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
