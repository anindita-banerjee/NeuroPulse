import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import { Patient, AppointmentBooking } from '../types';
import { adminCreateBooking } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface AdminNewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  selectedPatient: Patient | null;
  onSuccess?: (booking: AppointmentBooking) => void;
}

const DOCTORS = [
  { name: 'Dr. Riley Chen, MD', specialty: 'Chief Neurotechnologist & BCI Lead' },
  { name: 'Dr. Marcus Vance, MD', specialty: 'Spinal Cord & Tetraplegia Rehab Specialist' },
  { name: 'Dr. Alena Rostova, MD, PhD', specialty: 'Vascular Neurologist & Neurofeedback Director' },
  { name: 'Dr. Jonathan Blake, MD', specialty: 'ICU Critical Care & Neuro-Monitoring' }
];

const PARADIGMS = [
  'Motor Imagery Neuro-Rehabilitation (ERD/ERS)',
  'P300 Speller & Assistive AAC Communication',
  'SSVEP High-Speed Neuro-Robotic Control',
  '10-20 Scalp Montage & Baseline QEEG Impedance Setup',
  'Attending Neurologist Consultation & Rx Review',
  'Neuroplasticity Recalibration & Assistive Exoskeleton Tuning'
];

const TIME_SLOTS = [
  '08:30 AM',
  '09:30 AM',
  '10:45 AM',
  '11:30 AM',
  '01:15 PM',
  '02:30 PM',
  '03:45 PM',
  '05:00 PM'
];

export const AdminNewBookingModal: React.FC<AdminNewBookingModalProps> = ({
  isOpen,
  onClose,
  patients,
  selectedPatient,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const { user } = useAuth();

  const [useExistingPatient, setUseExistingPatient] = useState(true);
  const [patientId, setPatientId] = useState(selectedPatient?.id || patients[0]?.id || 'NP-2408');
  const [customPatientName, setCustomPatientName] = useState('');
  const [customPatientId, setCustomPatientId] = useState('');

  const [userEmail, setUserEmail] = useState('patient.care@hospital.org');
  const [userName, setUserName] = useState('Clinical Care Team');
  const [contactPhone, setContactPhone] = useState('+1 (555) 329-8421');

  const [doctorName, setDoctorName] = useState(DOCTORS[0].name);
  const [specialty, setSpecialty] = useState(DOCTORS[0].specialty);
  const [sessionType, setSessionType] = useState(PARADIGMS[0]);

  // Tomorrow's date as default
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState(tomorrowStr);
  const [appointmentTime, setAppointmentTime] = useState(TIME_SLOTS[1]);
  const [urgency, setUrgency] = useState<AppointmentBooking['urgency']>('priority');
  const [status, setStatus] = useState<AppointmentBooking['status']>('confirmed');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDoctorSelect = (name: string) => {
    setDoctorName(name);
    const d = DOCTORS.find((doc) => doc.name === name);
    if (d) setSpecialty(d.specialty);
  };

  const getTargetPatientName = () => {
    if (useExistingPatient) {
      const p = patients.find((pat) => pat.id === patientId);
      return p ? p.name : 'Unknown Patient';
    }
    return customPatientName.trim() || 'Unassigned Patient';
  };

  const getTargetPatientId = () => {
    if (useExistingPatient) {
      return patientId;
    }
    return customPatientId.trim() || `NP-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const targetPatientName = getTargetPatientName();
    const targetPatientId = getTargetPatientId();

    try {
      const created = await adminCreateBooking({
        userId: user?.uid || 'admin-system',
        userEmail: userEmail.trim(),
        userName: userName.trim(),
        patientId: targetPatientId,
        patientName: targetPatientName,
        doctorName,
        specialty,
        appointmentDate,
        appointmentTime,
        sessionType,
        contactPhone: contactPhone.trim(),
        clinicalNotes: clinicalNotes.trim(),
        urgency,
        status,
      });

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create booking as admin:', err);
      setErrorMsg(err?.message || 'Failed to save booking. Please check database connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="admin-new-booking-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="admin-new-booking-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Create Clinical Booking (Admin Console)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  FIRESTORE LIVE
                </span>
              </h2>
              <div className="text-[11px] text-slate-400">
                Direct administrative entry for clinical trials and specialist reviews
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Patient Target Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-blue-400" />
                <span>Target Patient</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUseExistingPatient(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    useExistingPatient ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setUseExistingPatient(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    !useExistingPatient ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Custom Patient
                </button>
              </div>
            </div>

            {useExistingPatient ? (
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — {p.paralysisType} • Room {p.roomBed}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Patient Full Name"
                  value={customPatientName}
                  onChange={(e) => setCustomPatientName(e.target.value)}
                  required={!useExistingPatient}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Hospital ID (e.g. NP-9901)"
                  value={customPatientId}
                  onChange={(e) => setCustomPatientId(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Account / Caregiver Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail size={13} className="text-blue-400" />
                <span>Contact Email</span>
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-emerald-400" />
                <span>Contact Name</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-purple-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Session Paradigm */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Activity size={13} className="text-blue-400" />
              <span>Rehabilitation / Assessment Paradigm</span>
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {PARADIGMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Attending Doctor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Stethoscope size={13} className="text-emerald-400" />
              <span>Assigned Physician / Specialist</span>
            </label>
            <select
              value={doctorName}
              onChange={(e) => handleDoctorSelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {DOCTORS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-400" />
                <span>Appointment Date</span>
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-400" />
                <span>Scheduled Time Slot</span>
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="confirmed">Confirmed (Scheduled)</option>
                <option value="pending">Pending Clinical Approval</option>
                <option value="completed">Completed (Post-Session Log)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Clinical Priority
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="routine">Routine Care</option>
                <option value="priority">Priority Recalibration</option>
                <option value="urgent">Urgent Neurological Review</option>
              </select>
            </div>
          </div>

          {/* Clinical Instructions / Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" />
              <span>Physician Directives & Electrode Preparation Notes</span>
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Conduct pre-session impedance check on C3/C4; ensure patient is well-rested; review anti-spasticity pharmacotherapy."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 resize-none text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus size={15} />
              <span>{isSubmitting ? 'Booking Session...' : 'Create Clinical Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
