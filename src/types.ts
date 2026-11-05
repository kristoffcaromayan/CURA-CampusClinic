export type UserRole = 'student' | 'staff' | 'faculty' | 'utility' | 'doctor' | 'admin';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'deletion_requested';

export const COURSES_AND_DEPARTMENTS = [
  'Bachelor of Science in Business Administration',
  'Bachelor of Science in Hospitality Management',
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Industrial Technology',
  'Bachelor of Science in Criminology',
  'Bachelor of Science in Agriculture',
  'Bachelor of Science in Secondary Education',
  'Bachelor of Science in Elementary Education',
] as const;

export const USER_CLIENT_ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'staff', label: 'Staff' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'utility', label: 'Utility' },
] as const;

export interface UserAccount {
  id: string;
  fullName: string;
  idNumber: string;
  email: string;
  role: UserRole;
  courseOrDept: string;
  status: AccountStatus;
  createdAt: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  deletionReason?: string;
  deletionRequestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  password?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialties: string;
  availableDays: string;
  tele: string;
  bio?: string;
  avatarUrl?: string;
}

export interface Session {
  id: string;
  title: string;
  doctorId: string;
  doctorName: string;
  scheduledDate: string;
  scheduledTime: string;
  maxPatients: number;
  bookedCount: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Appointment {
  id: string;
  appointmentNumber: number;
  patientId: string;
  patientName: string;
  patientEmail: string;
  idNumber: string;
  doctorId: string;
  doctorName: string;
  sessionId: string;
  sessionTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  consultationReason?: string; // what the patient wants to consult about
  patientNotes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: 'Medicine' | 'PPE' | 'First Aid' | 'Equipment';
  quantity: number;
  minStockThreshold: number;
  unit: string;
  lastRestocked: string;
}

export interface SentEmail {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  type: 'appointment_approval' | 'account_approval' | 'account_deletion' | 'general_message';
  sentAt: string;
  sentBy: string;
}
