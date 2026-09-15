import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Trash2,
  Inbox,
  AlertCircle,
  Eye,
  EyeOff,
  Columns3,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sparkles,
  Clock,
  Flag,
  Save,
  Layers,
  X
} from 'lucide-react';
import { Status, Task, Priority } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from './TaskCard';
import { WorkflowIcon } from './icons/SidebarIcons';
import { STORAGE_KEYS } from '../constants/storageKeys';

export type ColumnSortOption =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'count-desc'
  | 'count-asc'
  | 'active-first'
  | 'done-first'
  | 'color';

export type TaskSortOption =
  | 'default'
  | 'priority-desc'
  | 'priority-asc'
  | 'due-asc'
  | 'due-desc'
  | 'title-asc'
  | 'newest';

const COLUMN_SORT_CONFIG: {
  id: ColumnSortOption;
  label: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'default',
    label: 'Pipeline Sequence',
    badge: 'Pipeline',
    desc: 'Standard workflow order configured in workspace settings',
    icon: Layers
  },
  {
    id: 'name-asc',
    label: 'Name (A → Z)',
    badge: 'A → Z',
    desc: 'Alphabetical status title ascending',
    icon: ArrowUp
  },
  {
    id: 'name-desc',
    label: 'Name (Z → A)',
    badge: 'Z → A',
    desc: 'Alphabetical status title descending',
    icon: ArrowDown
  },
  {
    id: 'count-desc',
    label: 'Most Tasks First',
    badge: 'Tasks ↓',
    desc: 'Highest active workload columns first to spot bottlenecks',
    icon: ArrowDown
  },
  {
    id: 'count-asc',
    label: 'Fewest Tasks First',
    badge: 'Tasks ↑',
    desc: 'Lowest active workload columns first',
    icon: ArrowUp
  },
  {
    id: 'active-first',
    label: 'Active First (Done Last)',
    badge: 'Active First',
    desc: 'In-progress columns first, completed/done columns placed at the end',
    icon: CheckCircle2
  },
  {
    id: 'done-first',
    label: 'Done First',
    badge: 'Done First',
    desc: 'Completed stages placed at the beginning',
    icon: Check
  },
  {
    id: 'color',
    label: 'Tone / Color Theme',
    badge: 'Color',
    desc: 'Group columns with similar status color tones',
    icon: Sparkles
  }
];

const TASK_SORT_CONFIG: {
  id: TaskSortOption;
  label: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'default',
    label: 'Manual / Drag Order',
    badge: 'Manual',
    desc: 'Natural card order and manual drag positions',
    icon: Layers
  },
  {
    id: 'priority-desc',
    label: 'Priority (Urgent → Low)',
    badge: 'Priority ↓',
    desc: 'Urgent and high-impact tasks at the top',
    icon: Flag
  },
  {
    id: 'priority-asc',
    label: 'Priority (Low → Urgent)',
    badge: 'Priority ↑',
    desc: 'Lower priority tasks first',
    icon: Flag
  },
  {
    id: 'due-asc',
    label: 'Due Date (Soonest First)',
    badge: 'Due Soon',
    desc: 'Approaching deadlines and overdue tasks first',
    icon: Clock
  },
  {
    id: 'due-desc',
    label: 'Due Date (Latest First)',
    badge: 'Due Late',
    desc: 'Furthest deadline dates first',
    icon: Clock
  },
  {
    id: 'title-asc',
    label: 'Title (A → Z)',
    badge: 'Title A-Z',
    desc: 'Alphabetical task titles',
    icon: ArrowUp
  },
  {
    id: 'newest',
    label: 'Newest Created First',
    badge: 'Newest',
    desc: 'Most recently added tasks at the top',
    icon: Sparkles
  }
];

const priorityWeight: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

