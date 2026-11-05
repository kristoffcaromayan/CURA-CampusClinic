import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canUserLogin,
  calculateClinicMetrics,
  evaluateInventoryHealth,
  canBookSession,
  validatePasscodeSecurity,
  DEFAULT_CLINIC_PASSCODE,
} from './clinicLogic';

import {
  UserAccount,
  Session,
  Appointment,
  InventoryItem,
  Doctor,
} from '../types';

test('Requirement 1: Instant Registration - approved accounts can log in immediately', () => {
  const instantUser: UserAccount = {
    id: 'user-1',
    fullName: 'Maria Santos',
    idNumber: '202300001',
    email: 'maria@gmail.com',
    role: 'student',
    courseOrDept: 'Bachelor of Science in Computer Science',
    status: 'approved', // Created instantly without waiting for admin approval
    createdAt: '2026-10-30',
  };

  const check = canUserLogin(instantUser);
  assert.equal(check.allowed, true);

  const rejectedUser: UserAccount = {
    ...instantUser,
    status: 'rejected',
  };
  assert.equal(canUserLogin(rejectedUser).allowed, false);
});

test('calculateClinicMetrics computes correct numbers across Student, Staff, Faculty, and Utility roles', () => {
  const doctors: Doctor[] = [
    { id: 'doc-1', name: 'Test Doctor', email: 'doctor@edoc.com', specialties: 'General Medicine', availableDays: 'Mon-Fri', tele: '09123456789' }
  ];
  const users: UserAccount[] = [
    { id: 'p-1', fullName: 'Student Juan', idNumber: '202300001', email: 'juan@edoc.com', role: 'student', courseOrDept: 'Bachelor of Science in Computer Science', status: 'approved', createdAt: '2026-10-01' },
    { id: 'p-2', fullName: 'Staff Maria', idNumber: '202300002', email: 'maria@edoc.com', role: 'staff', courseOrDept: 'Administrative Staff', status: 'approved', createdAt: '2026-10-02' },
    { id: 'p-3', fullName: 'Prof. Pedro', idNumber: '202300003', email: 'pedro@edoc.com', role: 'faculty', courseOrDept: 'Bachelor of Science in Agriculture', status: 'approved', createdAt: '2026-10-03' },
    { id: 'p-4', fullName: 'Utility Alex', idNumber: '202300004', email: 'alex@edoc.com', role: 'utility', courseOrDept: 'Campus Maintenance', status: 'approved', createdAt: '2026-10-04' }
  ];
  const appointments: Appointment[] = [
    { id: 'apt-1', appointmentNumber: 1, patientId: 'p-1', patientName: 'Student Juan', patientEmail: 'juan@edoc.com', idNumber: '202300001', doctorId: 'doc-1', doctorName: 'Test Doctor', sessionId: 'ses-1', sessionTitle: 'Test Session', scheduledDate: '2026-11-05', scheduledTime: '18:00', status: 'pending', createdAt: '2026-10-30' }
  ];
  const sessions: Session[] = [
    { id: 'ses-1', title: 'Test Session', doctorId: 'doc-1', doctorName: 'Test Doctor', scheduledDate: '2026-10-30', scheduledTime: '18:00', maxPatients: 10, bookedCount: 1, status: 'active' }
  ];

  const metrics = calculateClinicMetrics({
    doctors,
    users,
    appointments,
    sessions,
    todayDateStr: '2026-10-30'
  });

  assert.equal(metrics.allDoctors, 1);
  assert.equal(metrics.allPatients, 4); // All 4 roles counted
  assert.equal(metrics.newBookings, 1);
  assert.equal(metrics.todaySessions, 1);
});

test('evaluateInventoryHealth flags low and out-of-stock items', () => {
  const inventory: InventoryItem[] = [
    { id: '1', itemName: 'Paracetamol 500mg', category: 'Medicine', quantity: 15, minStockThreshold: 20, unit: 'boxes', lastRestocked: '2026-10-10' },
    { id: '2', itemName: 'Alcohol 70%', category: 'First Aid', quantity: 0, minStockThreshold: 10, unit: 'bottles', lastRestocked: '2026-09-15' },
    { id: '3', itemName: 'Sterile Gauze', category: 'First Aid', quantity: 50, minStockThreshold: 10, unit: 'packs', lastRestocked: '2026-10-20' },
  ];

  const health = evaluateInventoryHealth(inventory);
  assert.equal(health.totalItems, 3);
  assert.equal(health.lowStockItems.length, 1);
  assert.equal(health.outOfStockItems.length, 1);
});

test('canBookSession prevents double booking and checks capacity', () => {
  const patient: UserAccount = {
    id: 'p-1',
    fullName: 'Student Juan',
    idNumber: '202300001',
    email: 'juan@edoc.com',
    role: 'student',
    courseOrDept: 'Bachelor of Science in Computer Science',
    status: 'approved',
    createdAt: '2026-10-01',
  };

  const session: Session = {
    id: 'ses-1',
    title: 'Consultation',
    doctorId: 'doc-1',
    doctorName: 'Test Doctor',
    scheduledDate: '2026-11-10',
    scheduledTime: '10:00',
    maxPatients: 5,
    bookedCount: 5, // Full
    status: 'active',
  };

  // Full session check
  const fullCheck = canBookSession(patient, session, []);
  assert.equal(fullCheck.canBook, false);
  assert.match(fullCheck.reason || '', /maximum patient capacity/i);

  // Available session check
  const availableSession = { ...session, bookedCount: 2 };
  assert.equal(canBookSession(patient, availableSession, []).canBook, true);

  // Already booked check
  const existingAppt: Appointment = {
    id: 'apt-99',
    appointmentNumber: 1,
    patientId: 'p-1',
    patientName: 'Student Juan',
    patientEmail: 'juan@edoc.com',
    idNumber: '202300001',
    doctorId: 'doc-1',
    doctorName: 'Test Doctor',
    sessionId: 'ses-1',
    sessionTitle: 'Consultation',
    scheduledDate: '2026-11-10',
    scheduledTime: '10:00',
    status: 'confirmed',
    createdAt: '2026-10-28',
  };
  const duplicateCheck = canBookSession(patient, availableSession, [existingAppt]);
  assert.equal(duplicateCheck.canBook, false);
  assert.match(duplicateCheck.reason || '', /already have an appointment booked/i);
});

test('Security Gate: validatePasscodeSecurity checks default 12344321, dynamic passcodes, and dual access', () => {
  // Initial default passcode: 12344321
  assert.equal(DEFAULT_CLINIC_PASSCODE, '12344321');
  assert.equal(validatePasscodeSecurity('12344321', DEFAULT_CLINIC_PASSCODE).isValid, true);
  assert.equal(validatePasscodeSecurity('  12344321  ').isValid, true);
  assert.equal(validatePasscodeSecurity('00000000').isValid, false);

  // Authorized Dual Access: with custom key configured, BOTH custom key and 12344321 are valid!
  const customKey = 'CAMPUS_CLINIC_888';
  assert.equal(validatePasscodeSecurity('CAMPUS_CLINIC_888', customKey).isValid, true);
  assert.equal(validatePasscodeSecurity('  CAMPUS_CLINIC_888  ', customKey).isValid, true);
  assert.equal(validatePasscodeSecurity('12344321', customKey).isValid, true); // Dual Access check
  assert.equal(validatePasscodeSecurity('  12344321  ', customKey).isValid, true);

  // Invalid key
  assert.equal(validatePasscodeSecurity('WRONGKEY', customKey).isValid, false);
  assert.equal(validatePasscodeSecurity('', customKey).isValid, false);
});



