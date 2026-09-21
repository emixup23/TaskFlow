import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Copy,
  Check,
  User as UserIcon,
  Tag,
  AlertCircle,
  Trash2,
  Edit2,
  Sun,
  Sunset,
  Moon,
  Coffee,
  ShieldCheck,
  Code,
  Palette,
  Eye,
  EyeOff,
  CheckSquare,
  Sparkles,
  Users,
  Search,
  ExternalLink,
  MessageSquare,
  X
} from 'lucide-react';
import { DailyTask, DailyTimeBlock, DailyCategory, Priority, User } from '../types';
import { api } from '../api/client';
import { VoiceToTextButton } from './VoiceToTextButton';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { STORAGE_KEYS } from '../constants/storageKeys';
import confetti from 'canvas-confetti';

const TIME_BLOCK_CONFIG: Record<
  DailyTimeBlock,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; borderColor: string; timeRange: string }
> = {
  morning: {
    label: 'Morning Focus',
    icon: Sun,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    timeRange: '08:00 AM - 12:00 PM'
  },
  afternoon: {
    label: 'Afternoon Deep Work',
    icon: Sunset,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    timeRange: '12:00 PM - 05:00 PM'
  },
  evening: {
    label: 'Evening Review & Wrap-up',
    icon: Moon,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    timeRange: '05:00 PM - 08:00 PM'
  },
  flexible: {
    label: 'Flexible & On-Demand',
    icon: Coffee,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    timeRange: 'Anytime Today'
  }
};

const CATEGORY_CONFIG: Record<
  DailyCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeBg: string }
