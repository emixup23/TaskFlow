import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
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
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
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
let channels: ChatChannel[] = [];
let chatMessages: ChatMessage[] = [];
let channelReadState: Map<string, Map<string, string>> = new Map(); // channelId -> (userId -> isoString)

function initializeSeedData() {
  users = [...DEFAULT_USERS];
  statuses = [...DEFAULT_STATUSES];
  projects = [...DEFAULT_PROJECTS];
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

// Auth Middleware: Resolve user from `x-user-id` header
interface AuthenticatedRequest extends Request {
  currentUser?: User;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = (req.headers['x-user-id'] as string) || 'user-admin-1';
  const foundUser = users.find((u) => u.id === userId);
  if (!foundUser) {
    // Default to first user if not found
    req.currentUser = users[0];
  } else {
    req.currentUser = foundUser;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(authMiddleware);

  // -------------------------------------------------------------
  // API Routes
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
