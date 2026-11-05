import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { TopBar } from './TopBar';
import { StatusCards } from './StatusCards';
import { isDateUntilNextFriday, evaluateInventoryHealth } from '../lib/clinicLogic';
import {
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Package,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  BriefcaseMedical,
  Mail,
  Send,
  Edit3,
  Check,
  UserX,
  FileText,
  Key,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Shield,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Appointment, InventoryItem, UserAccount } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { RegisteredAccountsModal } from './RegisteredAccountsModal';

interface AdminPortalProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentTab, onNavigateTab, onToggleMobileMenu }) => {
  const {
    currentUser,
    users,
    doctors,
    sessions,
    appointments,
    inventory,
    sentEmails,
    approveUser,
    rejectUser,
    deleteUser,
    addDoctor,
    deleteDoctor,
    addSession,
    cancelSession,
    deleteSession,
    approveAppointment,
    declineAppointment,
    cancelAppointment,
    deleteAppointment,
    adminAddAppointment,
    editAppointment,
    approveAccountDeletion,
    declineAccountDeletion,
    updateInventoryQuantity,
    addInventoryItem,
    deleteInventoryItem,
    adminSendEmail,
    resetAllRegisteredAccounts,
    clinicPasscode,
    updateClinicPasscode,
    resetClinicPasscode,
  } = useClinic();

