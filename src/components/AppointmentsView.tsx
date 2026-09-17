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
  ChevronRight,
  HeartPulse,
  Sparkles,
  Shield
} from 'lucide-react';
import { Patient, AppointmentBooking } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToUserBookings,
  cancelAppointmentBooking,
  getStoredBookings
} from '../firebase';

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
  const {
    user,
    userProfile,
    isAdmin,
    isPatient,
    isCaregiver,
    isDoctor,
    openAuthModal,
    demoSignIn
  } = useAuth();

  // Initialize with cached bookings immediately so nothing flickers or vanishes on refresh
  const [bookings, setBookings] = useState<AppointmentBooking[]>(() => getStoredBookings());
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'my' | 'all'>('my');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [recentBookingId, setRecentBookingId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('np_last_booking_id');
    } catch {
      return null;
    }
  });

  // Subscribe to bookings (synchronizes Local Cache, Server DB, and Firestore)
  useEffect(() => {
    const filterOptions = user
      ? { userId: user.uid, userEmail: user.email || undefined }
      : undefined;

    // Load initial immediate list
    const current = getStoredBookings(filterOptions?.userId, filterOptions?.userEmail);
    if (current && current.length > 0) {
      setBookings(current);
    }

    const unsubscribe = subscribeToUserBookings(
      filterOptions,
      (updatedList) => {
        if (Array.isArray(updatedList)) {
          setBookings(updatedList);
        }
        setLoadingBookings(false);
      },
      (error) => {
        console.warn('Real-time bookings subscription notice:', error);
        setLoadingBookings(false);
      }
    );

    // Also listen to local window updates for instant responsiveness
    const handleLocalUpdate = (e: any) => {
      if (e?.detail?.id) {
        setRecentBookingId(e.detail.id);
      }
      const fresh = getStoredBookings(filterOptions?.userId, filterOptions?.userEmail);
      setBookings(fresh);
    };
    window.addEventListener('neuropulse_bookings_updated', handleLocalUpdate);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      window.removeEventListener('neuropulse_bookings_updated', handleLocalUpdate);
    };
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this BCI rehabilitation appointment?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelAppointmentBooking(bookingId);
      // update local state immediately
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
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

  // If user chooses "all", show entire persistent clinic registry
  const displayBookings = React.useMemo(() => {
    let source = bookings;
    if (viewScope === 'all') {
      source = getStoredBookings();
    }
    return source.filter((b) => {
      if (filterStatus === 'all') return true;
      return b.status === filterStatus;
    });
  }, [bookings, viewScope, filterStatus]);

  // Role Badge Helper
  const renderRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold">
          <Shield size={13} className="text-amber-400" />
          <span>Clinical Director (Admin)</span>
        </span>
      );
    }
    if (isPatient) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
          <Brain size={13} className="text-emerald-400" />
          <span>Patient Account: {userProfile?.displayName || user?.email}</span>
        </span>
      );
    }
    if (isCaregiver) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold">
          <HeartPulse size={13} className="text-purple-400" />
          <span>Caregiver: {userProfile?.displayName || user?.email}</span>
        </span>
      );
    }
    if (isDoctor) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-semibold">
          <Stethoscope size={13} className="text-blue-400" />
          <span>Attending Physician (MD): {userProfile?.displayName || user?.email}</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div id="appointments-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Primary Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">
                BCI Rehabilitation & Clinical Appointments
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Triple-Sync (Local + REST + Cloud)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Schedule motor neurofeedback sessions, physician assessments, and P300 spelling recalibrations
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
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* Role & Authentication Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-300">Signed in as</span>
              {renderRoleBadge()}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Currently viewing clinical registry in <strong>Guest / Preview Mode</strong></span>
            </div>
          )}
        </div>

        {/* Quick Auth Actions */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <button
                id="btn-quick-signin-banner"
                onClick={() => openAuthModal('signin')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
              <button
                id="btn-quick-signup-banner"
                onClick={() => openAuthModal('signup')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <UserPlus size={13} />
                <span>Create Patient Account</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Toggle My Bookings vs All Bookings */}
              <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  id="tab-view-my-bookings"
                  onClick={() => setViewScope('my')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    viewScope === 'my'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  My Appointments ({bookings.length})
                </button>
                <button
                  id="tab-view-all-bookings"
                  onClick={() => setViewScope('all')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    viewScope === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Clinical Registry ({getStoredBookings().length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Bookings</div>
          <div className="text-xl font-bold text-white mt-1">{displayBookings.length}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-emerald-400">Confirmed</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {displayBookings.filter((b) => b.status === 'confirmed').length}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-amber-400">Pending Review</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {displayBookings.filter((b) => b.status === 'pending').length}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-purple-400">Sync Pipeline</div>
          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firestore + Node DB</span>
          </div>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter size={13} />
            <span>Status:</span>
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
          Displaying {displayBookings.length} appointment records
        </div>
      </div>

      {/* Bookings List Cards or Empty Fallback */}
      <div className="space-y-3">
        {loadingBookings ? (
          <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-xs font-medium">Synchronizing appointment ledger...</div>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-base font-semibold text-white">No Appointments Found</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {filterStatus === 'all'
                  ? "No scheduled appointments in this view. Click below to book a new BCI clinical session."
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
            {displayBookings.map((booking) => {
              const isConfirmed = booking.status === 'confirmed';
              const isCancelled = booking.status === 'cancelled';
              const isNewlyCreated = recentBookingId === booking.id;
              const patientObj = patients.find((p) => p.id === booking.patientId);

              return (
                <div
                  key={booking.id}
                  id={`booking-card-${booking.id}`}
                  className={`bg-slate-900/70 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                    isNewlyCreated
                      ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                      : isCancelled
                      ? 'border-slate-800/60 opacity-60'
                      : 'border-slate-800 hover:border-blue-500/40 shadow-sm'
                  }`}
                >
                  {isNewlyCreated && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-mono text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={10} />
                      <span>Just Booked</span>
                    </div>
                  )}

                  <div>
                    {/* Top card header */}
                    <div className="flex items-start justify-between gap-3 mb-3 pr-14">
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
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-semibold">
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
                          <div className="text-[10px] text-slate-500 font-mono">APPOINTMENT DATE</div>
                          <div className="font-semibold text-white">{booking.appointmentDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-emerald-400" />
                        <div>
                          <div className="text-[10px] text-slate-500 font-mono">TIME SLOT</div>
                          <div className="font-semibold text-white">{booking.appointmentTime}</div>
                        </div>
                      </div>
                    </div>

                    {/* Patient and contact details */}
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-slate-400" />
                        <span>
                          Patient: <strong className="text-white">{booking.patientName}</strong> ({booking.patientId})
                        </span>
                      </div>
                      {patientObj && (
                        <button
                          onClick={() => {
                            onSelectPatient(patientObj);
                            onNavigateTab('Live Telemetry');
                          }}
                          className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1 font-medium transition-colors"
                        >
                          <span>Telemetry</span>
                          <ChevronRight size={12} />
                        </button>
                      )}
                    </div>

                    {/* Booked by contact info */}
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mb-2 font-mono">
                      <span>Booked by: {booking.userName || booking.userEmail}</span>
                      {booking.contactPhone && <span>• Tel: {booking.contactPhone}</span>}
                    </div>

                    {/* Clinical Notes */}
                    {booking.clinicalNotes && (
                      <div className="text-[11px] text-slate-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/70 mb-3 flex items-start gap-1.5">
                        <FileText size={12} className="text-slate-500 shrink-0 mt-0.5" />
                        <span className="italic line-clamp-2">{booking.clinicalNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Logged: {new Date(booking.createdAt).toLocaleDateString()}
                    </span>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* Clinical FAQ & Protocol overview */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-semibold">
          <Activity size={14} className="text-blue-400" />
          <span>Clinical Appointment Protocols & Persistence</span>
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
            <div className="font-semibold text-slate-200 mb-1">Durable Triple-Persistence</div>
            <div>Every booking is immediately cached in local browser storage, persisted to the backend REST API, and synchronized to Firebase Cloud.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
