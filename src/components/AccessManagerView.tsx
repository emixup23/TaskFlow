import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  UserCheck,
  Users,
  UserPlus,
  UserMinus,
  UserX,
  CheckSquare,
  Square,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Copy,
  Download,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  Briefcase,
  User as UserIcon,
  FileCheck,
  Eye,
  Sliders,
  FolderKanban,
  FileUp,
  MessageSquare,
  Video,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  User,
  UserPrivileges,
  SystemRole,
  PrivilegeDefinition,
  AccessSummaryStats,
  BatchAccessUpdatePayload
} from '../types';
import { UserAvatar } from './UserAvatar';

// -------------------------------------------------------------
// Granular Privilege Definitions & Metadata
// -------------------------------------------------------------

export const PRIVILEGE_DEFINITIONS: PrivilegeDefinition[] = [
  // Task & Workflows
  {
    key: 'canCreateTask',
    label: 'Create Tasks',
    category: 'task',
    categoryLabel: 'Task & Workflows',
    description: 'Permits creating new tasks, subtasks, and assigning team members.',
    risk: 'low'
  },
  {
    key: 'canEditAnyTask',
    label: 'Edit Any Task',
    category: 'task',
    categoryLabel: 'Task & Workflows',
    description: 'Allows modifying all workspace tasks, including those assigned to other members.',
    risk: 'medium'
  },
  {
    key: 'canDeleteTask',
    label: 'Delete Tasks',
    category: 'task',
    categoryLabel: 'Task & Workflows',
    description: 'Grants high authority to permanently delete tasks, milestones, and checklists.',
    risk: 'high'
  },
  {
    key: 'canManageStatuses',
    label: 'Manage Workflow Columns',
    category: 'task',
    categoryLabel: 'Task & Workflows',
    description: 'Enables creating, customizing, reordering, and deleting Kanban status columns.',
    risk: 'medium'
  },
  {
    key: 'canManageProjects',
    label: 'Manage Projects',
    category: 'task',
    categoryLabel: 'Task & Workflows',
    description: 'Permits creating project workspaces, archiving, and configuring project settings.',
    risk: 'medium'
  },
  // Governance & Administration
  {
    key: 'canManageUsers',
    label: 'Manage User Accounts',
    category: 'admin',
    categoryLabel: 'Governance & Security',
    description: 'Authority to create, deactivate, suspend, and edit team member accounts.',
    risk: 'high'
  },
  {
    key: 'canManageRoles',
    label: 'Manage Roles & Access',
    category: 'admin',
    categoryLabel: 'Governance & Security',
    description: 'Full governance authority to configure system role templates and permissions.',
    risk: 'high'
  },
  {
    key: 'canViewAuditLogs',
    label: 'View Audit Logs',
    category: 'admin',
    categoryLabel: 'Governance & Security',
    description: 'Access to the workspace security event trail and forensic compliance logs.',
    risk: 'medium'
  },
  {
    key: 'canManageBackups',
    label: 'Disaster Recovery & Backups',
    category: 'admin',
    categoryLabel: 'Governance & Security',
    description: 'Authority to trigger live database backups, download snapshots, and execute restores.',
    risk: 'high'
  },
  {
    key: 'canExportData',
    label: 'Export Data & Reports',
    category: 'admin',
    categoryLabel: 'Governance & Security',
    description: 'Permits downloading bulk data exports in CSV, JSON, and Excel formats.',
    risk: 'medium'
  },
  // Storage & Files
  {
    key: 'canUploadAttachments',
    label: 'Upload Attachments',
    category: 'storage',
    categoryLabel: 'Storage & Attachments',
    description: 'Permits attaching validated documents, images, and code snippets.',
    risk: 'low'
  },
  {
    key: 'canDeleteAttachments',
    label: 'Delete Attachments',
    category: 'storage',
    categoryLabel: 'Storage & Attachments',
    description: 'Allows removing uploaded files and attachments from tasks and comments.',
    risk: 'medium'
  },
  // Collaboration
  {
    key: 'canHostMeetings',
    label: 'Host & Moderate Meetings',
    category: 'collab',
    categoryLabel: 'Team Collaboration',
    description: 'Permits scheduling, starting, and moderating live team sync meetings.',
    risk: 'low'
  },
  {
    key: 'canManageChannels',
    label: 'Manage Chat Channels',
    category: 'collab',
    categoryLabel: 'Team Collaboration',
    description: 'Allows creating, renaming, and archiving group communication channels.',
    risk: 'medium'
  }
];

const CATEGORY_ICONS: Record<string, any> = {
  task: FolderKanban,
  admin: ShieldAlert,
  storage: FileUp,
  collab: MessageSquare
};

const COLOR_OPTIONS = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Slate', value: '#64748B' }
];

