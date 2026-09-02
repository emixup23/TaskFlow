import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  TrendingUp,
  ListTodo,
  Database
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Priority } from '../types';

export const AdminDashboard: React.FC = () => {
  const { stats, tasks, statuses, setSelectedTaskId, setViewMode } = useTasks();
  const { users, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto my-12 shadow-xs transition-colors duration-200">
        <Shield className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Administrator Access Required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          The Executive Analytics Dashboard provides organization-wide insights and is restricted to administrators. Switch to an administrator account (e.g. Sarah Chen) using the bottom user switcher to view this panel.
        </p>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const doneStatuses = statuses.filter((s) => s.isDone).map((s) => s.id);
  const completedTasks = tasks.filter((t) => doneStatuses.includes(t.statusId)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasksList = tasks.filter(
    (t) => !doneStatuses.includes(t.statusId) && t.dueDate && t.dueDate < todayStr
  );

  const dueTodayTasksList = tasks.filter(
    (t) => !doneStatuses.includes(t.statusId) && t.dueDate === todayStr
  );

  // Priority counts
  const priorityCounts: Record<Priority, number> = {
    urgent: tasks.filter((t) => t.priority === 'urgent').length,
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length
  };

  // Subtask totals
  const allSubtasks = tasks.flatMap((t) => t.subtasks || []);
  const completedSubtasks = allSubtasks.filter((s) => s.completed).length;
  const subtaskRate = allSubtasks.length > 0 ? Math.round((completedSubtasks / allSubtasks.length) * 100) : 0;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#0d0d0d] dark:bg-[#0d0d0d] overflow-y-auto space-y-6 max-w-7xl mx-auto w-full transition-colors duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-5 rounded border border-[#262626] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-950/60 text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Executive Analytics & Team Health
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time telemetry across workspace velocity, workflow bottlenecks, and user workloads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-admin-nav-backup"
            onClick={() => setViewMode('backup')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backup &amp; Restore</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1f1f1f] text-neutral-300 border border-[#333] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Total Workload
            </span>
            <span className="p-2 rounded bg-blue-950/60 text-blue-400">
              <ListTodo className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalTasks} Tasks</div>
          <div className="text-xs text-neutral-400 flex items-center gap-1">
            <span>Across</span>
            <strong className="text-neutral-200">{statuses.length} workflow stages</strong>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Sprint Completion
            </span>
            <span className="p-2 rounded bg-emerald-950/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{completionRate}%</div>
          <div className="w-full bg-[#262626] h-1.5 rounded overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Overdue Items */}
        <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Overdue Tasks
            </span>
            <span className="p-2 rounded bg-rose-950/60 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-500 tracking-tight">
            {overdueTasksList.length} Items
          </div>
          <div className="text-xs text-neutral-400">
            {dueTodayTasksList.length} tasks scheduled for today
          </div>
        </div>

        {/* Subtask Execution */}
        <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Checklist Velocity
            </span>
            <span className="p-2 rounded bg-blue-950/60 text-blue-400">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {completedSubtasks}/{allSubtasks.length}
          </div>
          <div className="w-full bg-[#262626] h-1.5 rounded overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded transition-all duration-500"
              style={{ width: `${subtaskRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution Breakdown */}
        <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Workflow Status Distribution
            </h2>
            <span className="text-xs text-neutral-400 font-medium">Real-time counts</span>
          </div>

          <div className="space-y-3">
            {statuses.map((status) => {
              const count = tasks.filter((t) => t.statusId === status.id).length;
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

              return (
                <div key={status.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-semibold text-neutral-300">{status.name}</span>
                    </div>
                    <span className="font-bold text-neutral-200">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#262626] h-2 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: status.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Priority Allocation
            </h2>
            <span className="text-xs text-neutral-400 font-medium">Risk distribution</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded bg-rose-950/40 border border-rose-900/60 space-y-1">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Urgent</span>
              <div className="text-2xl font-bold text-rose-300">{priorityCounts.urgent}</div>
              <p className="text-[11px] text-rose-400">Immediate action required</p>
            </div>

            <div className="p-4 rounded bg-amber-950/40 border border-amber-900/60 space-y-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">High</span>
              <div className="text-2xl font-bold text-amber-300">{priorityCounts.high}</div>
              <p className="text-[11px] text-amber-400">Critical roadmap path</p>
            </div>

            <div className="p-4 rounded bg-blue-950/40 border border-blue-900/60 space-y-1">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Medium</span>
              <div className="text-2xl font-bold text-blue-300">{priorityCounts.medium}</div>
              <p className="text-[11px] text-blue-400">Standard sprint backlog</p>
            </div>

            <div className="p-4 rounded bg-[#1f1f1f] border border-[#333333] space-y-1">
              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Low</span>
              <div className="text-2xl font-bold text-neutral-300">{priorityCounts.low}</div>
              <p className="text-[11px] text-neutral-400">Opportunistic improvements</p>
            </div>
          </div>
        </div>

      </div>

      {/* Team Member Workload Allocation */}
      <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Engineer Workload & Team Capacity
            </h2>
          </div>
          <span className="text-xs text-neutral-400 font-medium">Assigned task distribution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {users.map((user) => {
            const userTasks = tasks.filter((t) => t.assigneeIds.includes(user.id));
            const userDone = userTasks.filter((t) => doneStatuses.includes(t.statusId)).length;
            const userActive = userTasks.length - userDone;

            return (
              <div
                key={user.id}
                className="p-4 rounded border border-[#262626] bg-[#181818] space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded object-cover ring-2 ring-[#262626] shadow-xs"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{user.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262626] text-center">
                  <div className="bg-[#1f1f1f] p-2 rounded border border-[#333333]">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Active</span>
                    <span className="text-sm font-bold text-blue-400">{userActive}</span>
                  </div>
                  <div className="bg-[#1f1f1f] p-2 rounded border border-[#333333]">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Done</span>
                    <span className="text-sm font-bold text-emerald-400">{userDone}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
