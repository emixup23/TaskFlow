import {
  Task,
  Status,
  User,
  ActivityLog,
  DashboardStats,
  Priority,
  TaskCodeSnippet,
  CodeLanguage,
  Project,
  ChatMessage,
  ChatChannel,
  ChatMessageAttachment,
  VoiceNoteData,
  Meeting,
  MeetingAttachment,
  TaskTimeLog,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  BackupSnapshotSummary,
  BackupStats,
  BackupDataPayload,
  RestoreValidationResult,
  RestoreResult,
  RestoreOptions,
  SystemRole,
  UserPrivileges,
  BatchAccessUpdatePayload,
  AccessSummaryStats,
  DailyTask,
  NotificationItem,
  Form,
  FormResponse,
  Note,
  NoteDirectory,
  SecurityAuditReport,
  ListerTask,
  ListerSyncPayload,
  ListerSyncResponse
} from '../types';

import { STORAGE_KEYS } from '../constants/storageKeys';

let currentUserId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || '' : '';
let currentAuthToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || '' : '';

export function setApiUserId(id: string) {
  currentUserId = id;
  if (id) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  }
}

export function getApiUserId(): string {
  return currentUserId;
}

export function setApiAuthToken(token: string) {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

export function getApiAuthToken(): string {
  return currentAuthToken;
}

async function request<T>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(currentUserId ? { 'x-user-id': currentUserId } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
    headers['x-auth-token'] = currentAuthToken;
  }

  const isGetOrHead = !options.method || options.method === 'GET' || options.method === 'HEAD';

  try {
    const response = await fetch(path, { ...options, headers });

    if (!response.ok) {
      // If server returns temporary 502/503/504 gateway response during restarts and request is idempotent, retry
      if (retries > 0 && isGetOrHead && (response.status === 502 || response.status === 503 || response.status === 504)) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return request<T>(path, options, retries - 1);
      }

      let errorMsg = `Request failed (${response.status})`;
      try {
        const data = await response.json();
        if (data.error) errorMsg = data.error;
      } catch {
        // Ignore
      }
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (err: any) {
    // If it's a network disconnection / server restart error (Failed to fetch, NetworkError), retry idempotent calls
    const isNetworkError =
      err?.name === 'TypeError' ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('Load failed');

    if (retries > 0 && isGetOrHead && isNetworkError) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return request<T>(path, options, retries - 1);
    }
    throw err;
  }
}

