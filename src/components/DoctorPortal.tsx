import React, { useState, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { TopBar } from './TopBar';
import { StatusCards } from './StatusCards';
import { isDateUntilNextFriday } from '../lib/clinicLogic';
import {
  Plus,
  Check,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Save,
  User,
  Mail,
  CheckCircle2,
  FileText,
  Upload,
  Camera,
} from 'lucide-react';
import { Appointment } from '../types';

interface DoctorPortalProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ currentTab, onNavigateTab, onToggleMobileMenu }) => {
  const {
    currentUser,
    appointments,
    sessions,
    users,
    sentEmails,
    updateAppointmentStatus,
    approveAppointment,
    declineAppointment,
    addSession,
    cancelSession,
    updateDoctorProfile,
  } = useClinic();

  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newMax, setNewMax] = useState(15);

  // Settings State for Doctor
  const [docName, setDocName] = useState(currentUser?.fullName || '');
  const [docIdNum, setDocIdNum] = useState(currentUser?.idNumber || '');
  const [docSpec, setDocSpec] = useState(currentUser?.courseOrDept || 'General Medicine & Campus Health');
  const [docPhone, setDocPhone] = useState(currentUser?.phone || '09123456789');
  const [docEmail, setDocEmail] = useState(currentUser?.email || '');
  const [docDays, setDocDays] = useState('Monday - Friday (8:00 AM - 5:00 PM)');
  const [docBio, setDocBio] = useState('Campus physician providing medical clearance and healthcare consultations.');
  const [docAvatar, setDocAvatar] = useState(currentUser?.avatarUrl || '');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAvatarUploadError('Selected file exceeds 3MB limit.');
      return;
    }

    setAvatarUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setDocAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Appointment Email Preview modal
  const [previewAppointmentEmail, setPreviewAppointmentEmail] = useState<Appointment | null>(null);

  if (!currentUser) return null;

  // Filter sessions and appointments for this specific doctor
  const mySessions = sessions.filter(
    s => s.doctorId === currentUser.id || s.doctorName.toLowerCase().includes(currentUser.fullName.toLowerCase())
  );

  const myAppointments = appointments.filter(
    a => a.doctorId === currentUser.id || a.doctorName.toLowerCase().includes(currentUser.fullName.toLowerCase())
  );

  // Upcoming sessions until next week/Friday
  const upcomingWeekSessions = mySessions.filter(
    s => s.status === 'active' && isDateUntilNextFriday(s.scheduledDate)
  );

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newTime) return;
    addSession({
      title: newTitle,
      doctorId: currentUser.id,
      doctorName: currentUser.fullName,
      scheduledDate: newDate,
      scheduledTime: newTime,
      maxPatients: Number(newMax),
      status: 'active',
    });
    setNewTitle('');
    setNewDate('');
    setNewTime('');
    setShowAddSessionModal(false);
  };

  const handleSaveDoctorProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateDoctorProfile(currentUser.id, {
      name: docName,
      tele: docPhone,
      email: docEmail,
      specialties: docSpec,
      availableDays: docDays,
      bio: docBio,
      avatarUrl: docAvatar,
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleApprove = (apt: Appointment) => {
    // Automatically approves and sends email notification to patient's registered email
    approveAppointment(apt.id, currentUser.fullName);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen overflow-y-auto">
      <TopBar
        title={currentTab === 'dashboard' ? 'Dashboard' : currentTab.replace('-', ' ').toUpperCase()}
        onToggleMobileMenu={onToggleMobileMenu}
      />

      {/* VIEW: DASHBOARD (matching doctor side.JPG) */}
      {currentTab === 'dashboard' && (
        <>
          {/* Welcome Banner matching exact doctor side screenshot */}
          <div className="relative rounded-xl overflow-hidden bg-[#F6F7F9] p-6 lg:p-8 mb-6 border border-slate-200/80 shadow-2xs">
            {/* Medical roll tape and gauze photo on right */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center pointer-events-none opacity-90 hidden md:block"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80')`,
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
              }}
            />

            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-bold text-slate-700 tracking-wide block mb-1">
                Welcome!
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                {currentUser.fullName}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium max-w-lg">
                Thanks for joining us. We are always trying to get you a complete service. You can view your daily schedule, review patient consultation requests, and dispatch automated confirmation emails!
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateTab('appointments')}
                  className="px-6 py-2.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-md transition shadow-2xs"
                >
                  View My Appointments
                </button>
                <button
                  onClick={() => setShowAddSessionModal(true)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-md transition shadow-2xs"
                >
                  + Add Consultation Slot
                </button>
              </div>
            </div>
          </div>

          {/* Status Metrics */}
          <StatusCards />

          {/* Your Up Coming Sessions until Next week preview section matching picture */}
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Your Up Coming Sessions until Next week</h3>
              <button
                onClick={() => onNavigateTab('sessions')}
                className="text-xs font-semibold text-[#007FFF] hover:underline"
              >
                Manage Sessions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#007FFF]/40 text-[11px] font-bold text-slate-700">
                    <th className="py-2 px-3">Session Title</th>
                    <th className="py-2 px-3">Sheduled Date</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3 text-right">Patients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {upcomingWeekSessions.length > 0 ? (
                    upcomingWeekSessions.map(ses => (
                      <tr key={ses.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-800">{ses.title}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{ses.scheduledDate}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{ses.scheduledTime}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 bg-blue-50 text-[#007FFF] font-bold rounded text-[11px]">
                            {ses.bookedCount} / {ses.maxPatients}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        <div className="w-24 h-16 mx-auto mb-2 opacity-60 flex items-center justify-center">
                          <span className="text-3xl">🩺</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          We couldn&apos;t find anything related to your upcoming sessions for this week.
                        </p>
                        <button
                          onClick={() => setShowAddSessionModal(true)}
                          className="mt-3 px-4 py-1.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded shadow-2xs"
                        >
                          Add New Consultation Session
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW: MY APPOINTMENTS */}
      {currentTab === 'appointments' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">My Assigned Patient Appointments</h2>
              <p className="text-xs text-slate-500">
                Approving an appointment automatically dispatches a confirmation email to the patient&apos;s registered email.
              </p>
            </div>
            <span className="text-xs font-bold text-[#007FFF] px-2.5 py-1 bg-blue-50 rounded-full">
              {myAppointments.length} Total Appointments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">ID Number</th>
                  <th className="py-2.5 px-3">Consultation Reason &amp; Notes</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAppointments.length > 0 ? (
                  myAppointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">{apt.appointmentNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-500">{apt.patientEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{apt.idNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#007FFF]">
                          {apt.consultationReason || apt.sessionTitle}
                        </div>
                        {apt.patientNotes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            &quot;{apt.patientNotes}&quot;
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {apt.scheduledDate} {apt.scheduledTime}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : apt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {apt.status === 'confirmed' ? 'Approved & Confirmed' : apt.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {apt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(apt)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs transition inline-flex items-center gap-1"
                              title="Approve & automatically email patient"
                            >
                              <Check className="w-3 h-3" />
                              Approve &amp; Email
                            </button>
                            <button
                              onClick={() => declineAppointment(apt.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <p className="text-xs">No patient appointments have been booked with you yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: MY SESSIONS */}
      {currentTab === 'sessions' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">My Consultation Sessions</h2>
              <p className="text-xs text-slate-500">Configure appointment time slots available for NORSU students and staff.</p>
            </div>
            <button
              onClick={() => setShowAddSessionModal(true)}
              className="px-4 py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySessions.length > 0 ? (
              mySessions.map(ses => (
                <div key={ses.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-bold text-slate-800">{ses.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        ses.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {ses.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 mb-3">
                      <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-[#007FFF]" /> Date: {ses.scheduledDate}</p>
                      <p className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#007FFF]" /> Time: {ses.scheduledTime}</p>
                      <p>Capacity: <strong>{ses.bookedCount} / {ses.maxPatients} booked</strong></p>
                    </div>
                  </div>

                  {ses.status === 'active' && (
                    <button
                      onClick={() => cancelSession(ses.id)}
                      className="w-full py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition"
                    >
                      Cancel Session
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-slate-400">
                <p className="text-xs">You have no scheduled sessions.</p>
                <button
                  onClick={() => setShowAddSessionModal(true)}
                  className="mt-2 text-xs font-bold text-[#007FFF] hover:underline"
                >
                  Create your first consultation session
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: MY PATIENTS */}
      {currentTab === 'patients' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Campus Patient Directory</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">ID Number</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Course / Department</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.filter(u => u.role === 'student' || u.role === 'staff').length > 0 ? (
                  users.filter(u => u.role === 'student' || u.role === 'staff').map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">{p.fullName}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{p.idNumber}</td>
                      <td className="py-3 px-3 capitalize">{p.role}</td>
                      <td className="py-3 px-3 text-slate-600">{p.courseOrDept}</td>
                      <td className="py-3 px-3 text-slate-600">{p.email}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No registered patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: EMAIL NOTIFICATIONS (Outbox log) */}
      {currentTab === 'emails' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#007FFF]" />
                Automated Clinic Email Notifications Outbox
              </h2>
              <p className="text-xs text-slate-500">
                Log of automated email confirmations dispatched to patients upon appointment approval.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Time Dispatched</th>
                  <th className="py-2.5 px-3">Recipient Patient</th>
                  <th className="py-2.5 px-3">To Email Address</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Sent By</th>
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
                      <td className="py-3 px-3 text-slate-500">{mail.sentBy}</td>
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
                      No automated emails have been dispatched yet. Approving an appointment will automatically send a notification email.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SETTINGS (Interactive Doctor Profile Editor) */}
      {currentTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          {settingsSavedToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Doctor profile updated successfully!
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Doctor Profile &amp; Practice Information</h2>
            <p className="text-xs text-slate-500 mb-5">
              Update your medical specialties, consultation office hours, contact number, and avatar photo.
            </p>

            <form onSubmit={handleSaveDoctorProfile} className="space-y-4 text-xs">
              {/* Profile Avatar Editor with Direct Device File Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="relative group w-20 h-20 rounded-full bg-slate-100 border-2 border-[#007FFF] overflow-hidden flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  {docAvatar ? (
                    <img src={docAvatar} alt={docName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full cursor-pointer"
                    title="Upload picture from device"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Upload Physician Profile Picture from Device
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose a medical portrait photo directly from your device files (PNG, JPG, or WEBP, max 3MB).
                    </p>
                  </div>

                  {/* Hidden Device File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose Photo from Device
                    </button>

                    {docAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setDocAvatar('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {avatarUploadError && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {avatarUploadError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Medical License / ID *</label>
                  <input
                    type="text"
                    required
                    value={docIdNum}
                    onChange={e => setDocIdNum(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Specialties / Department</label>
                  <input
                    type="text"
                    value={docSpec}
                    onChange={e => setDocSpec(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Clinic Email Address *</label>
                  <input
                    type="email"
                    required
                    value={docEmail}
                    onChange={e => setDocEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Direct Contact Phone</label>
                  <input
                    type="text"
                    value={docPhone}
                    onChange={e => setDocPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Consultation Available Days &amp; Hours</label>
                <input
                  type="text"
                  value={docDays}
                  onChange={e => setDocDays(e.target.value)}
                  placeholder="e.g. Monday - Friday (8:00 AM - 5:00 PM)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Physician Bio / Notes</label>
                <textarea
                  rows={2}
                  value={docBio}
                  onChange={e => setDocBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Session */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Create Consultation Session</h3>
            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Morning Walk-in &amp; Consultation"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Max Patients Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newMax}
                  onChange={e => setNewMax(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-md transition shadow-2xs"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
