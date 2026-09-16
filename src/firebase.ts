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
import { AppointmentBooking, UserProfile } from './types';

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

// User Profile helpers
export async function syncUserProfile(
  user: FirebaseUser,
  additionalData?: { displayName?: string; role?: UserProfile['role']; phone?: string; patientReferenceId?: string }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

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
      await updateDoc(userRef, updated);
      return { ...existing, ...updated };
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || 'Clinician/Patient',
        role: additionalData?.role || 'caregiver',
        phone: additionalData?.phone || '',
        patientReferenceId: additionalData?.patientReferenceId || '',
        createdAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    // Fallback profile if offline/permission
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0] || 'Clinician/Patient',
      role: additionalData?.role || 'caregiver',
      phone: additionalData?.phone || '',
      patientReferenceId: additionalData?.patientReferenceId || '',
      createdAt: now,
      lastLoginAt: now,
    };
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

// Appointment Bookings Helpers
export async function createAppointmentBooking(booking: Omit<AppointmentBooking, 'id' | 'createdAt'>): Promise<AppointmentBooking> {
  const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const fullBooking: AppointmentBooking = {
    ...booking,
    id: bookingId,
    createdAt: now,
  };

  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    await setDoc(bookingRef, fullBooking);
    return fullBooking;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bookings/${bookingId}`);
    // Also save in local storage backup so the user experience doesn't drop their booking
    const localSaved = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
    localSaved.unshift(fullBooking);
    localStorage.setItem('np_user_bookings', JSON.stringify(localSaved));
    return fullBooking;
  }
}

export function subscribeToUserBookings(
  userId: string,
  onUpdate: (bookings: AppointmentBooking[]) => void,
  onError?: (err: any) => void
) {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const bookings: AppointmentBooking[] = [];
        snapshot.forEach((doc) => {
          bookings.push(doc.data() as AppointmentBooking);
        });
        // Sort newest first
        bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(bookings);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
        if (onError) onError(error);
        // Fallback to local storage if firestore read fails
        const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
        const filtered = local.filter((b: AppointmentBooking) => b.userId === userId);
        onUpdate(filtered);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'bookings');
    const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
    const filtered = local.filter((b: AppointmentBooking) => b.userId === userId);
    onUpdate(filtered);
    return () => {};
  }
}

export async function cancelAppointmentBooking(bookingId: string): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    await updateDoc(bookingRef, { status: 'cancelled' });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    // Also update local storage fallback
    const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
    const updated = local.map((b: AppointmentBooking) => b.id === bookingId ? { ...b, status: 'cancelled' } : b);
    localStorage.setItem('np_user_bookings', JSON.stringify(updated));
  }
}

// Admin Operations: Subscribe to all bookings across all users/patients
export function subscribeToAllBookings(
  onUpdate: (bookings: AppointmentBooking[]) => void,
  onError?: (err: any) => void
) {
  try {
    const q = collection(db, 'bookings');
    return onSnapshot(
      q,
      (snapshot) => {
        const bookings: AppointmentBooking[] = [];
        snapshot.forEach((docSnap) => {
          bookings.push(docSnap.data() as AppointmentBooking);
        });
        // Sort newest first
        bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(bookings);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
        if (onError) onError(error);
        const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
        onUpdate(local);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'bookings');
    const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
    onUpdate(local);
    return () => {};
  }
}

// Admin: Update any booking's details (status, doctor, date, time, clinicalNotes, urgency)
export async function updateAppointmentBooking(
  bookingId: string,
  updates: Partial<AppointmentBooking>
): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    await updateDoc(bookingRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
  }
  // Also update local storage fallback
  const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
  const updated = local.map((b: AppointmentBooking) => (b.id === bookingId ? { ...b, ...updates } : b));
  localStorage.setItem('np_user_bookings', JSON.stringify(updated));
}

// Admin: Delete a booking
export async function deleteAppointmentBooking(bookingId: string): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    await deleteDoc(bookingRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `bookings/${bookingId}`);
  }
  // Also update local storage fallback
  const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
  const filtered = local.filter((b: AppointmentBooking) => b.id !== bookingId);
  localStorage.setItem('np_user_bookings', JSON.stringify(filtered));
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

  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    await setDoc(bookingRef, fullBooking);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bookings/${bookingId}`);
  }
  // Also update local storage fallback
  const local = JSON.parse(localStorage.getItem('np_user_bookings') || '[]');
  local.unshift(fullBooking);
  localStorage.setItem('np_user_bookings', JSON.stringify(local));
  return fullBooking;
}
