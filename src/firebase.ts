import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  getDocFromServer,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { AppointmentBooking, UserProfile, UserRole } from './types';
import { createApiBooking, fetchApiBookings, updateApiBooking, deleteApiBooking } from './api';

// Web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyDpvhgTYE3ui-RmLhG9pOs4UzRTyNrmwoQ",
  authDomain: "eeg-single-channel.firebaseapp.com",
  projectId: "eeg-single-channel",
  storageBucket: "eeg-single-channel.firebasestorage.app",
  messagingSenderId: "912197021395",
  appId: "1:912197021395:web:23ed5597e054b1b61b2e26"
};

// Initialize or reuse Firebase instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test on boot as recommended by Firebase guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is restricted.');
    }
  }
}

// User Profile helpers with dual local cache & cloud sync
export async function syncUserProfile(
  user: FirebaseUser,
  additionalData?: {
    displayName?: string;
    role?: UserRole;
    phone?: string;
    patientReferenceId?: string;
    assignedPatientName?: string;
    doctorLicense?: string;
    specialty?: string;
  }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();
  const cacheKey = `np_profile_${user.uid}`;

  let profileResult: UserProfile;

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const existing = docSnap.data() as UserProfile;
      const updated: Partial<UserProfile> = {
        lastLoginAt: now,
      };
      if (additionalData?.displayName && additionalData.displayName !== existing.displayName) {
        updated.displayName = additionalData.displayName;
      }
      if (additionalData?.role && additionalData.role !== existing.role) {
        updated.role = additionalData.role;
      }
      if (additionalData?.phone) {
        updated.phone = additionalData.phone;
      }
      if (additionalData?.patientReferenceId) {
        updated.patientReferenceId = additionalData.patientReferenceId;
      }
      if (additionalData?.assignedPatientName) {
        updated.assignedPatientName = additionalData.assignedPatientName;
      }
      if (additionalData?.doctorLicense) {
        updated.doctorLicense = additionalData.doctorLicense;
      }
      if (additionalData?.specialty) {
        updated.specialty = additionalData.specialty;
      }
      await updateDoc(userRef, updated);
      profileResult = { ...existing, ...updated };
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || 'Patient / User',
        role: additionalData?.role || 'patient',
        phone: additionalData?.phone || '',
        patientReferenceId: additionalData?.patientReferenceId || '',
        assignedPatientName: additionalData?.assignedPatientName || '',
        doctorLicense: additionalData?.doctorLicense || '',
        specialty: additionalData?.specialty || '',
        createdAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, newProfile);
      profileResult = newProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    // Check local storage if previously stored
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        profileResult = {
          ...parsed,
          ...additionalData,
          lastLoginAt: now,
        };
      } catch {
        profileResult = {
          uid: user.uid,
          email: user.email || '',
          displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || 'Patient / User',
          role: additionalData?.role || 'patient',
          phone: additionalData?.phone || '',
          patientReferenceId: additionalData?.patientReferenceId || '',
          assignedPatientName: additionalData?.assignedPatientName || '',
          doctorLicense: additionalData?.doctorLicense || '',
          specialty: additionalData?.specialty || '',
          createdAt: now,
          lastLoginAt: now,
        };
      }
    } else {
      profileResult = {
        uid: user.uid,
        email: user.email || '',
        displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || 'Patient / User',
        role: additionalData?.role || 'patient',
        phone: additionalData?.phone || '',
        patientReferenceId: additionalData?.patientReferenceId || '',
        assignedPatientName: additionalData?.assignedPatientName || '',
        doctorLicense: additionalData?.doctorLicense || '',
        specialty: additionalData?.specialty || '',
        createdAt: now,
        lastLoginAt: now,
      };
    }
  }

  // Save to local cache so role & profile load instantly on refresh
  try {
    localStorage.setItem(cacheKey, JSON.stringify(profileResult));
    localStorage.setItem('np_last_profile', JSON.stringify(profileResult));
  } catch (e) {
    console.warn('Could not cache user profile locally:', e);
  }

  return profileResult;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const cacheKey = `np_profile_${uid}`;
  // 1. Try instant local cache first
  const cached = localStorage.getItem(cacheKey);
  let localProfile: UserProfile | null = null;
  if (cached) {
    try {
      localProfile = JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const remote = docSnap.data() as UserProfile;
      localStorage.setItem(cacheKey, JSON.stringify(remote));
      return remote;
    }
    return localProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return localProfile;
  }
}