export const AccessManagerView: React.FC = () => {
  const { currentUser, users, refreshUsers, isAdmin } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix' | 'inspector' | 'governance'>('roles');

  // Roles state
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [summaryStats, setSummaryStats] = useState<AccessSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryTabFilter, setCategoryTabFilter] = useState<string>('all');

  // Multi-selection state for batch updates
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);
  const [roleFormData, setRoleFormData] = useState<{
    id: string;
    name: string;
    description: string;
    color: string;
    badge: string;
    icon: string;
    defaultPrivileges: UserPrivileges;
    applyToExistingUsers: boolean;
  }>({
    id: '',
    name: '',
    description: '',
    color: '#3B82F6',
    badge: '',
    icon: 'Shield',
    defaultPrivileges: {
      canCreateTask: true,
      canEditAnyTask: false,
      canDeleteTask: false,
      canManageStatuses: false,
      canManageProjects: false,
      canManageUsers: false,
      canManageRoles: false,
      canViewAuditLogs: false,
      canManageBackups: false,
      canExportData: false,
      canUploadAttachments: true,
      canDeleteAttachments: true,
      canHostMeetings: false,
      canManageChannels: false
    },
    applyToExistingUsers: false
  });

  // Clone Privileges Modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneSourceUserId, setCloneSourceUserId] = useState<string>('');
  const [cloneTargetUserIds, setCloneTargetUserIds] = useState<string[]>([]);

  // Role Member Management Modal State
  const [manageMembersRole, setManageMembersRole] = useState<SystemRole | null>(null);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [manageMembersTab, setManageMembersTab] = useState<'current' | 'add'>('current');
  const [manageMembersSearch, setManageMembersSearch] = useState('');
  const [manageMembersDeptFilter, setManageMembersDeptFilter] = useState('ALL');
  const [selectedCandidateUserIds, setSelectedCandidateUserIds] = useState<string[]>([]);
  const [selectedCurrentMemberIds, setSelectedCurrentMemberIds] = useState<string[]>([]);
  const [applyDefaultsOnAdd, setApplyDefaultsOnAdd] = useState(true);
  const [removeFallbackRoleId, setRemoveFallbackRoleId] = useState('member');
  const [applyDefaultsOnRemove, setApplyDefaultsOnRemove] = useState(true);
  const [isSubmittingMembersAction, setIsSubmittingMembersAction] = useState(false);

  // Inspector Selected User
  const [inspectedUserId, setInspectedUserId] = useState<string>(users[0]?.id || '');

  // Fetch roles and summary
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fetchedRoles, fetchedSummary] = await Promise.all([
        api.getRoles(),
        api.getAccessSummary()
      ]);
      setRoles(fetchedRoles);
      setSummaryStats(fetchedSummary);
    } catch (err: any) {
      console.error('Failed to load Access Manager data:', err);
      setError(err.message || 'Failed to load access roles and permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Helper to find a role by ID
  const getRole = (roleId: string): SystemRole | undefined => {
    if (roleId === 'basic') return roles.find((r) => r.id === 'member');
    return roles.find((r) => r.id === roleId);
  };

  // Check if a user's privileges drift from their role defaults
  const checkPrivilegeDrift = (user: User) => {
    const role = getRole(user.role);
    if (!role) return { hasDrift: false, driftCount: 0, customGranted: 0, customRevoked: 0 };

    const roleDefaults = role.defaultPrivileges;
    const userPrivs = user.privileges || roleDefaults;

    let customGranted = 0;
    let customRevoked = 0;

    PRIVILEGE_DEFINITIONS.forEach((def) => {
      const uVal = !!userPrivs[def.key];
      const rVal = !!roleDefaults[def.key];
      if (uVal && !rVal) customGranted++;
      if (!uVal && rVal) customRevoked++;
    });

    const driftCount = customGranted + customRevoked;
    return { hasDrift: driftCount > 0, driftCount, customGranted, customRevoked };
  };

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set).sort();
  }, [users]);

  // Filtered users for Matrix
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.title && user.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        selectedRoleFilter === 'all' ||
        user.role === selectedRoleFilter ||
        (selectedRoleFilter === 'member' && user.role === 'basic');

      const matchesDept = selectedDeptFilter === 'all' || user.department === selectedDeptFilter;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedDeptFilter]);

  // Filtered privilege definitions
  const filteredPrivileges = useMemo(() => {
    return PRIVILEGE_DEFINITIONS.filter((def) => {
      const matchesCategory = categoryTabFilter === 'all' || def.category === categoryTabFilter;
      const matchesRisk = selectedRiskFilter === 'all' || def.risk === selectedRiskFilter;
      return matchesCategory && matchesRisk;
    });
  }, [categoryTabFilter, selectedRiskFilter]);

  // Handle single privilege toggle on matrix
  const handleTogglePrivilege = async (user: User, key: keyof UserPrivileges) => {
    const currentPrivs = user.privileges || getRole(user.role)?.defaultPrivileges || {};
    const newPrivs: UserPrivileges = {
      ...currentPrivs,
      [key]: !currentPrivs[key]
    } as UserPrivileges;

    // Optimistically update
    try {
      await api.updateUser(user.id, { privileges: newPrivs });
      await refreshUsers();
      const updatedSummary = await api.getAccessSummary();
      setSummaryStats(updatedSummary);
      showToast(`Updated permission "${key}" for ${user.name}`);
    } catch (err: any) {
      console.error('Failed to toggle privilege:', err);
      setError(err.message || 'Failed to update permission');
    }
  };

  // Handle user role change
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const targetRole = getRole(newRole);
      const newPrivs = targetRole ? { ...targetRole.defaultPrivileges } : undefined;

      await api.updateUser(userId, {
        role: newRole,
        privileges: newPrivs
      });
      await refreshUsers();
      await loadData();
      showToast(`Role updated to ${targetRole?.name || newRole}`);
    } catch (err: any) {
      console.error('Failed to change user role:', err);
      setError(err.message || 'Failed to change role');
    }
  };

  // Handle reset user privileges to role default
  const handleResetPrivileges = async (user: User) => {
    try {
      await api.resetUserPrivilegesToRole(user.id);
      await refreshUsers();
      await loadData();
      showToast(`Reset permissions for ${user.name} to "${user.role}" preset.`);
    } catch (err: any) {
      console.error('Failed to reset privileges:', err);
      setError(err.message || 'Failed to reset privileges');
    }
  };

  // Bulk select handlers
  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk action: assign role
  const handleBulkAssignRole = async (roleId: string) => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.batchUpdateAccess({
        userIds: selectedUserIds,
        action: 'setRole',
        role: roleId
      });
      await refreshUsers();
      await loadData();
      setSelectedUserIds([]);
      showToast(`Assigned role "${roleId}" to ${selectedUserIds.length} users.`);
    } catch (err: any) {
      console.error('Bulk role assignment failed:', err);
      setError(err.message || 'Bulk assignment failed');
    }
  };

  // Bulk action: reset to defaults
  const handleBulkResetDefaults = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.batchUpdateAccess({
        userIds: selectedUserIds,
        action: 'resetToRoleDefault'
      });
      await refreshUsers();
      await loadData();
      setSelectedUserIds([]);
      showToast(`Reset permissions to role defaults for ${selectedUserIds.length} users.`);
    } catch (err: any) {
      console.error('Bulk reset failed:', err);
      setError(err.message || 'Bulk reset failed');
    }
  };

  // Bulk action: grant privilege
  const handleBulkGrantPrivilege = async (privKey: keyof UserPrivileges) => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.batchUpdateAccess({
        userIds: selectedUserIds,
        action: 'grantPrivilege',
        privilegeKey: privKey
      });
      await refreshUsers();
      await loadData();
      showToast(`Granted "${privKey}" to ${selectedUserIds.length} users.`);
    } catch (err: any) {
      console.error('Bulk grant failed:', err);
      setError(err.message || 'Bulk grant failed');
    }
  };

  // Bulk action: revoke privilege
  const handleBulkRevokePrivilege = async (privKey: keyof UserPrivileges) => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.batchUpdateAccess({
        userIds: selectedUserIds,
        action: 'revokePrivilege',
        privilegeKey: privKey
      });
      await refreshUsers();
      await loadData();
      showToast(`Revoked "${privKey}" for ${selectedUserIds.length} users.`);
    } catch (err: any) {
      console.error('Bulk revoke failed:', err);
      setError(err.message || 'Bulk revoke failed');
    }
  };

  // Role Modal Handlers
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleFormData({
      id: '',
      name: '',
      description: '',
      color: '#3B82F6',
      badge: '',
      icon: 'Shield',
      defaultPrivileges: {
        canCreateTask: true,
        canEditAnyTask: false,
        canDeleteTask: false,
        canManageStatuses: false,
        canManageProjects: false,
        canManageUsers: false,
        canManageRoles: false,
        canViewAuditLogs: false,
        canManageBackups: false,
        canExportData: false,
        canUploadAttachments: true,
        canDeleteAttachments: true,
        canHostMeetings: false,
        canManageChannels: false
      },
      applyToExistingUsers: false
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: SystemRole) => {
    setEditingRole(role);
    setRoleFormData({
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      badge: role.badge,
      icon: role.icon || 'Shield',
      defaultPrivileges: { ...role.defaultPrivileges },
      applyToExistingUsers: false
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, {
          name: roleFormData.name,
          description: roleFormData.description,
          color: roleFormData.color,
          badge: roleFormData.badge,
          icon: roleFormData.icon,
          defaultPrivileges: roleFormData.defaultPrivileges,
          applyToExistingUsers: roleFormData.applyToExistingUsers
        });
        showToast(`Role "${roleFormData.name}" updated successfully.`);
      } else {
        await api.createRole({
          id: roleFormData.id || undefined,
          name: roleFormData.name,
          description: roleFormData.description,
          color: roleFormData.color,
          badge: roleFormData.badge,
          icon: roleFormData.icon,
          defaultPrivileges: roleFormData.defaultPrivileges
        });
        showToast(`Role "${roleFormData.name}" created successfully.`);
      }

      setIsRoleModalOpen(false);
      await loadData();
      await refreshUsers();
    } catch (err: any) {
      console.error('Failed to save role:', err);
      setError(err.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (role: SystemRole) => {
    if (role.isSystemRole && (role.id === 'admin' || role.id === 'member')) {
      setError(`Core system role "${role.name}" cannot be deleted.`);
      return;
    }

    const confirmMsg = `Are you sure you want to delete the role "${role.name}"? Any users assigned to this role will be reassigned to Standard Contributor.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.deleteRole(role.id);
      showToast(`Role "${role.name}" deleted.`);
      await loadData();
      await refreshUsers();
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      setError(err.message || 'Failed to delete role');
    }
  };

  // Manage Role Members Handlers
  const handleOpenManageMembers = (role: SystemRole, initialTab: 'current' | 'add' = 'current') => {
    setManageMembersRole(role);
    setManageMembersTab(initialTab);
    setManageMembersSearch('');
    setManageMembersDeptFilter('ALL');
    setSelectedCandidateUserIds([]);
    setSelectedCurrentMemberIds([]);
    setApplyDefaultsOnAdd(true);
    setRemoveFallbackRoleId(role.id === 'member' ? 'viewer' : 'member');
    setApplyDefaultsOnRemove(true);
    setIsManageMembersModalOpen(true);
  };

  const handleAddMembersToRole = async (targetUserIds?: string[]) => {
    if (!manageMembersRole) return;
    const idsToAdd = targetUserIds || selectedCandidateUserIds;
    if (idsToAdd.length === 0) {
      setError('Please select at least one team member to assign to this role template.');
      return;
    }

    try {
      setIsSubmittingMembersAction(true);
      const res = await api.addRoleMembers(manageMembersRole.id, idsToAdd, applyDefaultsOnAdd);
      showToast(res.message || `Assigned ${idsToAdd.length} member(s) to "${manageMembersRole.name}".`);
      setSelectedCandidateUserIds([]);
      await refreshUsers();
      await loadData();
    } catch (err: any) {
      console.error('Failed to add members to role:', err);
      setError(err.message || 'Failed to add members to role template');
    } finally {
      setIsSubmittingMembersAction(false);
    }
  };

  const handleRemoveMembersFromRole = async (targetUserIds: string[], targetFallbackRole?: string) => {
    if (!manageMembersRole) return;
    if (targetUserIds.length === 0) {
      setError('Please select at least one member to remove.');
      return;
    }

    const fallbackRole = targetFallbackRole || removeFallbackRoleId || 'member';

    try {
      setIsSubmittingMembersAction(true);
      const res = await api.removeRoleMembers(
        manageMembersRole.id,
        targetUserIds,
        fallbackRole,
        applyDefaultsOnRemove
      );
      showToast(res.message || `Removed ${targetUserIds.length} member(s) from "${manageMembersRole.name}".`);
      setSelectedCurrentMemberIds((prev) => prev.filter((id) => !targetUserIds.includes(id)));
      await refreshUsers();
      await loadData();
    } catch (err: any) {
      console.error('Failed to remove members from role:', err);
      setError(err.message || 'Failed to remove members from role');
    } finally {
      setIsSubmittingMembersAction(false);
    }
  };

  const handleSyncMemberPrivileges = async (userId: string) => {
    try {
      await api.resetUserPrivilegesToRole(userId);
      showToast('Member permissions synchronized to role default preset.');
      await refreshUsers();
      await loadData();
    } catch (err: any) {
      console.error('Failed to sync privileges:', err);
      setError(err.message || 'Failed to reset member permissions');
    }
  };

  // Clone privileges handler
  const handleClonePrivilegesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneSourceUserId || cloneTargetUserIds.length === 0) {
      setError('Please select both a source user and at least one target user.');
      return;
    }

    try {
      await api.cloneUserPrivileges(cloneSourceUserId, cloneTargetUserIds);
      showToast(`Permissions cloned to ${cloneTargetUserIds.length} user(s).`);
      setIsCloneModalOpen(false);
      setCloneSourceUserId('');
      setCloneTargetUserIds([]);
      await refreshUsers();
      await loadData();
    } catch (err: any) {
      console.error('Failed to clone privileges:', err);
      setError(err.message || 'Failed to clone privileges');
    }
  };

  // Export Matrix
  const handleExportCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Department', 'Status', ...PRIVILEGE_DEFINITIONS.map((d) => d.label)];
    const rows = users.map((u) => {
      const role = getRole(u.role);
      const privs = u.privileges || role?.defaultPrivileges || {};
      return [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        u.email,
        role?.name || u.role,
        `"${(u.department || 'General').replace(/"/g, '""')}"`,
        u.status || 'active',
        ...PRIVILEGE_DEFINITIONS.map((d) => (privs[d.key] ? 'TRUE' : 'FALSE'))
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TaskFlow_Access_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Access Matrix as CSV.');
  };

  const handleExportJSON = () => {
    const data = users.map((u) => {
      const role = getRole(u.role);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: role?.name || u.role,
        department: u.department,
        status: u.status || 'active',
        privileges: u.privileges || role?.defaultPrivileges
      };
    });

    const jsonString = JSON.stringify({ exportedAt: new Date().toISOString(), systemRoles: roles, matrix: data }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TaskFlow_Access_Matrix_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Access Matrix as JSON.');
  };

  // Currently inspected user object
  const inspectedUser = useMemo(() => {
    return users.find((u) => u.id === inspectedUserId) || users[0];
  }, [users, inspectedUserId]);

  const inspectedRole = inspectedUser ? getRole(inspectedUser.role) : undefined;
  const inspectedDrift = inspectedUser ? checkPrivilegeDrift(inspectedUser) : { hasDrift: false, driftCount: 0, customGranted: 0, customRevoked: 0 };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-[1600px] mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* Header & Overview Stats Banner */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 tracking-tight">
                Access Manager
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  RBAC & Governance
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Centralized role definition, granular permissions matrix, privilege inheritance, and security compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenCreateRole}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>

          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
            <button
              onClick={handleExportCSV}
              title="Export Permissions Matrix as CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              CSV Matrix
            </button>
            <button
              onClick={handleExportJSON}
              title="Export Full Access Configuration as JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Notifications & Alert Messages */}
      {/* ------------------------------------------------------------- */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm animate-shake">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Top Governance Metric Badges */}
      {/* ------------------------------------------------------------- */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">System Roles</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{roles.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active Role Templates</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Accounts</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{summaryStats.totalUsers}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Configured Identities</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Super Admins</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{summaryStats.adminsCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Full System Authority</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Elevated Users</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{summaryStats.elevatedUsersCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">High-Risk Permissions</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Custom Overrides</span>
              <Sliders className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">{summaryStats.customDriftUsersCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Drifted from Role Preset</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Restricted / Idle</span>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-300">{summaryStats.restrictedUsersCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Suspended or Inactive</div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Main Tabs Navigation */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-slate-800 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            System Roles & Templates
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {roles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            User Access Matrix
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'inspector'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            Effective Privilege Inspector
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'governance'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security & Governance Audit
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Access Engine Live
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: SYSTEM ROLES & TEMPLATES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'roles' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <div>
              <h2 className="text-base font-semibold text-slate-200">Role Templates & Default Privileges</h2>
              <p className="text-xs text-slate-400">
                Roles define the default baseline of permissions. Changing a role template can optionally cascade to existing members.
              </p>
            </div>
            <button
              onClick={handleOpenCreateRole}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Role Template
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role) => {
              const assignedMembers = users.filter(
                (u) => u.role === role.id || (role.id === 'member' && u.role === 'basic')
              );
              const enabledCount = Object.values(role.defaultPrivileges || {}).filter(Boolean).length;

              return (
                <div
                  key={role.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-lg relative group"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-inner"
                          style={{ backgroundColor: role.color }}
                        >
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-100 text-base">{role.name}</h3>
                          </div>
                          <span
                            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 border"
                            style={{
                              color: role.color,
                              borderColor: `${role.color}40`,
                              backgroundColor: `${role.color}15`
                            }}
                          >
                            {role.badge || role.id.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenManageMembers(role)}
                          className="px-2 py-1 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/70 border border-indigo-500/30 rounded-lg transition flex items-center gap-1.5 text-[11px] font-semibold"
                          title={`Manage members assigned to ${role.name}`}
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Members</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditRole(role)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                          title="Edit Role & Permissions Preset"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!role.isSystemRole && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Custom Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {role.description}
                    </p>

                    {/* Permissions summary */}
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-medium text-slate-400">Baseline Privileges:</span>
                        <span className="font-semibold text-indigo-400">
                          {enabledCount} of {PRIVILEGE_DEFINITIONS.length} Granted
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${(enabledCount / PRIVILEGE_DEFINITIONS.length) * 100}%`,
                            backgroundColor: role.color
                          }}
                        />
                      </div>

                      {/* Category mini badges */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {['task', 'admin', 'storage', 'collab'].map((cat) => {
                          const catPrivs = PRIVILEGE_DEFINITIONS.filter((p) => p.category === cat);
                          const grantedInCat = catPrivs.filter((p) => role.defaultPrivileges?.[p.key]).length;
                          const IconComp = CATEGORY_ICONS[cat] || Shield;

                          return (
                            <div
                              key={cat}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
                                grantedInCat > 0
                                  ? 'bg-slate-800/90 text-slate-300 border border-slate-700/60'
                                  : 'bg-slate-900/50 text-slate-600 border border-slate-800/40'
                              }`}
                            >
                              <IconComp className="w-3 h-3 opacity-70" />
                              <span className="capitalize">{cat}:</span>
                              <span className="font-bold">{grantedInCat}/{catPrivs.length}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Members preview & Interactive Actions */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenManageMembers(role)}
                      className="flex items-center gap-2 group/members hover:opacity-90 transition text-left cursor-pointer"
                      title="Click to manage assigned members"
                    >
                      <div className="flex -space-x-2 overflow-hidden">
                        {assignedMembers.slice(0, 4).map((member) => (
                          <UserAvatar
                            key={member.id}
                            user={member}
                            size="sm"
                            className="ring-2 ring-slate-900 shadow-sm"
                          />
                        ))}
                        {assignedMembers.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 ring-2 ring-slate-900">
                            +{assignedMembers.length - 4}
                          </div>
                        )}
                        {assignedMembers.length === 0 && (
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                            <UserPlus className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-300 group-hover/members:text-indigo-300 transition flex items-center gap-1">
                          {assignedMembers.length} {assignedMembers.length === 1 ? 'member' : 'members'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Click to manage</span>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenManageMembers(role, 'add')}
                        className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        title={`Add members to ${role.name}`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoleFilter(role.id);
                          setActiveTab('matrix');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition"
                        title="Filter Matrix by this Role"
                      >
                        <span>Matrix</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: INTERACTIVE ACCESS MATRIX */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Matrix Control Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users, emails, departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Roles ({users.length})</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dept filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Dept:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category / Risk Switchers */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400">Category:</span>
              <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 text-xs font-medium">
                {['all', 'task', 'admin', 'storage', 'collab'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryTabFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition ${
                      categoryTabFilter === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk Only</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Sticky Bulk Selection Bar */}
          {selectedUserIds.length > 0 && (
            <div className="bg-indigo-950/80 border border-indigo-500/40 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-slideDown">
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>{selectedUserIds.length} users selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Assign Role dropdown */}
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBulkAssignRole(e.target.value);
                  }}
                  defaultValue=""
                  className="bg-slate-800 border border-indigo-400/40 text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="" disabled>
                    Assign Role to Selected...
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      Set to {r.name}
                    </option>
                  ))}
                </select>

                {/* Reset to Role default */}
                <button
                  onClick={handleBulkResetDefaults}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Reset to Role Defaults
                </button>

                {/* Clone modal trigger */}
                <button
                  onClick={() => {
                    setCloneTargetUserIds(selectedUserIds);
                    setIsCloneModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Permissions From...
                </button>

                <button
                  onClick={() => setSelectedUserIds([])}
                  className="text-slate-400 hover:text-white px-2 py-1"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Permissions Matrix Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto max-h-[700px] relative scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse">
                {/* Table Header */}
                <thead className="bg-slate-950/95 sticky top-0 z-20 backdrop-blur-md border-b border-slate-800">
                  <tr>
                    {/* Checkbox column */}
                    <th className="p-3 w-10 text-center sticky left-0 z-30 bg-slate-950 border-r border-slate-800/80">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>

                    {/* User Identity Column */}
                    <th className="p-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[240px] sticky left-10 z-30 bg-slate-950 border-r border-slate-800/80 shadow-md">
                      Team Member & Identity
                    </th>

                    {/* Role Column */}
                    <th className="p-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[170px] border-r border-slate-800/80">
                      Assigned Role
                    </th>

                    {/* Dynamic Privilege Columns */}
                    {filteredPrivileges.map((def) => {
                      const IconComp = CATEGORY_ICONS[def.category] || Shield;
                      return (
                        <th
                          key={def.key}
                          className="p-3 text-center min-w-[130px] max-w-[150px] border-r border-slate-800/40 select-none group"
                          title={`${def.label}: ${def.description}`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                              <IconComp className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[100px]">{def.label}</span>
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                def.risk === 'high'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : def.risk === 'medium'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {def.risk}
                            </span>
                          </div>
                        </th>
                      );
                    })}

                    {/* Actions Column */}
                    <th className="p-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[130px]">
                      Governance
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={filteredPrivileges.length + 4} className="p-12 text-center text-slate-400">
                        <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-300">No matching team members found</p>
                        <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const userRole = getRole(user.role);
                      const isSelected = selectedUserIds.includes(user.id);
                      const driftInfo = checkPrivilegeDrift(user);
                      const userPrivs = user.privileges || userRole?.defaultPrivileges || {};

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-slate-800/40 transition group ${
                            isSelected ? 'bg-indigo-950/30' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="p-3 text-center sticky left-0 z-10 bg-slate-900 border-r border-slate-800/80">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectUser(user.id)}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Member Info */}
                          <td className="p-3 sticky left-10 z-10 bg-slate-900 border-r border-slate-800/80 shadow-sm">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} size="sm" showStatusIndicator />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                                  {user.name}
                                  {user.id === currentUser?.id && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {user.department || 'General'} • {user.title || 'Member'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Selector */}
                          <td className="p-3 border-r border-slate-800/80">
                            <div className="space-y-1.5">
                              <select
                                value={user.role === 'basic' ? 'member' : user.role}
                                onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700/90 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>

                              {/* Privilege Drift indicator */}
                              {driftInfo.hasDrift ? (
                                <div className="flex items-center justify-between gap-1 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                                  <span className="font-medium">
                                    {driftInfo.driftCount} Custom Override{driftInfo.driftCount > 1 ? 's' : ''}
                                  </span>
                                  <button
                                    onClick={() => handleResetPrivileges(user)}
                                    title="Reset to role preset default"
                                    className="text-purple-400 hover:text-white underline font-bold"
                                  >
                                    Reset
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 font-medium px-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  Role Default Preset
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Interactive Privilege Cells */}
                          {filteredPrivileges.map((def) => {
                            const isGranted = !!userPrivs[def.key];
                            const roleDefaultVal = !!userRole?.defaultPrivileges?.[def.key];
                            const isDriftedCell = isGranted !== roleDefaultVal;

                            return (
                              <td
                                key={def.key}
                                className={`p-2.5 text-center border-r border-slate-800/40 transition ${
                                  isDriftedCell ? 'bg-purple-950/20' : ''
                                }`}
                              >
                                <button
                                  onClick={() => handleTogglePrivilege(user, def.key)}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition-all transform active:scale-90 ${
                                    isGranted
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm'
                                      : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:bg-slate-700/60 hover:text-slate-300'
                                  } ${isDriftedCell ? 'ring-1 ring-purple-400/50' : ''}`}
                                  title={`${user.name}: ${def.label} is ${isGranted ? 'GRANTED' : 'REVOKED'}${
                                    isDriftedCell ? ' (Explicit custom override)' : ''
                                  }`}
                                >
                                  {isGranted ? (
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                  ) : (
                                    <X className="w-3.5 h-3.5 stroke-[2]" />
                                  )}
                                </button>
                              </td>
                            );
                          })}

                          {/* Actions Column */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setInspectedUserId(user.id);
                                  setActiveTab('inspector');
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                                title="Inspect Detailed Effective Privileges"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCloneSourceUserId(user.id);
                                  setIsCloneModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                                title="Copy This User's Permissions to Others"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {driftInfo.hasDrift && (
                                <button
                                  onClick={() => handleResetPrivileges(user)}
                                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                                  title="Reset to Role Defaults"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer */}
            <div className="bg-slate-950/80 p-3.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-300">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                  Granted
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" />
                  Revoked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-400 ring-1 ring-purple-400 inline-block" />
                  Custom User Override
                </span>
              </div>

              <div>
                Showing <span className="font-semibold text-slate-200">{filteredUsers.length}</span> of {users.length} team members
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: EFFECTIVE PRIVILEGE INSPECTOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'inspector' && (
        <div className="space-y-6 animate-fadeIn">
          {/* User selector bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Inspect User:</span>
              <select
                value={inspectedUserId}
                onChange={(e) => setInspectedUserId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 min-w-[260px]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()}) — {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCloneSourceUserId(inspectedUser.id);
                  setIsCloneModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                Copy Permissions to Other Users
              </button>
              {inspectedDrift.hasDrift && (
                <button
                  onClick={() => handleResetPrivileges(inspectedUser)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Role Defaults
                </button>
              )}
            </div>
          </div>

          {/* User Identity Overview Card */}
          {inspectedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left summary column */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <UserAvatar user={inspectedUser} size="2xl" showStatusIndicator />
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{inspectedUser.name}</h3>
                    <p className="text-xs text-slate-400">{inspectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                        style={{
                          color: inspectedRole?.color || '#3B82F6',
                          borderColor: `${inspectedRole?.color || '#3B82F6'}40`,
                          backgroundColor: `${inspectedRole?.color || '#3B82F6'}15`
                        }}
                      >
                        {inspectedRole?.name || inspectedUser.role}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize font-medium">
                        {inspectedUser.status || 'active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Department:</span>
                    <span className="font-semibold text-slate-200">{inspectedUser.department || 'General'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Job Title:</span>
                    <span className="font-semibold text-slate-200">{inspectedUser.title || 'Member'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Account ID:</span>
                    <span className="font-mono text-slate-400">{inspectedUser.id}</span>
                  </div>
                </div>

                {/* Drift Alert Box */}
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    inspectedDrift.hasDrift
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {inspectedDrift.hasDrift ? (
                      <>
                        <Sliders className="w-4 h-4 text-purple-400" />
                        Custom Permission Overrides Detected
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Clean Role Inheritance
                      </>
                    )}
                  </div>
                  <p>
                    {inspectedDrift.hasDrift
                      ? `This user has ${inspectedDrift.driftCount} specific override(s) diverging from the "${inspectedRole?.name}" template baseline.`
                      : `All privileges are currently governed directly by the baseline role template "${inspectedRole?.name}".`}
                  </p>
                </div>
              </div>

              {/* Right: Categorized privilege breakdown */}
              <div className="lg:col-span-2 space-y-6">
                {['task', 'admin', 'storage', 'collab'].map((category) => {
                  const catPrivs = PRIVILEGE_DEFINITIONS.filter((p) => p.category === category);
                  const IconComp = CATEGORY_ICONS[category] || Shield;
                  const catLabel = catPrivs[0]?.categoryLabel || category;
                  const userPrivs = inspectedUser.privileges || inspectedRole?.defaultPrivileges || {};

                  return (
                    <div key={category} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5 text-sm font-bold text-slate-200">
                          <IconComp className="w-4 h-4 text-indigo-400" />
                          <span>{catLabel}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {catPrivs.filter((p) => userPrivs[p.key]).length} of {catPrivs.length} Granted
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {catPrivs.map((priv) => {
                          const isGranted = !!userPrivs[priv.key];
                          const roleDefault = !!inspectedRole?.defaultPrivileges?.[priv.key];
                          const isOverride = isGranted !== roleDefault;

                          return (
                            <div
                              key={priv.key}
                              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition ${
                                isGranted
                                  ? 'bg-emerald-500/5 border-emerald-500/20'
                                  : 'bg-slate-950/40 border-slate-800/60'
                              } ${isOverride ? 'ring-1 ring-purple-400/50' : ''}`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-200 text-xs">{priv.label}</span>
                                  {isOverride && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                      OVERRIDE
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{priv.description}</p>
                                <div className="text-[10px] text-slate-500">
                                  Role Baseline: <span className="font-semibold">{roleDefault ? 'Granted' : 'Revoked'}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleTogglePrivilege(inspectedUser, priv.key)}
                                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-95 ${
                                  isGranted
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}
                                title="Toggle permission"
                              >
                                {isGranted ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SECURITY & GOVERNANCE AUDIT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'governance' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Security posture header */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Security & Role Governance Overview
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time privilege distribution analysis, high-risk authority audit, and compliance tracking.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Download className="w-4 h-4" />
                Export Audit Report (CSV)
              </button>
            </div>
          </div>

          {/* Risk Level Distribution Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* High Risk Privileges */}
            <div className="bg-slate-900/70 border border-rose-500/20 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>High-Risk Authority</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                  {PRIVILEGE_DEFINITIONS.filter((p) => p.risk === 'high').length} Permissions
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grants critical operations including task deletion, user account management, disaster recovery backups, and role reconfigurations.
              </p>

              <div className="space-y-2 pt-2">
                {PRIVILEGE_DEFINITIONS.filter((p) => p.risk === 'high').map((priv) => {
                  const authorizedUsersCount = users.filter((u) => {
                    const pSet = u.privileges || getRole(u.role)?.defaultPrivileges;
                    return !!pSet?.[priv.key];
                  }).length;

                  return (
                    <div key={priv.key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                      <span className="font-semibold text-slate-200">{priv.label}</span>
                      <span className="font-bold text-rose-400">{authorizedUsersCount} Authorized</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Medium Risk Privileges */}
            <div className="bg-slate-900/70 border border-amber-500/20 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sliders className="w-4 h-4" />
                  <span>Medium-Risk Authority</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {PRIVILEGE_DEFINITIONS.filter((p) => p.risk === 'medium').length} Permissions
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Controls workflow columns, cross-assignee task edits, audit trail logs, data exports, and chat channel configurations.
              </p>

              <div className="space-y-2 pt-2">
                {PRIVILEGE_DEFINITIONS.filter((p) => p.risk === 'medium').map((priv) => {
                  const authorizedUsersCount = users.filter((u) => {
                    const pSet = u.privileges || getRole(u.role)?.defaultPrivileges;
                    return !!pSet?.[priv.key];
                  }).length;

                  return (
                    <div key={priv.key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                      <span className="font-semibold text-slate-200">{priv.label}</span>
                      <span className="font-bold text-amber-400">{authorizedUsersCount} Authorized</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Distribution Card */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>Active Role Distribution</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{roles.length} Roles</span>
              </div>
              <p className="text-xs text-slate-400">
                Distribution of identities across system roles and custom template definitions.
              </p>

              <div className="space-y-2.5 pt-2">
                {roles.map((r) => {
                  const count = users.filter((u) => u.role === r.id || (r.id === 'member' && u.role === 'basic')).length;
                  const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0;

                  return (
                    <div key={r.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-200">{r.name}</span>
                        <span className="text-slate-400">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: r.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT SYSTEM ROLE */}
      {/* ------------------------------------------------------------- */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-inner"
                  style={{ backgroundColor: roleFormData.color }}
                >
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New System Role'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure role attributes, badge styling, and default baseline privileges.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveRole} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Role Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Architect, QA Specialist"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. ARCHITECT, LEAD, AUDIT"
                    value={roleFormData.badge}
                    onChange={(e) => setRoleFormData({ ...roleFormData, badge: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the scope, authority, and responsibilities for this role..."
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Role Color Accent</label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setRoleFormData({ ...roleFormData, color: c.value })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        roleFormData.color === c.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {roleFormData.color === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privileges Matrix Checklist */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Baseline Privileges Granted
                  </h4>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allTrue = PRIVILEGE_DEFINITIONS.reduce((acc, def) => {
                          acc[def.key] = true;
                          return acc;
                        }, {} as any);
                        setRoleFormData({ ...roleFormData, defaultPrivileges: allTrue });
                      }}
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold text-[11px]"
                    >
                      Grant All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allFalse = PRIVILEGE_DEFINITIONS.reduce((acc, def) => {
                          acc[def.key] = false;
                          return acc;
                        }, {} as any);
                        setRoleFormData({ ...roleFormData, defaultPrivileges: allFalse });
                      }}
                      className="text-slate-400 hover:text-slate-300 underline font-semibold text-[11px]"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                {['task', 'admin', 'storage', 'collab'].map((category) => {
                  const catPrivs = PRIVILEGE_DEFINITIONS.filter((p) => p.category === category);
                  const IconComp = CATEGORY_ICONS[category] || Shield;
                  const catLabel = catPrivs[0]?.categoryLabel || category;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-300 font-bold text-xs pt-1">
                        <IconComp className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{catLabel}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catPrivs.map((priv) => {
                          const isChecked = !!roleFormData.defaultPrivileges[priv.key];

                          return (
                            <label
                              key={priv.key}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                                  : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  setRoleFormData({
                                    ...roleFormData,
                                    defaultPrivileges: {
                                      ...roleFormData.defaultPrivileges,
                                      [priv.key]: e.target.checked
                                    }
                                  });
                                }}
                                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <div className="font-semibold text-slate-200 text-xs">{priv.label}</div>
                                <div className="text-[10px] text-slate-400 line-clamp-1">{priv.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cascade to existing users checkbox */}
              {editingRole && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleFormData.applyToExistingUsers}
                      onChange={(e) => setRoleFormData({ ...roleFormData, applyToExistingUsers: e.target.checked })}
                      className="mt-0.5 rounded border-amber-600 text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <div className="font-bold text-amber-300 text-xs">Cascade Changes to Existing Members</div>
                      <div className="text-[11px] text-amber-400/80">
                        Overwrite custom privileges for all users currently assigned to this role with this updated preset.
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                {editingRole ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoleModalOpen(false);
                      handleOpenManageMembers(editingRole);
                    }}
                    className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Manage Assigned Members</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    {editingRole ? 'Save Changes' : 'Create Role'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: MANAGE ROLE TEMPLATE MEMBERS */}
      {/* ------------------------------------------------------------- */}
      {isManageMembersModalOpen && manageMembersRole && (() => {
        const currentMembers = users.filter(
          (u) => u.role === manageMembersRole.id || (manageMembersRole.id === 'member' && u.role === 'basic')
        );
        const candidateMembers = users.filter(
          (u) => u.role !== manageMembersRole.id && !(manageMembersRole.id === 'member' && u.role === 'basic')
        );

        const filteredCurrentMembers = currentMembers.filter((u) => {
          const q = manageMembersSearch.toLowerCase();
          return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department && u.department.toLowerCase().includes(q)) ||
            (u.title && u.title.toLowerCase().includes(q))
          );
        });

        const filteredCandidates = candidateMembers.filter((u) => {
          const q = manageMembersSearch.toLowerCase();
          const matchesSearch =
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department && u.department.toLowerCase().includes(q)) ||
            (u.title && u.title.toLowerCase().includes(q));
          const matchesDept = manageMembersDeptFilter === 'ALL' || u.department === manageMembersDeptFilter;
          return matchesSearch && matchesDept;
        });

        const allCandidatesSelected =
          filteredCandidates.length > 0 &&
          filteredCandidates.every((u) => selectedCandidateUserIds.includes(u.id));

        const allCurrentSelected =
          filteredCurrentMembers.length > 0 &&
          filteredCurrentMembers.every((u) => selectedCurrentMemberIds.includes(u.id));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950">
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-inner shrink-0 mt-0.5"
                    style={{ backgroundColor: manageMembersRole.color }}
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-100 text-lg">{manageMembersRole.name}</h3>
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                        style={{
                          color: manageMembersRole.color,
                          borderColor: `${manageMembersRole.color}40`,
                          backgroundColor: `${manageMembersRole.color}15`
                        }}
                      >
                        {manageMembersRole.badge || manageMembersRole.id.toUpperCase()}
                      </span>
                      {manageMembersRole.isSystemRole && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium border border-slate-700">
                          System Core
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                      {manageMembersRole.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsManageMembersModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-tab Navigation */}
              <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setManageMembersTab('current');
                    setManageMembersSearch('');
                  }}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                    manageMembersTab === 'current'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Assigned Members</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      manageMembersTab === 'current'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentMembers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setManageMembersTab('add');
                    setManageMembersSearch('');
                  }}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                    manageMembersTab === 'add'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New Members</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      manageMembersTab === 'add'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {candidateMembers.length}
                  </span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {/* Search & Filter bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={
                        manageMembersTab === 'current'
                          ? 'Search assigned members by name, email, department...'
                          : 'Search candidate members to assign...'
                      }
                      value={manageMembersSearch}
                      onChange={(e) => setManageMembersSearch(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                    {manageMembersSearch && (
                      <button
                        type="button"
                        onClick={() => setManageMembersSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {manageMembersTab === 'add' && departments.length > 0 && (
                    <div className="w-full sm:w-auto">
                      <select
                        value={manageMembersDeptFilter}
                        onChange={(e) => setManageMembersDeptFilter(e.target.value)}
                        className="w-full sm:w-auto bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ALL">All Departments</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* TAB CONTENT: CURRENT MEMBERS */}
                {manageMembersTab === 'current' && (
                  <div className="space-y-3">
                    {/* Batch Removal Control Bar (if selections exist) */}
                    {filteredCurrentMembers.length > 0 && (
                      <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                        <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allCurrentSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCurrentMemberIds((prev) =>
                                  Array.from(new Set([...prev, ...filteredCurrentMembers.map((u) => u.id)]))
                                );
                              } else {
                                setSelectedCurrentMemberIds((prev) =>
                                  prev.filter((id) => !filteredCurrentMembers.some((u) => u.id === id))
                                );
                              }
                            }}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>
                            Select All Filtered ({filteredCurrentMembers.length})
                          </span>
                        </label>

                        {selectedCurrentMemberIds.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <span className="text-[11px] text-slate-400">Reassign to:</span>
                              <select
                                value={removeFallbackRoleId}
                                onChange={(e) => setRemoveFallbackRoleId(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                              >
                                {roles
                                  .filter((r) => r.id !== manageMembersRole.id)
                                  .map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              disabled={isSubmittingMembersAction}
                              onClick={() => handleRemoveMembersFromRole(selectedCurrentMemberIds)}
                              className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>
                                Remove Selected ({selectedCurrentMemberIds.length})
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Member Rows */}
                    {filteredCurrentMembers.length > 0 ? (
                      <div className="divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                        {filteredCurrentMembers.map((member) => {
                          const drift = checkPrivilegeDrift(member);
                          const isSelected = selectedCurrentMemberIds.includes(member.id);

                          return (
                            <div
                              key={member.id}
                              className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition ${
                                isSelected ? 'bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCurrentMemberIds((prev) => [...prev, member.id]);
                                    } else {
                                      setSelectedCurrentMemberIds((prev) =>
                                        prev.filter((id) => id !== member.id)
                                      );
                                    }
                                  }}
                                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                />
                                <UserAvatar user={member} size="sm" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-100 text-xs truncate">
                                      {member.name}
                                    </span>
                                    {member.id === currentUser?.id && (
                                      <span className="text-[10px] bg-slate-800 text-indigo-400 px-1.5 py-0.2 rounded font-bold">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                                    <span>{member.email}</span>
                                    {member.department && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-500">{member.department}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {/* Privilege Status */}
                                {drift.hasDrift ? (
                                  <div className="hidden sm:flex items-center gap-1.5">
                                    <span
                                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                                      title={`${drift.customGranted} extra granted, ${drift.customRevoked} revoked`}
                                    >
                                      <Sliders className="w-3 h-3 text-amber-400" />
                                      <span>Custom Overrides ({drift.driftCount})</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSyncMemberPrivileges(member.id)}
                                      className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-medium cursor-pointer"
                                      title="Reset this member's custom privileges to the role default preset"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                ) : (
                                  <span className="hidden sm:flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    <span>Preset Synced</span>
                                  </span>
                                )}

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  disabled={isSubmittingMembersAction}
                                  onClick={() => handleRemoveMembersFromRole([member.id])}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                                  title={`Remove ${member.name} from ${manageMembersRole.name}`}
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  <span className="hidden md:inline">Remove</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                        <Users className="w-10 h-10 text-slate-600 mx-auto" />
                        <div>
                          <div className="text-sm font-bold text-slate-200">
                            {currentMembers.length === 0
                              ? `No members assigned to ${manageMembersRole.name}`
                              : 'No matching assigned members found'}
                          </div>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                            {currentMembers.length === 0
                              ? `Add team members to this role template to grant them the "${manageMembersRole.name}" baseline privileges.`
                              : 'Try adjusting your search query.'}
                          </p>
                        </div>
                        {currentMembers.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setManageMembersTab('add')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Add Members Now</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: ADD NEW MEMBERS */}
                {manageMembersTab === 'add' && (
                  <div className="space-y-3">
                    {/* Role baseline privileges checkbox */}
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applyDefaultsOnAdd}
                          onChange={(e) => setApplyDefaultsOnAdd(e.target.checked)}
                          className="mt-0.5 rounded border-indigo-500 text-indigo-600 focus:ring-indigo-400"
                        />
                        <div>
                          <div className="font-bold text-indigo-300">
                            Apply "{manageMembersRole.name}" Default Privileges
                          </div>
                          <div className="text-[11px] text-indigo-300/80 mt-0.5">
                            Automatically updates assigned members' permissions matrix to match this role template preset.
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Batch Selection Bar */}
                    {filteredCandidates.length > 0 && (
                      <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allCandidatesSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCandidateUserIds((prev) =>
                                  Array.from(new Set([...prev, ...filteredCandidates.map((u) => u.id)]))
                                );
                              } else {
                                setSelectedCandidateUserIds((prev) =>
                                  prev.filter((id) => !filteredCandidates.some((u) => u.id === id))
                                );
                              }
                            }}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>
                            Select All Candidates ({filteredCandidates.length})
                          </span>
                        </label>

                        {selectedCandidateUserIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedCandidateUserIds([])}
                            className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                    )}

                    {/* Candidates List */}
                    {filteredCandidates.length > 0 ? (
                      <div className="divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                        {filteredCandidates.map((candidate) => {
                          const candidateRole = getRole(candidate.role);
                          const isSelected = selectedCandidateUserIds.includes(candidate.id);

                          return (
                            <div
                              key={candidate.id}
                              className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition ${
                                isSelected ? 'bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCandidateUserIds((prev) => [...prev, candidate.id]);
                                    } else {
                                      setSelectedCandidateUserIds((prev) =>
                                        prev.filter((id) => id !== candidate.id)
                                      );
                                    }
                                  }}
                                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                />
                                <UserAvatar user={candidate} size="sm" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-100 text-xs truncate">
                                      {candidate.name}
                                    </span>
                                    {candidate.id === currentUser?.id && (
                                      <span className="text-[10px] bg-slate-800 text-indigo-400 px-1.5 py-0.2 rounded font-bold">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                                    <span>{candidate.email}</span>
                                    {candidate.department && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-500">{candidate.department}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {/* Current Role Pill */}
                                <span
                                  className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                  style={{
                                    color: candidateRole?.color || '#94a3b8',
                                    borderColor: `${candidateRole?.color || '#94a3b8'}40`,
                                    backgroundColor: `${candidateRole?.color || '#94a3b8'}15`
                                  }}
                                >
                                  Current: {candidateRole?.name || candidate.role}
                                </span>

                                {/* Quick Assign Button */}
                                <button
                                  type="button"
                                  disabled={isSubmittingMembersAction}
                                  onClick={() => handleAddMembersToRole([candidate.id])}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
                                  title={`Assign ${candidate.name} to ${manageMembersRole.name}`}
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Assign</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                        <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-sm font-bold text-slate-200">
                          {candidateMembers.length === 0
                            ? `All workspace members are assigned to ${manageMembersRole.name}`
                            : 'No matching candidate members found'}
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {candidateMembers.length === 0
                            ? 'Every user in the system is currently a member of this role template.'
                            : 'Try adjusting your search filter or department selector.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {manageMembersTab === 'add' ? (
                    <span className="font-medium">
                      {selectedCandidateUserIds.length} candidate(s) selected
                    </span>
                  ) : (
                    <span className="font-medium">
                      {selectedCurrentMemberIds.length} member(s) selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsManageMembersModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Done
                  </button>

                  {manageMembersTab === 'add' && (
                    <button
                      type="button"
                      disabled={selectedCandidateUserIds.length === 0 || isSubmittingMembersAction}
                      onClick={() => handleAddMembersToRole()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>
                        Assign {selectedCandidateUserIds.length > 0 ? `(${selectedCandidateUserIds.length})` : ''} to {manageMembersRole.name}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CLONE PRIVILEGES */}
      {/* ------------------------------------------------------------- */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Replicate Permission Configuration</h3>
                  <p className="text-xs text-slate-400">Copy the full privilege matrix from one user to others.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClonePrivilegesSubmit} className="p-6 space-y-5 text-xs">
              {/* Source User */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Source Member (Copy From) *</label>
                <select
                  value={cloneSourceUserId}
                  onChange={(e) => setCloneSourceUserId(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>
                    Select source user...
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()}) — {u.department || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Users */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Target Members (Apply To) * ({cloneTargetUserIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  {users
                    .filter((u) => u.id !== cloneSourceUserId)
                    .map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition select-none"
                      >
                        <input
                          type="checkbox"
                          checked={cloneTargetUserIds.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCloneTargetUserIds((prev) => [...prev, u.id]);
                            } else {
                              setCloneTargetUserIds((prev) => prev.filter((id) => id !== u.id));
                            }
                          }}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <UserAvatar user={u} size="xs" />
                        <span className="font-medium text-slate-200">{u.name}</span>
                        <span className="text-[10px] text-slate-500">({u.role})</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  Apply Replicated Privileges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
