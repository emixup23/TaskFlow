import React, { useState, useMemo, memo } from 'react';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Check,
  Link2
} from 'lucide-react';
import { Task, Status, Priority } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { TagBadge } from './TagBadge';
import { UserAvatar } from './UserAvatar';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = memo(({ task }) => {
  const { users } = useAuth();
  const { statuses, setSelectedTaskId, moveTaskStatus, generateTaskLink, addToast } = useTasks();
  const { t, formatDate } = useLanguage();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derive issue number from task id
  const hashNumber = useMemo(() => {
    return Math.abs(
      task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900
    ) + 100;
  }, [task.id]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = generateTaskLink(task.id);
    navigator.clipboard.writeText(link);
    setCopied(true);
    addToast('success', `Copied link for #${hashNumber}`);
    setTimeout(() => {
      setCopied(false);
      setShowStatusMenu(false);
    }, 1200);
  };

  const currentStatus = useMemo(() => statuses.find((s) => s.id === task.statusId), [statuses, task.statusId]);
  const isDone = Boolean(currentStatus?.isDone);

  const tagsList = task.tags && task.tags.length > 0 ? task.tags : ['Feature'];

  // Resolve assignees with memoization to avoid redundant array allocations
  const assignedUsers = useMemo(() => {
    if (!task.assigneeIds || task.assigneeIds.length === 0) return [];
    const assigneeSet = new Set(task.assigneeIds);
    return users.filter((u) => assigneeSet.has(u.id));
  }, [users, task.assigneeIds]);

  // Subtask calculations
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

  // Due Date calculation
  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (isDone) {
      return {
        label: formatDate(new Date(task.dueDate), { month: 'short', day: 'numeric' }),
        isOverdue: false,
        badgeClass: 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900'
      };
    }

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d ${t('tasks.overdue', 'Overdue')}`.toUpperCase(),
        isOverdue: true,
        badgeClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 font-bold'
      };
    } else if (diffDays === 0) {
      return {
        label: t('tasks.dueToday', 'Due Today').toUpperCase(),
        isOverdue: false,
        badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 font-bold'
      };
    } else if (diffDays <= 7) {
      return {
        label: formatDate(due, { month: 'short', day: 'numeric' }).toUpperCase(),
        isOverdue: false,
        badgeClass: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-semibold'
      };
    } else {
      return {
        label: formatDate(due, { month: 'short', day: 'numeric' }).toUpperCase(),
        isOverdue: false,
        badgeClass: 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900'
      };
    }
  };

  const dueInfo = getDueDateInfo();

  return (
    <div
      id={`task-card-${task.id}`}
      onClick={() => setSelectedTaskId(task.id)}
      className={`group relative p-2.5 sm:p-4 rounded-lg border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md ${
        isDone
          ? 'bg-[#141414] border-[#222222] opacity-75'
          : 'bg-[#181818] border-[#262626] hover:border-blue-500/60'
      }`}
    >
      {/* Top Meta: Tag / Priority + Issue ID */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2.5 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Primary Tag on mobile, all tags on desktop */}
          {tagsList.length > 0 && (
            <TagBadge tag={tagsList[0]} size="xs" />
          )}
          {tagsList.length > 1 && (
            <>
              {tagsList.slice(1).map((tag) => (
                <span key={tag} className="hidden sm:inline-flex">
                  <TagBadge tag={tag} size="xs" />
                </span>
              ))}
              <span className="sm:hidden text-[9px] text-neutral-500 font-medium px-1 rounded bg-[#202020]">
                +{tagsList.length - 1}
              </span>
            </>
          )}
          {task.priority === 'urgent' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50 uppercase tracking-wider">
              {t('priority.urgent', 'Urgent')}
            </span>
          )}
          {task.kudosReward ? (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 flex items-center gap-0.5"
              title="Kudos reward earned on completion"
            >
              🪙 +{task.kudosReward}
            </span>
          ) : null}
          {task.delegationStatus === 'pending' && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-600/40"
              title="Delegated task awaiting acceptance"
            >
              {t('tasks.delegated', 'Delegated')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-neutral-500 font-mono">#{hashNumber}</span>

          {/* Quick status move popup */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              title="Quick Move"
              className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-opacity ml-1 cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-[#1a1a1a] rounded shadow-xl border border-[#333333] py-1.5 z-40 text-xs">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left hover:bg-[#262626] text-neutral-200 border-b border-[#2d2d2d] mb-1 font-medium cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{t('common.copied', 'Link Copied!')}</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('tasks.copyLink', 'Copy Task Link')}</span>
                    </>
                  )}
                </button>

                <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('tasks.moveTo', 'Move to:')}
                </div>
                {statuses.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      moveTaskStatus(task.id, st.id);
                      setShowStatusMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left hover:bg-[#262626] transition-colors cursor-pointer ${
                      st.id === task.statusId
                        ? 'font-bold text-blue-400 bg-blue-950/40'
                        : 'text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded shrink-0" style={{ backgroundColor: st.color }} />
                      <span className="truncate">{st.name}</span>
                    </div>
                    {st.id === task.statusId && <ChevronRight className="w-3 h-3 text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Title with Dot representation */}
      <div className="flex items-start gap-2 mb-1.5">
        <span
          className={`mt-1 inline-block w-2.5 h-2.5 rounded-full shrink-0 ring-2 ${
            task.isTimerRunning ? 'ring-emerald-500 animate-pulse' : 'ring-[#262626]'
          }`}
          style={{ backgroundColor: currentStatus?.color || '#3B82F6' }}
          title={`Status: ${currentStatus?.name || 'Task'}`}
        />
        <h4
          className={`text-xs sm:text-sm font-semibold leading-snug text-neutral-100 group-hover:text-blue-400 transition-colors flex-1 ${
            isDone ? 'line-through text-neutral-500' : ''
          }`}
        >
          {task.title}
        </h4>
      </div>

      {/* Time Tracking Indicator if active or logged */}
      {(task.isTimerRunning || (task.timeSpentSeconds && task.timeSpentSeconds > 0)) && (
        <div className="flex items-center gap-2 mb-2">
          {task.isTimerRunning ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="sm:hidden">LIVE</span>
              <span className="hidden sm:inline">LIVE TRACKING</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-[#222222] px-1.5 py-0.5 rounded border border-[#333333]">
              <Clock className="w-3 h-3 text-neutral-500" />
              {Math.floor((task.timeSpentSeconds || 0) / 3600)}h {Math.floor(((task.timeSpentSeconds || 0) % 3600) / 60)}m
              <span className="hidden sm:inline"> logged</span>
            </span>
          )}
        </div>
      )}

      {/* Optional Description snippet - hidden on mobile to reduce card height and clutter */}
      {!isDone && task.description && (
        <p className="hidden sm:block text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Card Footer: Assignees Stack & Status Pill */}
      <div className="flex items-center justify-between mt-2 sm:mt-3.5 pt-1.5 sm:pt-2 border-t border-[#262626]">
        
        {/* Assignee Avatar Stack */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {assignedUsers.length > 0 ? (
            assignedUsers.map((u) => (
              <div key={u.id} className="ring-1 ring-[#333333] rounded shrink-0" title={u.name}>
                <UserAvatar
                  user={u}
                  size="sm"
                  className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#181818]"
                />
              </div>
            ))
          ) : (
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#262626] border-2 border-[#181818] flex items-center justify-center text-[9px] text-neutral-400 font-bold">
              --
            </div>
          )}
        </div>

        {/* Right Badges: Completed status, Subtasks count, or Due date */}
        <div className="flex items-center gap-1.5">
          {isDone ? (
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              <Check className="w-3 h-3 stroke-[3]" />
              <span className="hidden sm:inline">COMPLETED</span>
              <span className="sm:hidden">DONE</span>
            </div>
          ) : totalSubtasks > 0 ? (
            <div className="text-[10px] font-bold text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 sm:py-1 rounded tracking-wide">
              {completedSubtasks}/{totalSubtasks}
              <span className="hidden sm:inline"> SUBTASKS</span>
            </div>
          ) : dueInfo ? (
            <div
              className={`text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded tracking-wide border border-transparent ${dueInfo.badgeClass}`}
            >
              {dueInfo.label}
            </div>
          ) : (
            <div className="hidden sm:block text-[10px] font-bold text-neutral-500 bg-[#222222] px-2 py-1 rounded">
              NO DEADLINE
            </div>
          )}
        </div>

      </div>

    </div>
  );
});
