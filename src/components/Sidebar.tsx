import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { CuraLogo } from './CuraLogo';
import {
  Home,
  BriefcaseMedical,
  CalendarDays,
  Bookmark,
  Settings,
  BarChart2,
  Users,
  Clock,
  Package,
  UserCheck,
  Code2,
  Mail,
  Pill,
  X,
  Shield,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenPhpModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenPhpModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentUser, logout, users } = useClinic();

  if (!currentUser) return null;

  const role = currentUser.role;
  const pendingApprovalsCount = users.filter(
    u => u.status === 'pending' || u.status === 'deletion_requested'
  ).length;

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogout = () => {
    logout();
    if (onCloseMobile) onCloseMobile();
  };

  // Define nav items per role
  const getNavItems = () => {
    if (role === 'doctor') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
        { id: 'appointments', label: 'My Appointments', icon: Bookmark },
        { id: 'sessions', label: 'My Sessions', icon: CalendarDays },
        { id: 'patients', label: 'My Patients', icon: Users },
        { id: 'emails', label: 'Email Notifications', icon: Mail },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
        { id: 'doctors', label: 'Doctors', icon: BriefcaseMedical },
        { id: 'schedule', label: 'Schedule', icon: Clock },
        { id: 'appointments', label: 'Appointment', icon: Bookmark },
        { id: 'patients', label: 'Patients', icon: Users },
        {
          id: 'approvals',
          label: 'Account Approvals',
          icon: UserCheck,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: 'inventory', label: 'Inventory Supplies', icon: Package },
        { id: 'emails', label: 'Email Center', icon: Mail },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    // Default: Patient / Student / Staff / Faculty / Utility
    return [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'doctors', label: 'All Doctors', icon: BriefcaseMedical },
      { id: 'sessions', label: 'Scheduled Sessions', icon: CalendarDays },
      { id: 'bookings', label: 'My Bookings', icon: Bookmark },
      { id: 'medicines', label: 'Clinic Medicines', icon: Pill },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop Overlay (only on < lg when menu is open) */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer on mobile (<lg) / Static sidebar on desktop (>=lg) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 h-screen transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:h-screen lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Profile */}
        <div className="overflow-y-auto">
          {/* Official CURA Brand Bar */}
          <div className="p-4 pb-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <CuraLogo size="sm" showSubtitle={true} />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-[#007FFF]">
                {role === 'admin' ? 'Admin' : role === 'doctor' ? 'Doctor' : 'Patient'}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 pb-4">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-slate-400">
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-800 truncate" title={currentUser.fullName}>
                    {currentUser.fullName}
                  </h2>
                  <p className="text-[11px] text-slate-400 truncate" title={currentUser.email}>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Close button on mobile */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                aria-label="Close menu"
                title="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Log out button matching pictures */}
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-[#E8F1FC] hover:bg-[#D5E6F8] text-[#007FFF] text-xs font-semibold rounded-md transition text-center shadow-2xs cursor-pointer"
            >
              Log out
            </button>
          </div>

          {/* Navigation list */}
          <nav className="mt-1 space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-6 py-3 text-xs font-medium transition text-left relative cursor-pointer ${
                    isActive
                      ? 'text-[#007FFF] bg-blue-50/50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#007FFF]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute right-0 top-0 bottom-0 w-1 bg-[#007FFF]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Clean Official Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Campus Clinic Services
            </span>
            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            Negros Oriental State University • Mabinay
          </div>
        </div>
      </aside>
    </>
  );
};
