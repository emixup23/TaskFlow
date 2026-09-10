import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  CheckSquare,
  Square,
  MessageSquare,
  Paperclip,
  Clock,
  Trash2,
  Send,
  Plus,
  Tag as TagIcon,
  Users,
  Shield,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  FileIcon,
  Sparkles,
  Code,
  Lock,
  FileCheck,
  AlertTriangle,
  Briefcase,
  Link2,
  Check,
  Share2,
  Play,
  StopCircle,
  Timer,
  DollarSign,
  Coins,
  Eye,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { Task, Status, Priority, User, CodeLanguage } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useKudos } from '../context/KudosContext';
import { TagBadge } from './TagBadge';
import { CodeEditorTab } from './CodeEditorTab';
import { UserAvatar } from './UserAvatar';
import { FileViewerModal, FileViewerItem } from './FileViewerModal';
import { MessengerComments } from './MessengerComments';
import { VoiceToTextButton } from './VoiceToTextButton';

export const TaskDetailModal: React.FC = () => {
  const {
    tasks,
    statuses,
    projects,
    selectedTaskId,
    setSelectedTaskId,
    generateTaskLink,
    updateTask,
    deleteTask,
    updateTaskCode,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addComment,
    addAttachment,
    deleteAttachment,
    addTimeLog,
    deleteTimeLog,
    toggleTaskTimer,
    activityLogs,
    addToast,
    setViewMode,
    acceptDelegation,
    declineDelegation
  } = useTasks();

  const { currentUser, users, isAdmin } = useAuth();
  const { setIsKudosModalOpen } = useKudos();
  const { setPendingTaskShare } = useChat();
  const todayStr = new Date().toISOString().split('T')[0];

  const task = tasks.find((t) => t.id === selectedTaskId);

  // Local state for edits
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'code' | 'timer' | 'comments' | 'attachments' | 'activity'>('details');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewerFile, setViewerFile] = useState<FileViewerItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Time tracking local state
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [timerNotes, setTimerNotes] = useState('');
  const [timerIsBillable, setTimerIsBillable] = useState(true);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('30');
  const [manualDesc, setManualDesc] = useState('');
  const [manualIsBillable, setManualIsBillable] = useState(true);

  // Live timer interval calculation
  useEffect(() => {
    if (!task?.isTimerRunning || !task?.activeTimerStartedAt) {
      setLiveElapsedSeconds(0);
      return;
    }

    const computeElapsed = () => {
      const startMs = new Date(task.activeTimerStartedAt!).getTime();
      const nowMs = Date.now();
      setLiveElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    };

    computeElapsed();
    const interval = setInterval(computeElapsed, 1000);
    return () => clearInterval(interval);
  }, [task?.isTimerRunning, task?.activeTimerStartedAt]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task?.id, task?.title, task?.description]);

  if (!task || !selectedTaskId) return null;

  // RBAC permissions
  const isAssigned = task.assigneeIds.includes(currentUser?.id || '');
  const canEdit = isAdmin || isAssigned || Boolean(currentUser?.privileges?.canEditAnyTask);
  const canDelete = isAdmin || (Boolean(currentUser?.privileges?.canDeleteTask) && (isAssigned || task.createdBy === currentUser?.id || isAdmin));
  const canUploadFiles = canEdit || Boolean(currentUser?.privileges?.canUploadAttachments);

  const priorityConfigs: Record<Priority, { label: string; color: string; bg: string }> = {
    urgent: {
      label: 'Urgent',
      color: 'text-rose-300',
      bg: 'bg-rose-950/60 border-rose-800/60'
    },
    high: {
      label: 'High',
      color: 'text-amber-300',
      bg: 'bg-amber-950/60 border-amber-800/60'
    },
    medium: {
      label: 'Medium',
      color: 'text-blue-300',
      bg: 'bg-blue-950/60 border-blue-800/60'
    },
    low: {
      label: 'Low',
      color: 'text-neutral-300',
      bg: 'bg-[#1f1f1f] border-[#333333]'
    }
  };

  const handleCopyLink = () => {
    const link = generateTaskLink(task.id);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    addToast('success', `Task deep-link copied to clipboard`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title && canEdit) {
      updateTask(task.id, { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description && canEdit) {
      updateTask(task.id, { description });
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !canEdit) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  // Secure File Validation & Upload
  const processUploadFile = async (file: File) => {
    if (!canUploadFiles) {
      setUploadError('Permission denied: You do not have privilege to upload attachments.');
      return;
    }

    setUploadError(null);

    // 1. Check extension whitelist & block executables
    const allowedExtensions = ['txt', 'csv', 'png', 'jpg', 'jpeg', 'pdf'];
    const blockedExecutables = [
      'exe', 'bat', 'cmd', 'sh', 'bash', 'bin', 'msi', 'js', 'py', 'vbs', 'com', 'scr', 'app', 'apk'
    ];

    const fileNameParts = file.name.split('.');
    const ext = fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() || '' : '';

    if (blockedExecutables.includes(ext)) {
      setUploadError(`Security violation: Executable file types (.${ext}) are blocked by system policy.`);
      return;
    }

    if (!allowedExtensions.includes(ext)) {
      setUploadError(`Invalid file type: .${ext}. Only validated files (PDF, TXT, CSV, PNG, JPG, JPEG) up to 1024 KB are allowed.`);
      return;
    }

    // 2. Validate max size limit: 1024 KB (1048576 bytes)
    const MAX_SIZE_BYTES = 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`File exceeds maximum size limit of 1024 KB (${(file.size / 1024).toFixed(1)} KB).`);
      return;
    }

    try {
      setIsUploading(true);

      // Read file data as base64 for secure storage
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const mimeType = file.type || (ext === 'pdf' ? 'application/pdf' : ext === 'csv' ? 'text/csv' : ext === 'txt' ? 'text/plain' : `application/${ext}`);
          const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
          await addAttachment(task.id, {
            name: file.name,
            size: file.size,
            type: mimeType,
            url: base64Data,
            base64Data: rawBase64
          });
          setIsUploading(false);
          setUploadError(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
          setIsUploading(false);
          setUploadError(err.message || 'Failed to upload attachment');
        }
      };
      reader.onerror = () => {
        setIsUploading(false);
        setUploadError('Failed to read file from disk.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'Upload processing error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canUploadFiles) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canUploadFiles) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadFile(file);
    }
  };

  const handleToggleAssignee = (userId: string) => {
    if (!canEdit) return;
    const newAssignees = task.assigneeIds.includes(userId)
      ? task.assigneeIds.filter((id) => id !== userId)
      : [...task.assigneeIds, userId];

    updateTask(task.id, { assigneeIds: newAssignees });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim() && canEdit) {
      e.preventDefault();
      const clean = newTag.trim().replace(/^#/, '');
      if (!task.tags.includes(clean)) {
        updateTask(task.id, { tags: [...task.tags, clean] });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!canEdit) return;
    updateTask(task.id, { tags: task.tags.filter((t) => t !== tagToRemove) });
  };

  // Subtask progress
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Filter activity logs specifically for this task
  const taskLogs = activityLogs.filter((log) => log.taskId === task.id);
  const totalSnippets = task.codeSnippets?.length || (task.codeSnippet ? 1 : 0);

  return (
    <div
      id="task-detail-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 lg:p-8 animate-in fade-in duration-150"
      onClick={() => setSelectedTaskId(null)}
    >
      <div
        id="task-detail-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#141414] w-full md:w-[90vw] md:max-w-[90vw] lg:w-[90vw] lg:max-w-[90vw] xl:w-[90vw] xl:max-w-[90vw] rounded shadow-2xl border border-[#262626] overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] h-[94vh] sm:h-[90vh] md:h-[88vh] transition-all duration-200"
      >
        {/* Mobile-Only Dedicated Header Bar with Direct Close Button */}
        <div className="flex sm:hidden items-center justify-between px-3.5 py-2.5 bg-[#181818] border-b border-[#262626] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/50 border border-blue-800/40 px-2 py-0.5 rounded truncate">
              {task.code || `TASK-${task.id.slice(0, 6)}`}
            </span>
            <span className="text-xs font-semibold text-neutral-300 truncate max-w-[110px]">
              {statuses.find((s) => s.id === task.statusId)?.name || 'Task'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share / Copy Task Link */}
            <button
              type="button"
              id="btn-copy-task-link-mobile"
              onClick={handleCopyLink}
              title={copiedLink ? 'Link copied!' : 'Share task link'}
              aria-label="Share task link"
              className="p-2 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-neutral-200 transition-colors cursor-pointer active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Discuss in Chat */}
            <button
              type="button"
              id="btn-discuss-in-chat-mobile"
              onClick={() => {
                setPendingTaskShare(task);
                setSelectedTaskId(null);
                setViewMode('chat');
              }}
              title="Discuss in Chat"
              aria-label="Discuss in Chat"
              className="p-2 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-emerald-400 transition-colors cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {canDelete && (
              <button
                type="button"
                id="btn-delete-task-mobile"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                    deleteTask(task.id);
                  }
                }}
                title="Delete Task"
                aria-label="Delete Task"
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/50 border border-transparent hover:border-rose-800 transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* PROMINENT MOBILE CLOSE BUTTON */}
            <button
              type="button"
              id="btn-close-task-modal-mobile"
              onClick={() => setSelectedTaskId(null)}
              aria-label="Close task window"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white font-bold text-xs border border-neutral-600 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4 text-neutral-200" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            
            {/* Top Meta: Status, Priority, Due Date Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status selector */}
              <div className="relative">
                <select
                  id="task-status-selector"
                  value={task.statusId}
                  disabled={!canEdit}
                  onChange={(e) => updateTask(task.id, { statusId: e.target.value })}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded text-xs font-semibold bg-[#1f1f1f] border border-[#333333] shadow-xs text-white focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: statuses.find((s) => s.id === task.statusId)?.color || '#64748B'
                  }}
                />
              </div>

              {/* Priority Selector */}
              <select
                id="task-priority-selector"
                value={task.priority}
                disabled={!canEdit}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
                className={`appearance-none px-3 py-1.5 rounded text-xs font-semibold border shadow-xs focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed ${
                  priorityConfigs[task.priority]?.bg
                } ${priorityConfigs[task.priority]?.color}`}
              >
                <option value="urgent">Urgent Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Due Date Picker */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-[#1f1f1f] border border-[#333333] shadow-xs text-neutral-200" title="Target completion date (today or later)">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="date"
                  id="task-due-date-input"
                  min={todayStr}
                  value={task.dueDate || ''}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val < todayStr) {
                      addToast('error', 'Due date cannot be in the past. Please select today or a future date.');
                      return;
                    }
                    updateTask(task.id, { dueDate: val || undefined });
                  }}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              {!canEdit && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800">
                  <Shield className="w-3 h-3" />
                  Read-Only (Not Assigned)
                </span>
              )}

              {/* Kudos Reward Pill */}
              <button
                type="button"
                onClick={() => setIsKudosModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
                title="Kudos reward awarded upon completing this task"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>+{task.kudosReward || 15} Kudos</span>
              </button>

              {task.delegationStatus === 'declined' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  Delegation Declined (Kudos Refunded)
                </span>
              )}
            </div>

            {/* Delegation Accept/Decline Banner */}
            {task.delegatedBy &&
              task.delegatedBy !== currentUser?.id &&
              task.assigneeIds.includes(currentUser?.id || '') &&
              task.delegationStatus === 'pending' && (
                <div className="p-3 bg-gradient-to-r from-amber-950/40 to-[#1e1e1e] border border-amber-500/40 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Coins className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">
                        Task Delegated to You (Stake: {task.kudosCost || 20} Kudos)
                      </p>
                      <p className="text-[11px] text-neutral-300 leading-snug">
                        Assigned by <strong className="text-white">{task.delegatedByName || 'Teammate'}</strong>. You will earn <strong className="text-amber-300">+{task.kudosReward || 15} Kudos</strong> when completed. If you cannot take this on, you can decline to instantly refund 100% of their Kudos stake.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => acceptDelegation(task.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt('Optional: Reason for declining this task delegation:');
                        declineDelegation(task.id, reason || undefined);
                      }}
                      className="px-3 py-1.5 bg-[#252525] hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 text-neutral-300 border border-neutral-700 font-semibold rounded text-xs transition-colors cursor-pointer"
                    >
                      Decline (Refund)
                    </button>
                  </div>
                </div>
              )}

            {/* Editable Task Title */}
            <input
              type="text"
              id="task-title-input"
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-lg sm:text-xl font-bold text-white bg-transparent border border-transparent hover:border-[#333333] focus:border-blue-500 focus:bg-[#1f1f1f] rounded px-2 py-1 -ml-2 transition-all"
              placeholder="Task Title..."
            />
          </div>

          {/* Desktop Close & Privilege-gated Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Share / Copy Task Link */}
            <button
              type="button"
              id="btn-copy-task-link"
              onClick={handleCopyLink}
              title={copiedLink ? 'Link copied to clipboard!' : 'Copy deep-link to this task'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Discuss in Chat */}
            <button
              type="button"
              id="btn-discuss-in-chat"
              onClick={() => {
                setPendingTaskShare(task);
                setSelectedTaskId(null);
                setViewMode('chat');
              }}
              title="Discuss this task in Team Chat"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chat</span>
            </button>

            {canDelete && (
              <button
                type="button"
                id="btn-delete-task"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                    deleteTask(task.id);
                  }
                }}
                title="Delete Task"
                className="p-2 rounded text-rose-400 hover:bg-rose-950/50 border border-transparent hover:border-rose-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              id="btn-close-task-modal"
              onClick={() => setSelectedTaskId(null)}
              aria-label="Close task window"
              className="p-2 rounded text-neutral-400 hover:text-neutral-200 hover:bg-[#262626] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-[#262626] bg-[#141414] gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            title="Task Details & Checklist"
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Details</span>
            {totalSubtasks > 0 && (
              <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </button>

          {/* Code Tab */}
          <button
            type="button"
            id="tab-code-snippets"
            onClick={() => setActiveTab('code')}
            title="Code Snippets & Multi-Language Editor"
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
            {totalSnippets > 0 && (
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-medium ml-1">
                {totalSnippets}
              </span>
            )}
          </button>

          {/* Time Tracker Tab */}
          <button
            type="button"
            id="tab-time-tracker"
            onClick={() => setActiveTab('timer')}
            title="Time Tracker & Session Logs"
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timer'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>Time Tracker</span>
            {task.isTimerRunning ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-bold ml-1 animate-pulse">
                Active
              </span>
            ) : task.timeLogs && task.timeLogs.length > 0 ? (
              <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
                {Math.floor((task.timeSpentSeconds || 0) / 3600)}h {Math.floor(((task.timeSpentSeconds || 0) % 3600) / 60)}m
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            title="Team Discussion & Comments"
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'comments'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comments</span>
            {task.comments?.length > 0 && (
              <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
                {task.comments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            title="Attachments & Uploaded Documents"
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attachments'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Files</span>
            {task.attachments?.length > 0 && (
              <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
                {task.attachments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            title="Audit Trail & Modification History"
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity</span>
            {taskLogs.length > 0 && (
              <span className="text-[10px] bg-[#222222] text-neutral-300 px-1.5 py-0.2 rounded font-medium ml-1">
                {taskLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body: Split Main Content + Sidebar */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#141414]">
          
          {/* Main 2-Column Content */}
          <div className="md:col-span-2 space-y-6">
            
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Description & Specifications
                    </label>
                    {canEdit && (
                      <VoiceToTextButton
                        id="task-detail-voice-btn"
                        value={description}
                        onChange={setDescription}
                        onDone={(finalVal) => {
                          if (task && finalVal !== task.description && canEdit) {
                            updateTask(task.id, { description: finalVal });
                          }
                        }}
                        title="Dictate or update task description with microphone"
                      />
                    )}
                  </div>
                  <textarea
                    id="task-description-textarea"
                    rows={4}
                    value={description}
                    disabled={!canEdit}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder="Add detailed task instructions, acceptance criteria, or requirements (type or use voice-to-text)..."
                    className="w-full p-3 text-sm text-neutral-200 bg-[#1f1f1f] border border-[#333333] rounded focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-[#181818] disabled:cursor-not-allowed leading-relaxed"
                  />
                </div>

                {/* Checklist / Subtasks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                      <span>Subtasks & Checklist</span>
                    </label>
                    <span className="text-xs font-semibold text-neutral-400">
                      {completedSubtasks} of {totalSubtasks} completed ({subtaskPercent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {totalSubtasks > 0 && (
                    <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          subtaskPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${subtaskPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Subtask Items */}
                  <div className="space-y-2">
                    {task.subtasks?.map((subtask) => (
                      <div
                        key={subtask.id}
                        className={`group flex items-center justify-between p-2.5 rounded border transition-all ${
                          subtask.completed
                            ? 'bg-[#181818] border-[#222222] text-neutral-500'
                            : 'bg-[#1c1c1c] border-[#2c2c2c] hover:border-blue-500/50 text-neutral-200'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() =>
                            updateSubtask(task.id, subtask.id, { completed: !subtask.completed })
                          }
                          className="flex items-start gap-2.5 text-left flex-1 min-w-0 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <span className="mt-0.5 shrink-0 text-blue-400">
                            {subtask.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-500 group-hover:text-blue-400" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-medium leading-tight ${
                                subtask.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                              }`}
                            >
                              {subtask.title}
                            </p>
                            {subtask.completed && subtask.completedBy && (
                              <span className="text-[10px] text-neutral-500">
                                Completed by {subtask.completedBy}
                              </span>
                            )}
                          </div>
                        </button>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => deleteSubtask(task.id, subtask.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Subtask input */}
                  {canEdit && (
                    <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a checklist item..."
                        className="flex-1 px-3 py-2 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!newSubtaskTitle.trim()}
                        className="px-3 py-2 bg-[#262626] hover:bg-[#333333] text-neutral-200 text-xs font-semibold rounded border border-[#333333] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Code Tab */}
            {activeTab === 'code' && (
              <CodeEditorTab
                task={task}
                canEdit={canEdit}
                onUpdateCode={async (data) => {
                  await updateTaskCode(task.id, data);
                }}
              />
            )}

            {/* Time Tracker Tab */}
            {activeTab === 'timer' && (
              <div className="space-y-6">
                {/* Live Stopwatch Section */}
                <div className="p-5 bg-[#181818] border border-[#262626] rounded space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Live Time Tracker</h4>
                    </div>
                    {task.isTimerRunning ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        RECORDING LIVE
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Timer is paused</span>
                    )}
                  </div>

                  {/* Large Digital Stopwatch Display */}
                  <div className="bg-[#121212] border border-[#222222] rounded-lg p-6 text-center">
                    <div className="text-4xl sm:text-5xl font-mono font-bold tracking-widest text-emerald-400 select-all">
                      {String(Math.floor(liveElapsedSeconds / 3600)).padStart(2, '0')}:
                      {String(Math.floor((liveElapsedSeconds % 3600) / 60)).padStart(2, '0')}:
                      {String(liveElapsedSeconds % 60).padStart(2, '0')}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">
                      {task.isTimerRunning && task.activeTimerStartedAt
                        ? `Session started at ${new Date(task.activeTimerStartedAt).toLocaleTimeString()}`
                        : 'Click Start to begin timing your work session'}
                    </p>
                  </div>

                  {/* Timer Controls & Notes */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={timerNotes}
                          onChange={(e) => setTimerNotes(e.target.value)}
                          placeholder="Session note: e.g. Implementing API endpoints..."
                          className="w-full px-3 py-2 text-xs bg-[#121212] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 bg-[#121212] border border-[#333333] rounded text-xs text-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={timerIsBillable}
                          onChange={(e) => setTimerIsBillable(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Billable Work</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      {task.isTimerRunning ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await toggleTaskTimer(task.id, 'stop', timerNotes, timerIsBillable);
                            setTimerNotes('');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-rose-950/40"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span>Stop Timer & Save Session</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await toggleTaskTimer(task.id, 'start', timerNotes, timerIsBillable);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Live Timer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Manual Log Form */}
                <div className="p-4 bg-[#181818] border border-[#262626] rounded space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Log Completed Work Manually</span>
                  </h4>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const hrs = parseInt(manualHours || '0', 10);
                      const mins = parseInt(manualMinutes || '0', 10);
                      const totalSec = (hrs * 3600) + (mins * 60);
                      if (totalSec <= 0) {
                        addToast('error', 'Please enter a valid time duration (at least 1 minute).');
                        return;
                      }
                      await addTimeLog(task.id, {
                        durationSeconds: totalSec,
                        description: manualDesc || undefined,
                        isBillable: manualIsBillable
                      });
                      setManualHours('');
                      setManualMinutes('30');
                      setManualDesc('');
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Hours</label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={manualHours}
                          onChange={(e) => setManualHours(e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 text-xs bg-[#121212] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={manualMinutes}
                          onChange={(e) => setManualMinutes(e.target.value)}
                          placeholder="30"
                          className="w-full px-2.5 py-1.5 text-xs bg-[#121212] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-neutral-400 mb-1">Work Description</label>
                        <input
                          type="text"
                          value={manualDesc}
                          onChange={(e) => setManualDesc(e.target.value)}
                          placeholder="Notes on work completed..."
                          className="w-full px-2.5 py-1.5 text-xs bg-[#121212] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={manualIsBillable}
                          onChange={(e) => setManualIsBillable(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Billable session</span>
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                      >
                        Add Time Log
                      </button>
                    </div>
                  </form>
                </div>

                {/* Summary Metrics & Work Logs List */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#181818] border border-[#262626] rounded text-center">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Total Logged</span>
                      <span className="text-lg font-bold font-mono text-white">
                        {Math.floor((task.timeSpentSeconds || 0) / 3600)}h {Math.floor(((task.timeSpentSeconds || 0) % 3600) / 60)}m
                      </span>
                    </div>
                    <div className="p-3 bg-[#181818] border border-[#262626] rounded text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Billable Time</span>
                      <span className="text-lg font-bold font-mono text-emerald-300">
                        {Math.floor(
                          (task.timeLogs?.filter((l) => l.isBillable).reduce((acc, cur) => acc + cur.durationSeconds, 0) || 0) / 3600
                        )}h{' '}
                        {Math.floor(
                          ((task.timeLogs?.filter((l) => l.isBillable).reduce((acc, cur) => acc + cur.durationSeconds, 0) || 0) % 3600) / 60
                        )}m
                      </span>
                    </div>
                    <div className="p-3 bg-[#181818] border border-[#262626] rounded text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Total Sessions</span>
                      <span className="text-lg font-bold font-mono text-blue-400">
                        {task.timeLogs?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Logs Table / List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Logged Sessions History
                    </h4>

                    {task.timeLogs && task.timeLogs.length > 0 ? (
                      <div className="space-y-1.5">
                        {task.timeLogs.map((log) => {
                          const hrs = Math.floor(log.durationSeconds / 3600);
                          const mins = Math.floor((log.durationSeconds % 3600) / 60);
                          const secs = log.durationSeconds % 60;
                          return (
                            <div
                              key={log.id}
                              className="flex items-center justify-between p-3 bg-[#181818] border border-[#262626] rounded text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {log.userAvatar && (
                                  <img
                                    src={log.userAvatar}
                                    alt={log.userName}
                                    className="w-6 h-6 rounded-full object-cover shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-white">{log.userName || 'Team Member'}</span>
                                    {log.isBillable ? (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                        Billable
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                                        Non-billable
                                      </span>
                                    )}
                                    <span className="text-[10px] text-neutral-500">
                                      {new Date(log.createdAt).toLocaleDateString()} at{' '}
                                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {log.description && (
                                    <p className="text-neutral-300 text-xs mt-0.5 truncate">{log.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <span className="font-mono font-bold text-white text-sm">
                                  {hrs > 0 ? `${hrs}h ` : ''}
                                  {mins}m {secs > 0 && hrs === 0 ? `${secs}s` : ''}
                                </span>
                                {(isAdmin || log.userId === currentUser?.id) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteTimeLog(task.id, log.id)}
                                    className="p-1 text-neutral-500 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Delete this time log"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-neutral-500 text-xs bg-[#161616] rounded border border-[#222222]">
                        No time logged on this task yet. Start the live stopwatch or log time manually above.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <MessengerComments task={task} canEdit={canEdit} />
            )}

            {/* Attachments Tab */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                {/* Security and Validation Banner */}
                <div className="p-3 bg-[#181818] border border-[#262626] rounded flex items-start gap-2.5 text-xs text-neutral-300">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Secure Attachment Protocol</span>
                      <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded font-semibold uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Validated file types: <strong className="text-neutral-200">.txt, .csv, .png, .jpg, .jpeg</strong> • Max size: <strong className="text-neutral-200">1024 KB</strong> • Executable binaries blocked.
                    </p>
                  </div>
                </div>

                {/* Upload Validation Error Feedback */}
                {uploadError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded text-xs flex items-center justify-between animate-in fade-in duration-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="text-rose-300 hover:text-white font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Upload Drag-and-Drop Zone */}
                {canUploadFiles && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-950/20'
                        : 'border-[#333333] hover:border-blue-500/80 bg-[#161616] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="attachment-file-input"
                      accept=".pdf,.txt,.csv,.png,.jpg,.jpeg"
                    />
                    <label
                      htmlFor="attachment-file-input"
                      className="cursor-pointer flex flex-col items-center gap-2.5 select-none"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center text-blue-400">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {isUploading ? 'Validating & uploading file...' : 'Drop files here or click to browse'}
                        </span>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          PDF, TXT, CSV, PNG, JPG up to 1024 KB
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Attachments List with rich metadata */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
                    <span>Attached Files ({task.attachments?.length || 0})</span>
                    <span className="text-[10px] text-neutral-500 font-normal lowercase">
                      token-protected download
                    </span>
                  </div>

                  {task.attachments?.length > 0 ? (
                    task.attachments.map((att) => {
                      const isPdf = att.name.toLowerCase().endsWith('.pdf') || att.type === 'application/pdf';
                      const isCsv = att.name.toLowerCase().endsWith('.csv') || att.type === 'text/csv';
                      const isTxt = att.name.toLowerCase().endsWith('.txt') || att.type === 'text/plain';
                      const isImage = att.type?.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(att.name);
                      const sizeInKb = (att.size / 1024).toFixed(1);
                      const formattedDate = att.uploadedAt
                        ? new Date(att.uploadedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recently';

                      const canDeleteThisAtt =
                        isAdmin ||
                        att.uploadedBy === currentUser?.id ||
                        Boolean(currentUser?.privileges?.canDeleteAttachments);

                      return (
                        <div
                          key={att.id}
                          className="p-3 bg-[#181818] border border-[#262626] rounded-lg hover:border-[#383838] shadow-sm transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              {/* File icon / Thumbnail */}
                              <div
                                onClick={() => setViewerFile(att)}
                                className="w-10 h-10 rounded flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all select-none"
                                title="Click to view file in app"
                              >
                                {isImage && att.url ? (
                                  <img
                                    src={att.url}
                                    alt={att.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : isPdf ? (
                                  <div className="w-full h-full bg-rose-950/60 border border-rose-800/80 flex flex-col items-center justify-center text-rose-400">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-[8px] font-bold tracking-wider uppercase text-rose-300">PDF</span>
                                  </div>
                                ) : isCsv ? (
                                  <div className="w-full h-full bg-emerald-950/60 border border-emerald-800/80 flex flex-col items-center justify-center text-emerald-400">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span className="text-[8px] font-bold tracking-wider uppercase text-emerald-300">CSV</span>
                                  </div>
                                ) : isTxt ? (
                                  <div className="w-full h-full bg-sky-950/60 border border-sky-800/80 flex flex-col items-center justify-center text-sky-400">
                                    <FileCode className="w-4 h-4" />
                                    <span className="text-[8px] font-bold tracking-wider uppercase text-sky-300">TXT</span>
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-blue-950/60 border border-blue-800/80 flex flex-col items-center justify-center text-blue-400">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              {/* File Details */}
                              <div className="min-w-0 space-y-0.5">
                                <p
                                  onClick={() => setViewerFile(att)}
                                  className="text-xs font-bold text-white truncate cursor-pointer hover:text-blue-400 transition-colors"
                                  title={`View ${att.name} in app`}
                                >
                                  {att.name}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-400">
                                  <span className="font-semibold text-neutral-300">{sizeInKb} KB</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    {att.uploadedByAvatar && (
                                      <img
                                        src={att.uploadedByAvatar}
                                        alt={att.uploadedByName}
                                        className="w-3.5 h-3.5 rounded-full object-cover inline"
                                      />
                                    )}
                                    <span>{att.uploadedByName || 'Team Member'}</span>
                                  </span>
                                  <span>•</span>
                                  <span>{formattedDate}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* In-App View Button */}
                              <button
                                type="button"
                                onClick={() => setViewerFile(att)}
                                className="px-2.5 py-1.5 bg-[#222222] hover:bg-blue-600/20 text-neutral-300 hover:text-blue-400 border border-[#333333] hover:border-blue-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="View file content inside app"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-400" />
                                <span className="hidden sm:inline">View in App</span>
                              </button>

                              {/* Download Link/Button */}
                              <a
                                href={att.downloadUrl || `/api/attachments/${att.id}/download`}
                                download={att.name}
                                className="p-1.5 text-neutral-400 hover:text-emerald-300 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                                title="Download File Securely"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              {/* Preview / View in Browser */}
                              {att.url && (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}

                              {/* Delete Attachment */}
                              {canDeleteThisAtt && (
                                <button
                                  type="button"
                                  onClick={() => deleteAttachment(task.id, att.id)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                                  title="Delete Attachment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Checksum & Security Validation Pill */}
                          <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] text-neutral-500">
                            <span className="flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-emerald-400" />
                              <span>Validated (Max 1024 KB Verified)</span>
                            </span>
                            <span className="font-mono text-neutral-600">
                              {att.checksum ? `hash:${att.checksum.substring(0, 10)}...` : 'Protected'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-neutral-500 text-xs bg-[#161616] rounded border border-[#222222]">
                      No attachments uploaded yet. Files attached here are validated and stored securely.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task-Specific Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                {taskLogs.length > 0 ? (
                  taskLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-[#181818] rounded border border-[#262626] text-xs"
                    >
                      <img
                        src={log.userAvatar}
                        alt={log.userName}
                        className="w-6 h-6 rounded object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{log.userName}</span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(log.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800">
                          {log.action}
                        </span>
                        <p className="text-neutral-300 text-xs mt-1">{log.details}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-neutral-500 text-xs">No logged activity yet for this task.</div>
                )}
              </div>
            )}

          </div>

          {/* Right Metadata Sidebar */}
          <div className="space-y-5 border-t md:border-t-0 md:border-l border-[#262626] pt-5 md:pt-0 md:pl-6">
            
            {/* Quick Time Tracker Widget */}
            <div className="p-3 bg-[#181818] border border-[#262626] rounded space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Time Logged</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('timer')}
                  className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  View Details →
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-base font-bold font-mono text-white block">
                    {Math.floor((task.timeSpentSeconds || 0) / 3600)}h {Math.floor(((task.timeSpentSeconds || 0) % 3600) / 60)}m
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {task.timeLogs?.length || 0} work session{task.timeLogs?.length === 1 ? '' : 's'}
                  </span>
                </div>

                {task.isTimerRunning ? (
                  <button
                    type="button"
                    onClick={() => toggleTaskTimer(task.id, 'stop', timerNotes, timerIsBillable)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-colors cursor-pointer animate-pulse"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Stop ({String(Math.floor(liveElapsedSeconds / 60)).padStart(2, '0')}:{String(liveElapsedSeconds % 60).padStart(2, '0')})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleTaskTimer(task.id, 'start', timerNotes, timerIsBillable)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Timer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project Association */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Assigned Project</span>
              </label>
              <select
                id="task-project-select"
                value={task.projectId || ''}
                disabled={!canEdit}
                onChange={(e) => updateTask(task.id, { projectId: e.target.value || undefined })}
                className="w-full px-3 py-1.5 text-xs bg-[#1f1f1f] border border-[#333333] rounded focus:ring-1 focus:ring-blue-500 text-neutral-200 font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                <option value="">General Workspace Queue</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignees Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Assigned Team Members
              </label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {users.map((user) => {
                  const isAssignedToUser = task.assigneeIds?.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleToggleAssignee(user.id)}
                      className={`w-full flex items-center justify-between p-2 rounded text-left transition-all cursor-pointer ${
                        isAssignedToUser
                          ? 'bg-blue-950/60 border border-blue-800 text-blue-200 font-semibold'
                          : 'hover:bg-[#1c1c1c] border border-transparent text-neutral-400'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={user} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs truncate text-white">{user.name}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{user.title}</p>
                        </div>
                      </div>

                      {isAssignedToUser && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                Tags & Labels
              </label>

              <div className="flex flex-wrap gap-1.5">
                {task.tags?.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    size="sm"
                    onRemove={canEdit ? () => handleRemoveTag(tag) : undefined}
                  />
                ))}
              </div>

              {canEdit && (
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag + Enter..."
                  className="w-full px-2.5 py-1.5 text-xs bg-[#1f1f1f] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Direct Deep Link Widget */}
            <div className="space-y-1.5 pt-2 border-t border-[#262626]">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Task Share Link</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </label>
              <div className="flex items-center gap-1.5 p-1.5 bg-[#181818] border border-[#2d2d2d] rounded">
                <input
                  type="text"
                  readOnly
                  value={generateTaskLink(task.id)}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-transparent text-[11px] font-mono text-neutral-300 select-all outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy Task URL"
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Creation & Update Metadata */}
            <div className="pt-2 border-t border-[#222222] space-y-2 text-[11px] text-neutral-400">
              <div className="flex items-center justify-between">
                <span>Created by:</span>
                <span className="font-semibold text-neutral-300">{task.createdByName || 'Admin'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created on:</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last updated:</span>
                <span>{new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Sticky Mobile Bottom Bar with Close Button */}
        <div className="sm:hidden px-4 py-2.5 bg-[#181818] border-t border-[#262626] flex items-center justify-between gap-3 shrink-0 z-10">
          <span className="text-xs text-neutral-400 truncate max-w-[180px]">
            {task.title || 'Untitled Task'}
          </span>
          <button
            type="button"
            id="btn-close-task-modal-mobile-bottom"
            onClick={() => setSelectedTaskId(null)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white text-xs font-bold border border-neutral-600 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Close Task</span>
          </button>
        </div>

      </div>

      {/* In-App File Viewer Modal */}
      <FileViewerModal
        isOpen={Boolean(viewerFile)}
        file={viewerFile}
        onClose={() => setViewerFile(null)}
      />
    </div>
  );
};
