export type UserRole = 'admin' | 'basic';

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
  role: UserRole;
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

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Status {
  id: string;
  name: string;
  color: string; // Tailwind color or hex
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
  priority: Priority;
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

export interface FilterState {
  search: string;
  projectId?: string;
  statusIds: string[];
  priorities: Priority[];
  assigneeIds: string[];
  dueDateFilter: 'all' | 'overdue' | 'today' | 'this_week' | 'no_date';
  tag: string;
}

export type ViewMode = 'kanban' | 'list' | 'timeline' | 'dashboard' | 'audit' | 'rewards' | 'users' | 'graph';

export type GraphNodeType = 'user' | 'task' | 'tag';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sublabel?: string;
  avatar?: string;
  color?: string;
  statusId?: string;
  priority?: Priority;
  data?: any;
  radius?: number;
  // D3 simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'assigned' | 'created' | 'tagged' | 'collaborator' | 'subtask';
  label?: string;
  color?: string;
  value?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'speed' | 'checklist' | 'collaboration' | 'streak' | 'mastery';
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  type: 'daily' | 'weekly';
}

export interface UserGamification {
  userId: string;
  xp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  tasksCompleted: number;
  subtasksCompleted: number;
  commentsCount: number;
  attachmentsCount: number;
  achievements: Achievement[];
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  title: string;
  department: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  completedTasks: number;
  badgeCount: number;
  rank: number;
}

export interface XpEvent {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}


export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueTasks: number;
  tasksDueToday: number;
  tasksByStatus: { statusId: string; statusName: string; color: string; count: number }[];
  tasksByPriority: { priority: Priority; count: number; color: string }[];
  userWorkload: { userId: string; userName: string; avatar: string; assignedCount: number; completedCount: number }[];
  recentActivity: ActivityLog[];
}
