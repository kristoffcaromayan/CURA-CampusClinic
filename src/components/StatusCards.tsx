import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { calculateClinicMetrics } from '../lib/clinicLogic';
import { BriefcaseMedical, Users, Bookmark, Activity } from 'lucide-react';

export const StatusCards: React.FC = () => {
  const { doctors, users, appointments, sessions, currentUser } = useClinic();

  const metrics = calculateClinicMetrics({
    doctors,
    users,
    appointments,
    sessions,
  });

  const isAdmin = currentUser?.role === 'admin';

  const cards = [
    {
      count: metrics.allDoctors,
      label: isAdmin ? 'Doctors' : 'All Doctors',
      icon: BriefcaseMedical,
    },
    {
      count: metrics.allPatients,
      label: isAdmin ? 'Patients' : 'All Patients',
      icon: Users,
    },
    {
      count: metrics.newBookings,
      label: 'NewBooking',
      icon: Bookmark,
    },
    {
      count: metrics.todaySessions,
      label: 'Today Sessions',
      icon: Activity,
    },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-3">Status</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between"
            >
              <div>
                <span className="text-2xl font-bold text-[#007FFF] block leading-none mb-1">
                  {card.count}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {card.label}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100/90 flex items-center justify-center text-[#007FFF]">
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
