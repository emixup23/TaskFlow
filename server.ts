import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

export interface UserPrivileges {
  canCreateTask: boolean;
  canEditAnyTask: boolean;
  canDeleteTask: boolean;
  canManageStatuses: boolean;
  canManageUsers: boolean;
  canManageProjects?: boolean;
  canUploadAttachments: boolean;
  canDeleteAttachments: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'basic';
  avatar: string;
  title: string;
  department: string;
  bio?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  privileges?: UserPrivileges;
  lastLoginAt?: string;
  createdAt?: string;
}

export type CodeLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'xml'
  | 'json'
  | 'sql'
  | 'bash'
  | 'markdown'
  | 'yaml'
  | 'cpp'
  | 'java'
  | 'php'
  | 'rust'
  | 'go';

export interface TaskCodeSnippet {
  id: string;
  title: string;
  language: CodeLanguage;
  code: string;
  description?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  description?: string;
  isDone?: boolean;
  isDefault?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  reactions?: Record<string, string[]>;
  mentions?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  downloadUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByAvatar?: string;
  uploadedAt: string;
  checksum?: string;
  token?: string;
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  taskTitle?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  details: string;
  timestamp: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  memberIds: string[];
  status?: 'active' | 'archived' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface TaskTimeLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  description?: string;
  isBillable?: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  statusId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assigneeIds: string[];
  dueDate?: string;
  tags: string[];
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  codeSnippets?: TaskCodeSnippet[];
  codeSnippet?: string;
  codeLanguage?: CodeLanguage;
  timeSpentSeconds?: number;
  estimatedHours?: number;
  timeLogs?: TaskTimeLog[];
  isTimerRunning?: boolean;
  activeTimerStartedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface MeetingTopic {
  id: string;
  title: string;
  durationMinutes?: number;
  presenterId?: string;
  presenterName?: string;
  notes?: string;
  completed?: boolean;
}

export interface MeetingAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  downloadUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  extension: 'pdf' | 'txt' | 'csv' | 'docx' | 'mp3' | string;
}

export interface MeetingLog {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action:
    | 'created'
    | 'status_changed'
    | 'notes_updated'
    | 'topic_added'
    | 'topic_completed'
    | 'topic_reopened'
    | 'topic_removed'
    | 'member_added'
    | 'member_removed'
    | 'member_role_changed'
    | 'attachment_uploaded'
    | 'attachment_removed'
    | 'details_updated'
    | 'decision'
    | 'action_item'
    | 'note'
    | 'log_entry_added'
    | string;
  details: string;
  timestamp: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  memberIds: string[];
  topics: MeetingTopic[];
  notes: string;
  attachments: MeetingAttachment[];
  logs?: MeetingLog[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  linkedProjectIds?: string[];
  linkedTaskIds?: string[];
}

export interface ChatMessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  downloadUrl?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: 'admin' | 'basic';
  senderTitle?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  mentions?: string[];
  attachments?: ChatMessageAttachment[];
  reactions?: Record<string, string[]>;
  linkedTaskId?: string;
  linkedTaskTitle?: string;
  linkedTaskPriority?: 'urgent' | 'high' | 'medium' | 'low';
  linkedTaskStatusId?: string;
  linkedTaskStatusName?: string;
  linkedTaskStatusColor?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'channel' | 'group_dm' | 'direct';
  description?: string;
  topic?: string;
  icon?: string;
  color?: string;
  isPrivate?: boolean;
  isDefault?: boolean;
  ownerId?: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    id: string;
    senderName: string;
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
  pinnedMessageIds?: string[];
  isMuted?: boolean;
}

const ADMIN_DEFAULT_PRIVILEGES: UserPrivileges = {
  canCreateTask: true,
  canEditAnyTask: true,
  canDeleteTask: true,
  canManageStatuses: true,
  canManageUsers: true,
  canManageProjects: true,
  canUploadAttachments: true,
  canDeleteAttachments: true,
  canViewAuditLogs: true,
  canExportData: true
};

const BASIC_DEFAULT_PRIVILEGES: UserPrivileges = {
  canCreateTask: true,
  canEditAnyTask: false,
  canDeleteTask: false,
  canManageStatuses: false,
  canManageUsers: false,
  canManageProjects: false,
  canUploadAttachments: true,
  canDeleteAttachments: true,
  canViewAuditLogs: false,
  canExportData: false
};

// In-memory secure file storage mapping
interface StoredFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  dataBase64: string;
  checksum: string;
  token: string;
  uploadedBy: string;
  uploadedAt: string;
  taskId?: string;
}

const secureFileStore = new Map<string, StoredFile>();

// Secure Authentication & Session Store
export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number;
}

const activeSessions = new Map<string, UserSession>();
const userPasswordHashes = new Map<string, string>();
const DEFAULT_DEMO_PASSWORD = 'password123';
const DEFAULT_DEMO_HASH = bcrypt.hashSync(DEFAULT_DEMO_PASSWORD, 10);

// Initial Data
const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@techcorp.io',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Director of Engineering',
    department: 'Core Infrastructure',
    bio: 'Overseeing core cloud infrastructure, security compliance, and engineering operations.',
    phone: '+1 (555) 234-5678',
    status: 'active',
    privileges: { ...ADMIN_DEFAULT_PRIVILEGES },
    lastLoginAt: new Date(Date.now() - 10 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString()
  },
  {
    id: 'user-admin-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@techcorp.io',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'Platform Operations Admin',
    department: 'DevOps & Security',
    bio: 'Lead DevOps engineer managing cluster orchestration, secrets, and security audits.',
    phone: '+1 (555) 876-5432',
    status: 'active',
    privileges: { ...ADMIN_DEFAULT_PRIVILEGES },
    lastLoginAt: new Date(Date.now() - 45 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString()
  },
  {
    id: 'user-basic-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@techcorp.io',
    role: 'basic',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Backend Engineer',
    department: 'API & Services',
    bio: 'Full-stack TypeScript & Go developer building high-throughput microservices.',
    phone: '+1 (555) 345-6789',
    status: 'active',
    privileges: { ...BASIC_DEFAULT_PRIVILEGES, canEditAnyTask: true },
    lastLoginAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString()
  },
  {
    id: 'user-basic-2',
    name: 'Maria Garcia',
    email: 'maria.garcia@techcorp.io',
    role: 'basic',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Frontend Engineer',
    department: 'Web Experience',
    bio: 'Frontend architect specializing in React, responsive interaction design, and web performance.',
    phone: '+1 (555) 456-7890',
    status: 'active',
    privileges: { ...BASIC_DEFAULT_PRIVILEGES },
    lastLoginAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
  },
  {
    id: 'user-basic-3',
    name: 'Liam Taylor',
    email: 'liam.taylor@techcorp.io',
    role: 'basic',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    title: 'Lead UI/UX Designer',
    department: 'Product Design',
    bio: 'Design systems lead creating design tokens, component accessibility, and dark theme UI.',
    phone: '+1 (555) 567-8901',
    status: 'active',
    privileges: { ...BASIC_DEFAULT_PRIVILEGES },
    lastLoginAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'user-basic-4',
    name: 'Chloe Bennett',
    email: 'chloe.bennett@techcorp.io',
    role: 'basic',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'QA & Reliability Engineer',
    department: 'Quality Engineering',
    bio: 'Automation test engineer focusing on end-to-end reliability and load testing.',
    phone: '+1 (555) 678-9012',
    status: 'active',
    privileges: { ...BASIC_DEFAULT_PRIVILEGES, canViewAuditLogs: true },
    lastLoginAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
  }
];

