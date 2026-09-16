import fs from 'fs';
import path from 'path';
import { Patient, DoctorPrescription, SessionHistory, BCIIntentEvent } from '../src/types';
import { INITIAL_PATIENTS, INITIAL_PRESCRIPTIONS, INITIAL_SESSION_HISTORIES, INITIAL_INTENTS } from './data';

interface DatabaseSchema {
  patients: Patient[];
  prescriptions: DoctorPrescription[];
  histories: SessionHistory[];
  intents: BCIIntentEvent[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'clinical_db.json');

class ClinicalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      patients: [...INITIAL_PATIENTS],
      prescriptions: [...INITIAL_PRESCRIPTIONS],
      histories: [...INITIAL_SESSION_HISTORIES],
      intents: [...INITIAL_INTENTS],
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.patients && parsed.prescriptions && parsed.histories) {
          this.data = parsed;
          return;
        }
      }

      this.persist();
    } catch (err) {
      console.warn('Could not initialize clinical_db.json, using in-memory store:', err);
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write clinical database:', err);
    }
  }

  // Patients
  getPatients(): Patient[] {
    return this.data.patients;
  }

  getPatientById(id: string): Patient | undefined {
    return this.data.patients.find((p) => p.id === id);
  }

  createPatient(patient: Patient): Patient {
    this.data.patients.push(patient);
    this.persist();
    return patient;
  }

  updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const index = this.data.patients.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.patients[index] = { ...this.data.patients[index], ...updates };
    this.persist();
    return this.data.patients[index];
  }

  // Prescriptions
  getPrescriptions(patientId?: string): DoctorPrescription[] {
    if (patientId) {
      return this.data.prescriptions.filter((p) => p.patientId === patientId);
    }
    return this.data.prescriptions;
  }

  getPrescriptionById(id: string): DoctorPrescription | undefined {
    return this.data.prescriptions.find((p) => p.id === id);
  }

  createPrescription(prescription: DoctorPrescription): DoctorPrescription {
    this.data.prescriptions.unshift(prescription);
    this.persist();
    return prescription;
  }

  updatePrescription(id: string, updates: Partial<DoctorPrescription>): DoctorPrescription | null {
    const index = this.data.prescriptions.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.prescriptions[index] = { ...this.data.prescriptions[index], ...updates };
    this.persist();
    return this.data.prescriptions[index];
  }

  // Session History
  getHistories(patientId?: string): SessionHistory[] {
    if (patientId) {
      return this.data.histories.filter((h) => h.patientId === patientId);
    }
    return this.data.histories;
  }

  createHistory(history: SessionHistory): SessionHistory {
    this.data.histories.unshift(history);
    this.persist();
    return history;
  }

  // Intent events
  getIntents(patientId?: string): BCIIntentEvent[] {
    if (patientId) {
      return this.data.intents.filter((i) => i.patientId === patientId);
    }
    return this.data.intents;
  }

  createIntent(intent: BCIIntentEvent): BCIIntentEvent {
    this.data.intents.unshift(intent);
    if (this.data.intents.length > 50) {
      this.data.intents.pop();
    }
    this.persist();
    return intent;
  }
}

export const db = new ClinicalDatabase();
