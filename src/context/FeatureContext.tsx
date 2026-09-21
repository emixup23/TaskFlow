import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ViewMode } from '../types';

export type FeatureCategory = 'views' | 'tools' | 'admin';

export interface AppFeature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  iconName: string;
  isViewMode?: boolean;
  viewMode?: ViewMode;
  defaultVisible: boolean;
  badge?: string;
}

export const ALL_APP_FEATURES: AppFeature[] = [
  // Core Views
  {
    id: 'kanban',
    name: 'Workflow (Kanban Board)',
    description: 'Agile columns, drag-and-drop cards, priority tags, and status pipelines.',
    category: 'views',
    iconName: 'Workflow',
    isViewMode: true,
    viewMode: 'kanban',
    defaultVisible: true
  },
  {
    id: 'daily',
    name: 'Daily Tasks',
    description: 'Focused day planner, overdue alerts, and daily goal completion checklist.',
    category: 'views',
    iconName: 'CalendarCheck2',
    isViewMode: true,
    viewMode: 'daily',
    defaultVisible: true
  },
  {
    id: 'tickets',
    name: 'Ticket System',
    description: 'Customer support, issue tracking, ticket statuses, and SLA response prioritization.',
    category: 'views',
    iconName: 'Ticket',
    isViewMode: true,
    viewMode: 'tickets',
    defaultVisible: true
  },
  {
    id: 'list',
    name: 'Bulk Tasks Grid',
    description: 'High-density spreadsheet table for batch editing, sorting, and bulk task updates.',
    category: 'views',
    iconName: 'Table',
    isViewMode: true,
    viewMode: 'list',
    defaultVisible: true
  },
  {
    id: 'timeline',
    name: 'Timeline & Roadmap',
    description: 'Gantt chart visualization for project milestones, schedules, and sprint roadmaps.',
    category: 'views',
    iconName: 'GitCommit',
    isViewMode: true,
    viewMode: 'timeline',
    defaultVisible: true
  },
  {
    id: 'graph',
    name: 'Relationship Graph',
    description: 'Interactive node graph illustrating task dependencies, blockers, and relationships.',
    category: 'views',
    iconName: 'Network',
    isViewMode: true,
    viewMode: 'graph',
    defaultVisible: true
  },
  {
    id: 'chat',
    name: 'Team Chat',
    description: 'Real-time channel messaging, direct messages, attachments, and collaborative chat.',
    category: 'views',
    iconName: 'MessageSquare',
    isViewMode: true,
    viewMode: 'chat',
    defaultVisible: true
  },
  {
    id: 'meetings',
    name: 'Meeting Scheduler',
    description: 'Meeting calendar, agenda manager, attendee tracking, and video call integration.',
    category: 'views',
    iconName: 'Video',
    isViewMode: true,
    viewMode: 'meetings',
    defaultVisible: true
  },
  {
    id: 'forms',
    name: 'Form Builder',
    description: 'Custom intake form builder to collect requests, bug reports, and survey data.',
    category: 'views',
    iconName: 'FileSpreadsheet',
    isViewMode: true,
    viewMode: 'forms',
    defaultVisible: true
  },
  {
    id: 'notes',
    name: 'Notepad Space',
    description: 'Private and shared workspace scratchpad, markdown documents, and directory notes.',
    category: 'views',
    iconName: 'StickyNote',
    isViewMode: true,
    viewMode: 'notes',
    defaultVisible: true
  },
  {
    id: 'rewards',
    name: 'Gamification & Rewards',
    description: 'Experience points (XP), achievement badges, level progression, and team leaderboard.',
    category: 'views',
    iconName: 'Trophy',
    isViewMode: true,
    viewMode: 'rewards',
    defaultVisible: true
  },
  {
    id: 'dashboard',
    name: 'Executive Analytics Dashboard',
    description: 'KPI metric cards, task completion velocity charts, and workload distribution.',
    category: 'views',
    iconName: 'BarChart3',
    isViewMode: true,
    viewMode: 'dashboard',
    defaultVisible: true
  },

  // Header & Workspace Tools
  {
    id: 'voice_assistant',
    name: 'Voice Assistant',
    description: 'Speech recognition, natural voice command execution, audio feedback, and Voice HUD.',
    category: 'tools',
    iconName: 'Mic',
    defaultVisible: true
  },
  {
    id: 'lister_sync',
    name: 'Lister Two-Way Cloud Sync',
    description: 'Two-way background synchronization with external Lister task engine and conflict resolution.',
    category: 'tools',
    iconName: 'RefreshCw',
    defaultVisible: true
  },
  {
    id: 'gamification_badge',
    name: 'Gamification Header Badge',
    description: 'Top header badge displaying level avatar, XP overview popover, and quick rewards shortcut.',
    category: 'tools',
    iconName: 'Award',
    defaultVisible: true
  },
  {
    id: 'quick_search',
    name: 'Header Quick Search',
    description: 'Global instant search bar in header with keyboard shortcut (/) support.',
    category: 'tools',
    iconName: 'Search',
    defaultVisible: true
  },
  {
    id: 'notifications',
    name: 'Notification Center',
    description: 'Notification bell, activity feed popover, unread counter badges, and audio chime.',
    category: 'tools',
    iconName: 'Bell',
    defaultVisible: true
  },
  {
    id: 'new_task_btn',
    name: 'New Task Quick Button',
    description: 'Prominent header action button to create tasks instantly with shortcut (N).',
    category: 'tools',
    iconName: 'PlusCircle',
    defaultVisible: true
  },

  // Administration & Governance
  {
    id: 'users',
    name: 'Team User Directory',
    description: 'Team member directory, role assignment, user activation, and profile manager.',
    category: 'admin',
    iconName: 'Users',
    isViewMode: true,
    viewMode: 'users',
    defaultVisible: true
  },
  {
    id: 'access',
    name: 'Access Manager (RBAC)',
    description: 'Role-based access control, security permissions matrix, and role templates.',
    category: 'admin',
    iconName: 'Shield',
    isViewMode: true,
    viewMode: 'access',
    defaultVisible: true
  },
  {
    id: 'audit',
    name: 'Security Audit Trail',
    description: 'Immutable activity audit logs, administrative action history, and compliance logging.',
    category: 'admin',
    iconName: 'History',
    isViewMode: true,
    viewMode: 'audit',
    defaultVisible: true
  },
  {
    id: 'backup',
    name: 'Disaster Recovery & Backup',
    description: 'One-click workspace JSON export, automated snapshot backups, and restore center.',
    category: 'admin',
    iconName: 'Database',
    isViewMode: true,
    viewMode: 'backup',
    defaultVisible: true
  }
];