export const KanbanBoard: React.FC = () => {
  const {
    statuses,
    filteredTasks,
    moveTaskStatus,
    setIsCreateModalOpen,
    setIsStatusManagerOpen,
    reorderStatuses,
    deleteStatus,
    addToast
  } = useTasks();
  const { isAdmin, currentUser } = useAuth();

  const [activeMenuStatusId, setActiveMenuStatusId] = useState<string | null>(null);
  const [draggedOverStatusId, setDraggedOverStatusId] = useState<string | null>(null);

  // Visibility toggle
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);

  // Column Sort state
  const [columnSort, setColumnSort] = useState<ColumnSortOption>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KANBAN_COLUMN_SORT);
      return (saved as ColumnSortOption) || 'default';
    } catch {
      return 'default';
    }
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Global In-Column Task Sort state
  const [taskSort, setTaskSort] = useState<TaskSortOption>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KANBAN_TASK_SORT);
      return (saved as TaskSortOption) || 'default';
    } catch {
      return 'default';
    }
  });
  const [showTaskSortMenu, setShowTaskSortMenu] = useState(false);
  const taskSortMenuRef = useRef<HTMLDivElement>(null);

  // Column-specific task sort overrides
  const [columnTaskSortOverrides, setColumnTaskSortOverrides] = useState<Record<string, TaskSortOption>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KANBAN_COL_TASK_SORTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Column visibility state persisted in localStorage
  const [hiddenStatusIds, setHiddenStatusIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIDDEN_KANBAN_COLUMNS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HIDDEN_KANBAN_COLUMNS, JSON.stringify(hiddenStatusIds));
    } catch (e) {
      console.warn('Failed to persist hidden columns:', e);
    }
  }, [hiddenStatusIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KANBAN_COLUMN_SORT, columnSort);
    } catch (e) {
      console.warn('Failed to persist column sort:', e);
    }
  }, [columnSort]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KANBAN_TASK_SORT, taskSort);
    } catch (e) {
      console.warn('Failed to persist task sort:', e);
    }
  }, [taskSort]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KANBAN_COL_TASK_SORTS, JSON.stringify(columnTaskSortOverrides));
    } catch (e) {
      console.warn('Failed to persist col task sorts:', e);
    }
  }, [columnTaskSortOverrides]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(target)) {
        setShowColumnsMenu(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setShowSortMenu(false);
      }
      if (taskSortMenuRef.current && !taskSortMenuRef.current.contains(target)) {
        setShowTaskSortMenu(false);
      }
      if (activeMenuStatusId) {
        const menuEl = document.getElementById(`col-menu-dropdown-${activeMenuStatusId}`);
        const btnEl = document.getElementById(`btn-col-menu-${activeMenuStatusId}`);
        if (menuEl && !menuEl.contains(target) && btnEl && !btnEl.contains(target)) {
          setActiveMenuStatusId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuStatusId]);

  const canCreate = isAdmin || currentUser?.privileges?.canCreateTask !== false;
  const canManageStatuses = isAdmin || Boolean(currentUser?.privileges?.canManageStatuses);

  // Group tasks by status
  const tasksByStatus: Record<string, Task[]> = {};
  statuses.forEach((s) => {
    tasksByStatus[s.id] = filteredTasks.filter((t) => t.statusId === s.id);
  });

  // Filter visible statuses
  const visibleStatuses = statuses.filter((s) => !hiddenStatusIds.includes(s.id));
  const hiddenCount = statuses.length - visibleStatuses.length;

  // Calculate sorted visible status columns
  const sortedVisibleStatuses = useMemo(() => {
    const list = [...visibleStatuses];
    switch (columnSort) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'count-desc':
        return list.sort((a, b) => {
          const countA = tasksByStatus[a.id]?.length || 0;
          const countB = tasksByStatus[b.id]?.length || 0;
          if (countB !== countA) return countB - countA;
          return a.order - b.order;
        });
      case 'count-asc':
        return list.sort((a, b) => {
          const countA = tasksByStatus[a.id]?.length || 0;
          const countB = tasksByStatus[b.id]?.length || 0;
          if (countA !== countB) return countA - countB;
          return a.order - b.order;
        });
      case 'active-first':
        return list.sort((a, b) => {
          const aDone = Boolean(a.isDone);
          const bDone = Boolean(b.isDone);
          if (aDone !== bDone) return aDone ? 1 : -1;
          return a.order - b.order;
        });
      case 'done-first':
        return list.sort((a, b) => {
          const aDone = Boolean(a.isDone);
          const bDone = Boolean(b.isDone);
          if (aDone !== bDone) return aDone ? -1 : 1;
          return a.order - b.order;
        });
      case 'color':
        return list.sort((a, b) => (a.color || '').localeCompare(b.color || '') || a.order - b.order);
      case 'default':
      default:
        return list.sort((a, b) => a.order - b.order);
    }
  }, [visibleStatuses, columnSort, tasksByStatus]);

  // Single-column navigation state & bounds
  const [activeColumnIndex, setActiveColumnIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KANBAN_ACTIVE_COLUMN);
      return saved !== null ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [isDropTargetPrev, setIsDropTargetPrev] = useState(false);
  const [isDropTargetNext, setIsDropTargetNext] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Keep activeColumnIndex within valid bounds of sortedVisibleStatuses
  const safeIndex = useMemo(() => {
    if (sortedVisibleStatuses.length === 0) return 0;
    return Math.min(Math.max(0, activeColumnIndex), sortedVisibleStatuses.length - 1);
  }, [activeColumnIndex, sortedVisibleStatuses.length]);

  // Persist active column index
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KANBAN_ACTIVE_COLUMN, safeIndex.toString());
    } catch (e) {
      console.warn('Failed to persist active column index:', e);
    }
  }, [safeIndex]);

  const prevStatus = safeIndex > 0 ? sortedVisibleStatuses[safeIndex - 1] : null;
  const nextStatus = safeIndex < sortedVisibleStatuses.length - 1 ? sortedVisibleStatuses[safeIndex + 1] : null;
  const currentStatus = sortedVisibleStatuses[safeIndex] || null;

  const handlePrevColumn = () => {
    if (safeIndex > 0) {
      setActiveColumnIndex(safeIndex - 1);
      setActiveMenuStatusId(null);
    }
  };

  const handleNextColumn = () => {
    if (safeIndex < sortedVisibleStatuses.length - 1) {
      setActiveColumnIndex(safeIndex + 1);
      setActiveMenuStatusId(null);
    }
  };

  // Keyboard navigation with ArrowLeft and ArrowRight keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const modalActive = document.querySelector('[role="dialog"], .fixed.inset-0.z-50');
      if (modalActive) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (safeIndex > 0) {
          setActiveColumnIndex(safeIndex - 1);
          setActiveMenuStatusId(null);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (safeIndex < sortedVisibleStatuses.length - 1) {
          setActiveColumnIndex(safeIndex + 1);
          setActiveMenuStatusId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeIndex, sortedVisibleStatuses.length]);

  // Touch swipe support for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (diff > 50) {
      handlePrevColumn();
    } else if (diff < -50) {
      handleNextColumn();
    }
  };

  // Sort tasks within an individual column
  const getSortedTasksForColumn = (
    statusId: string,
    rawTasks: Task[]
  ): { tasks: Task[]; activeSort: TaskSortOption } => {
    const activeSort = columnTaskSortOverrides[statusId] || taskSort;
    if (activeSort === 'default') return { tasks: rawTasks, activeSort };

    const copy = [...rawTasks];
    switch (activeSort) {
      case 'priority-desc':
        copy.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
        break;
      case 'priority-asc':
        copy.sort((a, b) => (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0));
        break;
      case 'due-asc':
        copy.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'due-desc':
        copy.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        });
        break;
      case 'title-asc':
        copy.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        copy.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        break;
    }
    return { tasks: copy, activeSort };
  };

  const toggleColumnVisibility = (statusId: string) => {
    if (hiddenStatusIds.includes(statusId)) {
      setHiddenStatusIds((prev) => prev.filter((id) => id !== statusId));
      const st = statuses.find((s) => s.id === statusId);
      addToast('info', `Shown "${st?.name || 'Column'}"`);
    } else {
      if (visibleStatuses.length <= 1) {
        addToast('error', 'At least one column must remain visible on the board.');
        return;
      }
      setHiddenStatusIds((prev) => [...prev, statusId]);
      const st = statuses.find((s) => s.id === statusId);
      addToast('info', `Hidden "${st?.name || 'Column'}"`);
    }
  };

  const handleHideSpecificColumn = (statusId: string) => {
    if (visibleStatuses.length <= 1) {
      addToast('error', 'At least one column must remain visible on the board.');
      return;
    }
    setHiddenStatusIds((prev) => [...prev, statusId]);
    setActiveMenuStatusId(null);
    const st = statuses.find((s) => s.id === statusId);
    addToast('info', `Hidden "${st?.name || 'Column'}"`);
  };

  const handleShowAllColumns = () => {
    setHiddenStatusIds([]);
    addToast('success', 'All workflow columns are now visible');
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverStatusId !== statusId) {
      setDraggedOverStatusId(statusId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, statusId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDraggedOverStatusId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    setDraggedOverStatusId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTaskStatus(taskId, targetStatusId);
    }
  };

  // Move column left, right, first, or last
  const handleMoveColumn = (statusId: string, direction: 'left' | 'right' | 'first' | 'last') => {
    const baseList =
      columnSort === 'default'
        ? [...statuses].sort((a, b) => a.order - b.order)
        : [...sortedVisibleStatuses, ...statuses.filter((s) => hiddenStatusIds.includes(s.id))];

    const currentIndex = baseList.findIndex((s) => s.id === statusId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (direction === 'left') targetIndex = currentIndex - 1;
    else if (direction === 'right') targetIndex = currentIndex + 1;
    else if (direction === 'first') targetIndex = 0;
    else if (direction === 'last') targetIndex = baseList.length - 1;

    if (targetIndex < 0 || targetIndex >= baseList.length || targetIndex === currentIndex) return;

    const item = baseList.splice(currentIndex, 1)[0];
    baseList.splice(targetIndex, 0, item);

    setColumnSort('default');
    reorderStatuses(baseList.map((s) => s.id));
    setActiveMenuStatusId(null);
    setActiveColumnIndex(targetIndex);
  };

  // Admin action: Save current sorted sequence permanently
  const handleSaveAsDefaultSequence = async () => {
    if (!canManageStatuses) return;
    const orderedVisibleIds = sortedVisibleStatuses.map((s) => s.id);
    const hidden = statuses.filter((s) => hiddenStatusIds.includes(s.id));
    const allOrderedIds = [...orderedVisibleIds, ...hidden.map((s) => s.id)];

    const success = await reorderStatuses(allOrderedIds);
    if (success) {
      setColumnSort('default');
      setShowSortMenu(false);
      addToast('success', 'Workflow sequence permanently saved as default order');
    }
  };

  const activeColumnSortConfig =
    COLUMN_SORT_CONFIG.find((c) => c.id === columnSort) || COLUMN_SORT_CONFIG[0];
  const activeTaskSortConfig =
    TASK_SORT_CONFIG.find((t) => t.id === taskSort) || TASK_SORT_CONFIG[0];
  const hasColumnOverrides = Object.keys(columnTaskSortOverrides).length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d] dark:bg-[#0d0d0d] overflow-hidden transition-colors duration-200">
      {/* Board Controls Toolbar */}
      <div className="px-3 sm:px-6 py-2 sm:py-2.5 bg-[#121212] border-b border-[#222222] flex items-center justify-between gap-2.5 shrink-0 flex-wrap">
        {/* Left: Summary, Active Column Indicator, Keyboard Hint, Hidden indicators, and Active Sort badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium shrink-0">
            <Columns3 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Workflow Column:</span>
            <strong className="text-white">
              {currentStatus ? currentStatus.name : ''}
              <span className="text-neutral-400 font-normal ml-1">
                ({sortedVisibleStatuses.length > 0 ? `${safeIndex + 1}/${sortedVisibleStatuses.length}` : '0'})
              </span>
            </strong>
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px] text-neutral-500">
            <span>Use</span>
            <kbd className="px-1.5 py-0.2 bg-[#1e1e1e] border border-neutral-700 rounded text-neutral-300 font-mono text-[10px]">
              ←
            </kbd>
            <kbd className="px-1.5 py-0.2 bg-[#1e1e1e] border border-neutral-700 rounded text-neutral-300 font-mono text-[10px]">
              →
            </kbd>
            <span>keys to navigate</span>
          </div>

          {hiddenCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] text-amber-300 shrink-0">
              <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{hiddenCount} hidden</span>
              <button
                type="button"
                onClick={handleShowAllColumns}
                className="ml-0.5 underline hover:text-white font-semibold cursor-pointer"
              >
                Unhide
              </button>
            </div>
          )}

          {/* Active Column Sort Pill Indicator */}
          {columnSort !== 'default' && (
            <div className="flex items-center gap-1 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded text-[11px] text-blue-300 shrink-0 animate-in fade-in duration-100">
              <ArrowUpDown className="w-3 h-3 text-blue-400" />
              <span>
                Columns: <strong className="text-white font-semibold">{activeColumnSortConfig.badge}</strong>
              </span>
              <button
                type="button"
                onClick={() => setColumnSort('default')}
                className="ml-1 p-0.5 hover:bg-blue-900/60 rounded text-blue-300 hover:text-white transition-colors cursor-pointer"
                title="Reset column sequence to default"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Active Card Sort Pill Indicator */}
          {(taskSort !== 'default' || hasColumnOverrides) && (
            <div className="flex items-center gap-1 bg-neutral-800/70 border border-neutral-700/80 px-2 py-0.5 rounded text-[11px] text-neutral-300 shrink-0 animate-in fade-in duration-100">
              <activeTaskSortConfig.icon className="w-3 h-3 text-amber-400" />
              <span>
                Cards: <strong className="text-white font-semibold">{activeTaskSortConfig.badge}</strong>
              </span>
              {(taskSort !== 'default' || hasColumnOverrides) && (
                <button
                  type="button"
                  onClick={() => {
                    setTaskSort('default');
                    setColumnTaskSortOverrides({});
                  }}
                  className="ml-1 p-0.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset card sort to manual drag order"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Sort Columns, Sort Cards, Columns visibility & Workflow Manager */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Sort Status Columns Dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              id="btn-sort-columns-menu"
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowTaskSortMenu(false);
                setShowColumnsMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                columnSort !== 'default'
                  ? 'bg-blue-950/70 border-blue-600 text-blue-200'
                  : 'bg-[#1a1a1a] hover:bg-[#242424] border-[#333333] text-neutral-300 hover:text-white'
              }`}
              title="Sort workflow status columns"
            >
              <ArrowUpDown className={`w-3.5 h-3.5 ${columnSort !== 'default' ? 'text-blue-400' : 'text-neutral-400'}`} />
              <span className="hidden sm:inline">Sort Columns</span>
              <span className="sm:hidden">Sort</span>
              {columnSort !== 'default' && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {activeColumnSortConfig.badge}
                </span>
              )}
            </button>

            {showSortMenu && (
              <div
                id="columns-sort-dropdown"
                className="absolute right-0 mt-1.5 w-[calc(100vw-1.5rem)] max-w-xs sm:w-72 bg-[#181818] rounded shadow-2xl border border-[#333333] p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                      Sort Status Columns
                    </h4>
                    <p className="text-[10px] text-neutral-400">Rearrange board columns across your workflow</p>
                  </div>
                  {columnSort !== 'default' && (
                    <button
                      type="button"
                      onClick={() => setColumnSort('default')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {COLUMN_SORT_CONFIG.map((option) => {
                    const isSelected = columnSort === option.id;
                    const IconComp = option.icon;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setColumnSort(option.id);
                          setShowSortMenu(false);
                          addToast('info', `Columns sorted by ${option.label}`);
                        }}
                        className={`w-full flex items-start justify-between p-2 rounded text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-600/70 text-white shadow-xs'
                            : 'bg-[#1e1e1e] hover:bg-[#252525] border-transparent text-neutral-300'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0 pr-2">
                          <IconComp className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-neutral-400'}`} />
                          <div>
                            <div className="font-semibold text-xs text-white leading-tight flex items-center gap-1.5">
                              {option.label}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                              {option.desc}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Admin Save Action */}
                {canManageStatuses && columnSort !== 'default' && (
                  <div className="pt-2 border-t border-[#2b2b2b] space-y-1.5">
                    <button
                      type="button"
                      onClick={handleSaveAsDefaultSequence}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      title="Save this order as the default sequence for all users"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save as Workspace Default</span>
                    </button>
                    <p className="text-[10px] text-neutral-500 text-center">
                      Applies this sorted sequence permanently to the database
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Sort Cards inside Columns Dropdown */}
          <div className="relative" ref={taskSortMenuRef}>
            <button
              type="button"
              id="btn-sort-cards-menu"
              onClick={() => {
                setShowTaskSortMenu(!showTaskSortMenu);
                setShowSortMenu(false);
                setShowColumnsMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                taskSort !== 'default' || hasColumnOverrides
                  ? 'bg-neutral-800 border-neutral-600 text-neutral-200'
                  : 'bg-[#1a1a1a] hover:bg-[#242424] border-[#333333] text-neutral-300 hover:text-white'
              }`}
              title="Sort task cards within columns"
            >
              <activeTaskSortConfig.icon className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Sort Cards</span>
              <span className="sm:hidden">Cards</span>
              {(taskSort !== 'default' || hasColumnOverrides) && (
                <span className="px-1.5 py-0.2 rounded-full bg-neutral-700 text-white text-[10px] font-bold">
                  {activeTaskSortConfig.badge}
                </span>
              )}
            </button>

            {showTaskSortMenu && (
              <div
                id="cards-sort-dropdown"
                className="absolute right-0 mt-1.5 w-[calc(100vw-1.5rem)] max-w-xs sm:w-72 bg-[#181818] rounded shadow-2xl border border-[#333333] p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      Sort In-Column Cards
                    </h4>
                    <p className="text-[10px] text-neutral-400">Order tasks inside every column</p>
                  </div>
                  {(taskSort !== 'default' || hasColumnOverrides) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTaskSort('default');
                        setColumnTaskSortOverrides({});
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {TASK_SORT_CONFIG.map((option) => {
                    const isSelected = taskSort === option.id;
                    const IconComp = option.icon;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setTaskSort(option.id);
                          setShowTaskSortMenu(false);
                          addToast('info', `Cards sorted by ${option.label}`);
                        }}
                        className={`w-full flex items-start justify-between p-2 rounded text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-600/70 text-white shadow-xs'
                            : 'bg-[#1e1e1e] hover:bg-[#252525] border-transparent text-neutral-300'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0 pr-2">
                          <IconComp className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-neutral-400'}`} />
                          <div>
                            <div className="font-semibold text-xs text-white leading-tight">
                              {option.label}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                              {option.desc}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {hasColumnOverrides && (
                  <div className="pt-2 border-t border-[#2b2b2b] flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{Object.keys(columnTaskSortOverrides).length} custom column sort(s)</span>
                    <button
                      type="button"
                      onClick={() => setColumnTaskSortOverrides({})}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Hide / Show Columns Toggle Button & Menu */}
          <div className="relative" ref={columnsMenuRef}>
            <button
              type="button"
              id="btn-toggle-columns-menu"
              onClick={() => {
                setShowColumnsMenu(!showColumnsMenu);
                setShowSortMenu(false);
                setShowTaskSortMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                showColumnsMenu || hiddenCount > 0
                  ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                  : 'bg-[#1a1a1a] hover:bg-[#242424] border-[#333333] text-neutral-300 hover:text-white'
              }`}
              title={`Toggle Column Visibility (${visibleStatuses.length}/${statuses.length} active)`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Columns</span>
              {hiddenCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {hiddenCount}
                </span>
              )}
            </button>

            {showColumnsMenu && (
              <div
                id="columns-visibility-dropdown"
                className="absolute right-0 mt-1.5 w-[calc(100vw-1.5rem)] max-w-xs sm:w-64 bg-[#181818] rounded shadow-2xl border border-[#333333] p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                  <div>
                    <h4 className="font-bold text-white text-xs">Visible Board Columns</h4>
                    <p className="text-[10px] text-neutral-400">Toggle columns to focus your workflow</p>
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={handleShowAllColumns}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Show All
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {statuses.map((status) => {
                    const isVisible = !hiddenStatusIds.includes(status.id);
                    const taskCount = tasksByStatus[status.id]?.length || 0;

                    return (
                      <button
                        key={status.id}
                        type="button"
                        id={`toggle-column-vis-${status.id}`}
                        onClick={() => toggleColumnVisibility(status.id)}
                        className={`w-full flex items-center justify-between p-2 rounded text-left transition-all cursor-pointer border ${
                          isVisible
                            ? 'bg-[#202020] border-[#383838] text-neutral-200 hover:bg-[#262626]'
                            : 'bg-[#141414] border-transparent text-neutral-500 hover:text-neutral-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded shrink-0"
                            style={{ backgroundColor: status.color }}
                          />
                          <span
                            className={`truncate text-xs ${
                              isVisible ? 'font-semibold text-white' : 'line-through text-neutral-500'
                            }`}
                          >
                            {status.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-neutral-400 font-mono">
                            {taskCount}
                          </span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              isVisible
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'border-[#444444] bg-transparent text-transparent'
                            }`}
                          >
                            {isVisible && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#2b2b2b] flex items-center justify-between text-[11px] text-neutral-400">
                  <span>{visibleStatuses.length} of {statuses.length} columns active</span>
                  {canManageStatuses && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowColumnsMenu(false);
                        setIsStatusManagerOpen(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Workflow & Columns Action */}
          {canManageStatuses && (
            <button
              type="button"
              id="btn-kanban-workflow-columns"
              onClick={() => setIsStatusManagerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] hover:border-neutral-600 text-neutral-200 hover:text-white transition-all cursor-pointer shadow-xs group"
              title="Configure Workflow & Columns (add, rename, recolor, or reorder statuses)"
            >
              <WorkflowIcon className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <span>Statuses</span>
            </button>
          )}
        </div>
      </div>

      {/* Column Navigator Bar with Arrow Left and Arrow Right & Stage Stepper */}
      {sortedVisibleStatuses.length > 0 && (
        <div className="px-3 sm:px-6 py-2 bg-[#141414] border-b border-[#222222] flex items-center justify-between gap-2 shrink-0">
          {/* Arrow Left: Navigate to Previous Column */}
          <button
            type="button"
            id="btn-workflow-nav-prev"
            onClick={handlePrevColumn}
            disabled={safeIndex === 0}
            onDragOver={(e) => {
              if (safeIndex > 0) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsDropTargetPrev(true);
              }
            }}
            onDragLeave={() => setIsDropTargetPrev(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDropTargetPrev(false);
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId && prevStatus) {
                moveTaskStatus(taskId, prevStatus.id);
                addToast('success', `Moved task to ${prevStatus.name}`);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all select-none shrink-0 ${
              isDropTargetPrev
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 ring-2 ring-blue-500 shadow-md scale-105'
                : safeIndex === 0
                ? 'bg-[#181818] border-[#252525] text-neutral-600 opacity-40 cursor-not-allowed'
                : 'bg-[#1e1e1e] hover:bg-[#282828] border-[#333333] hover:border-neutral-500 text-neutral-200 hover:text-white shadow-xs active:scale-95 cursor-pointer'
            }`}
            title={
              prevStatus
                ? `Previous Column: ${prevStatus.name} (Press ← / Drop card to move)`
                : 'First column (No previous stage)'
            }
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Previous</span>
            {prevStatus && (
              <span className="hidden md:inline text-[11px] text-neutral-400 font-normal max-w-[100px] truncate">
                ({prevStatus.name})
              </span>
            )}
          </button>

          {/* Center Pipeline Stepper Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 px-1 max-w-full min-w-0 scrollbar-none">
            {sortedVisibleStatuses.map((st, idx) => {
              const isActive = idx === safeIndex;
              const count = tasksByStatus[st.id]?.length || 0;

              return (
                <button
                  key={st.id}
                  type="button"
                  id={`btn-workflow-column-pill-${st.id}`}
                  onClick={() => {
                    setActiveColumnIndex(idx);
                    setActiveMenuStatusId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/plain');
                    if (taskId) {
                      moveTaskStatus(taskId, st.id);
                      addToast('success', `Moved task to ${st.name}`);
                      setActiveColumnIndex(idx);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-blue-950/60 border-blue-500 text-white font-semibold ring-1 ring-blue-500/50 shadow-xs'
                      : 'bg-[#1a1a1a] hover:bg-[#242424] border-[#2c2c2c] text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={`Jump to ${st.name} (${count} tasks)`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: st.color }}
                  />
                  <span className="truncate max-w-[85px] sm:max-w-[120px]">{st.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-[#262626] text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Arrow Right: Navigate to Next Column */}
          <button
            type="button"
            id="btn-workflow-nav-next"
            onClick={handleNextColumn}
            disabled={safeIndex === sortedVisibleStatuses.length - 1}
            onDragOver={(e) => {
              if (safeIndex < sortedVisibleStatuses.length - 1) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsDropTargetNext(true);
              }
            }}
            onDragLeave={() => setIsDropTargetNext(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDropTargetNext(false);
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId && nextStatus) {
                moveTaskStatus(taskId, nextStatus.id);
                addToast('success', `Moved task to ${nextStatus.name}`);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all select-none shrink-0 ${
              isDropTargetNext
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 ring-2 ring-blue-500 shadow-md scale-105'
                : safeIndex === sortedVisibleStatuses.length - 1
                ? 'bg-[#181818] border-[#252525] text-neutral-600 opacity-40 cursor-not-allowed'
                : 'bg-[#1e1e1e] hover:bg-[#282828] border-[#333333] hover:border-neutral-500 text-neutral-200 hover:text-white shadow-xs active:scale-95 cursor-pointer'
            }`}
            title={
              nextStatus
                ? `Next Column: ${nextStatus.name} (Press → / Drop card to move)`
                : 'Last column (No next stage)'
            }
          >
            {nextStatus && (
              <span className="hidden md:inline text-[11px] text-neutral-400 font-normal max-w-[100px] truncate">
                ({nextStatus.name})
              </span>
            )}
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      )}

      {/* Main Single Column Display with Flanking Navigation Arrows */}
      {sortedVisibleStatuses.length > 0 && currentStatus ? (
        <div
          className="flex-1 min-h-0 flex items-stretch justify-center p-1.5 sm:p-5 md:p-6 overflow-hidden relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Flanking Left Arrow Button (Desktop / Tablet quick click) */}
          <div className="hidden md:flex items-center justify-center absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 shrink-0">
            <button
              type="button"
              id="btn-workflow-flank-prev"
              onClick={handlePrevColumn}
              disabled={safeIndex === 0}
              onDragOver={(e) => {
                if (safeIndex > 0) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setIsDropTargetPrev(true);
                }
              }}
              onDragLeave={() => setIsDropTargetPrev(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDropTargetPrev(false);
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId && prevStatus) {
                  moveTaskStatus(taskId, prevStatus.id);
                  addToast('success', `Moved task to ${prevStatus.name}`);
                }
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all shadow-lg ${
                isDropTargetPrev
                  ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/40 scale-110'
                  : safeIndex === 0
                  ? 'bg-[#141414] border-[#222222] text-neutral-700 opacity-30 cursor-not-allowed'
                  : 'bg-[#1a1a1a] hover:bg-[#252525] border-[#333333] hover:border-neutral-500 text-neutral-300 hover:text-white hover:scale-105 active:scale-95 cursor-pointer'
              }`}
              title={prevStatus ? `Go to ${prevStatus.name} (←)` : 'No previous column'}
              aria-label="Previous Column"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* The Single Active Column */}
          {(() => {
            const status = currentStatus;
            const rawTasks = tasksByStatus[status.id] || [];
            const { tasks: columnTasks, activeSort: activeColSort } = getSortedTasksForColumn(
              status.id,
              rawTasks
            );
            const isDraggedOver = draggedOverStatusId === status.id;
            const isMenuOpen = activeMenuStatusId === status.id;

            return (
              <div
                key={status.id}
                id={`kanban-column-${status.id}`}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={(e) => handleDragLeave(e, status.id)}
                onDrop={(e) => handleDrop(e, status.id)}
                className={`w-[90%] max-w-[90%] flex flex-col h-full min-h-0 mx-auto bg-[#121212] border border-[#262626] rounded-xl sm:rounded-2xl p-2.5 sm:p-4.5 shadow-xl transition-all ${
                  isDraggedOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0d0d0d]' : ''
                }`}
              >
                {/* Single Column Header */}
                <div className="flex items-center justify-between pb-2 sm:pb-3.5 border-b border-[#242424] shrink-0 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: status.color }}
                    />
                    <h3 className="font-bold text-white text-sm sm:text-base tracking-wide truncate">
                      {status.name}
                    </h3>
                    {status.isDone && (
                      <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-semibold shrink-0">
                        Completed Stage
                      </span>
                    )}
                    <span className="hidden sm:inline-flex text-[11px] bg-[#1a1a1a] text-neutral-400 border border-[#2b2b2b] px-2 py-0.5 rounded font-medium shrink-0">
                      Stage {safeIndex + 1} of {sortedVisibleStatuses.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* In-column Sort indicator if active */}
                    {activeColSort !== 'default' && (
                      <span
                        className="text-[10px] bg-blue-950/60 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-800/50 flex items-center gap-1 shrink-0 cursor-default"
                        title={`Cards in this column sorted by: ${
                          TASK_SORT_CONFIG.find((s) => s.id === activeColSort)?.label
                        }`}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span className="hidden sm:inline">
                          {TASK_SORT_CONFIG.find((s) => s.id === activeColSort)?.badge}
                        </span>
                      </span>
                    )}

                    {/* Task count badge */}
                    <span className="text-xs text-neutral-300 font-semibold bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-[#2b2b2b] shadow-xs">
                      {columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}
                    </span>

                    {/* Add task quick button */}
                    {canCreate && (
                      <button
                        type="button"
                        id="btn-add-task-to-column"
                        onClick={() => setIsCreateModalOpen(true)}
                        title={`Add new task to ${status.name}`}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">New Task</span>
                      </button>
                    )}

                    {/* Column Options Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        id={`btn-col-menu-${status.id}`}
                        onClick={() => setActiveMenuStatusId(isMenuOpen ? null : status.id)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#202020] rounded-md transition-colors cursor-pointer"
                        title="Column options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          id={`col-menu-dropdown-${status.id}`}
                          className="absolute right-0 mt-1.5 w-60 max-w-[calc(100vw-2.5rem)] bg-[#181818] rounded-lg shadow-2xl border border-[#333333] py-2 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs"
                        >
                          <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Column: {status.name}
                          </div>

                          {/* Column Position Controls */}
                          <div className="px-3 pt-1.5 text-[10px] font-semibold text-neutral-500 uppercase">
                            Column Position
                          </div>
                          <div className="grid grid-cols-2 gap-1 px-2 py-1">
                            <button
                              type="button"
                              disabled={safeIndex === 0}
                              onClick={() => handleMoveColumn(status.id, 'first')}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-300 hover:bg-[#262626] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move to first column"
                            >
                              <ChevronsLeft className="w-3.5 h-3.5 text-neutral-400" />
                              <span>First</span>
                            </button>
                            <button
                              type="button"
                              disabled={safeIndex === 0}
                              onClick={() => handleMoveColumn(status.id, 'left')}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-300 hover:bg-[#262626] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move column left"
                            >
                              <ArrowLeft className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Left</span>
                            </button>
                            <button
                              type="button"
                              disabled={safeIndex === sortedVisibleStatuses.length - 1}
                              onClick={() => handleMoveColumn(status.id, 'right')}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-300 hover:bg-[#262626] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move column right"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Right</span>
                            </button>
                            <button
                              type="button"
                              disabled={safeIndex === sortedVisibleStatuses.length - 1}
                              onClick={() => handleMoveColumn(status.id, 'last')}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-300 hover:bg-[#262626] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move to last column"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Last</span>
                            </button>
                          </div>

                          <div className="border-t border-[#2b2b2b] my-1.5" />

                          {/* In-Column Cards Sorting */}
                          <div className="px-3 py-1 text-[10px] font-semibold text-neutral-500 uppercase">
                            Sort Cards in this Column
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setColumnTaskSortOverrides((prev) => {
                                const next = { ...prev };
                                delete next[status.id];
                                return next;
                              });
                              setActiveMenuStatusId(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer ${
                              !columnTaskSortOverrides[status.id]
                                ? 'text-blue-400 font-semibold bg-[#222222]'
                                : 'text-neutral-300 hover:bg-[#262626]'
                            }`}
                          >
                            <span>Default (Board Sort)</span>
                            {!columnTaskSortOverrides[status.id] && <Check className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setColumnTaskSortOverrides((prev) => ({
                                ...prev,
                                [status.id]: 'priority-desc'
                              }));
                              setActiveMenuStatusId(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer ${
                              columnTaskSortOverrides[status.id] === 'priority-desc'
                                ? 'text-blue-400 font-semibold bg-[#222222]'
                                : 'text-neutral-300 hover:bg-[#262626]'
                            }`}
                          >
                            <span>Priority (Urgent first)</span>
                            {columnTaskSortOverrides[status.id] === 'priority-desc' && <Check className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setColumnTaskSortOverrides((prev) => ({
                                ...prev,
                                [status.id]: 'due-asc'
                              }));
                              setActiveMenuStatusId(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer ${
                              columnTaskSortOverrides[status.id] === 'due-asc'
                                ? 'text-blue-400 font-semibold bg-[#222222]'
                                : 'text-neutral-300 hover:bg-[#262626]'
                            }`}
                          >
                            <span>Due Date (Soonest first)</span>
                            {columnTaskSortOverrides[status.id] === 'due-asc' && <Check className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setColumnTaskSortOverrides((prev) => ({
                                ...prev,
                                [status.id]: 'title-asc'
                              }));
                              setActiveMenuStatusId(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer ${
                              columnTaskSortOverrides[status.id] === 'title-asc'
                                ? 'text-blue-400 font-semibold bg-[#222222]'
                                : 'text-neutral-300 hover:bg-[#262626]'
                            }`}
                          >
                            <span>Title (A → Z)</span>
                            {columnTaskSortOverrides[status.id] === 'title-asc' && <Check className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setColumnTaskSortOverrides((prev) => ({
                                ...prev,
                                [status.id]: 'newest'
                              }));
                              setActiveMenuStatusId(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer ${
                              columnTaskSortOverrides[status.id] === 'newest'
                                ? 'text-blue-400 font-semibold bg-[#222222]'
                                : 'text-neutral-300 hover:bg-[#262626]'
                            }`}
                          >
                            <span>Newest Created First</span>
                            {columnTaskSortOverrides[status.id] === 'newest' && <Check className="w-3 h-3" />}
                          </button>

                          <div className="border-t border-[#2b2b2b] my-1.5" />

                          {/* Hide Column option */}
                          <button
                            type="button"
                            onClick={() => handleHideSpecificColumn(status.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#262626] text-left cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            <span>Hide this Column</span>
                          </button>

                          {canManageStatuses && (
                            <>
                              <div className="border-t border-[#2b2b2b] my-1.5" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuStatusId(null);
                                  setIsStatusManagerOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#262626] text-left cursor-pointer"
                              >
                                <WorkflowIcon className="w-3.5 h-3.5 text-blue-400" />
                                <span>Workflow &amp; Columns</span>
                              </button>

                              {statuses.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuStatusId(null);
                                    if (
                                      window.confirm(
                                        `Delete "${status.name}"? Tasks in this column will be moved to the first column.`
                                      )
                                    ) {
                                      deleteStatus(status.id);
                                    }
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Delete Column</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column Cards Scrollable Container */}
                <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pt-2 sm:pt-3 pr-0.5 sm:pr-1 pb-2 sm:pb-3 scrollbar-thin">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <TaskCard task={task} />
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="h-48 border-2 border-dashed border-[#262626] rounded-xl flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                      <Inbox className="w-8 h-8 mb-2 text-neutral-600" />
                      <p className="text-sm font-semibold text-neutral-300">No tasks in {status.name}</p>
                      <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                        Use the ← and → arrows to explore other columns, drag tasks here, or add a task below.
                      </p>
                      {canCreate && (
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-3 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#282828] border border-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          + Add First Task
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Bottom Navigation Bar for Mobile & Compact Screens */}
                <div className="pt-2.5 border-t border-[#222222] flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevColumn}
                    disabled={safeIndex === 0}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      safeIndex === 0
                        ? 'opacity-30 border-transparent text-neutral-600 cursor-not-allowed'
                        : 'border-[#333333] hover:border-neutral-500 text-neutral-300 hover:text-white bg-[#181818] cursor-pointer'
                    }`}
                    title={prevStatus ? `Previous: ${prevStatus.name}` : undefined}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="text-[11px] text-neutral-400 font-medium">
                    Column <strong className="text-white">{safeIndex + 1}</strong> of {sortedVisibleStatuses.length}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextColumn}
                    disabled={safeIndex === sortedVisibleStatuses.length - 1}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      safeIndex === sortedVisibleStatuses.length - 1
                        ? 'opacity-30 border-transparent text-neutral-600 cursor-not-allowed'
                        : 'border-[#333333] hover:border-neutral-500 text-neutral-300 hover:text-white bg-[#181818] cursor-pointer'
                    }`}
                    title={nextStatus ? `Next: ${nextStatus.name}` : undefined}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Flanking Right Arrow Button (Desktop / Tablet quick click) */}
          <div className="hidden md:flex items-center justify-center absolute right-2 lg:left-auto lg:right-4 top-1/2 -translate-y-1/2 z-20 shrink-0">
            <button
              type="button"
              id="btn-workflow-flank-next"
              onClick={handleNextColumn}
              disabled={safeIndex === sortedVisibleStatuses.length - 1}
              onDragOver={(e) => {
                if (safeIndex < sortedVisibleStatuses.length - 1) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setIsDropTargetNext(true);
                }
              }}
              onDragLeave={() => setIsDropTargetNext(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDropTargetNext(false);
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId && nextStatus) {
                  moveTaskStatus(taskId, nextStatus.id);
                  addToast('success', `Moved task to ${nextStatus.name}`);
                }
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all shadow-lg ${
                isDropTargetNext
                  ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/40 scale-110'
                  : safeIndex === sortedVisibleStatuses.length - 1
                  ? 'bg-[#141414] border-[#222222] text-neutral-700 opacity-30 cursor-not-allowed'
                  : 'bg-[#1a1a1a] hover:bg-[#252525] border-[#333333] hover:border-neutral-500 text-neutral-300 hover:text-white hover:scale-105 active:scale-95 cursor-pointer'
              }`}
              title={nextStatus ? `Go to ${nextStatus.name} (→)` : 'No next column'}
              aria-label="Next Column"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty state when all columns are hidden */
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-400 space-y-3">
          <EyeOff className="w-10 h-10 text-neutral-600" />
          <h3 className="text-base font-bold text-white">All columns are currently hidden</h3>
          <p className="text-xs text-neutral-500 max-w-sm">
            Use the column visibility menu above to show your workflow columns or reset your board view.
          </p>
          <button
            type="button"
            onClick={handleShowAllColumns}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
          >
            Show All Columns
          </button>
        </div>
      )}
    </div>
  );
};