  const [searchDoctorFilter, setSearchDoctorFilter] = useState('');
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showAddAptModal, setShowAddAptModal] = useState(false);
  const [approvalSubTab, setApprovalSubTab] = useState<'pending' | 'deletions'>('pending');

  // Edit Appointment Modal State (Admin assisting doctors with scheduling)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editAptReason, setEditAptReason] = useState('');
  const [editAptSessionId, setEditAptSessionId] = useState('');

  // Add Appointment Modal State (Admin booking appointment on behalf of patient)
  const [addAptPatientId, setAddAptPatientId] = useState('');
  const [addAptDoctorId, setAddAptDoctorId] = useState('');
  const [addAptSessionId, setAddAptSessionId] = useState('');
  const [addAptDate, setAddAptDate] = useState('');
  const [addAptTime, setAddAptTime] = useState('09:00 AM - 12:00 PM');
  const [addAptReason, setAddAptReason] = useState('General Health Consultation');
  const [addAptNotes, setAddAptNotes] = useState('');
  const [aptFeedbackToast, setAptFeedbackToast] = useState<{ success: boolean; message: string } | null>(null);

  // New Doctor form
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docSpec, setDocSpec] = useState('General Medicine & Campus Health');
  const [docDays, setDocDays] = useState('Monday - Friday (8:00 AM - 5:00 PM)');
  const [docTele, setDocTele] = useState('09123456789');

  // New Inventory form
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState<'Medicine' | 'PPE' | 'First Aid' | 'Equipment'>('Medicine');
  const [invQty, setInvQty] = useState(25);
  const [invThreshold, setInvThreshold] = useState(10);
  const [invUnit, setInvUnit] = useState('boxes');

  // Admin Compose Email State
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSentToast, setEmailSentToast] = useState(false);

  // Safety Confirmation Modal State (Destructive action protection)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemDetails?: Array<{ label: string; value: string }>;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    action: () => void;
  } | null>(null);

  // Dynamic Feedback Toast Notification State
  const [adminToast, setAdminToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Registered Accounts Management Modal State
  const [showRegisteredAccountsModal, setShowRegisteredAccountsModal] = useState(false);

  // Add Session Schedule Modal State
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDoctorId, setSessionDoctorId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('09:00 AM - 12:00 PM');
  const [sessionMax, setSessionMax] = useState(15);

  // Security Gate Key Management State (Admin settings)
  const [showCurrentPasscode, setShowCurrentPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showNewPasscode, setShowNewPasscode] = useState(false);
  const [passcodeFeedback, setPasscodeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAdminToast({ message, type });
  };

  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeFeedback(null);
    if (!newPasscode || newPasscode.trim().length < 4) {
      setPasscodeFeedback({ type: 'error', message: 'New passcode must be at least 4 characters long.' });
      return;
    }
    if (newPasscode.trim() !== confirmPasscode.trim()) {
      setPasscodeFeedback({ type: 'error', message: 'Passcodes do not match. Please verify both fields.' });
      return;
    }
    const res = updateClinicPasscode(newPasscode.trim());
    if (res.success) {
      setPasscodeFeedback({ type: 'success', message: 'CLINIC Security Gate Passcode successfully updated and saved to database!' });
      setNewPasscode('');
      setConfirmPasscode('');
      triggerToast('CLINIC Security Passcode updated and synced to database.');
    } else {
      setPasscodeFeedback({ type: 'error', message: res.message });
    }
  };

  const handleResetPasscodeConfirm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Security Gate Passcode',
      message: 'Are you sure you want to restore the CLINIC security passcode back to the default factory key (12344321)?',
      itemDetails: [
        { label: 'Current Key', value: showCurrentPasscode ? (clinicPasscode || '12344321') : '••••••••' },
        { label: 'Reset Target', value: '12344321 (Default Key)' },
      ],
      confirmText: 'Reset to Default (12344321)',
      confirmVariant: 'warning',
      action: () => {
        resetClinicPasscode();
        setPasscodeFeedback({ type: 'success', message: 'Security passcode restored to default (12344321) and synced to database.' });
        triggerToast('Security Gate Passcode restored to default (12344321).');
      },
    });
  };



  React.useEffect(() => {
    if (!adminToast) return;
    const timer = setTimeout(() => {
      setAdminToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [adminToast]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle || !sessionDoctorId || !sessionDate || !sessionTime) {
      triggerToast('Please complete all required schedule fields.', 'error');
      return;
    }
    const doc = doctors.find(d => d.id === sessionDoctorId);
    if (!doc) return;
    addSession({
      title: sessionTitle,
      doctorId: doc.id,
      doctorName: doc.name,
      scheduledDate: sessionDate,
      scheduledTime: sessionTime,
      maxPatients: Number(sessionMax) || 15,
      status: 'active',
    });
    setSessionTitle('');
    setSessionDoctorId('');
    setSessionDate('');
    setShowAddSessionModal(false);
    triggerToast(`New consultation schedule "${sessionTitle}" added successfully!`);
  };

  if (!currentUser) return null;

  // Filtered lists
  const pendingUsers = users.filter(u => u.status === 'pending');
  const deletionRequests = users.filter(u => u.status === 'deletion_requested');
  const approvedPatients = users.filter(
    u =>
      (u.role === 'student' || u.role === 'staff' || u.role === 'faculty' || u.role === 'utility') &&
      u.status === 'approved'
  );

  // Upcoming until next Friday matching screenshots
  const upcomingAppointments = appointments.filter(
    a => a.status !== 'cancelled' && isDateUntilNextFriday(a.scheduledDate)
  );

  const upcomingSessions = sessions.filter(
    s => s.status === 'active' && isDateUntilNextFriday(s.scheduledDate)
  );

  const inventoryHealth = evaluateInventoryHealth(inventory);

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docEmail) return;
    addDoctor({
      name: docName,
      email: docEmail,
      specialties: docSpec,
      availableDays: docDays,
      tele: docTele,
    });
    setDocName('');
    setDocEmail('');
    setShowAddDoctorModal(false);
  };

  const handleCreateInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName) return;
    addInventoryItem({
      itemName: invName,
      category: invCategory,
      quantity: Number(invQty),
      minStockThreshold: Number(invThreshold),
      unit: invUnit,
    });
    setInvName('');
    setShowAddInventoryModal(false);
  };

  const handleOpenEditApt = (apt: Appointment) => {
    setEditingAppointment(apt);
    setEditAptReason(apt.consultationReason || apt.sessionTitle);
    setEditAptSessionId(apt.sessionId);
  };

  const handleSaveEditApt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    const selectedSession = sessions.find(s => s.id === editAptSessionId);
    editAppointment(editingAppointment.id, {
      consultationReason: editAptReason,
      sessionId: editAptSessionId,
      scheduledDate: selectedSession?.scheduledDate,
      scheduledTime: selectedSession?.scheduledTime,
    });
    setEditingAppointment(null);
  };

  const handleSendAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipient || !emailSubject || !emailBody) return;

    if (emailRecipient === 'ALL_PATIENTS') {
      approvedPatients.forEach(p => {
        adminSendEmail(p.email, p.fullName, emailSubject, emailBody);
      });
    } else {
      const targetUser = users.find(u => u.email === emailRecipient);
      adminSendEmail(
        emailRecipient,
        targetUser?.fullName || 'Patient',
        emailSubject,
        emailBody
      );
    }

    setEmailSubject('');
    setEmailBody('');
    setEmailSentToast(true);
    setTimeout(() => setEmailSentToast(false), 3000);
  };

  const handleCreateAdminAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAptPatientId || !addAptDoctorId) {
      alert('Please select both a patient and a physician.');
      return;
    }

    const res = adminAddAppointment({
      patientId: addAptPatientId,
      doctorId: addAptDoctorId,
      sessionId: addAptSessionId || undefined,
      scheduledDate: addAptDate || undefined,
      scheduledTime: addAptTime || undefined,
      consultationReason: addAptReason,
      patientNotes: addAptNotes,
    });

    setAptFeedbackToast(res);
    setTimeout(() => setAptFeedbackToast(null), 5000);

    if (res.success) {
      setShowAddAptModal(false);
      setAddAptPatientId('');
      setAddAptNotes('');
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen overflow-y-auto">
      <TopBar
        title={currentTab === 'dashboard' ? 'Dashboard' : currentTab.replace('-', ' ').toUpperCase()}
        onToggleMobileMenu={onToggleMobileMenu}
        onSearch={q => {
          setSearchDoctorFilter(q);
          onNavigateTab('doctors');
        }}
      />

      {/* Appointment feedback toast notification */}
      {aptFeedbackToast && (
        <div
          className={`mb-6 p-4 rounded-xl border text-xs flex items-center justify-between shadow-2xs ${
            aptFeedbackToast.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {aptFeedbackToast.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{aptFeedbackToast.message}</span>
          </div>
          <button
            onClick={() => setAptFeedbackToast(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW: DASHBOARD (matching admin side.JPG & admin side_2.JPG) */}
      {currentTab === 'dashboard' && (
        <>
          {/* Status Overview Metric Cards */}
          <StatusCards />

          {/* Pending Approval Banner if pending accounts or deletion requests exist */}
          {(pendingUsers.length > 0 || deletionRequests.length > 0) && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {pendingUsers.length} Pending Registration{pendingUsers.length !== 1 ? 's' : ''} &amp; {deletionRequests.length} Account Deletion Request{deletionRequests.length !== 1 ? 's' : ''}
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Accounts are permanently retained in storage and cannot log in until approved. Deletion requests require administrator sign-off.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('approvals')}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded shadow-2xs transition"
              >
                Review Requests
              </button>
            </div>
          )}

          {/* Two-Column Split Layout matching admin side.JPG */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: Upcoming Appointments until Next Friday */}
            <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#007FFF] mb-1">
                  Upcoming Appointments until Next Friday
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Here&apos;s Quick access to Upcoming Appointments until 7 days. More details available in @Appointment section.
                </p>

                <div className="overflow-x-auto min-h-[170px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-[#007FFF]/40 text-[11px] font-bold text-slate-700">
                        <th className="py-2 px-2">Appointment number</th>
                        <th className="py-2 px-2">Patient name</th>
                        <th className="py-2 px-2">Doctor</th>
                        <th className="py-2 px-2">Consultation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {upcomingAppointments.length > 0 ? (
                        upcomingAppointments.slice(0, 3).map(apt => (
                          <tr key={apt.id} className="hover:bg-slate-50">
                            <td className="py-3 px-2 font-bold text-slate-900">{apt.appointmentNumber}</td>
                            <td className="py-3 px-2 font-medium text-slate-800">{apt.patientName}</td>
                            <td className="py-3 px-2 text-slate-600">{apt.doctorName}</td>
                            <td className="py-3 px-2 text-slate-600">{apt.consultationReason || apt.sessionTitle}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            <div className="w-24 h-16 mx-auto mb-2 opacity-60 flex items-center justify-center">
                              <span className="text-3xl">👥</span>
                            </div>
                            <p className="text-[11px] text-slate-500">No appointments scheduled before next Friday.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('appointments')}
                className="mt-4 w-full py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded shadow-2xs transition text-center"
              >
                Show all Appointments
              </button>
            </div>

            {/* COLUMN 2: Upcoming Sessions until Next Friday */}
            <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#007FFF] mb-1">
                  Upcoming Sessions until Next Friday
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Here&apos;s Quick access to Upcoming Sessions scheduled until 7 days. Add, Remove and Many features available in @Schedule section.
                </p>

                <div className="overflow-x-auto min-h-[170px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-[#007FFF]/40 text-[11px] font-bold text-slate-700">
                        <th className="py-2 px-2">Session Title</th>
                        <th className="py-2 px-2">Doctor</th>
                        <th className="py-2 px-2">Sheduled Date &amp; Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {upcomingSessions.length > 0 ? (
                        upcomingSessions.slice(0, 3).map(ses => (
                          <tr key={ses.id} className="hover:bg-slate-50">
                            <td className="py-3 px-2 font-semibold text-slate-800">{ses.title}</td>
                            <td className="py-3 px-2 text-slate-600">{ses.doctorName}</td>
                            <td className="py-3 px-2 text-slate-600 font-mono text-[11px]">
                              {ses.scheduledDate} {ses.scheduledTime}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-400">
                            <div className="w-24 h-16 mx-auto mb-2 opacity-60 flex items-center justify-center">
                              <span className="text-3xl">📅</span>
                            </div>
                            <p className="text-[11px] text-slate-500">No sessions scheduled before next Friday.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('schedule')}
                className="mt-4 w-full py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded shadow-2xs transition text-center"
              >
                Show all Sessions
              </button>
            </div>
          </div>
        </>
      )}

      {/* VIEW: ACCOUNT APPROVALS & DELETION REQUESTS */}
      {currentTab === 'approvals' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Account Approvals &amp; Deletion Management</h2>
              <p className="text-xs text-slate-500">
                Approving an applicant automatically dispatches a welcome &amp; approval notification email to their registered address.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setApprovalSubTab('pending')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  approvalSubTab === 'pending' ? 'bg-[#007FFF] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Registrations ({pendingUsers.length})
              </button>
              <button
                onClick={() => setApprovalSubTab('deletions')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  approvalSubTab === 'deletions' ? 'bg-[#007FFF] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Deletion Requests ({deletionRequests.length})
              </button>
            </div>
          </div>

          {approvalSubTab === 'pending' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Applicant Name</th>
                    <th className="py-2.5 px-3">ID Number</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Course / Department</th>
                    <th className="py-2.5 px-3">Registered Email</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter(
                      u =>
                        (u.role === 'student' ||
                          u.role === 'staff' ||
                          u.role === 'faculty' ||
                          u.role === 'utility') &&
                        u.status !== 'deletion_requested'
                    )
                    .map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-bold text-slate-800">{user.fullName}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{user.idNumber}</td>
                        <td className="py-3 px-3 capitalize font-medium">{user.role}</td>
                        <td className="py-3 px-3 text-slate-600">{user.courseOrDept}</td>
                        <td className="py-3 px-3 text-slate-600">{user.email}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                              user.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : user.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {user.status === 'pending' ? 'Pending Review' : user.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {user.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => approveUser(user.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] transition shadow-2xs inline-flex items-center gap-1"
                                title="Approve and automatically send welcome email"
                              >
                                <Check className="w-3 h-3" />
                                Approve &amp; Email
                              </button>
                              <button
                                onClick={() => rejectUser(user.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded text-[11px] transition"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Approved {user.approvedAt || 'Active'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Sub-tab 2: Patient Account Deletion Requests */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">ID Number</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Date Requested</th>
                    <th className="py-2.5 px-3">Stated Reason</th>
                    <th className="py-2.5 px-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletionRequests.length > 0 ? (
                    deletionRequests.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-bold text-slate-800">{user.fullName}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{user.idNumber}</td>
                        <td className="py-3 px-3 text-slate-600">{user.email}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{user.deletionRequestedAt}</td>
                        <td className="py-3 px-3 text-rose-700 font-medium">{user.deletionReason || 'Not specified'}</td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => approveAccountDeletion(user.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] transition shadow-2xs inline-flex items-center gap-1"
                          >
                            <UserX className="w-3 h-3" />
                            Approve Deletion
                          </button>
                          <button
                            onClick={() => declineAccountDeletion(user.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] transition"
                          >
                            Decline
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No patient account deletion requests pending.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW: APPOINTMENTS (Admin can Add, Edit, Approve, Decline, and Delete appointments) */}
      {currentTab === 'appointments' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">All Doctor Consultation Appointments</h2>
              <p className="text-xs text-slate-500">
                Administrators can book, edit, approve, decline, or delete doctor appointments to assist physicians.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddAptModal(true)}
                className="px-3.5 py-1.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Book Doctor Appointment
              </button>
              <span className="text-xs font-bold text-[#007FFF] px-2.5 py-1 bg-blue-50 rounded-full shrink-0">
                {appointments.length} Total
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">ID Number</th>
                  <th className="py-2.5 px-3">Consultation Reason</th>
                  <th className="py-2.5 px-3">Physician</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length > 0 ? (
                  appointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">{apt.appointmentNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{apt.patientName}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{apt.idNumber}</td>
                      <td className="py-3 px-3 text-[#007FFF] font-medium">
                        {apt.consultationReason || apt.sessionTitle}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{apt.doctorName}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {apt.scheduledDate} {apt.scheduledTime}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : apt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {apt.status === 'confirmed' ? 'Approved' : apt.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {apt.status !== 'cancelled' && (
                          <>
                            {apt.status === 'pending' && (
                              <button
                                onClick={() => approveAppointment(apt.id, 'Clinic Administrator')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                title="Approve & automatically dispatch confirmation email"
                              >
                                <Check className="w-3 h-3" />
                                Approve &amp; Email
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditApt(apt)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#007FFF] border border-blue-200 font-bold rounded text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => declineAppointment(apt.id)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold rounded text-[11px] transition cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Remove Appointment Record',
                              message: `Are you sure you want to cancel and remove Appointment #${apt.appointmentNumber} for patient ${apt.patientName}? This appointment record will be permanently removed.`,
                              itemDetails: [
                                { label: 'Appointment No.', value: `#${apt.appointmentNumber}` },
                                { label: 'Patient Name', value: apt.patientName },
                                { label: 'Doctor', value: apt.doctorName },
                                { label: 'Scheduled Date/Time', value: `${apt.scheduledDate} ${apt.scheduledTime}` },
                                { label: 'Topic', value: apt.consultationReason || apt.sessionTitle },
                              ],
                              confirmText: 'Remove Appointment',
                              confirmVariant: 'danger',
                              action: () => {
                                deleteAppointment(apt.id);
                                triggerToast(`Appointment #${apt.appointmentNumber} for ${apt.patientName} was removed successfully.`);
                              },
                            });
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Permanently remove appointment record"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No appointments booked yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: DOCTORS */}
      {currentTab === 'doctors' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Clinic Physicians Directory</h2>
              <p className="text-xs text-slate-500">Manage registered doctors, assign schedules, and add new medical officers.</p>
            </div>
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="px-4 py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Doctor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Doctor Name</th>
                  <th className="py-2.5 px-3">Specialties</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Available Days</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors
                  .filter(
                    d =>
                      !searchDoctorFilter ||
                      d.name.toLowerCase().includes(searchDoctorFilter.toLowerCase()) ||
                      d.email.toLowerCase().includes(searchDoctorFilter.toLowerCase())
                  )
                  .map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">{doc.name}</td>
                      <td className="py-3 px-3 text-[#007FFF] font-semibold">{doc.specialties}</td>
                      <td className="py-3 px-3 text-slate-600">{doc.email}</td>
                      <td className="py-3 px-3 text-slate-600">{doc.availableDays}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{doc.tele}</td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Remove Doctor Profile',
                              message: `Are you sure you want to remove Dr. ${doc.name}? All active sessions and upcoming appointments for this doctor will be cancelled automatically.`,
                              itemDetails: [
                                { label: 'Doctor Name', value: doc.name },
                                { label: 'Specialties', value: doc.specialties },
                                { label: 'Email', value: doc.email },
                                { label: 'Available Days', value: doc.availableDays },
                              ],
                              confirmText: 'Remove Doctor',
                              confirmVariant: 'danger',
                              action: () => {
                                deleteDoctor(doc.id);
                                triggerToast(`Doctor ${doc.name} was successfully removed from the clinic directory.`);
                              },
                            });
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Remove Doctor Profile"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SCHEDULE */}
      {currentTab === 'schedule' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Doctor Consultation Schedule Management</h2>
              <p className="text-xs text-slate-500">
                Create physician consultation schedules, monitor booking capacities, and remove obsolete timetables.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddSessionModal(true)}
                className="px-3.5 py-1.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Schedule
              </button>
              <span className="text-xs font-bold text-[#007FFF] px-2.5 py-1 bg-blue-50 rounded-full shrink-0">
                {sessions.length} Sessions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map(ses => (
              <div
                key={ses.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:shadow-xs transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{ses.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        ses.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {ses.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">
                    Doctor: <span className="font-bold text-slate-800">{ses.doctorName}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    📅 {ses.scheduledDate} at {ses.scheduledTime}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Capacity:</span>
                    <span className="font-bold text-slate-700 font-mono">
                      {ses.bookedCount} / {ses.maxPatients} patients
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Remove Consultation Schedule',
                        message: `Are you sure you want to remove consultation schedule "${ses.title}"? Any patient bookings associated with this session will be cancelled.`,
                        itemDetails: [
                          { label: 'Session Title', value: ses.title },
                          { label: 'Doctor', value: ses.doctorName },
                          { label: 'Date & Time', value: `${ses.scheduledDate} (${ses.scheduledTime})` },
                          { label: 'Booked Count', value: `${ses.bookedCount} / ${ses.maxPatients} patients` },
                          { label: 'Current Status', value: ses.status },
                        ],
                        confirmText: 'Remove Schedule',
                        confirmVariant: 'danger',
                        action: () => {
                          deleteSession(ses.id);
                          triggerToast(`Consultation schedule "${ses.title}" was successfully removed.`);
                        },
                      });
                    }}
                    className="w-full py-1.5 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Remove schedule entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No consultation schedules found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add New Schedule" above to post a session.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW: PATIENTS */}
      {currentTab === 'patients' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Approved Patient Accounts</h2>
              <p className="text-xs text-slate-500">Registered Student, Staff, Faculty, and Utility accounts.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Functional Registered Accounts Button */}
              <button
                type="button"
                onClick={() => setShowRegisteredAccountsModal(true)}
                className="px-3.5 py-1.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="View, verify, search, and manage registered patient accounts"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Registered Accounts
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Database Reset: Clear Registered Accounts',
                    message:
                      'Are you sure you want to remove all registered student, staff, faculty, and utility accounts? All user accounts and bookings will be cleared while preserving administrators and doctors.',
                    confirmText: 'Confirm Wipe',
                    confirmVariant: 'danger',
                    action: () => {
                      resetAllRegisteredAccounts();
                      triggerToast('Database reset complete: All registered patient accounts wiped.');
                    },
                  });
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Wipe all registered user accounts from website"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Accounts
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('approvals')}
                className="text-xs font-bold text-[#007FFF] hover:underline whitespace-nowrap cursor-pointer ml-1"
              >
                Pending Requests ({pendingUsers.length + deletionRequests.length})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Full Legal Name</th>
                  <th className="py-2.5 px-3">ID Number</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Course / Department</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Registered Since</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-bold text-slate-800">{p.fullName}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{p.idNumber}</td>
                    <td className="py-3 px-3 capitalize">{p.role}</td>
                    <td className="py-3 px-3 text-slate-600">{p.courseOrDept}</td>
                    <td className="py-3 px-3 text-slate-600">{p.email}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{p.createdAt}</td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Remove Patient Account',
                            message: `Are you sure you want to delete patient account "${p.fullName}" (${p.idNumber})? All associated appointments will be cleared.`,
                            itemDetails: [
                              { label: 'Patient Name', value: p.fullName },
                              { label: 'School ID', value: p.idNumber },
                              { label: 'Role', value: p.role },
                              { label: 'Course / Dept', value: p.courseOrDept },
                              { label: 'Email', value: p.email },
                            ],
                            confirmText: 'Remove Account',
                            confirmVariant: 'danger',
                            action: () => {
                              deleteUser(p.id);
                              triggerToast(`Patient account "${p.fullName}" was successfully removed.`);
                            },
                          });
                        }}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                        title="Remove patient account"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: INVENTORY SUPPLIES (Admin can ADD, DELETE, and update supplies) */}
      {currentTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Health Metric Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Medical Supplies</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{inventoryHealth.totalItems} Items</span>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 bg-amber-50/30 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Low-Stock Warnings
              </span>
              <span className="text-2xl font-bold text-amber-800 block mt-1">
                {inventoryHealth.lowStockItems.length} Needs Restock
              </span>
            </div>
            <div className="bg-white rounded-lg border border-rose-200 bg-rose-50/30 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Out of Stock Critical
              </span>
              <span className="text-2xl font-bold text-rose-800 block mt-1">
                {inventoryHealth.outOfStockItems.length} Depleted
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Pharmacy &amp; Office Medical Supplies Inventory</h2>
                <p className="text-xs text-slate-500">
                  Full control: Add new medical items, restock quantities, or delete obsolete clinic office supplies.
                </p>
              </div>
              <button
                onClick={() => setShowAddInventoryModal(true)}
                className="px-4 py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Supply Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Stock Quantity</th>
                    <th className="py-2.5 px-3">Min Threshold</th>
                    <th className="py-2.5 px-3">Stock Status</th>
                    <th className="py-2.5 px-3">Last Restocked</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map(item => {
                    const isOut = item.quantity <= 0;
                    const isLow = item.quantity <= item.minStockThreshold && !isOut;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-bold text-slate-800">{item.itemName}</td>
                        <td className="py-3 px-3 text-slate-600">{item.category}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{item.minStockThreshold} {item.unit}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'Depleted' : isLow ? 'Low Stock Warning' : 'Normal'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{item.lastRestocked}</td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => updateInventoryQuantity(item.id, item.quantity + 10)}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#007FFF] font-bold rounded text-[11px] border border-blue-200 transition"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => updateInventoryQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded text-[11px] border border-slate-200 transition"
                            title="Dispense 1 unit"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Delete Medical Supply Item',
                                message: `Are you sure you want to delete "${item.itemName}" from the clinic medical inventory? This action is permanent.`,
                                itemDetails: [
                                  { label: 'Supply Item', value: item.itemName },
                                  { label: 'Category', value: item.category },
                                  { label: 'Current Quantity', value: `${item.quantity} ${item.unit}` },
                                  { label: 'Min Threshold', value: `${item.minStockThreshold} ${item.unit}` },
                                ],
                                confirmText: 'Delete Item',
                                confirmVariant: 'danger',
                                action: () => {
                                  deleteInventoryItem(item.id);
                                  triggerToast(`Medical supply "${item.itemName}" was deleted from inventory.`);
                                },
                              });
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded text-[11px] border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                            title="Delete supply item"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: EMAIL CENTER (Compose & Send Emails to Patients + View Automated Outbox) */}
      {currentTab === 'emails' && (
        <div className="space-y-6">
          {emailSentToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Clinic email message successfully dispatched!
            </div>
          )}

          {/* Email Composer */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#007FFF]" />
              Compose &amp; Send Email to Registered Patients
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Send health advisories, medical clearance reminders, or official clinic notifications to patients.
            </p>

            <form onSubmit={handleSendAdminEmail} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Recipient *
                  </label>
                  <select
                    required
                    value={emailRecipient}
                    onChange={e => setEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white text-slate-800"
                  >
                    <option value="">-- Choose recipient --</option>
                    <option value="ALL_PATIENTS">📢 All Approved Patients (Broadcast)</option>
                    {approvedPatients.map(p => (
                      <option key={p.id} value={p.email}>
                        {p.fullName} ({p.email}) - {p.idNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="e.g. Campus Health Advisory / Clearance Reminder"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Message Body *
                </label>
                <textarea
                  required
                  rows={4}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Type the clinic message to be sent to the patient's registered email address..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Email Message
                </button>
              </div>
            </form>
          </div>

          {/* Outbox Log */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Dispatched Emails &amp; Notification Outbox</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Recipient Name</th>
                    <th className="py-2.5 px-3">To Address</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sentEmails.length > 0 ? (
                    sentEmails.map(mail => (
                      <tr key={mail.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{mail.sentAt}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{mail.recipientName}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#007FFF]">{mail.to}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{mail.subject}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-[#007FFF] font-bold rounded text-[10px]">
                            {mail.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => alert(`EMAIL DISPATCH CONTENT:\n\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.body}`)}
                            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded"
                          >
                            View Email
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No emails have been dispatched yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SETTINGS & CLINIC SECURITY PASSCODE MANAGEMENT */}
      {currentTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#007FFF] text-xs font-bold uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" />
                Administrative Control Panel
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Clinic Settings &amp; Security Gate</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure authentication keys, gate access passcodes, and institutional clinic parameters for NORSU Mabinay Campus.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {clinicPasscode ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Security Gate Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Passcode Unconfigured
                </span>
              )}
            </div>
          </div>

          {/* CARD 1: CLINIC SECURITY GATE PASSCODE MANAGEMENT */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#007FFF] flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    CLINIC Security Gate Passcode
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-[#007FFF]">
                      Admin Only
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Controls access to Doctor &amp; Admin login panels when users click the blue "CLINIC" badge on the main login screen.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPasscodeConfirm}
                className="text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                title="Restore passcode to default 12344321"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default (12344321)
              </button>
            </div>

            {/* Current Passcode Display Banner */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Current Security Gate Passcode
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-black text-slate-800 tracking-wider">
                    {showCurrentPasscode ? (clinicPasscode || '12344321') : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPasscode(!showCurrentPasscode)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
                    title={showCurrentPasscode ? 'Hide passcode' : 'Reveal passcode'}
                  >
                    {showCurrentPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 max-w-xs">
                <span className="font-semibold text-slate-700 block mb-0.5">Exclusive Admin Access:</span>
                Only authenticated Administrators can change, update, or reset the "CLINIC" badge security key from inside this panel.
              </div>
            </div>

            {/* Passcode Feedback Alert */}
            {passcodeFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  passcodeFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {passcodeFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{passcodeFeedback.message}</span>
              </div>
            )}

            {/* Form to Set / Update Security Passcode */}
            <form onSubmit={handleUpdatePasscode} className="space-y-4 pt-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {clinicPasscode ? 'Update Security Passcode' : 'Configure Initial Security Passcode'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    New Security Passcode *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPasscode ? 'text' : 'password'}
                      required
                      value={newPasscode}
                      onChange={e => setNewPasscode(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800 pr-9 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPasscode(!showNewPasscode)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Confirm New Passcode *
                  </label>
                  <input
                    type={showNewPasscode ? 'text' : 'password'}
                    required
                    value={confirmPasscode}
                    onChange={e => setConfirmPasscode(e.target.value)}
                    placeholder="Re-type new passcode"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewPasscode('');
                    setConfirmPasscode('');
                    setPasscodeFeedback(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Save New Security Passcode
                </button>
              </div>
            </form>
          </div>

          {/* CARD 2: INSTITUTIONAL CLINIC PROFILE */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              Institutional Clinic Details &amp; Governance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Institution</span>
                <span className="font-semibold text-slate-800">Negros Oriental State University (NORSU)</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Mabinay Campus • Health &amp; Medical Clinic Services</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Active Administrator</span>
                <span className="font-semibold text-slate-800">{currentUser?.fullName || 'Clinic Administrator'}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{currentUser?.email || 'admin@norsu.edu.ph'} • ID: {currentUser?.idNumber || 'ADMIN-001'}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Patient Instant Registration</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                  Instant Verification Enabled (No approval delay)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Students, Staff, Faculty, and Utility members can register and immediately book consultation sessions.</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Data Administration</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisteredAccountsModal(true)}
                    className="px-3 py-1.5 bg-[#007FFF] text-white font-semibold rounded-lg hover:bg-blue-600 transition text-[11px] cursor-pointer"
                  >
                    View All Accounts ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Reset Registered Accounts',
                        message: 'Are you sure you want to purge non-personnel accounts and active appointments? This action cannot be undone.',
                        confirmText: 'Reset Data',
                        confirmVariant: 'danger',
                        action: () => {
                          resetAllRegisteredAccounts();
                          triggerToast('Patient registered accounts have been reset.');
                        },
                      });
                    }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 font-semibold rounded-lg hover:bg-rose-100 transition text-[11px] border border-rose-200 cursor-pointer"
                  >
                    Reset Accounts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Appointment (Admin assisting doctor schedule) */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Edit Appointment #{editingAppointment.appointmentNumber}
            </h3>
            <form onSubmit={handleSaveEditApt} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Consultation Reason
                </label>
                <input
                  type="text"
                  required
                  value={editAptReason}
                  onChange={e => setEditAptReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assign Session Slot &amp; Physician
                </label>
                <select
                  value={editAptSessionId}
                  onChange={e => setEditAptSessionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white"
                >
                  {sessions.filter(s => s.status === 'active').map(ses => (
                    <option key={ses.id} value={ses.id}>
                      {ses.doctorName} — {ses.title} ({ses.scheduledDate} {ses.scheduledTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-md transition shadow-2xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Doctor */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Register New Clinic Doctor</h3>
            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="e.g. Dr. Roberto Mendoza, MD"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={docEmail}
                  onChange={e => setDocEmail(e.target.value)}
                  placeholder="doctor@edoc.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Specialties</label>
                <input
                  type="text"
                  value={docSpec}
                  onChange={e => setDocSpec(e.target.value)}
                  placeholder="General Medicine / Dental"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Available Days</label>
                  <input
                    type="text"
                    value={docDays}
                    onChange={e => setDocDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={docTele}
                    onChange={e => setDocTele(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-md transition shadow-2xs"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Inventory Item */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Add Medical Supply Item</h3>
            <form onSubmit={handleCreateInventory} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={invName}
                  onChange={e => setInvName(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={invCategory}
                    onChange={e => setInvCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white"
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="PPE">PPE</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={invUnit}
                    onChange={e => setInvUnit(e.target.value)}
                    placeholder="boxes / bottles / pcs"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={invQty}
                    onChange={e => setInvQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={invThreshold}
                    onChange={e => setInvThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-md transition shadow-2xs"
                >
                  Add Supply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Book Doctor Appointment (Admin) */}
      {showAddAptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Book Doctor Consultation Appointment</h3>
                <p className="text-xs text-slate-500">
                  Schedule an appointment on behalf of a patient. An official confirmation email will automatically be dispatched to the patient.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminAppointment} className="space-y-3.5 text-xs">
              {/* Select Patient */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Select Patient (Student / Staff / Faculty / Utility) *
                </label>
                <select
                  required
                  value={addAptPatientId}
                  onChange={e => setAddAptPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white text-slate-800"
                >
                  <option value="">-- Choose Patient --</option>
                  {approvedPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.role.toUpperCase()} - {p.idNumber}) • {p.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Doctor */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assign Attending Physician *
                </label>
                <select
                  required
                  value={addAptDoctorId}
                  onChange={e => {
                    setAddAptDoctorId(e.target.value);
                    // Reset selected session if doctor changed
                    setAddAptSessionId('');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white text-slate-800"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialties}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional: Link to an active consultation session */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Linked Clinic Session Slot (Optional)
                </label>
                <select
                  value={addAptSessionId}
                  onChange={e => {
                    const sId = e.target.value;
                    setAddAptSessionId(sId);
                    const chosen = sessions.find(s => s.id === sId);
                    if (chosen) {
                      setAddAptDoctorId(chosen.doctorId);
                      setAddAptDate(chosen.scheduledDate);
                      setAddAptTime(chosen.scheduledTime);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white text-slate-800"
                >
                  <option value="">-- Custom Date &amp; Time (or select session) --</option>
                  {sessions
                    .filter(s => s.status === 'active' && (!addAptDoctorId || s.doctorId === addAptDoctorId))
                    .map(ses => (
                      <option key={ses.id} value={ses.id}>
                        {ses.doctorName} — {ses.title} ({ses.scheduledDate} {ses.scheduledTime})
                      </option>
                    ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={addAptDate}
                    onChange={e => setAddAptDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Appointment Time *</label>
                  <input
                    type="text"
                    required
                    value={addAptTime}
                    onChange={e => setAddAptTime(e.target.value)}
                    placeholder="e.g. 09:00 AM - 11:00 AM"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>

              {/* Consultation Topic */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Consultation Reason / Diagnosis Focus *
                </label>
                <input
                  type="text"
                  required
                  value={addAptReason}
                  onChange={e => setAddAptReason(e.target.value)}
                  placeholder="e.g. Routine Physical Examination / Flu Symptoms / Medical Clearance"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              {/* Admin / Patient Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Admin Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  value={addAptNotes}
                  onChange={e => setAddAptNotes(e.target.value)}
                  placeholder="Additional instructions for the patient or doctor..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAptModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-md transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Confirm &amp; Dispatch Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Consultation Schedule Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-[#007FFF] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Add New Consultation Schedule</h3>
              </div>
              <button
                onClick={() => setShowAddSessionModal(false)}
                className="text-white/80 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Schedule Title *
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  placeholder="e.g. General Health Check & Clearance"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned Physician *
                </label>
                <select
                  required
                  value={sessionDoctorId}
                  onChange={e => setSessionDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] bg-white text-slate-800"
                >
                  <option value="">-- Choose doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialties})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Consultation Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={sessionTime}
                    onChange={e => setSessionTime(e.target.value)}
                    placeholder="e.g. 09:00 AM - 12:00 PM"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Max Booking Capacity (Patients) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={sessionMax}
                  onChange={e => setSessionMax(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Safety Confirmation Modal for Destructive Actions */}
      <ConfirmationModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title || 'Confirm Action'}
        message={confirmModal?.message || 'Are you sure you want to proceed?'}
        itemDetails={confirmModal?.itemDetails}
        confirmText={confirmModal?.confirmText || 'Confirm'}
        confirmVariant={confirmModal?.confirmVariant || 'danger'}
        onConfirm={() => {
          if (confirmModal?.action) {
            confirmModal.action();
          }
          setConfirmModal(null);
        }}
        onClose={() => setConfirmModal(null)}
      />

      {/* Registered Accounts Management Modal */}
      <RegisteredAccountsModal
        isOpen={showRegisteredAccountsModal}
        onClose={() => setShowRegisteredAccountsModal(false)}
        users={users}
        onApproveUser={userId => {
          approveUser(userId);
          triggerToast('Patient account verified and approval email dispatched!');
        }}
        onRequestDeleteUser={user => {
          setConfirmModal({
            isOpen: true,
            title: 'Remove Patient Account',
            message: `Are you sure you want to permanently delete account for ${user.fullName} (${user.idNumber})?`,
            itemDetails: [
              { label: 'Patient Name', value: user.fullName },
              { label: 'School ID', value: user.idNumber },
              { label: 'Role', value: user.role },
              { label: 'Email', value: user.email },
            ],
            confirmText: 'Remove Account',
            confirmVariant: 'danger',
            action: () => {
              deleteUser(user.id);
              triggerToast(`Patient account for ${user.fullName} was permanently deleted.`);
            },
          });
        }}
      />

      {/* Floating Dynamic Feedback Toast */}
      {adminToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
              adminToast.type === 'error'
                ? 'bg-rose-50/95 border-rose-300 text-rose-900'
                : 'bg-emerald-50/95 border-emerald-300 text-emerald-900'
            }`}
          >
            {adminToast.type === 'error' ? (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {adminToast.message}
            </div>
            <button
              onClick={() => setAdminToast(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
