import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Tag as TagIcon,
  Users,
  CheckCircle2,
  AlertCircle,
  Layers,
  Briefcase,
  Coins,
  Sparkles
} from 'lucide-react';
import { Priority } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useKudos } from '../context/KudosContext';
import { TagBadge } from './TagBadge';
import { UserAvatar } from './UserAvatar';
import { VoiceToTextButton } from './VoiceToTextButton';

export const CreateTaskModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    statuses,
    projects,
    activeProjectId,
    createTask,
    addToast
  } = useTasks();
  const { users, currentUser, isAdmin } = useAuth();
  const {
    wallet,
    calculateDelegationCost,
    calculateTaskReward,
    canAffordDelegation,
    setIsKudosModalOpen
  } = useKudos();

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(statuses[0]?.id || 'status-created-assigned');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Engineering']);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<{ title: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize defaults on modal open
  useEffect(() => {
    if (isCreateModalOpen) {
      if (activeProjectId && activeProjectId !== 'all') {
        setProjectId(activeProjectId);
      } else if (projects.length > 0) {
        setProjectId(projects[0].id);
      } else {
        setProjectId('');
      }
      setAssigneeIds(currentUser ? [currentUser.id] : []);
    }
  }, [isCreateModalOpen, activeProjectId, projects, currentUser]);

  if (!isCreateModalOpen) return null;

  const handleToggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, { title: subtaskInput.trim() }]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (dueDate && dueDate < todayStr) {
      setDateError('Due date cannot be in the past. Please select today or a future date.');
      addToast('error', 'Due date cannot be in the past');
      return;
    }

    setIsSubmitting(true);
    const created = await createTask({
      title: title.trim(),
      description: description.trim(),
      statusId: statusId || statuses[0]?.id,
      projectId: projectId || undefined,
      priority,
      assigneeIds,
      dueDate: dueDate || undefined,
      tags,
      subtasks
    });

    setIsSubmitting(false);
    if (created) {
      // Reset form & close
      setTitle('');
      setDescription('');
      setDueDate('');
      setDateError('');
      setSubtasks([]);
      setTags(['Engineering']);
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div
      id="create-task-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 lg:p-8 animate-in fade-in duration-150"
      onClick={() => setIsCreateModalOpen(false)}
    >
      <div
        id="create-task-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#141414] w-full md:w-[90vw] md:max-w-[90vw] lg:w-[90vw] lg:max-w-[90vw] xl:w-[90vw] xl:max-w-[90vw] rounded shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] h-auto transition-all duration-200"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 flex items-center justify-center text-blue-400 border border-blue-800/40 shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">Create New Task</h2>
              <p className="text-xs text-neutral-400 truncate hidden xs:block">Add an action item to the team workflow</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-create-task-modal"
            onClick={() => setIsCreateModalOpen(false)}
            aria-label="Close task creation window"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:p-1.5 text-neutral-200 hover:text-white rounded-lg bg-[#222222] sm:bg-transparent border border-[#333333] sm:border-transparent hover:bg-[#2a2a2a] transition-all cursor-pointer active:scale-95 text-xs font-bold shrink-0"
          >
            <X className="w-4.5 h-4.5 text-neutral-300" />
            <span className="sm:hidden">Close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Title Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="create-task-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth 2.0 and RBAC Middleware"
              className="w-full px-3.5 py-2.5 text-sm bg-[#1f1f1f] border border-[#333333] rounded focus:ring-1 focus:ring-blue-500 focus:bg-[#1f1f1f] transition-all text-white placeholder:text-neutral-500 font-medium"
            />
          </div>

          {/* Project & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Assigned Project</span>
              </label>
              <select
                id="create-task-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded focus:ring-1 focus:ring-blue-500 text-neutral-200 font-medium cursor-pointer"
              >
                <option value="">General Workspace Queue</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Initial Status
              </label>
              <select
                id="create-task-status"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded focus:ring-1 focus:ring-blue-500 text-neutral-200 font-medium cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Priority
              </label>
              <select
                id="create-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded focus:ring-1 focus:ring-blue-500 text-neutral-200 font-medium cursor-pointer"
              >
                <option value="urgent">🔴 Urgent Priority</option>
                <option value="high">🟠 High Priority</option>
                <option value="medium">🔵 Medium Priority</option>
                <option value="low">⚪ Low Priority</option>
              </select>
            </div>
          </div>

          {/* Due Date & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span>Target Deadline</span>
                <span className="text-[10px] text-neutral-500 font-normal">Today or later</span>
              </label>
              <input
                type="date"
                id="create-task-duedate"
                min={todayStr}
                value={dueDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val < todayStr) {
                    setDateError('Selected date cannot be in the past');
                    setDueDate(val);
                  } else {
                    setDateError('');
                    setDueDate(val);
                  }
                }}
                className={`w-full px-3 py-2 text-xs bg-[#1f1f1f] border rounded focus:ring-1 text-neutral-200 cursor-pointer ${
                  dateError
                    ? 'border-rose-600 focus:ring-rose-500 text-rose-300'
                    : 'border-[#333333] focus:ring-blue-500'
                }`}
              />
              {dateError && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{dateError}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Tags & Labels
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {tags.map((t) => (
                  <TagBadge
                    key={t}
                    tag={t}
                    size="sm"
                    onRemove={() => handleRemoveTag(t)}
                  />
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag and press Enter..."
                className="w-full px-3 py-1.5 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Assign Team Members
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {users.map((user) => {
                const isSelected = assigneeIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggleAssignee(user.id)}
                    className={`flex items-center justify-between p-2 rounded text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-800 text-blue-200 font-semibold'
                        : 'bg-[#181818] border-[#262626] text-neutral-400 hover:bg-[#202020]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar user={user} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs truncate text-white">{user.name}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{user.title}</p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Kudos Economy Delegation Preview */}
            {(() => {
              const currentUserId = currentUser?.id || '';
              const delegationCost = calculateDelegationCost(assigneeIds, currentUserId);
              const canAfford = canAffordDelegation(delegationCost, currentUserId);
              const externalCount = assigneeIds.filter((id) => id !== currentUserId).length;
              const rewardPreview = calculateTaskReward({ priority, dueDate });

              return (
                <div className="space-y-2 pt-1">
                  {delegationCost > 0 ? (
                    <div
                      className={`p-2.5 rounded border text-xs flex flex-col gap-1.5 transition-all ${
                        canAfford
                          ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                          : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            Delegation Stake: <strong className="text-amber-300 font-bold">{delegationCost} Kudos</strong> ({externalCount} teammate{externalCount > 1 ? 's' : ''} &times; 20)
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          Wallet: <span className="font-semibold text-white">{wallet.balance} Kudos</span>
                        </span>
                      </div>

                      {!canAfford ? (
                        <div className="flex items-start gap-1.5 text-[11px] text-rose-300 bg-rose-900/30 p-2 rounded border border-rose-800/40">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                          <span>
                            <strong>Insufficient Kudos Balance.</strong> You need {delegationCost} Kudos to delegate, but only have {wallet.balance} Kudos. Assign yourself for 0 Kudos, complete pending tasks to earn more, or adjust assignees.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-amber-400/80">
                          <span>Balance after creating: <strong>{wallet.balance - delegationCost} Kudos</strong></span>
                          <span className="text-neutral-400 text-[10px]">✨ 100% refunded if assignee declines</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#181818] border border-[#262626] rounded text-[11px] text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Self-assignment: <strong>0 Kudos spent</strong></span>
                      </div>
                      <span className="text-neutral-400">Wallet: {wallet.balance} Kudos</span>
                    </div>
                  )}

                  {/* Task Completion Reward Preview */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-950/20 border border-blue-900/30 rounded text-[11px] text-blue-300">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Completion Reward: <strong className="text-white">+{rewardPreview.total} Kudos</strong></span>
                    </div>
                    <span className="text-neutral-400 text-[10px]">
                      Base {rewardPreview.base} + {priority.toUpperCase()} ({rewardPreview.difficultyMultiplier}x) {rewardPreview.speedBonus ? '+ on-time' : ''}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Detailed Description
              </label>
              <VoiceToTextButton
                id="create-task-voice-btn"
                value={description}
                onChange={setDescription}
              />
            </div>
            <textarea
              id="create-task-description-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline steps, acceptance criteria, context, or links (type or dictate with mic)..."
              className="w-full p-3 text-xs bg-[#1f1f1f] border border-[#333333] rounded focus:ring-1 focus:ring-blue-500 text-neutral-200 placeholder:text-neutral-500 leading-relaxed"
            />
          </div>

          {/* Initial Checklist / Subtasks */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Initial Checklist Items
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[#181818] rounded text-xs text-neutral-200 border border-[#262626]"
                  >
                    <span className="truncate">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-neutral-400 hover:text-rose-400 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                placeholder="Add subtask item..."
                className="flex-1 px-3 py-1.5 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-[#222222] hover:bg-[#2a2a2a] text-neutral-200 text-xs font-semibold rounded border border-[#333333] transition-colors cursor-pointer"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-3">
            <button
              type="button"
              id="btn-cancel-create-task"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-[#222222] border border-[#333333] sm:border-transparent rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 sm:hidden" />
              <span>Cancel / Close</span>
            </button>

            {(() => {
              const currentUserId = currentUser?.id || '';
              const delegationCost = calculateDelegationCost(assigneeIds, currentUserId);
              const cannotAfford = delegationCost > 0 && !canAffordDelegation(delegationCost, currentUserId);

              return (
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || cannotAfford}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded shadow-xs transition-colors cursor-pointer ${
                    cannotAfford
                      ? 'bg-rose-800 opacity-60 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-40'
                  }`}
                >
                  {isSubmitting
                    ? 'Creating...'
                    : cannotAfford
                    ? `Insufficient Kudos (${delegationCost} Required)`
                    : 'Create Task'}
                </button>
              );
            })()}
          </div>
        </form>
      </div>
    </div>
  );
};

