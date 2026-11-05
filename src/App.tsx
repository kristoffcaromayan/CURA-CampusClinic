import React, { useState, useEffect } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { PatientPortal } from './components/PatientPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { AdminPortal } from './components/AdminPortal';
import { PhpSourceModal } from './components/PhpSourceModal';
import { IntroSplash } from './components/IntroSplash';
import { SentEmail } from './types';
import {
  Mail,
  CheckCircle2,
  X,
  ExternalLink,
  Calendar,
  User,
  Clock,
  Sparkles,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const EmailToastNotification: React.FC = () => {
  const { latestEmailToast, clearLatestEmailToast } = useClinic();
  const [activePreviewEmail, setActivePreviewEmail] = useState<SentEmail | null>(null);

  // Auto-dismiss the toast after 10 seconds if not interacted with
  useEffect(() => {
    if (!latestEmailToast) return;
    const timer = setTimeout(() => {
      clearLatestEmailToast();
    }, 10000);
    return () => clearTimeout(timer);
  }, [latestEmailToast, clearLatestEmailToast]);

  return (
    <>
      {/* Floating Dispatched Email Toast Banner */}
      {latestEmailToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-bounce-in">
          <div className="bg-white border-2 border-[#007FFF] rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#007FFF] flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#007FFF]">Automated Email Sent</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{latestEmailToast.subject}</h4>
                </div>
              </div>
              <button
                onClick={clearLatestEmailToast}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Recipient:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[220px]">{latestEmailToast.to}</span>
              </div>
              <div className="text-slate-500 line-clamp-2 italic">
                "{latestEmailToast.body.replace(/\n+/g, ' ')}"
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {new Date(latestEmailToast.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • SMTP Mock Server
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActivePreviewEmail(latestEmailToast);
                    clearLatestEmailToast();
                  }}
                  className="px-3 py-1 bg-[#007FFF] text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Email Modal Preview */}
      {activePreviewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-[#007FFF] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">NORSU Mabinay Mailer</h3>
                  <p className="text-xs text-blue-100">Official Clinic Dispatch Notification</p>
                </div>
              </div>
              <button
                onClick={() => setActivePreviewEmail(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Email Headers */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">From:</span>
                  <span className="font-bold text-slate-800">NORSU Mabinay Campus Clinic &lt;clinic@norsu-mabinay.edu.ph&gt;</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">To:</span>
                  <span className="font-bold text-[#007FFF]">{activePreviewEmail.to} ({activePreviewEmail.recipientName})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Subject:</span>
                  <span className="font-semibold text-slate-900">{activePreviewEmail.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Sent Date:</span>
                  <span className="text-slate-700">{new Date(activePreviewEmail.sentAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-500">Type:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#007FFF]">
                    {activePreviewEmail.type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Email Content formatted letterhead */}
              <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/assets/aistudio/f3b4c440-4209-4f52-9a36-16db061327f9-removebg-preview_dc9e948a.png"
                      alt="CURA Official Logo"
                      className="h-8 w-auto object-contain"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">CURA CLINICAL DISPATCH</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Negros Oriental State University - Mabinay Campus</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                  {activePreviewEmail.body}
                </div>

                <div className="border-t border-slate-100 pt-4 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600">NORSU Mabinay Campus Health Services Unit</p>
                  <p>Mabinay, Negros Oriental, Philippines</p>
                  <p className="italic text-[11px]">This is an automated notification generated by CURA System.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActivePreviewEmail(null)}
                className="px-5 py-2 bg-slate-800 text-white font-semibold rounded-xl text-xs hover:bg-slate-900 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MainLayout: React.FC = () => {
  const { currentUser, switchRoleQuick, logout } = useClinic();
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('cura_intro_completed_v1');
  });
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isPhpModalOpen, setIsPhpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStudioSwitcherCollapsed, setIsStudioSwitcherCollapsed] = useState(false);

  const isAiStudioEnv =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('run.app') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1'));

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('cura_intro_completed_v1', 'true');
    } catch {
      // Storage access handle
    }
    setShowIntro(false);
  };

  // Sync default tab whenever user role changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'doctor') {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('home');
      }
    }
  }, [currentUser?.role]);

  // Intro Splash animation preloader (plays once on first load, then transitions directly to login)
  if (showIntro) {
    return <IntroSplash onComplete={handleIntroComplete} />;
  }

  // Unauthenticated screen: Secure login interface (NO studio switcher here)
  if (!currentUser) {
    return (
      <>
        <AuthScreen
          onOpenPhpModal={() => setIsPhpModalOpen(true)}
        />
        <EmailToastNotification />
        <PhpSourceModal isOpen={isPhpModalOpen} onClose={() => setIsPhpModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-slate-800 antialiased overflow-hidden relative">
      {/* Studio Panel Switcher / External Access Links (Only visible in AI Studio environment in the panel dashboard, completely hidden from inside actual dashboard panels for regular users, and not in the login interface) */}
      {isAiStudioEnv && (
        <div className="fixed top-3 right-4 z-50 flex items-center shadow-xl rounded-full text-xs animate-in slide-in-from-top-2">
          {isStudioSwitcherCollapsed ? (
            <button
              type="button"
              onClick={() => setIsStudioSwitcherCollapsed(false)}
              className="bg-slate-900/90 hover:bg-slate-900 text-sky-400 border border-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition shadow-md"
              title="Expand AI Studio Role Switcher"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-[10px] tracking-wider uppercase">Studio Switcher</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900/95 text-white backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-2xl">
              <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-sky-400">
                  Studio Switcher
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchRoleQuick('patient')}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition cursor-pointer ${
                  currentUser.role !== 'admin' && currentUser.role !== 'doctor'
                    ? 'bg-[#007FFF] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Preview Student / Patient Panel"
              >
                🎓 Patient
              </button>
              <button
                type="button"
                onClick={() => switchRoleQuick('doctor')}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition cursor-pointer ${
                  currentUser.role === 'doctor'
                    ? 'bg-[#007FFF] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Preview Doctor Panel"
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => switchRoleQuick('admin')}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition cursor-pointer ${
                  currentUser.role === 'admin'
                    ? 'bg-[#007FFF] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Preview Administrator Panel"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => setIsStudioSwitcherCollapsed(true)}
                className="text-slate-400 hover:text-white p-1 rounded transition ml-1"
                title="Minimize Switcher"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Navigation (responsive with hamburger drawer on mobile/tablet) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenPhpModal={() => setIsPhpModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Role-Specific View */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentUser.role === 'doctor' ? (
          <DoctorPortal
            currentTab={currentTab}
            onNavigateTab={setCurrentTab}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminPortal
            currentTab={currentTab}
            onNavigateTab={setCurrentTab}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />
        ) : (
          <PatientPortal
            currentTab={currentTab}
            onNavigateTab={setCurrentTab}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />
        )}
      </main>

      {/* Floating Email Notification Toast & Viewer */}
      <EmailToastNotification />

      {/* PHP & SQL Source Inspector Modal */}
      <PhpSourceModal isOpen={isPhpModalOpen} onClose={() => setIsPhpModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <MainLayout />
    </ClinicProvider>
  );
}
