export type UserRole = 'admin' | 'basic' | 'manager' | 'lead' | 'member' | 'auditor' | 'viewer' | string;

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  department?: string;
  title?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface UserPrivileges {
  // Task & Workflows
  canCreateTask: boolean;
  canEditAnyTask: boolean;
  canDeleteTask: boolean;
  canManageStatuses: boolean;
  canManageProjects?: boolean;
  // Governance & Administration
  canManageUsers: boolean;
  canManageRoles?: boolean;
  canViewAuditLogs: boolean;
  canManageBackups?: boolean;
  canExportData: boolean;
  // Files & Attachments
  canUploadAttachments: boolean;
  canDeleteAttachments: boolean;
  // Collaboration & Meetings
  canHostMeetings?: boolean;
  canManageChannels?: boolean;
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  color: string;
  badge: string;
  icon?: string;
  isSystemRole: boolean;
  isEditable: boolean;
  defaultPrivileges: UserPrivileges;
  userCount?: number;
}

export type PrivilegeCategory = 'task' | 'admin' | 'storage' | 'collab';
export type RiskLevel = 'high' | 'medium' | 'low';

export interface PrivilegeDefinition {
  key: keyof UserPrivileges;
  label: string;
  category: PrivilegeCategory;
  categoryLabel: string;
  description: string;
  risk: RiskLevel;
}

export interface BatchAccessUpdatePayload {
  userIds: string[];
  role?: string;
  privileges?: Partial<UserPrivileges>;
  action?: 'setRole' | 'grantPrivilege' | 'revokePrivilege' | 'resetToRoleDefault';
  privilegeKey?: keyof UserPrivileges;
}

export interface AccessSummaryStats {
  totalUsers: number;
  totalRoles: number;
  adminsCount: number;
  elevatedUsersCount: number;
  customDriftUsersCount: number;
  restrictedUsersCount: number;
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
  reactions?: Record<string, string[]>; // emoji char -> array of userIds
  mentions?: string[]; // array of mentioned userIds or names
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

export type DailyTimeBlock = 'morning' | 'afternoon' | 'evening' | 'flexible';

export type DailyCategory =
  | 'development'
  | 'design'
  | 'review'
  | 'operations'
  | 'security'
  | 'meeting'
  | 'admin'
  | 'general';

export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  timeBlock: DailyTimeBlock;
  timeSlot?: string; // e.g. "09:30 AM"
  estimatedMinutes: number;
  priority: Priority;
  category: DailyCategory;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  linkedTaskId?: string;
  linkedTaskTitle?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

export type ViewMode =
  | 'kanban'
  | 'tickets'
  | 'list'
  | 'timeline'
  | 'daily'
  | 'meetings'
  | 'dashboard'
  | 'audit'
  | 'rewards'
  | 'users'
  | 'access'
  | 'graph'
  | 'chat'
  | 'backup';

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MeetingMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'organizer' | 'required' | 'optional';
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
  uploadedByName?: string;
  uploadedAt: string;
  extension?: 'pdf' | 'txt' | 'csv' | 'docx' | 'mp3' | string;
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
  date?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  projectId?: string;
  memberIds: string[];
  members?: MeetingMember[];
  topics: MeetingTopic[];
  notes: string;
  attachments: MeetingAttachment[];
  logs?: MeetingLog[];
  status: MeetingStatus;
  createdBy: string;
  createdByName?: string;
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
  senderRole?: UserRole | string;
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
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  linkedTaskId?: string;
  linkedTaskTitle?: string;
  linkedTaskPriority?: Priority;
  linkedTaskStatusId?: string;
  linkedTaskStatusName?: string;
  linkedTaskStatusColor?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'channel' | 'group_dm' | 'direct';
  displayName?: string;
  displayTopic?: string;
  displayAvatar?: string;
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
  memberCount?: number;
  pinnedMessageIds?: string[];
  isMuted?: boolean;
}

export type NotificationType =
  | 'chat_dm'
  | 'chat_channel'
  | 'mention'
  | 'task_assign'
  | 'task_comment'
  | 'status_change';

export interface NotificationItem {
  id: string;
  userId: string; // recipient
  type: NotificationType;
  title: string;
  message: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  channelId?: string;
  channelName?: string;
  taskId?: string;
  taskTitle?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

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

export interface MetricsVisibility {
  showMetricsBar: boolean;
  showActiveTasks: boolean;
  showCompletionRate: boolean;
  showCriticalBlockers: boolean;
  showTeamCapacity: boolean;
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

export type ThemeMode = 'light' | 'dark' | 'system';

export type FontFamilyOption = 'system' | 'inter' | 'jakarta' | 'mono' | 'space' | 'fira';

export type RadiusOption = 'sharp' | 'precision' | 'modern' | 'soft' | 'round';

export type DensityOption = 'compact' | 'standard' | 'relaxed';

export interface CustomThemeConfig {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  primaryColor: string; // Hex color code (e.g. #3b82f6)
  primaryHoverColor?: string;
  primaryLightColor?: string; // Tint for background badges (e.g. rgba(59, 130, 246, 0.15))
  backgroundColor: string; // Main canvas background (e.g. #0d0d0d or #f8fafc)
  surfaceColor: string; // Card/sidebar/modal surface (e.g. #141414 or #ffffff)
  surfaceSecondaryColor: string; // Inner container/table header (e.g. #1a1a1a or #f1f5f9)
  borderColor: string; // Border lines (e.g. #262626 or #e2e8f0)
  textColor: string; // Primary text (e.g. #f8fafc or #0f172a)
  textMutedColor: string; // Secondary text (e.g. #a1a1aa or #64748b)
  radius: RadiusOption; // Radius preset
  radiusPx: string; // CSS radius value like '0px', '3px', '6px', '10px', '14px'
  fontFamily: FontFamilyOption;
  density: DensityOption;
  highContrast: boolean;
  isCustom?: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: 'dark' | 'light';
  badge: string;
  config: CustomThemeConfig;
}

// -------------------------------------------------------------
// Backup & Restore Types
// -------------------------------------------------------------

export interface BackupFileStoreItem {
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

export interface BackupStats {
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

export interface BackupMetadata {
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

export interface BackupDataPayload {
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
    dailyTasks?: DailyTask[];
    files: BackupFileStoreItem[];
    gamification?: Record<string, any>;
  };
}

export interface BackupSnapshotSummary {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  checksum: string;
  sizeBytes: number;
  stats: BackupStats;
  generatedBy: BackupMetadata['generatedBy'];
  isAutoSnapshot?: boolean;
}

export interface RestoreValidationResult {
  valid: boolean;
  checksumMatches: boolean;
  version: string;
  errors: string[];
  warnings: string[];
  metadata?: BackupMetadata;
  previewStats?: BackupStats;
}

export interface RestoreOptions {
  mode?: 'clean_overwrite' | 'merge';
  restoreUsers?: boolean;
  restoreTasks?: boolean;
  restoreFiles?: boolean;
  restoreChat?: boolean;
  restoreMeetings?: boolean;
  restoreAuditLogs?: boolean;
}

export interface RestoreResult {
  success: boolean;
  restoredAt: string;
  message: string;
  restoredStats: BackupStats;
  adminUser: {
    id: string;
    name: string;
  };
}


