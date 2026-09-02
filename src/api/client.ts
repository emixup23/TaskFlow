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
  RestoreOptions
} from '../types';

let currentUserId = localStorage.getItem('taskflow_user_id') || 'user-admin-1';
let currentAuthToken = localStorage.getItem('taskflow_auth_token') || '';

export function setApiUserId(id: string) {
  currentUserId = id;
  localStorage.setItem('taskflow_user_id', id);
}

export function getApiUserId(): string {
  return currentUserId;
}

export function setApiAuthToken(token: string) {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem('taskflow_auth_token', token);
  } else {
    localStorage.removeItem('taskflow_auth_token');
  }
}

export function getApiAuthToken(): string {
  return currentAuthToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    ...(options.headers as Record<string, string> || {})
  };

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
    headers['x-auth-token'] = currentAuthToken;
  }

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
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
  }
};
