import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Briefcase,
  Building,
  Phone,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  Download,
  Calendar,
  Sparkles,
  ChevronRight,
  UserCheck,
  RotateCcw,
  Check,
  X,
  UserX,
  Network
} from 'lucide-react';
import { User, UserRole, UserPrivileges } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { UserAvatar } from './UserAvatar';

const PRIVILEGE_METADATA: {
  key: keyof UserPrivileges;
  label: string;
  description: string;
  category: 'tasks' | 'admin' | 'files' | 'reports';
}[] = [
  {
    key: 'canCreateTask',
    label: 'Create Tasks',
    description: 'Permits creating new tasks and subtasks in any status column.',
    category: 'tasks'
  },
  {
    key: 'canEditAnyTask',
    label: 'Edit Any Task',
    description: 'Allows modifying all tasks in the workspace, even if unassigned.',
    category: 'tasks'
  },
  {
    key: 'canDeleteTask',
    label: 'Delete Tasks',
    description: 'Grants authority to permanently delete tasks and subtasks.',
    category: 'tasks'
  },
  {
    key: 'canManageStatuses',
    label: 'Manage Workflow Columns',
    description: 'Enables creating, reordering, and deleting Kanban workflow columns.',
    category: 'admin'
  },
  {
    key: 'canManageUsers',
    label: 'Manage Users & Privileges',
    description: 'Allows editing user accounts, roles, and privilege matrices.',
    category: 'admin'
  },
  {
    key: 'canUploadAttachments',
    label: 'Upload File Attachments',
    description: 'Allows attaching validated files (txt, csv, png, jpg up to 1024 KB).',
    category: 'files'
  },
  {
    key: 'canDeleteAttachments',
    label: 'Delete Attachments',
    description: 'Permits removing file attachments from tasks.',
    category: 'files'
  },
  {
    key: 'canViewAuditLogs',
    label: 'View Full Audit Trail',
    description: 'Allows reading workspace-wide system activity and security logs.',
    category: 'reports'
  },
  {
    key: 'canExportData',
    label: 'Export Data & Reports',
    description: 'Grants access to export task spreadsheets and analytics summaries.',
    category: 'reports'
  }
];

