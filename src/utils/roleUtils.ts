import { SystemRole, UserPrivileges, UserRole } from '../types';
import {
  Shield,
  Briefcase,
  Sparkles,
  User as UserIcon,
  FileCheck,
  Eye,
  Crown,
  KeyRound,
  Lock,
  Layers
} from 'lucide-react';

export const ADMIN_DEFAULT_PRIVILEGES: UserPrivileges = {
  canCreateTask: true,
  canEditAnyTask: true,
  canDeleteTask: true,
  canManageStatuses: true,
  canManageUsers: true,
  canManageRoles: true,
  canManageProjects: true,
  canUploadAttachments: true,
  canDeleteAttachments: true,
  canViewAuditLogs: true,
  canManageBackups: true,
  canExportData: true,
  canHostMeetings: true,
  canManageChannels: true
};

export const BASIC_DEFAULT_PRIVILEGES: UserPrivileges = {
  canCreateTask: true,
  canEditAnyTask: false,
  canDeleteTask: false,
  canManageStatuses: false,
  canManageUsers: false,
  canManageRoles: false,
  canManageProjects: false,
  canUploadAttachments: true,
  canDeleteAttachments: true,
  canViewAuditLogs: false,
  canManageBackups: false,
  canExportData: false,
  canHostMeetings: false,
  canManageChannels: false
};

export const SYSTEM_ROLE_TEMPLATES: SystemRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Unrestricted enterprise control over all workspace configurations, access governance, users, workflows, and backups.',
    color: '#10B981',
    badge: 'FULL ADMIN',
    icon: 'Shield',
    isSystemRole: true,
    isEditable: false,
    defaultPrivileges: { ...ADMIN_DEFAULT_PRIVILEGES }
  },
  {
    id: 'manager',
    name: 'Project & Operations Manager',
    description: 'Project governance, workflow status design, member task administration, and team reporting.',
    color: '#3B82F6',
    badge: 'OPERATIONS',
    icon: 'Briefcase',
    isSystemRole: true,
    isEditable: true,
    defaultPrivileges: {
      canCreateTask: true,
      canEditAnyTask: true,
      canDeleteTask: true,
      canManageStatuses: true,
      canManageUsers: false,
      canManageRoles: false,
      canManageProjects: true,
      canUploadAttachments: true,
      canDeleteAttachments: true,
      canViewAuditLogs: true,
      canManageBackups: false,
      canExportData: true,
      canHostMeetings: true,
      canManageChannels: true
    }
  },
  {
    id: 'lead',
    name: 'Team Lead / Tech Specialist',
    description: 'Senior contributor with elevated workflow authority, cross-task editing, and meeting moderation.',
    color: '#8B5CF6',
    badge: 'TECH LEAD',
    icon: 'Sparkles',
    isSystemRole: true,
    isEditable: true,
    defaultPrivileges: {
      canCreateTask: true,
      canEditAnyTask: true,
      canDeleteTask: false,
      canManageStatuses: true,
      canManageUsers: false,
      canManageRoles: false,
      canManageProjects: false,
      canUploadAttachments: true,
      canDeleteAttachments: true,
      canViewAuditLogs: true,
      canManageBackups: false,
      canExportData: true,
      canHostMeetings: true,
      canManageChannels: false
    }
  },
  {
    id: 'member',
    name: 'Standard Contributor',
    description: 'Core team member creating tasks, updating assigned work items, uploading files, and participating in chats.',
    color: '#F59E0B',
    badge: 'CONTRIBUTOR',
    icon: 'User',
    isSystemRole: true,
    isEditable: true,
    defaultPrivileges: { ...BASIC_DEFAULT_PRIVILEGES }
  },
  {
    id: 'auditor',
    name: 'Security & Compliance Auditor',
    description: 'Specialized read-only access for compliance review, security inspection, audit log monitoring, and reporting.',
    color: '#06B6D4',
    badge: 'SECURITY AUDIT',
    icon: 'FileCheck',
    isSystemRole: true,
    isEditable: true,
    defaultPrivileges: {
      canCreateTask: false,
      canEditAnyTask: false,
      canDeleteTask: false,
      canManageStatuses: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageProjects: false,
      canUploadAttachments: false,
      canDeleteAttachments: false,
      canViewAuditLogs: true,
      canManageBackups: false,
      canExportData: true,
      canHostMeetings: false,
      canManageChannels: false
    }
  },
  {
    id: 'viewer',
    name: 'Guest / External Stakeholder',
    description: 'Restricted read-only access to view task status and boards without modification or deletion capabilities.',
    color: '#64748B',
    badge: 'EXTERNAL GUEST',
    icon: 'Eye',
    isSystemRole: true,
    isEditable: true,
    defaultPrivileges: {
      canCreateTask: false,
      canEditAnyTask: false,
      canDeleteTask: false,
      canManageStatuses: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageProjects: false,
      canUploadAttachments: false,
      canDeleteAttachments: false,
      canViewAuditLogs: false,
      canManageBackups: false,
      canExportData: false,
      canHostMeetings: false,
      canManageChannels: false
    }
  }
];

export const getRoleTemplate = (roleId?: string, customRoles: SystemRole[] = []): SystemRole => {
  const normalizedId = roleId === 'basic' ? 'member' : roleId;
  const found = customRoles.find((r) => r.id === normalizedId) ||
                SYSTEM_ROLE_TEMPLATES.find((r) => r.id === normalizedId);
  if (found) return found;

  return {
    id: roleId || 'member',
    name: roleId ? roleId.charAt(0).toUpperCase() + roleId.slice(1) : 'Standard Contributor',
    description: 'Assigned custom role template.',
    color: '#6366F1',
    badge: (roleId || 'CUSTOM').toUpperCase(),
    icon: 'User',
    isSystemRole: false,
    isEditable: true,
    defaultPrivileges: { ...BASIC_DEFAULT_PRIVILEGES }
  };
};

export const getRoleIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'Shield':
      return Shield;
    case 'Briefcase':
      return Briefcase;
    case 'Sparkles':
      return Sparkles;
    case 'User':
      return UserIcon;
    case 'FileCheck':
      return FileCheck;
    case 'Eye':
      return Eye;
    case 'Crown':
      return Crown;
    case 'KeyRound':
      return KeyRound;
    case 'Lock':
      return Lock;
    default:
      return Layers;
  }
};
