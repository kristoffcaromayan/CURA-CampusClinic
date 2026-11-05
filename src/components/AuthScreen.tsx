import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { COURSES_AND_DEPARTMENTS, USER_CLIENT_ROLES } from '../types';
import {
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Lock,
  Shield,
  BriefcaseMedical,
  KeyRound,
  X,
  ChevronRight,
  ArrowLeft,
  Building2,
  Stethoscope,
} from 'lucide-react';

interface AuthScreenProps {
  onOpenPhpModal?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onOpenPhpModal,
}) => {
  const {
    login,
    signUp,
    loginWithGoogle,
    verifyClinicPasscode,
    clinicPasscode,
    registerDoctorAccount,
    registerAdminAccount,
    users,
    logout,
  } = useClinic();
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Security Gate & Authorized Role Switcher State
  const [authorizedModalStep, setAuthorizedModalStep] = useState<
    'passcode' | 'panel_select' | 'doctor_auth' | 'admin_auth' | null
  >(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');


  // Doctor Auth Modal States
  const [doctorAuthTab, setDoctorAuthTab] = useState<'login' | 'register'>('login');
  const [docLoginEmail, setDocLoginEmail] = useState('');
  const [docLoginPassword, setDocLoginPassword] = useState('');
  const [docShowPassword, setDocShowPassword] = useState(false);
  const [docRegName, setDocRegName] = useState('');
  const [docRegEmail, setDocRegEmail] = useState('');
  const [docRegPassword, setDocRegPassword] = useState('');
  const [docRegSpec, setDocRegSpec] = useState('General Medicine & Campus Health');
  const [docRegDays, setDocRegDays] = useState('Monday - Friday (8:00 AM - 5:00 PM)');
  const [docRegPhone, setDocRegPhone] = useState('09123456789');
  const [docAuthAlert, setDocAuthAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Admin Auth Modal States
  const [adminAuthTab, setAdminAuthTab] = useState<'login' | 'register'>('login');
  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [adminRegName, setAdminRegName] = useState('');
  const [adminRegEmail, setAdminRegEmail] = useState('');
  const [adminRegIdNumber, setAdminRegIdNumber] = useState('');
  const [adminRegPassword, setAdminRegPassword] = useState('');
  const [adminRegDept, setAdminRegDept] = useState('NORSU Clinic Administration');
  const [adminAuthAlert, setAdminAuthAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Sign Up form states
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [role, setRole] = useState<'student' | 'staff' | 'faculty' | 'utility'>('student');
  const [courseOrDept, setCourseOrDept] = useState<string>(COURSES_AND_DEPARTMENTS[0]);
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptText, setCustomDeptText] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!fullName || !idNumber || !email || !password) {
      setAlert({ type: 'error', message: 'Please complete all required fields (*).' });
      return;
    }
    if (password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const finalDept = isCustomDept && customDeptText.trim() ? customDeptText.trim() : courseOrDept;

    const res = signUp({
      fullName,
      idNumber,
      role,
      courseOrDept: finalDept,
      email,
      password,
    });

    if (res.success) {
      setAlert({ type: 'success', message: res.message });
      // User is logged in automatically by signUp
    } else {
      setAlert({ type: 'error', message: res.message });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!loginIdentifier || !loginPassword) {
      setAlert({ type: 'error', message: 'Please enter both your Email / School ID and Password.' });
      return;
    }

    const res = login(loginIdentifier, loginPassword);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message || 'Login failed.' });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAlert(null);
    const res = await loginWithGoogle();
    setLoading(false);
    if (!res.success) {
      setAlert({ type: 'error', message: res.message || 'Failed to authenticate with Google.' });
    }
  };

  // Security Gate Passcode verification
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    if (!enteredPasscode.trim()) {
      setPasscodeError('Please enter the security passcode to continue.');
      return;
    }
    if (verifyClinicPasscode(enteredPasscode.trim())) {
      setAuthorizedModalStep('panel_select');
      setEnteredPasscode('');
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid security passcode. Access restricted to authorized Doctors & Admins.');
    }
  };


  // Doctor Login & Registration Handlers
  const handleDoctorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setDocAuthAlert(null);
    if (!docLoginEmail || !docLoginPassword) {
      setDocAuthAlert({ type: 'error', message: 'Please provide both your Doctor Email/ID and Password.' });
      return;
    }

    const cleanEmail = docLoginEmail.trim().toLowerCase();
    const existing = users.find(
      u => u.email.toLowerCase() === cleanEmail || u.idNumber.toLowerCase() === cleanEmail
    );

    if (existing && existing.role !== 'doctor') {
      setDocAuthAlert({
        type: 'error',
        message: `Account found, but role is "${existing.role}". Access to Doctor Panel requires Doctor credentials.`,
      });
      return;
    }

    const res = login(docLoginEmail, docLoginPassword);
    if (res.success) {
      setAuthorizedModalStep(null);
    } else {
      setDocAuthAlert({ type: 'error', message: res.message || 'Doctor login failed.' });
    }
  };

  const handleDoctorRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setDocAuthAlert(null);
    if (!docRegName || !docRegEmail || !docRegPassword) {
      setDocAuthAlert({ type: 'error', message: 'Please complete all required fields (*).' });
      return;
    }
    if (docRegPassword.length < 6) {
      setDocAuthAlert({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const res = registerDoctorAccount({
      name: docRegName,
      email: docRegEmail,
      password: docRegPassword,
      specialties: docRegSpec,
      availableDays: docRegDays,
      tele: docRegPhone,
    });

    if (res.success) {
      setAuthorizedModalStep(null);
    } else {
      setDocAuthAlert({ type: 'error', message: res.message });
    }
  };

  // Admin Login & Registration Handlers
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthAlert(null);
    if (!adminLoginEmail || !adminLoginPassword) {
      setAdminAuthAlert({ type: 'error', message: 'Please enter both your Admin Email/ID and Password.' });
      return;
    }

    const cleanEmail = adminLoginEmail.trim().toLowerCase();
    const existing = users.find(
      u => u.email.toLowerCase() === cleanEmail || u.idNumber.toLowerCase() === cleanEmail
    );

    if (existing && existing.role !== 'admin') {
      setAdminAuthAlert({
        type: 'error',
        message: `Account found, but role is "${existing.role}". Access to Admin Panel requires Administrator clearance.`,
      });
      return;
    }

    const res = login(adminLoginEmail, adminLoginPassword);
    if (res.success) {
      setAuthorizedModalStep(null);
    } else {
      setAdminAuthAlert({ type: 'error', message: res.message || 'Admin login failed.' });
    }
  };

  const handleAdminRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthAlert(null);
    if (!adminRegName || !adminRegEmail || !adminRegPassword) {
      setAdminAuthAlert({ type: 'error', message: 'Please complete all required fields (*).' });
      return;
    }
    if (adminRegPassword.length < 6) {
      setAdminAuthAlert({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const res = registerAdminAccount({
      fullName: adminRegName,
      email: adminRegEmail,
      idNumber: adminRegIdNumber,
      courseOrDept: adminRegDept,
      password: adminRegPassword,
    });

    if (res.success) {
      setAuthorizedModalStep(null);
    } else {
      setAdminAuthAlert({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8">
      {/* Top Header with Uploaded CURA Logo */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/image_fe80019-removebg-preview_33e9f56f.png"
            alt="CURA Clinic Logo"
            className="h-11 sm:h-12 w-auto object-contain select-none"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 tracking-tight">NORSU Mabinay Campus</span>
              {/* CLINIC badge: Click opens security passcode modal */}
              <button
                type="button"
                onClick={() => {
                  setAuthorizedModalStep('passcode');
                  setEnteredPasscode('');
                  setPasscodeError('');
                }}
                className="group inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 hover:bg-[#007FFF] text-[#007FFF] hover:text-white transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-95"
                title="Authorized Personnel: Click to unlock Doctor or Admin Portal"
                aria-label="Doctor and Admin Security Passcode Gate"
              >
                <Lock className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span>Clinic</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Health &amp; Medical Services Unit</p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs font-semibold text-slate-700 block">Negros Oriental State University</span>
          <span className="text-[11px] text-slate-400">Mabinay Campus • Official Portal</span>
        </div>
      </header>

      {/* Main Container: Split-screen on desktop with uploaded NORSU background */}
      <main className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Side: Campus Aerial Visual Hero featuring uploaded user photo */}
        <div
          className="hidden lg:flex lg:col-span-6 p-8 text-white flex-col justify-between relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: `url('/assets/aistudio/bg_norsu_86b57f22.jpg')`,
          }}
        >
          {/* Subtle gradient overlay to make text crisp and preserve aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-900/60 to-slate-900/40" />

          {/* Top Brand */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/25 mb-5 shadow-xs">
              <GraduationCap className="w-3.5 h-3.5 text-sky-200" />
              Negros Oriental State University • Mabinay Campus
            </div>

            {/* Direct Logo with NO white background box or placeholder */}
            <div className="mb-4">
              <img
                src="/assets/aistudio/f3b4c440-4209-4f52-9a36-16db061327f9-removebg-preview_dc9e948a.png"
                alt="CURA Official Logo"
                className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-lg select-none"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
              Campus Clinic Portal
            </h2>
            <p className="mt-2 text-xs text-slate-100/90 leading-relaxed max-w-md drop-shadow-sm font-medium">
              Official university health management system for Student, Staff, Faculty, and Utility members. Log in securely with your institutional credentials.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-xl text-xs text-blue-100">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Instant Activation: Register &amp; book sessions immediately</span>
            </div>
          </div>

          {/* Bottom Accreditation */}
          <div className="relative z-10 pt-4 border-t border-white/20 text-[11px] text-sky-200 flex justify-between items-center backdrop-blur-2xs">
            <span>NORSU Health &amp; Medical Clinic Services</span>
            <span className="font-semibold text-white">Mabinay Campus</span>
          </div>
        </div>

        {/* Right Side: Form matching log on.JPG and log in 2.JPG */}
        <div className="lg:col-span-6 flex flex-col justify-center bg-white px-5 py-6 sm:px-8 sm:py-8">
          <div className="w-full max-w-md mx-auto">
            {/* Header banner using uploaded NORSU background with logo prominently placed in upper-left corner */}
            <div className="rounded-xl overflow-hidden shadow-sm mb-5 border border-slate-100">
              <div
                className="relative bg-cover bg-center px-5 py-4 text-white"
                style={{
                  backgroundImage: `url('/assets/aistudio/bg_norsu_86b57f22.jpg')`,
                }}
              >
                <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-3xs" />
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-2">
                  {/* White monochrome logo centered on top */}
                  <img
                    src="/assets/aistudio/image_fe80019-removebg-preview_33e9f56f.png"
                    alt="CURA Clinic Logo"
                    className="h-20 sm:h-24 w-auto object-contain mb-3 filter brightness-0 invert drop-shadow-md select-none"
                  />
                  {/* Clinic text centered below logo */}
                  <p className="text-xs font-bold uppercase tracking-widest text-white drop-shadow-sm leading-tight">
                    NORSU MABINAY CAMPUS CLINIC
                  </p>
                </div>
              </div>
            </div>

            {/* Segmented Tab Controls: Log In on the Left, Sign Up on the Right */}
            <div className="flex bg-[#EEF2F6] p-1 rounded-full mb-5">
              {/* Log In Button - Left Side */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setAlert(null);
                }}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-[#007FFF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Log In
              </button>

              {/* Sign Up Button - Right Side */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setAlert(null);
                }}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-[#007FFF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </div>

            {/* Alert Message Box */}
            {alert && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  alert.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {alert.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>{alert.message}</div>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {activeTab === 'signup' ? 'Sign Up with Google' : 'Log In with Google'}
            </button>

            {/* Divider */}
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                or use school id / email
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* TAB 1: SIGN UP FORM */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ID Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      placeholder="202300220"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as 'student' | 'staff' | 'faculty' | 'utility')}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] bg-white text-slate-800 font-medium"
                    >
                      {USER_CLIENT_ROLES.map(r => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Course or Department *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomDept(!isCustomDept)}
                      className="text-[10px] text-[#007FFF] hover:underline font-semibold"
                    >
                      {isCustomDept ? 'Choose from official courses' : 'Custom office/unit'}
                    </button>
                  </div>

                  {!isCustomDept ? (
                    <select
                      value={courseOrDept}
                      onChange={e => setCourseOrDept(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] bg-white text-slate-800"
                    >
                      {COURSES_AND_DEPARTMENTS.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customDeptText}
                      onChange={e => setCustomDeptText(e.target.value)}
                      placeholder="e.g. Administrative Office, Facilities Unit, Library"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] text-slate-800"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] text-slate-800 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Instant registration: Your account is verified immediately upon creation.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#007FFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account &amp; Sign In
                </button>
              </form>
            )}

            {/* TAB 2: LOG IN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email or Student/Staff ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] text-slate-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAlert({
                          type: 'info',
                          message:
                            'For password reset assistance, visit the NORSU Mabinay Campus Clinic IT/Admin office with your school ID.',
                        })
                      }
                      className="text-[10px] text-[#007FFF] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] text-slate-800 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#007FFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  Log In
                </button>
              </form>
            )}

            {/* Footer Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Official Clinical System of Negros Oriental State University • Mabinay Campus
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* AUTHORIZED PERSONNEL SECURITY MODAL SYSTEM               */}
      {/* 1. Security Gate (Passcode verification)                 */}
      {/* 2. Panel Switcher (Doctor vs Admin)                      */}
      {/* 3. Doctor Authentication (Login / First-time Signup)     */}
      {/* 4. Admin Authentication (Login / First-time Signup)      */}
      {/* ======================================================== */}
      {authorizedModalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* STEP 1: SECURITY GATE PASSCODE ENTRY */}
            {authorizedModalStep === 'passcode' && (
              <>
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-blue-800 to-[#007FFF] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-blue-100">
                          Restricted Clearance
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base leading-tight mt-0.5">
                        CLINIC Security Gate
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorizedModalStep(null);
                      setEnteredPasscode('');
                      setPasscodeError('');
                    }}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* PASSCODE VERIFICATION FORM */}
                <form onSubmit={handleVerifyPasscode} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      Doctor &amp; Administrator Portal Security Passcode
                    </p>
                    <p className="leading-relaxed">
                      This gate restricts portal access to authorized NORSU campus medical officers and administrators. Please enter the clinic security key.
                    </p>
                  </div>

                  {passcodeError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>{passcodeError}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Security Passcode / PIN *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        autoFocus
                        required
                        autoComplete="off"
                        value={enteredPasscode}
                        onChange={e => {
                          setEnteredPasscode(e.target.value);
                          if (passcodeError) setPasscodeError('');
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleVerifyPasscode(e);
                          }
                        }}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-base font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-[#007FFF] focus:ring-2 focus:ring-blue-100 text-slate-800 tracking-widest placeholder:tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-[#007FFF] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Exclusive Admin Control:</span> Only an authenticated Administrator can change, update, or reset this security key from inside the Admin Settings panel.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorizedModalStep(null);
                        setEnteredPasscode('');
                        setPasscodeError('');
                      }}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#007FFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Verify &amp; Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 2: PANEL SELECTION MODAL */}
            {authorizedModalStep === 'panel_select' && (
              <>
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-blue-800 to-[#007FFF] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-xs flex items-center justify-center border border-emerald-400/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                          Passcode Verified
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base leading-tight mt-0.5">
                        Select Authorized Panel
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthorizedModalStep(null)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Security credentials accepted. Choose the clinical department you wish to authenticate into:
                  </p>

                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Doctor Panel Option */}
                    <button
                      type="button"
                      onClick={() => {
                        const doctorAccounts = users.filter(u => u.role === 'doctor');
                        setDoctorAuthTab(doctorAccounts.length > 0 ? 'login' : 'register');
                        setDocAuthAlert(null);
                        setAuthorizedModalStep('doctor_auth');
                      }}
                      className="group p-4 rounded-xl border-2 border-slate-200 hover:border-[#007FFF] hover:bg-blue-50/40 transition-all text-left flex items-start gap-3.5 cursor-pointer shadow-2xs hover:shadow-md"
                    >
                      <div className="w-11 h-11 rounded-xl bg-sky-100 text-[#007FFF] group-hover:bg-[#007FFF] group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#007FFF] transition-colors">
                            Doctor / Physician Panel
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-[#007FFF]">
                            Medical
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Consultation schedules, patient diagnostic appointments, student clearances, and active clinic sessions.
                        </p>
                      </div>
                    </button>

                    {/* Admin Panel Option */}
                    <button
                      type="button"
                      onClick={() => {
                        const adminAccounts = users.filter(u => u.role === 'admin');
                        setAdminAuthTab(adminAccounts.length > 0 ? 'login' : 'register');
                        setAdminAuthAlert(null);
                        setAuthorizedModalStep('admin_auth');
                      }}
                      className="group p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all text-left flex items-start gap-3.5 cursor-pointer shadow-2xs hover:shadow-md"
                    >
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                            Administrator Panel
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                            Management
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Campus clinic oversight, medical supplies inventory, account approvals, and security passcode management.
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorizedModalStep('passcode');
                        setEnteredPasscode('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Lock Gate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorizedModalStep(null)}
                      className="text-xs font-semibold text-[#007FFF] hover:underline cursor-pointer"
                    >
                      Return to Patient Portal
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: DOCTOR AUTHENTICATION MODAL */}
            {authorizedModalStep === 'doctor_auth' && (
              <>
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-[#007FFF] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/25">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white">
                          Doctor Clearance
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base leading-tight mt-0.5">
                        Doctor Portal Access
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthorizedModalStep(null)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                  {/* Doctor Auth Tabs */}
                  <div className="flex bg-[#EEF2F6] p-1 rounded-full">
                    <button
                      type="button"
                      onClick={() => {
                        setDoctorAuthTab('login');
                        setDocAuthAlert(null);
                      }}
                      className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        doctorAuthTab === 'login'
                          ? 'bg-[#007FFF] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Doctor Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDoctorAuthTab('register');
                        setDocAuthAlert(null);
                      }}
                      className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        doctorAuthTab === 'register'
                          ? 'bg-[#007FFF] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Register Physician
                    </button>
                  </div>

                  {/* Doctor Feedback Alert */}
                  {docAuthAlert && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        docAuthAlert.type === 'error'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      {docAuthAlert.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div>{docAuthAlert.message}</div>
                    </div>
                  )}

                  {/* DOCTOR TAB 1: LOG IN */}
                  {doctorAuthTab === 'login' && (
                    <form onSubmit={handleDoctorLogin} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Doctor Email or ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={docLoginEmail}
                          onChange={e => setDocLoginEmail(e.target.value)}
                          placeholder="doctor@norsu.edu.ph"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={docShowPassword ? 'text' : 'password'}
                            required
                            value={docLoginPassword}
                            onChange={e => setDocLoginPassword(e.target.value)}
                            placeholder="Enter your doctor password"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800 pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setDocShowPassword(!docShowPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {docShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-[#007FFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        Log In to Doctor Portal
                      </button>

                      {users.filter(u => u.role === 'doctor').length === 0 && (
                        <p className="text-[11px] text-center text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-2">
                          💡 No doctor accounts currently exist. Click <strong>Register Physician</strong> above to set up your account.
                        </p>
                      )}
                    </form>
                  )}

                  {/* DOCTOR TAB 2: REGISTER */}
                  {doctorAuthTab === 'register' && (
                    <form onSubmit={handleDoctorRegister} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Full Physician Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={docRegName}
                          onChange={e => setDocRegName(e.target.value)}
                          placeholder="Dr. Roberto Mendoza, MD"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={docRegEmail}
                            onChange={e => setDocRegEmail(e.target.value)}
                            placeholder="doctor@norsu.edu.ph"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={docRegPassword}
                            onChange={e => setDocRegPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Medical Specialties
                        </label>
                        <input
                          type="text"
                          value={docRegSpec}
                          onChange={e => setDocRegSpec(e.target.value)}
                          placeholder="e.g. General Medicine & Campus Health"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Clinic Available Days
                          </label>
                          <input
                            type="text"
                            value={docRegDays}
                            onChange={e => setDocRegDays(e.target.value)}
                            placeholder="Monday - Friday (8:00 AM - 5:00 PM)"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Contact Phone
                          </label>
                          <input
                            type="text"
                            value={docRegPhone}
                            onChange={e => setDocRegPhone(e.target.value)}
                            placeholder="09123456789"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#007FFF] text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-[#007FFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        Register &amp; Access Doctor Dashboard
                      </button>
                    </form>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAuthorizedModalStep('panel_select')}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Panel Selector</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorizedModalStep(null)}
                      className="text-xs font-semibold text-[#007FFF] hover:underline cursor-pointer"
                    >
                      Patient Portal
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 4: ADMIN AUTHENTICATION MODAL */}
            {authorizedModalStep === 'admin_auth' && (
              <>
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                      <Shield className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                          Admin Clearance
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base leading-tight mt-0.5">
                        Administrator Portal Access
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthorizedModalStep(null)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                  {/* Admin Auth Tabs */}
                  <div className="flex bg-[#EEF2F6] p-1 rounded-full">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminAuthTab('login');
                        setAdminAuthAlert(null);
                      }}
                      className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        adminAuthTab === 'login'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Admin Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminAuthTab('register');
                        setAdminAuthAlert(null);
                      }}
                      className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        adminAuthTab === 'register'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Register Administrator
                    </button>
                  </div>

                  {/* Admin Feedback Alert */}
                  {adminAuthAlert && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        adminAuthAlert.type === 'error'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      {adminAuthAlert.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div>{adminAuthAlert.message}</div>
                    </div>
                  )}

                  {/* ADMIN TAB 1: LOG IN */}
                  {adminAuthTab === 'login' && (
                    <form onSubmit={handleAdminLogin} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Admin Email or ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={adminLoginEmail}
                          onChange={e => setAdminLoginEmail(e.target.value)}
                          placeholder="admin@norsu.edu.ph"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={adminShowPassword ? 'text' : 'password'}
                            required
                            value={adminLoginPassword}
                            onChange={e => setAdminLoginPassword(e.target.value)}
                            placeholder="Enter your administrator password"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800 pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setAdminShowPassword(!adminShowPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {adminShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        Log In to Administrator Portal
                      </button>

                      {users.filter(u => u.role === 'admin').length === 0 && (
                        <p className="text-[11px] text-center text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-2">
                          💡 No admin accounts currently exist. Click <strong>Register Administrator</strong> above to initialize your account.
                        </p>
                      )}
                    </form>
                  )}

                  {/* ADMIN TAB 2: REGISTER */}
                  {adminAuthTab === 'register' && (
                    <form onSubmit={handleAdminRegister} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Full Administrator Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={adminRegName}
                          onChange={e => setAdminRegName(e.target.value)}
                          placeholder="e.g. Maria Santos"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Admin Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={adminRegEmail}
                            onChange={e => setAdminRegEmail(e.target.value)}
                            placeholder="admin@norsu.edu.ph"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Employee / Admin ID
                          </label>
                          <input
                            type="text"
                            value={adminRegIdNumber}
                            onChange={e => setAdminRegIdNumber(e.target.value)}
                            placeholder="ADM-2026-01"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Clinic Department / Office
                        </label>
                        <input
                          type="text"
                          value={adminRegDept}
                          onChange={e => setAdminRegDept(e.target.value)}
                          placeholder="NORSU Clinic Administration"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={adminRegPassword}
                          onChange={e => setAdminRegPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        Register &amp; Access Admin Dashboard
                      </button>
                    </form>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAuthorizedModalStep('panel_select')}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Panel Selector</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorizedModalStep(null)}
                      className="text-xs font-semibold text-[#007FFF] hover:underline cursor-pointer"
                    >
                      Patient Portal
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
