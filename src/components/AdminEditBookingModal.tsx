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
  Save
} from 'lucide-react';
import { AppointmentBooking } from '../types';
import { updateAppointmentBooking } from '../firebase';

interface AdminEditBookingModalProps {
  booking: AppointmentBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DOCTORS = [
  { name: 'Dr. Riley Chen, MD', specialty: 'Chief Neurotechnologist & BCI Lead' },
  { name: 'Dr. Marcus Vance, MD', specialty: 'Spinal Cord & Tetraplegia Rehab Specialist' },
  { name: 'Dr. Alena Rostova, MD, PhD', specialty: 'Vascular Neurologist & Neurofeedback Director' },
  { name: 'Dr. Jonathan Blake, MD', specialty: 'ICU Critical Care & Neuro-Monitoring' }
];

export const AdminEditBookingModal: React.FC<AdminEditBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !booking) return null;

  const [status, setStatus] = useState<AppointmentBooking['status']>(booking.status);
  const [doctorName, setDoctorName] = useState(booking.doctorName);
  const [specialty, setSpecialty] = useState(booking.specialty || '');
  const [appointmentDate, setAppointmentDate] = useState(booking.appointmentDate);
  const [appointmentTime, setAppointmentTime] = useState(booking.appointmentTime);
  const [urgency, setUrgency] = useState<AppointmentBooking['urgency']>(booking.urgency || 'routine');
  const [clinicalNotes, setClinicalNotes] = useState(booking.clinicalNotes || '');
  const [contactPhone, setContactPhone] = useState(booking.contactPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDoctorChange = (name: string) => {
    setDoctorName(name);
    const docObj = DOCTORS.find((d) => d.name === name);
    if (docObj) {
      setSpecialty(docObj.specialty);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await updateAppointmentBooking(booking.id, {
        status,
        doctorName,
        specialty,
        appointmentDate,
        appointmentTime,
        urgency,
        clinicalNotes,
        contactPhone,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update booking:', err);
      setErrorMsg(err?.message || 'Failed to update booking. Please check network/permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="admin-edit-booking-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="admin-edit-booking-modal"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Manage & Reschedule Clinical Booking</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ADMIN CONSOLE
                </span>
              </h2>
              <div className="text-[11px] font-mono text-slate-400">
                Ref ID: {booking.id}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Patient Overview Card */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">PATIENT TARGET</div>
              <div className="font-bold text-white text-sm mt-0.5">
                {booking.patientName} <span className="text-slate-400 font-mono text-xs">({booking.patientId})</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Booked by: <span className="text-slate-300 font-mono">{booking.userEmail}</span> ({booking.userName})
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase">PARADIGM</div>
              <div className="text-xs font-semibold text-blue-300 mt-0.5 max-w-[200px] truncate">
                {booking.sessionType}
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Booking Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['confirmed', 'pending', 'completed', 'cancelled'] as const).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all border ${
                    status === st
                      ? st === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : st === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : st === 'completed'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
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
                <span>Session Time</span>
              </label>
              <input
                type="text"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                placeholder="e.g. 10:30 AM"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Attending Physician */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Stethoscope size={13} className="text-blue-400" />
              <span>Assigned Physician / Lead</span>
            </label>
            <select
              value={doctorName}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {DOCTORS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="routine">Routine Clinical Care</option>
                <option value="priority">Priority BCI Recalibration</option>
                <option value="urgent">Urgent Neurological Review</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Caregiver / Patient Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Clinical Instructions / Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" />
              <span>Admin & Physician Directives</span>
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter instructions for pre-trial scalp preparation, electrode gel, or dosage changes..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 resize-none text-xs"
            />
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
