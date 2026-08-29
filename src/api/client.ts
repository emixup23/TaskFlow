import { Task, Status, User, ActivityLog, DashboardStats, Priority, TaskCodeSnippet, CodeLanguage, Project } from '../types';

let currentUserId = localStorage.getItem('taskflow_user_id') || 'user-admin-1';

export function setApiUserId(id: string) {
  currentUserId = id;
  localStorage.setItem('taskflow_user_id', id);
}

export function getApiUserId(): string {
  return currentUserId;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    ...(options.headers || {})
  };

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
  addComment: (taskId: string, content: string) =>
    request<Task>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
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
  resetDemoData: () => request<{ success: boolean; message: string }>('/api/reset-data', { method: 'POST' })
};
