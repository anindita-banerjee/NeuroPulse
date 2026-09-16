import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Patient, AppointmentBooking } from '../types';
import { useAuth } from '../context/AuthContext';
import { createAppointmentBooking } from '../firebase';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  selectedPatient: Patient | null;
  onBookingSuccess?: (booking: AppointmentBooking) => void;
}

const DOCTOR_OPTIONS = [
  {
    name: 'Dr. Riley Chen, MD',
    specialty: 'Chief Neurotechnologist & BCI Lead',
    license: 'MD-883921',
    hospital: 'NeuroPulse Clinical Brain Institute',
  },
  {
    name: 'Dr. Marcus Vance, MD',
    specialty: 'Spinal Cord & Tetraplegia Rehab Specialist',
    license: 'MD-771204',
    hospital: 'Institute of Neuro-Trauma Rehabilitation',
  },
  {
    name: 'Dr. Alena Rostova, MD, PhD',
    specialty: 'Vascular Neurologist & Neurofeedback Director',
    license: 'MD-904322',
    hospital: 'University Stroke & Motor Recovery Center',
  },
];

const SESSION_TYPES = [
  {
    id: 'Motor Imagery Neuro-Rehabilitation',
    duration: '45 mins',
    desc: 'Contralateral sensorimotor rhythm desynchronization (ERD) rehabilitation',
    badge: 'Motor ERD',
  },
  {
    id: 'P300 Speller & Assistive AAC Training',
    duration: '45 mins',
    desc: 'Visual oddball paradigm calibration for paralyzed communication & ICU alerts',
    badge: 'P300 AAC',
  },
  {
    id: '10-20 Scalp Montage & High-Density Impedance Setup',
    duration: '60 mins',
    desc: 'Gel impedance optimization, baseline spectral mapping (Delta/Theta/Alpha/Beta)',
    badge: 'Telemetry',
  },
  {
    id: 'Attending Neurologist Consultation & Rx Review',
    duration: '30 mins',
    desc: 'Clinical evaluation, pharmacotherapy adjustment, and BCI threshold tuning',
    badge: 'Clinical Rx',
  },
  {
    id: 'Neuroplasticity Recalibration & Assistive Exoskeleton Tuning',
    duration: '50 mins',
    desc: 'Fine-tuning robotic brace triggering and neuro-muscular stimulation integration',
    badge: 'Exoskeleton',
  },
];

