import React, { useState, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { TopBar } from './TopBar';
import { StatusCards } from './StatusCards';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookmarkCheck,
  Edit3,
  Trash2,
  Pill,
  Save,
  User,
  ShieldAlert,
  Info,
  Upload,
  Camera,
} from 'lucide-react';
import { Appointment, COURSES_AND_DEPARTMENTS } from '../types';

interface PatientPortalProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({ currentTab, onNavigateTab, onToggleMobileMenu }) => {
  const {
    currentUser,
    doctors,
    sessions,
    appointments,
    inventory,
    bookAppointment,
    editAppointment,
    cancelAppointment,
    updateUserProfile,
    requestAccountDeletion,
    cancelAccountDeletionRequest,
  } = useClinic();

  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [searchMedicineQuery, setSearchMedicineQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookingFeedback, setBookingFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Booking Modal State
  const [bookingModalSessionId, setBookingModalSessionId] = useState<string | null>(null);
  const [bookingReason, setBookingReason] = useState('General Health Consultation');
  const [bookingNotes, setBookingNotes] = useState('');

  // Edit Consultation Modal State
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSessionId, setEditSessionId] = useState('');

  // Settings State
  const [editName, setEditName] = useState(currentUser?.fullName || '');
  const [editIdNum, setEditIdNum] = useState(currentUser?.idNumber || '');
  const [editDept, setEditDept] = useState(currentUser?.courseOrDept || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatarUrl || '');
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

    // 3MB limit
    if (file.size > 3 * 1024 * 1024) {
      setAvatarUploadError('Selected file exceeds 3MB limit. Please choose a smaller image.');
      return;
    }

    setAvatarUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setEditAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Deletion Request Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReasonInput, setDeletionReasonInput] = useState('Graduation / Completed Studies');

  if (!currentUser) return null;

  // Filter patient's own appointments strictly
  const myAppointments = appointments.filter(a => a.patientId === currentUser.id);
  const activeBookings = myAppointments.filter(a => a.status !== 'cancelled');

  const handleOpenBookModal = (sessionId: string) => {
    setBookingModalSessionId(sessionId);
    setBookingReason('General Health Consultation');
    setBookingNotes('');
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalSessionId) return;
    const res = bookAppointment(bookingModalSessionId, bookingReason, bookingNotes);
    setBookingFeedback(res);
    setBookingModalSessionId(null);
  };

  const handleOpenEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setEditReason(apt.consultationReason || 'General Health Consultation');
    setEditNotes(apt.patientNotes || '');
    setEditSessionId(apt.sessionId);
  };

  const handleSaveEditAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    const selectedSession = sessions.find(s => s.id === editSessionId);
    const res = editAppointment(editingAppointment.id, {
      consultationReason: editReason,
      patientNotes: editNotes,
      sessionId: editSessionId,
      scheduledDate: selectedSession?.scheduledDate,
      scheduledTime: selectedSession?.scheduledTime,
    });

    setBookingFeedback(res);
    setEditingAppointment(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      fullName: editName,
      idNumber: editIdNum,
      courseOrDept: editDept,
      phone: editPhone,
      email: editEmail,
      avatarUrl: editAvatar,
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleSubmitDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    requestAccountDeletion(currentUser.id, deletionReasonInput);
    setShowDeleteModal(false);
  };

  // Common consultation reasons for NORSU students and staff
  const CONSULTATION_REASONS = [
    'General Health Consultation',
    'Fever, Cough, or Cold Symptoms',
    'Medical Clearance for OJT / Internship',
    'Annual Physical Examination',
    'Severe Headache / Migraine',
    'Stomach Pain / Acid Reflux',
    'Wound Dressing / First Aid Care',
    'Blood Pressure & Vital Signs Monitoring',
    'Prescription Refill & Clinic Medicines',
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen overflow-y-auto">
      <TopBar
        title={currentTab === 'home' ? 'Home' : currentTab.replace('-', ' ').toUpperCase()}
        onToggleMobileMenu={onToggleMobileMenu}
      />

      {bookingFeedback && (
        <div
          className={`mb-6 p-4 rounded-xl border text-xs flex items-center justify-between ${
            bookingFeedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {bookingFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{bookingFeedback.message}</span>
          </div>
          <button
            onClick={() => setBookingFeedback(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Deletion Pending Alert Banner */}
      {currentUser.status === 'deletion_requested' && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">Account Deletion Request Pending Review</h4>
              <p className="text-[11px] text-rose-700">
                You requested account deletion on {currentUser.deletionRequestedAt || 'recently'}. Reason: &quot;{currentUser.deletionReason}&quot;. Clinic Administration will review and approve.
              </p>
            </div>
          </div>
          <button
            onClick={() => cancelAccountDeletionRequest(currentUser.id)}
            className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded shadow-2xs transition"
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* VIEW: HOME (matching patients side.JPG) */}
      {currentTab === 'home' && (
        <>
          {/* Welcome Banner matching exact screenshot layout */}
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-[#BBE2DF] via-[#A8DCD8] to-[#9CD4D0] p-6 lg:p-8 mb-6 border border-[#9ACFD0]/40 shadow-2xs">
            {/* Surgical mask visual on the right */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center pointer-events-none opacity-85 hidden md:block"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80')`,
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
              }}
            />

            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-bold text-slate-700 tracking-wide block mb-1">
                Welcome!
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                {currentUser.fullName}
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed mb-6 font-medium">
                Haven&apos;t any idea about doctors? no problem let&apos;s jumping to &quot;All Doctors&quot; section or &quot;Sessions&quot; Track your past and future appointments history. Also find out the expected arrival time of your doctor or medical consultant.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Channel a Doctor Here
                </label>
                <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchDoctorQuery}
                      onChange={e => setSearchDoctorQuery(e.target.value)}
                      placeholder="Search Doctor and We will Find The Session Available"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#007FFF] text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => onNavigateTab('sessions')}
                    className="px-6 py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white text-xs font-bold rounded-md transition shadow-2xs whitespace-nowrap"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Metrics */}
          <StatusCards />

          {/* Your Upcoming Booking preview panel matching screenshot */}
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Your Upcoming Booking</h3>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="text-xs font-semibold text-[#007FFF] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#007FFF]/40 text-[11px] font-bold text-slate-700">
                    <th className="py-2.5 px-3">Appoint. Number</th>
                    <th className="py-2.5 px-3">Session Title</th>
                    <th className="py-2.5 px-3">Consultation Reason</th>
                    <th className="py-2.5 px-3">Doctor</th>
                    <th className="py-2.5 px-3">Sheduled Date &amp; Time</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeBookings.length > 0 ? (
                    activeBookings.slice(0, 3).map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {apt.appointmentNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {apt.sessionTitle}
                        </td>
                        <td className="py-3 px-3 text-[#007FFF] font-semibold">
                          {apt.consultationReason || 'General Consultation'}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {apt.doctorName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {apt.scheduledDate} {apt.scheduledTime}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditModal(apt)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#007FFF] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => cancelAppointment(apt.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <p className="text-xs">You have no upcoming appointments scheduled.</p>
                        <button
                          onClick={() => onNavigateTab('sessions')}
                          className="mt-2 text-xs font-bold text-[#007FFF] hover:underline"
                        >
                          Book a Consultation Session
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

      {/* VIEW: ALL DOCTORS */}
      {currentTab === 'doctors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-800 mb-4">NORSU Clinic Physicians &amp; Medical Staff</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#007FFF]/10 text-[#007FFF] flex items-center justify-center font-bold">
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                        <p className="text-[11px] text-[#007FFF] font-semibold">{doc.specialties}</p>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 mt-2">
                      <p><strong>Available:</strong> {doc.availableDays}</p>
                      <p><strong>Contact:</strong> {doc.tele} • {doc.email}</p>
                      {doc.bio && <p className="text-slate-500 italic mt-1">{doc.bio}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('sessions')}
                    className="mt-4 w-full py-1.5 text-xs font-bold bg-[#007FFF] hover:bg-[#006bd6] text-white rounded transition shadow-2xs"
                  >
                    Book with {doc.name.split(',')[0]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SCHEDULED SESSIONS */}
      {currentTab === 'sessions' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Available Clinic Consultation Sessions</h2>
            <span className="text-xs text-slate-500 font-medium">Select a slot to schedule with campus physicians</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.filter(s => s.status === 'active').map(session => {
              const remaining = session.maxPatients - session.bookedCount;
              const isFull = remaining <= 0;
              const alreadyBooked = myAppointments.some(
                a => a.sessionId === session.id && a.status !== 'cancelled'
              );

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs flex flex-col justify-between hover:border-[#007FFF] transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-bold text-slate-800">{session.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isFull ? 'Full' : `${remaining} slots left`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium mb-3">
                      Doctor: <span className="font-semibold text-slate-800">{session.doctorName}</span>
                    </p>

                    <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#007FFF]" />
                        <span>Date: <strong>{session.scheduledDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#007FFF]" />
                        <span>Time: <strong>{session.scheduledTime}</strong></span>
                      </div>
                    </div>
                  </div>

                  {alreadyBooked ? (
                    <div className="py-2 px-3 bg-blue-50 text-[#007FFF] text-xs font-bold rounded flex items-center justify-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4" />
                      Already Booked
                    </div>
                  ) : (
                    <button
                      disabled={isFull}
                      onClick={() => handleOpenBookModal(session.id)}
                      className={`w-full py-2 text-xs font-bold rounded transition shadow-2xs ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-[#007FFF] hover:bg-[#006bd6] text-white'
                      }`}
                    >
                      {isFull ? 'Session Fully Booked' : 'Schedule Consultation'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: MY BOOKINGS */}
      {currentTab === 'bookings' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">My Consultation History &amp; Bookings</h2>
            <button
              onClick={() => onNavigateTab('sessions')}
              className="text-xs font-bold text-[#007FFF] hover:underline"
            >
              + Book New Consultation
            </button>
          </div>

          {myAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Consultation Topic</th>
                    <th className="py-2.5 px-3">Doctor</th>
                    <th className="py-2.5 px-3">Scheduled Date &amp; Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {myAppointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">{apt.appointmentNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{apt.consultationReason || apt.sessionTitle}</div>
                        {apt.patientNotes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                            Note: {apt.patientNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{apt.doctorName}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {apt.scheduledDate} {apt.scheduledTime}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : apt.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {apt.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(apt)}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#007FFF] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => cancelAppointment(apt.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs">You have no booked appointments yet.</p>
              <button
                onClick={() => onNavigateTab('sessions')}
                className="mt-2 text-xs font-bold text-[#007FFF] hover:underline"
              >
                Browse Available Sessions
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: CLINIC MEDICINES (Patients can view available clinic medicine supply) */}
      {currentTab === 'medicines' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-[#007FFF]" />
                  NORSU Campus Clinic Medicine &amp; Supplies Supply
                </h2>
                <p className="text-xs text-slate-500">
                  Medicines and first-aid supplies available for free to enrolled students and staff upon consultation.
                </p>
              </div>

              {/* Search and Category Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchMedicineQuery}
                    onChange={e => setSearchMedicineQuery(e.target.value)}
                    placeholder="Search medicine / item"
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] w-44 sm:w-56"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white text-slate-700"
                >
                  <option value="all">All Categories</option>
                  <option value="Medicine">Medicines</option>
                  <option value="First Aid">First Aid</option>
                  <option value="PPE">PPE</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Medicine / Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Unit Form</th>
                    <th className="py-2.5 px-3">Availability Status</th>
                    <th className="py-2.5 px-3">Clinic Stock Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory
                    .filter(item => {
                      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
                      const matchesSearch =
                        !searchMedicineQuery ||
                        item.itemName.toLowerCase().includes(searchMedicineQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    })
                    .map(item => {
                      const isAvailable = item.quantity > 0;
                      const isLow = item.quantity <= item.minStockThreshold && isAvailable;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-bold text-slate-800">{item.itemName}</td>
                          <td className="py-3 px-3 text-slate-600">{item.category}</td>
                          <td className="py-3 px-3 text-slate-600">{item.unit}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                !isAvailable
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {!isAvailable ? 'Temporarily Depleted' : isLow ? 'Limited Stock' : 'In Stock & Available'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-700">
                            {item.quantity} {item.unit} in dispensary
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-[#007FFF] shrink-0 mt-0.5" />
              <span>
                To request prescribed clinic medicines or first aid supplies, book an appointment or visit the campus clinic during working hours with your registered NORSU Student/Staff ID.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SETTINGS (Interactive with Account Deletion Option) */}
      {currentTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          {settingsSavedToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Personal profile updated successfully!
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Patient Profile &amp; Personal Information</h2>
            <p className="text-xs text-slate-500 mb-5">Edit your registered details and avatar for clinic consultations.</p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Profile Avatar Editor with Direct Device File Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="relative group w-20 h-20 rounded-full bg-slate-100 border-2 border-[#007FFF] overflow-hidden flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  {editAvatar ? (
                    <img src={editAvatar} alt={editName} className="w-full h-full object-cover" />
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
                      Upload Profile Picture Directly from Your Device Files
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose an image file directly from your mobile gallery or computer files (PNG, JPG, or WEBP, max 3MB).
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

                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditAvatar('');
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
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">School ID Number *</label>
                  <input
                    type="text"
                    required
                    value={editIdNum}
                    onChange={e => setEditIdNum(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Course / Department</label>
                  <input
                    type="text"
                    list="cura-courses-list"
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                    placeholder="Select or enter Course / Department"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                  <datalist id="cura-courses-list">
                    {COURSES_AND_DEPARTMENTS.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007FFF] hover:bg-[#006bd6] text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="bg-white rounded-lg border border-rose-200 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-rose-800 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Account Management &amp; Deletion
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              In accordance with university clinic records retention policy, requests to delete student or staff medical accounts must be submitted to the Clinic Administrator for approval to clear medical files and clearances.
            </p>

            {currentUser.status === 'deletion_requested' ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                <span>Deletion request currently under administrator review.</span>
                <button
                  type="button"
                  onClick={() => cancelAccountDeletionRequest(currentUser.id)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-amber-300 font-bold rounded text-amber-800 transition"
                >
                  Cancel Request
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg transition flex items-center gap-1.5 text-xs shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Request Account Deletion
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Book Appointment with Consultation Reason */}
      {bookingModalSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Schedule Consultation Session</h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify what you want the physician to consult you about and any symptoms.
            </p>

            <form onSubmit={handleConfirmBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  What do you want the doctor to consult you about? *
                </label>
                <select
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white text-slate-800 mb-2"
                >
                  {CONSULTATION_REASONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="Other / Specific Symptoms">Other (specify below)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Symptoms &amp; Specific Concerns (Notes for the Doctor)
                </label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={e => setBookingNotes(e.target.value)}
                  placeholder="e.g. Mild fever since yesterday, sore throat, needing medical clearance for school PE..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setBookingModalSessionId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#007FFF] hover:bg-[#006bd6] rounded-md transition shadow-2xs"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Scheduled Consultation Session */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Edit Consultation Session #{editingAppointment.appointmentNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Change what you want to consult about and select a new time slot based on doctor schedules.
            </p>

            <form onSubmit={handleSaveEditAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Consultation Subject / Reason *
                </label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  placeholder="e.g. Fever &amp; Flu, Medical Clearance"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Choose Doctor &amp; Scheduled Session Time Slot *
                </label>
                <select
                  value={editSessionId}
                  onChange={e => setEditSessionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white"
                >
                  {sessions.filter(s => s.status === 'active').map(ses => (
                    <option key={ses.id} value={ses.id}>
                      {ses.doctorName} — {ses.title} ({ses.scheduledDate} at {ses.scheduledTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Symptoms &amp; Additional Information
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
                />
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-rose-800 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Request Account Deletion
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to request deletion of your account (<strong>{currentUser.email}</strong>)? This request will be submitted to the NORSU Clinic Administration for review.
            </p>

            <form onSubmit={handleSubmitDeletion} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reason for Deletion
                </label>
                <select
                  value={deletionReasonInput}
                  onChange={e => setDeletionReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF] bg-white"
                >
                  <option value="Graduation / Completed Studies">Graduation / Completed Studies</option>
                  <option value="Transferred to another school / campus">Transferred to another school / campus</option>
                  <option value="Duplicate or test account">Duplicate or test account</option>
                  <option value="Personal data privacy request">Personal data privacy request</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition shadow-2xs"
                >
                  Submit Deletion Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
