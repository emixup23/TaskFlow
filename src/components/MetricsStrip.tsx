import React from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, AlertCircle, CheckCircle2, ListTodo } from 'lucide-react';

export const MetricsStrip: React.FC = () => {
  const { tasks, statuses } = useTasks();
  const { users } = useAuth();

  const totalTasks = tasks.length;
  const doneStatuses = statuses.filter((s) => s.isDone).map((s) => s.id);
  const completedTasks = tasks.filter((t) => doneStatuses.includes(t.statusId)).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';

  const todayStr = new Date().toISOString().split('T')[0];
  const criticalBlockers = tasks.filter(
    (t) =>
      !doneStatuses.includes(t.statusId) &&
      (t.priority === 'urgent' || (t.dueDate && t.dueDate < todayStr))
  ).length;

  const allSubtasks = tasks.flatMap((t) => t.subtasks || []);
  const completedSubtasks = allSubtasks.filter((s) => s.completed).length;
  const capacityPct =
    allSubtasks.length > 0
      ? Math.round((completedSubtasks / allSubtasks.length) * 100)
      : totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 72;

  return (
    <section className="p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 shrink-0 bg-[#121212] dark:bg-[#121212] border-b border-[#262626] transition-colors duration-200">
      {/* 1. Active Tasks */}
      <div className="space-y-1">
        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-tight">
          Active Tasks
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {activeTasks > 0 ? (activeTasks < 10 ? `0${activeTasks}` : activeTasks) : '00'}
        </div>
      </div>

      {/* 2. Completion Rate */}
      <div className="space-y-1">
        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-tight">
          Completion Rate
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {completionRate}%
          </span>
          <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center">
            ↑ 4.2%
          </span>
        </div>
      </div>

      {/* 3. Critical Blockers / Overdue */}
      <div className="space-y-1">
        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-tight">
          Critical Blockers
        </div>
        <div className="text-2xl font-bold text-rose-500 tracking-tight">
          {criticalBlockers < 10 ? `0${criticalBlockers}` : criticalBlockers}
        </div>
      </div>

      {/* 4. Team Capacity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-400 font-semibold uppercase tracking-tight">
            Team Capacity
          </div>
          <span className="text-xs font-bold text-neutral-300">{capacityPct}%</span>
        </div>
        <div className="w-full bg-[#262626] h-2 rounded mt-2.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded transition-all duration-300"
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </div>
    </section>
  );
};
