import React, { useState } from 'react';
import { X, History, Plus, CheckCircle2 } from 'lucide-react';
import { Patient, SessionHistory } from '../types';
import { createHistory } from '../api';

interface NewSessionModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newHist: SessionHistory) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [duration, setDuration] = useState<number>(45);
  const [dominantWave, setDominantWave] = useState<string>(patient.dominantWave);
  const [bciAccuracy, setBciAccuracy] = useState<number>(92.5);
  const [trialsCount, setTrialsCount] = useState<number>(100);
  const [successfulCommands, setSuccessfulCommands] = useState<number>(93);
  const [fatigueIndex, setFatigueIndex] = useState<number>(22);
  const [focusScore, setFocusScore] = useState<number>(84);
  const [notes, setNotes] = useState<string>(
    'Patient completed motor imagery matrix trial. Smooth ERD desynchronization over target electrodes.'
  );
  const [doctorAssessment, setDoctorAssessment] = useState<string>(
    'Consistent signal synchrony. Good clinical response without premature mental exhaustion.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await createHistory(patient.id, {
        durationMinutes: duration,
        dominantWave,
        avgAlpha: patient.bandPowers.alpha,
        avgBeta: patient.bandPowers.beta,
        avgTheta: patient.bandPowers.theta,
        avgDelta: patient.bandPowers.delta,
        bciAccuracy,
        trialsCount,
        successfulCommands,
        fatigueIndex,
        focusScore,
        coherenceScore: 90,
        notes,
        doctorAssessment,
        prescribedProtocolAdherence: 100,
      });
      onSuccess(created);
      onClose();
    } catch (err) {
      console.error('Failed to log new session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <History size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Record Clinical BCI Session</h3>
            <p className="text-xs text-slate-400">
              For {patient.name} ({patient.id}) · {patient.diagnosis}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="10"
                max="180"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Dominant Wave</label>
              <select
                value={dominantWave}
                onChange={(e) => setDominantWave(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              >
                <option value="Alpha">Alpha (8–13 Hz)</option>
                <option value="Beta">Beta (13–30 Hz)</option>
                <option value="Theta">Theta (4–8 Hz)</option>
                <option value="Delta">Delta (0.5–4 Hz)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">BCI Accuracy (%)</label>
              <input
                type="number"
                step="0.1"
                min="40"
                max="100"
                value={bciAccuracy}
                onChange={(e) => setBciAccuracy(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Total Trials</label>
              <input
                type="number"
                min="10"
                max="500"
                value={trialsCount}
                onChange={(e) => setTrialsCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Successful Intent</label>
              <input
                type="number"
                min="0"
                max={trialsCount}
                value={successfulCommands}
                onChange={(e) => setSuccessfulCommands(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Focus Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={focusScore}
                onChange={(e) => setFocusScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Fatigue Index</label>
              <input
                type="number"
                min="0"
                max="100"
                value={fatigueIndex}
                onChange={(e) => setFatigueIndex(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Session Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Doctor Assessment</label>
            <textarea
              rows={2}
              value={doctorAssessment}
              onChange={(e) => setDoctorAssessment(e.target.value)}
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
              {isSubmitting ? 'Saving Session...' : 'Save Session Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
