import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile, getUserProfile, testConnection } from '../firebase';
import { UserProfile, ADMIN_EMAIL, isAdminEmail } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: UserProfile['role'],
    phone?: string
  ) => Promise<void>;
  adminSignIn: (email?: string, pass?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'signin' | 'signup', note?: string, onComplete?: () => void) => void;
  closeAuthModal: () => void;
  authModalMode: 'signin' | 'signup';
  authModalNote: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAdmin = Boolean(
    (user?.email && isAdminEmail(user.email)) ||
    userProfile?.role === 'admin'
  );

  // Auth modal management
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authModalNote, setAuthModalNote] = useState<string>('');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Test Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          const isUserAdmin = isAdminEmail(currentUser.email);
          if (profile) {
            // Guarantee admin role if email matches
            if (isUserAdmin && profile.role !== 'admin') {
              profile.role = 'admin';
            }
            setUserProfile(profile);
          } else {
            // Create user profile if document doesn't exist
            const synced = await syncUserProfile(currentUser, {
              role: isUserAdmin ? 'admin' : 'caregiver',
              displayName: isUserAdmin ? 'Clinical Director (Admin)' : undefined
            });
            setUserProfile(synced);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (
    mode: 'signin' | 'signup' = 'signin',
    note: string = '',
    onComplete?: () => void
  ) => {
    setAuthModalMode(mode);
    setAuthModalNote(note);
    if (onComplete) {
      setPendingCallback(() => onComplete);
    } else {
      setPendingCallback(null);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalNote('');
    setPendingCallback(null);
  };

  const executePendingAction = () => {
    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      cb();
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await syncUserProfile(cred.user);
    setUserProfile(profile);
    setIsAuthModalOpen(false);
    executePendingAction();
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: UserProfile['role'],
    phone?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    const profile = await syncUserProfile(cred.user, { displayName, role, phone });
    setUserProfile(profile);
    setIsAuthModalOpen(false);
    executePendingAction();
  };

  const adminSignIn = async (
    email: string = ADMIN_EMAIL,
    pass: string = 'besum1uve'
  ) => {
    try {
      // First try signing in
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await syncUserProfile(cred.user, {
        displayName: 'Clinical Director (Admin)',
        role: 'admin'
      });
      setUserProfile(profile);
      setIsAuthModalOpen(false);
      executePendingAction();
    } catch (err: any) {
      // If user doesn't exist yet, automatically register admin account
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-credential' ||
        err?.message?.includes('user-not-found')
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, email, pass);
          await updateProfile(newCred.user, { displayName: 'Clinical Director (Admin)' });
          const profile = await syncUserProfile(newCred.user, {
            displayName: 'Clinical Director (Admin)',
            role: 'admin'
          });
          setUserProfile(profile);
          setIsAuthModalOpen(false);
          executePendingAction();
          return;
        } catch (regErr) {
          console.error('Admin auto-registration fallback failed:', regErr);
          throw regErr;
        }
      }
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(cred.user, {
        displayName: cred.user.displayName || undefined,
      });
      setUserProfile(profile);
      setIsAuthModalOpen(false);
      executePendingAction();
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        signInWithEmail,
        signUpWithEmail,
        adminSignIn,
        signInWithGoogle,
        signOut,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        authModalNote,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
