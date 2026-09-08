import React, { useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Clock,
  User as UserIcon,
  CheckSquare,
  ExternalLink,
  Layers,
  Table as TableIcon,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { Task, Priority } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { TagBadge } from './TagBadge';
import { AdminBatchTaskCreator } from './AdminBatchTaskCreator';

export const TableView: React.FC = () => {
  const { filteredTasks, statuses, setSelectedTaskId, updateTask } = useTasks();
  const { users, isAdmin, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'table' | 'create-batch'>('table');
  const [sortField, setSortField] = useState<'title' | 'status' | 'priority' | 'dueDate'>('priority');
  const [sortAsc, setSortAsc] = useState(false);

  // If in create-batch mode, render the AdminBatchTaskCreator page
  if (activeTab === 'create-batch') {
    return <AdminBatchTaskCreator onBackToTable={() => setActiveTab('table')} />;
  }

  const priorityWeight: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else if (sortField === 'priority') {
      cmp = priorityWeight[a.priority] - priorityWeight[b.priority];
    } else if (sortField === 'status') {
      const sA = statuses.find((s) => s.id === a.statusId)?.order || 0;
      const sB = statuses.find((s) => s.id === b.statusId)?.order || 0;
      cmp = sA - sB;
    } else if (sortField === 'dueDate') {
      const dA = a.dueDate || '9999-99-99';
      const dB = b.dueDate || '9999-99-99';
      cmp = dA.localeCompare(dB);
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (field: 'title' | 'status' | 'priority' | 'dueDate') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const priorityBadges: Record<Priority, { label: string; bg: string }> = {
    urgent: { label: 'Urgent', bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50' },
    high: { label: 'High', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50' },
    medium: { label: 'Medium', bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50' },
    low: { label: 'Low', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50' }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 bg-[#0d0d0d] dark:bg-[#0d0d0d] overflow-y-auto transition-colors duration-200 space-y-4">
      {/* Table View Top Navigation Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141414] border border-[#262626] rounded-xl p-3 sm:px-4 sm:py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#1a1a1a] rounded-lg border border-[#2c2c2c]">
            <button
              type="button"
              id="tab-task-table-list"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Task List</span>
              <span className="ml-1 text-[10px] bg-black/30 px-1.5 py-0.2 rounded font-mono">
                {filteredTasks.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-create-multiple-tasks"
              onClick={() => setActiveTab('create-batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'create-batch'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Create Multiple Tasks</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                Admin
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-open-batch-task-creator"
            onClick={() => setActiveTab('create-batch')}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Multiple Tasks</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-[#141414] dark:bg-[#141414] rounded border border-[#262626] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th
                  onClick={() => handleSort('title')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Task Title</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Assignees</th>
                <th
                  onClick={() => handleSort('dueDate')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Deadline</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Checklist</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#222222] text-xs">
              {sortedTasks.map((task) => {
                const status = statuses.find((s) => s.id === task.statusId);
                const assigned = users.filter((u) => task.assigneeIds?.includes(u.id));
                const totalSubtasks = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                const pStyle = priorityBadges[task.priority] || priorityBadges.medium;
                const isDone = Boolean(status?.isDone);

                const hashNumber = Math.abs(
                  task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900
                ) + 100;

                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="hover:bg-[#1f1f1f] transition-colors cursor-pointer group"
                  >
                    {/* Task Title + Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500 font-mono">#{hashNumber}</span>
                        <span
                          className={`font-semibold text-neutral-100 group-hover:text-blue-400 transition-colors ${
                            isDone ? 'line-through text-neutral-500' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {task.tags.map((t) => (
                            <TagBadge key={t} tag={t} size="xs" />
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status column */}
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-[#222222] border border-[#333333]"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded"
                          style={{ backgroundColor: status?.color || '#94a3b8' }}
                        />
                        {status?.name || 'Undefined'}
                      </span>
                    </td>

                    {/* Priority badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${pStyle.bg}`}
                      >
                        {pStyle.label}
                      </span>
                    </td>

                    {/* Assignees */}
                    <td className="py-3 px-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {assigned.map((u) => (
                          <img
                            key={u.id}
                            src={u.avatar}
                            alt={u.name}
                            title={u.name}
                            className="w-6 h-6 rounded border-2 border-[#141414] object-cover ring-1 ring-[#333333] shrink-0"
                          />
                        ))}
                        {assigned.length === 0 && (
                          <span className="text-neutral-500 text-[11px] italic">Unassigned</span>
                        )}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4">
                      {task.dueDate ? (
                        <span className="text-neutral-300 font-medium">{task.dueDate}</span>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">None</span>
                      )}
                    </td>

                    {/* Checklist progress */}
                    <td className="py-3 px-4">
                      {totalSubtasks > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#262626] h-1.5 rounded overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded"
                              style={{
                                width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-neutral-400">
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(task.id);
                        }}
                        title="View & Edit Task Details"
                        className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-[#262626] rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