const TIME_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '11:45 AM',
  '01:15 PM',
  '02:30 PM',
  '04:00 PM',
  '05:15 PM',
];

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  patients,
  selectedPatient,
  onBookingSuccess,
}) => {
  const { user, userProfile, openAuthModal } = useAuth();

  // Selected state
  const [patientId, setPatientId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>(DOCTOR_OPTIONS[0].name);
  const [sessionType, setSessionType] = useState<string>(SESSION_TYPES[0].id);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>(TIME_SLOTS[1]);
  const [urgency, setUrgency] = useState<'routine' | 'priority' | 'urgent'>('routine');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successBooking, setSuccessBooking] = useState<AppointmentBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default date to tomorrow and default patient
  useEffect(() => {
    if (selectedPatient) {
      setPatientId(selectedPatient.id);
    } else if (patients.length > 0) {
      setPatientId(patients[0].id);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setAppointmentDate(dateStr);

    if (userProfile?.phone) {
      setContactPhone(userProfile.phone);
    }
  }, [selectedPatient, patients, userProfile]);

  if (!isOpen) return null;

  const currentPatient = patients.find((p) => p.id === patientId) || selectedPatient;
  const currentDoctor = DOCTOR_OPTIONS.find((d) => d.name === doctorId) || DOCTOR_OPTIONS[0];

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // CRITICAL: If user is not logged in, prompt sign in / sign up first!
    if (!user) {
      openAuthModal(
        'signup',
        'Please sign in or create an account to book your EEG-BCI clinical appointment.',
        () => {
          // After auth completes, user can finish booking
        }
      );
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      setErrorMessage('Please select both a date and time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = await createAppointmentBooking({
        userId: user.uid,
        userEmail: user.email || '',
        userName: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'Patient / Caregiver',
        patientId: currentPatient?.id || 'NP-2401',
        patientName: currentPatient?.name || 'Assigned Patient',
        doctorName: currentDoctor.name,
        specialty: currentDoctor.specialty,
        appointmentDate,
        appointmentTime,
        sessionType,
        contactPhone: contactPhone.trim(),
        clinicalNotes: clinicalNotes.trim(),
        urgency,
        status: 'confirmed',
      });

      setSuccessBooking(newBooking);
      if (onBookingSuccess) {
        onBookingSuccess(newBooking);
      }
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMessage(err.message || 'Failed to save appointment. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSuccessBooking(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      id="appointment-booking-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="appointment-booking-modal"
        className="w-full max-w-2xl bg-[#0c1220] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 via-slate-900 to-indigo-950/40 p-4 sm:p-5 border-b border-slate-800 relative">
          <button
            id="btn-close-booking-modal"
            onClick={resetAndClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Calendar size={22} />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Schedule BCI Clinical Session</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Firebase Sync
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Book personalized brain-computer interface calibration & physician consultations
              </div>
            </div>
          </div>

          {/* User auth state banner */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            {user ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={15} />
                <span className="text-slate-300">
                  Booking as <strong className="text-white">{userProfile?.displayName || user.email}</strong> ({userProfile?.role || 'User'})
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-300">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-amber-400 shrink-0" />
                  <span>Sign in required before appointment can be finalized.</span>
                </div>
                <button
                  type="button"
                  onClick={() => openAuthModal('signin', 'Sign in to finalize your appointment booking')}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] transition-colors shadow-sm ml-2 shrink-0"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content body */}
        {successBooking ? (
          /* Confirmation Screen */
          <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <div className="text-xl font-bold text-white">Appointment Confirmed!</div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Booking Reference ID: <span className="text-blue-400 font-bold">{successBooking.id}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left space-y-2.5 max-w-md mx-auto text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-white">{successBooking.patientName} ({successBooking.patientId})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Specialist:</span>
                <span className="font-semibold text-white">{successBooking.doctorName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-blue-400 font-mono">
                  {successBooking.appointmentDate} at {successBooking.appointmentTime}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Session Type:</span>
                <span className="font-semibold text-slate-200">{successBooking.sessionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Stored in Cloud:</span>
                <span className="text-emerald-400 font-mono font-semibold">eeg-single-channel (Firestore)</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 max-w-md mx-auto">
              Our clinical staff will review the electrode montages and patient baseline telemetry prior to the session.
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
              >
                View in Appointments
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBookSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Patient & Doctor Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User size={14} className="text-blue-400" />
                  <span>Paralysis Patient</span>
                </label>
                <select
                  id="select-booking-patient"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) — {p.paralysisType}
                    </option>
                  ))}
                </select>
                {currentPatient && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    Room {currentPatient.roomBed} • Stage: {currentPatient.clinicalStage}
                  </div>
                )}
              </div>

              {/* Attending Physician */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-emerald-400" />
                  <span>Attending Neuro-Specialist</span>
                </label>
                <select
                  id="select-booking-doctor"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {DOCTOR_OPTIONS.map((doc) => (
                    <option key={doc.name} value={doc.name}>
                      {doc.name} — {doc.specialty}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-slate-400 mt-1">
                  Affiliation: {currentDoctor.hospital}
                </div>
              </div>
            </div>

            {/* Session Type selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Activity size={14} className="text-purple-400" />
                <span>Rehabilitation Paradigm / Session Type</span>
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {SESSION_TYPES.map((st) => {
                  const isSelected = sessionType === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSessionType(st.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-start justify-between ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="pr-3">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span>{st.id}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-blue-300">
                            {st.duration}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{st.desc}</div>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded shrink-0 uppercase ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {st.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-400" />
                  <span>Appointment Date</span>
                </label>
                <input
                  id="input-booking-date"
                  type="date"
                  value={appointmentDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-400" />
                  <span>Preferred Time Slot</span>
                </label>
                <select
                  id="select-booking-time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Urgency & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Clinical Urgency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['routine', 'priority', 'urgent'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`py-1.5 text-center text-xs font-medium rounded-lg capitalize border transition-all ${
                        urgency === lvl
                          ? lvl === 'urgent'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : lvl === 'priority'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  <span>Contact Phone (Caregiver / Nurse)</span>
                </label>
                <input
                  id="input-booking-phone"
                  type="tel"
                  placeholder="+1 (555) 392-0192"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-slate-400" />
                <span>Clinical Notes & Session Objectives</span>
              </label>
              <textarea
                id="textarea-booking-notes"
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Specific motor imagery focus (e.g. right wrist extension, P300 word calibration, or current muscle spasms)..."
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-appointment"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : !user ? (
                  <>
                    <Lock size={15} />
                    <span>Sign In & Book Appointment</span>
                  </>
                ) : (
                  <>
                    <Calendar size={15} />
                    <span>Confirm & Save Booking</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