const STORAGE_KEY = 'taskflow_features_visibility_v1';

interface FeatureContextType {
  features: AppFeature[];
  isFeatureVisible: (featureId: string) => boolean;
  setFeatureVisible: (featureId: string, visible: boolean) => void;
  toggleFeature: (featureId: string) => void;
  showAllFeatures: () => void;
  resetFeatures: () => void;
  visibleCount: number;
  totalCount: number;
  isFeaturesModalOpen: boolean;
  setIsFeaturesModalOpen: (open: boolean) => void;
  openFeaturesModal: () => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize visibility state from localStorage
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          // Merge with defaults so new features are visible by default
          const initial: Record<string, boolean> = {};
          ALL_APP_FEATURES.forEach((feat) => {
            initial[feat.id] = parsed[feat.id] !== undefined ? Boolean(parsed[feat.id]) : feat.defaultVisible;
          });
          return initial;
        }
      }
    } catch {
      // Fallback
    }
    const initial: Record<string, boolean> = {};
    ALL_APP_FEATURES.forEach((feat) => {
      initial[feat.id] = feat.defaultVisible;
    });
    return initial;
  });

  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibilityMap));
    } catch {
      // ignore
    }
  }, [visibilityMap]);

  const isFeatureVisible = (featureId: string): boolean => {
    return visibilityMap[featureId] ?? true;
  };

  const setFeatureVisible = (featureId: string, visible: boolean) => {
    setVisibilityMap((prev) => ({
      ...prev,
      [featureId]: visible
    }));
  };

  const toggleFeature = (featureId: string) => {
    setVisibilityMap((prev) => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const showAllFeatures = () => {
    const updated: Record<string, boolean> = {};
    ALL_APP_FEATURES.forEach((feat) => {
      updated[feat.id] = true;
    });
    setVisibilityMap(updated);
  };

  const resetFeatures = () => {
    const updated: Record<string, boolean> = {};
    ALL_APP_FEATURES.forEach((feat) => {
      updated[feat.id] = feat.defaultVisible;
    });
    setVisibilityMap(updated);
  };

  const visibleCount = ALL_APP_FEATURES.filter((f) => isFeatureVisible(f.id)).length;
  const totalCount = ALL_APP_FEATURES.length;

  const openFeaturesModal = () => {
    setIsFeaturesModalOpen(true);
  };

  return (
    <FeatureContext.Provider
      value={{
        features: ALL_APP_FEATURES,
        isFeatureVisible,
        setFeatureVisible,
        toggleFeature,
        showAllFeatures,
        resetFeatures,
        visibleCount,
        totalCount,
        isFeaturesModalOpen,
        setIsFeaturesModalOpen,
        openFeaturesModal
      }}
    >
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = (): FeatureContextType => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};
