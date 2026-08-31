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
  Briefcase
} from 'lucide-react';
import { Priority } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { TagBadge } from './TagBadge';
import { UserAvatar } from './UserAvatar';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-150">
      <div
        id="create-task-modal"
        className="relative bg-[#141414] w-full md:w-[90vw] md:max-w-[90vw] lg:w-[90vw] lg:max-w-[90vw] xl:w-[90vw] xl:max-w-[90vw] rounded shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[92vh] h-auto transition-all duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-950/60 flex items-center justify-center text-blue-400">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Create New Task</h2>
              <p className="text-xs text-neutral-400">Add an action item to the team workflow</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
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
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline steps, acceptance criteria, context, or links..."
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
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-[#222222] rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

