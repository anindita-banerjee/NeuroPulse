import React from 'react';
import {
  Brain,
  LayoutDashboard,
  Waves,
  UserRound,
  FileSpreadsheet,
  History,
  Sparkles,
  Command,
  ChevronDown,
  Activity,
  ShieldCheck,
  X,
  Stethoscope,
  Calendar,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'Live Telemetry'
  | 'Appointments & Bookings'
  | 'Admin Portal'
  | 'Signal Analysis'
  | 'Patient Monitor'
  | 'Doctor Prescriptions'
  | 'History & Analytics'
  | 'BCI Speller & Assistive'
  | 'Research Insights';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onOpenBookingModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen = false,
  setMobileOpen = (_open: boolean) => {},
  onOpenBookingModal,
}) => {
  const { user, userProfile, isAdmin, openAuthModal, signOut } = useAuth();

  const navItems: { label: NavTab; icon: React.ComponentType<{ className?: string; size?: number }>; badge?: string }[] = [
    { label: 'Live Telemetry', icon: LayoutDashboard },
    { label: 'Appointments & Bookings', icon: Calendar, badge: 'Firestore' },
    { label: 'Admin Portal', icon: ShieldCheck, badge: isAdmin ? 'ADMIN' : 'PORTAL' },
    { label: 'Signal Analysis', icon: Waves },
    { label: 'Patient Monitor', icon: UserRound },
    { label: 'Doctor Prescriptions', icon: Stethoscope, badge: 'Rx' },
    { label: 'History & Analytics', icon: History },
    { label: 'BCI Speller & Assistive', icon: Command, badge: 'BCI' },
    { label: 'Research Insights', icon: Sparkles, badge: 'AI' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          id="mobile-nav-backdrop"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0f1c] border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/10">
              <Brain size={20} className="text-blue-400" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-white flex items-center gap-0.5">
                Neuro<span className="text-blue-400 font-bold">Pulse</span>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                CLINICAL BCI
              </div>
            </div>
          </div>
          <button
            id="btn-close-sidebar"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace info & Cloud Database Badge */}
        <div className="px-4 py-3 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 font-mono tracking-wider uppercase mb-1.5 px-1">
            <span>DATABASE</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              FIREBASE LIVE
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-200">
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                FB
              </div>
              <span className="truncate text-[11px] font-mono text-slate-300">eeg-single-channel</span>
            </div>
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.label}
                id={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => {
                  onSelectTab(item.label);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={17} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded tracking-wide uppercase font-semibold ${
                      item.badge === 'AI'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : item.badge === 'Rx'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : item.badge === 'Firestore'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick action: Book appointment */}
        {onOpenBookingModal && (
          <div className="px-3 pb-2">
            <button
              onClick={onOpenBookingModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Calendar size={14} className="text-blue-400" />
              <span>Book Appointment</span>
            </button>
          </div>
        )}

        {/* System status indicator */}
        <div className="p-3 mx-3 mb-2 rounded-lg bg-slate-900/40 border border-slate-800/70 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry Stream
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">256 Hz</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Latency: 12ms</span>
            <span>Impedance: &lt;5kΩ</span>
          </div>
        </div>

        {/* User Account / Clinician footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate pr-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {userProfile?.displayName || user.email}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono capitalize">
                    {userProfile?.role || 'Patient / Caregiver'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800/60 transition-colors"
                title="Sign out of Firebase"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              id="btn-sidebar-signin"
              onClick={() => openAuthModal('signin')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <LogIn size={15} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