> = {
  development: { label: 'Development', icon: Code, color: 'text-blue-400', badgeBg: 'bg-blue-500/15 border-blue-500/30' },
  design: { label: 'Design', icon: Palette, color: 'text-purple-400', badgeBg: 'bg-purple-500/15 border-purple-500/30' },
  review: { label: 'Code Review', icon: Eye, color: 'text-amber-400', badgeBg: 'bg-amber-500/15 border-amber-500/30' },
  operations: { label: 'Operations', icon: AlertCircle, color: 'text-cyan-400', badgeBg: 'bg-cyan-500/15 border-cyan-500/30' },
  security: { label: 'Security', icon: ShieldCheck, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/15 border-emerald-500/30' },
  meeting: { label: 'Meeting', icon: MessageSquare, color: 'text-violet-400', badgeBg: 'bg-violet-500/15 border-violet-500/30' },
  admin: { label: 'Admin / Ops', icon: Tag, color: 'text-rose-400', badgeBg: 'bg-rose-500/15 border-rose-500/30' },
  general: { label: 'General', icon: CheckSquare, color: 'text-slate-400', badgeBg: 'bg-slate-500/15 border-slate-500/30' }
};

const PRIORITY_BADGES: Record<Priority, { label: string; border: string; bg: string; text: string }> = {
  urgent: { label: 'Urgent', border: 'border-red-500/40', bg: 'bg-red-500/15', text: 'text-red-400' },
  high: { label: 'High', border: 'border-orange-500/40', bg: 'bg-orange-500/15', text: 'text-orange-400' },
  medium: { label: 'Medium', border: 'border-blue-500/40', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  low: { label: 'Low', border: 'border-slate-500/40', bg: 'bg-slate-500/15', text: 'text-slate-400' }
};

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  let relative = '';
  if (diffDays === 0) relative = 'Today';
  else if (diffDays === -1) relative = 'Yesterday';
  else if (diffDays === 1) relative = 'Tomorrow';

  const formatted = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return relative ? `${relative} (${formatted})` : formatted;
}

function getAdjacentDate(dateStr: string, offsetDays: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export const DailyTasksView: React.FC = () => {
  const { currentUser, users } = useAuth();
  const { tasks: workspaceTasks, setSelectedTaskId } = useTasks();

  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showUserFilter, setShowUserFilter] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_SHOW_USER_FILTER);
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const handleToggleUserFilter = () => {
    setShowUserFilter((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_SHOW_USER_FILTER, String(next));
      } catch (err) {
        console.warn('Failed to save showUserFilter:', err);
      }
      return next;
    });
  };

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [userSummaries, setUserSummaries] = useState<Record<string, { total: number; completed: number; rate: number }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [rolloverMessage, setRolloverMessage] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  // Form State
  const [formUserId, setFormUserId] = useState<string>(currentUser?.id || 'user-admin-1');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(selectedDate);
  const [formTimeBlock, setFormTimeBlock] = useState<DailyTimeBlock>('morning');
  const [formTimeSlot, setFormTimeSlot] = useState<string>('09:00 AM');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(30);
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formCategory, setFormCategory] = useState<DailyCategory>('development');
  const [formLinkedTaskId, setFormLinkedTaskId] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Inline Quick Add state
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickTimeBlock, setQuickTimeBlock] = useState<DailyTimeBlock>('morning');

  // Load Daily Tasks from API
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDailyTasks({
        userId: selectedUserId === 'all' ? undefined : selectedUserId,
        date: selectedDate
      });
      setDailyTasks(res.tasks || []);
      if (res.userSummaries) {
        setUserSummaries(res.userSummaries);
      }
    } catch (err: any) {
      console.warn('Could not load daily tasks:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedUserId, selectedDate, currentUser?.id]);

  // Open Create Modal
  const handleOpenCreateModal = (timeBlock?: DailyTimeBlock) => {
    setEditingTask(null);
    setFormUserId(selectedUserId === 'all' ? currentUser?.id || 'user-admin-1' : selectedUserId);
    setFormTitle('');
    setFormDescription('');
    setFormDate(selectedDate);
    setFormTimeBlock(timeBlock || 'morning');
    setFormTimeSlot(timeBlock === 'afternoon' ? '02:00 PM' : timeBlock === 'evening' ? '05:30 PM' : '09:30 AM');
    setFormEstimatedMinutes(30);
    setFormPriority('medium');
    setFormCategory('development');
    setFormLinkedTaskId('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: DailyTask) => {
    setEditingTask(task);
    setFormUserId(task.userId);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormDate(task.date);
    setFormTimeBlock(task.timeBlock);
    setFormTimeSlot(task.timeSlot || '');
    setFormEstimatedMinutes(task.estimatedMinutes);
    setFormPriority(task.priority);
    setFormCategory(task.category);
    setFormLinkedTaskId(task.linkedTaskId || '');
    setFormNotes(task.notes || '');
    setIsModalOpen(true);
  };

  // Save Modal (Create or Update)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const linkedTask = workspaceTasks.find((t) => t.id === formLinkedTaskId);

    const payload: Partial<DailyTask> = {
      userId: formUserId,
      title: formTitle.trim(),
      description: formDescription.trim(),
      date: formDate,
      timeBlock: formTimeBlock,
      timeSlot: formTimeSlot.trim() || undefined,
      estimatedMinutes: Number(formEstimatedMinutes) || 30,
      priority: formPriority,
      category: formCategory,
      linkedTaskId: formLinkedTaskId || undefined,
      linkedTaskTitle: linkedTask ? linkedTask.title : undefined,
      notes: formNotes.trim() || undefined
    };

    try {
      if (editingTask) {
        await api.updateDailyTask(editingTask.id, payload);
      } else {
        await api.createDailyTask(payload);
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      console.error('Failed to save daily task:', err);
    }
  };

  // Quick Inline Add
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const targetUserId = selectedUserId === 'all' ? currentUser?.id || 'user-admin-1' : selectedUserId;
    try {
      await api.createDailyTask({
        userId: targetUserId,
        title: quickTitle.trim(),
        date: selectedDate,
        timeBlock: quickTimeBlock,
        estimatedMinutes: 30,
        priority: 'medium',
        category: 'general'
      });
      setQuickTitle('');
      fetchTasks();
    } catch (err) {
      console.error('Quick add failed:', err);
    }
  };

  // Toggle Completion
  const handleToggleComplete = async (task: DailyTask) => {
    const nextCompleted = !task.completed;
    // Optimistic update
    setDailyTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : undefined,
              completedBy: nextCompleted ? currentUser?.name : undefined
            }
          : t
      )
    );

    try {
      await api.updateDailyTask(task.id, { completed: nextCompleted });
      if (nextCompleted) {
        // Check if all tasks for this user are now completed!
        const remainingUncompleted = dailyTasks.filter((t) => t.id !== task.id && t.userId === task.userId && !t.completed);
        if (remainingUncompleted.length === 0) {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
      }
      fetchTasks();
    } catch (err) {
      console.error('Toggle failed, reverting:', err);
      fetchTasks();
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Delete this daily task?')) return;
    try {
      await api.deleteDailyTask(id);
      fetchTasks();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Rollover Incomplete Tasks from Yesterday
  const handleRollover = async () => {
    const yesterday = getAdjacentDate(selectedDate, -1);
    try {
      const res = await api.rolloverDailyTasks(selectedUserId === 'all' ? undefined : selectedUserId, yesterday);
      setRolloverMessage(res.message);
      setTimeout(() => setRolloverMessage(null), 5000);
      fetchTasks();
    } catch (err) {
      console.error('Rollover error:', err);
    }
  };

  // Standup Summary Markdown Generator
  const handleCopyStandup = () => {
    const userToReport = selectedUserId === 'all' ? users : users.filter((u) => u.id === selectedUserId);

    let report = `📋 **Daily Standup Summary - ${formatDisplayDate(selectedDate)}**\n\n`;

    userToReport.forEach((u) => {
      const uTasks = dailyTasks.filter((t) => t.userId === u.id);
      if (uTasks.length === 0) return;

      const done = uTasks.filter((t) => t.completed);
      const pending = uTasks.filter((t) => !t.completed);

      report += `👤 **${u.name}** (${u.title || u.role})\n`;
      if (done.length > 0) {
        report += `  ✅ **Completed:**\n`;
        done.forEach((t) => {
          report += `    - [x] ${t.title} (${t.estimatedMinutes}m${t.linkedTaskTitle ? ` - ${t.linkedTaskTitle}` : ''})\n`;
        });
      }
      if (pending.length > 0) {
        report += `  ⏳ **In Progress / Scheduled:**\n`;
        pending.forEach((t) => {
          report += `    - [ ] ${t.title} [${t.timeBlock.toUpperCase()}] (${t.priority.toUpperCase()})\n`;
        });
      }
      report += '\n';
    });

    navigator.clipboard.writeText(report);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return dailyTasks.filter((t) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        const matchesNotes = (t.notes || '').toLowerCase().includes(query);
        const user = users.find((u) => u.id === t.userId);
        const matchesUser = user ? user.name.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesDesc && !matchesNotes && !matchesUser) return false;
      }

      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (statusFilter === 'completed' && !t.completed) return false;
      if (statusFilter === 'pending' && t.completed) return false;

      return true;
    });
  }, [dailyTasks, searchQuery, categoryFilter, priorityFilter, statusFilter, users]);

  // Overall Statistics for current active view
  const totalTasks = dailyTasks.length;
  const completedTasks = dailyTasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalEstimatedMinutes = dailyTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalHours = (totalEstimatedMinutes / 60).toFixed(1);

  // Group filtered tasks by Time Block
  const morningTasks = filteredTasks.filter((t) => t.timeBlock === 'morning');
  const afternoonTasks = filteredTasks.filter((t) => t.timeBlock === 'afternoon');
  const eveningTasks = filteredTasks.filter((t) => t.timeBlock === 'evening');
  const flexibleTasks = filteredTasks.filter((t) => t.timeBlock === 'flexible');

  const activeUser = users.find((u) => u.id === selectedUserId);

  return (
    <div id="daily-tasks-view" className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d] overflow-y-auto">
      {/* Header & Controls */}
      <div className="border-b border-[#262626] bg-[#141414] px-3 sm:px-6 py-2.5 sm:py-4 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Daily Tasks
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Day Planner
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Date Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Navigator */}
            <div className="flex items-center bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-1 shadow-inner">
              <button
                id="btn-prev-day"
                onClick={() => setSelectedDate(getAdjacentDate(selectedDate, -1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3 text-sm font-medium text-slate-200">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>{formatDisplayDate(selectedDate)}</span>
              </div>
              <button
                id="btn-next-day"
                onClick={() => setSelectedDate(getAdjacentDate(selectedDate, 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {selectedDate !== new Date().toISOString().split('T')[0] && (
              <button
                id="btn-today-reset"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs px-3 py-2 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-slate-300 border border-[#2e2e2e] transition-colors font-medium"
              >
                Jump to Today
              </button>
            )}

            {/* Toggle User Filter */}
            <button
              id="btn-toggle-filter-user"
              type="button"
              onClick={handleToggleUserFilter}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all ${
                showUserFilter
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-xs'
                  : selectedUserId !== 'all'
                  ? 'bg-teal-950/60 text-teal-300 border-teal-600/50'
                  : 'bg-[#1e1e1e] hover:bg-[#2a2a2a] text-slate-300 border-[#2e2e2e]'
              }`}
              title={showUserFilter ? 'Hide User Filter' : 'Show User Filter'}
            >
              {showUserFilter ? (
                <EyeOff className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-teal-400" />
              )}
              {selectedUserId !== 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            {/* Quick clear chip if filter strip is closed but a user is selected */}
            {!showUserFilter && selectedUserId !== 'all' && activeUser && (
              <button
                type="button"
                id="btn-clear-user-filter"
                onClick={() => setSelectedUserId('all')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-teal-500/15 border border-teal-500/30 text-teal-300 hover:bg-teal-500/25 transition-colors"
                title="Filtered user - click to show all members"
              >
                <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full object-cover" />
                <span className="max-w-[90px] truncate text-[11px] font-medium">{activeUser.name}</span>
                <X className="w-3 h-3 text-teal-400" />
              </button>
            )}

            {/* Rollover Incomplete Tasks */}
            <button
              id="btn-rollover-tasks"
              onClick={handleRollover}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
              title="Rollover incomplete tasks from yesterday into today"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Standup Digest Export */}
            <button
              id="btn-copy-standup"
              onClick={handleCopyStandup}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-[#1e1e1e] hover:bg-[#2a2a2a] text-slate-200 border border-[#2e2e2e] transition-colors"
              title="Copy Standup Summary in Markdown"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* New Task Button */}
            <button
              id="btn-new-daily-task"
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rollover Notification Banner */}
        {rolloverMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {rolloverMessage}
            </span>
            <button onClick={() => setRolloverMessage(null)} className="text-amber-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* User Selector Strip */}
        {showUserFilter && (
          <div className="mt-4 pt-3 border-t border-[#222222] animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin flex-1 min-w-0">
                <button
                  type="button"
                  onClick={handleToggleUserFilter}
                  className="text-xs font-semibold text-slate-400 hover:text-teal-300 uppercase tracking-wider mr-1 flex items-center gap-1.5 flex-shrink-0 transition-colors cursor-pointer"
                  title="Hide User Filter"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-400" />
                  Filter User:
                </button>

                {/* All Members Chip */}
                <button
                  id="user-chip-all"
                  onClick={() => setSelectedUserId('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 border ${
                    selectedUserId === 'all'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                      : 'bg-[#181818] text-slate-300 border-[#262626] hover:bg-[#222]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <span>All Members</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-950/60 text-teal-400 border border-teal-800/40">
                    {totalTasks}
                  </span>
                </button>

                {/* Individual User Chips */}
                {users.map((u) => {
                  const uStats = userSummaries[u.id] || { total: 0, completed: 0, rate: 0 };
                  const isSelected = selectedUserId === u.id;
                  const isMe = currentUser?.id === u.id;

                  return (
                    <button
                      key={u.id}
                      id={`user-chip-${u.id}`}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 border ${
                        isSelected
                          ? 'bg-teal-500/20 text-white border-teal-500/50 shadow-sm ring-1 ring-teal-500/30'
                          : 'bg-[#181818] text-slate-300 border-[#262626] hover:bg-[#222]'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover border border-[#333]" />
                      <span className="flex items-center gap-1">
                        {u.name}
                        {isMe && <span className="text-[10px] text-teal-400 font-bold">(You)</span>}
                      </span>

                      {/* Micro completion badge */}
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                          uStats.total > 0 && uStats.completed === uStats.total
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#222] text-slate-400 border border-[#333]'
                        }`}
                      >
                        {uStats.completed}/{uStats.total}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Close/Toggle button */}
              <button
                type="button"
                id="btn-close-filter-user"
                onClick={handleToggleUserFilter}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222] transition-colors flex-shrink-0"
                title="Hide User Filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-2 sm:p-6 space-y-2.5 sm:space-y-6">
        {/* Pulse / Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-2.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled</span>
              <CalendarCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">{totalTasks}</span>
              <span className="text-[11px] sm:text-xs text-slate-400">({totalHours}h)</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">{completedTasks}</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">/{totalTasks}</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">{completionRate}%</span>
              <div className="flex-1 bg-[#222] h-1.5 sm:h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-orange-400">{pendingTasks}</span>
              <span className="text-[11px] sm:text-xs text-slate-400">left</span>
            </div>
          </div>
        </div>

        {/* Quick Add Bar & Search / Filter Controls */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          {/* Inline Quick Add */}
          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                id="input-quick-add-title"
                type="text"
                placeholder={
                  activeUser
                    ? `Quick add daily task for ${activeUser.name}...`
                    : 'Quick add daily task for yourself today...'
                }
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40"
              />
            </div>
            <select
              value={quickTimeBlock}
              onChange={(e) => setQuickTimeBlock(e.target.value as DailyTimeBlock)}
              className="w-full sm:w-auto bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
            >
              <option value="morning">Morning (08:00 - 12:00)</option>
              <option value="afternoon">Afternoon (12:00 - 17:00)</option>
              <option value="evening">Evening (17:00 - 20:00)</option>
              <option value="flexible">Flexible Time</option>
            </select>
            <button
              type="submit"
              disabled={!quickTitle.trim()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </form>

          {/* Secondary Filters Strip */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#222]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search daily tasks by title or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-[#282828] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-[#181818] border border-[#282828] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'all' ? 'bg-[#282828] text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'pending' ? 'bg-[#282828] text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'completed' ? 'bg-[#282828] text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#181818] border border-[#282828] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#181818] border border-[#282828] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Time Block Groups */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading daily schedules...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center bg-[#141414] border border-[#262626] rounded-2xl p-8">
            <CalendarCheck2 className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-semibold text-white">No Daily Tasks Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No daily tasks scheduled for this date or matching your current filter criteria.
            </p>
            <button
              onClick={() => handleOpenCreateModal()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Daily Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning Section */}
            {morningTasks.length > 0 && (
              <TimeBlockSection
                blockKey="morning"
                tasks={morningTasks}
                users={users}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onAdd={() => handleOpenCreateModal('morning')}
                onOpenTaskDetail={setSelectedTaskId}
                workspaceTasks={workspaceTasks}
              />
            )}

            {/* Afternoon Section */}
            {afternoonTasks.length > 0 && (
              <TimeBlockSection
                blockKey="afternoon"
                tasks={afternoonTasks}
                users={users}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onAdd={() => handleOpenCreateModal('afternoon')}
                onOpenTaskDetail={setSelectedTaskId}
                workspaceTasks={workspaceTasks}
              />
            )}

            {/* Evening Section */}
            {eveningTasks.length > 0 && (
              <TimeBlockSection
                blockKey="evening"
                tasks={eveningTasks}
                users={users}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onAdd={() => handleOpenCreateModal('evening')}
                onOpenTaskDetail={setSelectedTaskId}
                workspaceTasks={workspaceTasks}
              />
            )}

            {/* Flexible Section */}
            {flexibleTasks.length > 0 && (
              <TimeBlockSection
                blockKey="flexible"
                tasks={flexibleTasks}
                users={users}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onAdd={() => handleOpenCreateModal('flexible')}
                onOpenTaskDetail={setSelectedTaskId}
                workspaceTasks={workspaceTasks}
              />
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div
          id="daily-task-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-5 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 shrink-0">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">
                    {editingTask ? 'Edit Daily Task' : 'New Daily Task'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate hidden xs:block">Schedule routine item, sync meeting or standup blocker</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-daily-task-modal"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close daily task window"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:p-1.5 text-slate-300 hover:text-white rounded-lg bg-[#222222] sm:bg-transparent border border-[#333333] sm:border-transparent hover:bg-[#2a2a2a] transition-all cursor-pointer active:scale-95 text-xs font-bold shrink-0"
              >
                <X className="w-4.5 h-4.5 text-slate-300" />
                <span className="sm:hidden">Close</span>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* User Assignee */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Team Member
                </label>
                <select
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.title || u.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit WCAG contrast on dark mode neutrals"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Description / Context
                  </label>
                  <VoiceToTextButton
                    id="daily-task-voice-btn"
                    value={formDescription}
                    onChange={setFormDescription}
                    title="Dictate task description using microphone"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Key objectives, criteria or background (type or dictate with mic)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Date & Time Block Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Time Block
                  </label>
                  <select
                    value={formTimeBlock}
                    onChange={(e) => setFormTimeBlock(e.target.value as DailyTimeBlock)}
                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="morning">Morning (08:00 - 12:00)</option>
                    <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                    <option value="evening">Evening (17:00 - 20:00)</option>
                    <option value="flexible">Flexible Time</option>
                  </select>
                </div>
              </div>

              {/* Time Slot & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Time Slot (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Estimated Minutes
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={formEstimatedMinutes}
                    onChange={(e) => setFormEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as Priority)}
                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DailyCategory)}
                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Sprint Task (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Link to Project / Sprint Task (Optional)
                </label>
                <select
                  value={formLinkedTaskId}
                  onChange={(e) => setFormLinkedTaskId(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- No Linked Task --</option>
                  {workspaceTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.priority.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Personal remarks, links, or blocker notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  id="btn-cancel-daily-task"
                  onClick={() => setIsModalOpen(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1f1f1f] hover:bg-[#2a2a2a] text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-[#333333] sm:border-transparent"
                >
                  <X className="w-3.5 h-3.5 sm:hidden" />
                  <span>Cancel / Close</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-900/30 transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Sub-component: Time Block Section
// -------------------------------------------------------------
interface TimeBlockSectionProps {
  blockKey: DailyTimeBlock;
  tasks: DailyTask[];
  users: User[];
  onToggleComplete: (task: DailyTask) => void;
  onEdit: (task: DailyTask) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onOpenTaskDetail: (taskId: string) => void;
  workspaceTasks: any[];
}

const TimeBlockSection: React.FC<TimeBlockSectionProps> = ({
  blockKey,
  tasks,
  users,
  onToggleComplete,
  onEdit,
  onDelete,
  onAdd,
  onOpenTaskDetail,
  workspaceTasks
}) => {
  const config = TIME_BLOCK_CONFIG[blockKey];
  const IconComponent = config.icon;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className={`px-5 py-3.5 border-b border-[#222] flex items-center justify-between ${config.bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg bg-black/40 border ${config.borderColor} ${config.color}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{config.label}</h3>
              <span className="text-[11px] font-medium text-slate-400">({config.timeRange})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-300">
            <span className={completedCount === tasks.length ? 'text-emerald-400 font-bold' : 'text-teal-400 font-bold'}>
              {completedCount}
            </span>{' '}
            of {tasks.length} done
          </span>
          <button
            onClick={onAdd}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-black/30 transition-colors"
            title={`Add task to ${config.label}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="divide-y divide-[#1e1e1e]">
        {tasks.map((task) => {
          const user = users.find((u) => u.id === task.userId);
          const catConfig = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.general;
          const priorityConfig = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
          const CatIcon = catConfig.icon;

          return (
            <div
              key={task.id}
              className={`p-3 sm:p-4 transition-colors group hover:bg-[#181818] flex items-start gap-2.5 sm:gap-3.5 ${
                task.completed ? 'opacity-70 bg-[#121212]' : ''
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggleComplete(task)}
                className="mt-0.5 text-slate-400 hover:text-teal-400 transition-colors flex-shrink-0"
                title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 hover:text-teal-400" />
                )}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                  {/* Title */}
                  <span
                    className={`text-xs sm:text-sm font-semibold tracking-tight ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {task.title}
                  </span>

                  {/* Priority Badge */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border ${priorityConfig.bg} ${priorityConfig.border} ${priorityConfig.text}`}
                  >
                    {priorityConfig.label}
                  </span>

                  {/* Category Badge */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-1 ${catConfig.badgeBg} ${catConfig.color}`}
                  >
                    <CatIcon className="w-2.5 h-2.5" />
                    <span>{catConfig.label}</span>
                  </span>

                  {/* Time Slot / Duration */}
                  {(task.timeSlot || task.estimatedMinutes > 0) && (
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-[#202020] px-1.5 sm:px-2 py-0.5 rounded-md border border-[#303030]">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" />
                      <span className="hidden sm:inline">{task.timeSlot ? `${task.timeSlot} • ` : ''}</span>
                      {task.estimatedMinutes}m
                    </span>
                  )}
                </div>

                {/* Description (hidden on mobile to minimize clutter) */}
                {task.description && (
                  <p className="hidden sm:block text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Linked Sprint Task */}
                {task.linkedTaskId && (
                  <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
                    <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="hidden sm:inline">Linked Sprint Task: </span>
                    <button
                      onClick={() => {
                        if (task.linkedTaskId) onOpenTaskDetail(task.linkedTaskId);
                      }}
                      className="font-medium underline hover:text-blue-300 truncate max-w-[180px]"
                    >
                      {task.linkedTaskTitle || task.linkedTaskId}
                    </button>
                  </div>
                )}

                {/* Notes if available (hidden on mobile) */}
                {task.notes && (
                  <div className="hidden sm:block mt-1.5 text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                    <span className="font-semibold text-amber-400">Notes:</span> {task.notes}
                  </div>
                )}

                {/* Bottom Metadata: Assignee & Completed Timestamp */}
                <div className="mt-1.5 sm:mt-2.5 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-500">
                  {user && (
                    <div className="flex items-center gap-1.5">
                      <img src={user.avatar} alt={user.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover" />
                      <span className="text-slate-300 font-medium">{user.name}</span>
                      <span className="hidden sm:inline text-slate-500">({user.title || user.role})</span>
                    </div>
                  )}

                  {task.completed && task.completedAt && (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">Done by </span>
                      <span>{task.completedBy || 'User'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252525] transition-colors"
                  title="Edit Daily Task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#252525] transition-colors"
                  title="Delete Daily Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
