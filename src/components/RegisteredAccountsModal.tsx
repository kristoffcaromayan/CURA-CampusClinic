import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  X,
  Search,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Users,
  Shield,
  Filter,
} from 'lucide-react';

interface RegisteredAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onApproveUser: (userId: string) => void;
  onRequestDeleteUser: (user: UserAccount) => void;
  onToggleStatus?: (userId: string, currentStatus: string) => void;
}

export const RegisteredAccountsModal: React.FC<RegisteredAccountsModalProps> = ({
  isOpen,
  onClose,
  users,
  onApproveUser,
  onRequestDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  if (!isOpen) return null;

  // Patient accounts (students, staff, faculty, utility)
  const patientUsers = users.filter(
    u => u.role === 'student' || u.role === 'staff' || u.role === 'faculty' || u.role === 'utility'
  );

  const totalRegistered = patientUsers.length;
  const totalApproved = patientUsers.filter(u => u.status === 'approved').length;
  const totalPending = patientUsers.filter(u => u.status === 'pending').length;
  const totalDeletion = patientUsers.filter(u => u.status === 'deletion_requested').length;

  const filteredUsers = patientUsers.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.courseOrDept && user.courseOrDept.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007FFF] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Registered Patient Accounts Management
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-[#007FFF] rounded-full">
                  CURA Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                View, verify, search, and manage all student, staff, faculty, and utility registered accounts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Total Registered</span>
            <span className="text-lg font-bold text-slate-900">{totalRegistered}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <span className="text-[11px] text-emerald-700 block font-medium">Verified Active</span>
            <span className="text-lg font-bold text-emerald-800">{totalApproved}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
            <span className="text-[11px] text-amber-700 block font-medium">Pending Review</span>
            <span className="text-lg font-bold text-amber-800">{totalPending}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
            <span className="text-[11px] text-rose-700 block font-medium">Deletion Requests</span>
            <span className="text-lg font-bold text-rose-800">{totalDeletion}</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, student/staff ID, email, or department..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007FFF] focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#007FFF]"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
              <option value="faculty">Faculty</option>
              <option value="utility">Utility</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#007FFF]"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Verified / Active</option>
              <option value="pending">Pending Review</option>
              <option value="deletion_requested">Deletion Requested</option>
            </select>
          </div>
        </div>

        {/* Accounts Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredUsers.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Account Holder</th>
                    <th className="py-2.5 px-3">ID Number</th>
                    <th className="py-2.5 px-3">Role &amp; Department</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 overflow-hidden">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              user.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{user.fullName}</span>
                            <span className="text-[10px] text-slate-400">Registered {user.createdAt || 'Recent'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-700">
                        {user.idNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-[#007FFF] text-[10px] font-bold rounded capitalize mb-0.5">
                          {user.role}
                        </span>
                        <div className="text-[11px] text-slate-600 truncate max-w-[200px]" title={user.courseOrDept}>
                          {user.courseOrDept}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {user.email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize inline-flex items-center gap-1 ${
                            user.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : user.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {user.status === 'approved' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </>
                          ) : user.status === 'pending' ? (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Deletion Req.
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {user.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onApproveUser(user.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Verify and Approve Account"
                          >
                            <UserCheck className="w-3 h-3" />
                            Verify
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onRequestDeleteUser(user)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Remove this account"
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
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No matching patient accounts found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing <strong className="text-slate-700">{filteredUsers.length}</strong> of {totalRegistered} registered patient accounts
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