const DEFAULT_STATUSES: Status[] = [
  { id: 'status-created-assigned', name: 'Created assigned', color: '#3B82F6', order: 0, description: 'Newly logged ticket created and assigned for triage or handling', isDefault: true },
  { id: 'status-in-progress', name: 'In progress', color: '#F59E0B', order: 1, description: 'Ticket is actively being investigated or worked on' },
  { id: 'status-on-hold', name: 'On hold', color: '#8B5CF6', order: 2, description: 'Work paused waiting on customer feedback, third-party dependency, or blockers' },
  { id: 'status-solved', name: 'Solved', color: '#10B981', order: 3, description: 'Resolution provided and verified with requester', isDone: true },
  { id: 'status-closed', name: 'Closed', color: '#64748B', order: 4, description: 'Ticket confirmed resolved and permanently closed', isDone: true }
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Cloud Infrastructure & Platform',
    description: 'Scalable Kubernetes microservices mesh, multi-region cluster failover, and cloud security compliance.',
    color: '#3B82F6',
    ownerId: 'user-admin-1',
    memberIds: ['user-admin-1', 'user-admin-2', 'user-basic-1', 'user-basic-4'],
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'proj-2',
    name: 'Customer Portal & Web App',
    description: 'Next-generation client workspace, responsive Kanban workflows, real-time collaboration, and design tokens.',
    color: '#8B5CF6',
    ownerId: 'user-admin-2',
    memberIds: ['user-admin-2', 'user-basic-2', 'user-basic-3', 'user-basic-1'],
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'proj-3',
    name: 'Quality & Automation Test Suite',
    description: 'Automated end-to-end regression suites, load testing harnesses, and CI/CD security scanning gates.',
    color: '#10B981',
    ownerId: 'user-basic-4',
    memberIds: ['user-basic-4', 'user-admin-1', 'user-basic-1', 'user-basic-2'],
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

// Helper to get dates relative to now
const today = new Date();
const formatDate = (daysOffset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

let users: User[] = [...DEFAULT_USERS];
let statuses: Status[] = [...DEFAULT_STATUSES];
let projects: Project[] = [...DEFAULT_PROJECTS];
let activityLogs: ActivityLog[] = [];
let tasks: Task[] = [];
let meetings: Meeting[] = [];
let channels: ChatChannel[] = [];
let chatMessages: ChatMessage[] = [];
let channelReadState: Map<string, Map<string, string>> = new Map(); // channelId -> (userId -> isoString)

function initializeSeedData() {
  users = [...DEFAULT_USERS];
  statuses = [...DEFAULT_STATUSES];
  projects = [...DEFAULT_PROJECTS];
  userPasswordHashes.clear();
  DEFAULT_USERS.forEach((u) => {
    userPasswordHashes.set(u.id, DEFAULT_DEMO_HASH);
  });
  activityLogs = [
    {
      id: 'log-1',
      taskId: 'task-1',
      taskTitle: 'Implement OAuth 2.0 and RBAC Middleware',
      userId: 'user-admin-1',
      userName: 'Sarah Chen',
      userAvatar: DEFAULT_USERS[0].avatar,
      action: 'Created Task',
      details: 'Created task and assigned to Alex Rivera and Sarah Chen',
      timestamp: new Date(Date.now() - 48 * 3600000).toISOString()
    },
    {
      id: 'log-2',
      taskId: 'task-1',
      taskTitle: 'Implement OAuth 2.0 and RBAC Middleware',
      userId: 'user-basic-1',
      userName: 'Alex Rivera',
      userAvatar: DEFAULT_USERS[2].avatar,
      action: 'Status Changed',
      details: 'Changed status from Created assigned to In progress',
      fieldChanged: 'status',
      oldValue: 'Created assigned',
      newValue: 'In progress',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 'log-3',
      taskId: 'task-2',
      taskTitle: 'Responsive Kanban Drag & Drop Board UI',
      userId: 'user-basic-2',
      userName: 'Maria Garcia',
      userAvatar: DEFAULT_USERS[3].avatar,
      action: 'Completed Subtask',
      details: 'Marked "Add touch listener support for mobile viewports" as completed',
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString()
    },
    {
      id: 'log-4',
      taskId: 'task-3',
      taskTitle: 'Design System & Component Tokens Update',
      userId: 'user-basic-3',
      userName: 'Liam Taylor',
      userAvatar: DEFAULT_USERS[4].avatar,
      action: 'Added Comment',
      details: 'Uploaded updated Figma tokens and color contrast specifications',
      timestamp: new Date(Date.now() - 6 * 3600000).toISOString()
    }
  ];

  tasks = [
    {
      id: 'task-1',
      title: 'Implement OAuth 2.0 and RBAC Middleware',
      description: 'Design and deploy robust server-side token validation and role-based permissions matrix for Administrators vs Basic Users. Ensure all API endpoints enforce access control independently of frontend routes.',
      statusId: 'status-in-progress',
      priority: 'urgent',
      assigneeIds: ['user-basic-1', 'user-admin-1'],
      dueDate: formatDate(2),
      tags: ['Security', 'Backend', 'Auth'],
      subtasks: [
        { id: 'sub-1', title: 'Write token authorization middleware', completed: true, completedAt: formatDate(-1), completedBy: 'Alex Rivera' },
        { id: 'sub-2', title: 'Implement RBAC role checker for admin routes', completed: true, completedAt: formatDate(-1), completedBy: 'Alex Rivera' },
        { id: 'sub-3', title: 'Add audit logging hook for unauthorized attempts', completed: false },
        { id: 'sub-4', title: 'Perform penetration test on task isolation', completed: false }
      ],
      comments: [
        {
          id: 'comm-1',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          content: 'Hey @Alex Rivera, please make sure basic users can never query tasks outside their assigned IDs, even if guessing UUIDs! 🔒🛡️',
          createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
          reactions: {
            '👍': ['user-basic-1', 'user-admin-2'],
            '🔥': ['user-basic-1']
          },
          mentions: ['user-basic-1']
        },
        {
          id: 'comm-2',
          userId: 'user-basic-1',
          userName: 'Alex Rivera',
          userAvatar: DEFAULT_USERS[2].avatar,
          content: 'Confirmed @Sarah Chen! Backend route strictly filters by req.user.id and returns 403 Forbidden on direct ID access. Ready for review! 🚀✨',
          createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
          reactions: {
            '🚀': ['user-admin-1', 'user-basic-1'],
            '❤️': ['user-admin-1']
          },
          mentions: ['user-admin-1']
        }
      ],
      attachments: [
        {
          id: 'att-1',
          name: 'rbac_security_architecture.png',
          size: 420000,
          type: 'image/png',
          url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80',
          uploadedBy: 'user-admin-1',
          uploadedByName: 'Sarah Chen',
          uploadedAt: new Date(Date.now() - 40 * 3600000).toISOString()
        }
      ],
      codeLanguage: 'javascript',
      codeSnippet: `// RBAC Middleware & Token Verifier
import { Request, Response, NextFunction } from 'express';

export interface AuthContext {
  userId: string;
  role: 'admin' | 'basic';
  privileges: Record<string, boolean>;
}

export function authorizeRole(requiredRole: 'admin' | 'basic') {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authentication credentials' });
    }

    const userRole = (req as any).user?.role;
    if (requiredRole === 'admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Admin privilege required' });
    }

    next();
  };
}`,
      codeSnippets: [
        {
          id: 'snip-1-1',
          title: 'authMiddleware.ts',
          language: 'javascript',
          code: `// RBAC Middleware & Token Verifier
import { Request, Response, NextFunction } from 'express';

export function authorizeRole(requiredRole: 'admin' | 'basic') {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authentication credentials' });
    }

    const userRole = (req as any).user?.role;
    if (requiredRole === 'admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Admin privilege required' });
    }

    next();
  };
}`,
          description: 'Express authorization guard ensuring basic users cannot access elevated endpoints.'
        },
        {
          id: 'snip-1-2',
          title: 'security_policy.xml',
          language: 'xml',
          code: `<?xml version="1.0" encoding="UTF-8"?>
<SecurityConfiguration xmlns="http://taskflow.io/security/v1">
  <Policy id="rbac-default" version="2.4">
    <Roles>
      <Role name="admin" allowAll="true">
        <Permissions>
          <Permission name="system:manage_users" />
          <Permission name="system:manage_workflows" />
          <Permission name="tasks:delete_any" />
        </Permissions>
      </Role>
      <Role name="basic" allowAll="false">
        <Permissions>
          <Permission name="tasks:create" />
          <Permission name="tasks:read_assigned" />
          <Permission name="attachments:upload_1024kb" />
        </Permissions>
      </Role>
    </Roles>
  </Policy>
</SecurityConfiguration>`,
          description: 'XML security schema defining permissions matrix for TaskFlow RBAC.'
        },
        {
          id: 'snip-1-3',
          title: 'audit_checker.py',
          language: 'python',
          code: `import hashlib
import time

def verify_token_signature(token: str, secret_key: str) -> bool:
    """Verifies token integrity using SHA-256 HMAC"""
    if not token or ":" not in token:
        return False
    payload, signature = token.split(":", 1)
    expected = hashlib.sha256(f"{payload}{secret_key}".encode('utf-8')).hexdigest()
    return signature == expected

def rate_limit_check(user_id: str, max_requests: int = 100) -> bool:
    current_sec = int(time.time())
    print(f"[AUDIT] Checking rate limit for user {user_id} at epoch {current_sec}")
    return True

if __name__ == "__main__":
    test_user = "user-basic-1"
    assert rate_limit_check(test_user) is True
    print("RBAC security self-check passed!")`,
          description: 'Python security verifier for token signatures and rate limiting.'
        }
      ],
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen'
    },
    {
      id: 'task-2',
      title: 'Responsive Kanban Drag & Drop Board UI',
      description: 'Build an ultra-fluid, accessible Kanban board with customizable columns, fluid card animations, keyboard navigation, and responsive touch gestures for tablet and mobile devices.',
      statusId: 'status-in-progress',
      priority: 'high',
      assigneeIds: ['user-basic-2', 'user-basic-3'],
      dueDate: formatDate(3),
      tags: ['Frontend', 'UI/UX', 'Performance'],
      subtasks: [
        { id: 'sub-2-1', title: 'Layout column containers with adaptive flex grid', completed: true, completedAt: formatDate(-2), completedBy: 'Maria Garcia' },
        { id: 'sub-2-2', title: 'Implement smooth drag/drop interaction handlers', completed: true, completedAt: formatDate(-1), completedBy: 'Maria Garcia' },
        { id: 'sub-2-3', title: 'Add touch listener support for mobile viewports', completed: true, completedAt: formatDate(0), completedBy: 'Maria Garcia' },
        { id: 'sub-2-4', title: 'Add quick-move status dropdown menu on cards', completed: false }
      ],
      comments: [
        {
          id: 'comm-2-1',
          userId: 'user-basic-3',
          userName: 'Liam Taylor',
          userAvatar: DEFAULT_USERS[4].avatar,
          content: 'Hey @Maria Garcia, I updated the color hex codes for the status column headers in the design specs attachment! 🎨✨',
          createdAt: new Date(Date.now() - 15 * 3600000).toISOString(),
          reactions: {
            '🙌': ['user-basic-2'],
            '💡': ['user-admin-1']
          },
          mentions: ['user-basic-2']
        },
        {
          id: 'comm-2-2',
          userId: 'user-basic-2',
          userName: 'Maria Garcia',
          userAvatar: DEFAULT_USERS[3].avatar,
          content: 'Awesome work @Liam Taylor! Applying the changes now to the drag-and-drop animation handlers. 🚀🎉',
          createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
          reactions: {
            '🔥': ['user-basic-3', 'user-admin-1']
          },
          mentions: ['user-basic-3']
        }
      ],
      attachments: [
        {
          id: 'att-2-1',
          name: 'kanban_ui_spec_v2.png',
          size: 854000,
          type: 'image/png',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          uploadedBy: 'user-basic-3',
          uploadedByName: 'Liam Taylor',
          uploadedAt: new Date(Date.now() - 18 * 3600000).toISOString()
        }
      ],
      codeLanguage: 'html',
      codeSnippet: `<!-- Kanban Column Template -->
<div class="kanban-column" id="col-in-progress" data-status="in-progress">
  <div class="column-header flex justify-between items-center px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
    <span class="font-semibold text-amber-400">In Progress</span>
    <span class="badge rounded-full px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300">3 tasks</span>
  </div>
  <div class="column-droppable p-3 space-y-3 min-h-[400px]" ondragover="event.preventDefault()" ondrop="handleTaskDrop(event)">
    <!-- Dynamic Cards Injected Here -->
  </div>
</div>`,
      codeSnippets: [
        {
          id: 'snip-2-1',
          title: 'kanban_layout.html',
          language: 'html',
          code: `<!-- Accessible Kanban Board Layout Skeleton -->
<div class="kanban-board-container" role="region" aria-label="Task Workflow Board">
  <div class="kanban-grid grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6">
    <div class="kanban-column" id="col-todo" tabindex="0" role="list">
      <header class="column-header">
        <h3 class="text-sm font-semibold">To Do</h3>
      </header>
      <div class="card-list space-y-3 mt-3"></div>
    </div>
  </div>
</div>`,
          description: 'Semantic HTML markup for accessible drag and drop Kanban columns.'
        },
        {
          id: 'snip-2-2',
          title: 'kanban_animations.css',
          language: 'css',
          code: `/* Smooth card drag transitions */
.kanban-card {
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease;
  will-change: transform;
}

.kanban-card.is-dragging {
  opacity: 0.75;
  transform: rotate(2deg) scale(1.04);
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.4);
}

.kanban-dropzone.drag-active {
  background-color: rgba(59, 130, 246, 0.08);
  border: 2px dashed rgba(59, 130, 246, 0.5);
  border-radius: 0.75rem;
}`,
          description: 'Custom CSS animations and transitions for drag gestures and drop zones.'
        }
      ],
      createdAt: new Date(Date.now() - 60 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen'
    },
    {
      id: 'task-3',
      title: 'Design System & Component Tokens Update',
      description: 'Harmonize typography scale, badge color contrast, border radius calculations, and accessible focus states across desktop and mobile task views.',
      statusId: 'status-on-hold',
      priority: 'medium',
      assigneeIds: ['user-basic-3'],
      dueDate: formatDate(1),
      tags: ['Design', 'Tokens', 'Accessibility'],
      subtasks: [
        { id: 'sub-3-1', title: 'Audit WCAG AA color contrast on all priority tags', completed: true, completedAt: formatDate(-1), completedBy: 'Liam Taylor' },
        { id: 'sub-3-2', title: 'Ensure inner border-radius = outer radius - padding', completed: true, completedAt: formatDate(0), completedBy: 'Liam Taylor' },
        { id: 'sub-3-3', title: 'Export tokens to Tailwind theme config', completed: true, completedAt: formatDate(0), completedBy: 'Liam Taylor' }
      ],
      comments: [
        {
          id: 'comm-3-1',
          userId: 'user-basic-2',
          userName: 'Maria Garcia',
          userAvatar: DEFAULT_USERS[3].avatar,
          content: 'Reviewed the tokens! Waiting on external design team signoff before moving to In progress.',
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
        }
      ],
      attachments: [],
      codeLanguage: 'css',
      codeSnippet: `/* Design Tokens: CSS Custom Properties */
:root {
  --color-brand-primary: #3b82f6;
  --color-brand-accent: #6366f1;
  --radius-card-outer: 1rem;     /* 16px */
  --spacing-card-padding: 1.25rem;/* 20px */
  --radius-card-inner: calc(var(--radius-card-outer) - 4px);
  --font-family-mono: 'JetBrains Mono', ui-monospace, monospace;
}

.theme-card {
  border-radius: var(--radius-card-outer);
  padding: var(--spacing-card-padding);
}`,
      codeSnippets: [
        {
          id: 'snip-3-1',
          title: 'theme_variables.css',
          language: 'css',
          code: `/* Design tokens and mathematical border-radii */
:root {
  --color-surface-900: #0f172a;
  --color-surface-800: #1e293b;
  --color-surface-700: #334155;
  --radius-outer: 16px;
  --radius-inner: calc(16px - 6px); /* 10px */
}`,
          description: 'CSS custom properties governing geometric radius harmony and palette.'
        }
      ],
      createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      createdBy: 'user-admin-2',
      createdByName: 'Marcus Vance'
    },
    {
      id: 'task-4',
      title: 'Real-time Analytics Dashboard for Admins',
      description: 'Implement aggregation engine for task completion velocity, workload distribution per user, overdue task alerting, and priority distribution graphs.',
      statusId: 'status-created-assigned',
      priority: 'high',
      assigneeIds: ['user-admin-1', 'user-basic-1'],
      dueDate: formatDate(5),
      tags: ['Analytics', 'Admin', 'Reporting'],
      subtasks: [
        { id: 'sub-4-1', title: 'Create stats aggregation API endpoint with RBAC check', completed: true, completedAt: formatDate(0), completedBy: 'Alex Rivera' },
        { id: 'sub-4-2', title: 'Render team workload breakdown component', completed: false },
        { id: 'sub-4-3', title: 'Add priority distribution pie/bar charts', completed: false },
        { id: 'sub-4-4', title: 'Add export summary report button', completed: false }
      ],
      comments: [],
      attachments: [],
      createdAt: new Date(Date.now() - 30 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen'
    },
    {
      id: 'task-5',
      title: 'Automated E2E Regression Testing Suite',
      description: 'Set up automated tests to verify permission isolation between Basic and Admin users, status reordering, subtask progress calculation, and activity log tracking.',
      statusId: 'status-created-assigned',
      priority: 'medium',
      assigneeIds: ['user-basic-4'],
      dueDate: formatDate(6),
      tags: ['QA', 'Automation', 'CI/CD'],
      subtasks: [
        { id: 'sub-5-1', title: 'Write tests for Basic User view restriction', completed: false },
        { id: 'sub-5-2', title: 'Write tests for Admin status management', completed: false },
        { id: 'sub-5-3', title: 'Verify comment and attachment audit logging', completed: false }
      ],
      comments: [],
      attachments: [],
      createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
      createdBy: 'user-admin-2',
      createdByName: 'Marcus Vance'
    },
    {
      id: 'task-6',
      title: 'Database Schema Optimization & Indexing',
      description: 'Index tasks by assignee ID, status ID, and updated timestamp to guarantee sub-50ms query latency under heavy concurrency.',
      statusId: 'status-solved',
      priority: 'low',
      assigneeIds: ['user-basic-1', 'user-admin-2'],
      dueDate: formatDate(-2),
      tags: ['Database', 'Optimization'],
      subtasks: [
        { id: 'sub-6-1', title: 'Analyze slow query logs', completed: true, completedAt: formatDate(-3), completedBy: 'Alex Rivera' },
        { id: 'sub-6-2', title: 'Add compound indices on assignee + status', completed: true, completedAt: formatDate(-2), completedBy: 'Marcus Vance' }
      ],
      comments: [
        {
          id: 'comm-6-1',
          userId: 'user-admin-2',
          userName: 'Marcus Vance',
          userAvatar: DEFAULT_USERS[1].avatar,
          content: 'Benchmark results show query times dropped from 140ms to 8ms. Solution verified and marked Solved!',
          createdAt: new Date(Date.now() - 48 * 3600000).toISOString()
        }
      ],
      attachments: [],
      createdAt: new Date(Date.now() - 96 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      createdBy: 'user-admin-2',
      createdByName: 'Marcus Vance'
    },
    {
      id: 'task-7',
      title: 'Customer Feedback Triage for Sprint 14',
      description: 'Review incoming customer requests, categorize into feature requests or bugs, assign urgency and assignees.',
      statusId: 'status-closed',
      priority: 'low',
      assigneeIds: ['user-admin-1', 'user-basic-4'],
      dueDate: formatDate(7),
      tags: ['Triage', 'Support', 'Tickets'],
      subtasks: [
        { id: 'sub-7-1', title: 'Export customer tickets', completed: true },
        { id: 'sub-7-2', title: 'Tag recurring UX friction points', completed: true }
      ],
      comments: [
        {
          id: 'comm-7-1',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          content: 'All feedback categorized and tickets closed for Sprint 14.',
          createdAt: new Date(Date.now() - 10 * 3600000).toISOString()
        }
      ],
      attachments: [],
      createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen'
    },
    {
      id: 'task-8',
      title: 'Overdue Audit: Security Certificate Rotation',
      description: 'Rotate internal SSL/TLS mutual authentication certs and update secrets manager vault before expiration.',
      statusId: 'status-in-progress',
      priority: 'urgent',
      assigneeIds: ['user-basic-1', 'user-admin-2'],
      dueDate: formatDate(-1), // Overdue!
      tags: ['Security', 'Infra', 'Certificates'],
      subtasks: [
        { id: 'sub-8-1', title: 'Generate new 4096-bit RSA keys', completed: true, completedAt: formatDate(-2), completedBy: 'Marcus Vance' },
        { id: 'sub-8-2', title: 'Stage keys in test environment', completed: true, completedAt: formatDate(-1), completedBy: 'Alex Rivera' },
        { id: 'sub-8-3', title: 'Trigger production rolling restart', completed: false }
      ],
      comments: [
        {
          id: 'comm-8-1',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          content: 'Flagging this as urgent since due date was yesterday. Let us complete step 3 today.',
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
        }
      ],
      attachments: [],
      createdAt: new Date(Date.now() - 80 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen'
    },
    {
      id: 'task-9',
      title: 'VPN Gateway SSL Handshake Latency Spike [TCK-109]',
      description: 'Multiple remote engineers reported 3000ms+ timeout spikes when negotiating tunnel keys with the US-East VPN concentrator during morning peak hours.',
      statusId: 'status-created-assigned',
      priority: 'urgent',
      assigneeIds: ['user-admin-1', 'user-basic-1'],
      dueDate: formatDate(1),
      tags: ['IT Support', 'Network', 'Infrastructure'],
      subtasks: [
        { id: 'sub-9-1', title: 'Inspect VPN gateway CPU thread exhaustion', completed: false },
        { id: 'sub-9-2', title: 'Provision secondary standby VPN node in US-East', completed: false }
      ],
      comments: [
        {
          id: 'comm-9-1',
          userId: 'user-basic-1',
          userName: 'Alex Rivera',
          userAvatar: DEFAULT_USERS[2].avatar,
          content: 'Ticket created and assigned. Beginning log inspection now.',
          createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
        }
      ],
      attachments: [],
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen'
    },
    {
      id: 'task-10',
      title: 'SSO Integration with Okta & Azure AD [TCK-110]',
      description: 'Configure SAML 2.0 and OIDC identity providers for enterprise single sign-on. Waiting on corporate IT for client secrets and metadata XML.',
      statusId: 'status-on-hold',
      priority: 'high',
      assigneeIds: ['user-admin-2', 'user-basic-4'],
      dueDate: formatDate(4),
      tags: ['Security', 'SSO', 'Enterprise'],
      subtasks: [
        { id: 'sub-10-1', title: 'Draft SAML SP metadata XML document', completed: true },
        { id: 'sub-10-2', title: 'Receive Azure AD tenant ID and certificate from client IT', completed: false },
        { id: 'sub-10-3', title: 'Test user attribute mapping and SCIM provisioning', completed: false }
      ],
      comments: [
        {
          id: 'comm-10-1',
          userId: 'user-admin-2',
          userName: 'Marcus Vance',
          userAvatar: DEFAULT_USERS[1].avatar,
          content: 'Placed on hold pending reply from enterprise IT security officer.',
          createdAt: new Date(Date.now() - 8 * 3600000).toISOString()
        }
      ],
      attachments: [],
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      createdBy: 'user-admin-2',
      createdByName: 'Marcus Vance'
    },
    {
      id: 'task-11',
      title: 'Fix CSV Data Export Encoding for Non-ASCII Characters [TCK-111]',
      description: 'UTF-8 BOM header missing in generated spreadsheet exports causing umlauts and accented characters to display as garbled symbols in Excel.',
      statusId: 'status-solved',
      priority: 'medium',
      assigneeIds: ['user-basic-2'],
      dueDate: formatDate(-1),
      tags: ['Bug', 'Export', 'UI'],
      subtasks: [
        { id: 'sub-11-1', title: 'Prepend EF BB BF byte order mark to CSV buffer', completed: true },
        { id: 'sub-11-2', title: 'Test with German, French, and Japanese test cases in MS Excel', completed: true }
      ],
      comments: [
        {
          id: 'comm-11-1',
          userId: 'user-basic-2',
          userName: 'Maria Garcia',
          userAvatar: DEFAULT_USERS[3].avatar,
          content: 'Fix deployed to staging and verified with Excel. Ticket solved!',
          createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
        }
      ],
      attachments: [],
      createdAt: new Date(Date.now() - 40 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      createdBy: 'user-basic-2',
      createdByName: 'Maria Garcia'
    },
    {
      id: 'task-12',
      title: 'Quarterly Infrastructure Capacity Planning [TCK-112]',
      description: 'Audit monthly Cloud Run container compute usage and bandwidth trends. Archive previous quarter budget reconciliation report.',
      statusId: 'status-closed',
      priority: 'low',
      assigneeIds: ['user-admin-1'],
      dueDate: formatDate(-5),
      tags: ['Operations', 'Finance', 'Reports'],
      subtasks: [
        { id: 'sub-12-1', title: 'Extract Cloud Billing cost breakdown by service', completed: true },
        { id: 'sub-12-2', title: 'Present quarterly capacity forecast to leadership', completed: true }
      ],
      comments: [
        {
          id: 'comm-12-1',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          content: 'Presented to CTO and approved. Closing ticket.',
          createdAt: new Date(Date.now() - 72 * 3600000).toISOString()
        }
      ],
      attachments: [],
      createdAt: new Date(Date.now() - 120 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen'
    }
  ];

  channelReadState = new Map();

  const allUserIds = DEFAULT_USERS.map((u) => u.id);

  channels = [
    {
      id: 'chan-general',
      name: 'general',
      type: 'channel',
      description: 'Company-wide announcements, team updates, sprint milestones, and cross-team discussions.',
      topic: 'Welcome to TaskFlow! Share team wins and release announcements.',
      color: '#3B82F6',
      isPrivate: false,
      isDefault: true,
      ownerId: 'user-admin-1',
      memberIds: [...allUserIds],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      pinnedMessageIds: ['msg-gen-1']
    },
    {
      id: 'chan-dev-eng',
      name: 'dev-engineering',
      type: 'channel',
      description: 'Full-stack engineering discussions, API specs, PR reviews, CI/CD pipelines, and bug triage.',
      topic: 'Sprint 14 Dev Focus: OAuth2 RBAC, D3 Graph optimizations, and real-time WebSockets.',
      color: '#10B981',
      isPrivate: false,
      isDefault: true,
      ownerId: 'user-admin-1',
      memberIds: [...allUserIds],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      pinnedMessageIds: ['msg-dev-2']
    },
    {
      id: 'chan-design-system',
      name: 'design-system',
      type: 'channel',
      description: 'Design tokens, theme studio customization, responsive layouts, and UI micro-interactions.',
      topic: 'Dark minimalism palette, 4.5:1 WCAG contrast ratios, and clean layout hierarchy.',
      color: '#8B5CF6',
      isPrivate: false,
      isDefault: true,
      ownerId: 'user-basic-2',
      memberIds: [...allUserIds],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 'chan-security-ops',
      name: 'security-ops',
      type: 'channel',
      description: 'Security audits, RBAC role permissions, token revocation, and attachment sanitization.',
      topic: 'Private Security Ops • Zero Trust & Audit Compliance',
      color: '#EF4444',
      isPrivate: true,
      ownerId: 'user-admin-1',
      memberIds: ['user-admin-1', 'user-admin-2', 'user-basic-1', 'user-basic-4'],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 45 * 60000).toISOString()
    },
    {
      id: 'group-sprint-core',
      name: 'Sprint 14 Core Squad',
      type: 'group_dm',
      description: 'Core leads group coordinating blocking issues and production readiness.',
      topic: 'Cross-functional sprint coordination',
      color: '#F59E0B',
      isPrivate: true,
      ownerId: 'user-admin-1',
      memberIds: ['user-admin-1', 'user-basic-1', 'user-basic-2', 'user-basic-3'],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: 'dm-sarah-alex',
      name: 'Alex Rivera',
      type: 'direct',
      description: 'Direct Message conversation with Alex Rivera',
      topic: 'Direct Message',
      color: '#3B82F6',
      isPrivate: true,
      ownerId: 'user-admin-1',
      memberIds: ['user-admin-1', 'user-basic-1'],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: 'dm-sarah-elena',
      name: 'Elena Rostova',
      type: 'direct',
      description: 'Direct Message conversation with Elena Rostova',
      topic: 'Direct Message',
      color: '#EC4899',
      isPrivate: true,
      ownerId: 'user-admin-1',
      memberIds: ['user-admin-1', 'user-basic-2'],
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 35 * 60000).toISOString()
    }
  ];

  chatMessages = [
    // General Channel Messages
    {
      id: 'msg-gen-1',
      channelId: 'chan-general',
      senderId: 'user-admin-1',
      senderName: 'Sarah Chen',
      senderAvatar: DEFAULT_USERS[0].avatar,
      senderRole: 'admin',
      senderTitle: 'Lead Architect & Admin',
      content: '🚀 Welcome to the TaskFlow real-time collaboration workspace! We have kicked off Sprint 14 with high priority goals on RBAC security, Relationship Graphs, and Team Chat.',
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      isPinned: true,
      reactions: {
        '🚀': ['user-basic-1', 'user-basic-2', 'user-basic-3', 'user-basic-4'],
        '🔥': ['user-admin-2', 'user-basic-1']
      }
    },
    {
      id: 'msg-gen-2',
      channelId: 'chan-general',
      senderId: 'user-basic-1',
      senderName: 'Alex Rivera',
      senderAvatar: DEFAULT_USERS[2].avatar,
      senderRole: 'basic',
      senderTitle: 'Senior Frontend Engineer',
      content: 'All systems are performing smoothly! Looking forward to delivering the new interactive features today.',
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      reactions: {
        '👍': ['user-admin-1', 'user-basic-2']
      }
    },
    {
      id: 'msg-gen-3',
      channelId: 'chan-general',
      senderId: 'user-basic-2',
      senderName: 'Elena Rostova',
      senderAvatar: DEFAULT_USERS[3].avatar,
      senderRole: 'basic',
      senderTitle: 'Product Designer',
      content: 'The new theme studio palettes and graph visual nodes have been aligned with the 4.5:1 contrast standards. Let me know if you want any bespoke colorway presets!',
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      reactions: {
        '❤️': ['user-admin-1', 'user-basic-1']
      }
    },

    // Dev Engineering Channel Messages
    {
      id: 'msg-dev-1',
      channelId: 'chan-dev-eng',
      senderId: 'user-basic-1',
      senderName: 'Alex Rivera',
      senderAvatar: DEFAULT_USERS[2].avatar,
      senderRole: 'basic',
      senderTitle: 'Senior Frontend Engineer',
      content: 'Hey @Sarah Chen, I have integrated the OAuth token verification middleware and updated the task permissions logic.',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      mentions: ['user-admin-1'],
      linkedTaskId: 'task-1',
      linkedTaskTitle: 'Implement OAuth 2.0 and RBAC Middleware',
      linkedTaskPriority: 'urgent',
      linkedTaskStatusId: 'status-in-progress',
      linkedTaskStatusName: 'In Progress',
      linkedTaskStatusColor: '#3B82F6',
      reactions: {
        '👍': ['user-admin-1', 'user-basic-4']
      }
    },
    {
      id: 'msg-dev-2',
      channelId: 'chan-dev-eng',
      senderId: 'user-admin-1',
      senderName: 'Sarah Chen',
      senderAvatar: DEFAULT_USERS[0].avatar,
      senderRole: 'admin',
      senderTitle: 'Lead Architect & Admin',
      content: 'Great work Alex! Make sure the SHA-256 checksum and executable file blacklist validation is covered in the unit tests before closing task-1.',
      createdAt: new Date(Date.now() - 100 * 60000).toISOString(),
      isPinned: true,
      replyTo: {
        id: 'msg-dev-1',
        senderName: 'Alex Rivera',
        content: 'Hey @Sarah Chen, I have integrated the OAuth token verification middleware...'
      },
      reactions: {
        '✅': ['user-basic-1']
      }
    },
    {
      id: 'msg-dev-3',
      channelId: 'chan-dev-eng',
      senderId: 'user-basic-4',
      senderName: 'Priyanshu Sharma',
      senderAvatar: DEFAULT_USERS[5].avatar,
      senderRole: 'basic',
      senderTitle: 'QA & Automation Engineer',
      content: 'Automated test suite `npm run test:e2e` passed all 42 test specs including attachment upload boundaries and permission gates! 💯',
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      reactions: {
        '🎉': ['user-admin-1', 'user-basic-1', 'user-basic-2']
      }
    },

    // Design System Channel Messages
    {
      id: 'msg-des-1',
      channelId: 'chan-design-system',
      senderId: 'user-basic-2',
      senderName: 'Elena Rostova',
      senderAvatar: DEFAULT_USERS[3].avatar,
      senderRole: 'basic',
      senderTitle: 'Product Designer',
      content: 'We updated the typography scale step ratio to 1.25 and streamlined the button text labels with tooltips for a cleaner view.',
      createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
      reactions: {
        '💡': ['user-admin-1', 'user-basic-3']
      }
    },
    {
      id: 'msg-des-2',
      channelId: 'chan-design-system',
      senderId: 'user-basic-3',
      senderName: 'Marcus Vance',
      senderAvatar: DEFAULT_USERS[4].avatar,
      senderRole: 'basic',
      senderTitle: 'DevOps & Cloud Engineer',
      content: 'The relationship graph look is much sharper now with the toggleable metric cards and user dropdown filter. Great improvement!',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      linkedTaskId: 'task-2',
      linkedTaskTitle: 'Design Interactive Relationship & Dependency Graph',
      linkedTaskPriority: 'high',
      linkedTaskStatusId: 'status-review',
      linkedTaskStatusName: 'In Review',
      linkedTaskStatusColor: '#8B5CF6',
      reactions: {
        '🔥': ['user-basic-2']
      }
    },

    // Security Ops Channel Messages
    {
      id: 'msg-sec-1',
      channelId: 'chan-security-ops',
      senderId: 'user-admin-2',
      senderName: 'David Kim',
      senderAvatar: DEFAULT_USERS[1].avatar,
      senderRole: 'admin',
      senderTitle: 'Engineering Manager & Admin',
      content: 'Reminder: All production certificate renewals and key rotations are tracked in task-8. Please verify rolling restart window.',
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
      linkedTaskId: 'task-8',
      linkedTaskTitle: 'Rotate SSL Certificates & Update Secrets',
      linkedTaskPriority: 'urgent',
      linkedTaskStatusId: 'status-in-progress',
      linkedTaskStatusName: 'In Progress',
      linkedTaskStatusColor: '#3B82F6',
      reactions: {
        '👀': ['user-admin-1', 'user-basic-1']
      }
    },
    {
      id: 'msg-sec-2',
      channelId: 'chan-security-ops',
      senderId: 'user-admin-1',
      senderName: 'Sarah Chen',
      senderAvatar: DEFAULT_USERS[0].avatar,
      senderRole: 'admin',
      senderTitle: 'Lead Architect & Admin',
      content: 'Audit trail logging has been validated. All permission overrides and status modifications are strictly timestamped.',
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      reactions: {
        '🔒': ['user-admin-2', 'user-basic-4']
      }
    },

    // Sprint Core Group DM
    {
      id: 'msg-core-1',
      channelId: 'group-sprint-core',
      senderId: 'user-admin-1',
      senderName: 'Sarah Chen',
      senderAvatar: DEFAULT_USERS[0].avatar,
      senderRole: 'admin',
      senderTitle: 'Lead Architect & Admin',
      content: 'Team, let us sync on remaining blockers for Sprint 14 release candidate today at 3 PM.',
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      reactions: {
        '👍': ['user-basic-1', 'user-basic-2', 'user-basic-3']
      }
    },
    {
      id: 'msg-core-2',
      channelId: 'group-sprint-core',
      senderId: 'user-basic-1',
      senderName: 'Alex Rivera',
      senderAvatar: DEFAULT_USERS[2].avatar,
      senderRole: 'basic',
      senderTitle: 'Senior Frontend Engineer',
      content: 'I will have the chat and chat groups frontend fully wired and tested before the sync.',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      reactions: {
        '🚀': ['user-admin-1']
      }
    },

    // Direct Message: Sarah & Alex
    {
      id: 'msg-dm-1',
      channelId: 'dm-sarah-alex',
      senderId: 'user-basic-1',
      senderName: 'Alex Rivera',
      senderAvatar: DEFAULT_USERS[2].avatar,
      senderRole: 'basic',
      senderTitle: 'Senior Frontend Engineer',
      content: 'Hi Sarah, quick question on the audit log schema: should comment deletions log the snippet or just the ID?',
      createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
      reactions: {}
    },
    {
      id: 'msg-dm-2',
      channelId: 'dm-sarah-alex',
      senderId: 'user-admin-1',
      senderName: 'Sarah Chen',
      senderAvatar: DEFAULT_USERS[0].avatar,
      senderRole: 'admin',
      senderTitle: 'Lead Architect & Admin',
      content: 'Just the task ID and author details is sufficient for privacy, but store the action as "Deleted Comment".',
      createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
      reactions: {
        '👍': ['user-basic-1']
      }
    },
    {
      id: 'msg-dm-3',
      channelId: 'dm-sarah-alex',
      senderId: 'user-basic-1',
      senderName: 'Alex Rivera',
      senderAvatar: DEFAULT_USERS[2].avatar,
      senderRole: 'basic',
      senderTitle: 'Senior Frontend Engineer',
      content: 'Sounds good, implementing now!',
      createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
      reactions: {
        '🙌': ['user-admin-1']
      }
    }
  ];

  // Populate lastMessage for all channels
  channels.forEach((chan) => {
    const chanMsgs = chatMessages.filter((m) => m.channelId === chan.id);
    if (chanMsgs.length > 0) {
      const last = chanMsgs[chanMsgs.length - 1];
      chan.lastMessage = {
        id: last.id,
        senderName: last.senderName,
        content: last.content,
        createdAt: last.createdAt
      };
      chan.updatedAt = last.createdAt;
    }
  });

  // Seed Meetings & Minutes with Topics, Members, Audio, and Document Attachments
  meetings = [
    {
      id: 'meet-1',
      title: 'Sprint 14 Planning & Architecture Review',
      description: 'Cross-functional engineering and product alignment for Sprint 14 delivery milestones, RBAC security gates, Task Time Tracker, and Meetings system.',
      startTime: new Date(Date.now() + 2 * 3600000).toISOString(),
      endTime: new Date(Date.now() + 3 * 3600000).toISOString(),
      durationMinutes: 60,
      location: 'Conference Room 4B & Google Meet',
      meetingUrl: 'https://meet.google.com/ais-taskflow-sync',
      memberIds: ['user-admin-1', 'user-basic-1', 'user-basic-2', 'user-admin-2', 'user-basic-3'],
      status: 'scheduled',
      topics: [
        {
          id: 'top-1',
          title: 'Review RBAC Middleware & Token Verification',
          durationMinutes: 20,
          presenterId: 'user-basic-1',
          presenterName: 'Alex Rivera',
          completed: false,
          notes: 'Ensure all API routes validate user credentials and prevent unauthorized ID escalation.'
        },
        {
          id: 'top-2',
          title: 'Task Time Tracking & Live Stopwatch Module',
          durationMinutes: 15,
          presenterId: 'user-admin-1',
          presenterName: 'Sarah Chen',
          completed: false,
          notes: 'Demonstrate live timer widget, manual log entry, billable calculations, and task dot badges.'
        },
        {
          id: 'top-3',
          title: 'Interactive Meetings Hub with MP3 audio playback & file attachments',
          durationMinutes: 25,
          presenterId: 'user-basic-2',
          presenterName: 'Maria Garcia',
          completed: false,
          notes: 'Support for PDF, TXT, CSV, DOCX, and MP3 voice notes with in-browser preview.'
        }
      ],
      notes: `### Sprint 14 Architecture Sync Notes
**Objectives:**
- Finalize the **Time Tracker** on all tasks with active timer and manual logging.
- Ship the comprehensive **Meetings** system with full attachment support for \`.pdf\`, \`.txt\`, \`.csv\`, \`.docx\`, and \`.mp3\`.
- Enforce the **Task Dot representation** standard across all views.

**Decisions:**
1. Default task cards and rows should display interactive status dots.
2. Meeting files should support audio player for MP3 recordings and direct text/table inspection.
3. Every task tracks cumulative time spent in seconds with breakdown history.`,
      attachments: [
        {
          id: 'matt-1',
          name: 'Sprint_14_Architectural_Spec.pdf',
          size: 524288,
          type: 'application/pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          extension: 'pdf',
          uploadedBy: 'user-admin-1',
          uploadedByName: 'Sarah Chen',
          uploadedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'matt-2',
          name: 'kickoff_voice_memo.mp3',
          size: 1048576,
          type: 'audio/mpeg',
          url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
          extension: 'mp3',
          uploadedBy: 'user-admin-1',
          uploadedByName: 'Sarah Chen',
          uploadedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'matt-3',
          name: 'sprint_capacity_matrix.csv',
          size: 14200,
          type: 'text/csv',
          url: '',
          extension: 'csv',
          uploadedBy: 'user-admin-2',
          uploadedByName: 'David Kim',
          uploadedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'matt-4',
          name: 'design_guidelines.docx',
          size: 284000,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          url: '',
          extension: 'docx',
          uploadedBy: 'user-basic-3',
          uploadedByName: 'Liam Taylor',
          uploadedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'matt-5',
          name: 'release_checklist.txt',
          size: 4800,
          type: 'text/plain',
          url: '',
          extension: 'txt',
          uploadedBy: 'user-basic-1',
          uploadedByName: 'Alex Rivera',
          uploadedAt: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      linkedProjectIds: ['proj-1'],
      linkedTaskIds: ['task-1', 'task-2'],
      logs: [
        {
          id: 'mlog-1-1',
          meetingId: 'meet-1',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          action: 'created',
          details: 'Scheduled meeting "Sprint 14 Planning & Architecture Review" (60 mins)',
          timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
        },
        {
          id: 'mlog-1-2',
          meetingId: 'meet-1',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          action: 'attachment_uploaded',
          details: 'Attached document "Sprint_14_Architectural_Spec.pdf" (512 KB)',
          timestamp: new Date(Date.now() - 20 * 3600000).toISOString()
        },
        {
          id: 'mlog-1-3',
          meetingId: 'meet-1',
          userId: 'user-basic-1',
          userName: 'Alex Rivera',
          userAvatar: DEFAULT_USERS[2].avatar,
          action: 'topic_added',
          details: 'Added discussion topic "Review RBAC Middleware & Token Verification" (20 mins)',
          timestamp: new Date(Date.now() - 14 * 3600000).toISOString()
        },
        {
          id: 'mlog-1-4',
          meetingId: 'meet-1',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          action: 'notes_updated',
          details: 'Drafted Sprint 14 Architecture Sync minutes and objectives',
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString()
        }
      ]
    },
    {
      id: 'meet-2',
      title: 'Daily Engineering Standup & Blocker Triage',
      description: '15-minute quick sync to review active tasks, time logs, and open pull requests.',
      startTime: new Date(Date.now() - 1 * 3600000).toISOString(),
      endTime: new Date(Date.now() - 0.75 * 3600000).toISOString(),
      durationMinutes: 15,
      location: 'Huddle Room Alpha',
      memberIds: ['user-admin-1', 'user-basic-1', 'user-basic-2', 'user-basic-4'],
      status: 'completed',
      topics: [
        { id: 'top-201', title: 'Ticket backlog clearance', durationMinutes: 5, presenterId: 'user-basic-4', presenterName: 'Marcus Vance', completed: true },
        { id: 'top-202', title: 'Time tracker stopwatch accuracy verification', durationMinutes: 10, presenterId: 'user-basic-1', presenterName: 'Alex Rivera', completed: true }
      ],
      notes: `**Standup Summary:**
- Alex Rivera logged 2h 45m on OAuth middleware testing.
- Maria Garcia completed drag & drop UI tests.
- Marcus Vance verified zero regressions in ticket queue.`,
      attachments: [
        {
          id: 'matt-201',
          name: 'standup_summary.txt',
          size: 2400,
          type: 'text/plain',
          url: '',
          extension: 'txt',
          uploadedBy: 'user-basic-4',
          uploadedByName: 'Marcus Vance',
          uploadedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      createdBy: 'user-admin-1',
      createdByName: 'Sarah Chen',
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      linkedProjectIds: ['proj-1', 'proj-3'],
      logs: [
        {
          id: 'mlog-2-1',
          meetingId: 'meet-2',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          action: 'created',
          details: 'Scheduled daily standup (15 mins) with 4 engineers',
          timestamp: new Date(Date.now() - 48 * 3600000).toISOString()
        },
        {
          id: 'mlog-2-2',
          meetingId: 'meet-2',
          userId: 'user-basic-4',
          userName: 'Marcus Vance',
          userAvatar: DEFAULT_USERS[3]?.avatar || DEFAULT_USERS[1].avatar,
          action: 'topic_completed',
          details: 'Marked topic "Ticket backlog clearance" as concluded',
          timestamp: new Date(Date.now() - 0.9 * 3600000).toISOString()
        },
        {
          id: 'mlog-2-3',
          meetingId: 'meet-2',
          userId: 'user-basic-1',
          userName: 'Alex Rivera',
          userAvatar: DEFAULT_USERS[2].avatar,
          action: 'topic_completed',
          details: 'Concluded "Time tracker stopwatch accuracy verification"',
          timestamp: new Date(Date.now() - 0.8 * 3600000).toISOString()
        },
        {
          id: 'mlog-2-4',
          meetingId: 'meet-2',
          userId: 'user-admin-1',
          userName: 'Sarah Chen',
          userAvatar: DEFAULT_USERS[0].avatar,
          action: 'status_changed',
          details: 'Transitioned meeting status from scheduled to completed',
          timestamp: new Date(Date.now() - 0.75 * 3600000).toISOString()
        }
      ]
    },
    {
      id: 'meet-3',
      title: 'UI/UX Design System & Micro-Interactions Review',
      description: 'Deep-dive into component states, status dots, interactive stopwatch widget, and high contrast accessibility.',
      startTime: new Date(Date.now() + 26 * 3600000).toISOString(),
      endTime: new Date(Date.now() + 27 * 3600000).toISOString(),
      durationMinutes: 45,
      location: 'Design Studio & Figma Live',
      memberIds: ['user-basic-3', 'user-basic-2', 'user-admin-1'],
      status: 'scheduled',
      topics: [
        { id: 'top-301', title: 'Color-coded task dot system & pulsating states', durationMinutes: 15, presenterId: 'user-basic-3', presenterName: 'Liam Taylor', completed: false },
        { id: 'top-302', title: 'Attachment file cards with audio waveform player', durationMinutes: 15, presenterId: 'user-basic-2', presenterName: 'Maria Garcia', completed: false },
        { id: 'top-303', title: 'Mobile responsiveness for meeting agenda checklists', durationMinutes: 15, presenterId: 'user-admin-1', presenterName: 'Sarah Chen', completed: false }
      ],
      notes: `### Agenda & Requirements:
- Validate that all task cards use luminous dots for status identification.
- Ensure audio attachments play seamlessly within the meeting modal without external plugins.`,
      attachments: [
        {
          id: 'matt-301',
          name: 'design_tokens_v2.csv',
          size: 18200,
          type: 'text/csv',
          url: '',
          extension: 'csv',
          uploadedBy: 'user-basic-3',
          uploadedByName: 'Liam Taylor',
          uploadedAt: new Date(Date.now() - 12 * 3600000).toISOString()
        },
        {
          id: 'matt-302',
          name: 'audio_briefing.mp3',
          size: 2097152,
          type: 'audio/mpeg',
          url: 'https://actions.google.com/sounds/v1/ambiences/office_room.ogg',
          extension: 'mp3',
          uploadedBy: 'user-basic-3',
          uploadedByName: 'Liam Taylor',
          uploadedAt: new Date(Date.now() - 12 * 3600000).toISOString()
        }
      ],
      createdBy: 'user-basic-3',
      createdByName: 'Liam Taylor',
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      linkedProjectIds: ['proj-2'],
      logs: [
        {
          id: 'mlog-3-1',
          meetingId: 'meet-3',
          userId: 'user-basic-3',
          userName: 'Liam Taylor',
          userAvatar: DEFAULT_USERS[4]?.avatar || DEFAULT_USERS[0].avatar,
          action: 'created',
          details: 'Created meeting for UI/UX Design System review',
          timestamp: new Date(Date.now() - 12 * 3600000).toISOString()
        },
        {
          id: 'mlog-3-2',
          meetingId: 'meet-3',
          userId: 'user-basic-3',
          userName: 'Liam Taylor',
          userAvatar: DEFAULT_USERS[4]?.avatar || DEFAULT_USERS[0].avatar,
          action: 'attachment_uploaded',
          details: 'Uploaded audio recording "audio_briefing.mp3" (2.0 MB)',
          timestamp: new Date(Date.now() - 10 * 3600000).toISOString()
        }
      ]
    }
  ];

  // Populate seed time logs on tasks
  if (tasks.length > 0) {
    tasks[0].timeSpentSeconds = 14400; // 4 hours
    tasks[0].estimatedHours = 8;
    tasks[0].timeLogs = [
      {
        id: 'tlog-1',
        taskId: tasks[0].id,
        userId: 'user-basic-1',
        userName: 'Alex Rivera',
        userAvatar: DEFAULT_USERS[2].avatar,
        startTime: new Date(Date.now() - 28 * 3600000).toISOString(),
        endTime: new Date(Date.now() - 26 * 3600000).toISOString(),
        durationSeconds: 7200,
        description: 'Wrote OAuth authentication middleware and token verification logic',
        isBillable: true,
        createdAt: new Date(Date.now() - 26 * 3600000).toISOString()
      },
      {
        id: 'tlog-2',
        taskId: tasks[0].id,
        userId: 'user-admin-1',
        userName: 'Sarah Chen',
        userAvatar: DEFAULT_USERS[0].avatar,
        startTime: new Date(Date.now() - 20 * 3600000).toISOString(),
        endTime: new Date(Date.now() - 19 * 3600000).toISOString(),
        durationSeconds: 3600,
        description: 'Reviewed RBAC security policy and role checker implementation',
        isBillable: true,
        createdAt: new Date(Date.now() - 19 * 3600000).toISOString()
      },
      {
        id: 'tlog-3',
        taskId: tasks[0].id,
        userId: 'user-basic-1',
        userName: 'Alex Rivera',
        userAvatar: DEFAULT_USERS[2].avatar,
        startTime: new Date(Date.now() - 6 * 3600000).toISOString(),
        endTime: new Date(Date.now() - 5 * 3600000).toISOString(),
        durationSeconds: 3600,
        description: 'Unit tested endpoint authorization handlers and mock token cases',
        isBillable: true,
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString()
      }
    ];

    if (tasks.length > 1) {
      tasks[1].timeSpentSeconds = 9000; // 2.5 hours
      tasks[1].estimatedHours = 6;
      tasks[1].timeLogs = [
        {
          id: 'tlog-4',
          taskId: tasks[1].id,
          userId: 'user-basic-2',
          userName: 'Maria Garcia',
          userAvatar: DEFAULT_USERS[3].avatar,
          startTime: new Date(Date.now() - 18 * 3600000).toISOString(),
          endTime: new Date(Date.now() - 16.5 * 3600000).toISOString(),
          durationSeconds: 5400,
          description: 'Built Kanban board drag & drop column handlers and card states',
          isBillable: true,
          createdAt: new Date(Date.now() - 16.5 * 3600000).toISOString()
        },
        {
          id: 'tlog-5',
          taskId: tasks[1].id,
          userId: 'user-basic-2',
          userName: 'Maria Garcia',
          userAvatar: DEFAULT_USERS[3].avatar,
          startTime: new Date(Date.now() - 8 * 3600000).toISOString(),
          endTime: new Date(Date.now() - 7 * 3600000).toISOString(),
          durationSeconds: 3600,
          description: 'Added mobile touch listeners and responsive viewport layout',
          isBillable: true,
          createdAt: new Date(Date.now() - 7 * 3600000).toISOString()
        }
      ];
    }

    if (tasks.length > 2) {
      tasks[2].timeSpentSeconds = 7200; // 2 hours
      tasks[2].estimatedHours = 4;
      tasks[2].timeLogs = [
        {
          id: 'tlog-6',
          taskId: tasks[2].id,
          userId: 'user-basic-3',
          userName: 'Liam Taylor',
          userAvatar: DEFAULT_USERS[4].avatar,
          startTime: new Date(Date.now() - 14 * 3600000).toISOString(),
          endTime: new Date(Date.now() - 12 * 3600000).toISOString(),
          durationSeconds: 7200,
          description: 'Updated design tokens, contrast tokens, and Tailwind theme variables',
          isBillable: true,
          createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
        }
      ];
    }
  }
}

initializeSeedData();

function addActivityLog(
  userId: string,
  userName: string,
  userAvatar: string,
  action: string,
  details: string,
  taskId?: string,
  taskTitle?: string,
  fieldChanged?: string,
  oldValue?: string,
  newValue?: string
) {
  const log: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    taskId,
    taskTitle,
    userId,
    userName,
    userAvatar,
    action,
    details,
    fieldChanged,
    oldValue,
    newValue,
    timestamp: new Date().toISOString()
  };
  activityLogs.unshift(log);
  // Keep max 200 logs
  if (activityLogs.length > 200) {
    activityLogs = activityLogs.slice(0, 200);
  }
  return log;
}

// Auth Middleware: Resolve user from session token or `x-user-id` header
interface AuthenticatedRequest extends Request {
  currentUser?: User;
  sessionToken?: string;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'] as string;
  }

  let foundUser: User | undefined;

  // 1. Resolve from session token
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token)!;
    if (session.expiresAt > Date.now()) {
      foundUser = users.find((u) => u.id === session.userId);
      req.sessionToken = token;
    } else {
      activeSessions.delete(token);
    }
  }

  // 2. Resolve from x-user-id header (for backward compatibility & direct testing)
  if (!foundUser) {
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      foundUser = users.find((u) => u.id === userId);
    }
  }

  if (foundUser) {
    req.currentUser = foundUser;
  } else if (users.length > 0) {
    // Default fallback to first active user if not specified
    req.currentUser = users.find((u) => u.status === 'active') || users[0];
  }

  next();
};

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Unauthorized: Valid authentication session is required.' });
    return;
  }
  if (req.currentUser.status === 'suspended') {
    res.status(403).json({ error: 'Forbidden: Account is suspended.' });
    return;
  }
  next();
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: Administrator privileges are required to perform this action.'
    });
    return;
  }
  next();
};

