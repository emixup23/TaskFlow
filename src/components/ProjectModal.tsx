import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  UserCheck,
  Users,
  Palette,
  Check,
  Trash2,
  AlertCircle,
  FolderPlus,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { Project } from '../types';

const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#64748B'  // Slate
];

export const ProjectModal: React.FC = () => {
  const { users, currentUser, isAdmin } = useAuth();
  const {
    isProjectModalOpen,
    setIsProjectModalOpen,
    editingProject,
    setEditingProject,
    createProject,
    updateProject,
    deleteProject
  } = useTasks();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [ownerId, setOwnerId] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = isAdmin || Boolean(currentUser?.privileges?.canManageProjects);

  // Initialize or reset form on open/change
  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || '');
      setColor(editingProject.color || PROJECT_COLORS[0]);
      setOwnerId(editingProject.ownerId);
      setMemberIds(editingProject.memberIds || []);
      setStatus(editingProject.status);
    } else {
      setName('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      const defaultOwner = currentUser?.id || users[0]?.id || '';
      setOwnerId(defaultOwner);
      setMemberIds(defaultOwner ? [defaultOwner] : []);
      setStatus('active');
    }
    setError(null);
  }, [editingProject, isProjectModalOpen, currentUser?.id, users]);

  if (!isProjectModalOpen) return null;

  const handleToggleMember = (userId: string) => {
    // Owner is always a member
    if (userId === ownerId) return;

    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllMembers = () => {
    setMemberIds(users.map((u) => u.id));
  };

  const handleClearMembers = () => {
    // Keep at least the owner
    setMemberIds(ownerId ? [ownerId] : []);
  };

  const handleOwnerChange = (newOwnerId: string) => {
    setOwnerId(newOwnerId);
    // Ensure the new owner is included in members
    if (!memberIds.includes(newOwnerId)) {
      setMemberIds((prev) => [...prev, newOwnerId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setError('You do not have permission to manage projects.');
      return;
    }

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    if (!ownerId) {
      setError('A project owner must be assigned.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: name.trim(),
          description: description.trim(),
          color,
          ownerId,
          memberIds: Array.from(new Set([...memberIds, ownerId])),
          status
        });
      } else {
        await createProject({
          name: name.trim(),
          description: description.trim(),
          color,
          ownerId,
          memberIds: Array.from(new Set([...memberIds, ownerId]))
        });
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    if (
      window.confirm(
        `Are you sure you want to delete project "${editingProject.name}"? Tasks associated with this project will be moved to the workspace queue.`
      )
    ) {
      setIsSubmitting(true);
      const success = await deleteProject(editingProject.id);
      setIsSubmitting(false);
      if (success) {
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="project-modal-container"
        className="bg-[#121212] border border-[#262626] rounded shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-neutral-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingProject ? 'Project Settings & Team' : 'Create New Project'}
              </h2>
              <p className="text-xs text-neutral-400">
                Assign a project owner and grant member team access
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-project-modal"
            onClick={handleClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded flex items-center gap-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="input-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Core Engine Migration, Mobile App v2"
                required
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-neutral-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Brand Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                      color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#121212]' : 'hover:scale-105 opacity-80'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Project Purpose & Objectives
            </label>
            <textarea
              id="input-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="High-level milestones, goals, or sprint boundaries..."
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-neutral-500 resize-none"
            />
          </div>

          {/* Project Owner Assignment */}
          <div className="space-y-2 bg-[#171717] p-3.5 rounded border border-[#262626]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Assigned Project Owner</span> <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                Responsible for delivery & roadmap
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => {
                const isOwner = ownerId === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleOwnerChange(u.id)}
                    className={`flex items-center justify-between p-2 rounded border text-left transition-all cursor-pointer ${
                      isOwner
                        ? 'bg-blue-950/70 border-blue-500 text-white ring-1 ring-blue-500'
                        : 'bg-[#1e1e1e] border-[#2b2b2b] text-neutral-300 hover:bg-[#252525] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded object-cover ring-1 ring-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate flex items-center gap-1">
                          {u.name}
                          {u.role === 'admin' && (
                            <span className="text-[9px] text-amber-400 font-normal">Admin</span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{u.title}</div>
                      </div>
                    </div>

                    {isOwner && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                        Owner
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Members Multi-Select */}
          <div className="space-y-2 bg-[#171717] p-3.5 rounded border border-[#262626]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Project Team Members ({memberIds.length} assigned)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllMembers}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-neutral-600">•</span>
                <button
                  type="button"
                  onClick={handleClearMembers}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {users.map((u) => {
                const isMember = memberIds.includes(u.id);
                const isOwner = ownerId === u.id;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleMember(u.id)}
                    className={`flex items-center justify-between p-2 rounded border text-left transition-all cursor-pointer ${
                      isMember
                        ? 'bg-[#1f2937]/80 border-blue-600/60 text-white'
                        : 'bg-[#1e1e1e] border-[#2b2b2b] text-neutral-400 hover:bg-[#252525] hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isMember}
                        readOnly
                        className="rounded border-[#333333] text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                      />
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-6 h-6 rounded object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{u.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{u.title}</div>
                      </div>
                    </div>

                    {isOwner ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                        Owner
                      </span>
                    ) : isMember ? (
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-medium shrink-0">
                        Member
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status (if editing) */}
          {editingProject && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Project Lifecycle Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['active', 'completed', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 rounded text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      status === st
                        ? st === 'active'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600'
                          : st === 'completed'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-600'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-600'
                        : 'bg-[#1a1a1a] text-neutral-400 border-[#2b2b2b] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
            {editingProject && canManage ? (
              <button
                type="button"
                id="btn-delete-project"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-3 py-2 rounded text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/50 border border-red-800/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-[#222222] hover:bg-[#2b2b2b] text-neutral-300 hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="btn-submit-project"
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
              >
                {editingProject ? 'Save Project Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
