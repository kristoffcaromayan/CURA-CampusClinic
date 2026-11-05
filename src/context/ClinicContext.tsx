import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, Doctor, Session, Appointment, InventoryItem, SentEmail } from '../types';
import {
  INITIAL_USERS,
  INITIAL_DOCTORS,
  INITIAL_SESSIONS,
  INITIAL_APPOINTMENTS,
  INITIAL_INVENTORY,
  INITIAL_EMAILS,
} from '../data/initialData';
import { canUserLogin, canBookSession } from '../lib/clinicLogic';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface ClinicContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  doctors: Doctor[];
  sessions: Session[];
  appointments: Appointment[];
  inventory: InventoryItem[];
  sentEmails: SentEmail[];
  latestEmailToast: SentEmail | null;
  clearLatestEmailToast: () => void;
  activePortal: 'patient' | 'doctor' | 'admin';
  setActivePortal: (portal: 'patient' | 'doctor' | 'admin') => void;
  login: (identifier: string, password?: string) => { success: boolean; message?: string };
  signUp: (userData: {
    fullName: string;
    idNumber: string;
    role: 'student' | 'staff' | 'faculty' | 'utility';
    courseOrDept: string;
    email: string;
    password?: string;
  }) => { success: boolean; message: string };
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRoleQuick: (role: 'patient' | 'doctor' | 'admin') => void;
  // User profile & deletion requests
  updateUserProfile: (userId: string, data: Partial<UserAccount>) => void;
  updateDoctorProfile: (doctorId: string, data: Partial<Doctor>) => void;
  requestAccountDeletion: (userId: string, reason: string) => void;
  cancelAccountDeletionRequest: (userId: string) => void;
  approveAccountDeletion: (userId: string) => void;
  declineAccountDeletion: (userId: string) => void;
  // Admin Operations
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  deleteDoctor: (doctorId: string) => void;
  addSession: (session: Omit<Session, 'id' | 'bookedCount'>) => void;
  cancelSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  // Patient & Doctor Appointment Operations
  bookAppointment: (
    sessionId: string,
    consultationReason?: string,
    patientNotes?: string
  ) => { success: boolean; message: string };
  adminAddAppointment: (data: {
    patientId: string;
    doctorId: string;
    sessionId?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    consultationReason: string;
    patientNotes?: string;
  }) => { success: boolean; message: string };
  editAppointment: (
    appointmentId: string,
    updates: {
      consultationReason?: string;
      patientNotes?: string;
      sessionId?: string;
      scheduledDate?: string;
      scheduledTime?: string;
    }
  ) => { success: boolean; message: string };
  approveAppointment: (appointmentId: string, approvedBy: string) => void;
  declineAppointment: (appointmentId: string, reason?: string) => void;
  cancelAppointment: (appointmentId: string) => void;
  deleteAppointment: (appointmentId: string) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  // Inventory Operations
  updateInventoryQuantity: (itemId: string, newQty: number) => void;
  updateInventoryItem: (itemId: string, updates: Partial<InventoryItem>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastRestocked'>) => void;
  deleteInventoryItem: (itemId: string) => void;
  // Email Dispatch System
  adminSendEmail: (to: string, recipientName: string, subject: string, body: string) => void;
  // Clinic Security Gate Passcode
  clinicPasscode: string;
  updateClinicPasscode: (newPasscode: string) => { success: boolean; message: string };
  resetClinicPasscode: () => void;
  verifyClinicPasscode: (code: string) => boolean;
  registerDoctorAccount: (data: {
    name: string;
    email: string;
    password?: string;
    specialties: string;
    availableDays?: string;
    tele?: string;
  }) => { success: boolean; message: string };
  registerAdminAccount: (data: {
    fullName: string;
    email: string;
    password?: string;
    idNumber?: string;
    courseOrDept?: string;
  }) => { success: boolean; message: string };
  resetDemoData: () => void;
  resetAllRegisteredAccounts: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

// Storage keys for CURA v5 with cleaned database state
const STORAGE_KEY_USERS = 'cura_users_v5';
const STORAGE_KEY_DOCTORS = 'cura_doctors_v5';
const STORAGE_KEY_SESSIONS = 'cura_sessions_v5';
const STORAGE_KEY_APPOINTMENTS = 'cura_appointments_v5';
const STORAGE_KEY_INVENTORY = 'cura_inventory_v5';
const STORAGE_KEY_EMAILS = 'cura_emails_v5';
const STORAGE_KEY_CURRENT_USER = 'cura_current_user_v5';
const STORAGE_KEY_CLINIC_PASSCODE = 'cura_clinic_security_passcode';
export const DEFAULT_CLINIC_PASSCODE = '12344321';

// Asynchronous Firestore Sync Helper with resilient offline fallback
const syncFirestoreDoc = async (collectionName: string, id: string, data: any | null) => {
  try {
    if (!id) return;
    if (data === null) {
      await deleteDoc(doc(db, collectionName, id));
    } else {
      await setDoc(doc(db, collectionName, id), data, { merge: true });
    }
  } catch (err) {
    // Non-blocking log for offline environments or permission restrictions
    console.debug(`[Firestore Sync ${collectionName}/${id}]:`, err);
  }
};

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy storage from previous versions on initial mount
  useEffect(() => {
    const legacyKeys = [
      'medigraph_users_v3',
      'medigraph_doctors_v3',
      'medigraph_sessions_v3',
      'medigraph_appointments_v3',
      'medigraph_inventory_v3',
      'medigraph_emails_v3',
      'medigraph_current_user_v3',
      'medigraph_users_v1',
      'medigraph_users_v2',
      'medigraph_users_v4',
    ];
    legacyKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // Ignore storage exceptions
      }
    });
  }, []);

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        const filtered = parsed.filter(u => u.role !== 'admin' && u.role !== 'doctor');
        return filtered.length > 0 ? filtered : [];
      } catch {
        return [];
      }
    }
    return INITIAL_USERS.filter(u => u.role !== 'admin' && u.role !== 'doctor');
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DOCTORS);
    return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [sentEmails, setSentEmails] = useState<SentEmail[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EMAILS);
    return saved ? JSON.parse(saved) : INITIAL_EMAILS;
  });

  const [latestEmailToast, setLatestEmailToast] = useState<SentEmail | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [activePortal, setActivePortal] = useState<'patient' | 'doctor' | 'admin'>('patient');

  // Security Gate Passcode for Doctor & Admin access (initial default: 12344321)
  const [clinicPasscode, setClinicPasscode] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CLINIC_PASSCODE);
    return saved && saved.trim() ? saved.trim() : DEFAULT_CLINIC_PASSCODE;
  });



  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLINIC_PASSCODE, clinicPasscode);
  }, [clinicPasscode]);

  // Real-time Firestore dynamic sync for CLINIC security key
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const gateDocRef = doc(db, 'settings', 'clinic_gate');
      unsubscribe = onSnapshot(
        gateDocRef,
        snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data?.passcode && typeof data.passcode === 'string') {
              const remoteKey = data.passcode.trim();
              if (remoteKey) {
                setClinicPasscode(remoteKey);
                localStorage.setItem(STORAGE_KEY_CLINIC_PASSCODE, remoteKey);
              }
            }
          } else {
            // Bootstrap initial key in Firestore database
            setDoc(
              gateDocRef,
              {
                passcode: DEFAULT_CLINIC_PASSCODE,
                updatedAt: new Date().toISOString(),
                updatedBy: 'System Bootstrap',
              },
              { merge: true }
            ).catch(err => {
              console.debug('[Firestore Init Gate Key Error]:', err);
            });
          }
        },
        error => {
          console.debug('[Firestore Gate Key Snapshot]:', error);
        }
      );
    } catch (e) {
      console.debug('[Firestore Snapshot Listener Error]:', e);
    }
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(sentEmails));
  }, [sentEmails]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // Sync activePortal with role of currentUser
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') setActivePortal('admin');
      else if (currentUser.role === 'doctor') setActivePortal('doctor');
      else setActivePortal('patient');
    }
  }, [currentUser]);

  // Central automated email dispatcher
  const dispatchEmail = (emailData: Omit<SentEmail, 'id' | 'sentAt'>) => {
    const newEmail: SentEmail = {
      ...emailData,
      id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sentAt: new Date().toISOString(),
    };
    setSentEmails(prev => [newEmail, ...prev]);
    setLatestEmailToast(newEmail);
  };

  const clearLatestEmailToast = () => {
    setLatestEmailToast(null);
  };

  // Login handler
  const login = (identifier: string, password?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const user = users.find(
      u => u.email.toLowerCase() === cleanId || u.idNumber.toLowerCase() === cleanId
    );

    if (!user) {
      return { success: false, message: 'Invalid credentials. User does not exist.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Incorrect password entered. Please try again.' };
    }

    const check = canUserLogin(user);
    if (!check.allowed) {
      return { success: false, message: check.reason };
    }

    setCurrentUser(user);
    return { success: true };
  };

  // Sign up handler: Requirement 1 -> INSTANT REGISTRATION without Admin approval!
  const signUp = (userData: {
    fullName: string;
    idNumber: string;
    role: 'student' | 'staff' | 'faculty' | 'utility';
    courseOrDept: string;
    email: string;
    password?: string;
  }) => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanId = userData.idNumber.trim();

    // Check duplicate
    const exists = users.some(
      u => u.email.toLowerCase() === cleanEmail || u.idNumber.toLowerCase() === cleanId.toLowerCase()
    );
    if (exists) {
      return {
        success: false,
        message: 'An account with this Email or School ID Number is already registered. Please log in.',
      };
    }

    // INSTANT REGISTRATION: status = 'approved' immediately!
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: userData.fullName.trim(),
      idNumber: cleanId,
      role: userData.role,
      courseOrDept: userData.courseOrDept,
      email: cleanEmail,
      password: userData.password || 'password123',
      status: 'approved',
      createdAt: new Date().toISOString().split('T')[0],
      phone: '',
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser); // Automatically log in right away

    // Dispatch automated confirmation email
    dispatchEmail({
      to: newUser.email,
      recipientName: newUser.fullName,
      subject: 'Welcome to CURA: Your NORSU Clinic Account Is Ready!',
      body: `Dear ${newUser.fullName},\n\nWelcome to CURA — the NORSU Mabinay Campus Clinic Portal!\n\nYour account (${newUser.idNumber} • ${newUser.role.toUpperCase()} • ${newUser.courseOrDept}) has been created and verified instantly. You do not need to wait for administrator approval.\n\nYou have immediate access to browse available clinic medicines, view physician schedules, and book consultation sessions with campus doctors.\n\nBest regards,\nNORSU Mabinay Campus Health & Medical Services Office`,
      type: 'account_approval',
      sentBy: 'CURA Automated Gate',
    });

    return {
      success: true,
      message: 'Account created successfully! You are now logged in to CURA Clinic.',
    };
  };

  // Google sign in via Firebase Auth
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const googleUser = res.user;
      const email = googleUser.email || '';
      const name = googleUser.displayName || 'Google User';

      // Check if existing
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        const isAdminEmail =
          email.toLowerCase() === 'caromayankristoff52@gmail.com' ||
          email.toLowerCase() === 'admin@edoc.com';

        user = {
          id: googleUser.uid,
          fullName: name,
          idNumber: `G-${googleUser.uid.substring(0, 7).toUpperCase()}`,
          email: email,
          role: isAdminEmail ? 'admin' : 'student',
          courseOrDept: isAdminEmail ? 'Campus Clinic Administration' : 'Bachelor of Science in Computer Science',
          status: 'approved', // Instantly approved
          createdAt: new Date().toISOString().split('T')[0],
          avatarUrl: googleUser.photoURL || undefined,
        };
        setUsers(prev => [user!, ...prev]);
      }

      const check = canUserLogin(user);
      if (!check.allowed) {
        return { success: false, message: check.reason };
      }

      setCurrentUser(user);
      return { success: true };
    } catch (err: unknown) {
      console.warn('Google sign-in popup error:', err);
      return { success: false, message: 'Google Sign-In canceled or popup blocked.' };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  };

  // Switch role for quick testing if user exists
  const switchRoleQuick = (targetRole: 'patient' | 'doctor' | 'admin') => {
    if (targetRole === 'admin') {
      const admin = users.find(u => u.role === 'admin') || INITIAL_USERS[0];
      setCurrentUser(admin);
    } else if (targetRole === 'doctor') {
      const doc = users.find(u => u.role === 'doctor') || INITIAL_USERS[2];
      setCurrentUser(doc);
    } else {
      const pat =
        users.find(
          u => u.role === 'student' || u.role === 'staff' || u.role === 'faculty' || u.role === 'utility'
        ) || INITIAL_USERS[1];
      if (pat) {
        setCurrentUser(pat);
      }
    }
  };

  // Update patient personal info & profile picture
  const updateUserProfile = (userId: string, data: Partial<UserAccount>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, ...data };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  // Update doctor personal info & profile picture
  const updateDoctorProfile = (doctorId: string, data: Partial<Doctor>) => {
    setDoctors(prev =>
      prev.map(d => {
        if (d.id === doctorId || d.email.toLowerCase() === currentUser?.email.toLowerCase()) {
          return { ...d, ...data };
        }
        return d;
      })
    );
    setUsers(prev =>
      prev.map(u => {
        if (u.id === doctorId || u.email.toLowerCase() === currentUser?.email.toLowerCase()) {
          const updatedUser = {
            ...u,
            fullName: data.name ?? u.fullName,
            courseOrDept: data.specialties ?? u.courseOrDept,
            phone: data.tele ?? u.phone,
            avatarUrl: data.avatarUrl ?? u.avatarUrl,
          };
          if (currentUser?.id === u.id) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      })
    );
  };

  // Requirement 2: Patient requests account deletion (Requires Admin Approval!)
  const requestAccountDeletion = (userId: string, reason: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated: UserAccount = {
            ...u,
            status: 'deletion_requested',
            deletionReason: reason,
            deletionRequestedAt: new Date().toISOString().split('T')[0],
          };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  // Cancel deletion request
  const cancelAccountDeletionRequest = (userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated: UserAccount = {
            ...u,
            status: 'approved',
            deletionReason: undefined,
            deletionRequestedAt: undefined,
          };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  // Requirement 2: Admin approves account deletion (permanently removes account)
  const approveAccountDeletion = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setAppointments(prev => prev.filter(a => a.patientId !== userId));

    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }

    if (userToDelete) {
      dispatchEmail({
        to: userToDelete.email,
        recipientName: userToDelete.fullName,
        subject: 'NORSU Clinic: Account Deletion Request Approved',
        body: `Dear ${userToDelete.fullName},\n\nYour request to delete your CURA NORSU Mabinay Campus Clinic account has been reviewed and approved by the Clinic Administrator. All personal clinic records have been securely removed.\n\nThank you,\nNORSU Mabinay Campus Health Clinic Administration`,
        type: 'account_deletion',
        sentBy: 'Clinic Administrator',
      });
    }
  };

  // Admin declines account deletion request
  const declineAccountDeletion = (userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated: UserAccount = {
            ...u,
            status: 'approved',
            deletionReason: undefined,
            deletionRequestedAt: undefined,
          };
          return updated;
        }
        return u;
      })
    );
  };

  // Admin approves user (legacy compatibility)
  const approveUser = (userId: string) => {
    const userToApprove = users.find(u => u.id === userId);
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? {
              ...u,
              status: 'approved',
              approvedAt: new Date().toISOString().split('T')[0],
              approvedBy: currentUser?.email || 'admin@edoc.com',
            }
          : u
      )
    );

    if (userToApprove) {
      dispatchEmail({
        to: userToApprove.email,
        recipientName: userToApprove.fullName,
        subject: 'Welcome to CURA: Your NORSU Clinic Account Has Been Approved!',
        body: `Dear ${userToApprove.fullName},\n\nYour registration for the NORSU Mabinay Campus Clinic (ID: ${userToApprove.idNumber}) has been verified.\n\nYou can now log in to the CURA portal to view physician schedules, browse available clinic medicines, and book doctor consultation sessions.\n\nPortal: CURA - NORSU Mabinay Campus Clinic\nBest regards,\nHealth & Medical Services Office`,
        type: 'account_approval',
        sentBy: currentUser?.fullName || 'Clinic Administrator',
      });
    }
  };

  const rejectUser = (userId: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status: 'rejected' } : u))
    );
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setAppointments(prev => prev.filter(a => a.patientId !== userId));
    syncFirestoreDoc('users', userId, null);
  };

  const addDoctor = (docData: Omit<Doctor, 'id'>) => {
    const newDoc: Doctor = {
      ...docData,
      id: `doc-${Date.now()}`,
    };
    setDoctors(prev => [...prev, newDoc]);

    const matchingUser: UserAccount = {
      id: newDoc.id,
      fullName: newDoc.name,
      idNumber: `DOC-${Date.now().toString().slice(-4)}`,
      email: newDoc.email,
      role: 'doctor',
      courseOrDept: newDoc.specialties,
      status: 'approved',
      createdAt: new Date().toISOString().split('T')[0],
      phone: newDoc.tele,
      password: 'password123',
    };
    setUsers(prev => [...prev, matchingUser]);
  };

  const deleteDoctor = (doctorId: string) => {
    const docToDelete = doctors.find(d => d.id === doctorId);
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
    // Remove corresponding user account if it exists
    setUsers(prev => prev.filter(u => u.id !== doctorId && u.email !== docToDelete?.email));
    // Cancel any active sessions for this doctor
    setSessions(prev =>
      prev.map(s => (s.doctorId === doctorId ? { ...s, status: 'cancelled' } : s))
    );
    // Cancel or unassign appointments for this doctor
    setAppointments(prev =>
      prev.map(a => (a.doctorId === doctorId ? { ...a, status: 'cancelled' } : a))
    );
    syncFirestoreDoc('doctors', doctorId, null);
  };

  const addSession = (sessionData: Omit<Session, 'id' | 'bookedCount'>) => {
    const newSession: Session = {
      ...sessionData,
      id: `ses-${Date.now()}`,
      bookedCount: 0,
    };
    setSessions(prev => [newSession, ...prev]);
  };

  const cancelSession = (sessionId: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, status: 'cancelled' } : s))
    );
    setAppointments(prev =>
      prev.map(a => (a.sessionId === sessionId ? { ...a, status: 'cancelled' } : a))
    );
    syncFirestoreDoc('sessions', sessionId, { status: 'cancelled' });
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setAppointments(prev =>
      prev.map(a => (a.sessionId === sessionId ? { ...a, status: 'cancelled' } : a))
    );
    syncFirestoreDoc('sessions', sessionId, null);
  };

  // Book consultation session
  const bookAppointment = (
    sessionId: string,
    consultationReason?: string,
    patientNotes?: string
  ): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'You must be signed in to book a session.' };
    }

    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, message: 'Selected consultation session does not exist.' };
    }

    const check = canBookSession(currentUser, session, appointments);
    if (!check.canBook) {
      return { success: false, message: check.reason || 'Cannot book this session.' };
    }

    const nextApptNumber = appointments.length + 1;
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: nextApptNumber,
      patientId: currentUser.id,
      patientName: currentUser.fullName,
      patientEmail: currentUser.email,
      idNumber: currentUser.idNumber,
      doctorId: session.doctorId,
      doctorName: session.doctorName,
      sessionId: session.id,
      sessionTitle: session.title,
      scheduledDate: session.scheduledDate,
      scheduledTime: session.scheduledTime,
      consultationReason: consultationReason || 'General Medical Consultation',
      patientNotes: patientNotes || '',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAppointments(prev => [newAppointment, ...prev]);
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, bookedCount: s.bookedCount + 1 } : s))
    );

    return {
      success: true,
      message: `Appointment #${nextApptNumber} booked successfully! Doctor or clinic administration will review your consultation request.`,
    };
  };

  // Edit scheduled consultation
  const editAppointment = (
    appointmentId: string,
    updates: {
      consultationReason?: string;
      patientNotes?: string;
      sessionId?: string;
      scheduledDate?: string;
      scheduledTime?: string;
    }
  ): { success: boolean; message: string } => {
    const existing = appointments.find(a => a.id === appointmentId);
    if (!existing) {
      return { success: false, message: 'Appointment not found.' };
    }

    let targetDoctorName = existing.doctorName;
    let targetDoctorId = existing.doctorId;
    let targetSessionTitle = existing.sessionTitle;

    if (updates.sessionId && updates.sessionId !== existing.sessionId) {
      const newSession = sessions.find(s => s.id === updates.sessionId);
      if (newSession) {
        targetDoctorName = newSession.doctorName;
        targetDoctorId = newSession.doctorId;
        targetSessionTitle = newSession.title;
        setSessions(prev =>
          prev.map(s => {
            if (s.id === existing.sessionId) {
              return { ...s, bookedCount: Math.max(0, s.bookedCount - 1) };
            }
            if (s.id === updates.sessionId) {
              return { ...s, bookedCount: s.bookedCount + 1 };
            }
            return s;
          })
        );
      }
    }

    setAppointments(prev =>
      prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              consultationReason: updates.consultationReason ?? a.consultationReason,
              patientNotes: updates.patientNotes ?? a.patientNotes,
              sessionId: updates.sessionId ?? a.sessionId,
              doctorName: targetDoctorName,
              doctorId: targetDoctorId,
              sessionTitle: targetSessionTitle,
              scheduledDate: updates.scheduledDate ?? a.scheduledDate,
              scheduledTime: updates.scheduledTime ?? a.scheduledTime,
            }
          : a
      )
    );

    return { success: true, message: 'Consultation session details updated successfully.' };
  };

  // Approve appointment & dispatch email notification
  const approveAppointment = (appointmentId: string, approvedBy: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    setAppointments(prev =>
      prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'confirmed',
              approvedBy: approvedBy,
              approvedAt: new Date().toISOString().split('T')[0],
            }
          : a
      )
    );

    dispatchEmail({
      to: apt.patientEmail,
      recipientName: apt.patientName,
      subject: `Appointment Confirmed: Session #${apt.appointmentNumber} with ${apt.doctorName}`,
      body: `Dear ${apt.patientName},\n\nYour consultation appointment #${apt.appointmentNumber} has been officially approved and confirmed by ${approvedBy}.\n\nAppointment Details:\n• Physician: ${apt.doctorName}\n• Session: ${apt.sessionTitle}\n• Scheduled Date: ${apt.scheduledDate}\n• Scheduled Time: ${apt.scheduledTime}\n• Consultation Topic: ${apt.consultationReason || 'General Consultation'}\n\nPlease arrive at the NORSU Mabinay Campus Clinic 10 minutes prior to your scheduled time with your university ID.\n\nBest regards,\nNORSU Mabinay Campus Health & Medical Services Office`,
      type: 'appointment_approval',
      sentBy: approvedBy,
    });
  };

  // Decline appointment
  const declineAppointment = (appointmentId: string, reason = 'Doctor schedule conflict') => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    setAppointments(prev =>
      prev.map(a => (a.id === appointmentId ? { ...a, status: 'cancelled' } : a))
    );

    setSessions(prev =>
      prev.map(s =>
        s.id === apt.sessionId ? { ...s, bookedCount: Math.max(0, s.bookedCount - 1) } : s
      )
    );

    dispatchEmail({
      to: apt.patientEmail,
      recipientName: apt.patientName,
      subject: `Appointment Notice: Session #${apt.appointmentNumber} Status Update`,
      body: `Dear ${apt.patientName},\n\nWe regret to inform you that your appointment #${apt.appointmentNumber} with ${apt.doctorName} for ${apt.scheduledDate} could not be confirmed at this time (${reason}).\n\nPlease log in to your CURA portal to select an alternative date or session slot.\n\nNORSU Mabinay Campus Health Clinic`,
      type: 'general_message',
      sentBy: 'NORSU Clinic Office',
    });
  };

  const cancelAppointment = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      setSessions(prev =>
        prev.map(s =>
          s.id === apt.sessionId ? { ...s, bookedCount: Math.max(0, s.bookedCount - 1) } : s
        )
      );
    }
    setAppointments(prev =>
      prev.map(a => (a.id === appointmentId ? { ...a, status: 'cancelled' } : a))
    );
  };

  const deleteAppointment = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt && apt.sessionId && (apt.status === 'confirmed' || apt.status === 'pending')) {
      setSessions(prev =>
        prev.map(s =>
          s.id === apt.sessionId ? { ...s, bookedCount: Math.max(0, s.bookedCount - 1) } : s
        )
      );
    }
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    syncFirestoreDoc('appointments', appointmentId, null);
  };

  const adminAddAppointment = (data: {
    patientId: string;
    doctorId: string;
    sessionId?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    consultationReason: string;
    patientNotes?: string;
  }): { success: boolean; message: string } => {
    const patient = users.find(u => u.id === data.patientId);
    if (!patient) {
      return { success: false, message: 'Selected patient account was not found.' };
    }

    const doctor = doctors.find(d => d.id === data.doctorId);
    const session = data.sessionId ? sessions.find(s => s.id === data.sessionId) : null;
    const doctorName = doctor ? doctor.name : (session ? session.doctorName : 'Attending Physician');

    const nextApptNumber = appointments.length + 1;
    const scheduledDate = data.scheduledDate || session?.scheduledDate || new Date().toISOString().split('T')[0];
    const scheduledTime = data.scheduledTime || session?.scheduledTime || '09:00 AM - 12:00 PM';

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: nextApptNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      patientEmail: patient.email,
      idNumber: patient.idNumber,
      doctorId: data.doctorId || (session?.doctorId ?? (doctor?.id || 'doc-1')),
      doctorName: doctorName,
      sessionId: session?.id || data.sessionId || `custom-ses-${Date.now()}`,
      sessionTitle: session?.title || `${doctorName} Clinical Consultation`,
      scheduledDate,
      scheduledTime,
      consultationReason: data.consultationReason || 'Clinical Consultation',
      patientNotes: data.patientNotes || 'Appointment scheduled directly by Clinic Administrator',
      status: 'confirmed',
      createdAt: new Date().toISOString().split('T')[0],
      approvedBy: 'Clinic Administrator',
      approvedAt: new Date().toISOString().split('T')[0],
    };

    setAppointments(prev => [newAppointment, ...prev]);

    if (session) {
      setSessions(prev =>
        prev.map(s => (s.id === session.id ? { ...s, bookedCount: s.bookedCount + 1 } : s))
      );
    }

    // Automatically send confirmation email notification to patient
    dispatchEmail({
      to: patient.email,
      recipientName: patient.fullName,
      subject: `Appointment Confirmed: #${nextApptNumber} with ${doctorName}`,
      body: `Dear ${patient.fullName},\n\nAn official clinic appointment (#${nextApptNumber}) has been scheduled for you by the Clinic Administrator.\n\nAppointment Details:\n• Physician: ${doctorName}\n• Date: ${scheduledDate}\n• Time: ${scheduledTime}\n• Reason: ${newAppointment.consultationReason}\n\nPlease proceed to the NORSU Mabinay Campus Clinic on your scheduled time.\n\nThank you,\nNORSU Mabinay Campus Health & Medical Services Unit`,
      type: 'appointment_approval',
      sentBy: 'Clinic Administrator',
    });

    return {
      success: true,
      message: `Appointment #${nextApptNumber} for ${patient.fullName} created & confirmed! Automated notification email sent to ${patient.email}.`,
    };
  };

  const updateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    setAppointments(prev =>
      prev.map(a => (a.id === appointmentId ? { ...a, status } : a))
    );
  };

  // Inventory operations
  const updateInventoryQuantity = (itemId: string, newQty: number) => {
    setInventory(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              quantity: Math.max(0, newQty),
              lastRestocked: new Date().toISOString().split('T')[0],
            }
          : i
      )
    );
  };

  const updateInventoryItem = (itemId: string, updates: Partial<InventoryItem>) => {
    setInventory(prev =>
      prev.map(i => (i.id === itemId ? { ...i, ...updates } : i))
    );
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      lastRestocked: new Date().toISOString().split('T')[0],
    };
    setInventory(prev => [newItem, ...prev]);
  };

  const deleteInventoryItem = (itemId: string) => {
    setInventory(prev => prev.filter(i => i.id !== itemId));
    syncFirestoreDoc('inventory', itemId, null);
  };

  // Custom email dispatch from admin
  const adminSendEmail = (to: string, recipientName: string, subject: string, body: string) => {
    dispatchEmail({
      to,
      recipientName,
      subject,
      body,
      type: 'general_message',
      sentBy: currentUser?.fullName || 'Clinic Administrator',
    });
  };

  // Requirement 3: Reset All Registered Accounts from this website
  const resetAllRegisteredAccounts = () => {
    const preservedAccounts = INITIAL_USERS.filter(
      u => u.role === 'admin' || u.role === 'doctor'
    );
    setUsers(preservedAccounts);
    setAppointments([]);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(preservedAccounts));
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify([]));
    if (
      currentUser &&
      (currentUser.role === 'student' ||
        currentUser.role === 'staff' ||
        currentUser.role === 'faculty' ||
        currentUser.role === 'utility')
    ) {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  };

  // Passcode verification for Doctor & Admin access
  // Authorized Dual Access: accepts the default master passcode 12344321,
  // as well as any dynamically updated passcode stored in Firestore / local state.
  const verifyClinicPasscode = (code: string): boolean => {
    if (!code) return false;
    const clean = code.toString().trim();
    if (!clean) return false;

    // 1. Dual Access: Always accept factory default passcode
    if (clean === DEFAULT_CLINIC_PASSCODE) {
      return true;
    }

    // 2. Accept dynamically configured passcode from state
    if (clinicPasscode && clean === clinicPasscode.trim()) {
      return true;
    }

    // 3. Resilient fallback to local storage
    const stored = localStorage.getItem(STORAGE_KEY_CLINIC_PASSCODE);
    if (stored && clean === stored.trim()) {
      return true;
    }

    return false;
  };

  const updateClinicPasscode = (newPasscode: string): { success: boolean; message: string } => {
    const trimmed = newPasscode.trim();
    if (trimmed.length < 4) {
      return { success: false, message: 'Passcode must be at least 4 characters long.' };
    }
    setClinicPasscode(trimmed);
    localStorage.setItem(STORAGE_KEY_CLINIC_PASSCODE, trimmed);

    // Dynamic database persistence in Firestore
    setDoc(
      doc(db, 'settings', 'clinic_gate'),
      {
        passcode: trimmed,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'Admin',
      },
      { merge: true }
    ).catch(err => {
      console.warn('[Firestore Update Gate Passcode]:', err);
    });

    return { success: true, message: 'Clinic security passcode successfully updated and saved to database!' };
  };

  const resetClinicPasscode = () => {
    setClinicPasscode(DEFAULT_CLINIC_PASSCODE);
    localStorage.setItem(STORAGE_KEY_CLINIC_PASSCODE, DEFAULT_CLINIC_PASSCODE);

    // Dynamic database persistence in Firestore
    setDoc(
      doc(db, 'settings', 'clinic_gate'),
      {
        passcode: DEFAULT_CLINIC_PASSCODE,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'Admin',
      },
      { merge: true }
    ).catch(err => {
      console.warn('[Firestore Reset Gate Passcode]:', err);
    });
  };



  // Register initial or additional Doctor account
  const registerDoctorAccount = (data: {
    name: string;
    email: string;
    password?: string;
    specialties: string;
    availableDays?: string;
    tele?: string;
  }): { success: boolean; message: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email address already exists. Please log in.' };
    }

    const docId = `doc-${Date.now()}`;
    const newDoctor: Doctor = {
      id: docId,
      name: data.name.trim(),
      email: cleanEmail,
      specialties: data.specialties.trim() || 'General Medicine & Campus Health',
      availableDays: data.availableDays?.trim() || 'Monday - Friday (8:00 AM - 5:00 PM)',
      tele: data.tele?.trim() || '09123456789',
      bio: 'Campus physician providing general medical consultation and student clearances.',
    };

    const newUser: UserAccount = {
      id: `usr-${docId}`,
      fullName: data.name.trim(),
      idNumber: `DOC-${Date.now().toString().slice(-6)}`,
      role: 'doctor',
      courseOrDept: data.specialties.trim() || 'Campus Health & Medical Services',
      email: cleanEmail,
      password: data.password || 'password123',
      status: 'approved',
      createdAt: new Date().toISOString().split('T')[0],
      phone: data.tele || '09123456789',
    };

    setDoctors(prev => [newDoctor, ...prev]);
    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);

    dispatchEmail({
      to: newUser.email,
      recipientName: newUser.fullName,
      subject: 'Welcome Doctor: Your CURA Physician Account is Active',
      body: `Dear Dr. ${newUser.fullName},\n\nYour Doctor account for NORSU Mabinay Campus Clinic has been successfully provisioned. You now have authorized access to manage consultation schedules, review patient appointments, and inspect clinic inventory.\n\nWarm regards,\nNORSU Mabinay Campus Clinic Administration`,
      type: 'account_approval',
      sentBy: 'CURA Security Gate',
    });

    return { success: true, message: 'Doctor account created! Welcome to the Doctor Portal.' };
  };

  // Register initial or additional Admin account
  const registerAdminAccount = (data: {
    fullName: string;
    email: string;
    password?: string;
    idNumber?: string;
    courseOrDept?: string;
  }): { success: boolean; message: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email address already exists. Please log in.' };
    }

    const newUser: UserAccount = {
      id: `usr-admin-${Date.now()}`,
      fullName: data.fullName.trim(),
      idNumber: data.idNumber?.trim() || `ADM-${Date.now().toString().slice(-5)}`,
      role: 'admin',
      courseOrDept: data.courseOrDept?.trim() || 'NORSU Clinic Administration',
      email: cleanEmail,
      password: data.password || 'password123',
      status: 'approved',
      createdAt: new Date().toISOString().split('T')[0],
      phone: '09123456789',
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);

    dispatchEmail({
      to: newUser.email,
      recipientName: newUser.fullName,
      subject: 'CURA Administrator Account Provisioned',
      body: `Dear ${newUser.fullName},\n\nYour Administrator account for NORSU Mabinay Campus Clinic has been initialized. You have elevated authorization to manage personnel schedules, medical supplies inventory, account approvals, and the CLINIC security passcode.\n\nBest regards,\nNORSU Mabinay Campus IT & Health Services`,
      type: 'account_approval',
      sentBy: 'CURA System Security',
    });

    return { success: true, message: 'Administrator account created! Welcome to the Admin Portal.' };
  };

  const resetDemoData = () => {
    setUsers(INITIAL_USERS);
    setDoctors(INITIAL_DOCTORS);
    setSessions(INITIAL_SESSIONS);
    setAppointments(INITIAL_APPOINTMENTS);
    setInventory(INITIAL_INVENTORY);
    setSentEmails(INITIAL_EMAILS);
    setClinicPasscode(DEFAULT_CLINIC_PASSCODE);
    setCurrentUser(null);
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY_CLINIC_PASSCODE, DEFAULT_CLINIC_PASSCODE);
  };


  return (
    <ClinicContext.Provider
      value={{
        currentUser,
        users,
        doctors,
        sessions,
        appointments,
        inventory,
        sentEmails,
        latestEmailToast,
        clearLatestEmailToast,
        activePortal,
        setActivePortal,
        login,
        signUp,
        loginWithGoogle,
        logout,
        switchRoleQuick,
        updateUserProfile,
        updateDoctorProfile,
        requestAccountDeletion,
        cancelAccountDeletionRequest,
        approveAccountDeletion,
        declineAccountDeletion,
        approveUser,
        rejectUser,
        deleteUser,
        addDoctor,
        deleteDoctor,
        addSession,
        cancelSession,
        deleteSession,
        bookAppointment,
        adminAddAppointment,
        editAppointment,
        approveAppointment,
        declineAppointment,
        cancelAppointment,
        deleteAppointment,
        updateAppointmentStatus,
        updateInventoryQuantity,
        updateInventoryItem,
        addInventoryItem,
        deleteInventoryItem,
        adminSendEmail,
        clinicPasscode,
        updateClinicPasscode,
        resetClinicPasscode,
        verifyClinicPasscode,
        registerDoctorAccount,
        registerAdminAccount,
        resetDemoData,
        resetAllRegisteredAccounts,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within ClinicProvider');
  }
  return context;
};
