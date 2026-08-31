import React, { useState } from 'react';
import {
  X,
  Plus,
  Users,
  Shield,
  User as UserIcon,
  CheckCircle2,
  Mail,
  Briefcase,
  Building
} from 'lucide-react';
import { UserRole, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { UserAvatar } from './UserAvatar';

export const UserManagementModal: React.FC = () => {
  const { isUserModalOpen, setIsUserModalOpen, tasks, openUserProfile } = useTasks();
  const { users, refreshUsers, isAdmin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('basic');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isUserModalOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await api.createUser({
        name: name.trim(),
        email: email.trim(),
        role,
        title: title.trim() || (role === 'admin' ? 'System Administrator' : 'Software Engineer'),
        department: department.trim() || 'Engineering'
      });

      await refreshUsers();
      setSuccessMsg(`User ${name} added successfully as ${role.toUpperCase()}!`);
      setName('');
      setEmail('');
      setTitle('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        id="user-management-modal"
        className="relative bg-[#141414] w-full max-w-2xl rounded shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-950/60 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">
                  Team Members & Access Control
                </h2>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                  Admin
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage organization accounts and role-based permissions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUserModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Add User Form */}
          {isAdmin && (
            <div className="p-4 bg-[#181818] rounded border border-[#262626] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Invite New Team Member</span>
              </h3>

              {successMsg && (
                <div className="p-2.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800 rounded text-xs font-medium">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-2.5 bg-rose-950/60 text-rose-300 border border-rose-800 rounded text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Lee"
                      className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan.lee@techcorp.io"
                      className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Role & Permissions
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-neutral-200 focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
                    >
                      <option value="basic">Basic User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Senior DevOps"
                      className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Engineering, Design..."
                      className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !email.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Adding...' : 'Add Team Member'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Users List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Active Team Members ({users.length})
            </h3>

            <div className="space-y-2">
              {users.map((u) => {
                const assignedCount = tasks.filter((t) => t.assigneeIds.includes(u.id)).length;
                const userIsAdmin = u.role === 'admin';

                return (
                  <div
                    key={u.id}
                    className="p-3 bg-[#181818] rounded border border-[#262626] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        user={u}
                        size="md"
                        className="ring-1 ring-[#333333] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{u.name}</span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                              userIsAdmin
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-blue-950/60 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {userIsAdmin ? 'Administrator' : 'Basic User'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {u.title} • {u.department} • <span className="text-neutral-500">{u.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-neutral-200">{assignedCount}</span>
                        <span className="text-[11px] text-neutral-500 ml-1">tasks</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          openUserProfile(u);
                          setIsUserModalOpen(false);
                        }}
                        className="px-2.5 py-1 bg-[#222222] hover:bg-blue-600/30 text-neutral-300 hover:text-blue-300 text-xs rounded border border-[#333333] hover:border-blue-500/50 transition-colors cursor-pointer"
                      >
                        Profile & Avatar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#1a1a1a] flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsUserModalOpen(false)}
            className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