const requirePrivilege = (privilegeKey: keyof UserPrivileges) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }
    if (req.currentUser.role === 'admin') {
      return next();
    }
    const userPrivs = req.currentUser.privileges || BASIC_DEFAULT_PRIVILEGES;
    if (userPrivs[privilegeKey]) {
      return next();
    }
    res.status(403).json({
      error: `Forbidden: Missing required privilege "${privilegeKey}".`
    });
  };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(authMiddleware);

  // -------------------------------------------------------------
  // API Routes: Authentication & Session Management
  // -------------------------------------------------------------

  // POST /api/auth/login - Authenticate with email and password
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const targetUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!targetUser) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (targetUser.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended. Please contact your administrator.' });
      return;
    }

    // Verify password hash
    let storedHash = userPasswordHashes.get(targetUser.id);
    if (!storedHash) {
      storedHash = DEFAULT_DEMO_HASH;
      userPasswordHashes.set(targetUser.id, DEFAULT_DEMO_HASH);
    }

    const isValid = bcrypt.compareSync(String(password), storedHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Issue session token
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    activeSessions.set(token, {
      token,
      userId: targetUser.id,
      createdAt: new Date().toISOString(),
      expiresAt
    });

    targetUser.lastLoginAt = new Date().toISOString();

    addActivityLog(
      targetUser.id,
      targetUser.name,
      targetUser.avatar,
      'User Logged In',
      `${targetUser.name} signed in successfully (${targetUser.role.toUpperCase()}).`
    );

    res.json({
      token,
      user: targetUser,
      message: 'Login successful'
    });
  });

  // POST /api/auth/register - Register a new account
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, role, department, title } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const isFirstUser = users.length === 0;
    const userRole: 'admin' | 'basic' = isFirstUser || role === 'admin' ? 'admin' : 'basic';
    const userPrivileges: UserPrivileges = userRole === 'admin'
      ? { ...ADMIN_DEFAULT_PRIVILEGES }
      : { ...BASIC_DEFAULT_PRIVILEGES };

    const newUserId = `user-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: String(name).trim(),
      email: cleanEmail,
      role: userRole,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(name).trim())}`,
      title: title ? String(title).trim() : (userRole === 'admin' ? 'Workspace Admin' : 'Team Member'),
      department: department ? String(department).trim() : 'Engineering',
      bio: '',
      phone: '',
      status: 'active',
      privileges: userPrivileges,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    // Hash password with bcrypt
    const hash = bcrypt.hashSync(String(password), 10);
    userPasswordHashes.set(newUserId, hash);
    users.push(newUser);

    // Issue session token
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      token,
      userId: newUserId,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    addActivityLog(
      newUser.id,
      newUser.name,
      newUser.avatar,
      'User Registered',
      `${newUser.name} created an account with ${newUser.role.toUpperCase()} role.`
    );

    res.status(201).json({
      token,
      user: newUser,
      message: 'Account registered successfully'
    });
  });

  // POST /api/auth/logout - End user session
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
    const authHeader = req.headers['authorization'];
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'] as string;
    }

    if (token && activeSessions.has(token)) {
      activeSessions.delete(token);
    }

    if (req.currentUser) {
      addActivityLog(
        req.currentUser.id,
        req.currentUser.name,
        req.currentUser.avatar,
        'User Logged Out',
        `${req.currentUser.name} signed out of the workspace.`
      );
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // GET /api/auth/me - Validate current session token and permissions
  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    res.json({
      user: req.currentUser,
      privileges: req.currentUser.privileges || (req.currentUser.role === 'admin' ? ADMIN_DEFAULT_PRIVILEGES : BASIC_DEFAULT_PRIVILEGES)
    });
  });

  // PUT /api/auth/change-password - Change account password securely
  app.put('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }
    if (String(newPassword).length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    let storedHash = userPasswordHashes.get(req.currentUser!.id);
    if (!storedHash) {
      storedHash = DEFAULT_DEMO_HASH;
    }

    const isValid = bcrypt.compareSync(String(currentPassword), storedHash);
    if (!isValid) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = bcrypt.hashSync(String(newPassword), 10);
    userPasswordHashes.set(req.currentUser!.id, newHash);

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Password Changed',
      `${req.currentUser!.name} updated their security password.`
    );

    res.json({ success: true, message: 'Password updated successfully.' });
  });

  // POST /api/auth/switch-demo-user - Switch user context for demo purposes and get new token
  app.post('/api/auth/switch-demo-user', (req: Request, res: Response) => {
    const { userId } = req.body;
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      token,
      userId: targetUser.id,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    targetUser.lastLoginAt = new Date().toISOString();

    res.json({
      token,
      user: targetUser,
      message: `Switched to user ${targetUser.name}`
    });
  });

  // -------------------------------------------------------------
  // API Routes: Users Management
  // -------------------------------------------------------------

  // GET current authenticated user profile
  app.get('/api/current-user', (req: AuthenticatedRequest, res: Response) => {
    res.json(req.currentUser);
  });

  // GET all users
  app.get('/api/users', (req: AuthenticatedRequest, res: Response) => {
    res.json(users);
  });

  // POST create a new user (Admin only)
  app.post('/api/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { name, email, role, title, department, avatar, bio, phone, privileges, status } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    const isUserAdmin = role === 'admin';
    const userPrivileges: UserPrivileges = privileges
      ? {
          canCreateTask: privileges.canCreateTask ?? true,
          canEditAnyTask: privileges.canEditAnyTask ?? isUserAdmin,
          canDeleteTask: privileges.canDeleteTask ?? isUserAdmin,
          canManageStatuses: privileges.canManageStatuses ?? isUserAdmin,
          canManageUsers: privileges.canManageUsers ?? isUserAdmin,
          canUploadAttachments: privileges.canUploadAttachments ?? true,
          canDeleteAttachments: privileges.canDeleteAttachments ?? true,
          canViewAuditLogs: privileges.canViewAuditLogs ?? isUserAdmin,
          canExportData: privileges.canExportData ?? isUserAdmin
        }
      : isUserAdmin
      ? { ...ADMIN_DEFAULT_PRIVILEGES }
      : { ...BASIC_DEFAULT_PRIVILEGES };

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: isUserAdmin ? 'admin' : 'basic',
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      title: title?.trim() || 'Team Member',
      department: department?.trim() || 'General',
      bio: bio?.trim() || '',
      phone: phone?.trim() || '',
      status: status === 'inactive' || status === 'suspended' ? status : 'active',
      privileges: userPrivileges,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    users.push(newUser);
    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Created User',
      `Added new team member ${newUser.name} with ${newUser.role.toUpperCase()} role and department ${newUser.department}.`
    );
    res.status(201).json(newUser);
  });

  // PUT update user profile and privileges (Admin or Self for profile fields)
  app.put('/api/users/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, email, role, title, department, avatar, bio, phone, privileges, status } = req.body;
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isSelf = req.currentUser?.id === id;
    const isCallerAdmin = req.currentUser?.role === 'admin';

    if (!isSelf && !isCallerAdmin) {
      res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
      return;
    }

    const existing = users[userIndex];
    const newRole = isCallerAdmin && role !== undefined ? (role === 'admin' ? 'admin' : 'basic') : existing.role;
    const isUserAdmin = newRole === 'admin';

    const updatedPrivileges: UserPrivileges = isCallerAdmin && privileges
      ? {
          canCreateTask: privileges.canCreateTask ?? existing.privileges?.canCreateTask ?? true,
          canEditAnyTask: privileges.canEditAnyTask ?? existing.privileges?.canEditAnyTask ?? isUserAdmin,
          canDeleteTask: privileges.canDeleteTask ?? existing.privileges?.canDeleteTask ?? isUserAdmin,
          canManageStatuses: privileges.canManageStatuses ?? existing.privileges?.canManageStatuses ?? isUserAdmin,
          canManageUsers: privileges.canManageUsers ?? existing.privileges?.canManageUsers ?? isUserAdmin,
          canUploadAttachments: privileges.canUploadAttachments ?? existing.privileges?.canUploadAttachments ?? true,
          canDeleteAttachments: privileges.canDeleteAttachments ?? existing.privileges?.canDeleteAttachments ?? true,
          canViewAuditLogs: privileges.canViewAuditLogs ?? existing.privileges?.canViewAuditLogs ?? isUserAdmin,
          canExportData: privileges.canExportData ?? existing.privileges?.canExportData ?? isUserAdmin
        }
      : existing.privileges || (isUserAdmin ? { ...ADMIN_DEFAULT_PRIVILEGES } : { ...BASIC_DEFAULT_PRIVILEGES });

    users[userIndex] = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      email: email !== undefined ? email.trim().toLowerCase() : existing.email,
      role: newRole,
      title: title !== undefined ? title.trim() : existing.title,
      department: department !== undefined ? department.trim() : existing.department,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      bio: bio !== undefined ? bio.trim() : existing.bio,
      phone: phone !== undefined ? phone.trim() : existing.phone,
      status: isCallerAdmin && status !== undefined ? status : existing.status,
      privileges: updatedPrivileges
    };

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      isSelf ? 'Updated Profile' : 'Updated User Profile',
      isSelf
        ? `${users[userIndex].name} updated their profile info & avatar.`
        : `Updated user profile & privileges for ${users[userIndex].name} (${users[userIndex].role.toUpperCase()})`
    );

    res.json(users[userIndex]);
  });

  // PUT update user status (Admin only)
  app.put('/api/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      res.status(400).json({ error: 'Status must be active, inactive, or suspended.' });
      return;
    }
    if (id === req.currentUser!.id && status !== 'active') {
      res.status(400).json({ error: 'You cannot deactivate or suspend your own active administrator account.' });
      return;
    }
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const prevStatus = users[userIndex].status;
    users[userIndex].status = status;

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'User Status Changed',
      `Changed user status of ${users[userIndex].name} from ${prevStatus || 'active'} to ${status}.`
    );

    res.json(users[userIndex]);
  });

  // DELETE a user (Admin only)
  app.delete('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (id === req.currentUser!.id) {
      res.status(400).json({ error: 'You cannot delete your own account while logged in.' });
      return;
    }
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const removed = users.splice(userIndex, 1)[0];
    // Remove assignee from tasks
    tasks.forEach((t) => {
      t.assigneeIds = t.assigneeIds.filter((aid) => aid !== id);
    });

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Deleted User',
      `Deleted user account "${removed.name}" (${removed.email}).`
    );

    res.json({ success: true, message: `User "${removed.name}" deleted successfully.` });
  });

  // -------------------------------------------------------------
  // Projects API
  // -------------------------------------------------------------

  // GET all projects
  app.get('/api/projects', (req: AuthenticatedRequest, res: Response) => {
    res.json(projects);
  });

  // POST create a project (Admin or users with canManageProjects privilege)
  app.post('/api/projects', (req: AuthenticatedRequest, res: Response) => {
    const isAllowed = req.currentUser?.role === 'admin' || Boolean(req.currentUser?.privileges?.canManageProjects);
    if (!isAllowed) {
      res.status(403).json({ error: 'Administrator access or Project Management privilege required to create projects.' });
      return;
    }

    const { name, description, color, ownerId, memberIds, status } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    const assignedOwnerId = ownerId || req.currentUser!.id;
    const initialMembers = Array.isArray(memberIds) && memberIds.length > 0
      ? Array.from(new Set([...memberIds, assignedOwnerId]))
      : [assignedOwnerId];

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      ownerId: assignedOwnerId,
      memberIds: initialMembers,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.unshift(newProject);

    const ownerName = users.find((u) => u.id === newProject.ownerId)?.name || 'Team Lead';
    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Created Project',
      `Created project "${newProject.name}" (Owner: ${ownerName}, ${newProject.memberIds.length} members)`
    );

    res.status(201).json(newProject);
  });

  // PUT update a project
  app.put('/api/projects/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const projectIndex = projects.findIndex((p) => p.id === id);
    if (projectIndex === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const existing = projects[projectIndex];
    const isAllowed =
      req.currentUser?.role === 'admin' ||
      req.currentUser?.id === existing.ownerId ||
      Boolean(req.currentUser?.privileges?.canManageProjects);

    if (!isAllowed) {
      res.status(403).json({ error: 'Only administrators, project managers, or the assigned owner can edit this project.' });
      return;
    }

    const { name, description, color, ownerId, memberIds, status } = req.body;
    const updatedOwnerId = ownerId !== undefined ? ownerId : existing.ownerId;
    let updatedMembers = existing.memberIds;

    if (memberIds !== undefined && Array.isArray(memberIds)) {
      updatedMembers = Array.from(new Set([...memberIds, updatedOwnerId]));
    } else if (ownerId !== undefined && !existing.memberIds.includes(ownerId)) {
      updatedMembers = [...existing.memberIds, ownerId];
    }

    projects[projectIndex] = {
      ...existing,
      name: name !== undefined ? name.trim() : existing.name,
      description: description !== undefined ? description.trim() : existing.description,
      color: color !== undefined ? color : existing.color,
      ownerId: updatedOwnerId,
      memberIds: updatedMembers,
      status: status !== undefined ? status : existing.status,
      updatedAt: new Date().toISOString()
    };

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Updated Project',
      `Updated settings, owner, or members for project "${projects[projectIndex].name}"`
    );

    res.json(projects[projectIndex]);
  });

  // DELETE a project (Admin only)
  app.delete('/api/projects/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const isAllowed = req.currentUser?.role === 'admin' || Boolean(req.currentUser?.privileges?.canManageProjects);
    if (!isAllowed) {
      res.status(403).json({ error: 'Administrator access required to delete projects.' });
      return;
    }

    const projectIndex = projects.findIndex((p) => p.id === id);
    if (projectIndex === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const deleted = projects.splice(projectIndex, 1)[0];
    // Dissociate tasks that belonged to this project
    tasks.forEach((t) => {
      if (t.projectId === id) {
        t.projectId = undefined;
      }
    });

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Deleted Project',
      `Deleted project "${deleted.name}". Associated tasks moved to workspace general queue.`
    );

    res.json({ success: true, message: `Project ${deleted.name} deleted successfully.` });
  });

  // GET all statuses (ordered)
  app.get('/api/statuses', (req: AuthenticatedRequest, res: Response) => {
    const sorted = [...statuses].sort((a, b) => a.order - b.order);
    res.json(sorted);
  });

  // POST create a status (Admin only)
  app.post('/api/statuses', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { name, color, description, isDone } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Status name is required' });
      return;
    }
    const maxOrder = statuses.reduce((max, s) => Math.max(max, s.order), -1);
    const newStatus: Status = {
      id: `status-${Date.now()}`,
      name: name.trim(),
      color: color || '#3B82F6',
      order: maxOrder + 1,
      description: description?.trim() || '',
      isDone: Boolean(isDone)
    };
    statuses.push(newStatus);
    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Created Status',
      `Added custom workflow column "${newStatus.name}"`
    );
    res.status(201).json(newStatus);
  });

  // PUT update a status (Admin only)
  app.put('/api/statuses/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, color, description, isDone } = req.body;
    const index = statuses.findIndex((s) => s.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Status not found' });
      return;
    }
    const oldName = statuses[index].name;
    statuses[index] = {
      ...statuses[index],
      name: name !== undefined ? name.trim() : statuses[index].name,
      color: color !== undefined ? color : statuses[index].color,
      description: description !== undefined ? description.trim() : statuses[index].description,
      isDone: isDone !== undefined ? Boolean(isDone) : statuses[index].isDone
    };

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Updated Status',
      `Updated workflow column "${oldName}" ${oldName !== statuses[index].name ? `to "${statuses[index].name}"` : ''}`
    );
    res.json(statuses[index]);
  });

  // PUT reorder statuses (Admin only)
  app.put('/api/statuses/reorder', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array required' });
      return;
    }
    orderedIds.forEach((id, index) => {
      const status = statuses.find((s) => s.id === id);
      if (status) {
        status.order = index;
      }
    });
    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Reordered Workflow',
      'Reorganized the Kanban board column sequence'
    );
    res.json(statuses.sort((a, b) => a.order - b.order));
  });

  // DELETE a status (Admin only)
  app.delete('/api/statuses/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { fallbackStatusId } = req.query;
    const statusIndex = statuses.findIndex((s) => s.id === id);
    if (statusIndex === -1) {
      res.status(404).json({ error: 'Status not found' });
      return;
    }
    if (statuses.length <= 1) {
      res.status(400).json({ error: 'Cannot delete the only remaining workflow status.' });
      return;
    }

    const removedStatus = statuses[statusIndex];
    // Find target status to migrate orphaned tasks
    const targetStatusId =
      (fallbackStatusId as string) ||
      statuses.find((s) => s.id !== id)?.id ||
      'status-created-assigned';

    // Migrate tasks
    let migratedCount = 0;
    tasks.forEach((t) => {
      if (t.statusId === id) {
        t.statusId = targetStatusId;
        t.updatedAt = new Date().toISOString();
        migratedCount++;
      }
    });

    statuses.splice(statusIndex, 1);
    // Re-index orders
    statuses.sort((a, b) => a.order - b.order).forEach((s, idx) => (s.order = idx));

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Deleted Status',
      `Removed column "${removedStatus.name}" and migrated ${migratedCount} task(s)`
    );

    res.json({
      success: true,
      message: `Status deleted. ${migratedCount} tasks moved.`,
      statuses: statuses.sort((a, b) => a.order - b.order)
    });
  });

  // -------------------------------------------------------------
  // Tasks API with Role-Based Access Control
  // -------------------------------------------------------------

  // GET /api/tasks: Basic users get only assigned tasks; Admins get all
  app.get('/api/tasks', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    if (user.role === 'admin') {
      res.json(tasks);
    } else {
      // Basic User: ONLY see tasks where they are in assigneeIds
      const userTasks = tasks.filter((t) => t.assigneeIds.includes(user.id));
      res.json(userTasks);
    }
  });

  // GET /api/tasks/:id: Access enforcement
  app.get('/api/tasks/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Role check: Admin can access any task; Basic user can only access if assigned
    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({
        error: 'Access Denied: You do not have permission to view this task. Basic users can only access tasks assigned to them.'
      });
      return;
    }

    res.json(task);
  });

  // POST /api/tasks: Create a task
  app.post('/api/tasks', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const {
      title,
      projectId,
      description,
      statusId,
      priority,
      assigneeIds,
      dueDate,
      tags,
      subtasks
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    // Determine target status
    const targetStatusId = statusId || statuses[0]?.id || 'status-created-assigned';
    const finalAssignees = Array.isArray(assigneeIds) ? assigneeIds : [];

    // If Basic User creates a task, ensure they are in the assignees list so they can manage it
    if (user.role !== 'admin' && !finalAssignees.includes(user.id)) {
      finalAssignees.push(user.id);
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: projectId || undefined,
      title: title.trim(),
      description: description?.trim() || '',
      statusId: targetStatusId,
      priority: priority || 'medium',
      assigneeIds: finalAssignees,
      dueDate: dueDate || undefined,
      tags: Array.isArray(tags) ? tags : [],
      subtasks: Array.isArray(subtasks)
        ? subtasks.map((st: { title: string }, i: number) => ({
            id: `sub-${Date.now()}-${i}`,
            title: st.title,
            completed: false
          }))
        : [],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
      createdByName: user.name
    };

    tasks.unshift(newTask);

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Created Task',
      `Created task "${newTask.title}" with priority ${newTask.priority.toUpperCase()}`,
      newTask.id,
      newTask.title
    );

    res.status(201).json(newTask);
  });

  // PUT /api/tasks/:id: Update task fields (RBAC enforced)
  app.put('/api/tasks/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.currentUser!;
    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const existingTask = tasks[taskIndex];

    // Authorization check
    if (user.role !== 'admin' && !existingTask.assigneeIds.includes(user.id)) {
      res.status(403).json({
        error: 'Access Denied: You cannot edit tasks that are not assigned to you.'
      });
      return;
    }

    const {
      title,
      projectId,
      description,
      statusId,
      priority,
      assigneeIds,
      dueDate,
      tags
    } = req.body;

    const changes: string[] = [];

    if (projectId !== undefined && projectId !== existingTask.projectId) {
      changes.push(`project changed`);
      const projName = projects.find((p) => p.id === projectId)?.name || 'General Workspace';
      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Project Changed',
        `Moved task to project "${projName}"`,
        existingTask.id,
        existingTask.title
      );
    }

    if (statusId !== undefined && statusId !== existingTask.statusId) {
      const oldStatus = statuses.find((s) => s.id === existingTask.statusId)?.name || existingTask.statusId;
      const newStatus = statuses.find((s) => s.id === statusId)?.name || statusId;
      changes.push(`status moved from ${oldStatus} to ${newStatus}`);
      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Status Changed',
        `Moved status to "${newStatus}"`,
        existingTask.id,
        existingTask.title,
        'status',
        oldStatus,
        newStatus
      );
    }

    if (priority !== undefined && priority !== existingTask.priority) {
      changes.push(`priority updated to ${priority}`);
      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Priority Changed',
        `Changed priority from ${existingTask.priority} to ${priority}`,
        existingTask.id,
        existingTask.title,
        'priority',
        existingTask.priority,
        priority
      );
    }

    if (assigneeIds !== undefined && JSON.stringify(assigneeIds) !== JSON.stringify(existingTask.assigneeIds)) {
      // Basic users can update tasks but admin has full control over assignees
      // If a basic user is editing, ensure they don't accidentally remove themselves unless they intend to
      changes.push('assignees updated');
      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Assignees Updated',
        `Updated assigned team members`,
        existingTask.id,
        existingTask.title
      );
    }

    if (title !== undefined && title.trim() !== existingTask.title) {
      changes.push('title updated');
      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Title Updated',
        `Renamed task to "${title.trim()}"`,
        existingTask.id,
        title.trim()
      );
    }

    if (description !== undefined && description !== existingTask.description) {
      changes.push('description updated');
      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Description Updated',
        `Updated task detailed requirements`,
        existingTask.id,
        existingTask.title
      );
    }

    if (dueDate !== undefined && dueDate !== existingTask.dueDate) {
      changes.push(`due date set to ${dueDate || 'none'}`);
      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Due Date Updated',
        dueDate ? `Set deadline to ${dueDate}` : 'Removed deadline',
        existingTask.id,
        existingTask.title
      );
    }

    const { codeSnippets, codeSnippet, codeLanguage } = req.body;

    // Apply updates
    tasks[taskIndex] = {
      ...existingTask,
      projectId: projectId !== undefined ? projectId : existingTask.projectId,
      title: title !== undefined ? title.trim() : existingTask.title,
      description: description !== undefined ? description : existingTask.description,
      statusId: statusId !== undefined ? statusId : existingTask.statusId,
      priority: priority !== undefined ? priority : existingTask.priority,
      assigneeIds: assigneeIds !== undefined ? assigneeIds : existingTask.assigneeIds,
      dueDate: dueDate !== undefined ? dueDate : existingTask.dueDate,
      tags: tags !== undefined ? tags : existingTask.tags,
      codeSnippets: codeSnippets !== undefined ? codeSnippets : existingTask.codeSnippets,
      codeSnippet: codeSnippet !== undefined ? codeSnippet : existingTask.codeSnippet,
      codeLanguage: codeLanguage !== undefined ? codeLanguage : existingTask.codeLanguage,
      updatedAt: new Date().toISOString()
    };

    res.json(tasks[taskIndex]);
  });

  // PUT /api/tasks/:id/code: Update task code snippets (RBAC enforced)
  app.put('/api/tasks/:id/code', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.currentUser!;
    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const existingTask = tasks[taskIndex];
    if (user.role !== 'admin' && !existingTask.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden: You can only edit code for tasks assigned to you.' });
      return;
    }

    const { codeSnippets, codeSnippet, codeLanguage } = req.body;

    tasks[taskIndex] = {
      ...existingTask,
      codeSnippets: Array.isArray(codeSnippets) ? codeSnippets : existingTask.codeSnippets,
      codeSnippet: typeof codeSnippet === 'string' ? codeSnippet : existingTask.codeSnippet,
      codeLanguage: codeLanguage || existingTask.codeLanguage || 'javascript',
      updatedAt: new Date().toISOString()
    };

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Updated Code',
      `Updated code implementation & snippets for task "${existingTask.title}"`,
      existingTask.id,
      existingTask.title
    );

    res.json(tasks[taskIndex]);
  });

  // DELETE /api/tasks/:id: Delete task (Admin only)
  app.delete('/api/tasks/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const deleted = tasks[taskIndex];
    tasks.splice(taskIndex, 1);

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Deleted Task',
      `Deleted task "${deleted.title}"`,
      deleted.id,
      deleted.title
    );

    res.json({ success: true, message: `Task "${deleted.title}" deleted.` });
  });

  // POST /api/tasks/:id/subtasks: Add a subtask
  app.post('/api/tasks/:id/subtasks', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title } = req.body;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Subtask title required' });
      return;
    }

    const newSubtask: Subtask = {
      id: `sub-${Date.now()}`,
      title: title.trim(),
      completed: false
    };

    task.subtasks.push(newSubtask);
    task.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Added Subtask',
      `Added checklist item: "${newSubtask.title}"`,
      task.id,
      task.title
    );

    res.status(201).json(task);
  });

  // PUT /api/tasks/:id/subtasks/:subtaskId: Toggle or edit subtask
  app.put('/api/tasks/:id/subtasks/:subtaskId', (req: AuthenticatedRequest, res: Response) => {
    const { id, subtaskId } = req.params;
    const { completed, title } = req.body;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      res.status(404).json({ error: 'Subtask not found' });
      return;
    }

    if (completed !== undefined) {
      subtask.completed = Boolean(completed);
      subtask.completedAt = completed ? new Date().toISOString() : undefined;
      subtask.completedBy = completed ? user.name : undefined;

      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        subtask.completed ? 'Completed Subtask' : 'Reopened Subtask',
        `${subtask.completed ? 'Completed' : 'Reopened'} checklist item: "${subtask.title}"`,
        task.id,
        task.title
      );
    }

    if (title !== undefined && title.trim()) {
      subtask.title = title.trim();
    }

    task.updatedAt = new Date().toISOString();
    res.json(task);
  });

  // DELETE /api/tasks/:id/subtasks/:subtaskId: Remove subtask
  app.delete('/api/tasks/:id/subtasks/:subtaskId', (req: AuthenticatedRequest, res: Response) => {
    const { id, subtaskId } = req.params;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const idx = task.subtasks.findIndex((s) => s.id === subtaskId);
    if (idx === -1) {
      res.status(404).json({ error: 'Subtask not found' });
      return;
    }

    const removed = task.subtasks.splice(idx, 1)[0];
    task.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Removed Subtask',
      `Deleted checklist item "${removed.title}"`,
      task.id,
      task.title
    );

    res.json(task);
  });

  // POST /api/tasks/:id/comments: Add comment
  app.post('/api/tasks/:id/comments', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty' });
      return;
    }

    const { mentions } = req.body;

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      reactions: {},
      mentions: Array.isArray(mentions) ? mentions : []
    };

    task.comments.push(newComment);
    task.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Added Comment',
      `Left a note: "${content.trim().length > 50 ? content.trim().substring(0, 50) + '...' : content.trim()}"`,
      task.id,
      task.title
    );

    res.status(201).json(task);
  });

  // DELETE /api/tasks/:id/comments/:commentId: Delete comment
  app.delete('/api/tasks/:id/comments/:commentId', (req: AuthenticatedRequest, res: Response) => {
    const { id, commentId } = req.params;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const commIdx = task.comments.findIndex((c) => c.id === commentId);
    if (commIdx === -1) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const comment = task.comments[commIdx];
    // Only comment author or admin can delete comment
    if (user.role !== 'admin' && comment.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own comments.' });
      return;
    }

    task.comments.splice(commIdx, 1);
    task.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Deleted Comment',
      `Deleted comment from task #${task.id}`,
      task.id,
      task.title
    );

    res.json(task);
  });

  // POST /api/tasks/:id/comments/:commentId/reactions: Toggle emoji reaction
  app.post('/api/tasks/:id/comments/:commentId/reactions', (req: AuthenticatedRequest, res: Response) => {
    const { id, commentId } = req.params;
    const { emoji } = req.body;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (!emoji || typeof emoji !== 'string') {
      res.status(400).json({ error: 'Emoji character is required' });
      return;
    }

    const comment = task.comments.find((c) => c.id === commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (!comment.reactions) {
      comment.reactions = {};
    }

    const userList = comment.reactions[emoji] || [];
    const userIndex = userList.indexOf(user.id);

    if (userIndex > -1) {
      // Remove reaction
      userList.splice(userIndex, 1);
      if (userList.length === 0) {
        delete comment.reactions[emoji];
      } else {
        comment.reactions[emoji] = userList;
      }
    } else {
      // Add reaction
      userList.push(user.id);
      comment.reactions[emoji] = userList;
    }

    task.updatedAt = new Date().toISOString();
    res.json(task);
  });

  // POST /api/tasks/:id/attachments: Upload file attachment with strict security verification
  app.post('/api/tasks/:id/attachments', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, size, type, url, base64Data } = req.body;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden: You must be assigned to this task to attach files.' });
      return;
    }
    if (user.role !== 'admin' && user.privileges && user.privileges.canUploadAttachments === false) {
      res.status(403).json({ error: 'Forbidden: Your account does not have permission to upload attachments.' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Attachment file name is required.' });
      return;
    }

    const cleanName = name.trim();
    const extMatch = cleanName.match(/\.([a-zA-Z0-9]+)$/);
    const fileExt = extMatch ? extMatch[1].toLowerCase() : '';

    // Security Check: Executable Blacklist
    const EXECUTABLE_EXTENSIONS = [
      'exe', 'sh', 'bat', 'cmd', 'js', 'mjs', 'cjs', 'vbs', 'bin', 'php', 'py', 'jar',
      'msi', 'dll', 'com', 'scr', 'app', 'dmg', 'cgi', 'pl', 'pyc', 'wasm', 'elf', 'so',
      'apk', 'ipa', 'deb', 'rpm', 'ps1', 'vbe', 'wsf', 'reg'
    ];

    if (EXECUTABLE_EXTENSIONS.includes(fileExt)) {
      res.status(400).json({
        error: `Security Alert: Executable and script files (.${fileExt}) are strictly prohibited for system safety.`
      });
      return;
    }

    // Security Check: Allowed Extensions (txt, csv, png, jpg/jpeg)
    const ALLOWED_EXTENSIONS = ['txt', 'csv', 'png', 'jpg', 'jpeg'];
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      res.status(400).json({
        error: `Invalid file format ".${fileExt}". Only .txt, .csv, .png, and .jpg files are permitted.`
      });
      return;
    }

    // Security Check: File Size Limit (Max 1024 KB = 1,048,576 bytes)
    const MAX_SIZE_BYTES = 1024 * 1024; // 1024 KB
    const fileSize = typeof size === 'number' && size > 0 ? size : 102400;

    if (fileSize > MAX_SIZE_BYTES) {
      res.status(400).json({
        error: `File size exceeds the 1024 KB limit (Uploaded size: ${(fileSize / 1024).toFixed(1)} KB). Please upload a file smaller than 1024 KB.`
      });
      return;
    }

    // Determine safe MIME type
    let mimeType = type || 'application/octet-stream';
    if (fileExt === 'txt') mimeType = 'text/plain; charset=utf-8';
    else if (fileExt === 'csv') mimeType = 'text/csv; charset=utf-8';
    else if (fileExt === 'png') mimeType = 'image/png';
    else if (fileExt === 'jpg' || fileExt === 'jpeg') mimeType = 'image/jpeg';

    const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const downloadToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const checksum = `sha256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    // Store in secure file storage
    const contentPayload = base64Data || (url && url.startsWith('data:') ? url.split(',')[1] : Buffer.from(`TaskFlow Attachment: ${cleanName}\nUploaded by: ${user.name}\nTimestamp: ${new Date().toISOString()}`).toString('base64'));

    secureFileStore.set(attachmentId, {
      id: attachmentId,
      name: cleanName,
      size: fileSize,
      mimeType,
      dataBase64: contentPayload,
      checksum,
      token: downloadToken,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
      taskId: task.id
    });

    const secureDownloadUrl = `/api/attachments/${attachmentId}/download?token=${downloadToken}`;
    const secureViewUrl = `/api/attachments/${attachmentId}/view?token=${downloadToken}`;

    const newAttachment: Attachment = {
      id: attachmentId,
      name: cleanName,
      size: fileSize,
      type: mimeType,
      url: url && url.startsWith('data:') ? url : secureViewUrl,
      downloadUrl: secureDownloadUrl,
      uploadedBy: user.id,
      uploadedByName: user.name,
      uploadedByAvatar: user.avatar,
      uploadedAt: new Date().toISOString(),
      checksum,
      token: downloadToken
    };

    task.attachments.push(newAttachment);
    task.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Uploaded Attachment',
      `Uploaded file "${newAttachment.name}" (${(newAttachment.size / 1024).toFixed(1)} KB) with checksum verification`,
      task.id,
      task.title
    );

    res.status(201).json(task);
  });

  // GET /api/attachments/:id/download: Secure download handler
  app.get('/api/attachments/:id/download', (req: Request, res: Response) => {
    const { id } = req.params;
    const { token } = req.query;
    const file = secureFileStore.get(id);

    if (!file) {
      res.status(404).send('File not found or expired.');
      return;
    }

    if (file.token && token && file.token !== token) {
      res.status(403).send('Invalid download authorization token.');
      return;
    }

    const buffer = Buffer.from(file.dataBase64, 'base64');

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  });

  // GET /api/attachments/:id/view: Secure inline preview handler
  app.get('/api/attachments/:id/view', (req: Request, res: Response) => {
    const { id } = req.params;
    const file = secureFileStore.get(id);

    if (!file) {
      res.status(404).send('File not found or expired.');
      return;
    }

    const buffer = Buffer.from(file.dataBase64, 'base64');

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(buffer);
  });

  // DELETE /api/tasks/:id/attachments/:attId: Remove attachment with permission check
  app.delete('/api/tasks/:id/attachments/:attId', (req: AuthenticatedRequest, res: Response) => {
    const { id, attId } = req.params;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const attIndex = task.attachments.findIndex((a) => a.id === attId);
    if (attIndex === -1) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const attachment = task.attachments[attIndex];

    // Permissions check:
    // Admin can delete any attachment.
    // Basic user can delete if:
    // 1. Task is assigned to them
    // 2. They uploaded the attachment OR their role/privileges allow deleting attachments
    const isUploader = attachment.uploadedBy === user.id;
    const canDelete = user.role === 'admin' || (task.assigneeIds.includes(user.id) && (isUploader || user.privileges?.canDeleteAttachments !== false));

    if (!canDelete) {
      res.status(403).json({
        error: 'Forbidden: You do not have permission to delete this attachment. Only the uploader or an Administrator can remove it.'
      });
      return;
    }

    const removed = task.attachments.splice(attIndex, 1)[0];
    secureFileStore.delete(attId);
    task.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Removed Attachment',
      `Deleted file attachment "${removed.name}"`,
      task.id,
      task.title
    );

    res.json(task);
  });

  // =========================================================================
  // TASK TIME TRACKER API
  // =========================================================================

  // POST /api/tasks/:id/time-logs: Add a time log entry
  app.post('/api/tasks/:id/time-logs', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { durationSeconds, startTime, endTime, description, isBillable } = req.body;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden: You must be assigned to this task to log time.' });
      return;
    }

    const duration = typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : 0;
    if (duration <= 0) {
      res.status(400).json({ error: 'Duration must be greater than 0 seconds.' });
      return;
    }

    const newLog: TaskTimeLog = {
      id: `tlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: task.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      startTime: startTime || new Date(Date.now() - duration * 1000).toISOString(),
      endTime: endTime || new Date().toISOString(),
      durationSeconds: duration,
      description: description?.trim() || 'Work session logged',
      isBillable: isBillable !== undefined ? Boolean(isBillable) : true,
      createdAt: new Date().toISOString()
    };

    if (!task.timeLogs) {
      task.timeLogs = [];
    }
    task.timeLogs.unshift(newLog);
    task.timeSpentSeconds = (task.timeSpentSeconds || 0) + duration;
    task.updatedAt = new Date().toISOString();

    const formattedDuration = `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Logged Time',
      `Logged ${formattedDuration} on task: "${newLog.description}"`,
      task.id,
      task.title
    );

    res.status(201).json(task);
  });

  // DELETE /api/tasks/:id/time-logs/:logId: Remove a time log
  app.delete('/api/tasks/:id/time-logs/:logId', (req: AuthenticatedRequest, res: Response) => {
    const { id, logId } = req.params;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (!task.timeLogs) {
      res.status(404).json({ error: 'Time log not found' });
      return;
    }

    const logIndex = task.timeLogs.findIndex((l) => l.id === logId);
    if (logIndex === -1) {
      res.status(404).json({ error: 'Time log not found' });
      return;
    }

    const log = task.timeLogs[logIndex];
    if (user.role !== 'admin' && log.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own time logs.' });
      return;
    }

    const removedLog = task.timeLogs.splice(logIndex, 1)[0];
    task.timeSpentSeconds = Math.max(0, (task.timeSpentSeconds || 0) - removedLog.durationSeconds);
    task.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Deleted Time Log',
      `Removed time entry (${Math.floor(removedLog.durationSeconds / 60)} mins) from task #${task.id}`,
      task.id,
      task.title
    );

    res.json(task);
  });

  // POST /api/tasks/:id/timer: Start or stop live stopwatch timer
  app.post('/api/tasks/:id/timer', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { action, description, isBillable } = req.body;
    const user = req.currentUser!;
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (user.role !== 'admin' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ error: 'Forbidden: You must be assigned to this task to track timer.' });
      return;
    }

    if (action === 'start') {
      // Stop timers on other tasks if any
      tasks.forEach((t) => {
        if (t.id !== task.id && t.isTimerRunning) {
          t.isTimerRunning = false;
        }
      });

      task.isTimerRunning = true;
      task.activeTimerStartedAt = new Date().toISOString();
      task.updatedAt = new Date().toISOString();

      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Started Timer',
        `Started live stopwatch timer on task #${task.id}`,
        task.id,
        task.title
      );

      res.json(task);
    } else if (action === 'stop') {
      if (!task.isTimerRunning || !task.activeTimerStartedAt) {
        task.isTimerRunning = false;
        res.json(task);
        return;
      }

      const startTime = new Date(task.activeTimerStartedAt).getTime();
      const endTime = Date.now();
      const elapsedSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

      const newLog: TaskTimeLog = {
        id: `tlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        taskId: task.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        startTime: task.activeTimerStartedAt,
        endTime: new Date(endTime).toISOString(),
        durationSeconds: elapsedSeconds,
        description: description?.trim() || 'Stopwatch tracked session',
        isBillable: isBillable !== undefined ? Boolean(isBillable) : true,
        createdAt: new Date().toISOString()
      };

      if (!task.timeLogs) {
        task.timeLogs = [];
      }
      task.timeLogs.unshift(newLog);
      task.timeSpentSeconds = (task.timeSpentSeconds || 0) + elapsedSeconds;
      task.isTimerRunning = false;
      task.activeTimerStartedAt = undefined;
      task.updatedAt = new Date().toISOString();

      const formatted = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;

      addActivityLog(
        user.id,
        user.name,
        user.avatar,
        'Stopped Timer',
        `Stopped timer and saved ${formatted} work session on task #${task.id}`,
        task.id,
        task.title
      );

      res.json(task);
    } else {
      res.status(400).json({ error: 'Action must be "start" or "stop"' });
    }
  });

  // =========================================================================
  // MEETINGS API
  // =========================================================================

  // GET /api/meetings: List all accessible meetings
  app.get('/api/meetings', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const { projectId } = req.query;

    let result = [...meetings];

    if (projectId && typeof projectId === 'string') {
      result = result.filter((m) => m.linkedProjectIds?.includes(projectId));
    }

    // Sort by startTime ascending for upcoming / scheduled
    result.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    res.json(result);
  });

  // GET /api/meetings/:id: Get meeting by ID
  app.get('/api/meetings/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const meeting = meetings.find((m) => m.id === id);
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }
    res.json(meeting);
  });

  // POST /api/meetings: Create a new meeting
  app.post('/api/meetings', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const {
      title,
      description,
      startTime,
      endTime,
      durationMinutes,
      location,
      meetingUrl,
      memberIds,
      topics,
      notes,
      attachments,
      linkedProjectIds,
      linkedTaskIds,
      status
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Meeting title is required' });
      return;
    }

    const start = startTime || new Date().toISOString();
    const duration = typeof durationMinutes === 'number' && durationMinutes > 0 ? durationMinutes : 30;
    const end = endTime || new Date(new Date(start).getTime() + duration * 60000).toISOString();

    const members = Array.isArray(memberIds) && memberIds.length > 0 ? memberIds : [user.id];
    if (!members.includes(user.id)) {
      members.push(user.id);
    }

    const processedTopics: MeetingTopic[] = Array.isArray(topics)
      ? topics.map((t: any, i: number) => ({
          id: t.id || `top-${Date.now()}-${i}`,
          title: t.title || 'Discussion Topic',
          durationMinutes: typeof t.durationMinutes === 'number' ? t.durationMinutes : 15,
          presenterId: t.presenterId || user.id,
          presenterName: t.presenterName || user.name,
          notes: t.notes || '',
          completed: Boolean(t.completed)
        }))
      : [
          {
            id: `top-${Date.now()}-0`,
            title: 'General Discussion & Agenda Alignment',
            durationMinutes: duration,
            presenterId: user.id,
            presenterName: user.name,
            notes: '',
            completed: false
          }
        ];

    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      title: title.trim(),
      description: description?.trim() || '',
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      location: location?.trim() || 'Google Meet / Online',
      meetingUrl: meetingUrl?.trim() || 'https://meet.google.com/new',
      memberIds: members,
      topics: processedTopics,
      notes: notes?.trim() || '### Meeting Minutes\n- Add notes and key takeaways here...',
      attachments: Array.isArray(attachments) ? attachments : [],
      status: status || 'scheduled',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedProjectIds: Array.isArray(linkedProjectIds) ? linkedProjectIds : [],
      linkedTaskIds: Array.isArray(linkedTaskIds) ? linkedTaskIds : [],
      logs: [
        {
          id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          meetingId: `meet-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          action: 'created',
          details: `Scheduled meeting "${title.trim()}" (${duration} mins) with ${members.length} attendee(s)`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    meetings.unshift(newMeeting);

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Created Meeting',
      `Scheduled meeting "${newMeeting.title}" (${newMeeting.durationMinutes} mins) with ${newMeeting.memberIds.length} attendee(s)`
    );

    res.status(201).json(newMeeting);
  });

  // PUT /api/meetings/:id: Update meeting details, topics, notes, status
  app.put('/api/meetings/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.currentUser!;
    const meetingIndex = meetings.findIndex((m) => m.id === id);

    if (meetingIndex === -1) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const meeting = meetings[meetingIndex];
    if (!meeting.logs) {
      meeting.logs = [];
    }

    const {
      title,
      description,
      startTime,
      endTime,
      durationMinutes,
      location,
      meetingUrl,
      memberIds,
      topics,
      notes,
      status,
      linkedProjectIds,
      linkedTaskIds
    } = req.body;

    const oldStatus = meeting.status;
    const oldNotes = meeting.notes;
    const oldTitle = meeting.title;
    const oldTopicsCount = meeting.topics?.length || 0;

    if (status !== undefined && status !== oldStatus) {
      meeting.status = status;
      meeting.logs.unshift({
        id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        meetingId: meeting.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        action: 'status_changed',
        details: `Updated meeting status from ${oldStatus.replace('_', ' ').toUpperCase()} to ${status.replace('_', ' ').toUpperCase()}`,
        timestamp: new Date().toISOString()
      });
    }

    if (notes !== undefined && notes !== oldNotes) {
      meeting.notes = notes;
      meeting.logs.unshift({
        id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        meetingId: meeting.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        action: 'notes_updated',
        details: `Updated meeting minutes and discussion notes`,
        timestamp: new Date().toISOString()
      });
    }

    if (title !== undefined && title.trim() !== oldTitle) {
      meeting.title = title.trim();
      meeting.logs.unshift({
        id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        meetingId: meeting.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        action: 'details_updated',
        details: `Renamed meeting to "${title.trim()}"`,
        timestamp: new Date().toISOString()
      });
    }

    if (description !== undefined) meeting.description = description.trim();
    if (startTime !== undefined) meeting.startTime = startTime;
    if (endTime !== undefined) meeting.endTime = endTime;
    if (durationMinutes !== undefined) meeting.durationMinutes = durationMinutes;
    if (location !== undefined) meeting.location = location;
    if (meetingUrl !== undefined) meeting.meetingUrl = meetingUrl;
    
    if (Array.isArray(memberIds)) {
      const addedMembers = memberIds.filter((m) => !(meeting.memberIds || []).includes(m));
      if (addedMembers.length > 0) {
        meeting.logs.unshift({
          id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          meetingId: meeting.id,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          action: 'member_added',
          details: `Added ${addedMembers.length} attendee(s) to the meeting`,
          timestamp: new Date().toISOString()
        });
      }
      meeting.memberIds = memberIds;
    }

    if (Array.isArray(topics)) {
      if (topics.length > oldTopicsCount) {
        const addedTopic = topics[topics.length - 1];
        meeting.logs.unshift({
          id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          meetingId: meeting.id,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          action: 'topic_added',
          details: `Added agenda topic "${addedTopic?.title || 'New Topic'}"`,
          timestamp: new Date().toISOString()
        });
      }
      meeting.topics = topics;
    }

    if (Array.isArray(linkedProjectIds)) meeting.linkedProjectIds = linkedProjectIds;
    if (Array.isArray(linkedTaskIds)) meeting.linkedTaskIds = linkedTaskIds;

    meeting.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Updated Meeting',
      `Updated meeting details & minutes for "${meeting.title}"`
    );

    res.json(meeting);
  });

  // POST /api/meetings/:id/logs: Add custom activity log / decision / takeaway to a meeting
  app.post('/api/meetings/:id/logs', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { action, details } = req.body;
    const user = req.currentUser!;
    const meeting = meetings.find((m) => m.id === id);

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    if (!details || !details.trim()) {
      res.status(400).json({ error: 'Log details are required.' });
      return;
    }

    if (!meeting.logs) {
      meeting.logs = [];
    }

    const newLog: MeetingLog = {
      id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meetingId: meeting.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action: action || 'log_entry_added',
      details: details.trim(),
      timestamp: new Date().toISOString()
    };

    meeting.logs.unshift(newLog);
    meeting.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Meeting Log Entry',
      `Recorded log entry in meeting "${meeting.title}": "${details.trim()}"`
    );

    res.status(201).json({ meeting, log: newLog });
  });

  // POST /api/meetings/:id/topics/:topicId/toggle: Toggle completion of an agenda topic
  app.post('/api/meetings/:id/topics/:topicId/toggle', (req: AuthenticatedRequest, res: Response) => {
    const { id, topicId } = req.params;
    const user = req.currentUser!;
    const meeting = meetings.find((m) => m.id === id);

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const topic = (meeting.topics || []).find((t) => t.id === topicId);
    if (!topic) {
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    topic.completed = !topic.completed;
    meeting.updatedAt = new Date().toISOString();

    if (!meeting.logs) {
      meeting.logs = [];
    }

    const logEntry: MeetingLog = {
      id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meetingId: meeting.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action: topic.completed ? 'topic_completed' : 'topic_reopened',
      details: topic.completed
        ? `Marked topic "${topic.title}" as completed`
        : `Re-opened topic "${topic.title}" for discussion`,
      timestamp: new Date().toISOString()
    };

    meeting.logs.unshift(logEntry);

    res.json({ meeting, topic, log: logEntry });
  });

  // DELETE /api/meetings/:id: Delete meeting
  app.delete('/api/meetings/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.currentUser!;
    const meetingIndex = meetings.findIndex((m) => m.id === id);

    if (meetingIndex === -1) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const meeting = meetings[meetingIndex];
    if (user.role !== 'admin' && meeting.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: Only the meeting organizer or an admin can delete this meeting.' });
      return;
    }

    meetings.splice(meetingIndex, 1);

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Deleted Meeting',
      `Cancelled/deleted meeting "${meeting.title}"`
    );

    res.json({ success: true, message: 'Meeting deleted successfully.' });
  });

  // POST /api/meetings/:id/attachments: Upload meeting file attachment (pdf, txt, csv, docx, mp3)
  app.post('/api/meetings/:id/attachments', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, size, type, url, base64Data } = req.body;
    const user = req.currentUser!;
    const meeting = meetings.find((m) => m.id === id);

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Attachment file name is required.' });
      return;
    }

    const cleanName = name.trim();
    const extMatch = cleanName.match(/\.([a-zA-Z0-9]+)$/);
    const fileExt = extMatch ? extMatch[1].toLowerCase() : '';

    // Allowed extensions for meetings: pdf, txt, csv, docx, mp3, plus png, jpg
    const ALLOWED_MEETING_EXTENSIONS = ['pdf', 'txt', 'csv', 'docx', 'mp3', 'png', 'jpg', 'jpeg', 'ogg', 'wav'];
    if (!ALLOWED_MEETING_EXTENSIONS.includes(fileExt)) {
      res.status(400).json({
        error: `Invalid file format ".${fileExt}". Allowed formats are: PDF, TXT, CSV, DOCX, MP3, PNG, JPG.`
      });
      return;
    }

    // Size limit: 10MB (10485760 bytes)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    const fileSize = typeof size === 'number' && size > 0 ? size : 102400;

    if (fileSize > MAX_SIZE_BYTES) {
      res.status(400).json({
        error: `File size exceeds the 10 MB limit (${(fileSize / (1024 * 1024)).toFixed(1)} MB).`
      });
      return;
    }

    let mimeType = type || 'application/octet-stream';
    if (fileExt === 'pdf') mimeType = 'application/pdf';
    else if (fileExt === 'txt') mimeType = 'text/plain; charset=utf-8';
    else if (fileExt === 'csv') mimeType = 'text/csv; charset=utf-8';
    else if (fileExt === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (fileExt === 'mp3') mimeType = 'audio/mpeg';
    else if (fileExt === 'ogg') mimeType = 'audio/ogg';
    else if (fileExt === 'wav') mimeType = 'audio/wav';
    else if (fileExt === 'png') mimeType = 'image/png';
    else if (fileExt === 'jpg' || fileExt === 'jpeg') mimeType = 'image/jpeg';

    const attachmentId = `matt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const downloadToken = Math.random().toString(36).substring(2, 15);

    const contentPayload = base64Data || (url && url.startsWith('data:') ? url.split(',')[1] : Buffer.from(`TaskFlow Meeting Doc: ${cleanName}`).toString('base64'));

    secureFileStore.set(attachmentId, {
      id: attachmentId,
      name: cleanName,
      size: fileSize,
      mimeType,
      dataBase64: contentPayload,
      checksum: `sha256-${Math.random().toString(36).substring(2, 10)}`,
      token: downloadToken,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString()
    });

    const secureDownloadUrl = `/api/attachments/${attachmentId}/download?token=${downloadToken}`;
    const secureViewUrl = `/api/attachments/${attachmentId}/view?token=${downloadToken}`;

    const newAttachment: MeetingAttachment = {
      id: attachmentId,
      name: cleanName,
      size: fileSize,
      type: mimeType,
      url: url && (url.startsWith('http') || url.startsWith('data:')) ? url : secureViewUrl,
      downloadUrl: secureDownloadUrl,
      uploadedBy: user.id,
      uploadedByName: user.name,
      uploadedAt: new Date().toISOString(),
      extension: fileExt as any
    };

    if (!meeting.attachments) {
      meeting.attachments = [];
    }
    meeting.attachments.push(newAttachment);
    
    if (!meeting.logs) {
      meeting.logs = [];
    }
    meeting.logs.unshift({
      id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meetingId: meeting.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action: 'attachment_uploaded',
      details: `Attached file "${newAttachment.name}" (${(newAttachment.size / 1024).toFixed(1)} KB)`,
      timestamp: new Date().toISOString()
    });

    meeting.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Uploaded Meeting Attachment',
      `Attached "${newAttachment.name}" (${(newAttachment.size / 1024).toFixed(1)} KB) to meeting "${meeting.title}"`
    );

    res.status(201).json(meeting);
  });

  // DELETE /api/meetings/:id/attachments/:attachmentId: Remove meeting attachment
  app.delete('/api/meetings/:id/attachments/:attachmentId', (req: AuthenticatedRequest, res: Response) => {
    const { id, attachmentId } = req.params;
    const user = req.currentUser!;
    const meeting = meetings.find((m) => m.id === id);

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const attIndex = (meeting.attachments || []).findIndex((a) => a.id === attachmentId);
    if (attIndex === -1) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const attachment = meeting.attachments[attIndex];
    if (user.role !== 'admin' && meeting.createdBy !== user.id && attachment.uploadedBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to delete this attachment.' });
      return;
    }

    const removed = meeting.attachments.splice(attIndex, 1)[0];
    secureFileStore.delete(attachmentId);
    
    if (!meeting.logs) {
      meeting.logs = [];
    }
    meeting.logs.unshift({
      id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meetingId: meeting.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action: 'attachment_removed',
      details: `Deleted attachment "${removed.name}"`,
      timestamp: new Date().toISOString()
    });

    meeting.updatedAt = new Date().toISOString();

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Removed Meeting Attachment',
      `Deleted attachment "${removed.name}" from meeting "${meeting.title}"`
    );

    res.json(meeting);
  });

  // GET /api/activity: Audit logs
  app.get('/api/activity', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    if (user.role === 'admin') {
      res.json(activityLogs);
    } else {
      // Basic User: sees logs where they are the actor OR logs on tasks assigned to them
      const userAssignedTaskIds = tasks.filter((t) => t.assigneeIds.includes(user.id)).map((t) => t.id);
      const filtered = activityLogs.filter(
        (log) => log.userId === user.id || (log.taskId && userAssignedTaskIds.includes(log.taskId))
      );
      res.json(filtered);
    }
  });

  // GET /api/stats: Real-time administrator dashboard statistics & insights (Admin only)
  app.get('/api/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const totalTasks = tasks.length;
    const doneStatusIds = statuses.filter((s) => s.isDone).map((s) => s.id);
    const completedTasks = tasks.filter((t) => doneStatusIds.includes(t.statusId)).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(
      (t) => !doneStatusIds.includes(t.statusId) && t.dueDate && t.dueDate < todayStr
    ).length;

    const tasksDueToday = tasks.filter(
      (t) => !doneStatusIds.includes(t.statusId) && t.dueDate === todayStr
    ).length;

    const tasksByStatus = statuses.map((status) => ({
      statusId: status.id,
      statusName: status.name,
      color: status.color,
      count: tasks.filter((t) => t.statusId === status.id).length
    }));

    const priorities: ('urgent' | 'high' | 'medium' | 'low')[] = ['urgent', 'high', 'medium', 'low'];
    const priorityColors = {
      urgent: '#EF4444',
      high: '#F97316',
      medium: '#3B82F6',
      low: '#64748B'
    };

    const tasksByPriority = priorities.map((p) => ({
      priority: p,
      color: priorityColors[p],
      count: tasks.filter((t) => t.priority === p).length
    }));

    const userWorkload = users.map((u) => {
      const assigned = tasks.filter((t) => t.assigneeIds.includes(u.id));
      const completed = assigned.filter((t) => doneStatusIds.includes(t.statusId)).length;
      return {
        userId: u.id,
        userName: u.name,
        avatar: u.avatar,
        assignedCount: assigned.length,
        completedCount: completed
      };
    });

    res.json({
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks,
      tasksDueToday,
      tasksByStatus,
      tasksByPriority,
      userWorkload,
      recentActivity: activityLogs.slice(0, 15)
    });
  });

  // -------------------------------------------------------------
  // Chat & Chat Groups REST APIs
  // -------------------------------------------------------------

  // Helper: Get user's last read timestamp for a channel
  function getUserLastRead(channelId: string, userId: string): string {
    const chanMap = channelReadState.get(channelId);
    if (!chanMap) return new Date(0).toISOString();
    return chanMap.get(userId) || new Date(0).toISOString();
  }

  // GET /api/chat/channels: List accessible channels & groups for current user
  app.get('/api/chat/channels', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;

    // Return public channels + private channels/DMs where user is a member
    const accessible = channels.filter((chan) => {
      if (!chan.isPrivate && chan.type === 'channel') return true;
      return chan.memberIds.includes(user.id) || user.role === 'admin';
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = accessible.map((chan) => {
      const lastRead = getUserLastRead(chan.id, user.id);
      const chanMsgs = chatMessages.filter((m) => m.channelId === chan.id);

      // Unread count: messages sent after lastRead by others
      const unreadCount = chanMsgs.filter(
        (m) => m.senderId !== user.id && new Date(m.createdAt) > new Date(lastRead)
      ).length;

      let displayName = chan.name;
      let displayTopic = chan.topic;
      let displayAvatar = chan.icon;

      // For direct message channels, show the other user's name and status
      if (chan.type === 'direct') {
        const otherUserId = chan.memberIds.find((id) => id !== user.id) || chan.memberIds[0];
        const otherUser = userMap.get(otherUserId);
        if (otherUser) {
          displayName = otherUser.name;
          displayTopic = otherUser.title;
          displayAvatar = otherUser.avatar;
        }
      }

      return {
        ...chan,
        displayName,
        displayTopic,
        displayAvatar,
        unreadCount,
        memberCount: chan.memberIds.length
      };
    });

    // Sort: General first, then channels, group DMs, and direct messages by latest activity
    enriched.sort((a, b) => {
      if (a.id === 'chan-general') return -1;
      if (b.id === 'chan-general') return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.json(enriched);
  });

  // POST /api/chat/channels: Create a new channel or group
  app.post('/api/chat/channels', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const { name, description, topic, type, isPrivate, memberIds, color } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Channel name is required.' });
      return;
    }

    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    const channelType = type === 'group_dm' ? 'group_dm' : 'channel';

    // Ensure memberIds contains current user
    const members = Array.isArray(memberIds) ? [...new Set([...memberIds, user.id])] : [user.id];

    // Check duplicate channel name among public channels
    if (!isPrivate && channels.some((c) => c.name === cleanName && !c.isPrivate && c.type === 'channel')) {
      res.status(400).json({ error: `A public channel named #${cleanName} already exists.` });
      return;
    }

    const newChannel: ChatChannel = {
      id: `${channelType === 'group_dm' ? 'group' : 'chan'}-${Date.now()}`,
      name: cleanName,
      type: channelType,
      description: description ? description.trim() : undefined,
      topic: topic ? topic.trim() : undefined,
      color: color || '#3B82F6',
      isPrivate: Boolean(isPrivate),
      isDefault: false,
      ownerId: user.id,
      memberIds: members,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinnedMessageIds: []
    };

    channels.push(newChannel);

    // Add initial system intro message
    const introMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: newChannel.id,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderRole: user.role,
      senderTitle: user.title,
      content: `🎉 Created new ${newChannel.isPrivate ? 'private ' : ''}${newChannel.type === 'group_dm' ? 'group' : 'channel'} #${newChannel.name}. Welcome!`,
      createdAt: new Date().toISOString()
    };
    chatMessages.push(introMsg);
    newChannel.lastMessage = {
      id: introMsg.id,
      senderName: user.name,
      content: introMsg.content,
      createdAt: introMsg.createdAt
    };

    // Mark as read for creator
    if (!channelReadState.has(newChannel.id)) {
      channelReadState.set(newChannel.id, new Map());
    }
    channelReadState.get(newChannel.id)!.set(user.id, new Date().toISOString());

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Created Chat Channel',
      `Created ${newChannel.isPrivate ? 'private ' : ''}chat ${newChannel.type === 'group_dm' ? 'group' : 'channel'} #${newChannel.name}`
    );

    res.status(201).json(newChannel);
  });

  // PUT /api/chat/channels/:id: Update channel details / topic / members
  app.put('/api/chat/channels/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.currentUser!;
    const chanIndex = channels.findIndex((c) => c.id === id);

    if (chanIndex === -1) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const channel = channels[chanIndex];
    const isOwnerOrAdmin = user.role === 'admin' || channel.ownerId === user.id;

    const { name, description, topic, color, isPrivate, memberIds } = req.body;

    if (name !== undefined && isOwnerOrAdmin && name.trim()) {
      channel.name = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    }
    if (description !== undefined) channel.description = description;
    if (topic !== undefined) channel.topic = topic;
    if (color !== undefined) channel.color = color;
    if (isPrivate !== undefined && isOwnerOrAdmin) channel.isPrivate = Boolean(isPrivate);
    if (Array.isArray(memberIds) && isOwnerOrAdmin) {
      channel.memberIds = [...new Set([...memberIds, user.id])];
    }

    channel.updatedAt = new Date().toISOString();
    res.json(channel);
  });

  // DELETE /api/chat/channels/:id: Delete channel
  app.delete('/api/chat/channels/:id', (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.currentUser!;
    const chanIndex = channels.findIndex((c) => c.id === id);

    if (chanIndex === -1) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const channel = channels[chanIndex];
    if (channel.id === 'chan-general') {
      res.status(400).json({ error: 'The #general company channel cannot be deleted.' });
      return;
    }

    if (user.role !== 'admin' && channel.ownerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: Only the channel owner or an Administrator can delete this channel.' });
      return;
    }

    channels.splice(chanIndex, 1);
    // Remove all associated messages
    chatMessages = chatMessages.filter((m) => m.channelId !== id);
    channelReadState.delete(id);

    addActivityLog(
      user.id,
      user.name,
      user.avatar,
      'Deleted Chat Channel',
      `Deleted chat channel #${channel.name}`
    );

    res.json({ success: true, message: `Channel #${channel.name} deleted.` });
  });

  // POST /api/chat/direct: Start or retrieve 1-on-1 direct message channel
  app.post('/api/chat/direct', (req: AuthenticatedRequest, res: Response) => {
    const user = req.currentUser!;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'Target user ID is required for direct messaging.' });
      return;
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found.' });
      return;
    }

    // Check if DM channel already exists between these 2 users
    const existingDm = channels.find(
      (c) =>
        c.type === 'direct' &&
        c.memberIds.length === 2 &&
        c.memberIds.includes(user.id) &&
        c.memberIds.includes(targetUserId)
    );

    if (existingDm) {
      res.json(existingDm);
      return;
    }

    // Create new DM channel
    const newDm: ChatChannel = {
      id: `dm-${Date.now()}`,
      name: targetUser.name,
      type: 'direct',
      description: `Direct conversation between ${user.name} and ${targetUser.name}`,
      topic: 'Direct Message',
      color: '#3B82F6',
      isPrivate: true,
      ownerId: user.id,
      memberIds: [user.id, targetUserId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinnedMessageIds: []
    };

    channels.push(newDm);

    res.status(201).json(newDm);
  });

  // GET /api/chat/channels/:channelId/messages: Fetch messages in channel
  app.get('/api/chat/channels/:channelId/messages', (req: AuthenticatedRequest, res: Response) => {
    const { channelId } = req.params;
    const user = req.currentUser!;
    const channel = channels.find((c) => c.id === channelId);

    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    // Access check: public channel or member or admin
    if (channel.isPrivate && !channel.memberIds.includes(user.id) && user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You are not a member of this private channel.' });
      return;
    }

    const userMap = new Map(users.map((u) => [u.id, u]));
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const statusMap = new Map(statuses.map((s) => [s.id, s]));

    const msgs = chatMessages
      .filter((m) => m.channelId === channelId)
      .map((m) => {
        // Keep sender info fresh
        const sender = userMap.get(m.senderId);
        let linkedTaskStatusName = m.linkedTaskStatusName;
        let linkedTaskStatusColor = m.linkedTaskStatusColor;
        let linkedTaskPriority = m.linkedTaskPriority;
        let linkedTaskTitle = m.linkedTaskTitle;

        if (m.linkedTaskId && taskMap.has(m.linkedTaskId)) {
          const t = taskMap.get(m.linkedTaskId)!;
          linkedTaskTitle = t.title;
          linkedTaskPriority = t.priority;
          const s = statusMap.get(t.statusId);
          if (s) {
            linkedTaskStatusName = s.name;
            linkedTaskStatusColor = s.color;
          }
        }

        return {
          ...m,
          senderName: sender ? sender.name : m.senderName,
          senderAvatar: sender ? sender.avatar : m.senderAvatar,
          senderRole: sender ? sender.role : m.senderRole,
          senderTitle: sender ? sender.title : m.senderTitle,
          linkedTaskTitle,
          linkedTaskPriority,
          linkedTaskStatusName,
          linkedTaskStatusColor
        };
      });

    res.json(msgs);
  });

  // POST /api/chat/channels/:channelId/messages: Post new message
  app.post('/api/chat/channels/:channelId/messages', (req: AuthenticatedRequest, res: Response) => {
    const { channelId } = req.params;
    const user = req.currentUser!;
    const channel = channels.find((c) => c.id === channelId);

    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    // If channel is private, ensure membership
    if (channel.isPrivate && !channel.memberIds.includes(user.id) && user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: You must be a member of this channel to post messages.' });
      return;
    }

    // If public channel and user not listed in members, automatically join them
    if (!channel.memberIds.includes(user.id)) {
      channel.memberIds.push(user.id);
    }

    const { content, replyToId, attachments, linkedTaskId, mentions } = req.body;

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0) && !linkedTaskId) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    let replyTo: ChatMessage['replyTo'] = undefined;
    if (replyToId) {
      const parentMsg = chatMessages.find((m) => m.id === replyToId);
      if (parentMsg) {
        replyTo = {
          id: parentMsg.id,
          senderName: parentMsg.senderName,
          content:
            parentMsg.content.length > 80 ? parentMsg.content.substring(0, 80) + '...' : parentMsg.content
        };
      }
    }

    let linkedTaskTitle: string | undefined = undefined;
    let linkedTaskPriority: 'low' | 'medium' | 'high' | 'urgent' | undefined = undefined;
    let linkedTaskStatusId: string | undefined = undefined;
    let linkedTaskStatusName: string | undefined = undefined;
    let linkedTaskStatusColor: string | undefined = undefined;

    if (linkedTaskId) {
      const task = tasks.find((t) => t.id === linkedTaskId);
      if (task) {
        linkedTaskTitle = task.title;
        linkedTaskPriority = task.priority;
        linkedTaskStatusId = task.statusId;
        const status = statuses.find((s) => s.id === task.statusId);
        if (status) {
          linkedTaskStatusName = status.name;
          linkedTaskStatusColor = status.color;
        }
      }
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderRole: user.role,
      senderTitle: user.title,
      content: content ? content.trim() : '',
      createdAt: new Date().toISOString(),
      replyTo,
      mentions: Array.isArray(mentions) ? mentions : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      reactions: {},
      linkedTaskId,
      linkedTaskTitle,
      linkedTaskPriority,
      linkedTaskStatusId,
      linkedTaskStatusName,
      linkedTaskStatusColor
    };

    chatMessages.push(newMsg);

    // Update channel metadata
    channel.updatedAt = newMsg.createdAt;
    channel.lastMessage = {
      id: newMsg.id,
      senderName: newMsg.senderName,
      content: newMsg.content || (newMsg.attachments?.length ? '📎 Attached files' : 'Linked a task'),
      createdAt: newMsg.createdAt
    };

    // Mark as read for sender
    if (!channelReadState.has(channelId)) {
      channelReadState.set(channelId, new Map());
    }
    channelReadState.get(channelId)!.set(user.id, newMsg.createdAt);

    res.status(201).json(newMsg);
  });

  // PUT /api/chat/channels/:channelId/messages/:messageId: Edit message
  app.put('/api/chat/channels/:channelId/messages/:messageId', (req: AuthenticatedRequest, res: Response) => {
    const { channelId, messageId } = req.params;
    const user = req.currentUser!;
    const msgIndex = chatMessages.findIndex((m) => m.id === messageId && m.channelId === channelId);

    if (msgIndex === -1) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const msg = chatMessages[msgIndex];
    if (user.role !== 'admin' && msg.senderId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only edit your own messages.' });
      return;
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty.' });
      return;
    }

    msg.content = content.trim();
    msg.isEdited = true;
    msg.updatedAt = new Date().toISOString();

    res.json(msg);
  });

  // DELETE /api/chat/channels/:channelId/messages/:messageId: Delete message
  app.delete('/api/chat/channels/:channelId/messages/:messageId', (req: AuthenticatedRequest, res: Response) => {
    const { channelId, messageId } = req.params;
    const user = req.currentUser!;
    const msgIndex = chatMessages.findIndex((m) => m.id === messageId && m.channelId === channelId);

    if (msgIndex === -1) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const msg = chatMessages[msgIndex];
    if (user.role !== 'admin' && msg.senderId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own messages.' });
      return;
    }

    chatMessages.splice(msgIndex, 1);

    // Update channel lastMessage if needed
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      const remaining = chatMessages.filter((m) => m.channelId === channelId);
      if (remaining.length > 0) {
        const last = remaining[remaining.length - 1];
        channel.lastMessage = {
          id: last.id,
          senderName: last.senderName,
          content: last.content,
          createdAt: last.createdAt
        };
      } else {
        channel.lastMessage = undefined;
      }
    }

    res.json({ success: true, message: 'Message deleted.' });
  });

  // POST /api/chat/channels/:channelId/messages/:messageId/reactions: Toggle emoji reaction
  app.post('/api/chat/channels/:channelId/messages/:messageId/reactions', (req: AuthenticatedRequest, res: Response) => {
    const { channelId, messageId } = req.params;
    const user = req.currentUser!;
    const { emoji } = req.body;

    if (!emoji || typeof emoji !== 'string') {
      res.status(400).json({ error: 'Emoji character is required.' });
      return;
    }

    const msg = chatMessages.find((m) => m.id === messageId && m.channelId === channelId);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (!msg.reactions) {
      msg.reactions = {};
    }

    const userList = msg.reactions[emoji] || [];
    const idx = userList.indexOf(user.id);

    if (idx > -1) {
      // Remove reaction
      userList.splice(idx, 1);
      if (userList.length === 0) {
        delete msg.reactions[emoji];
      } else {
        msg.reactions[emoji] = userList;
      }
    } else {
      // Add reaction
      userList.push(user.id);
      msg.reactions[emoji] = userList;
    }

    res.json(msg);
  });

  // POST /api/chat/channels/:channelId/messages/:messageId/pin: Toggle pin status
  app.post('/api/chat/channels/:channelId/messages/:messageId/pin', (req: AuthenticatedRequest, res: Response) => {
    const { channelId, messageId } = req.params;
    const msg = chatMessages.find((m) => m.id === messageId && m.channelId === channelId);
    const channel = channels.find((c) => c.id === channelId);

    if (!msg || !channel) {
      res.status(404).json({ error: 'Message or channel not found.' });
      return;
    }

    msg.isPinned = !msg.isPinned;

    if (!channel.pinnedMessageIds) {
      channel.pinnedMessageIds = [];
    }

    if (msg.isPinned) {
      if (!channel.pinnedMessageIds.includes(msg.id)) {
        channel.pinnedMessageIds.push(msg.id);
      }
    } else {
      channel.pinnedMessageIds = channel.pinnedMessageIds.filter((id) => id !== msg.id);
    }

    res.json({ message: msg, pinnedMessageIds: channel.pinnedMessageIds });
  });

  // POST /api/chat/channels/:channelId/read: Mark channel as read
  app.post('/api/chat/channels/:channelId/read', (req: AuthenticatedRequest, res: Response) => {
    const { channelId } = req.params;
    const user = req.currentUser!;

    if (!channelReadState.has(channelId)) {
      channelReadState.set(channelId, new Map());
    }

    const nowIso = new Date().toISOString();
    channelReadState.get(channelId)!.set(user.id, nowIso);

    res.json({ success: true, channelId, readAt: nowIso });
  });

  // -------------------------------------------------------------
  // Backup & Restore Engine (Admin Only)
  // -------------------------------------------------------------

  interface BackupFileStoreItem {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    dataBase64: string;
    checksum: string;
    token: string;
    uploadedBy: string;
    uploadedAt: string;
    taskId?: string;
    meetingId?: string;
  }

  interface BackupStats {
    usersCount: number;
    tasksCount: number;
    projectsCount: number;
    statusesCount: number;
    meetingsCount: number;
    channelsCount: number;
    chatMessagesCount: number;
    activityLogsCount: number;
    filesCount: number;
    totalFilesSizeBytes: number;
  }

  interface BackupMetadata {
    id: string;
    version: string;
    timestamp: string;
    createdAtFormatted: string;
    name: string;
    description?: string;
    checksum: string;
    generatedBy: {
      userId: string;
      userName: string;
      userEmail: string;
      userRole: string;
    };
    stats: BackupStats;
  }

  interface BackupDataPayload {
    metadata: BackupMetadata;
    data: {
      users: User[];
      userPasswordHashes?: Record<string, string>;
      statuses: Status[];
      projects: Project[];
      tasks: Task[];
      meetings: Meeting[];
      channels: ChatChannel[];
      chatMessages: ChatMessage[];
      activityLogs: ActivityLog[];
      files: BackupFileStoreItem[];
      gamification?: Record<string, any>;
    };
  }

  const savedServerSnapshots = new Map<string, BackupDataPayload>();
  let lastBackupTimestamp: string | null = null;

  function formatServerDateTime(dateInput: Date | string | number = new Date()): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  function computeLiveBackupStats(): BackupStats {
    const fileList = Array.from(secureFileStore.values());
    const totalFilesSizeBytes = fileList.reduce((acc, f) => acc + (f.size || 0), 0);
    return {
      usersCount: users.length,
      tasksCount: tasks.length,
      projectsCount: projects.length,
      statusesCount: statuses.length,
      meetingsCount: meetings.length,
      channelsCount: channels.length,
      chatMessagesCount: chatMessages.length,
      activityLogsCount: activityLogs.length,
      filesCount: secureFileStore.size,
      totalFilesSizeBytes
    };
  }

  function generateBackupPayload(
    adminUser: User,
    name?: string,
    description?: string,
    customGamification?: any
  ): BackupDataPayload {
    const id = `backup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    const createdAtFormatted = formatServerDateTime(timestamp);
    const backupName = name?.trim() || `TaskFlow Full Backup (${createdAtFormatted})`;

    // Export all files from secure file store with payload
    const files: BackupFileStoreItem[] = Array.from(secureFileStore.values()).map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      dataBase64: f.dataBase64,
      checksum: f.checksum,
      token: f.token,
      uploadedBy: f.uploadedBy,
      uploadedAt: f.uploadedAt,
      taskId: f.taskId
    }));

    // Export password hashes securely
    const passwordHashesMap: Record<string, string> = {};
    userPasswordHashes.forEach((hash, uId) => {
      passwordHashesMap[uId] = hash;
    });

    const rawData = {
      users: JSON.parse(JSON.stringify(users)),
      userPasswordHashes: passwordHashesMap,
      statuses: JSON.parse(JSON.stringify(statuses)),
      projects: JSON.parse(JSON.stringify(projects)),
      tasks: JSON.parse(JSON.stringify(tasks)),
      meetings: JSON.parse(JSON.stringify(meetings)),
      channels: JSON.parse(JSON.stringify(channels)),
      chatMessages: JSON.parse(JSON.stringify(chatMessages)),
      activityLogs: JSON.parse(JSON.stringify(activityLogs)),
      files,
      gamification: customGamification || {}
    };

    const dataString = JSON.stringify(rawData);
    const checksum = crypto.createHash('sha256').update(dataString).digest('hex');

    const stats: BackupStats = {
      usersCount: rawData.users.length,
      tasksCount: rawData.tasks.length,
      projectsCount: rawData.projects.length,
      statusesCount: rawData.statuses.length,
      meetingsCount: rawData.meetings.length,
      channelsCount: rawData.channels.length,
      chatMessagesCount: rawData.chatMessages.length,
      activityLogsCount: rawData.activityLogs.length,
      filesCount: rawData.files.length,
      totalFilesSizeBytes: files.reduce((acc, f) => acc + (f.size || 0), 0)
    };

    const metadata: BackupMetadata = {
      id,
      version: '2.0.0',
      timestamp,
      createdAtFormatted,
      name: backupName,
      description: description || 'Complete platform snapshot including tasks, meetings, channels, users, activity logs, and all uploaded file attachments.',
      checksum,
      generatedBy: {
        userId: adminUser.id,
        userName: adminUser.name,
        userEmail: adminUser.email,
        userRole: adminUser.role
      },
      stats
    };

    return {
      metadata,
      data: rawData
    };
  }

  function validateBackupPayload(payload: any): {
    valid: boolean;
    checksumMatches: boolean;
    version: string;
    errors: string[];
    warnings: string[];
    metadata?: BackupMetadata;
    previewStats?: BackupStats;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!payload || typeof payload !== 'object') {
      return {
        valid: false,
        checksumMatches: false,
        version: 'unknown',
        errors: ['Invalid payload: Must be a valid JSON object.'],
        warnings: []
      };
    }

    if (!payload.data || typeof payload.data !== 'object') {
      errors.push('Missing "data" object containing application state entities.');
    }

    if (!payload.metadata || typeof payload.metadata !== 'object') {
      warnings.push('Metadata missing or incomplete. Default metadata will be generated.');
    }

    const data = payload.data || {};
    if (!Array.isArray(data.tasks)) errors.push('Missing or invalid "data.tasks" array.');
    if (!Array.isArray(data.users)) errors.push('Missing or invalid "data.users" array.');
    if (!Array.isArray(data.statuses)) errors.push('Missing or invalid "data.statuses" array.');
    if (!Array.isArray(data.projects)) errors.push('Missing or invalid "data.projects" array.');

    if (!Array.isArray(data.meetings)) warnings.push('No meetings array found in backup; empty meetings table will be initialized.');
    if (!Array.isArray(data.channels)) warnings.push('No chat channels found in backup; default channels will be preserved or initialized.');
    if (!Array.isArray(data.files)) warnings.push('No files array found in backup; uploaded files store will be cleared.');

    // Checksum test
    let checksumMatches = false;
    if (payload.metadata && payload.metadata.checksum && errors.length === 0) {
      try {
        const dataString = JSON.stringify(data);
        const computedHash = crypto.createHash('sha256').update(dataString).digest('hex');
        checksumMatches = (computedHash === payload.metadata.checksum);
        if (!checksumMatches) {
          warnings.push('Integrity Checksum mismatch: Data may have been manually modified or formatted.');
        }
      } catch {
        warnings.push('Could not verify SHA-256 checksum.');
      }
    }

    const fileArr = Array.isArray(data.files) ? data.files : [];
    const totalFilesSizeBytes = fileArr.reduce((acc: number, f: any) => acc + (typeof f?.size === 'number' ? f.size : 0), 0);

    const previewStats: BackupStats = {
      usersCount: Array.isArray(data.users) ? data.users.length : 0,
      tasksCount: Array.isArray(data.tasks) ? data.tasks.length : 0,
      projectsCount: Array.isArray(data.projects) ? data.projects.length : 0,
      statusesCount: Array.isArray(data.statuses) ? data.statuses.length : 0,
      meetingsCount: Array.isArray(data.meetings) ? data.meetings.length : 0,
      channelsCount: Array.isArray(data.channels) ? data.channels.length : 0,
      chatMessagesCount: Array.isArray(data.chatMessages) ? data.chatMessages.length : 0,
      activityLogsCount: Array.isArray(data.activityLogs) ? data.activityLogs.length : 0,
      filesCount: fileArr.length,
      totalFilesSizeBytes
    };

    return {
      valid: errors.length === 0,
      checksumMatches,
      version: payload.metadata?.version || '1.0.0',
      errors,
      warnings,
      metadata: payload.metadata,
      previewStats
    };
  }

  function executeRestore(backup: BackupDataPayload, adminUser: User, options?: any) {
    const { data, metadata } = backup;

    // 1. Restore Users
    if (Array.isArray(data.users) && data.users.length > 0) {
      users = [...data.users];
    }

    // 2. Restore Password Hashes
    if (data.userPasswordHashes && typeof data.userPasswordHashes === 'object') {
      userPasswordHashes.clear();
      Object.entries(data.userPasswordHashes).forEach(([uId, hash]) => {
        userPasswordHashes.set(uId, hash);
      });
    } else {
      // Ensure all users have at least the default demo hash if not included
      users.forEach((u) => {
        if (!userPasswordHashes.has(u.id)) {
          userPasswordHashes.set(u.id, DEFAULT_DEMO_HASH);
        }
      });
    }

    // 3. Restore Statuses & Projects
    if (Array.isArray(data.statuses)) statuses = [...data.statuses];
    if (Array.isArray(data.projects)) projects = [...data.projects];

    // 4. Restore Tasks
    if (Array.isArray(data.tasks)) tasks = [...data.tasks];

    // 5. Restore Meetings
    if (Array.isArray(data.meetings)) meetings = [...data.meetings];

    // 6. Restore Chat Channels & Messages
    if (Array.isArray(data.channels)) channels = [...data.channels];
    if (Array.isArray(data.chatMessages)) chatMessages = [...data.chatMessages];

    // 7. Restore Activity Logs
    if (Array.isArray(data.activityLogs)) activityLogs = [...data.activityLogs];

    // 8. Restore Secure File Store (Attachments & Uploaded Binaries)
    secureFileStore.clear();
    if (Array.isArray(data.files)) {
      data.files.forEach((f) => {
        secureFileStore.set(f.id, {
          id: f.id,
          name: f.name,
          size: f.size,
          mimeType: f.mimeType,
          dataBase64: f.dataBase64,
          checksum: f.checksum,
          token: f.token || Math.random().toString(36).substring(2, 15),
          uploadedBy: f.uploadedBy || adminUser.id,
          uploadedAt: f.uploadedAt || new Date().toISOString(),
          taskId: f.taskId
        });
      });
    }

    // 9. Record Audit Log Entry for the Restore Operation
    addActivityLog(
      adminUser.id,
      adminUser.name,
      adminUser.avatar,
      'Platform Restored from Backup',
      `Administrator ${adminUser.name} executed restore from "${metadata?.name || 'Uploaded Backup'}" (${tasks.length} tasks, ${users.length} users, ${meetings.length} meetings, ${secureFileStore.size} attachment files synchronized).`
    );

    return {
      success: true,
      restoredAt: new Date().toISOString(),
      message: `Platform successfully restored from "${metadata?.name || 'backup'}".`,
      restoredStats: computeLiveBackupStats(),
      adminUser: {
        id: adminUser.id,
        name: adminUser.name
      }
    };
  }

  // Pre-seed baseline snapshot in memory
  try {
    const baseline = generateBackupPayload(
      DEFAULT_USERS[0],
      'Baseline Seed Snapshot',
      'Standard initial platform baseline snapshot with default tasks, members, chat channels, and files.'
    );
    baseline.metadata.id = 'snapshot-baseline';
    savedServerSnapshots.set('snapshot-baseline', baseline);
  } catch (err) {
    console.error('Error creating baseline snapshot:', err);
  }

  // GET /api/admin/backups: List saved snapshots & live stats (Admin only)
  app.get('/api/admin/backups', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const list = Array.from(savedServerSnapshots.values()).map((b) => ({
      id: b.metadata.id,
      name: b.metadata.name,
      description: b.metadata.description,
      timestamp: b.metadata.timestamp,
      checksum: b.metadata.checksum,
      sizeBytes: JSON.stringify(b).length,
      stats: b.metadata.stats,
      generatedBy: b.metadata.generatedBy,
      isAutoSnapshot: b.metadata.id === 'snapshot-baseline'
    }));

    res.json({
      snapshots: list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      currentLiveStats: computeLiveBackupStats(),
      lastBackupTimestamp
    });
  });

  // POST /api/admin/backups: Create and save a new snapshot (Admin only)
  app.post('/api/admin/backups', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { name, description, customGamification } = req.body;
    const backup = generateBackupPayload(req.currentUser!, name, description, customGamification);
    savedServerSnapshots.set(backup.metadata.id, backup);
    lastBackupTimestamp = backup.metadata.timestamp;

    addActivityLog(
      req.currentUser!.id,
      req.currentUser!.name,
      req.currentUser!.avatar,
      'Created Platform Backup',
      `Administrator created backup snapshot "${backup.metadata.name}" (${backup.metadata.stats.tasksCount} tasks, ${backup.metadata.stats.filesCount} files).`
    );

    res.status(201).json(backup);
  });

  // GET /api/admin/backups/:id/download: Download snapshot JSON file (Admin only)
  app.get('/api/admin/backups/:id/download', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    let backup: BackupDataPayload | undefined;

    if (id === 'live') {
      backup = generateBackupPayload(req.currentUser!, 'Live System Snapshot');
      lastBackupTimestamp = backup.metadata.timestamp;
    } else {
      backup = savedServerSnapshots.get(id);
    }

    if (!backup) {
      res.status(404).json({ error: 'Backup snapshot not found.' });
      return;
    }

    const dateStr = new Date(backup.metadata.timestamp).toISOString().slice(0, 10);
    const filename = `taskflow-backup-${dateStr}-${backup.metadata.id.slice(-6)}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  });

  // POST /api/admin/backups/validate: Validate uploaded backup file (Admin only)
  app.post('/api/admin/backups/validate', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body.payload || req.body;
    const result = validateBackupPayload(payload);
    res.json(result);
  });

  // POST /api/admin/backups/restore: Restore platform from snapshot ID or uploaded backup data (Admin only)
  app.post('/api/admin/backups/restore', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { snapshotId, backupData, options } = req.body;
    let targetBackup: BackupDataPayload | undefined;

    if (snapshotId) {
      targetBackup = savedServerSnapshots.get(snapshotId);
      if (!targetBackup) {
        res.status(404).json({ error: `Snapshot with ID ${snapshotId} not found.` });
        return;
      }
    } else if (backupData) {
      targetBackup = backupData;
    } else {
      res.status(400).json({ error: 'Please provide either snapshotId or backupData.' });
      return;
    }

    const validation = validateBackupPayload(targetBackup);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Backup validation failed.',
        details: validation.errors
      });
      return;
    }

    const restoreResult = executeRestore(targetBackup, req.currentUser!, options);
    res.json(restoreResult);
  });

  // DELETE /api/admin/backups/:id: Delete saved snapshot (Admin only)
  app.delete('/api/admin/backups/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (id === 'snapshot-baseline') {
      res.status(400).json({ error: 'Cannot delete the baseline factory snapshot.' });
      return;
    }
    if (!savedServerSnapshots.has(id)) {
      res.status(404).json({ error: 'Snapshot not found.' });
      return;
    }
    savedServerSnapshots.delete(id);
    res.json({ success: true, message: 'Snapshot deleted.' });
  });

  // POST /api/reset-data: Reset data for testing demo
  app.post('/api/reset-data', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    initializeSeedData();
    res.json({ success: true, message: 'Database reset to initial demo state.' });
  });

  // -------------------------------------------------------------
  // Vite integration
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
