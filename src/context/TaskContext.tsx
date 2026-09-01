import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Task,
  Status,
  User,
  ActivityLog,
  DashboardStats,
  FilterState,
  ViewMode,
  Priority,
  TaskCodeSnippet,
  CodeLanguage,
  Project,
  MetricsVisibility,
  Meeting,
  MeetingTopic,
  MeetingAttachment,
  TaskTimeLog
} from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import confetti from 'canvas-confetti';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[];
  statuses: Status[];
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;
  editingProject: Project | null;
  setEditingProject: (project: Project | null) => void;
  createProject: (data: {
    name: string;
    description?: string;
    color: string;
    ownerId: string;
    memberIds: string[];
  }) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  activityLogs: ActivityLog[];
  stats: DashboardStats | null;
  isLoading: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  graphSelectedUserId: string | null;
  setGraphSelectedUserId: (id: string | null) => void;
  navigateToGraph: (userId?: string) => void;
  metricsVisibility: MetricsVisibility;
  setMetricsVisibility: React.Dispatch<React.SetStateAction<MetricsVisibility>>;
  toggleMetric: (key: keyof MetricsVisibility) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  generateTaskLink: (taskId: string) => string;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isStatusManagerOpen: boolean;
  setIsStatusManagerOpen: (open: boolean) => void;
  isUserModalOpen: boolean;
  setIsUserModalOpen: (open: boolean) => void;
  selectedProfileUser: User | null;
  setSelectedProfileUser: (user: User | null) => void;
  openUserProfile: (userOrId: string | User, isEdit?: boolean) => void;
  closeUserProfile: () => void;
  isProfileEditMode: boolean;
  setIsProfileEditMode: (edit: boolean) => void;
  toasts: Toast[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
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
  }) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  updateTaskCode: (id: string, data: { codeSnippets?: TaskCodeSnippet[]; codeSnippet?: string; codeLanguage?: CodeLanguage }) => Promise<Task | null>;
  moveTaskStatus: (taskId: string, newStatusId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, data: { completed?: boolean; title?: string }) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addComment: (taskId: string, content: string, mentions?: string[]) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  toggleCommentReaction: (taskId: string, commentId: string, emoji: string) => Promise<void>;
  addAttachment: (taskId: string, data: { name: string; size: number; type: string; url?: string }) => Promise<void>;
  deleteAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  createStatus: (data: { name: string; color: string; description?: string; isDone?: boolean }) => Promise<boolean>;
  updateStatus: (id: string, data: Partial<Status>) => Promise<boolean>;
  reorderStatuses: (orderedIds: string[]) => Promise<boolean>;
  deleteStatus: (id: string, fallbackStatusId?: string) => Promise<boolean>;
  resetDemoData: () => Promise<void>;
  // Meetings State & Handlers
  meetings: Meeting[];
  selectedMeeting: Meeting | null;
  setSelectedMeeting: (meeting: Meeting | null) => void;
  isCreateMeetingModalOpen: boolean;
  setIsCreateMeetingModalOpen: (open: boolean) => void;
  isMeetingDetailModalOpen: boolean;
  setIsMeetingDetailModalOpen: (open: boolean) => void;
  openMeetingDetail: (meeting: Meeting) => void;
  createMeeting: (data: Partial<Meeting>) => Promise<Meeting | null>;
  updateMeeting: (id: string, data: Partial<Meeting>) => Promise<Meeting | null>;
  deleteMeeting: (id: string) => Promise<boolean>;
  addMeetingAttachment: (meetingId: string, fileData: { name: string; size: number; type: string; url?: string; base64Data?: string }) => Promise<Meeting | null>;
  deleteMeetingAttachment: (meetingId: string, attachmentId: string) => Promise<Meeting | null>;
  addMeetingLog: (meetingId: string, data: { details: string; action?: string }) => Promise<Meeting | null>;
  toggleMeetingTopic: (meetingId: string, topicId: string) => Promise<Meeting | null>;
  // Task Time Tracking Handlers
  addTimeLog: (taskId: string, data: { durationSeconds: number; description?: string; isBillable?: boolean; startTime?: string; endTime?: string }) => Promise<Task | null>;
  deleteTimeLog: (taskId: string, logId: string) => Promise<Task | null>;
  toggleTaskTimer: (taskId: string, action: 'start' | 'stop', description?: string, isBillable?: boolean) => Promise<Task | null>;
}

