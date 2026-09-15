import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  Archive,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square,
  Trash2,
  UserCheck,
  Calendar,
  MessageSquare,
  Code2,
  Paperclip,
  LayoutList,
  Columns,
  Split,
  Tag as TagIcon,
  Flame,
  Check,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Task, Priority, Status } from '../types';
import { UserAvatar } from './UserAvatar';
import { TagBadge } from './TagBadge';

export const TicketSystemView: React.FC = () => {
  const {
    tasks,
    statuses,
    projects,
    activeProjectId,
    updateTask,
    deleteTask,
    setSelectedTaskId,
    setIsCreateModalOpen,
    addToast
  } = useTasks();

  const { users, currentUser, isAdmin } = useAuth();

  // Layout View Mode: 'list' (Table), 'board' (Kanban columns), 'split' (Master-Detail)
  const [layoutMode, setLayoutMode] = useState<'list' | 'board' | 'split'>('list');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const isFilterActive = priorityFilter !== 'all' || tagFilter !== 'all' || assigneeFilter !== 'all';
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [activeSplitTaskId, setActiveSplitTaskId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'updatedAt' | 'title'>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Quick ticket drawer state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickAssignee, setQuickAssignee] = useState<string>(currentUser?.id || '');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickTag, setQuickTag] = useState('Support');

  // Filter tasks based on active project, search, and ticket filters
  const filteredTickets = useMemo(() => {
    let result = tasks.filter((t) => {
      // Project filter
      if (activeProjectId && activeProjectId !== 'all' && t.projectId !== activeProjectId) {
        return false;
      }

      // Status filter
      if (statusFilter === 'my_assigned') {
        if (!currentUser || !t.assigneeIds.includes(currentUser.id)) return false;
      } else if (statusFilter === 'urgent_sla') {
        if (t.priority !== 'urgent' && t.priority !== 'high') return false;
      } else if (statusFilter !== 'all') {
        if (t.statusId !== statusFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
        return false;
      }

      // Tag filter
      if (tagFilter !== 'all' && !(t.tags || []).includes(tagFilter)) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (!t.assigneeIds.includes(assigneeFilter)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const matchId = t.id.toLowerCase().includes(q);
        const matchCreator = (t.createdByName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTags && !matchId && !matchCreator) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'dueDate') {
        const dateA = a.dueDate || '9999-99-99';
        const dateB = b.dueDate || '9999-99-99';
        return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      }
      if (sortBy === 'priority') {
        const pWeights: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        const wA = pWeights[a.priority] || 0;
        const wB = pWeights[b.priority] || 0;
        return sortAsc ? wA - wB : wB - wA;
      }
      if (sortBy === 'title') {
        return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      // default: updatedAt
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [tasks, activeProjectId, statusFilter, priorityFilter, tagFilter, assigneeFilter, searchQuery, sortBy, sortAsc, currentUser]);

  // If in split mode and no ticket is active, select the first ticket
  React.useEffect(() => {
    if (layoutMode === 'split' && filteredTickets.length > 0) {
      if (!activeSplitTaskId || !filteredTickets.some((t) => t.id === activeSplitTaskId)) {
        setActiveSplitTaskId(filteredTickets[0].id);
      }
    }
  }, [layoutMode, filteredTickets, activeSplitTaskId]);

  // Statistics calculation across statuses
  const ticketStats = useMemo(() => {
    const total = tasks.length;
    const byStatus: Record<string, number> = {};
    statuses.forEach((s) => {
      byStatus[s.id] = 0;
    });
    let urgentCount = 0;
    let overdueCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    tasks.forEach((t) => {
      if (byStatus[t.statusId] !== undefined) {
        byStatus[t.statusId]++;
      }
      if (t.priority === 'urgent') urgentCount++;
      if (t.dueDate && t.dueDate < todayStr) overdueCount++;
    });

    return { total, byStatus, urgentCount, overdueCount };
  }, [tasks, statuses]);

  // Unique tags list for filter dropdown
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [tasks]);

  // Find status helpers
  const getStatus = (statusId: string): Status | undefined => {
    return statuses.find((s) => s.id === statusId);
  };

  const getStatusColor = (statusId: string): string => {
    const s = getStatus(statusId);
    return s?.color || '#3B82F6';
  };

  // Bulk operations
  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map((t) => t.id));
    }
  };

  const handleToggleSelectTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (targetStatusId: string) => {
    const targetStatus = getStatus(targetStatusId);
    if (!targetStatus) return;

    for (const id of selectedTicketIds) {
      await updateTask(id, { statusId: targetStatusId });
    }
    addToast('success', `Moved ${selectedTicketIds.length} ticket(s) to "${targetStatus.name}"`);
    setSelectedTicketIds([]);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTicketIds.length} selected tickets?`)) {
      return;
    }
    for (const id of selectedTicketIds) {
      await deleteTask(id);
    }
    addToast('success', `Deleted ${selectedTicketIds.length} ticket(s)`);
    setSelectedTicketIds([]);
  };

  // Quick ticket creation
  const handleQuickCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    // Find default status (Created assigned)
    const initialStatus = statuses.find((s) => s.id === 'status-created-assigned') || statuses[0];

    const { createTask } = useTasks();
    const newTask = await createTask({
      title: quickTitle.trim(),
      description: quickDesc.trim(),
      statusId: initialStatus ? initialStatus.id : 'status-created-assigned',
      priority: quickPriority,
      assigneeIds: quickAssignee ? [quickAssignee] : [],
      dueDate: quickDueDate || undefined,
      tags: quickTag ? [quickTag] : ['Support'],
      subtasks: []
    });

    if (newTask) {
      addToast('success', `Ticket created with status "${initialStatus?.name || 'Created assigned'}"`);
      setQuickTitle('');
      setQuickDesc('');
      setQuickDueDate('');
      setShowQuickCreate(false);
    }
  };

  // Drag & drop handlers for Kanban Queue Board
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.statusId === targetStatusId) return;

    const targetStatus = getStatus(targetStatusId);
    await updateTask(taskId, { statusId: targetStatusId });
    addToast('success', `Updated ticket status to "${targetStatus?.name || targetStatusId}"`);
  };

  // Active split task object
  const activeSplitTask = useMemo(() => {
    return tasks.find((t) => t.id === activeSplitTaskId) || filteredTickets[0] || null;
  }, [tasks, activeSplitTaskId, filteredTickets]);

  const priorityConfigs: Record<Priority, { label: string; bg: string; text: string; dot: string }> = {
    urgent: { label: 'Urgent', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-500' },
    high: { label: 'High', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
    medium: { label: 'Medium', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
    low: { label: 'Low', bg: 'bg-neutral-500/10 border-neutral-500/30', text: 'text-neutral-400', dot: 'bg-neutral-400' }
  };

  return (
    <div id="ticket-system-view" className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d] overflow-hidden">
      
      {/* Top Header & Ticket KPIs Banner */}
      <div className="p-2.5 sm:p-5 border-b border-[#222222] bg-[#121212]/90 backdrop-blur-xs space-y-2.5 sm:space-y-4">
        
        {/* Title and Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Tickets</h1>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-semibold uppercase">
                  5-Stage Workflow
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions & Layout Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Layout Mode Toggle */}
            <div className="flex items-center p-1 bg-[#1a1a1a] border border-[#2b2b2b] rounded">
              <button
                type="button"
                id="btn-ticket-view-list"
                onClick={() => setLayoutMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  layoutMode === 'list' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Table Queue View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="btn-ticket-view-board"
                onClick={() => setLayoutMode('board')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  layoutMode === 'board' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Kanban Columns View"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="btn-ticket-view-split"
                onClick={() => setLayoutMode('split')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  layoutMode === 'split' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Split Queue & Inspector View"
              >
                <Split className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Search Button */}
            <button
              type="button"
              id="btn-toggle-ticket-search"
              onClick={() => setShowSearch((prev) => !prev)}
              className={`p-2 rounded border transition-colors flex items-center justify-center cursor-pointer relative ${
                showSearch
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : searchQuery
                  ? 'bg-blue-950/60 text-blue-300 border-blue-600/50'
                  : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border-[#2b2b2b]'
              }`}
              title={showSearch ? 'Hide Search Bar' : 'Search Tickets'}
            >
              <Search className="w-3.5 h-3.5" />
              {searchQuery && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute top-1 right-1" />
              )}
            </button>

            {/* Toggle Filters Button */}
            <button
              type="button"
              id="btn-toggle-ticket-filters"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`p-2 rounded border transition-colors flex items-center justify-center cursor-pointer relative ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : isFilterActive
                  ? 'bg-blue-950/60 text-blue-300 border-blue-600/50'
                  : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border-[#2b2b2b]'
              }`}
              title={showFilters ? 'Hide Filters' : 'Filter Tickets'}
            >
              <Filter className="w-3.5 h-3.5" />
              {isFilterActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute top-1 right-1" />
              )}
            </button>

            {/* Create Ticket Modal Trigger */}
            <button
              type="button"
              id="btn-create-ticket-main"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Quick Ticket Button */}
            <button
              type="button"
              id="btn-quick-new-ticket"
              onClick={() => setShowQuickCreate(true)}
              className="px-3 py-1.5 bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-neutral-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Ticket</span>
            </button>


          </div>
        </div>

        {/* Desktop: 5+ Status Cards KPI Row */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          
          {/* Total Tickets */}
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#1e1e1e] border-blue-500/60 ring-1 ring-blue-500/30'
                : 'bg-[#171717] border-[#262626] hover:border-[#383838]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1">
              <span>All Tickets</span>
              <Ticket className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">{ticketStats.total}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Full Queue</div>
          </div>

          {/* Status 1: Created assigned */}
          {statuses.map((status) => {
            const count = ticketStats.byStatus[status.id] || 0;
            const isSelected = statusFilter === status.id;

            return (
              <div
                key={status.id}
                id={`kpi-card-${status.id}`}
                onClick={() => setStatusFilter(status.id)}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e1e1e] border-blue-500/60 ring-1 ring-blue-500/30 shadow-xs'
                    : 'bg-[#171717] border-[#262626] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold mb-1 truncate">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="truncate text-neutral-300">{status.name}</span>
                  </div>
                  {status.isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <div className="text-xl font-bold text-white tracking-tight">{count}</div>
                <div className="text-[10px] text-neutral-400 truncate mt-0.5" title={status.description}>
                  {status.name === 'Created assigned'
                    ? 'Newly logged'
                    : status.name === 'In progress'
                    ? 'Active work'
                    : status.name === 'On hold'
                    ? 'Pending / Paused'
                    : status.name === 'Solved'
                    ? 'Ready to verify'
                    : 'Closed'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Filter Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="filter-tab-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border border-[#2b2b2b]'
              }`}
            >
              All ({ticketStats.total})
            </button>

            {statuses.map((st) => (
              <button
                key={st.id}
                id={`filter-tab-${st.id}`}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[#2a2a2a] text-white border border-blue-500/50 shadow-xs'
                    : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border border-[#2b2b2b]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                <span>{st.name}</span>
                <span className="text-[10px] opacity-70 px-1 py-0.2 bg-black/40 rounded">
                  {ticketStats.byStatus[st.id] || 0}
                </span>
              </button>
            ))}

            <button
              type="button"
              id="filter-tab-my-assigned"
              onClick={() => setStatusFilter('my_assigned')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'my_assigned'
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border border-[#2b2b2b]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assigned to Me</span>
            </button>

            <button
              type="button"
              id="filter-tab-urgent"
              onClick={() => setStatusFilter('urgent_sla')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'urgent_sla'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border border-[#2b2b2b]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Urgent & High ({ticketStats.urgentCount})</span>
            </button>
          </div>

          <div className="text-xs text-neutral-400 shrink-0 font-medium">
            <span className="text-white font-semibold">{filteredTickets.length}</span>/{' '}
            <span className="text-neutral-300">{tasks.length}</span> tickets
          </div>
        </div>

        {/* Active Search / Filters indicator chips when bars are hidden */}
        {((!showSearch && searchQuery) || (!showFilters && isFilterActive)) && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            {!showSearch && searchQuery && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/15 border border-blue-500/30 text-blue-300">
                <Search className="w-3 h-3 text-blue-400" />
                <span className="truncate max-w-[150px]">"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {!showFilters && isFilterActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/15 border border-blue-500/30 text-blue-300">
                <Filter className="w-3 h-3 text-blue-400" />
                <span>Filters Active</span>
                <button
                  type="button"
                  onClick={() => {
                    setPriorityFilter('all');
                    setTagFilter('all');
                    setAssigneeFilter('all');
                  }}
                  className="hover:text-white p-0.5 text-[11px] underline ml-1 cursor-pointer"
                  title="Reset all filters"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Search Bar */}
        {showSearch && (
          <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                id="input-ticket-search"
                autoFocus
                placeholder="Search by ticket title, #TCK-ID, tags, requester, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-[#171717] border border-[#2e2e2e] rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="button"
              id="btn-close-ticket-search"
              onClick={() => setShowSearch(false)}
              className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#222] transition-colors shrink-0 cursor-pointer"
              title="Close search bar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Collapsible Filters Bar */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 p-2.5 bg-[#171717] border border-[#262626] rounded animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Filter className="w-3 h-3 text-blue-400" />
                Filters:
              </span>

              {/* Priority Selector */}
              <select
                id="select-ticket-priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] rounded text-xs text-neutral-300 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚪ Low</option>
              </select>

              {/* Tag Selector */}
              {allTags.length > 0 && (
                <select
                  id="select-ticket-tag-filter"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] rounded text-xs text-neutral-300 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Categories/Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
              )}

              {/* Assignee Filter */}
              <select
                id="select-ticket-assignee-filter"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] rounded text-xs text-neutral-300 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <button
                type="button"
                id="btn-ticket-sort-toggle"
                onClick={() => setSortAsc(!sortAsc)}
                className="px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] text-neutral-300 hover:text-white rounded text-xs flex items-center gap-1.5 cursor-pointer"
                title={`Sort ${sortAsc ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-[11px]">{sortAsc ? 'Asc' : 'Desc'}</span>
              </button>

              {/* Reset Filters button if active */}
              {isFilterActive && (
                <button
                  type="button"
                  id="btn-reset-ticket-filters"
                  onClick={() => {
                    setPriorityFilter('all');
                    setTagFilter('all');
                    setAssigneeFilter('all');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline ml-1 cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>

            <button
              type="button"
              id="btn-close-ticket-filters"
              onClick={() => setShowFilters(false)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#222] transition-colors shrink-0 self-end sm:self-center cursor-pointer"
              title="Close filters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bulk Action Toolbar (When 1 or more tickets selected) */}
        {selectedTicketIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-950/40 border border-blue-500/40 rounded p-2.5 text-xs text-blue-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-bold bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]">
                {selectedTicketIds.length} selected
              </span>
              <span>Bulk update workflow status:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {statuses.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleBulkStatusChange(st.id)}
                  className="px-2.5 py-1 bg-[#1e1e1e] hover:bg-[#292929] border border-[#3d3d3d] text-white rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                  <span>Move to {st.name}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicketIds([])}
                className="text-neutral-400 hover:text-white text-xs underline ml-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Body: Table, Board, or Split */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        
        {/* Quick Ticket Drawer Overlay */}
        {showQuickCreate && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#2b2b2b] rounded w-full max-w-lg shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Log New Ticket</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(false)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleQuickCreateTicket} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">Ticket Subject / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VPN handshake latency spike [TCK-115]"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1b1b1b] border border-[#333333] rounded text-xs text-white placeholder-neutral-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-300">Issue Description / Steps</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about the issue or request..."
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1b1b1b] border border-[#333333] rounded text-xs text-white placeholder-neutral-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-300">Priority</label>
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value as Priority)}
                      className="w-full px-2.5 py-1.5 bg-[#1b1b1b] border border-[#333333] rounded text-xs text-white cursor-pointer"
                    >
                      <option value="urgent">🔴 Urgent</option>
                      <option value="high">🟠 High</option>
                      <option value="medium">🔵 Medium</option>
                      <option value="low">⚪ Low</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-300">Assignee</label>
                    <select
                      value={quickAssignee}
                      onChange={(e) => setQuickAssignee(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#1b1b1b] border border-[#333333] rounded text-xs text-white cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-300">Category Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. IT Helpdesk, Bug, Infra"
                      value={quickTag}
                      onChange={(e) => setQuickTag(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1b1b1b] border border-[#333333] rounded text-xs text-white placeholder-neutral-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-300">Target SLA / Due Date</label>
                    <input
                      type="date"
                      value={quickDueDate}
                      onChange={(e) => setQuickDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1b1b1b] border border-[#333333] rounded text-xs text-white cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded bg-blue-950/30 border border-blue-500/30 text-[11px] text-blue-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <span>Initial Status: <strong>Created assigned</strong> (Will be queued automatically)</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setShowQuickCreate(false)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Create & Assign Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: Table Queue List View */}
        {/* ------------------------------------------------------------- */}
        {layoutMode === 'list' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-5">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-[#2b2b2b] rounded bg-[#121212] space-y-3">
                <Ticket className="w-8 h-8 text-neutral-500 mx-auto" />
                <h3 className="text-sm font-semibold text-neutral-200">No tickets found in this queue</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Try adjusting your search query, status filters, or create a new ticket.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 bg-[#222222] hover:bg-[#2e2e2e] text-neutral-200 rounded text-xs font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="border border-[#262626] rounded-xl bg-[#141414] overflow-hidden shadow-xl">
                {/* Mobile View: Compact Ticket Cards */}
                <div className="sm:hidden divide-y divide-[#222222]">
                  {filteredTickets.map((ticket) => {
                    const currentStatus = getStatus(ticket.statusId);
                    const isSelected = selectedTicketIds.includes(ticket.id);
                    const priorityCfg = priorityConfigs[ticket.priority] || priorityConfigs.medium;
                    const isDone = currentStatus?.isDone;
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isOverdue = ticket.dueDate && ticket.dueDate < todayStr && !isDone;
                    const assignees = users.filter((u) => ticket.assigneeIds?.includes(u.id));

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTaskId(ticket.id)}
                        className={`p-2.5 hover:bg-[#1c1c1c] active:bg-[#222222] transition-colors cursor-pointer space-y-1.5 ${
                          isSelected ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleToggleSelectTicket(ticket.id, e as any)}
                              className="rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                            />
                            <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 font-bold shrink-0">
                              #{ticket.id.replace('task-', 'TCK-')}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border truncate max-w-[110px]"
                              style={{
                                backgroundColor: `${currentStatus?.color || '#3B82F6'}18`,
                                borderColor: `${currentStatus?.color || '#3B82F6'}45`,
                                color: currentStatus?.color || '#3B82F6'
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: currentStatus?.color || '#3B82F6' }} />
                              <span className="truncate">{currentStatus?.name}</span>
                            </span>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${priorityCfg.bg} ${priorityCfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                            {priorityCfg.label}
                          </span>
                        </div>

                        <div className={`text-xs font-semibold text-neutral-100 line-clamp-1 ${isDone ? 'line-through text-neutral-500' : ''}`}>
                          {ticket.title}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1 overflow-hidden">
                              {assignees.map((u) => (
                                <img
                                  key={u.id}
                                  src={u.avatar}
                                  alt={u.name}
                                  title={u.name}
                                  className="w-5 h-5 rounded-full border border-[#141414] object-cover ring-1 ring-[#333333]"
                                />
                              ))}
                            </div>
                            {assignees.length === 0 && (
                              <span className="text-[10px] text-neutral-500 italic">Unassigned</span>
                            )}
                          </div>

                          {ticket.dueDate && (
                            <span className={`text-[10px] font-mono flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : 'text-neutral-400'}`}>
                              <Clock className="w-3 h-3" />
                              {ticket.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Full 8-Column Data Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-[#1a1a1a] text-neutral-400 font-semibold border-b border-[#262626] uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            id="ticket-select-all-checkbox"
                            checked={selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0}
                            onChange={handleToggleSelectAll}
                            className="rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="p-3 w-28">Status</th>
                        <th className="p-3 w-24">Priority</th>
                        <th className="p-3 min-w-[280px]">Ticket Subject & Details</th>
                        <th className="p-3 w-36">Assignees</th>
                        <th className="p-3 w-28">Target SLA</th>
                        <th className="p-3 w-28">Category</th>
                        <th className="p-3 w-16 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {filteredTickets.map((ticket) => {
                        const currentStatus = getStatus(ticket.statusId);
                        const isSelected = selectedTicketIds.includes(ticket.id);
                        const priorityCfg = priorityConfigs[ticket.priority] || priorityConfigs.medium;
                        const isDone = currentStatus?.isDone;
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isOverdue = ticket.dueDate && ticket.dueDate < todayStr && !isDone;

                        return (
                          <tr
                            key={ticket.id}
                            id={`ticket-row-${ticket.id}`}
                            onClick={() => setSelectedTaskId(ticket.id)}
                            className={`hover:bg-[#1c1c1c] transition-colors cursor-pointer ${
                              isSelected ? 'bg-blue-950/20' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleToggleSelectTicket(ticket.id, e as any)}
                                className="rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Status Pill with Dropdown */}
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block">
                                <select
                                  id={`select-status-${ticket.id}`}
                                  value={ticket.statusId}
                                  onChange={(e) => updateTask(ticket.id, { statusId: e.target.value })}
                                  className="appearance-none pl-2.5 pr-6 py-1 rounded text-[11px] font-bold border shadow-xs cursor-pointer focus:outline-hidden"
                                  style={{
                                    backgroundColor: `${currentStatus?.color || '#3B82F6'}18`,
                                    borderColor: `${currentStatus?.color || '#3B82F6'}45`,
                                    color: currentStatus?.color || '#3B82F6'
                                  }}
                                >
                                  {statuses.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-[#1a1a1a] text-white">
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                                <div
                                  className="w-1.5 h-1.5 rounded-full absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                                  style={{ backgroundColor: currentStatus?.color || '#3B82F6' }}
                                />
                              </div>
                            </td>

                            {/* Priority */}
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${priorityCfg.bg} ${priorityCfg.text}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                                <span>{priorityCfg.label}</span>
                              </span>
                            </td>

                            {/* Ticket Title & Meta */}
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 font-bold shrink-0">
                                    #{ticket.id.replace('task-', 'TCK-')}
                                  </span>
                                  <span
                                    className={`font-semibold text-neutral-100 line-clamp-1 ${
                                      isDone ? 'line-through text-neutral-400' : ''
                                    }`}
                                  >
                                    {ticket.title}
                                  </span>
                                </div>

                                {ticket.description && (
                                  <p className="text-[11px] text-neutral-400 line-clamp-1">
                                    {ticket.description}
                                  </p>
                                )}

                                {/* Subtasks Progress & Comment Indicators */}
                                <div className="flex items-center gap-3 pt-0.5 text-[10px] text-neutral-400">
                                  {ticket.subtasks && ticket.subtasks.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <CheckSquare className="w-3 h-3 text-neutral-400" />
                                      <span>
                                        {ticket.subtasks.filter((s) => s.completed).length}/
                                        {ticket.subtasks.length} items
                                      </span>
                                    </span>
                                  )}

                                  {ticket.comments && ticket.comments.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3 text-neutral-400" />
                                      <span>{ticket.comments.length}</span>
                                    </span>
                                  )}

                                  {(ticket.codeSnippets?.length || ticket.codeSnippet) && (
                                    <span className="flex items-center gap-1 text-sky-400">
                                      <Code2 className="w-3 h-3" />
                                      <span>Snippet</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Assignees */}
                            <td className="p-3">
                              <div className="flex items-center -space-x-1.5">
                                {ticket.assigneeIds.length === 0 ? (
                                  <span className="text-[10px] text-neutral-500 italic">Unassigned</span>
                                ) : (
                                  ticket.assigneeIds.map((uid) => {
                                    const u = users.find((user) => user.id === uid);
                                    return (
                                      <div key={uid} title={u?.name || uid}>
                                        <UserAvatar
                                          name={u?.name || uid}
                                          avatar={u?.avatar}
                                          role={u?.role}
                                          size="xs"
                                        />
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </td>

                            {/* Target SLA / Due Date */}
                            <td className="p-3">
                              {ticket.dueDate ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                    isOverdue
                                      ? 'text-rose-400 font-semibold'
                                      : isDone
                                      ? 'text-neutral-500'
                                      : 'text-neutral-300'
                                  }`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>{ticket.dueDate}</span>
                                  {isOverdue && (
                                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded font-bold">
                                      Late
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-500">No SLA</span>
                              )}
                            </td>

                            {/* Category Tags */}
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(ticket.tags || []).slice(0, 2).map((t) => (
                                  <TagBadge key={t} tag={t} size="sm" />
                                ))}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  id={`btn-open-ticket-${ticket.id}`}
                                  onClick={() => setSelectedTaskId(ticket.id)}
                                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
                                  title="View Ticket Details"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: Kanban 5-Column Board View */}
        {/* ------------------------------------------------------------- */}
        {layoutMode === 'board' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-2 sm:p-5 flex gap-2.5 sm:gap-4 min-w-0">
            {statuses.map((status) => {
              const columnTickets = filteredTickets.filter((t) => t.statusId === status.id);

              return (
                <div
                  key={status.id}
                  id={`ticket-board-col-${status.id}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status.id)}
                  className="w-80 shrink-0 flex flex-col bg-[#141414] rounded border border-[#262626] shadow-md max-h-full"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                      <h3 className="text-xs font-bold text-white truncate">{status.name}</h3>
                      <span className="text-[10px] bg-[#292929] text-neutral-300 font-semibold px-1.5 py-0.2 rounded-full">
                        {columnTickets.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#292929] cursor-pointer"
                      title="Add ticket to this status"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Column Scrollable Tickets */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[150px]">
                    {columnTickets.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center border border-dashed border-[#2c2c2c] rounded text-[11px] text-neutral-500">
                        <span>Drop tickets here</span>
                      </div>
                    ) : (
                      columnTickets.map((ticket) => {
                        const priorityCfg = priorityConfigs[ticket.priority] || priorityConfigs.medium;

                        return (
                          <div
                            key={ticket.id}
                            id={`board-card-${ticket.id}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ticket.id)}
                            onClick={() => setSelectedTaskId(ticket.id)}
                            className="p-3 bg-[#1c1c1c] hover:bg-[#222222] border border-[#2e2e2e] hover:border-[#404040] rounded shadow-xs transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded font-bold">
                                #{ticket.id.replace('task-', 'TCK-')}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border ${priorityCfg.bg} ${priorityCfg.text}`}
                              >
                                <span className={`w-1 h-1 rounded-full ${priorityCfg.dot}`} />
                                <span>{priorityCfg.label}</span>
                              </span>
                            </div>

                            <h4 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                              {ticket.title}
                            </h4>

                            {ticket.description && (
                              <p className="text-[11px] text-neutral-400 line-clamp-2">
                                {ticket.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-[#262626] text-[10px] text-neutral-400">
                              <div className="flex items-center -space-x-1">
                                {ticket.assigneeIds.map((uid) => {
                                  const u = users.find((user) => user.id === uid);
                                  return (
                                    <div key={uid} title={u?.name || uid}>
                                      <UserAvatar name={u?.name || uid} avatar={u?.avatar} role={u?.role} size="xs" />
                                    </div>
                                  );
                                })}
                              </div>

                              {ticket.dueDate && (
                                <span className="flex items-center gap-1 text-neutral-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>{ticket.dueDate}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 3: Master-Detail Split Inspector View */}
        {/* ------------------------------------------------------------- */}
        {layoutMode === 'split' && (
          <div className="flex-1 flex min-w-0 overflow-hidden">
            
            {/* Left Queue List Pane */}
            <div className={`w-full md:w-96 border-r border-[#262626] bg-[#121212] overflow-y-auto shrink-0 flex flex-col ${activeSplitTaskId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 border-b border-[#262626] bg-[#171717] text-xs font-semibold text-neutral-400 flex items-center justify-between">
                <span>Ticket Queue ({filteredTickets.length})</span>
                <span className="text-[10px] text-neutral-500">Select to inspect</span>
              </div>

              <div className="divide-y divide-[#222222] flex-1 overflow-y-auto">
                {filteredTickets.map((ticket) => {
                  const isActive = activeSplitTaskId === ticket.id;
                  const currentStatus = getStatus(ticket.statusId);
                  const priorityCfg = priorityConfigs[ticket.priority] || priorityConfigs.medium;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setActiveSplitTaskId(ticket.id)}
                      className={`p-3 transition-colors cursor-pointer space-y-1.5 ${
                        isActive ? 'bg-blue-950/30 border-l-2 border-blue-500' : 'hover:bg-[#181818]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-blue-400 font-bold">
                          #{ticket.id.replace('task-', 'TCK-')}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                          style={{
                            backgroundColor: `${currentStatus?.color || '#3B82F6'}18`,
                            borderColor: `${currentStatus?.color || '#3B82F6'}45`,
                            color: currentStatus?.color || '#3B82F6'
                          }}
                        >
                          {currentStatus?.name}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white line-clamp-1">{ticket.title}</h4>

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5">
                        <span className={priorityCfg.text}>{priorityCfg.label}</span>
                        <span>{ticket.dueDate || 'No date'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Inspector Detail Pane */}
            <div className={`flex-1 bg-[#141414] overflow-y-auto p-4 sm:p-6 space-y-6 ${!activeSplitTaskId ? 'hidden md:block' : 'block'}`}>
              {activeSplitTask ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {/* Inspector Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-[#262626] pb-4 flex-wrap sm:flex-nowrap">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Mobile Back / Close Button */}
                        <button
                          type="button"
                          id="btn-close-ticket-inspector-mobile"
                          onClick={() => setActiveSplitTaskId(null)}
                          className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222222] border border-[#333333] text-neutral-200 hover:text-white text-xs font-semibold cursor-pointer active:scale-95"
                          title="Back to Ticket List"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close / Back</span>
                        </button>

                        <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-bold border border-blue-500/20">
                          #{activeSplitTask.id.replace('task-', 'TCK-')}
                        </span>

                        {/* Status Select */}
                        <select
                          value={activeSplitTask.statusId}
                          onChange={(e) => updateTask(activeSplitTask.id, { statusId: e.target.value })}
                          className="px-2.5 py-1 bg-[#1c1c1c] border border-[#333333] rounded text-xs font-bold text-white cursor-pointer"
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>

                        {/* Priority Select */}
                        <select
                          value={activeSplitTask.priority}
                          onChange={(e) => updateTask(activeSplitTask.id, { priority: e.target.value as Priority })}
                          className="px-2.5 py-1 bg-[#1c1c1c] border border-[#333333] rounded text-xs font-bold text-neutral-200 cursor-pointer"
                        >
                          <option value="urgent">🔴 Urgent</option>
                          <option value="high">🟠 High</option>
                          <option value="medium">🔵 Medium</option>
                          <option value="low">⚪ Low</option>
                        </select>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-white break-words">{activeSplitTask.title}</h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(activeSplitTask.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Full Ticket Modal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSplitTaskId(null)}
                        className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#222222] border border-[#333333] transition-colors cursor-pointer"
                        title="Close Inspector"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Description</h4>
                    <div className="p-4 bg-[#1b1b1b] border border-[#2b2b2b] rounded text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {activeSplitTask.description || 'No description provided.'}
                    </div>
                  </div>

                  {/* Subtasks Checklist */}
                  {activeSplitTask.subtasks && activeSplitTask.subtasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Action Items & Checklist
                      </h4>
                      <div className="space-y-1.5 p-3 bg-[#1b1b1b] border border-[#2b2b2b] rounded">
                        {activeSplitTask.subtasks.map((st, i) => (
                          <label
                            key={st.id || i}
                            className="flex items-center gap-2 text-xs text-neutral-200 hover:bg-[#242424] p-1.5 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => {
                                const updated = activeSplitTask.subtasks.map((sub, idx) =>
                                  idx === i ? { ...sub, completed: !sub.completed } : sub
                                );
                                updateTask(activeSplitTask.id, { subtasks: updated });
                              }}
                              className="rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-0"
                            />
                            <span className={st.completed ? 'line-through text-neutral-500' : ''}>
                              {st.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta Details: Assignees, Tags, Created Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#181818] border border-[#262626] rounded">
                    <div>
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                        Assigned Agents
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeSplitTask.assigneeIds.map((uid) => {
                          const u = users.find((user) => user.id === uid);
                          return (
                            <div
                              key={uid}
                              className="flex items-center gap-1.5 px-2 py-1 bg-[#222222] rounded border border-[#333333] text-xs text-neutral-200"
                            >
                              <UserAvatar name={u?.name || uid} avatar={u?.avatar} role={u?.role} size="xs" />
                              <span>{u?.name || uid}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                        Category & Tags
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(activeSplitTask.tags || []).map((tag) => (
                          <TagBadge key={tag} tag={tag} size="sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                  Select a ticket from the queue on the left to inspect
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
