/**
 * Core Business Logic & State Machines for CURA NORSU Mabinay Campus Clinic System
 */
import { UserAccount, Doctor, Session, Appointment, InventoryItem } from '../types';

/**
 * Account login authorization check.
 * New registrations are approved instantly without requiring admin approval.
 * Rejected accounts remain blocked.
 */
export function canUserLogin(user: UserAccount | null | undefined): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Account does not exist.' };
  }
  if (user.status === 'rejected') {
    return { allowed: false, reason: 'This account was declined by clinic administration.' };
  }
  return { allowed: true };
}

/**
 * Filter sessions and appointments up until next Friday (from current date).
 */
export function isDateUntilNextFriday(dateStr: string, referenceDate: Date = new Date()): boolean {
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return false;

    // Reset reference to start of day
    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);

    // Find next Friday (Friday is day 5)
    const dayOfWeek = ref.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // next Friday (at least 1 day ahead)
    const nextFriday = new Date(ref);
    nextFriday.setDate(ref.getDate() + daysUntilFriday);
    nextFriday.setHours(23, 59, 59, 999);

    // Target must be >= ref and <= nextFriday
    const targetTime = target.getTime();
    return targetTime >= ref.getTime() - 86400000 && targetTime <= nextFriday.getTime();
  } catch {
    return false;
  }
}

/**
 * Calculate Clinic Status metrics for the 4 overview cards
 */
export function calculateClinicMetrics(data: {
  doctors: Doctor[];
  users: UserAccount[];
  appointments: Appointment[];
  sessions: Session[];
  todayDateStr?: string;
  forDoctorId?: string;
}) {
  const { doctors, users, appointments, sessions, todayDateStr, forDoctorId } = data;
  const today = todayDateStr || new Date().toISOString().split('T')[0];

  // Patients (users with student, staff, faculty, or utility role)
  const patientCount = users.filter(u =>
    u.role === 'student' || u.role === 'staff' || u.role === 'faculty' || u.role === 'utility'
  ).length;

  if (forDoctorId) {
    // Metrics tailored specifically for this doctor
    const doctorAppointments = appointments.filter(a => a.doctorId === forDoctorId);
    const doctorSessions = sessions.filter(s => s.doctorId === forDoctorId);

    return {
      allDoctors: doctors.length,
      allPatients: patientCount,
      newBookings: doctorAppointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
      todaySessions: doctorSessions.filter(s => s.scheduledDate === today && s.status === 'active').length,
    };
  }

  return {
    allDoctors: doctors.length,
    allPatients: patientCount,
    newBookings: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
    todaySessions: sessions.filter(s => s.scheduledDate === today && s.status === 'active').length,
  };
}

/**
 * Inventory health evaluator
 */
export function evaluateInventoryHealth(inventory: InventoryItem[]) {
  const lowStockItems = inventory.filter(
    i => i.quantity > 0 && i.quantity <= i.minStockThreshold
  );
  const outOfStockItems = inventory.filter(i => i.quantity <= 0);

  return {
    totalItems: inventory.length,
    lowStockItems,
    outOfStockItems,
    isHealthy: lowStockItems.length === 0 && outOfStockItems.length === 0,
  };
}

/**
 * Validate appointment booking
 */
export function canBookSession(
  user: UserAccount | null | undefined,
  session: Session,
  existingAppointments: Appointment[]
): { canBook: boolean; reason?: string } {
  if (!user) {
    return { canBook: false, reason: 'You must be signed in to book a consultation.' };
  }

  if (session.status !== 'active') {
    return { canBook: false, reason: 'This session is not currently active.' };
  }

  if (session.bookedCount >= session.maxPatients) {
    return { canBook: false, reason: 'This consultation session has reached its maximum patient capacity.' };
  }

  // Prevent duplicate booking for the same session
  const alreadyBooked = existingAppointments.some(
    a => a.patientId === user.id && a.sessionId === session.id && a.status !== 'cancelled'
  );

  if (alreadyBooked) {
    return { canBook: false, reason: 'You already have an appointment booked for this consultation session.' };
  }

  return { canBook: true };
}

export const DEFAULT_CLINIC_PASSCODE = '12344321';

/**
 * Security Passcode validator for Doctor and Admin gate.
 * Authorized Dual Access: Accepts the valid passcode for both Doctor and Admin users.
 * Guarantees that the default master key '12344321' is always recognized and accepted,
 * alongside any custom dynamic passcode configured in Firestore/database.
 */
export function validatePasscodeSecurity(
  inputCode: string,
  actualPasscode?: string
): { isValid: boolean; reason?: string } {
  if (!inputCode) {
    return { isValid: false, reason: 'Security passcode is required.' };
  }
  const cleanInput = inputCode.toString().trim();
  if (!cleanInput) {
    return { isValid: false, reason: 'Security passcode is required.' };
  }

  // Always accept the default master key
  if (cleanInput === DEFAULT_CLINIC_PASSCODE) {
    return { isValid: true };
  }

  // Also accept dynamically configured passcode
  if (actualPasscode && actualPasscode.trim()) {
    if (cleanInput === actualPasscode.trim()) {
      return { isValid: true };
    }
  }

  return { isValid: false, reason: 'Invalid security passcode. Access restricted to authorized personnel.' };
}


