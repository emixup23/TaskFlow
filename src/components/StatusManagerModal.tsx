import React, { useState } from 'react';
import {
  X,
  Plus,
  Sliders,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  Edit2,
  Shield,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Status } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

export const StatusManagerModal: React.FC = () => {
  const {
    isStatusManagerOpen,
    setIsStatusManagerOpen,
    statuses,
    createStatus,
    updateStatus,
    reorderStatuses,
    deleteStatus,
    tasks
  } = useTasks();

  const { isAdmin } = useAuth();

  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3B82F6');
  const [newStatusDesc, setNewStatusDesc] = useState('');
  const [newStatusIsDone, setNewStatusIsDone] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIsDone, setEditIsDone] = useState(false);
  const [deletingStatusId, setDeletingStatusId] = useState<string | null>(null);
  const [fallbackStatusId, setFallbackStatusId] = useState<string>('');

  if (!isStatusManagerOpen) return null;

  const colorPalette = [
    '#64748B', // Slate
    '#3B82F6', // Blue
    '#0EA5E9', // Sky
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#84CC16', // Lime
    '#F59E0B', // Amber
    '#F97316', // Orange
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899'  // Pink
  ];

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;

    await createStatus({
      name: newStatusName.trim(),
      color: newStatusColor,
      description: newStatusDesc.trim(),
      isDone: newStatusIsDone
    });

    setNewStatusName('');
    setNewStatusDesc('');
    setNewStatusIsDone(false);
  };

  const handleStartEdit = (status: Status) => {
    setEditingStatusId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
    setEditIsDone(Boolean(status.isDone));
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await updateStatus(id, {
      name: editName.trim(),
      color: editColor,
      isDone: editIsDone
    });
    setEditingStatusId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const sorted = [...statuses].sort((a, b) => a.order - b.order);
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const temp = sorted[index];
    sorted[index] = sorted[targetIdx];
    sorted[targetIdx] = temp;

    reorderStatuses(sorted.map((s) => s.id));
  };

  const handleConfirmDelete = async () => {
    if (!deletingStatusId) return;
    await deleteStatus(deletingStatusId, fallbackStatusId || undefined);
    setDeletingStatusId(null);
  };

  const handleQuickSortSequence = (type: 'az' | 'za' | 'tasks-desc' | 'done-last' | 'reverse') => {
    const sorted = [...statuses].sort((a, b) => a.order - b.order);
    switch (type) {
      case 'az':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'tasks-desc':
        sorted.sort((a, b) => {
          const countA = tasks.filter((t) => t.statusId === a.id).length;
          const countB = tasks.filter((t) => t.statusId === b.id).length;
          if (countB !== countA) return countB - countA;
          return a.order - b.order;
        });
        break;
      case 'done-last':
        sorted.sort((a, b) => {
          const aDone = Boolean(a.isDone);
          const bDone = Boolean(b.isDone);
          if (aDone !== bDone) return aDone ? 1 : -1;
          return a.order - b.order;
        });
        break;
      case 'reverse':
        sorted.reverse();
        break;
    }
    reorderStatuses(sorted.map((s) => s.id));
  };

  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        id="status-manager-modal"
        className="relative bg-[#141414] w-full max-w-2xl rounded shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-950/60 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">
                  Workflow Statuses
                </h2>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Customize column workflow sequences, colors, and done states
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsStatusManagerOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Ticket System 5-Status Preset Quick Bar */}
          <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Ticket System Standard:</span>
                <span className="text-neutral-300 ml-1.5">
                  Created assigned → In progress → On hold → Solved → Closed
                </span>
              </div>
            </div>
            <button
              type="button"
              id="btn-apply-ticket-preset"
              onClick={async () => {
                if (window.confirm('Reset workflow statuses to the 5 standard Ticket System statuses (Created assigned, In progress, On hold, Solved, Closed)?')) {
                  const presetStatuses = [
                    { id: 'status-created-assigned', name: 'Created assigned', color: '#3B82F6', isDone: false, description: 'Newly logged ticket assigned for triage' },
                    { id: 'status-in-progress', name: 'In progress', color: '#F59E0B', isDone: false, description: 'Actively being investigated or worked on' },
                    { id: 'status-on-hold', name: 'On hold', color: '#8B5CF6', isDone: false, description: 'Paused pending customer feedback or dependency' },
                    { id: 'status-solved', name: 'Solved', color: '#10B981', isDone: true, description: 'Solution provided and verified' },
                    { id: 'status-closed', name: 'Closed', color: '#64748B', isDone: true, description: 'Ticket finalized and closed' }
                  ];
                  for (const st of presetStatuses) {
                    const existing = statuses.find((s) => s.id === st.id || s.name.toLowerCase() === st.name.toLowerCase());
                    if (existing) {
                      await updateStatus(existing.id, { name: st.name, color: st.color, isDone: st.isDone, description: st.description });
                    } else {
                      await createStatus(st);
                    }
                  }
                }
              }}
              className="px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-[11px] font-semibold shrink-0 transition-colors cursor-pointer"
            >
              Verify / Enforce Ticket Presets
            </button>
          </div>

          {/* Create New Status Form */}
          <div className="p-4 bg-[#181818] rounded border border-[#262626] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add New Workflow Status</span>
            </h3>

            <form onSubmit={handleCreateStatus} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Status Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    placeholder="e.g. In QA Review, Staging"
                    className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewStatusColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                          newStatusColor === c
                            ? 'border-white scale-110'
                            : 'border-[#333333] hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 font-medium">
                  <input
                    type="checkbox"
                    checked={newStatusIsDone}
                    onChange={(e) => setNewStatusIsDone(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Treat as "Completed / Done" state (counts toward completion metrics)</span>
                </label>

                <button
                  type="submit"
                  disabled={!newStatusName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Column</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Statuses List & Reorder */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Active Workflow Sequence ({statuses.length} columns)
              </h3>
              
              {/* Quick Sort Options for Status Columns */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-blue-400" />
                  Sort Sequence:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickSortSequence('az')}
                  className="px-2 py-0.5 bg-[#1f1f1f] hover:bg-[#282828] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  title="Sort status names alphabetically A to Z"
                >
                  A → Z
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSortSequence('za')}
                  className="px-2 py-0.5 bg-[#1f1f1f] hover:bg-[#282828] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  title="Sort status names Z to A"
                >
                  Z → A
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSortSequence('tasks-desc')}
                  className="px-2 py-0.5 bg-[#1f1f1f] hover:bg-[#282828] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  title="Columns with most active tasks first"
                >
                  Most Tasks
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSortSequence('done-last')}
                  className="px-2 py-0.5 bg-[#1f1f1f] hover:bg-[#282828] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  title="Active workflow statuses first, completed statuses at the end"
                >
                  Done Last
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSortSequence('reverse')}
                  className="px-2 py-0.5 bg-[#1f1f1f] hover:bg-[#282828] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  title="Invert current column sequence"
                >
                  Reverse
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {sortedStatuses.map((status, index) => {
                const isEditing = editingStatusId === status.id;
                const taskCount = tasks.filter((t) => t.statusId === status.id).length;

                return (
                  <div
                    key={status.id}
                    className="p-3 bg-[#181818] rounded border border-[#262626] flex items-center justify-between gap-3 shadow-xs hover:border-[#383838] transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white font-semibold"
                        />
                        <div className="flex items-center gap-1">
                          {colorPalette.slice(0, 7).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={`w-5 h-5 rounded-full border cursor-pointer ${
                                editColor === c ? 'border-white scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: c }}
                            ></button>
                          ))}
                        </div>
                        <label className="flex items-center gap-1 text-xs text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsDone}
                            onChange={(e) => setEditIsDone(e.target.checked)}
                            className="rounded"
                          />
                          <span>Done</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(status.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStatusId(null)}
                          className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: status.color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{status.name}</span>
                            {status.isDone && (
                              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 font-semibold px-1.5 py-0.2 rounded border border-emerald-800/50">
                                Completed State
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400">
                            {taskCount} active task{taskCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions: Up / Down / Edit / Delete */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-[#262626] disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={index === sortedStatuses.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-[#262626] disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(status)}
                          className="p-1.5 text-neutral-400 hover:text-blue-400 rounded hover:bg-[#262626] cursor-pointer"
                          title="Rename / Color"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {statuses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = statuses.filter((s) => s.id !== status.id);
                              setFallbackStatusId(remaining[0]?.id || '');
                              setDeletingStatusId(status.id);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-rose-950/50 cursor-pointer"
                            title="Delete status"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Confirmation with Task Migration Modal view */}
          {deletingStatusId && (
            <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded space-y-3 animate-in fade-in duration-100">
              <h4 className="text-xs font-bold text-rose-200">
                Confirm Deletion of Status Column
              </h4>
              <p className="text-xs text-rose-300 leading-relaxed">
                If there are any tasks currently assigned to this status, choose where to safely migrate them:
              </p>

              <div className="flex items-center gap-3">
                <select
                  value={fallbackStatusId}
                  onChange={(e) => setFallbackStatusId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#1f1f1f] border border-rose-800 rounded text-white font-medium cursor-pointer"
                >
                  {statuses
                    .filter((s) => s.id !== deletingStatusId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        Move tasks to: {s.name}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Delete & Migrate
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingStatusId(null)}
                  className="px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
          <p className="text-[11px] text-neutral-400">
            Changes to statuses instantly synchronize across all connected team boards.
          </p>
          <button
            type="button"
            onClick={() => setIsStatusManagerOpen(false)}
            className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
