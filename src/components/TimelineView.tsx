import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Task } from '../types';
import { TagBadge } from './TagBadge';

export const TimelineView: React.FC = () => {
  const { filteredTasks, statuses, setSelectedTaskId } = useTasks();
  const { users } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const doneStatuses = statuses.filter((s) => s.isDone).map((s) => s.id);

  // Group tasks into timeline buckets
  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const noDate: Task[] = [];
  const completed: Task[] = [];

  filteredTasks.forEach((t) => {
    if (doneStatuses.includes(t.statusId)) {
      completed.push(t);
    } else if (!t.dueDate) {
      noDate.push(t);
    } else if (t.dueDate < todayStr) {
      overdue.push(t);
    } else if (t.dueDate === todayStr) {
      dueToday.push(t);
    } else if (t.dueDate <= nextWeekStr) {
      thisWeek.push(t);
    } else {
      later.push(t);
    }
  });

  const buckets = [
    {
      title: 'Critical & Overdue Deliverables',
      count: overdue.length,
      tasks: overdue,
      badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
    },
    {
      title: 'Due Today',
      count: dueToday.length,
      tasks: dueToday,
      badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
      icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
    },
    {
      title: 'Upcoming (Next 7 Days)',
      count: thisWeek.length,
      tasks: thisWeek,
      badge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50',
      icon: <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    },
    {
      title: 'Future Sprints & Backlog',
      count: later.length,
      tasks: later,
      badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50',
      icon: <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
    },
    {
      title: 'Completed Milestones',
      count: completed.length,
      tasks: completed,
      badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    },
    {
      title: 'No Deadline Assigned',
      count: noDate.length,
      tasks: noDate,
      badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50',
      icon: <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
    }
  ];

  return (
    <div className="flex-1 p-2.5 sm:p-6 bg-[#0d0d0d] dark:bg-[#0d0d0d] overflow-y-auto space-y-3 sm:space-y-5 max-w-7xl mx-auto w-full transition-colors duration-200">
      <div className="space-y-3 sm:space-y-5">
        {buckets.map((bucket) => {
          if (bucket.count === 0) return null;

          return (
            <div
              key={bucket.title}
              className="bg-[#141414] rounded border border-[#262626] p-3 sm:p-5 shadow-xs space-y-2.5 sm:space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#262626] pb-2.5 sm:pb-3">
                <div className="flex items-center gap-2.5">
                  {bucket.icon}
                  <h2 className="text-xs sm:text-sm font-bold text-neutral-100 uppercase tracking-wider">
                    {bucket.title}
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${bucket.badge}`}
                  >
                    {bucket.count} items
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                {bucket.tasks.map((task) => {
                  const status = statuses.find((s) => s.id === task.statusId);
                  const assigned = users.filter((u) => task.assigneeIds.includes(u.id));

                  const hashNumber = Math.abs(
                    task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900
                  ) + 100;

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-2.5 sm:p-4 rounded border border-[#262626] hover:border-blue-500/50 hover:shadow-md bg-[#181818] cursor-pointer transition-all space-y-2 sm:space-y-3 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded shrink-0"
                            style={{ backgroundColor: status?.color || '#64748B' }}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">
                            {status?.name}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-500">
                          #{hashNumber}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-semibold text-neutral-100 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                        {task.title}
                      </h3>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {task.tags.map((t) => (
                            <TagBadge key={t} tag={t} size="xs" />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                        <div className="flex -space-x-1.5">
                          {assigned.map((u) => (
                            <img
                              key={u.id}
                              src={u.avatar}
                              alt={u.name}
                              title={u.name}
                              className="w-5 h-5 rounded border-2 border-[#181818] object-cover ring-1 ring-[#333333]"
                            />
                          ))}
                        </div>

                        <span className="text-[10px] font-bold text-neutral-400 bg-[#222222] px-2 py-0.5 rounded border border-[#333333]">
                          {task.dueDate || 'No Date'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
