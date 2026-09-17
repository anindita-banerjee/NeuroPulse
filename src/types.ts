export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  paralysisType: string;
  injuryLevel: string;
  clinicalStage: string;
  mobilityStatus: string;
  bciParadigm: string;
  currentDoctor: string;
  roomBed: string;
  status: 'stable' | 'active' | 'recalibrating' | 'resting';
  signalQuality: number;
  attentionScore: number;
  focusScore: number;
  fatigueScore: number;
  activeChannelCount: number;
  samplingRate: number;
  dominantWave: 'Alpha' | 'Beta' | 'Theta' | 'Delta' | 'Mu';
  bandPowers: {
    alpha: number;
    beta: number;
    theta: number;
    delta: number;
    mu: number;
  };
  motorImageryAccuracy: number;
  currentIntent: {
    command: string;
    confidence: number;
    timestamp: string;
    channelTrigger: string;
  };
  eegConfig: {
    baselineAlpha: number;
    baselineBeta: number;
    baselineTheta: number;
    baselineDelta: number;
    muSuppressionThreshold: number;
    filterNotch: boolean;
    filterBandpass: string;
    impedanceCheck: Record<string, number>;
  };
  daysInProgram: number;
  avatarUrl?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  purpose: string;
  startDate: string;
}

export interface BCITherapyProtocol {
  dailyDurationMinutes: number;
  sessionFrequency: string;
  targetParadigm: string;
  targetBands: string;
  classificationThreshold: number;
  assistiveDeviceIntegration: string;
  sensorimotorFocus: string;
  neuroplasticityGoal: string;
}

export interface DoctorPrescription {
  id: string;
  patientId: string;
  doctorName: string;
  doctorSpecialty: string;
  licenseNumber: string;
  hospitalAffiliation: string;
  datePrescribed: string;
  nextReviewDate: string;
  medications: Medication[];
  bciTherapyProtocol: BCITherapyProtocol;
  clinicalNotes: string;
  warningPrecautions: string[];
  signatureHash: string;
  status: 'active' | 'modified' | 'completed';
}

export interface SessionHistory {
  id: string;
  patientId: string;
  sessionNumber: number;
  date: string;
  time: string;
  durationMinutes: number;
  dominantWave: string;
  avgAlpha: number;
  avgBeta: number;
  avgTheta: number;
  avgDelta: number;
  bciAccuracy: number;
  trialsCount: number;
  successfulCommands: number;
  fatigueIndex: number;
  focusScore: number;
  coherenceScore: number;
  notes: string;
  doctorAssessment: string;
  prescribedProtocolAdherence: number;
}

export interface BCIIntentEvent {
  id: string;
  patientId: string;
  timestamp: string;
  intent: string;
  category: 'speller' | 'motor_imagery' | 'assistive_alert' | 'environmental';
  confidence: number;
  eegFeatures: {
    muErdPct: number;
    betaPeakHz: number;
    p300LatencyMs: number;
    targetElectrode: string;
  };
  executedAction: string;
  status: 'verified' | 'executed' | 'dismissed';
}

export interface EEGChannelData {
  name: string;
  region: string;
  color: string;
  amplitude: number;
  impedance: number;
  status: 'optimal' | 'acceptable' | 'high_impedance';
  waveform: number[];
}

export interface EEGPacket {
  timestamp: number;
  patientId: string;
  channels: EEGChannelData[];
  fftSpectrum: { freq: number; power: number }[];
  bandPowers: {
    alpha: number;
    beta: number;
    theta: number;
    delta: number;
    mu: number;
  };
  signalQuality: number;
  noiseLevel: number;
  patternWarnings: {
    type: 'normal' | 'warning' | 'danger';
    title: string;
    description: string;
    timestamp: string;
  }[];
}

export const ADMIN_EMAIL = 'aninditabanerjee0023@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export type UserRole = 'patient' | 'caregiver' | 'doctor' | 'clinician' | 'family' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  patientReferenceId?: string;
  assignedPatientName?: string;
  doctorLicense?: string;
  specialty?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AppointmentBooking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  specialty?: string;
  appointmentDate: string;
  appointmentTime: string;
  sessionType: string;
  contactPhone?: string;
  clinicalNotes?: string;
  urgency?: 'routine' | 'priority' | 'urgent';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}
