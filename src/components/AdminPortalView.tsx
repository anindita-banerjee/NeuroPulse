import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
  Key,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Phone,
  FileText,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { Patient, AppointmentBooking, ADMIN_EMAIL } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToAllBookings,
  updateAppointmentBooking,
  deleteAppointmentBooking,
} from '../firebase';
import { AdminNewBookingModal } from './AdminNewBookingModal';
import { AdminEditBookingModal } from './AdminEditBookingModal';

interface AdminPortalViewProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onNavigateTab: (tab: any) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onNavigateTab,
}) => {
  const { user, userProfile, isAdmin, adminSignIn, signOut } = useAuth();

  // Admin login credentials state (for login gate)
  const [adminEmailInput, setAdminEmailInput] = useState(ADMIN_EMAIL);
  const [adminPasswordInput, setAdminPasswordInput] = useState('besum1uve');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Bookings state
  const [bookings, setBookings] = useState<AppointmentBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [paradigmFilter, setParadigmFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'date_asc' | 'urgent'>('newest');

  // Modals state
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<AppointmentBooking | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subscribe to all bookings when admin is active
  useEffect(() => {
    if (!isAdmin) {
      setLoadingBookings(false);
      return;
    }

    setLoadingBookings(true);
    const unsubscribe = subscribeToAllBookings(
      (allBookings) => {
        setBookings(allBookings);
        setLoadingBookings(false);
      },
      (error) => {
        console.warn('Real-time all-bookings listener error:', error);
        setLoadingBookings(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isAdmin]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      await adminSignIn(adminEmailInput.trim(), adminPasswordInput);
    } catch (err: any) {
      console.error('Admin login error:', err);
      setLoginError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const fillDefaultAdminCredentials = () => {
    setAdminEmailInput(ADMIN_EMAIL);
    setAdminPasswordInput('besum1uve');
  };

  const copyBookingId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickStatusChange = async (
    bookingId: string,
    newStatus: AppointmentBooking['status']
  ) => {
    try {
      await updateAppointmentBooking(bookingId, { status: newStatus });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm(`Are you sure you want to permanently delete booking reference ${bookingId}?`)) {
      return;
    }

    setDeletingId(bookingId);
    try {
      await deleteAppointmentBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.error('Failed to delete booking:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const exportAuditCSV = () => {
    if (bookings.length === 0) return;

    const headers = [
      'Booking ID',
      'Patient ID',
      'Patient Name',
      'Caregiver Email',
      'Caregiver Name',
      'Attending Doctor',
      'Specialty',
      'Appointment Date',
      'Appointment Time',
      'Session Paradigm',
      'Urgency',
      'Status',
      'Contact Phone',
      'Clinical Directives',
      'Created At'
    ];

    const rows = filteredBookings.map((b) => [
      `"${b.id}"`,
      `"${b.patientId}"`,
      `"${b.patientName}"`,
      `"${b.userEmail}"`,
      `"${b.userName}"`,
      `"${b.doctorName}"`,
      `"${b.specialty || ''}"`,
      `"${b.appointmentDate}"`,
      `"${b.appointmentTime}"`,
      `"${b.sessionType}"`,
      `"${b.urgency || 'routine'}"`,
      `"${b.status}"`,
      `"${b.contactPhone || ''}"`,
      `"${(b.clinicalNotes || '').replace(/"/g, '""')}"`,
      `"${b.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `neuropulse_bookings_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered and sorted bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Status filter
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        // Urgency filter
        if (urgencyFilter !== 'all' && b.urgency !== urgencyFilter) return false;
        // Paradigm filter
        if (paradigmFilter !== 'all' && !b.sessionType.toLowerCase().includes(paradigmFilter.toLowerCase())) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPatient = b.patientName.toLowerCase().includes(q) || b.patientId.toLowerCase().includes(q);
          const matchDoctor = b.doctorName.toLowerCase().includes(q);
          const matchRef = b.id.toLowerCase().includes(q);
          const matchEmail = b.userEmail.toLowerCase().includes(q) || b.userName.toLowerCase().includes(q);
          const matchType = b.sessionType.toLowerCase().includes(q);
          if (!matchPatient && !matchDoctor && !matchRef && !matchEmail && !matchType) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'date_asc') {
          return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
        }
        if (sortOrder === 'urgent') {
          const score = (urg: string = 'routine') =>
            urg === 'urgent' ? 3 : urg === 'priority' ? 2 : 1;
          return score(b.urgency) - score(a.urgency);
        }
        // Newest first by creation
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [bookings, statusFilter, urgencyFilter, paradigmFilter, searchQuery, sortOrder]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const urgent = bookings.filter((b) => b.urgency === 'urgent' || b.urgency === 'priority').length;
    return { total, confirmed, pending, completed, cancelled, urgent };
  }, [bookings]);

  // -------------------------------------------------------------
  // VIEW: If not logged in as Admin, show Admin Gate
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div id="admin-login-gate" className="max-w-xl mx-auto py-12 px-4 animate-in fade-in duration-200">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Top lock icon & header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Key size={28} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Clinical Administration Portal
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Restricted management console for clinical trial oversight, appointment scheduling, and patient session governance.
            </p>
          </div>

          {/* Admin restriction banner */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-1">
            <div className="font-semibold text-blue-300 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Authorized Administrator Clearance</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Only authorized clinical directors can access full booking records and modify hospital schedules.
              Designated Admin: <strong className="font-mono text-white">{ADMIN_EMAIL}</strong>
            </p>
          </div>

          {/* If currently signed in as someone else */}
          {user && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>
                  Currently signed in as: <span className="font-mono font-semibold">{user.email}</span> ({userProfile?.role || 'user'}).
                </div>
                <div className="text-[11px] text-slate-300">
                  This account does not have administrative privileges. Log in with the Clinical Director credentials below.
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-blue-400" />
                <span>Admin Email Address</span>
              </label>
              <input
                type="email"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock size={13} className="text-emerald-400" />
                <span>Admin Password</span>
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Director Clearance...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>Sign In to Admin Portal</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={fillDefaultAdminCredentials}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium text-xs whitespace-nowrap transition-colors cursor-pointer"
                title="Fill demo credentials provided in instructions"
              >
                Fill Credentials
              </button>
            </div>
          </form>

          {/* Quick info notes */}
          <div className="border-t border-slate-800/80 pt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Firebase Security Rule: Enforced</span>
            <span className="font-mono">admin@neuropulse.org</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Authenticated Admin Portal Console
  // -------------------------------------------------------------
  return (
    <div id="admin-portal-console" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/10">
            <ShieldCheck size={24} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Clinical Director Admin Console
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                FULL CRUD ACCESS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {ADMIN_EMAIL}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervise all patient bookings, edit clinical schedules, reassign attending neurologists, and create administrative bookings
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportAuditCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Export all filtered bookings to CSV"
          >
            <Download size={14} className="text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-admin-add-booking"
            onClick={() => setIsNewBookingOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Booking</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Bookings</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-emerald-400">Confirmed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.confirmed}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-amber-400">Pending Approval</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-blue-400">Completed</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats.completed}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-rose-400">Cancelled</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{stats.cancelled}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-purple-400">Urgent / Priority</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{stats.urgent}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Patient Name, ID, Doctor, Booking Ref, or Caregiver Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick sorting dropdown */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <ArrowUpDown size={13} />
              <span>Sort:</span>
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest Created</option>
              <option value="date_asc">Session Date (Earliest First)</option>
              <option value="urgent">Urgency (Urgent First)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[11px] font-mono mr-1">STATUS:</span>
            {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] font-mono mr-1">URGENCY:</span>
            {(['all', 'routine', 'priority', 'urgent'] as const).map((urg) => (
              <button
                key={urg}
                onClick={() => setUrgencyFilter(urg)}
                className={`px-2.5 py-1 rounded-lg capitalize text-xs transition-colors ${
                  urgencyFilter === urg
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {urg}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </div>
      </div>

      {/* Bookings Table / Cards */}
      {loadingBookings ? (
        <div className="p-16 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-medium">Syncing comprehensive bookings registry from Firestore...</div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-16 text-center text-slate-400 space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-base font-semibold text-white">No Bookings Found</div>
            <div className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
                ? 'No bookings match your active filters. Clear search or reset status filters.'
                : 'The clinical schedule is currently empty. Click below to add the first appointment from the admin console.'}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            {(searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setUrgencyFilter('all');
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={() => setIsNewBookingOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus size={15} />
              <span>Create Admin Booking</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Patient Target</th>
                  <th className="py-3 px-4">Caregiver / Account</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Session Date & Time</th>
                  <th className="py-3 px-4">Paradigm & Urgency</th>
                  <th className="py-3 px-4">Status & Switcher</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredBookings.map((b) => {
                  const patientObj = patients.find((p) => p.id === b.patientId);
                  const isConfirmed = b.status === 'confirmed';
                  const isCancelled = b.status === 'cancelled';
                  const isCompleted = b.status === 'completed';

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Ref ID */}
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span>{b.id.slice(0, 14)}...</span>
                          <button
                            onClick={() => copyBookingId(b.id)}
                            className="p-1 hover:text-white transition-colors"
                            title="Copy full Booking ID"
                          >
                            <Copy
                              size={12}
                              className={copiedId === b.id ? 'text-emerald-400' : ''}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{b.patientName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({b.patientId})</span>
                        </div>
                        {patientObj && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {patientObj.paralysisType} • Rm {patientObj.roomBed}
                          </div>
                        )}
                      </td>

                      {/* Caregiver */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-200">{b.userEmail}</div>
                        <div className="text-[10px] text-slate-400">
                          {b.userName} {b.contactPhone ? `• ${b.contactPhone}` : ''}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Stethoscope size={12} className="text-blue-400 shrink-0" />
                          <span>{b.doctorName}</span>
                        </div>
                        {b.specialty && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {b.specialty}
                          </div>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <Calendar size={12} className="text-blue-400" />
                          <span>{b.appointmentDate}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <Clock size={11} className="text-emerald-400" />
                          <span>{b.appointmentTime}</span>
                        </div>
                      </td>

                      {/* Paradigm & Urgency */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-blue-300 max-w-[180px] truncate">
                          {b.sessionType}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              b.urgency === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : b.urgency === 'priority'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {b.urgency || 'routine'}
                          </span>
                        </div>
                      </td>

                      {/* Status & Inline Switcher */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={b.status}
                          onChange={(e) =>
                            handleQuickStatusChange(b.id, e.target.value as any)
                          }
                          className={`text-[11px] font-semibold font-mono rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                            isConfirmed
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isCompleted
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : isCancelled
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          <option value="confirmed">CONFIRMED</option>
                          <option value="pending">PENDING</option>
                          <option value="completed">COMPLETED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {patientObj && (
                            <button
                              onClick={() => {
                                onSelectPatient(patientObj);
                                onNavigateTab('Live Telemetry');
                              }}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 rounded-lg transition-colors"
                              title="Inspect Live EEG Telemetry"
                            >
                              <Activity size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingBooking(b)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit / Reschedule Booking"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            disabled={deletingId === b.id}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-lg transition-colors disabled:opacity-50"
                            title="Permanently Delete Booking"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Modals */}
      <AdminNewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        patients={patients}
        selectedPatient={selectedPatient}
        onSuccess={(newB) => {
          setBookings((prev) => [newB, ...prev]);
        }}
      />

      <AdminEditBookingModal
        booking={editingBooking}
        isOpen={Boolean(editingBooking)}
        onClose={() => setEditingBooking(null)}
        onSuccess={() => {
          // Trigger local refresh
        }}
      />
    </div>
  );
};