export const UserManagementView: React.FC = () => {
  const { currentUser, users, refreshUsers, switchUser, isAdmin } = useAuth();
  const { tasks, navigateToGraph, openUserProfile } = useTasks();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'basic'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form states for Create
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('basic');
  const [createTitle, setCreateTitle] = useState('');
  const [createDept, setCreateDept] = useState('Engineering');
  const [createPhone, setCreatePhone] = useState('');
  const [createBio, setCreateBio] = useState('');
  const [createPrivileges, setCreatePrivileges] = useState<UserPrivileges>({
    canCreateTask: true,
    canEditAnyTask: false,
    canDeleteTask: false,
    canManageStatuses: false,
    canManageUsers: false,
    canUploadAttachments: true,
    canDeleteAttachments: true,
    canViewAuditLogs: false,
    canExportData: false
  });

  // Notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
      const matchDept = deptFilter === 'all' || u.department === deptFilter;

      return matchSearch && matchRole && matchStatus && matchDept;
    });
  }, [users, searchTerm, roleFilter, statusFilter, deptFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const basics = users.filter((u) => u.role === 'basic').length;
    const active = users.filter((u) => (u.status || 'active') === 'active').length;
    const inactive = users.filter((u) => u.status === 'inactive' || u.status === 'suspended').length;
    return { total, admins, basics, active, inactive };
  }, [users]);

  // Handle Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim()) return;

    try {
      setIsSubmitting(true);
      await api.createUser({
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        role: createRole,
        title: createTitle.trim() || (createRole === 'admin' ? 'System Administrator' : 'Software Engineer'),
        department: createDept.trim() || 'Engineering',
        phone: createPhone.trim(),
        bio: createBio.trim(),
        privileges: createPrivileges,
        status: 'active'
      });

      await refreshUsers();
      showFeedback(`User ${createName.trim()} created successfully.`);
      setIsAddModalOpen(false);
      resetCreateForm();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateName('');
    setCreateEmail('');
    setCreateRole('basic');
    setCreateTitle('');
    setCreateDept('Engineering');
    setCreatePhone('');
    setCreateBio('');
    setCreatePrivileges({
      canCreateTask: true,
      canEditAnyTask: false,
      canDeleteTask: false,
      canManageStatuses: false,
      canManageUsers: false,
      canUploadAttachments: true,
      canDeleteAttachments: true,
      canViewAuditLogs: false,
      canExportData: false
    });
  };

  // Handle Edit User Submit
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSubmitting(true);
      await api.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        title: editingUser.title,
        department: editingUser.department,
        avatar: editingUser.avatar,
        bio: editingUser.bio,
        phone: editingUser.phone,
        status: editingUser.status,
        privileges: editingUser.privileges
      });

      await refreshUsers();
      showFeedback(`Profile and privileges updated for ${editingUser.name}.`);
      setEditingUser(null);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to update user profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (user: User, newStatus: 'active' | 'inactive' | 'suspended') => {
    if (user.id === currentUser?.id && newStatus !== 'active') {
      showFeedback('You cannot deactivate your own active session.', 'error');
      return;
    }
    try {
      await api.updateUserStatus(user.id, newStatus);
      await refreshUsers();
      showFeedback(`User status changed to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to update status', 'error');
    }
  };

  // Delete User Confirmation
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
      showFeedback('Cannot delete currently logged-in administrator.', 'error');
      setUserToDelete(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.deleteUser(userToDelete.id);
      await refreshUsers();
      showFeedback(`User account "${userToDelete.name}" deleted.`);
      setUserToDelete(null);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset privilege application
  const applyPreset = (preset: 'admin' | 'lead' | 'contributor' | 'readonly') => {
    if (!editingUser) return;
    let newPrivileges: UserPrivileges;

    switch (preset) {
      case 'admin':
        newPrivileges = {
          canCreateTask: true,
          canEditAnyTask: true,
          canDeleteTask: true,
          canManageStatuses: true,
          canManageUsers: true,
          canUploadAttachments: true,
          canDeleteAttachments: true,
          canViewAuditLogs: true,
          canExportData: true
        };
        break;
      case 'lead':
        newPrivileges = {
          canCreateTask: true,
          canEditAnyTask: true,
          canDeleteTask: false,
          canManageStatuses: true,
          canManageUsers: false,
          canUploadAttachments: true,
          canDeleteAttachments: true,
          canViewAuditLogs: true,
          canExportData: true
        };
        break;
      case 'contributor':
        newPrivileges = {
          canCreateTask: true,
          canEditAnyTask: false,
          canDeleteTask: false,
          canManageStatuses: false,
          canManageUsers: false,
          canUploadAttachments: true,
          canDeleteAttachments: true,
          canViewAuditLogs: false,
          canExportData: false
        };
        break;
      case 'readonly':
        newPrivileges = {
          canCreateTask: false,
          canEditAnyTask: false,
          canDeleteTask: false,
          canManageStatuses: false,
          canManageUsers: false,
          canUploadAttachments: false,
          canDeleteAttachments: false,
          canViewAuditLogs: true,
          canExportData: true
        };
        break;
    }

    setEditingUser({
      ...editingUser,
      privileges: newPrivileges
    });
  };

  return (
    <div id="manage-users-page" className="flex-1 overflow-y-auto bg-[#0d0d0d] p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#141414] rounded border border-[#262626] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  User Management & Privileges
                </h1>
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage organization user profiles, role assignments, and granular access control privileges
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        {isAdmin && (
          <button
            type="button"
            id="btn-add-new-user"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/80 text-rose-300 border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#141414] rounded border border-[#262626] space-y-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Members</span>
          <p className="text-2xl font-extrabold text-white">{metrics.total}</p>
        </div>

        <div className="p-4 bg-[#141414] rounded border border-[#262626] space-y-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Administrators</span>
          <p className="text-2xl font-extrabold text-amber-300">{metrics.admins}</p>
        </div>

        <div className="p-4 bg-[#141414] rounded border border-[#262626] space-y-1">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Standard Users</span>
          <p className="text-2xl font-extrabold text-blue-300">{metrics.basics}</p>
        </div>

        <div className="p-4 bg-[#141414] rounded border border-[#262626] space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Active Status</span>
          <p className="text-2xl font-extrabold text-emerald-300">{metrics.active}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#141414] rounded border border-[#262626] flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="user-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, title, department..."
            className="w-full pl-9 pr-4 py-2 bg-[#1c1c1c] border border-[#333333] rounded text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role filter */}
          <select
            id="filter-user-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#1c1c1c] border border-[#333333] rounded text-xs text-neutral-200 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="basic">Standard Users</option>
          </select>

          {/* Status filter */}
          <select
            id="filter-user-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#1c1c1c] border border-[#333333] rounded text-xs text-neutral-200 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Department filter */}
          <select
            id="filter-user-dept"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-[#1c1c1c] border border-[#333333] rounded text-xs text-neutral-200 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table / Directory */}
      <div className="bg-[#141414] rounded border border-[#262626] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#181818] text-neutral-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#262626]">
              <tr>
                <th className="px-5 py-3.5">User & Identity</th>
                <th className="px-4 py-3.5">Role & Department</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Privileges Matrix</th>
                <th className="px-4 py-3.5">Tasks Assigned</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  const assignedTasksCount = tasks.filter((t) => t.assigneeIds.includes(user.id)).length;
                  const privCount = Object.values(user.privileges || {}).filter(Boolean).length;
                  const userStatus = user.status || 'active';

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#191919] transition-colors ${
                        isCurrent ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer group/userinfo"
                          onClick={() => openUserProfile(user)}
                          title={`Open ${user.name}'s Profile`}
                        >
                          <div className="relative shrink-0">
                            <UserAvatar
                              user={user}
                              size="md"
                              className="rounded-full border border-[#333333] group-hover/userinfo:ring-2 group-hover/userinfo:ring-blue-500 transition-all"
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#141414] ${
                                userStatus === 'active'
                                  ? 'bg-emerald-500'
                                  : userStatus === 'suspended'
                                  ? 'bg-rose-500'
                                  : 'bg-neutral-500'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-neutral-100 text-sm group-hover/userinfo:text-blue-300 transition-colors">
                                {user.name}
                              </p>
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-400 text-xs flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div>
                            {user.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                                <Shield className="w-3 h-3" />
                                Administrator
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 bg-blue-950/60 border border-blue-800/80 px-2 py-0.5 rounded">
                                Standard User
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 font-medium">
                            {user.title || 'Team Member'} • {user.department || 'General'}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <select
                          value={userStatus}
                          disabled={!isAdmin}
                          onChange={(e) => handleToggleStatus(user, e.target.value as any)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded border focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed ${
                            userStatus === 'active'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : userStatus === 'suspended'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>

                      {/* Privileges Matrix Summary */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="font-semibold text-white text-xs">
                              {privCount} of 9 Granted
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                            {user.privileges?.canEditAnyTask && (
                              <span className="text-[9px] bg-[#222222] text-neutral-300 px-1 py-0.2 rounded border border-[#333333]">
                                All Tasks
                              </span>
                            )}
                            {user.privileges?.canManageStatuses && (
                              <span className="text-[9px] bg-[#222222] text-neutral-300 px-1 py-0.2 rounded border border-[#333333]">
                                Workflows
                              </span>
                            )}
                            {user.privileges?.canManageUsers && (
                              <span className="text-[9px] bg-amber-950/50 text-amber-300 px-1 py-0.2 rounded border border-amber-800/60">
                                RBAC Admin
                              </span>
                            )}
                            {user.privileges?.canUploadAttachments && (
                              <span className="text-[9px] bg-[#222222] text-neutral-300 px-1 py-0.2 rounded border border-[#333333]">
                                1024KB Files
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Tasks */}
                      <td className="px-4 py-4">
                        <span className="font-bold text-neutral-200 text-sm">
                          {assignedTasksCount}
                        </span>
                        <span className="text-[11px] text-neutral-500 ml-1">tasks</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Full User Profile & Avatar */}
                          <button
                            type="button"
                            onClick={() => openUserProfile(user)}
                            title={`View & Customize ${user.name}'s Profile`}
                            className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* View Relationship Graph */}
                          <button
                            type="button"
                            onClick={() => navigateToGraph(user.id)}
                            title={`View ${user.name}'s task & tag relationship graph`}
                            className="p-1.5 text-neutral-400 hover:text-indigo-400 hover:bg-indigo-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Network className="w-4 h-4" />
                          </button>

                          {/* Switch To context */}
                          <button
                            type="button"
                            onClick={() => switchUser(user.id)}
                            title={`Switch active view session to ${user.name}`}
                            className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-[#222222] rounded transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Edit Profile & Privileges */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setEditingUser({ ...user, privileges: { ...user.privileges } })}
                              title="Edit user profile & permissions"
                              className="p-1.5 text-neutral-400 hover:text-amber-300 hover:bg-[#222222] rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Account */}
                          {isAdmin && !isCurrent && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              title="Delete user account"
                              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-500 text-xs">
                    No users matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Profile & Privileges Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative bg-[#141414] w-full max-w-3xl rounded shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={editingUser}
                  size="lg"
                  className="rounded-full border border-[#333333]"
                />
                <div>
                  <h2 className="text-base font-bold text-white">
                    Edit User Profile & Privileges: {editingUser.name}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Modify profile details, system roles, and custom RBAC permissions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#262626]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateUser} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* Section 1: Profile Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <span>Profile Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#1e1e1e] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#1e1e1e] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={editingUser.title || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#1e1e1e] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#1e1e1e] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 text-xs bg-[#1e1e1e] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      System Role
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        setEditingUser({ ...editingUser, role: newRole });
                      }}
                      className="w-full px-3 py-2 text-xs bg-[#1e1e1e] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
                    >
                      <option value="basic">Basic / Standard User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Bio / Specialty
                  </label>
                  <textarea
                    rows={2}
                    value={editingUser.bio || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                    placeholder="Short bio or technical responsibilities..."
                    className="w-full px-3 py-2 text-xs bg-[#1e1e1e] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section 2: Custom Privileges Matrix */}
              <div className="space-y-3 pt-2 border-t border-[#262626]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Granular Privileges Matrix</span>
                  </h3>

                  {/* Preset Shortcuts */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-neutral-500 font-semibold">Presets:</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('admin')}
                      className="px-2 py-0.5 rounded bg-[#222222] hover:bg-[#2c2c2c] text-amber-300 border border-amber-800/50 cursor-pointer"
                    >
                      Full Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('lead')}
                      className="px-2 py-0.5 rounded bg-[#222222] hover:bg-[#2c2c2c] text-blue-300 border border-blue-800/50 cursor-pointer"
                    >
                      Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('contributor')}
                      className="px-2 py-0.5 rounded bg-[#222222] hover:bg-[#2c2c2c] text-neutral-300 border border-[#333333] cursor-pointer"
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('readonly')}
                      className="px-2 py-0.5 rounded bg-[#222222] hover:bg-[#2c2c2c] text-neutral-400 border border-[#333333] cursor-pointer"
                    >
                      Auditor
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {PRIVILEGE_METADATA.map((priv) => {
                    const isGranted = Boolean(editingUser.privileges?.[priv.key]);
                    return (
                      <label
                        key={priv.key}
                        className={`flex items-start gap-3 p-3 rounded border transition-all cursor-pointer select-none ${
                          isGranted
                            ? 'bg-[#18231c] border-emerald-800/80 text-emerald-100'
                            : 'bg-[#181818] border-[#2a2a2a] text-neutral-400 hover:border-[#3a3a3a]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={(e) => {
                            setEditingUser({
                              ...editingUser,
                              privileges: {
                                ...editingUser.privileges,
                                [priv.key]: e.target.checked
                              }
                            });
                          }}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight text-white">{priv.label}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                            {priv.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-neutral-300 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving Changes...' : 'Save Profile & Privileges'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative bg-[#141414] w-full max-w-2xl rounded shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Create New Organization User</h2>
                  <p className="text-xs text-neutral-400">Add credentials, job function, and initial permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#262626]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="jordan.lee@techcorp.io"
                    className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. Frontend Architect"
                    className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={createDept}
                    onChange={(e) => setCreateDept(e.target.value)}
                    placeholder="Engineering, Security, Design..."
                    className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    System Role
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white font-semibold cursor-pointer"
                  >
                    <option value="basic">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Bio / Responsibilities
                </label>
                <textarea
                  rows={2}
                  value={createBio}
                  onChange={(e) => setCreateBio(e.target.value)}
                  placeholder="Summary of responsibilities..."
                  className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#222222] text-neutral-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createName.trim() || !createEmail.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded disabled:opacity-40"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-[#141414] w-full max-w-md rounded border border-rose-800/80 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-rose-950/80 text-rose-400 flex items-center justify-center shrink-0 border border-rose-800">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete User Account</h3>
                <p className="text-xs text-neutral-400">This action will remove account access and unassign tasks.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-[#1c1c1c] p-3 rounded border border-[#2a2a2a]">
              Are you sure you want to permanently delete <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.email})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 bg-[#222222] text-neutral-300 text-xs font-semibold rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
