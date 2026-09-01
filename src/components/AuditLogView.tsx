import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  User as UserIcon,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  MessageSquare,
  CheckCircle2,
  Paperclip
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

export const AuditLogView: React.FC = () => {
  const { activityLogs, setSelectedTaskId } = useTasks();
  const { users, isAdmin, currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');

  const actionTypes = [
    'all',
    'Created Task',
    'Status Changed',
    'Completed Subtask',
    'Added Comment',
    'Uploaded Attachment',
    'Updated Status',
    'Reordered Workflow',
    'Created Status',
    'Deleted Status',
    'Created Meeting',
    'Meeting Log Entry'
  ];

  const filteredLogs = activityLogs.filter((log) => {
    if (selectedUserId !== 'all' && log.userId !== selectedUserId) {
      return false;
    }
    if (selectedActionType !== 'all' && log.action !== selectedActionType) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchTask = log.taskTitle?.toLowerCase().includes(q);
      if (!matchDetails && !matchUser && !matchTask) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('Meeting')) {
      return 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50';
    } else if (action.includes('Created')) {
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50';
    } else if (action.includes('Status') || action.includes('Moved')) {
      return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50';
    } else if (action.includes('Subtask') || action.includes('Completed')) {
      return 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/50';
    } else if (action.includes('Comment')) {
      return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50';
    } else if (action.includes('Attachment')) {
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50';
    } else if (action.includes('Deleted')) {
      return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50';
  };

  return (
    <div className="flex-1 p-4 sm:p-6 bg-[#0d0d0d] dark:bg-[#0d0d0d] overflow-y-auto space-y-5 max-w-7xl mx-auto w-full transition-colors duration-200">
      {/* Header Banner */}
      <div className="bg-[#141414] p-5 rounded border border-[#262626] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-950/60 text-blue-400">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-white">Workspace Activity & Security Audit Trail</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Immutable, timestamped audit log of task modifications, status transitions, and user actions
          </p>
        </div>

        <div className="text-xs text-neutral-400 font-medium">
          {isAdmin ? (
            <span className="text-amber-300 bg-amber-950/50 border border-amber-800 px-2.5 py-1 rounded font-semibold">
              Full Organization Audit Log
            </span>
          ) : (
            <span className="text-blue-300 bg-blue-950/50 border border-blue-800 px-2.5 py-1 rounded font-semibold">
              Assigned Tasks Audit Log
            </span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#141414] p-4 rounded border border-[#262626] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user, or task title..."
            className="w-full pl-9 pr-4 py-2 bg-[#1f1f1f] border border-[#333333] rounded text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* User filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400 font-medium">Actor:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-[#1f1f1f] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action type filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400 font-medium">Action:</span>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="bg-[#1f1f1f] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Events</option>
              {actionTypes
                .filter((a) => a !== 'all')
                .map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
            </select>
          </div>

          <span className="text-xs text-neutral-400 font-medium">
            {filteredLogs.length} events logged
          </span>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-[#141414] rounded border border-[#262626] shadow-xs divide-y divide-[#222222] overflow-hidden">
        {filteredLogs.map((log) => {
          const formattedDate = new Date(log.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div
              key={log.id}
              className="p-4 hover:bg-[#1c1c1c] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <img
                  src={log.userAvatar}
                  alt={log.userName}
                  className="w-7 h-7 rounded object-cover ring-1 ring-[#333333] shrink-0 mt-0.5 sm:mt-0"
                />

                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white">{log.userName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>

                    {log.taskTitle && (
                      <button
                        type="button"
                        onClick={() => log.taskId && setSelectedTaskId(log.taskId)}
                        className="text-neutral-300 hover:text-blue-400 font-semibold truncate max-w-xs transition-colors text-left cursor-pointer"
                      >
                        on "{log.taskTitle}"
                      </button>
                    )}
                  </div>

                  <p className="text-neutral-300 leading-relaxed">{log.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-neutral-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-neutral-500">
            <History className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm font-semibold text-neutral-300">No activity matching filter criteria</p>
            <p className="text-xs text-neutral-500 mt-1">
              Actions taken in the workspace will appear here with full timestamps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
