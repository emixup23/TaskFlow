import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Check
} from 'lucide-react';
import { Task, Status, Priority } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { TagBadge } from './TagBadge';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { users } = useAuth();
  const { statuses, setSelectedTaskId, moveTaskStatus } = useTasks();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const currentStatus = statuses.find((s) => s.id === task.statusId);
  const isDone = Boolean(currentStatus?.isDone);

  // Derive issue number from task id
  const hashNumber = Math.abs(
    task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900
  ) + 100;

  const tagsList = task.tags && task.tags.length > 0 ? task.tags : ['Feature'];

  // Resolve assignees
  const assignedUsers = users.filter((u) => task.assigneeIds?.includes(u.id));

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
        label: task.dueDate.slice(5),
        isOverdue: false,
        badgeClass: 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900'
      };
    }

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}D OVERDUE`,
        isOverdue: true,
        badgeClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 font-bold'
      };
    } else if (diffDays === 0) {
      return {
        label: 'DUE TODAY',
        isOverdue: false,
        badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 font-bold'
      };
    } else if (diffDays <= 7) {
      const monthStr = due.toLocaleString('default', { month: 'short' }).toUpperCase();
      const dayNum = due.getDate();
      return {
        label: `${monthStr} ${dayNum}`,
        isOverdue: false,
        badgeClass: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-semibold'
      };
    } else {
      const monthStr = due.toLocaleString('default', { month: 'short' }).toUpperCase();
      const dayNum = due.getDate();
      return {
        label: `${monthStr} ${dayNum}`,
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
      className={`group relative p-4 rounded border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md ${
        isDone
          ? 'bg-[#141414] border-[#222222] opacity-75'
          : 'bg-[#181818] border-[#262626] hover:border-blue-500/60'
      }`}
    >
      {/* Top Meta: Tag / Priority + Issue ID */}
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {tagsList.map((tag) => (
            <TagBadge key={tag} tag={tag} size="xs" />
          ))}
          {task.priority === 'urgent' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50 uppercase tracking-wider">
              Urgent
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
              className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-opacity ml-1 cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-[#1a1a1a] rounded shadow-xl border border-[#333333] py-1.5 z-40 text-xs">
                <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Move to:
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

      {/* Task Title */}
      <h4
        className={`text-sm font-semibold mb-1.5 leading-snug text-neutral-100 group-hover:text-blue-400 transition-colors ${
          isDone ? 'line-through text-neutral-500' : ''
        }`}
      >
        {task.title}
      </h4>

      {/* Optional Description snippet if present and active */}
      {!isDone && task.description && (
        <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Card Footer: Assignees Stack & Status Pill */}
      <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-[#262626]">
        
        {/* Assignee Avatar Stack */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {assignedUsers.length > 0 ? (
            assignedUsers.map((u) => (
              <img
                key={u.id}
                src={u.avatar}
                alt={u.name}
                title={u.name}
                className="w-6 h-6 rounded border-2 border-[#181818] object-cover ring-1 ring-[#333333] shrink-0"
              />
            ))
          ) : (
            <div className="w-6 h-6 rounded bg-[#262626] border-2 border-[#181818] flex items-center justify-center text-[9px] text-neutral-400 font-bold">
              --
            </div>
          )}
        </div>

        {/* Right Badges: Completed status, Subtasks count, or Due date */}
        <div className="flex items-center gap-1.5">
          {isDone ? (
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>COMPLETED</span>
            </div>
          ) : totalSubtasks > 0 ? (
            <div className="text-[10px] font-bold text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-1 rounded tracking-wide">
              {completedSubtasks}/{totalSubtasks} SUBTASKS
            </div>
          ) : dueInfo ? (
            <div
              className={`text-[10px] font-bold px-2 py-1 rounded tracking-wide border border-transparent ${dueInfo.badgeClass}`}
            >
              {dueInfo.label}
            </div>
          ) : (
            <div className="text-[10px] font-bold text-neutral-500 bg-[#222222] px-2 py-1 rounded">
              NO DEADLINE
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