export const api = {
  // Authentication & Session
  login: (credentials: LoginCredentials) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  register: (credentials: RegisterCredentials) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  logout: () =>
    request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST'
    }),
  getAuthMe: () =>
    request<{ user: User; privileges: User['privileges'] }>('/api/auth/me'),
  switchDemoUser: (userId: string) =>
    request<AuthResponse>('/api/auth/switch-demo-user', {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),
  changePassword: (data: { currentPassword?: string; newPassword?: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Current user & Users
  getCurrentUser: () => request<User>('/api/current-user'),
  getUsers: () => request<User[]>('/api/users'),
  createUser: (data: Partial<User>) =>
    request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateUser: (id: string, data: Partial<User>) =>
    request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  updateUserStatus: (id: string, status: 'active' | 'inactive' | 'suspended') =>
    request<User>(`/api/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE'
    }),

  // Statuses
  getStatuses: () => request<Status[]>('/api/statuses'),
  createStatus: (data: { name: string; color: string; description?: string; isDone?: boolean }) =>
    request<Status>('/api/statuses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateStatus: (id: string, data: Partial<Status>) =>
    request<Status>(`/api/statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  reorderStatuses: (orderedIds: string[]) =>
    request<Status[]>('/api/statuses/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds })
    }),
  deleteStatus: (id: string, fallbackStatusId?: string) =>
    request<{ success: boolean; message: string; statuses: Status[] }>(
      `/api/statuses/${id}${fallbackStatusId ? `?fallbackStatusId=${fallbackStatusId}` : ''}`,
      { method: 'DELETE' }
    ),

  // Projects
  getProjects: () => request<Project[]>('/api/projects'),
  createProject: (data: Partial<Project>) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteProject: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/projects/${id}`, {
      method: 'DELETE'
    }),

  // Tasks
  getTasks: () => request<Task[]>('/api/tasks'),
  getTask: (id: string) => request<Task>(`/api/tasks/${id}`),
  createTask: (data: {
    title: string;
    projectId?: string;
    description?: string;
    statusId: string;
    priority: Priority;
    assigneeIds: string[];
    dueDate?: string;
    tags?: string[];
    subtasks?: { title: string }[];
  }) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createBatchTasks: (tasks: {
    title: string;
    projectId?: string;
    description?: string;
    statusId: string;
    priority: Priority;
    assigneeIds: string[];
    dueDate?: string;
    tags?: string[];
    subtasks?: { title: string }[];
  }[]) =>
    request<Task[]>('/api/tasks/batch', {
      method: 'POST',
      body: JSON.stringify({ tasks })
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  updateTaskCode: (id: string, data: { codeSnippets?: TaskCodeSnippet[]; codeSnippet?: string; codeLanguage?: CodeLanguage }) =>
    request<Task>(`/api/tasks/${id}/code`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteTask: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE'
    }),

  // Lister Two-Way Task Synchronization
  syncTasks: async (
    payload: ListerSyncPayload,
    options?: { baseUrl?: string; apiKey?: string }
  ): Promise<ListerSyncResponse> => {
    const rawStoredUrl = localStorage.getItem(STORAGE_KEYS.LISTER_API_BASE_URL);
    const storedApiKey = localStorage.getItem(STORAGE_KEYS.LISTER_API_KEY) || '';

    const defaultUrl = 'https://ais-pre-qyqoe3bbej7dvas46lbdfd-899663363473.europe-west2.run.app';
    const baseUrl = (options?.baseUrl || rawStoredUrl || defaultUrl).replace(/\/+$/, '');
    const apiKey = options?.apiKey !== undefined ? options.apiKey : storedApiKey;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Attempt 1: Call configured remote Lister endpoint directly
    try {
      const response = await fetch(`${baseUrl}/api/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return data as ListerSyncResponse;
      }

      console.warn(`Lister remote sync returned HTTP ${response.status}. Falling back to dev server sync endpoint.`);
    } catch (err) {
      console.warn('Network error reaching remote Lister API. Falling back to dev server sync endpoint:', err);
    }

    // Attempt 2: Fallback to local application dev server /api/sync endpoint
    return request<ListerSyncResponse>('/api/sync', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Subtasks
  addSubtask: (taskId: string, title: string) =>
    request<Task>(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title })
    }),
  updateSubtask: (taskId: string, subtaskId: string, data: { completed?: boolean; title?: string }) =>
    request<Task>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteSubtask: (taskId: string, subtaskId: string) =>
    request<Task>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'DELETE'
    }),

  // Comments
  addComment: (taskId: string, content: string, mentions?: string[]) =>
    request<Task>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, mentions })
    }),
  deleteComment: (taskId: string, commentId: string) =>
    request<Task>(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE'
    }),
  toggleCommentReaction: (taskId: string, commentId: string, emoji: string) =>
    request<Task>(`/api/tasks/${taskId}/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),

  // Attachments
  addAttachment: (taskId: string, data: { name: string; size: number; type: string; url?: string; base64Data?: string }) =>
    request<Task>(`/api/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteAttachment: (taskId: string, attachmentId: string) =>
    request<Task>(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    }),

  // Activity logs & Stats
  getActivityLogs: () => request<ActivityLog[]>('/api/activity'),
  getStats: () => request<DashboardStats>('/api/stats'),
  resetDemoData: () => request<{ success: boolean; message: string }>('/api/reset-data', { method: 'POST' }),

  // Chat & Chat Groups
  getChatChannels: () => request<ChatChannel[]>('/api/chat/channels'),
  createChatChannel: (data: {
    name: string;
    description?: string;
    topic?: string;
    type?: 'channel' | 'group_dm';
    isPrivate?: boolean;
    memberIds?: string[];
    color?: string;
  }) =>
    request<ChatChannel>('/api/chat/channels', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateChatChannel: (id: string, data: Partial<ChatChannel>) =>
    request<ChatChannel>(`/api/chat/channels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteChatChannel: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/chat/channels/${id}`, {
      method: 'DELETE'
    }),
  startDirectChat: (targetUserId: string) =>
    request<ChatChannel>('/api/chat/direct', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    }),
  getChatMessages: (channelId: string) => request<ChatMessage[]>(`/api/chat/channels/${channelId}/messages`),
  sendChatMessage: (
    channelId: string,
    data: {
      content?: string;
      replyToId?: string;
      attachments?: ChatMessageAttachment[];
      voiceNote?: VoiceNoteData;
      linkedTaskId?: string;
      mentions?: string[];
    }
  ) =>
    request<ChatMessage>(`/api/chat/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  editChatMessage: (channelId: string, messageId: string, content: string) =>
    request<ChatMessage>(`/api/chat/channels/${channelId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    }),
  deleteChatMessage: (channelId: string, messageId: string) =>
    request<{ success: boolean; message: string }>(`/api/chat/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE'
    }),
  toggleMessageReaction: (channelId: string, messageId: string, emoji: string) =>
    request<ChatMessage>(`/api/chat/channels/${channelId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),
  togglePinMessage: (channelId: string, messageId: string) =>
    request<{ message: ChatMessage; pinnedMessageIds: string[] }>(`/api/chat/channels/${channelId}/messages/${messageId}/pin`, {
      method: 'POST'
    }),
  markChannelAsRead: (channelId: string) =>
    request<{ success: boolean; channelId: string; readAt: string }>(`/api/chat/channels/${channelId}/read`, {
      method: 'POST'
    }),

  // Time Tracker for Tasks
  addTimeLog: (
    taskId: string,
    data: {
      durationSeconds: number;
      startTime?: string;
      endTime?: string;
      description?: string;
      isBillable?: boolean;
    }
  ) =>
    request<Task>(`/api/tasks/${taskId}/time-logs`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteTimeLog: (taskId: string, logId: string) =>
    request<Task>(`/api/tasks/${taskId}/time-logs/${logId}`, {
      method: 'DELETE'
    }),
  toggleTaskTimer: (taskId: string, action: 'start' | 'stop', data?: { description?: string; isBillable?: boolean }) =>
    request<Task>(`/api/tasks/${taskId}/timer`, {
      method: 'POST',
      body: JSON.stringify({ action, ...data })
    }),

  // Meetings
  getMeetings: () => request<Meeting[]>('/api/meetings'),
  getMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}`),
  createMeeting: (data: Partial<Meeting>) =>
    request<Meeting>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateMeeting: (id: string, data: Partial<Meeting>) =>
    request<Meeting>(`/api/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteMeeting: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/meetings/${id}`, {
      method: 'DELETE'
    }),
  addMeetingAttachment: (
    meetingId: string,
    data: {
      name: string;
      size: number;
      type: string;
      url?: string;
      base64Data?: string;
    }
  ) =>
    request<Meeting>(`/api/meetings/${meetingId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteMeetingAttachment: (meetingId: string, attachmentId: string) =>
    request<Meeting>(`/api/meetings/${meetingId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    }),
  addMeetingLog: (
    meetingId: string,
    data: {
      details: string;
      action?: string;
    }
  ) =>
    request<{ meeting: Meeting; log: any }>(`/api/meetings/${meetingId}/logs`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  toggleMeetingTopic: (meetingId: string, topicId: string) =>
    request<{ meeting: Meeting; topic: any; log: any }>(`/api/meetings/${meetingId}/topics/${topicId}/toggle`, {
      method: 'POST'
    }),

  // Backup & Restore Engine (Admin Only)
  getBackups: () =>
    request<{
      snapshots: BackupSnapshotSummary[];
      currentLiveStats: BackupStats;
      lastBackupTimestamp: string | null;
    }>('/api/admin/backups'),

  createBackup: (data: { name?: string; description?: string; customGamification?: any }) =>
    request<BackupDataPayload>('/api/admin/backups', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  validateBackup: (payload: any) =>
    request<RestoreValidationResult>('/api/admin/backups/validate', {
      method: 'POST',
      body: JSON.stringify({ payload })
    }),

  restoreBackup: (data: {
    snapshotId?: string;
    backupData?: BackupDataPayload;
    options?: RestoreOptions;
  }) =>
    request<RestoreResult>('/api/admin/backups/restore', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteBackupSnapshot: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/backups/${id}`, {
      method: 'DELETE'
    }),

  downloadBackup: async (id: string = 'live') => {
    const token = getApiAuthToken();
    const userId = getApiUserId();
    const response = await fetch(`/api/admin/backups/${id}/download`, {
      headers: {
        'x-user-id': userId,
        ...(token ? { Authorization: `Bearer ${token}`, 'x-auth-token': token } : {})
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to download backup (${response.status})`);
    }
    const blob = await response.blob();
    return blob;
  },

  // Access Manager & Role Governance (Admin Only)
  getRoles: () => request<SystemRole[]>('/api/admin/roles'),

  createRole: (data: Partial<SystemRole>) =>
    request<SystemRole>('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateRole: (id: string, data: Partial<SystemRole> & { applyToExistingUsers?: boolean }) =>
    request<SystemRole>(`/api/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteRole: (id: string) =>
    request<{ success: boolean; message: string; reassignedCount: number }>(`/api/admin/roles/${id}`, {
      method: 'DELETE'
    }),

  addRoleMembers: (roleId: string, userIds: string[], applyDefaultPrivileges: boolean = true) =>
    request<{ success: boolean; addedCount: number; role: SystemRole; message: string; users: User[] }>(
      `/api/admin/roles/${roleId}/members/add`,
      {
        method: 'POST',
        body: JSON.stringify({ userIds, applyDefaultPrivileges })
      }
    ),

  removeRoleMembers: (
    roleId: string,
    userIds: string[],
    fallbackRoleId: string = 'member',
    applyFallbackPrivileges: boolean = true
  ) =>
    request<{ success: boolean; removedCount: number; role: SystemRole; fallbackRole: SystemRole; message: string; users: User[] }>(
      `/api/admin/roles/${roleId}/members/remove`,
      {
        method: 'POST',
        body: JSON.stringify({ userIds, fallbackRoleId, applyFallbackPrivileges })
      }
    ),

  batchUpdateAccess: (data: BatchAccessUpdatePayload) =>
    request<{ success: boolean; affectedCount: number; users: User[] }>('/api/admin/access/batch-update', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  resetUserPrivilegesToRole: (userId: string) =>
    request<{ success: boolean; user: User }>(`/api/admin/access/reset-user-privileges/${userId}`, {
      method: 'POST'
    }),

  cloneUserPrivileges: (sourceUserId: string, targetUserIds: string[]) =>
    request<{ success: boolean; clonedCount: number; users: User[] }>('/api/admin/access/clone-user-privileges', {
      method: 'POST',
      body: JSON.stringify({ sourceUserId, targetUserIds })
    }),

  getAccessSummary: () => request<AccessSummaryStats>('/api/admin/access/summary'),

  // Daily Tasks Management API
  getDailyTasks: (params?: { userId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.date) query.set('date', params.date);
    const qs = query.toString();
    return request<{
      tasks: DailyTask[];
      userSummaries: Record<string, { total: number; completed: number; rate: number }>;
      total: number;
    }>(`/api/daily-tasks${qs ? `?${qs}` : ''}`);
  },

  createDailyTask: (data: Partial<DailyTask>) =>
    request<DailyTask>('/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateDailyTask: (id: string, data: Partial<DailyTask>) =>
    request<DailyTask>(`/api/daily-tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteDailyTask: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/daily-tasks/${id}`, {
      method: 'DELETE'
    }),

  rolloverDailyTasks: (userId?: string, fromDate?: string) =>
    request<{ success: boolean; count: number; rolledOverIds: string[]; message: string }>(
      '/api/daily-tasks/rollover',
      {
        method: 'POST',
        body: JSON.stringify({ userId, fromDate })
      }
    ),

  // Demo Data Management (Admin only)
  clearDemoData: () =>
    request<{ success: boolean; message: string; tasksCount: number; projectsCount: number }>(
      '/api/clear-demo-data',
      { method: 'POST' }
    ),

  // Notifications API
  getNotifications: (unreadOnly?: boolean) => {
    const qs = unreadOnly ? '?unreadOnly=true' : '';
    return request<{ notifications: NotificationItem[]; unreadCount: number }>(`/api/notifications${qs}`);
  },

  markNotificationRead: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/notifications/${id}/read`, {
      method: 'PUT'
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; count: number }>('/api/notifications/read-all', {
      method: 'PUT'
    }),

  deleteNotification: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/notifications/${id}`, {
      method: 'DELETE'
    }),

  clearAllNotifications: () =>
    request<{ success: boolean }>('/api/notifications/clear-all', {
      method: 'DELETE'
    }),

  // Form Builder & Responses API
  getForms: () => request<Form[]>('/api/forms'),

  getForm: (id: string) => request<Form>(`/api/forms/${id}`),

  createForm: (data: Partial<Form>) =>
    request<Form>('/api/forms', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateForm: (id: string, data: Partial<Form>) =>
    request<Form>(`/api/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteForm: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/forms/${id}`, {
      method: 'DELETE'
    }),

  getFormResponses: (formId: string) => request<FormResponse[]>(`/api/forms/${formId}/responses`),
  getMyFormResponse: (formId: string) => request<FormResponse>(`/api/forms/${formId}/my-response`),

  submitFormResponse: (formId: string, answers: Record<string, any>) =>
    request<FormResponse>(`/api/forms/${formId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }),

  remindFormPendingUsers: (formId: string) =>
    request<{ success: boolean; remindedCount: number; pendingUsers: { id: string; name: string; email?: string }[] }>(
      `/api/forms/${formId}/remind`,
      {
        method: 'POST'
      }
    ),

  deleteFormResponse: (formId: string, responseId: string) =>
    request<{ success: boolean; id: string }>(`/api/forms/${formId}/responses/${responseId}`, {
      method: 'DELETE'
    }),

  // Notepad Space (Private & Shared Notes)
  getNotes: (params?: { filter?: string; tag?: string; search?: string; color?: string; directoryId?: string }) => {
    const query = new URLSearchParams();
    if (params?.filter) query.set('filter', params.filter);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.color) query.set('color', params.color);
    if (params?.directoryId) query.set('directoryId', params.directoryId);
    const qs = query.toString();
    return request<Note[]>(`/api/notes${qs ? `?${qs}` : ''}`);
  },

  getNote: (id: string) => request<Note>(`/api/notes/${id}`),

  createNote: (data: Partial<Note>) =>
    request<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateNote: (id: string, data: Partial<Note>) =>
    request<Note>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  moveNoteToDirectory: (id: string, directoryId: string | null) =>
    request<Note>(`/api/notes/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ directoryId })
    }),

  shareNote: (
    id: string,
    data: {
      isPrivate: boolean;
      isSharedWithAll?: boolean;
      sharedWithUserIds?: string[];
      allowCollaboration?: boolean;
    }
  ) =>
    request<Note>(`/api/notes/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  togglePinNote: (id: string) =>
    request<Note>(`/api/notes/${id}/pin`, {
      method: 'POST'
    }),

  deleteNote: (id: string) =>
    request<{ success: boolean; id: string }>(`/api/notes/${id}`, {
      method: 'DELETE'
    }),

  // Note Directories (Folders)
  getNoteDirectories: () => request<NoteDirectory[]>('/api/notes/directories'),

  createNoteDirectory: (data: Partial<NoteDirectory>) =>
    request<NoteDirectory>('/api/notes/directories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateNoteDirectory: (id: string, data: Partial<NoteDirectory>) =>
    request<NoteDirectory>(`/api/notes/directories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteNoteDirectory: (id: string) =>
    request<{ success: boolean; id: string; message?: string }>(`/api/notes/directories/${id}`, {
      method: 'DELETE'
    }),

  // Security Audit
  getSecurityAuditReport: () => request<SecurityAuditReport>('/api/admin/security/audit'),

  // AI Voice Assistant
  assistantChat: (data: {
    message: string;
    context?: any;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
  }) =>
    request<{
      reply: string;
      action?: {
        type:
          | 'NAVIGATE'
          | 'CREATE_TASK'
          | 'SEARCH'
          | 'FILTER_PRIORITY'
          | 'FILTER_STATUS'
          | 'CLEAR_FILTERS'
          | 'OPEN_MODAL'
          | 'SUMMARIZE'
          | 'NONE';
        payload?: any;
      };
    }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Persistence & Storage Health
  getPersistenceStatus: () =>
    request<{
      persisted: boolean;
      filePath: string;
      fileSizeBytes: number;
      lastSavedAt: string;
      counts: Record<string, number>;
    }>('/api/persistence/status'),
  savePersistenceNow: () =>
    request<{
      success: boolean;
      message: string;
      lastSavedAt: string;
    }>('/api/persistence/save', {
      method: 'POST'
    }),
  resetDefaultData: () =>
    request<{
      success: boolean;
      message: string;
    }>('/api/persistence/reset-defaults', {
      method: 'POST'
    })
};

export const apiClient = api;