// Persistent Booking Storage & Seed Registry
export const INITIAL_CLIENT_BOOKINGS: AppointmentBooking[] = [
  {
    id: 'book-seed-1',
    userId: 'seed-patient-elena',
    userEmail: 'elena.patient@neuropulse.org',
    userName: 'Elena Rostova (Patient)',
    patientId: 'NP-102',
    patientName: 'Elena Rostova',
    doctorName: 'Dr. Sarah Jenkins, MD',
    specialty: 'Physical Medicine & Rehabilitation',
    appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    appointmentTime: '10:30 AM',
    sessionType: 'SMR Hand Grasp Neurofeedback + FES',
    contactPhone: '+1 (555) 489-2104',
    clinicalNotes: 'Check mu-rhythm suppression over C3/C4 sensorimotor cortex with robotic hand orthosis.',
    urgency: 'routine',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'book-seed-2',
    userId: 'seed-caregiver-david',
    userEmail: 'caregiver.david@neuropulse.org',
    userName: 'David Vance (Caregiver)',
    patientId: 'NP-101',
    patientName: 'Marcus Vance',
    doctorName: 'Dr. Riley Chen, MD, PhD',
    specialty: 'Chief Neurotechnologist & Clinical Director',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointmentTime: '02:00 PM',
    sessionType: 'P300 Matrix Speller Calibration',
    contactPhone: '+1 (555) 234-9812',
    clinicalNotes: 'Recalibrate P300 flash duration for 6x6 spelling grid. Caregiver requesting alphabet speed boost.',
    urgency: 'priority',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'book-seed-3',
    userId: 'seed-patient-mateo',
    userEmail: 'mateo.silva@neuropulse.org',
    userName: 'Mateo Silva (Patient)',
    patientId: 'NP-103',
    patientName: 'Mateo Silva',
    doctorName: 'Dr. Aaron Patel, MD',
    specialty: 'Neuro-ICU & Critical Care Neurologist',
    appointmentDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    appointmentTime: '09:00 AM',
    sessionType: 'Motor Imagery Robotic Exoskeleton Sync',
    contactPhone: '+1 (555) 782-9901',
    clinicalNotes: 'Post-stroke hemiplegia bilateral beta wave desynchronization assessment.',
    urgency: 'routine',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export function getStoredBookings(userId?: string, userEmail?: string): AppointmentBooking[] {
  let list: AppointmentBooking[] = [];
  try {
    const raw = localStorage.getItem('np_all_bookings');
    if (raw) {
      list = JSON.parse(raw);
    } else {
      list = [...INITIAL_CLIENT_BOOKINGS];
      localStorage.setItem('np_all_bookings', JSON.stringify(list));
    }
  } catch {
    list = [...INITIAL_CLIENT_BOOKINGS];
  }

  // Ensure initial seed bookings exist if list is empty
  if (!Array.isArray(list) || list.length === 0) {
    list = [...INITIAL_CLIENT_BOOKINGS];
    saveStoredBookings(list);
  }

  if (userId || userEmail) {
    const userMatches = list.filter((b) => {
      const matchUid = Boolean(userId && b.userId === userId);
      const matchEmail = Boolean(
        userEmail && b.userEmail && b.userEmail.toLowerCase() === userEmail.toLowerCase()
      );
      return matchUid || matchEmail;
    });

    // If user has personal bookings, return them sorted; if they don't have any yet, return all bookings so the list is never blank!
    if (userMatches.length > 0) {
      return userMatches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveStoredBookings(bookings: AppointmentBooking[]) {
  try {
    localStorage.setItem('np_all_bookings', JSON.stringify(bookings));
    localStorage.setItem('np_user_bookings', JSON.stringify(bookings));
  } catch (err) {
    console.warn('Failed to save bookings to localStorage:', err);
  }
}

// Appointment Bookings Helpers - Dual Storage (Local + Server DB + Firestore)
export async function createAppointmentBooking(
  booking: Omit<AppointmentBooking, 'id' | 'createdAt'>
): Promise<AppointmentBooking> {
  const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const fullBooking: AppointmentBooking = {
    ...booking,
    id: bookingId,
    createdAt: now,
  };

  // 1. Immediately store in local persistent storage (Instant UI feedback)
  const currentList = getStoredBookings();
  const withoutDup = currentList.filter((b) => b.id !== bookingId);
  const updatedList = [fullBooking, ...withoutDup];
  saveStoredBookings(updatedList);
  try {
    localStorage.setItem('np_last_booking_id', bookingId);
  } catch {}

  // 2. Broadcast local update event so any active view updates synchronously
  try {
    window.dispatchEvent(new CustomEvent('neuropulse_bookings_updated', { detail: fullBooking }));
  } catch {
    // ignore
  }

  // 3. Persist to server backend database
  createApiBooking(fullBooking).catch((err) => {
    console.warn('Server booking sync info:', err);
  });

  // 4. Persist to Firestore
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await setDoc(bookingRef, fullBooking);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bookings/${bookingId}`);
  }

  return fullBooking;
}

export function subscribeToUserBookings(
  userIdOrOptions?: string | { userId?: string; userEmail?: string },
  userEmailOrOnUpdate?: string | ((bookings: AppointmentBooking[]) => void),
  onUpdateOrOnError?: ((bookings: AppointmentBooking[]) => void) | ((err: any) => void),
  optionalOnError?: (err: any) => void
) {
  let userId: string | undefined;
  let userEmail: string | undefined;
  let onUpdate: (bookings: AppointmentBooking[]) => void;
  let onError: ((err: any) => void) | undefined;

  if (typeof userIdOrOptions === 'object' && userIdOrOptions !== null) {
    userId = userIdOrOptions.userId;
    userEmail = userIdOrOptions.userEmail;
    onUpdate = (userEmailOrOnUpdate as (bookings: AppointmentBooking[]) => void) || (() => {});
    onError = onUpdateOrOnError as ((err: any) => void) | undefined;
  } else if (typeof userEmailOrOnUpdate === 'function') {
    // Invoked as: subscribeToUserBookings(userId, onUpdate, onError)
    userId = typeof userIdOrOptions === 'string' ? userIdOrOptions : undefined;
    userEmail = undefined;
    onUpdate = userEmailOrOnUpdate;
    onError = onUpdateOrOnError as ((err: any) => void) | undefined;
  } else {
    // Invoked as: subscribeToUserBookings(userId, userEmail, onUpdate, onError)
    userId = typeof userIdOrOptions === 'string' ? userIdOrOptions : undefined;
    userEmail = typeof userEmailOrOnUpdate === 'string' ? userEmailOrOnUpdate : undefined;
    onUpdate = (onUpdateOrOnError as (bookings: AppointmentBooking[]) => void) || (() => {});
    onError = optionalOnError;
  }

  // Step 1: Immediately emit currently cached bookings
  const immediate = getStoredBookings(userId, userEmail);
  if (typeof onUpdate === 'function') {
    onUpdate(immediate);
  }

  // Step 2: Fetch latest from server REST API
  fetchApiBookings({ userId, userEmail })
    .then((serverBookings) => {
      if (Array.isArray(serverBookings) && serverBookings.length > 0) {
        const allCurrent = getStoredBookings();
        const map = new Map<string, AppointmentBooking>();
        allCurrent.forEach((b) => map.set(b.id, b));
        serverBookings.forEach((b) => map.set(b.id, b));
        const merged = Array.from(map.values());
        saveStoredBookings(merged);
        if (typeof onUpdate === 'function') {
          onUpdate(getStoredBookings(userId, userEmail));
        }
      }
    })
    .catch((err) => {
      console.warn('Could not reach /api/bookings:', err);
    });

  // Step 3: Listen for local updates in real time
  const handleLocalUpdate = () => {
    if (typeof onUpdate === 'function') {
      onUpdate(getStoredBookings(userId, userEmail));
    }
  };
  window.addEventListener('neuropulse_bookings_updated', handleLocalUpdate);

  // Step 4: Real-time Firestore onSnapshot subscription
  let unsubscribeFirestore = () => {};
  try {
    const q = userId
      ? query(collection(db, 'bookings'), where('userId', '==', userId))
      : query(collection(db, 'bookings'));

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList: AppointmentBooking[] = [];
        snapshot.forEach((d) => {
          firestoreList.push(d.data() as AppointmentBooking);
        });
        if (firestoreList.length > 0) {
          const allCurrent = getStoredBookings();
          const map = new Map<string, AppointmentBooking>();
          allCurrent.forEach((b) => map.set(b.id, b));
          firestoreList.forEach((b) => map.set(b.id, b));
          const merged = Array.from(map.values());
          saveStoredBookings(merged);
        }
        if (typeof onUpdate === 'function') {
          onUpdate(getStoredBookings(userId, userEmail));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
        if (onError) onError(error);
        if (typeof onUpdate === 'function') {
          onUpdate(getStoredBookings(userId, userEmail));
        }
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'bookings');
  }

  return () => {
    window.removeEventListener('neuropulse_bookings_updated', handleLocalUpdate);
    unsubscribeFirestore();
  };
}

export async function cancelAppointmentBooking(bookingId: string): Promise<void> {
  // Update local storage
  const current = getStoredBookings();
  const updated = current.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b));
  saveStoredBookings(updated);

  window.dispatchEvent(new CustomEvent('neuropulse_bookings_updated', { detail: { id: bookingId } }));

  // Update server
  updateApiBooking(bookingId, { status: 'cancelled' }).catch((e) => console.warn(e));

  // Update Firestore
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status: 'cancelled' });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

// Admin Operations: Subscribe to all bookings across all users/patients
export function subscribeToAllBookings(
  onUpdate: (bookings: AppointmentBooking[]) => void,
  onError?: (err: any) => void
) {
  // 1. Emit local immediately
  onUpdate(getStoredBookings());

  // 2. Fetch from server API
  fetchApiBookings()
    .then((serverList) => {
      if (Array.isArray(serverList) && serverList.length > 0) {
        const allCurrent = getStoredBookings();
        const map = new Map<string, AppointmentBooking>();
        allCurrent.forEach((b) => map.set(b.id, b));
        serverList.forEach((b) => map.set(b.id, b));
        const merged = Array.from(map.values());
        saveStoredBookings(merged);
        onUpdate(getStoredBookings());
      }
    })
    .catch((err) => console.warn('Admin bookings fetch API error:', err));

  // 3. Listen to local updates
  const handleLocalUpdate = () => {
    onUpdate(getStoredBookings());
  };
  window.addEventListener('neuropulse_bookings_updated', handleLocalUpdate);

  // 4. Firestore snapshot
  let unsubFirestore = () => {};
  try {
    const q = collection(db, 'bookings');
    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList: AppointmentBooking[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push(docSnap.data() as AppointmentBooking);
        });
        if (firestoreList.length > 0) {
          const allCurrent = getStoredBookings();
          const map = new Map<string, AppointmentBooking>();
          allCurrent.forEach((b) => map.set(b.id, b));
          firestoreList.forEach((b) => map.set(b.id, b));
          const merged = Array.from(map.values());
          saveStoredBookings(merged);
        }
        onUpdate(getStoredBookings());
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
        if (onError) onError(error);
        onUpdate(getStoredBookings());
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'bookings');
  }

  return () => {
    window.removeEventListener('neuropulse_bookings_updated', handleLocalUpdate);
    unsubFirestore();
  };
}

// Update any booking's details
export async function updateAppointmentBooking(
  bookingId: string,
  updates: Partial<AppointmentBooking>
): Promise<void> {
  const current = getStoredBookings();
  const updated = current.map((b) => (b.id === bookingId ? { ...b, ...updates } : b));
  saveStoredBookings(updated);

  window.dispatchEvent(new CustomEvent('neuropulse_bookings_updated', { detail: { id: bookingId, ...updates } }));

  updateApiBooking(bookingId, updates).catch((e) => console.warn(e));

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

// Delete a booking
export async function deleteAppointmentBooking(bookingId: string): Promise<void> {
  const current = getStoredBookings();
  const filtered = current.filter((b) => b.id !== bookingId);
  saveStoredBookings(filtered);

  window.dispatchEvent(new CustomEvent('neuropulse_bookings_updated', { detail: { id: bookingId, deleted: true } }));

  deleteApiBooking(bookingId).catch((e) => console.warn(e));

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `bookings/${bookingId}`);
  }
}

// Admin: Create booking directly from admin console
export async function adminCreateBooking(
  booking: Omit<AppointmentBooking, 'id' | 'createdAt'>
): Promise<AppointmentBooking> {
  const bookingId = `book-adm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const fullBooking: AppointmentBooking = {
    ...booking,
    id: bookingId,
    createdAt: now,
  };

  const current = getStoredBookings();
  const updated = [fullBooking, ...current.filter((b) => b.id !== bookingId)];
  saveStoredBookings(updated);

  window.dispatchEvent(new CustomEvent('neuropulse_bookings_updated', { detail: fullBooking }));

  createApiBooking(fullBooking).catch((e) => console.warn(e));

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await setDoc(bookingRef, fullBooking);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bookings/${bookingId}`);
  }

  return fullBooking;
}
