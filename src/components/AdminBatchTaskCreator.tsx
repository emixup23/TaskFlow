import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  Flag,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Check,
  Sparkles,
  AlertCircle,
  Search,
  Tag as TagIcon,
  X,
  ChevronDown,
  FolderKanban,
  FileText,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';
import { Priority } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';

export interface StagedTask {
  id: string;
  title: string;
  projectId: string;
  dueDate: string;
  assigneeIds: string[];
  priority: Priority;
  statusId: string;
  description: string;
  tags: string[];
}

interface AdminBatchTaskCreatorProps {
  onBackToTable: () => void;
}

export const AdminBatchTaskCreator: React.FC<AdminBatchTaskCreatorProps> = ({ onBackToTable }) => {
  const { statuses, projects, createBatchTasks, activeProjectId } = useTasks();
  const { users, isAdmin, currentUser } = useAuth();

  // Access validation: Admin or privileged user
  const canAccess = isAdmin || Boolean(currentUser?.privileges?.canCreateTask);

  // Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [titleMode, setTitleMode] = useState<'single' | 'lines'>('single');
  const [bulkTitlesText, setBulkTitlesText] = useState('');
  
  // Project (select list)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjectId && activeProjectId !== 'all' ? activeProjectId : ''
  );

  // Deadline (calendar)
  const [deadline, setDeadline] = useState<string>('');

  // Members (multi-selection list)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  // Priority (multi-selection list)
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>(['medium']);

  // Status (multi-selection list)
  const [selectedStatusIds, setSelectedStatusIds] = useState<string[]>(
    statuses.length > 0 ? [statuses[0].id] : []
  );

  // Description (text area)
  const [description, setDescription] = useState('');

  // Tags (optional)
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');

  // Generation strategy when multiple items are selected
  const [generationStrategy, setGenerationStrategy] = useState<'auto' | 'per_status' | 'per_priority' | 'per_member' | 'cross_product' | 'combined'>('auto');

  // Staged Tasks List (Ready for Batch Creation)
  const [stagedTasks, setStagedTasks] = useState<StagedTask[]>([]);
  const [selectedStagedIds, setSelectedStagedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccessCount, setCreatedSuccessCount] = useState<number | null>(null);

  // Available priorities metadata
  const priorityOptions: { value: Priority; label: string; bg: string; dot: string; text: string }[] = [
    { value: 'urgent', label: 'Urgent', bg: 'bg-rose-950/60 border-rose-800 text-rose-300', dot: 'bg-rose-500', text: 'text-rose-400' },
    { value: 'high', label: 'High', bg: 'bg-amber-950/60 border-amber-800 text-amber-300', dot: 'bg-amber-500', text: 'text-amber-400' },
    { value: 'medium', label: 'Medium', bg: 'bg-blue-950/60 border-blue-800 text-blue-300', dot: 'bg-blue-500', text: 'text-blue-400' },
    { value: 'low', label: 'Low', bg: 'bg-slate-800/80 border-slate-700 text-slate-300', dot: 'bg-slate-400', text: 'text-slate-400' },
  ];

  // Quick preset suggestions for tags
  const suggestedTags = ['frontend', 'backend', 'design', 'bug', 'feature', 'audit', 'api', 'devops', 'urgent'];

  // Filtered members by search
  const filteredUsers = useMemo(() => {
    if (!memberSearch.trim()) return users;
    const q = memberSearch.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, memberSearch]);

  // Handle Tag Addition
  const handleAddTag = () => {
    const trimmed = currentTagInput.trim().replace(/^#/, '').toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Toggle Priority in multi-selection list
  const togglePriority = (p: Priority) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== p);
      }
      return [...prev, p];
    });
  };

  // Toggle Status in multi-selection list
  const toggleStatus = (sId: string) => {
    setSelectedStatusIds((prev) => {
      if (prev.includes(sId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== sId);
      }
      return [...prev, sId];
    });
  };

  // Toggle Member in multi-selection list
  const toggleMember = (uId: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(uId)) {
        return prev.filter((id) => id !== uId);
      }
      return [...prev, uId];
    });
  };

  const selectAllMembers = () => {
    setSelectedMemberIds(users.map((u) => u.id));
  };

  const clearAllMembers = () => {
    setSelectedMemberIds([]);
  };

  // Quick deadline helpers
  const setDeadlinePreset = (daysFromNow: number | null) => {
    if (daysFromNow === null) {
      setDeadline('');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDeadline(d.toISOString().split('T')[0]);
  };

  // Compute how many tasks will be generated from current form settings
  const calculatedTasksToGenerate = useMemo(() => {
    const titles = titleMode === 'lines'
      ? bulkTitlesText.split('\n').map((l) => l.trim()).filter(Boolean)
      : [taskTitle.trim() || 'New Task'];

    if (titles.length === 0) return [];

    const generated: Omit<StagedTask, 'id'>[] = [];
    const baseDesc = description.trim();
    const baseProj = selectedProjectId || '';
    const baseDue = deadline;
    const baseTags = [...tags];

    // Case 1: Line by Line Titles
    if (titleMode === 'lines') {
      titles.forEach((title, idx) => {
        // Cycle status and priority if multiple selected
        const statusId = selectedStatusIds[idx % selectedStatusIds.length] || statuses[0]?.id || '';
        const priority = selectedPriorities[idx % selectedPriorities.length] || 'medium';
        generated.push({
          title,
          projectId: baseProj,
          dueDate: baseDue,
          assigneeIds: [...selectedMemberIds],
          priority,
          statusId,
          description: baseDesc,
          tags: baseTags
        });
      });
      return generated;
    }

    // Case 2: Multi-Status generation
    if (generationStrategy === 'per_status' || (generationStrategy === 'auto' && selectedStatusIds.length > 1 && selectedPriorities.length === 1 && selectedMemberIds.length <= 1)) {
      selectedStatusIds.forEach((sId, idx) => {
        const statusObj = statuses.find((s) => s.id === sId);
        const titleSuffix = selectedStatusIds.length > 1 ? ` (${statusObj?.name || 'Stage ' + (idx + 1)})` : '';
        generated.push({
          title: `${titles[0]}${titleSuffix}`,
          projectId: baseProj,
          dueDate: baseDue,
          assigneeIds: [...selectedMemberIds],
          priority: selectedPriorities[0] || 'medium',
          statusId: sId,
          description: baseDesc,
          tags: baseTags
        });
      });
      return generated;
    }

    // Case 3: Multi-Priority generation
    if (generationStrategy === 'per_priority' || (generationStrategy === 'auto' && selectedPriorities.length > 1 && selectedStatusIds.length === 1 && selectedMemberIds.length <= 1)) {
      selectedPriorities.forEach((pri) => {
        generated.push({
          title: `${titles[0]} [${pri.toUpperCase()}]`,
          projectId: baseProj,
          dueDate: baseDue,
          assigneeIds: [...selectedMemberIds],
          priority: pri,
          statusId: selectedStatusIds[0] || statuses[0]?.id || '',
          description: baseDesc,
          tags: baseTags
        });
      });
      return generated;
    }

    // Case 4: Per-Member generation
    if (generationStrategy === 'per_member' || (generationStrategy === 'auto' && selectedMemberIds.length > 1 && selectedStatusIds.length === 1 && selectedPriorities.length === 1)) {
      selectedMemberIds.forEach((mId) => {
        const userObj = users.find((u) => u.id === mId);
        const titleSuffix = userObj ? ` - ${userObj.name}` : '';
        generated.push({
          title: `${titles[0]}${titleSuffix}`,
          projectId: baseProj,
          dueDate: baseDue,
          assigneeIds: [mId],
          priority: selectedPriorities[0] || 'medium',
          statusId: selectedStatusIds[0] || statuses[0]?.id || '',
          description: baseDesc,
          tags: baseTags
        });
      });
      return generated;
    }

    // Case 5: Cross-product (Status x Priority)
    if (generationStrategy === 'cross_product' || (generationStrategy === 'auto' && selectedStatusIds.length > 1 && selectedPriorities.length > 1)) {
      selectedStatusIds.forEach((sId) => {
        const statusObj = statuses.find((s) => s.id === sId);
        selectedPriorities.forEach((pri) => {
          generated.push({
            title: `${titles[0]} (${statusObj?.name || 'Status'} - ${pri.toUpperCase()})`,
            projectId: baseProj,
            dueDate: baseDue,
            assigneeIds: [...selectedMemberIds],
            priority: pri,
            statusId: sId,
            description: baseDesc,
            tags: baseTags
          });
        });
      });
      return generated;
    }

    // Default: Single task with multiple members and first selected status & priority
    generated.push({
      title: titles[0],
      projectId: baseProj,
      dueDate: baseDue,
      assigneeIds: [...selectedMemberIds],
      priority: selectedPriorities[0] || 'medium',
      statusId: selectedStatusIds[0] || statuses[0]?.id || '',
      description: baseDesc,
      tags: baseTags
    });

    return generated;
  }, [
    taskTitle,
    titleMode,
    bulkTitlesText,
    selectedProjectId,
    deadline,
    selectedMemberIds,
    selectedPriorities,
    selectedStatusIds,
    description,
    tags,
    generationStrategy,
    statuses,
    users
  ]);

  // Stage generated tasks into the interactive table
  const handleStageTasks = () => {
    if (titleMode === 'single' && !taskTitle.trim()) {
      alert('Please enter a Task Title.');
      return;
    }
    if (titleMode === 'lines' && !bulkTitlesText.trim()) {
      alert('Please enter at least one task title.');
      return;
    }

    const newTasks: StagedTask[] = calculatedTasksToGenerate.map((t, idx) => ({
      ...t,
      id: `staged-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
    }));

    setStagedTasks((prev) => [...prev, ...newTasks]);

    // Reset form inputs for next batch
    if (titleMode === 'single') {
      setTaskTitle('');
    } else {
      setBulkTitlesText('');
    }
  };

  // Add blank row to staged tasks table
  const handleAddBlankRow = (count = 1) => {
    const newRows: StagedTask[] = Array.from({ length: count }).map((_, i) => ({
      id: `staged-blank-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Task Title ${stagedTasks.length + i + 1}`,
      projectId: selectedProjectId || (projects[0]?.id || ''),
      dueDate: deadline || '',
      assigneeIds: selectedMemberIds.length > 0 ? [...selectedMemberIds] : [],
      priority: selectedPriorities[0] || 'medium',
      statusId: selectedStatusIds[0] || statuses[0]?.id || '',
      description: '',
      tags: [...tags]
    }));
    setStagedTasks((prev) => [...prev, ...newRows]);
  };

  // Duplicate a staged row
  const handleDuplicateRow = (taskToDup: StagedTask) => {
    const clone: StagedTask = {
      ...taskToDup,
      id: `staged-clone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${taskToDup.title} (Copy)`
    };
    setStagedTasks((prev) => [...prev, clone]);
  };

  // Delete individual staged row
  const handleDeleteRow = (id: string) => {
    setStagedTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedStagedIds((prev) => prev.filter((item) => item !== id));
  };

  // Delete all selected staged rows
  const handleDeleteSelectedRows = () => {
    setStagedTasks((prev) => prev.filter((t) => !selectedStagedIds.includes(t.id)));
    setSelectedStagedIds([]);
  };

  // Update specific field on a staged row
  const updateStagedField = <K extends keyof StagedTask>(id: string, field: K, value: StagedTask[K]) => {
    setStagedTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Submit all staged tasks to server
  const handleCreateAllStagedTasks = async () => {
    if (stagedTasks.length === 0) {
      alert('There are no staged tasks in the table to create. Use the form above or click "+ Add Blank Row" to stage tasks.');
      return;
    }

    // Validate that all tasks have a title
    const invalid = stagedTasks.some((t) => !t.title.trim());
    if (invalid) {
      alert('All tasks must have a non-empty Task Title before creation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = stagedTasks.map((t) => ({
        title: t.title.trim(),
        projectId: t.projectId || undefined,
        dueDate: t.dueDate || undefined,
        assigneeIds: t.assigneeIds,
        priority: t.priority,
        statusId: t.statusId,
        description: t.description.trim(),
        tags: t.tags
      }));

      const res = await createBatchTasks(payload);
      if (res && res.length > 0) {
        setCreatedSuccessCount(res.length);
        setStagedTasks([]);
        setSelectedStagedIds([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant creation directly from form (without staging)
  const handleInstantCreateFromForm = async () => {
    if (titleMode === 'single' && !taskTitle.trim()) {
      alert('Please enter a Task Title.');
      return;
    }
    if (titleMode === 'lines' && !bulkTitlesText.trim()) {
      alert('Please enter at least one task title.');
      return;
    }

    const payload = calculatedTasksToGenerate.map((t) => ({
      title: t.title.trim(),
      projectId: t.projectId || undefined,
      dueDate: t.dueDate || undefined,
      assigneeIds: t.assigneeIds,
      priority: t.priority,
      statusId: t.statusId,
      description: t.description.trim(),
      tags: t.tags
    }));

    setIsSubmitting(true);
    try {
      const res = await createBatchTasks(payload);
      if (res && res.length > 0) {
        setCreatedSuccessCount(res.length);
        setTaskTitle('');
        setBulkTitlesText('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not authorized
  if (!canAccess) {
    return (
      <div className="flex-1 p-6 bg-[#0d0d0d] flex items-center justify-center">
        <div className="max-w-md w-full bg-[#141414] border border-[#2d2d2d] rounded-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Administrator Access Required</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Only workspace administrators or users with task creation privileges can access the Batch Task Creation workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToTable}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            ← Return to Task Table
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-[#0d0d0d] overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141414] border border-[#262626] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToTable}
              className="p-2 bg-[#1c1c1c] hover:bg-[#252525] text-neutral-300 hover:text-white border border-[#303030] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Return to Table View"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Table</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Create Multiple Tasks
                </h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configure task parameters, multi-select assignees/statuses/priorities, and batch-create tasks directly in the workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddBlankRow(3)}
              className="px-3 py-1.5 bg-[#1c1c1c] hover:bg-[#262626] border border-[#333333] text-neutral-300 hover:text-white rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+3 Blank Rows</span>
            </button>

            {stagedTasks.length > 0 && (
              <button
                type="button"
                onClick={handleCreateAllStagedTasks}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating {stagedTasks.length} Tasks...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Create All {stagedTasks.length} Tasks</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Success Alert Banner if tasks were created */}
        {createdSuccessCount !== null && (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">
                  Successfully created {createdSuccessCount} tasks in the workspace!
                </p>
                <p className="text-emerald-400 mt-0.5">
                  All tasks are now live, assigned, and synchronized in the table, kanban, and timeline views.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onBackToTable}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer transition-colors"
              >
                View in Task Table
              </button>
              <button
                type="button"
                onClick={() => setCreatedSuccessCount(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Batch Configuration Form */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white">Batch Task Configuration Form</h2>
            </div>
            <span className="text-[11px] text-neutral-400">
              Fill the attributes below to generate multiple tasks simultaneously
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left Column: Title, Project, Deadline, Description */}
            <div className="space-y-4">
              
              {/* 1. Task Title (text field) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <span>Task Title</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] bg-[#1a1a1a] p-0.5 rounded border border-[#2e2e2e]">
                    <button
                      type="button"
                      onClick={() => setTitleMode('single')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        titleMode === 'single' ? 'bg-blue-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Single / Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setTitleMode('lines')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        titleMode === 'lines' ? 'bg-blue-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Line-by-Line (Bulk)
                    </button>
                  </div>
                </div>

                {titleMode === 'single' ? (
                  <input
                    type="text"
                    id="input-batch-task-title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Audit Database Indexes or Sprint Task #{n}"
                    className="w-full px-3.5 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                ) : (
                  <div className="space-y-1">
                    <textarea
                      id="textarea-bulk-task-titles"
                      rows={4}
                      value={bulkTitlesText}
                      onChange={(e) => setBulkTitlesText(e.target.value)}
                      placeholder={`Enter one task title per line, for example:\nImplement OAuth Client\nSetup Docker Compose Container\nRefactor API Middleware\nRun Integration Test Suite`}
                      className="w-full px-3.5 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                    <div className="text-[11px] text-neutral-400 flex items-center justify-between px-1">
                      <span>{bulkTitlesText.split('\n').filter((l) => l.trim()).length} task titles detected</span>
                      <span>Paste from spreadsheet or docs</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Project (select list) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                  <span>Project (Select List)</span>
                </label>
                <select
                  id="select-batch-project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">No Project (Workspace General)</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Deadline (calendar) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Deadline (Calendar)</span>
                  </label>
                  {deadline && (
                    <button
                      type="button"
                      onClick={() => setDeadline('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Clear date
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    id="input-batch-deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>

                {/* Quick Calendar Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-neutral-500 font-medium mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setDeadlinePreset(0)}
                    className="px-2 py-0.5 bg-[#202020] hover:bg-[#2a2a2a] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlinePreset(1)}
                    className="px-2 py-0.5 bg-[#202020] hover:bg-[#2a2a2a] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlinePreset(7)}
                    className="px-2 py-0.5 bg-[#202020] hover:bg-[#2a2a2a] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  >
                    In 1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlinePreset(14)}
                    className="px-2 py-0.5 bg-[#202020] hover:bg-[#2a2a2a] text-neutral-300 hover:text-white rounded text-[10px] border border-[#333333] transition-colors cursor-pointer"
                  >
                    In 2 Weeks
                  </button>
                </div>
              </div>

              {/* 7. Description (text area) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Description (Text Area)</span>
                </label>
                <textarea
                  id="textarea-batch-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide scope, requirements, or guidelines for the created tasks..."
                  className="w-full px-3.5 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

            </div>

            {/* Right Column: Members (Multi-select), Priority (Multi-select), Status (Multi-select), Tags */}
            <div className="space-y-4">
              
              {/* 4. Members (multi-selection list) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <UsersIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Members (Multi-Selection List)</span>
                    <span className="text-[11px] text-neutral-400 font-normal">
                      ({selectedMemberIds.length} selected)
                    </span>
                  </label>

                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllMembers}
                      className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-600">•</span>
                    <button
                      type="button"
                      onClick={clearAllMembers}
                      className="text-neutral-400 hover:text-neutral-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search member filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members by name or department..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#181818] border border-[#333333] rounded text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Member selection cards grid */}
                <div className="max-h-36 overflow-y-auto bg-[#181818] border border-[#2b2b2b] rounded-lg p-2 divide-y divide-[#242424] space-y-1">
                  {filteredUsers.map((u) => {
                    const isSelected = selectedMemberIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-950/40 text-blue-200' : 'hover:bg-[#202020] text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar src={u.avatar} name={u.name} size="xs" />
                          <div className="truncate">
                            <span className="text-xs font-medium block truncate">{u.name}</span>
                            <span className="text-[10px] text-neutral-500 block truncate">{u.department || u.role}</span>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-3 text-xs text-neutral-500">
                      No members match "{memberSearch}"
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Priority (multi-selection list) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Priority (Multi-Selection List)</span>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    ({selectedPriorities.length} selected)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {priorityOptions.map((opt) => {
                    const isSelected = selectedPriorities.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => togglePriority(opt.value)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? `${opt.bg} shadow-xs font-semibold ring-1 ring-blue-500/50`
                            : 'bg-[#181818] border-[#2e2e2e] text-neutral-400 hover:text-white hover:bg-[#202020]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Status (multi-selection list) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Status (Multi-Selection List)</span>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    ({selectedStatusIds.length} selected)
                  </span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {statuses.map((st) => {
                    const isSelected = selectedStatusIds.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => toggleStatus(st.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-950/50 border-blue-600/70 text-blue-200 font-semibold ring-1 ring-blue-500/40'
                            : 'bg-[#181818] border-[#2e2e2e] text-neutral-400 hover:text-white hover:bg-[#202020]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color || '#3b82f6' }} />
                        <span>{st.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 8. Tags (optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tags (Optional)</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="input-batch-tag"
                    value={currentTagInput}
                    onChange={(e) => setCurrentTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type tag and hit Enter..."
                    className="flex-1 px-3 py-1.5 bg-[#1a1a1a] border border-[#333333] rounded text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-[#242424] hover:bg-[#303030] text-neutral-200 hover:text-white border border-[#383838] rounded text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Tags Display */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/50 border border-sky-800 text-sky-300 text-[11px] font-medium"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-neutral-500 mr-1">Suggestions:</span>
                  {suggestedTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (!tags.includes(t)) setTags([...tags, t]);
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1c1c] text-neutral-400 hover:text-white hover:bg-[#252525] border border-[#2b2b2b] cursor-pointer"
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Dynamic Generation Logic & Action Bar */}
          <div className="pt-4 border-t border-[#222222] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#181818] p-4 rounded-lg">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-200">
                  Generation Summary:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-300 text-[11px] font-bold">
                  {calculatedTasksToGenerate.length} {calculatedTasksToGenerate.length === 1 ? 'task' : 'tasks'} ready to stage
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {titleMode === 'lines'
                  ? `Generates 1 task for each of the ${calculatedTasksToGenerate.length} lines with the selected project, deadline, members, and attributes.`
                  : selectedStatusIds.length > 1
                  ? `Generating ${selectedStatusIds.length} tasks (1 for each selected workflow status).`
                  : selectedPriorities.length > 1
                  ? `Generating ${selectedPriorities.length} tasks (1 for each selected priority level).`
                  : selectedMemberIds.length > 1
                  ? `Generating task assigned to ${selectedMemberIds.length} selected team members.`
                  : `Generating 1 task with the specified parameters.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                id="btn-stage-batch-tasks"
                onClick={handleStageTasks}
                className="flex-1 md:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Stage Tasks in Table ({calculatedTasksToGenerate.length})</span>
              </button>

              <button
                type="button"
                onClick={handleInstantCreateFromForm}
                disabled={isSubmitting}
                className="flex-1 md:flex-initial px-3.5 py-2 bg-[#252525] hover:bg-[#303030] text-neutral-200 hover:text-white border border-[#3d3d3d] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Create directly without staging into table"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Create</span>
              </button>
            </div>

          </div>

        </div>

        {/* The Staged Tasks Table (Multi-Task Queue / Spreadsheet Editor) */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm space-y-0">
          
          {/* Table Toolbar */}
          <div className="p-4 bg-[#181818] border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Staged Tasks Table (Spreadsheet Editor)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold">
                  {stagedTasks.length} {stagedTasks.length === 1 ? 'task' : 'tasks'} queued
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddBlankRow(1)}
                className="px-2.5 py-1.5 bg-[#202020] hover:bg-[#2a2a2a] text-neutral-300 hover:text-white rounded border border-[#333333] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 Row</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlankRow(5)}
                className="px-2.5 py-1.5 bg-[#202020] hover:bg-[#2a2a2a] text-neutral-300 hover:text-white rounded border border-[#333333] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+5 Rows</span>
              </button>

              {selectedStagedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedRows}
                  className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedStagedIds.length})</span>
                </button>
              )}

              {stagedTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all staged tasks?')) {
                      setStagedTasks([]);
                      setSelectedStagedIds([]);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-[#202020] hover:bg-[#2a2a2a] text-neutral-400 hover:text-rose-400 rounded border border-[#333333] text-xs font-medium transition-colors cursor-pointer"
                >
                  Clear Queue
                </button>
              )}
            </div>
          </div>

          {/* Staged Table Content */}
          {stagedTasks.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center mx-auto text-neutral-500">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-300">No Tasks Staged Yet</p>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mt-0.5">
                  Use the Batch Configuration form above to generate tasks or click "+1 Row" / "+5 Rows" to build your tasks in this spreadsheet editor.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAddBlankRow(3)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Add 3 Sample Rows
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#262626] bg-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStagedIds.length === stagedTasks.length && stagedTasks.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStagedIds(stagedTasks.map((t) => t.id));
                          } else {
                            setSelectedStagedIds([]);
                          }
                        }}
                        className="rounded border-[#333333] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 w-64">Task Title *</th>
                    <th className="py-3 px-3 w-40">Project</th>
                    <th className="py-3 px-3 w-36">Deadline</th>
                    <th className="py-3 px-3 w-44">Members</th>
                    <th className="py-3 px-3 w-32">Priority</th>
                    <th className="py-3 px-3 w-36">Status</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 w-20 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#222222] text-xs">
                  {stagedTasks.map((task, index) => {
                    const isChecked = selectedStagedIds.includes(task.id);

                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-[#1a1a1a] transition-colors ${
                          isChecked ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        {/* Select checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStagedIds((prev) => [...prev, task.id]);
                              } else {
                                setSelectedStagedIds((prev) => prev.filter((id) => id !== task.id));
                              }
                            }}
                            className="rounded border-[#333333] cursor-pointer"
                          />
                        </td>

                        {/* Row Index */}
                        <td className="py-2.5 px-3 text-center text-[10px] text-neutral-500 font-mono">
                          {index + 1}
                        </td>

                        {/* Task Title (inline editable) */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateStagedField(task.id, 'title', e.target.value)}
                            placeholder="Enter task title..."
                            className="w-full px-2.5 py-1 bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded text-xs text-white focus:outline-none"
                          />
                        </td>

                        {/* Project select */}
                        <td className="py-2.5 px-3">
                          <select
                            value={task.projectId}
                            onChange={(e) => updateStagedField(task.id, 'projectId', e.target.value)}
                            className="w-full px-2 py-1 bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded text-xs text-white focus:outline-none cursor-pointer"
                          >
                            <option value="">(No Project)</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Deadline (calendar date) */}
                        <td className="py-2.5 px-3">
                          <input
                            type="date"
                            value={task.dueDate}
                            onChange={(e) => updateStagedField(task.id, 'dueDate', e.target.value)}
                            className="w-full px-2 py-1 bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded text-xs text-white focus:outline-none cursor-pointer"
                          />
                        </td>

                        {/* Members multi-select dropdown */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {task.assigneeIds.map((uId) => {
                                const u = users.find((item) => item.id === uId);
                                if (!u) return null;
                                return (
                                  <UserAvatar
                                    key={u.id}
                                    src={u.avatar}
                                    name={u.name}
                                    size="xs"
                                    className="w-5 h-5 ring-1 ring-[#141414]"
                                  />
                                );
                              })}
                            </div>
                            <select
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                if (task.assigneeIds.includes(val)) {
                                  updateStagedField(
                                    task.id,
                                    'assigneeIds',
                                    task.assigneeIds.filter((id) => id !== val)
                                  );
                                } else {
                                  updateStagedField(task.id, 'assigneeIds', [...task.assigneeIds, val]);
                                }
                              }}
                              className="px-1 py-0.5 bg-[#1f1f1f] border border-[#333] rounded text-[10px] text-neutral-300 cursor-pointer"
                            >
                              <option value="">+ Assign</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {task.assigneeIds.includes(u.id) ? `✓ ${u.name}` : u.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Priority select */}
                        <td className="py-2.5 px-3">
                          <select
                            value={task.priority}
                            onChange={(e) => updateStagedField(task.id, 'priority', e.target.value as Priority)}
                            className="w-full px-2 py-1 bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded text-xs text-white focus:outline-none cursor-pointer"
                          >
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </td>

                        {/* Status select */}
                        <td className="py-2.5 px-3">
                          <select
                            value={task.statusId}
                            onChange={(e) => updateStagedField(task.id, 'statusId', e.target.value)}
                            className="w-full px-2 py-1 bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded text-xs text-white focus:outline-none cursor-pointer"
                          >
                            {statuses.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Description */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => updateStagedField(task.id, 'description', e.target.value)}
                            placeholder="Add task notes..."
                            className="w-full px-2.5 py-1 bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded text-xs text-neutral-300 focus:outline-none"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(task)}
                              title="Duplicate row"
                              className="p-1 text-neutral-400 hover:text-white hover:bg-[#252525] rounded transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(task.id)}
                              title="Remove row"
                              className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-[#252525] rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Summary & Creation Footer */}
          {stagedTasks.length > 0 && (
            <div className="p-4 bg-[#181818] border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-neutral-400">
                Total ready to publish: <strong className="text-white">{stagedTasks.length} tasks</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBackToTable}
                  className="px-3 py-1.5 bg-[#222222] hover:bg-[#2a2a2a] text-neutral-300 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-create-all-staged-tasks"
                  onClick={handleCreateAllStagedTasks}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating {stagedTasks.length} Tasks...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Create All {stagedTasks.length} Tasks</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
