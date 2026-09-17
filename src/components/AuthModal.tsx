import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ShieldCheck,
  Brain,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CalendarCheck2,
  HeartPulse,
  Stethoscope,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    authModalNote,
    signInWithEmail,
    signUpWithEmail,
    demoSignIn,
    signInWithGoogle
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [assignedPatient, setAssignedPatient] = useState('Marcus Vance (NP-101)');
  const [doctorSpecialty, setDoctorSpecialty] = useState('Chief Neurotechnologist & Clinical Director');
  const [patientId, setPatientId] = useState('NP-102');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        await signInWithEmail(email.trim(), password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!email.trim() || !password) {
          throw new Error('Please enter email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await signUpWithEmail(
          email.trim(),
          password,
          displayName.trim(),
          role,
          phone.trim(),
          {
            patientReferenceId: role === 'patient' ? patientId : role === 'caregiver' ? 'NP-101' : undefined,
            assignedPatientName: role === 'caregiver' ? assignedPatient : undefined,
            doctorLicense: role === 'doctor' || role === 'clinician' ? 'MD-NEURO-88291' : undefined,
            specialty: role === 'doctor' || role === 'clinician' ? doctorSpecialty : undefined,
          }
        );
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please verify your details.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized in Firebase Auth. You can still test with Email/Password!';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle1ClickDemo = async (demoRole: 'patient' | 'caregiver' | 'doctor' | 'admin') => {
    setError(null);
    setIsSubmitting(true);
    try {
      await demoSignIn(demoRole);
    } catch (err: any) {
      setError(err.message || `Failed to sign in as ${demoRole}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      let msg = err.message || 'Google sign-in was cancelled or encountered an error.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Google popup was closed before completing.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not in Firebase Auth authorized domains list. Please use Email/Password sign in below.';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'patient') {
      if (!displayName || displayName.includes('Dr.') || displayName.includes('Caregiver')) {
        setDisplayName('Elena Rostova');
      }
    } else if (selectedRole === 'caregiver') {
      if (!displayName || displayName.includes('Elena') || displayName.includes('Dr.')) {
        setDisplayName('David Vance');
      }
    } else if (selectedRole === 'doctor') {
      if (!displayName || !displayName.startsWith('Dr.')) {
        setDisplayName('Dr. Riley Chen, MD, PhD');
      }
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="auth-modal"
        className="w-full max-w-lg bg-[#0d1424] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
      >
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 p-5 border-b border-slate-800 relative">
          <button
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Brain size={22} />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                NeuroPulse <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Clinical Auth</span>
              </div>
              <div className="text-xs text-slate-400">
                {mode === 'signin'
                  ? 'Sign in to access BCI telemetry, appointments & prescriptions'
                  : 'Register a patient, caregiver, or doctor clinical profile'}
              </div>
            </div>
          </div>

          {/* Context notice */}
          {authModalNote && (
            <div className="mt-3 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-start gap-2">
              <CalendarCheck2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <span>{authModalNote}</span>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800/80 text-xs font-semibold">
          <button
            id="tab-auth-signin"
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-2 text-center rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 text-center rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div
              id="auth-error-banner"
              className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Your Clinical Role <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Patient Role */}
                  <button
                    id="role-opt-patient"
                    type="button"
                    onClick={() => selectRole('patient')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      role === 'patient'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-500'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Brain size={16} className={role === 'patient' ? 'text-emerald-400' : 'text-slate-500'} />
                      {role === 'patient' && <CheckCircle2 size={13} className="text-emerald-400" />}
                    </div>
                    <div className="font-semibold text-xs text-slate-100">Patient</div>
                    <div className="text-[10px] text-slate-400 leading-tight">Paralysis BCI rehab user</div>
                  </button>

                  {/* Caregiver Role */}
                  <button
                    id="role-opt-caregiver"
                    type="button"
                    onClick={() => selectRole('caregiver')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      role === 'caregiver' || role === 'family'
                        ? 'bg-purple-500/15 border-purple-500 text-white shadow-md shadow-purple-900/20 ring-1 ring-purple-500'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <HeartPulse size={16} className={role === 'caregiver' ? 'text-purple-400' : 'text-slate-500'} />
                      {(role === 'caregiver' || role === 'family') && <CheckCircle2 size={13} className="text-purple-400" />}
                    </div>
                    <div className="font-semibold text-xs text-slate-100">Caregiver</div>
                    <div className="text-[10px] text-slate-400 leading-tight">Nurse / Family aid</div>
                  </button>

                  {/* Doctor Role */}
                  <button
                    id="role-opt-doctor"
                    type="button"
                    onClick={() => selectRole('doctor')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                      role === 'doctor' || role === 'clinician'
                        ? 'bg-blue-500/15 border-blue-500 text-white shadow-md shadow-blue-900/20 ring-1 ring-blue-500'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Stethoscope size={16} className={role === 'doctor' ? 'text-blue-400' : 'text-slate-500'} />
                      {(role === 'doctor' || role === 'clinician') && <CheckCircle2 size={13} className="text-blue-400" />}
                    </div>
                    <div className="font-semibold text-xs text-slate-100">Doctor (MD)</div>
                    <div className="text-[10px] text-slate-400 leading-tight">Neurologist / Clinician</div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    id="input-signup-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={
                      role === 'patient'
                        ? 'e.g., Elena Rostova'
                        : role === 'caregiver'
                        ? 'e.g., David Vance'
                        : 'e.g., Dr. Riley Chen, MD, PhD'
                    }
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Dynamic Role Field: Patient ID or Assigned Patient or Doctor Specialty */}
              <div className="grid grid-cols-2 gap-3">
                {role === 'patient' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Patient Record ID
                    </label>
                    <select
                      id="select-patient-id"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="NP-102">NP-102 (Elena Rostova - C5 SCI)</option>
                      <option value="NP-101">NP-101 (Marcus Vance - ALS)</option>
                      <option value="NP-103">NP-103 (Mateo Silva - Stroke)</option>
                      <option value="NP-NEW">NP-NEW (New BCI Enrollee)</option>
                    </select>
                  </div>
                )}

                {role === 'caregiver' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assigned Patient
                    </label>
                    <select
                      id="select-assigned-patient"
                      value={assignedPatient}
                      onChange={(e) => setAssignedPatient(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Marcus Vance (NP-101)">Marcus Vance (NP-101)</option>
                      <option value="Elena Rostova (NP-102)">Elena Rostova (NP-102)</option>
                      <option value="Mateo Silva (NP-103)">Mateo Silva (NP-103)</option>
                    </select>
                  </div>
                )}

                {(role === 'doctor' || role === 'clinician') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Clinical Specialty
                    </label>
                    <input
                      id="input-doctor-specialty"
                      type="text"
                      value={doctorSpecialty}
                      onChange={(e) => setDoctorSpecialty(e.target.value)}
                      placeholder="e.g. Chief Neurotechnologist"
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}

                <div className={role === 'patient' || role === 'caregiver' || role === 'doctor' ? '' : 'col-span-2'}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      id="input-signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-slate-500" />
              <input
                id="input-auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@neuropulse.org"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-slate-500" />
              <input
                id="input-auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-[10px] text-slate-500 mt-1">Must be at least 6 characters</p>
            )}
          </div>

          {/* Submit button */}
          <button
            id="btn-submit-auth"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : mode === 'signin' ? (
              <>
                <ShieldCheck size={16} />
                <span>Sign In to NeuroPulse</span>
              </>
            ) : (
              <>
                <User size={16} />
                <span>Create {role === 'patient' ? 'Patient' : role === 'caregiver' ? 'Caregiver' : 'Doctor'} Profile</span>
              </>
            )}
          </button>

          {/* Google Sign In */}
          <button
            id="btn-auth-google"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 1-Click Role Logins */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sparkles size={12} className="text-amber-400" />
                <span>Instant 1-Click Role Login</span>
              </span>
              <span className="text-[10px] text-slate-500">Auto-configured</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Patient Demo */}
              <button
                id="btn-demo-patient"
                type="button"
                onClick={() => handle1ClickDemo('patient')}
                disabled={isSubmitting}
                className="text-[11px] p-2 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 rounded-xl text-slate-300 text-left transition-colors flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Brain size={14} />
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-emerald-300 truncate">Elena Rostova</div>
                  <div className="text-[9px] text-slate-400 truncate">Patient (C5 Tetraplegia)</div>
                </div>
              </button>

              {/* Caregiver Demo */}
              <button
                id="btn-demo-caregiver"
                type="button"
                onClick={() => handle1ClickDemo('caregiver')}
                disabled={isSubmitting}
                className="text-[11px] p-2 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 rounded-xl text-slate-300 text-left transition-colors flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <HeartPulse size={14} />
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-purple-300 truncate">David Vance</div>
                  <div className="text-[9px] text-slate-400 truncate">Caregiver (for Marcus)</div>
                </div>
              </button>

              {/* Doctor Demo */}
              <button
                id="btn-demo-doctor"
                type="button"
                onClick={() => handle1ClickDemo('doctor')}
                disabled={isSubmitting}
                className="text-[11px] p-2 bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/40 rounded-xl text-slate-300 text-left transition-colors flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Stethoscope size={14} />
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-blue-300 truncate">Dr. Riley Chen</div>
                  <div className="text-[9px] text-slate-400 truncate">Chief Neurologist (MD)</div>
                </div>
              </button>

              {/* Admin Demo */}
              <button
                id="btn-demo-admin"
                type="button"
                onClick={() => handle1ClickDemo('admin')}
                disabled={isSubmitting}
                className="text-[11px] p-2 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 rounded-xl text-slate-300 text-left transition-colors flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Shield size={14} />
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-amber-300 truncate">Clinical Admin</div>
                  <div className="text-[9px] text-slate-400 truncate">Clinical Director</div>
                </div>
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Project: eeg-single-channel</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Firebase Connected
          </span>
        </div>
      </div>
    </div>
  );
};