const initialFilters: FilterState = {
  search: '',
  statusIds: [],
  priorities: [],
  assigneeIds: [],
  dueDateFilter: 'all',
  tag: ''
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users, isAdmin } = useAuth();
  const {
    awardTaskCompleted,
    awardSubtaskCompleted,
    awardCommentPosted,
    awardAttachmentUploaded,
    awardTaskCreated
  } = useGamification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_view_mode') as ViewMode | null;
      const validModes: ViewMode[] = ['kanban', 'tickets', 'list', 'timeline', 'graph', 'chat', 'meetings', 'dashboard', 'users', 'audit', 'rewards'];
      if (saved && validModes.includes(saved)) {
        return saved;
      }
    }
    return 'kanban';
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskflow_view_mode', mode);
    }
  }, []);

  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const setIsSidebarOpen = useCallback((action: React.SetStateAction<boolean>) => {
    setIsSidebarOpenState((prev) => {
      const next = typeof action === 'function' ? (action as (p: boolean) => boolean)(prev) : action;
      if (typeof window !== 'undefined') {
        localStorage.setItem('taskflow_sidebar_open', String(next));
      }
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, [setIsSidebarOpen]);
  const [graphSelectedUserId, setGraphSelectedUserId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskIdState] = useState<string | null>(null);

  // User Profile Modal State
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [isProfileEditMode, setIsProfileEditMode] = useState<boolean>(false);

  const openUserProfile = useCallback((userOrId: string | User, isEdit?: boolean) => {
    if (typeof userOrId === 'object' && userOrId !== null) {
      setSelectedProfileUser(userOrId);
    } else if (typeof userOrId === 'string') {
      const found = users.find((u) => u.id === userOrId) || (currentUser?.id === userOrId ? currentUser : null);
      if (found) {
        setSelectedProfileUser(found);
      } else {
        setSelectedProfileUser({
          id: userOrId,
          name: userOrId,
          email: `${userOrId}@taskflow.io`,
          role: 'basic',
          status: 'active'
        });
      }
    }
    setIsProfileEditMode(Boolean(isEdit));
  }, [users, currentUser]);

  const closeUserProfile = useCallback(() => {
    setSelectedProfileUser(null);
    setIsProfileEditMode(false);
  }, []);

  // Keep selectedProfileUser in sync when users or currentUser changes
  useEffect(() => {
    if (selectedProfileUser) {
      const updated = users.find((u) => u.id === selectedProfileUser.id) ||
        (currentUser?.id === selectedProfileUser.id ? currentUser : null);
      if (updated) {
        setSelectedProfileUser((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    }
  }, [users, currentUser]);

  // Set selected task and sync URL search params
  const setSelectedTaskId = useCallback((id: string | null) => {
    setSelectedTaskIdState(id);
    try {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('taskId', id);
      } else {
        url.searchParams.delete('taskId');
        url.searchParams.delete('task');
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {
      // Ignore in sandbox environments
    }
  }, []);

  // Helper to generate a direct shareable deep-link for any task
  const generateTaskLink = useCallback((taskId: string) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('taskId', taskId);
      return url.toString();
    } catch (e) {
      return `${window.location.origin}${window.location.pathname}?taskId=${taskId}`;
    }
  }, []);

  // Check URL on initial mount for deep-linked task
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const taskIdFromUrl = params.get('taskId') || params.get('task');
      if (taskIdFromUrl) {
        setSelectedTaskIdState(taskIdFromUrl);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const defaultMetricsVisibility: MetricsVisibility = {
    showMetricsBar: true,
    showActiveTasks: true,
    showCompletionRate: true,
    showCriticalBlockers: true,
    showTeamCapacity: true
  };

  const [metricsVisibility, setMetricsVisibility] = useState<MetricsVisibility>(() => {
    try {
      const saved = localStorage.getItem('taskflow_metrics_visibility_v3');
      if (saved) {
        return { ...defaultMetricsVisibility, ...JSON.parse(saved) };
      }
    } catch (e) {
      // Ignore
    }
    return defaultMetricsVisibility;
  });

  useEffect(() => {
    try {
      localStorage.setItem('taskflow_metrics_visibility_v3', JSON.stringify(metricsVisibility));
    } catch (e) {
      // Ignore
    }
  }, [metricsVisibility]);

  const toggleMetric = useCallback((key: keyof MetricsVisibility) => {
    setMetricsVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const navigateToGraph = useCallback((userId?: string) => {
    if (userId) {
      setGraphSelectedUserId(userId);
    }
    setViewMode('graph');
  }, []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Meetings State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isCreateMeetingModalOpen, setIsCreateMeetingModalOpen] = useState(false);
  const [isMeetingDetailModalOpen, setIsMeetingDetailModalOpen] = useState(false);

  const openMeetingDetail = useCallback((meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsMeetingDetailModalOpen(true);
  }, []);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [fetchedTasks, fetchedStatuses, fetchedProjects, fetchedLogs, fetchedMeetings] = await Promise.all([
        api.getTasks(),
        api.getStatuses(),
        api.getProjects().catch(() => []),
        api.getActivityLogs(),
        api.getMeetings().catch(() => [])
      ]);

      setTasks(fetchedTasks);
      setStatuses(fetchedStatuses);
      setProjects(fetchedProjects);
      setActivityLogs(fetchedLogs);
      setMeetings(fetchedMeetings);

      if (currentUser.role === 'admin') {
        try {
          const fetchedStats = await api.getStats();
          setStats(fetchedStats);
        } catch (err) {
          console.warn('Could not fetch admin stats:', err);
        }
      } else {
        setStats(null);
      }
    } catch (err: any) {
      console.error('Failed to load platform data:', err);
      addToast('error', err.message || 'Error loading platform data');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData, currentUser?.id]);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Filter tasks in memory for responsive UX
  const filteredTasks = tasks.filter((task) => {
    // Project filter
    if (activeProjectId !== 'all') {
      if (task.projectId !== activeProjectId) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTag = task.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    if (filters.statusIds.length > 0 && !filters.statusIds.includes(task.statusId)) {
      return false;
    }

    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }

    if (filters.assigneeIds.length > 0) {
      const hasMatchingAssignee = task.assigneeIds.some((id) => filters.assigneeIds.includes(id));
      if (!hasMatchingAssignee) return false;
    }

    if (filters.tag && !task.tags.includes(filters.tag)) {
      return false;
    }

    if (filters.dueDateFilter !== 'all') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (filters.dueDateFilter === 'no_date') {
        if (task.dueDate) return false;
      } else if (!task.dueDate) {
        return false;
      } else if (filters.dueDateFilter === 'overdue') {
        const isDone = statuses.find((s) => s.id === task.statusId)?.isDone;
        if (isDone || task.dueDate >= todayStr) return false;
      } else if (filters.dueDateFilter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (filters.dueDateFilter === 'this_week') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        if (task.dueDate < todayStr || task.dueDate > nextWeekStr) return false;
      }
    }

    return true;
  });

  const createProject = async (data: {
    name: string;
    description?: string;
    color: string;
    ownerId: string;
    memberIds: string[];
  }) => {
    try {
      const newProj = await api.createProject(data);
      setProjects((prev) => [newProj, ...prev]);
      addToast('success', `Project "${newProj.name}" created successfully`);
      refreshData();
      return newProj;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create project');
      return null;
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    try {
      const updated = await api.updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      addToast('success', `Project updated successfully`);
      refreshData();
      return updated;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update project');
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId('all');
      }
      addToast('success', 'Project removed');
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete project');
      return false;
    }
  };

  const createTask = async (data: {
    title: string;
    projectId?: string;
    description?: string;
    statusId: string;
    priority: Priority;
    assigneeIds: string[];
    dueDate?: string;
    tags?: string[];
    subtasks?: { title: string }[];
  }) => {
    try {
      const taskData = {
        ...data,
        projectId: data.projectId || (activeProjectId !== 'all' ? activeProjectId : undefined)
      };
      const newTask = await api.createTask(taskData);
      setTasks((prev) => [newTask, ...prev]);
      addToast('success', `Task "${newTask.title}" created successfully`);
      awardTaskCreated();
      refreshData();
      return newTask;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create task');
      return null;
    }
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    try {
      const oldTask = tasks.find((t) => t.id === id);
      const updated = await api.updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast('success', 'Task updated');

      // Check if newly marked done
      if (data.statusId && oldTask && oldTask.statusId !== data.statusId) {
        const targetStatus = statuses.find((s) => s.id === data.statusId);
        if (targetStatus?.isDone) {
          awardTaskCompleted(updated);
        }
      }

      refreshData();
      return updated;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update task');
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTaskId === id) setSelectedTaskId(null);
      addToast('success', 'Task deleted');
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete task');
      return false;
    }
  };

  const updateTaskCode = async (
    id: string,
    data: { codeSnippets?: TaskCodeSnippet[]; codeSnippet?: string; codeLanguage?: CodeLanguage }
  ) => {
    try {
      const updated = await api.updateTaskCode(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update code snippets');
      return null;
    }
  };

  const moveTaskStatus = async (taskId: string, newStatusId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.statusId === newStatusId) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, statusId: newStatusId } : t))
    );

    const targetStatus = statuses.find((s) => s.id === newStatusId);
    if (targetStatus?.isDone) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      awardTaskCompleted(task);
    }

    try {
      await api.updateTask(taskId, { statusId: newStatusId });
      addToast('success', `Moved to ${targetStatus?.name || 'new column'}`);
      refreshData();
    } catch (err: any) {
      // Revert
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, statusId: task.statusId } : t))
      );
      addToast('error', err.message || 'Failed to move task');
    }
  };

  const addSubtask = async (taskId: string, title: string) => {
    try {
      const updated = await api.addSubtask(taskId, title);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      addToast('success', 'Checklist item added');
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add subtask');
    }
  };

  const updateSubtask = async (taskId: string, subtaskId: string, data: { completed?: boolean; title?: string }) => {
    try {
      const oldTask = tasks.find((t) => t.id === taskId);
      const oldSubtask = oldTask?.subtasks?.find((s) => s.id === subtaskId);
      const wasCompleted = Boolean(oldSubtask?.completed);

      const updated = await api.updateSubtask(taskId, subtaskId, data);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

      if (data.completed && !wasCompleted) {
        awardSubtaskCompleted();
      }

      // If all subtasks are now completed, celebration confetti
      if (data.completed && updated.subtasks.length > 0 && updated.subtasks.every((st) => st.completed)) {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 }
        });
      }

      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update subtask');
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const updated = await api.deleteSubtask(taskId, subtaskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      addToast('info', 'Checklist item removed');
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove subtask');
    }
  };

  const addComment = async (taskId: string, content: string, mentions?: string[]) => {
    try {
      const updated = await api.addComment(taskId, content, mentions);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      addToast('success', 'Comment posted');
      awardCommentPosted();
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add comment');
    }
  };

  const deleteComment = async (taskId: string, commentId: string) => {
    try {
      const updated = await api.deleteComment(taskId, commentId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      addToast('info', 'Comment removed');
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete comment');
    }
  };

  const toggleCommentReaction = async (taskId: string, commentId: string, emoji: string) => {
    // Optimistic reaction update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedComments = t.comments.map((c) => {
          if (c.id !== commentId) return c;
          const currentReactions = { ...(c.reactions || {}) };
          const userList = [...(currentReactions[emoji] || [])];
          const uid = currentUser?.id || 'user-admin-1';
          const idx = userList.indexOf(uid);
          if (idx > -1) {
            userList.splice(idx, 1);
            if (userList.length === 0) {
              delete currentReactions[emoji];
            } else {
              currentReactions[emoji] = userList;
            }
          } else {
            userList.push(uid);
            currentReactions[emoji] = userList;
          }
          return { ...c, reactions: currentReactions };
        });
        return { ...t, comments: updatedComments };
      })
    );

    try {
      const updated = await api.toggleCommentReaction(taskId, commentId, emoji);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err: any) {
      refreshData();
      addToast('error', err.message || 'Failed to update reaction');
    }
  };

  const addAttachment = async (taskId: string, data: { name: string; size: number; type: string; url?: string }) => {
    try {
      const updated = await api.addAttachment(taskId, data);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      addToast('success', `File "${data.name}" attached`);
      awardAttachmentUploaded();
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add attachment');
    }
  };

  const deleteAttachment = async (taskId: string, attachmentId: string) => {
    try {
      const updated = await api.deleteAttachment(taskId, attachmentId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      addToast('info', 'Attachment deleted');
      refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete attachment');
    }
  };

  const createStatus = async (data: { name: string; color: string; description?: string; isDone?: boolean }) => {
    try {
      const newStatus = await api.createStatus(data);
      setStatuses((prev) => [...prev, newStatus]);
      addToast('success', `Column "${newStatus.name}" created`);
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create status');
      return false;
    }
  };

  const updateStatus = async (id: string, data: Partial<Status>) => {
    try {
      const updated = await api.updateStatus(id, data);
      setStatuses((prev) => prev.map((s) => (s.id === id ? updated : s)));
      addToast('success', 'Status updated');
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update status');
      return false;
    }
  };

  const reorderStatuses = async (orderedIds: string[]) => {
    try {
      const updated = await api.reorderStatuses(orderedIds);
      setStatuses(updated);
      addToast('success', 'Workflow sequence reordered');
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reorder statuses');
      return false;
    }
  };

  const deleteStatus = async (id: string, fallbackStatusId?: string) => {
    try {
      const res = await api.deleteStatus(id, fallbackStatusId);
      setStatuses(res.statuses);
      addToast('success', res.message);
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete status');
      return false;
    }
  };

  const resetDemoData = async () => {
    try {
      await api.resetDemoData();
      setMetricsVisibility(defaultMetricsVisibility);
      try {
        localStorage.removeItem('taskflow_metrics_visibility');
        localStorage.setItem('taskflow_metrics_visibility_v2', JSON.stringify(defaultMetricsVisibility));
      } catch (e) {}
      addToast('info', 'Platform reset to initial seed state');
      await refreshData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reset demo data');
    }
  };

  // Meetings Handlers
  const createMeeting = async (data: Partial<Meeting>) => {
    try {
      const newMeeting = await api.createMeeting(data);
      setMeetings((prev) => [newMeeting, ...prev]);
      addToast('success', `Meeting "${newMeeting.title}" scheduled`);
      refreshData();
      return newMeeting;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create meeting');
      return null;
    }
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>) => {
    try {
      const updated = await api.updateMeeting(id, data);
      setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(updated);
      }
      addToast('success', 'Meeting updated');
      refreshData();
      return updated;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update meeting');
      return null;
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      await api.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(null);
        setIsMeetingDetailModalOpen(false);
      }
      addToast('success', 'Meeting removed');
      refreshData();
      return true;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete meeting');
      return false;
    }
  };

  const addMeetingAttachment = async (
    meetingId: string,
    fileData: { name: string; size: number; type: string; url?: string; base64Data?: string }
  ) => {
    try {
      const updatedMeeting = await api.addMeetingAttachment(meetingId, fileData);
      setMeetings((prev) => prev.map((m) => (m.id === meetingId ? updatedMeeting : m)));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(updatedMeeting);
      }
      addToast('success', `Attached "${fileData.name}" to meeting`);
      return updatedMeeting;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to upload meeting attachment');
      return null;
    }
  };

  const deleteMeetingAttachment = async (meetingId: string, attachmentId: string) => {
    try {
      const updatedMeeting = await api.deleteMeetingAttachment(meetingId, attachmentId);
      setMeetings((prev) => prev.map((m) => (m.id === meetingId ? updatedMeeting : m)));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(updatedMeeting);
      }
      addToast('success', 'Meeting attachment removed');
      return updatedMeeting;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete meeting attachment');
      return null;
    }
  };

  const addMeetingLog = async (meetingId: string, data: { details: string; action?: string }) => {
    try {
      const result = await api.addMeetingLog(meetingId, data);
      const updatedMeeting = result.meeting;
      setMeetings((prev) => prev.map((m) => (m.id === meetingId ? updatedMeeting : m)));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(updatedMeeting);
      }
      addToast('success', 'Meeting log recorded');
      refreshData();
      return updatedMeeting;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to record meeting log');
      return null;
    }
  };

  const toggleMeetingTopic = async (meetingId: string, topicId: string) => {
    try {
      const result = await api.toggleMeetingTopic(meetingId, topicId);
      const updatedMeeting = result.meeting;
      setMeetings((prev) => prev.map((m) => (m.id === meetingId ? updatedMeeting : m)));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(updatedMeeting);
      }
      refreshData();
      return updatedMeeting;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to toggle agenda topic');
      return null;
    }
  };

  // Time Tracker Handlers
  const addTimeLog = async (
    taskId: string,
    data: { durationSeconds: number; description?: string; isBillable?: boolean; startTime?: string; endTime?: string }
  ) => {
    try {
      const updatedTask = await api.addTimeLog(taskId, data);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      addToast('success', 'Work session time logged successfully');
      refreshData();
      return updatedTask;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to log time');
      return null;
    }
  };

  const deleteTimeLog = async (taskId: string, logId: string) => {
    try {
      const updatedTask = await api.deleteTimeLog(taskId, logId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      addToast('success', 'Time log removed');
      refreshData();
      return updatedTask;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete time log');
      return null;
    }
  };

  const toggleTaskTimer = async (
    taskId: string,
    action: 'start' | 'stop',
    description?: string,
    isBillable?: boolean
  ) => {
    try {
      const updatedTask = await api.toggleTaskTimer(taskId, action, { description, isBillable });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      if (action === 'start') {
        addToast('info', 'Live timer started for task');
      } else {
        addToast('success', 'Timer stopped and duration logged');
      }
      refreshData();
      return updatedTask;
    } catch (err: any) {
      addToast('error', err.message || 'Failed to toggle task timer');
      return null;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        filteredTasks,
        statuses,
        projects,
        activeProjectId,
        setActiveProjectId,
        isProjectModalOpen,
        setIsProjectModalOpen,
        editingProject,
        setEditingProject,
        createProject,
        updateProject,
        deleteProject,
        activityLogs,
        stats,
        isLoading,
        filters,
        setFilters,
        resetFilters,
        viewMode,
        setViewMode,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        graphSelectedUserId,
        setGraphSelectedUserId,
        navigateToGraph,
        metricsVisibility,
        setMetricsVisibility,
        toggleMetric,
        selectedTaskId,
        setSelectedTaskId,
        generateTaskLink,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isStatusManagerOpen,
        setIsStatusManagerOpen,
        isUserModalOpen,
        setIsUserModalOpen,
        selectedProfileUser,
        setSelectedProfileUser,
        openUserProfile,
        closeUserProfile,
        isProfileEditMode,
        setIsProfileEditMode,
        toasts,
        addToast,
        removeToast,
        refreshData,
        createTask,
        updateTask,
        deleteTask,
        updateTaskCode,
        moveTaskStatus,
        addSubtask,
        updateSubtask,
        deleteSubtask,
        addComment,
        deleteComment,
        toggleCommentReaction,
        addAttachment,
        deleteAttachment,
        createStatus,
        updateStatus,
        reorderStatuses,
        deleteStatus,
        resetDemoData,
        // Meetings
        meetings,
        selectedMeeting,
        setSelectedMeeting,
        isCreateMeetingModalOpen,
        setIsCreateMeetingModalOpen,
        isMeetingDetailModalOpen,
        setIsMeetingDetailModalOpen,
        openMeetingDetail,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        addMeetingAttachment,
        deleteMeetingAttachment,
        addMeetingLog,
        toggleMeetingTopic,
        // Time Tracker
        addTimeLog,
        deleteTimeLog,
        toggleTaskTimer
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
