import React, { useState } from 'react';
import {
  Menu,
  FileDown,
  Activity,
  AlertTriangle,
  ChevronDown,
  Radio,
  Zap,
  UserCheck,
  Calendar,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { Patient } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onOpenMobileMenu?: () => void;
  onExportReport: () => void;
  onEmergencyAlert: () => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onOpenBookingModal: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onOpenMobileMenu,
  onExportReport,
  onEmergencyAlert,
  isStreaming,
  onToggleStreaming,
  onOpenBookingModal,
  onNavigateTab,
}) => {
  const { user, userProfile, isAdmin, openAuthModal, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header
      id="app-header"
      className="h-16 border-b border-slate-800/80 bg-[#0a0f1c]/90 backdrop-blur sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu button */}
        {onOpenMobileMenu && (
          <button
            id="btn-open-mobile-menu"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Live Session Breadcrumb */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <span className="text-slate-400">Workspace</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            SESSION #NP-{selectedPatient?.id.replace('NP-', '') || '2408'}
          </span>
        </div>

        {/* Patient Switcher Dropdown */}
        <div className="relative group ml-1">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 hover:border-blue-500/50 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all cursor-pointer">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-left">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="truncate max-w-[100px] sm:max-w-none">{selectedPatient?.name || 'Select Patient'}</span>
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded hidden sm:inline">
                  {selectedPatient?.id}
                </span>
                <ChevronDown size={13} className="text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-[200px]">
                {selectedPatient?.diagnosis || 'Paralysis patient'}
              </div>
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="absolute left-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2 py-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              SWITCH PARALYSIS PATIENT
            </div>
            {patients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  id={`select-patient-${p.id.toLowerCase()}`}
                  onClick={() => onSelectPatient(p)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {p.name}
                      <span className="text-[10px] font-mono text-slate-400">({p.id})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                      {p.paralysisType}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      p.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : p.status === 'stable'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Book Appointment Action */}
        <button
          id="btn-header-book-appointment"
          onClick={onOpenBookingModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          title="Schedule BCI Rehabilitation Session"
        >
          <Calendar size={14} />
          <span className="hidden md:inline">Book Appointment</span>
        </button>

        {/* Streaming toggle */}
        <button
          id="btn-toggle-stream"
          onClick={onToggleStreaming}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isStreaming
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle live telemetry feed"
        >
          <Radio size={14} className={isStreaming ? 'animate-pulse text-emerald-400' : ''} />
          <span className="hidden lg:inline">{isStreaming ? 'Streaming Live' : 'Paused'}</span>
        </button>

        {/* Emergency Alert Button */}
        <button
          id="btn-emergency-alert"
          onClick={onEmergencyAlert}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
          title="Trigger ICU Nurse Emergency Notification"
        >
          <AlertTriangle size={14} className="text-rose-400" />
          <span className="hidden lg:inline">Nurse Beacon</span>
        </button>

        {/* Export Report Button */}
        <button
          id="btn-export-report"
          onClick={onExportReport}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-colors shadow-sm cursor-pointer"
        >
          <FileDown size={14} className="text-blue-400" />
          <span className="hidden md:inline">Export Report</span>
        </button>

        {/* Admin Portal Quick Link */}
        <button
          id="btn-header-admin-portal"
          onClick={() => onNavigateTab && onNavigateTab('Admin Portal')}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isAdmin
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
          }`}
          title="Administrative Booking Management Console"
        >
          <ShieldCheck size={14} className={isAdmin ? 'text-amber-400' : 'text-slate-400'} />
          <span>{isAdmin ? 'Admin Console' : 'Admin Portal'}</span>
        </button>

        {/* Firebase User Authentication Pill */}
        <div className="relative">
          {user ? (
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shadow-sm">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-white leading-tight truncate max-w-[90px]">
                    {userProfile?.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono capitalize">
                    {userProfile?.role || 'User'}
                  </div>
                </div>
                <ChevronDown size={12} className="text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  id="user-auth-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-150"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="p-2.5 border-b border-slate-800">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{userProfile?.displayName || 'Caregiver / Clinician'}</span>
                      <ShieldCheck size={14} className="text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{user.email}</div>
                    <div className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block capitalize">
                      Role: {userProfile?.role || 'patient'}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onNavigateTab) onNavigateTab('Admin Portal');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-amber-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                    >
                      <ShieldCheck size={14} className="text-amber-400" />
                      <span>Clinical Admin Console</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onNavigateTab) onNavigateTab('Appointments & Bookings');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                    >
                      <CalendarDays size={14} className="text-blue-400" />
                      <span>My Clinical Appointments</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenBookingModal();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                    >
                      <Calendar size={14} className="text-emerald-400" />
                      <span>Book New BCI Session</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="btn-header-signin"
              onClick={() => openAuthModal('signin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all shadow-sm cursor-pointer"
            >
              <LogIn size={14} className="text-blue-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
