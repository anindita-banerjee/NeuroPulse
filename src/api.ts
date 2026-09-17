import { Patient, DoctorPrescription, SessionHistory, BCIIntentEvent, EEGPacket, AppointmentBooking } from './types';

export async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch('/api/patients');
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json();
}

export async function fetchPatientById(id: string): Promise<Patient> {
  const res = await fetch(`/api/patients/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch patient ${id}`);
  return res.json();
}

export async function createPatient(patient: Partial<Patient>): Promise<Patient> {
  const res = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  if (!res.ok) throw new Error('Failed to create patient');
  return res.json();
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
  const res = await fetch(`/api/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update patient');
  return res.json();
}

export async function fetchPrescriptions(patientId: string): Promise<DoctorPrescription[]> {
  const res = await fetch(`/api/patients/${patientId}/prescriptions`);
  if (!res.ok) throw new Error('Failed to fetch prescriptions');
  return res.json();
}
export const fetchPatientPrescriptions = fetchPrescriptions;

export async function createPrescription(patientId: string, rx: Partial<DoctorPrescription>): Promise<DoctorPrescription> {
  const res = await fetch(`/api/patients/${patientId}/prescriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rx),
  });
  if (!res.ok) throw new Error('Failed to create prescription');
  return res.json();
}

export async function fetchHistory(patientId: string): Promise<SessionHistory[]> {
  const res = await fetch(`/api/patients/${patientId}/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}
export const fetchPatientHistory = fetchHistory;

export async function createHistory(patientId: string, history: Partial<SessionHistory>): Promise<SessionHistory> {
  const res = await fetch(`/api/patients/${patientId}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(history),
  });
  if (!res.ok) throw new Error('Failed to record session history');
  return res.json();
}

export async function fetchIntents(patientId: string): Promise<BCIIntentEvent[]> {
  const res = await fetch(`/api/patients/${patientId}/intents`);
  if (!res.ok) throw new Error('Failed to fetch intents');
  return res.json();
}

export async function triggerIntent(patientId: string, intent: Partial<BCIIntentEvent>): Promise<BCIIntentEvent> {
  const res = await fetch(`/api/patients/${patientId}/intents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(intent),
  });
  if (!res.ok) throw new Error('Failed to record intent');
  return res.json();
}

export async function fetchLiveEEG(patientId: string): Promise<EEGPacket> {
  const res = await fetch(`/api/patients/${patientId}/eeg-live`);
  if (!res.ok) throw new Error('Failed to fetch live EEG');
  return res.json();
}

export async function fetchAIAssessment(patientId: string): Promise<{
  patientId: string;
  patientName: string;
  assessment: string;
  generatedAt: string;
}> {
  const res = await fetch('/api/ai/clinical-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId }),
  });
  if (!res.ok) throw new Error('Failed to generate AI assessment');
  return res.json();
}

// Appointment Bookings API
export async function fetchApiBookings(params?: { userId?: string; userEmail?: string; patientId?: string }): Promise<AppointmentBooking[]> {
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', params.userId);
  if (params?.userEmail) query.set('userEmail', params.userEmail);
  if (params?.patientId) query.set('patientId', params.patientId);
  const url = query.toString() ? `/api/bookings?${query.toString()}` : '/api/bookings';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function createApiBooking(booking: AppointmentBooking): Promise<AppointmentBooking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error('Failed to create booking on server');
  return res.json();
}

export async function updateApiBooking(id: string, updates: Partial<AppointmentBooking>): Promise<AppointmentBooking> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update booking on server');
  return res.json();
}

export async function deleteApiBooking(id: string): Promise<boolean> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete booking on server');
  return true;
}
