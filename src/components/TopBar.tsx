import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { Calendar, Search, Menu } from 'lucide-react';
import { CuraLogo } from './CuraLogo';

interface TopBarProps {
  title: string;
  onSearch?: (query: string) => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onSearch, onToggleMobileMenu }) => {
  const { currentUser } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');

  // Format today's date matching screenshot: YYYY-MM-DD
  const todayFormatted = new Date().toISOString().split('T')[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
              title="Toggle navigation menu"
            >
              <Menu className="w-5 h-5 text-[#007FFF]" />
            </button>
          )}
          <CuraLogo size="xs" className="lg:hidden" />
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">{title}</h1>
        </div>

        {isAdmin && (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search Doctor name or Email"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#007FFF]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#E8F1FC] hover:bg-[#D5E6F8] text-[#007FFF] text-xs font-semibold rounded-md transition shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        )}
      </div>

      {/* Date badge matching screenshot: "Today's Date 2022-06-03 [calendar]" */}
      <div className="flex items-center gap-2 self-end sm:self-auto text-right shrink-0">
        <div>
          <span className="text-[10px] text-slate-400 font-medium block leading-none">Today's Date</span>
          <span className="text-xs font-bold text-slate-700">{todayFormatted}</span>
        </div>
        <div className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-600 shadow-2xs">
          <Calendar className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
