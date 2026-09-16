import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  FileText,
  Filter,
  ShieldCheck,
  Brain,
  LogIn,
  UserPlus,
  RefreshCw,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Patient, AppointmentBooking } from '../types';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserBookings, cancelAppointmentBooking } from '../firebase';

interface AppointmentsViewProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onOpenBookingModal: () => void;
  onSelectPatient: (patient: Patient) => void;
  onNavigateTab: (tab: any) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  patients,
  selectedPatient,
  onOpenBookingModal,
  onSelectPatient,
  onNavigateTab,
}) => {
  const { user, userProfile, isAdmin, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState<AppointmentBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Subscribe to user bookings when logged in
  useEffect(() => {
    if (!user) {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }

    setLoadingBookings(true);
    const unsubscribe = subscribeToUserBookings(
      user.uid,
      (updatedList) => {
        setBookings(updatedList);
        setLoadingBookings(false);
      },
      (error) => {
        console.warn('Real-time bookings subscription error:', error);
        setLoadingBookings(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this BCI rehabilitation appointment?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelAppointmentBooking(bookingId);
      // update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const copyRefId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  return (
    <div id="appointments-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>BCI Rehabilitation & Clinical Appointments</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Firestore Cloud
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Schedule neuro-rehabilitation trials, physician evaluations, and real-time EEG montage calibrations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-nav-to-admin"
            onClick={() => onNavigateTab && onNavigateTab('Admin Portal')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <ShieldCheck size={15} className={isAdmin ? 'text-amber-400' : 'text-slate-400'} />
            <span>{isAdmin ? 'Admin Console' : 'Admin Portal'}</span>
          </button>

          <button
            id="btn-schedule-session-main"
            onClick={onOpenBookingModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* Unauthenticated Prompt Banner */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <ShieldCheck size={14} />
              <span>Firebase Account Required</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Sign In to Store & Track Your Clinical Bookings
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your appointments, patient telemetry associations, and clinical doctor prescriptions are securely persisted in your Firebase database (<strong>eeg-single-channel</strong>). Create an account or sign in to proceed with booking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              id="btn-auth-banner-signin"
              onClick={() => openAuthModal('signin', 'Sign in to access your appointments and book sessions')}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
            <button
              id="btn-auth-banner-signup"
              onClick={() => openAuthModal('signup', 'Create a new account to book your first BCI rehabilitation appointment')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Authenticated user stats & filter bar */}
      {user && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-slate-400">Total Bookings</div>
              <div className="text-xl font-bold text-white mt-1">{bookings.length}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-emerald-400">Confirmed</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {bookings.filter((b) => b.status === 'confirmed').length}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-blue-400">Caregiver Account</div>
              <div className="text-xs font-semibold text-white mt-1 truncate">
                {userProfile?.displayName || user.email}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-purple-400">Sync Status</div>
              <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Live</span>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter size={13} />
                <span>Filter:</span>
              </span>
              {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg capitalize text-xs font-medium transition-colors ${
                    filterStatus === st
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Showing {filteredBookings.length} of {bookings.length} records
            </div>
          </div>
        </div>
      )}

      {/* Bookings List or Empty State */}
      {user && (
        <div className="space-y-3">
          {loadingBookings ? (
            <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-xs font-medium">Syncing appointments with Firebase Firestore...</div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Calendar size={24} />
              </div>
              <div>
                <div className="text-base font-semibold text-white">No Appointments Found</div>
                <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {filterStatus === 'all'
                    ? "You haven't scheduled any BCI sessions yet. Click below to book an appointment with our clinical team."
                    : `No appointments with status '${filterStatus}'.`}
                </div>
              </div>
              <button
                onClick={onOpenBookingModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Schedule First Appointment</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookings.map((booking) => {
                const isConfirmed = booking.status === 'confirmed';
                const isCancelled = booking.status === 'cancelled';
                const patientObj = patients.find((p) => p.id === booking.patientId);

                return (
                  <div
                    key={booking.id}
                    id={`booking-card-${booking.id}`}
                    className={`bg-slate-900/70 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all ${
                      isCancelled
                        ? 'border-slate-800/60 opacity-60'
                        : 'border-slate-800 hover:border-blue-500/40 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Top card header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                              isConfirmed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isCancelled
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {booking.status}
                          </span>

                          {booking.urgency && booking.urgency !== 'routine' && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                              {booking.urgency}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                          <span>Ref: {booking.id.slice(0, 14)}...</span>
                          <button
                            onClick={() => copyRefId(booking.id)}
                            className="p-1 hover:text-white transition-colors"
                            title="Copy Booking ID"
                          >
                            <Copy size={12} className={copiedId === booking.id ? 'text-emerald-400' : ''} />
                          </button>
                        </div>
                      </div>

                      {/* Title & Paradigm */}
                      <div className="mb-3">
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                          <span>{booking.sessionType}</span>
                        </h3>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          <Stethoscope size={13} className="text-blue-400 shrink-0" />
                          <span className="font-semibold text-slate-300">{booking.doctorName}</span>
                          {booking.specialty && (
                            <span className="text-[11px] text-slate-400 hidden sm:inline">• {booking.specialty}</span>
                          )}
                        </div>
                      </div>

                      {/* Date & Time block */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-400" />
                          <div>
                            <div className="text-[10px] text-slate-500 font-mono">DATE</div>
                            <div className="font-semibold text-white">{booking.appointmentDate}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-emerald-400" />
                          <div>
                            <div className="text-[10px] text-slate-500 font-mono">TIME</div>
                            <div className="font-semibold text-white">{booking.appointmentTime}</div>
                          </div>
                        </div>
                      </div>

                      {/* Patient information */}
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-400" />
                          <span>Patient: <strong className="text-white">{booking.patientName}</strong> ({booking.patientId})</span>
                        </div>
                        {patientObj && (
                          <button
                            onClick={() => {
                              onSelectPatient(patientObj);
                              onNavigateTab('Live Telemetry');
                            }}
                            className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1 font-medium transition-colors"
                          >
                            <span>Live EEG</span>
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>

                      {/* Notes if present */}
                      {booking.clinicalNotes && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded-lg border border-slate-800/70 mb-3 flex items-start gap-1.5">
                          <FileText size={12} className="text-slate-500 shrink-0 mt-0.5" />
                          <span className="italic line-clamp-2">{booking.clinicalNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Booked: {new Date(booking.createdAt).toLocaleDateString()}
                      </span>

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Appointment'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Clinical FAQ & Protocol overview */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <Activity size={14} className="text-blue-400" />
          <span>Clinical Appointment Protocols</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1">Pre-Session Preparation</div>
            <div>Scalp must be clean and free of oils. Attending nurse performs 10-20 international montage impedance verification (&lt;5 kΩ).</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1">Fatigue Safeguard</div>
            <div>Trials automatically pause if cognitive fatigue exceeds 65% to prevent neurological exhaustion in ALS or tetraplegic patients.</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1">Cloud Synchronization</div>
            <div>All session logs, doctor prescriptions, and motor imagery accuracies synchronize with Firebase Firestore in real time.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
