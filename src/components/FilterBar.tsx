import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Check,
  AlertCircle,
  Clock,
  Calendar,
  CheckSquare,
  User as UserIcon,
  Tag as TagIcon,
  SlidersHorizontal,
  Flame,
  CircleDot,
  RotateCcw
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Priority } from '../types';
import { getTagStyle } from '../utils/tagColors';
import { UserAvatar } from './UserAvatar';
import { SyncWithListerButton } from './SyncWithListerButton';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, statuses, tasks, filteredTasks } = useTasks();
  const { users } = useAuth();

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | 'assignee' | 'date' | 'tag' | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Search within dropdowns
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const priorities: { value: Priority; label: string; dotColor: string; bgClass: string; textClass: string }[] = [
    { value: 'urgent', label: 'Urgent', dotColor: 'bg-rose-500', bgClass: 'bg-rose-500/15', textClass: 'text-rose-400' },
    { value: 'high', label: 'High', dotColor: 'bg-amber-500', bgClass: 'bg-amber-500/15', textClass: 'text-amber-400' },
    { value: 'medium', label: 'Medium', dotColor: 'bg-blue-500', bgClass: 'bg-blue-500/15', textClass: 'text-blue-400' },
    { value: 'low', label: 'Low', dotColor: 'bg-slate-400', bgClass: 'bg-slate-500/15', textClass: 'text-slate-300' }
  ];

  const dueDates: { value: 'all' | 'overdue' | 'today' | 'this_week' | 'no_date'; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'All Deadlines' },
    { value: 'overdue', label: 'Overdue', icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> },
    { value: 'today', label: 'Due Today', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'this_week', label: 'Due This Week', icon: <Calendar className="w-3.5 h-3.5 text-blue-500" /> },
    { value: 'no_date', label: 'No Deadline' }
  ];

  // Collect all unique tags
  const allTags = useMemo(() => {
    return Array.from(new Set(tasks.flatMap((t) => t.tags || []))).filter(Boolean);
  }, [tasks]);

  // Task count helpers
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.statusId] = (counts[t.statusId] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const countByPriority = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const countByAssignee = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      (t.assigneeIds || []).forEach((userId) => {
        counts[userId] = (counts[userId] || 0) + 1;
      });
    });
    return counts;
  }, [tasks]);

  const countByTag = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      (t.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [tasks]);

  const togglePriority = (p: Priority) => {
    setFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter((item) => item !== p)
        : [...prev.priorities, p]
    }));
  };

  const toggleStatus = (statusId: string) => {
    setFilters((prev) => ({
      ...prev,
      statusIds: prev.statusIds.includes(statusId)
        ? prev.statusIds.filter((item) => item !== statusId)
        : [...prev.statusIds, statusId]
    }));
  };

  const toggleAssignee = (userId: string) => {
    setFilters((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((item) => item !== userId)
        : [...prev.assigneeIds, userId]
    }));
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.statusIds.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.dueDateFilter !== 'all' ||
    Boolean(filters.tag);

  const nonSearchFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statusIds.length > 0) count += filters.statusIds.length;
    if (filters.priorities.length > 0) count += filters.priorities.length;
    if (filters.assigneeIds.length > 0) count += filters.assigneeIds.length;
    if (filters.dueDateFilter !== 'all') count += 1;
    if (filters.tag) count += 1;
    return count;
  }, [filters]);

  // Active label summaries for dropdown buttons
  const statusButtonLabel = useMemo(() => {
    if (filters.statusIds.length === 0) return 'Status';
    if (filters.statusIds.length === 1) {
      const s = statuses.find((st) => st.id === filters.statusIds[0]);
      return s ? `Status: ${s.name}` : 'Status (1)';
    }
    return `Status (${filters.statusIds.length})`;
  }, [filters.statusIds, statuses]);

  const priorityButtonLabel = useMemo(() => {
    if (filters.priorities.length === 0) return 'Priority';
    if (filters.priorities.length === 1) {
      const p = priorities.find((pr) => pr.value === filters.priorities[0]);
      return p ? `Priority: ${p.label}` : 'Priority (1)';
    }
    return `Priority (${filters.priorities.length})`;
  }, [filters.priorities, priorities]);

  const assigneeButtonLabel = useMemo(() => {
    if (filters.assigneeIds.length === 0) return 'Assignee';
    if (filters.assigneeIds.length === 1) {
      const u = users.find((usr) => usr.id === filters.assigneeIds[0]);
      return u ? `Assignee: ${u.name.split(' ')[0]}` : 'Assignee (1)';
    }
    return `Assignee (${filters.assigneeIds.length})`;
  }, [filters.assigneeIds, users]);

  const dueDateButtonLabel = useMemo(() => {
    if (filters.dueDateFilter === 'all') return 'Deadline';
    const d = dueDates.find((dd) => dd.value === filters.dueDateFilter);
    return d ? d.label : 'Deadline';
  }, [filters.dueDateFilter, dueDates]);

  const tagButtonLabel = useMemo(() => {
    if (!filters.tag) return 'Tag';
    return `#${filters.tag}`;
  }, [filters.tag]);

  // Filtered dropdown lists
  const filteredUsers = useMemo(() => {
    if (!assigneeSearch.trim()) return users;
    const q = assigneeSearch.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.title && u.title.toLowerCase().includes(q)));
  }, [users, assigneeSearch]);

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return allTags;
    return allTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()));
  }, [allTags, tagSearch]);

  return (
    <div ref={containerRef} className="bg-[#121212] border-b border-[#262626] py-2 sm:py-2.5 px-2.5 sm:px-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-2.5">
        
        {/* Main Controls Row: Search + Dropdown Menus + Stats */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          
          {/* Search + Mobile Filter Toggle */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial min-w-0">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="filter-search-input"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search tasks or tags..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#181818] border border-[#333333] rounded text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all h-8"
              />
              {filters.search && (
                <button
                  type="button"
                  id="btn-clear-search"
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Mobile Filters Toggle Button */}
            <button
              type="button"
              id="btn-mobile-filter-toggle"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={`sm:hidden h-8 px-2.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 active:scale-95 ${
                isMobileFiltersOpen || nonSearchFilterCount > 0
                  ? 'bg-blue-950/60 text-blue-300 border-blue-700 shadow-xs'
                  : 'bg-[#181818] text-neutral-300 hover:text-white border-[#2e2e2e]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Filters</span>
              {nonSearchFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {nonSearchFilterCount}
                </span>
              )}
            </button>

            {/* Mobile Quick Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="sm:hidden h-8 w-8 rounded bg-[#181818] hover:bg-[#222222] text-neutral-400 hover:text-white border border-[#2e2e2e] flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Detailed Filter Dropdowns: Visible on desktop, toggleable on mobile */}
          <div className={`${isMobileFiltersOpen ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2 flex-1 min-w-0 pt-1 sm:pt-0`}>
            {/* 1. Status Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                id="dropdown-filter-status-btn"
                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  filters.statusIds.length > 0
                    ? 'bg-blue-950/40 text-blue-300 border-blue-800/80 shadow-xs'
                    : 'bg-[#181818] text-neutral-300 hover:text-white border-[#2e2e2e] hover:border-[#404040]'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate max-w-[130px]">{statusButtonLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'status' && (
                <div className="absolute left-0 top-full mt-1.5 w-60 max-w-[calc(100vw-2.5rem)] bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#282828] text-neutral-400">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">Status Filter</span>
                    {filters.statusIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, statusIds: [] }))}
                        className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    {statuses.map((status) => {
                      const isSelected = filters.statusIds.includes(status.id);
                      const count = countByStatus[status.id] || 0;
                      return (
                        <button
                          key={status.id}
                          type="button"
                          id={`dropdown-status-item-${status.id}`}
                          onClick={() => toggleStatus(status.id)}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#262626] text-neutral-200 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-[#444444] bg-[#222222]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: status.color || '#3b82f6' }}
                            />
                            <span className="truncate font-medium">{status.name}</span>
                          </div>
                          <span className="text-[11px] text-neutral-500 font-mono ml-2 shrink-0">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Priority Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                id="dropdown-filter-priority-btn"
                onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  filters.priorities.length > 0
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 shadow-xs'
                    : 'bg-[#181818] text-neutral-300 hover:text-white border-[#2e2e2e] hover:border-[#404040]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[130px]">{priorityButtonLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'priority' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'priority' && (
                <div className="absolute left-0 top-full mt-1.5 w-56 max-w-[calc(100vw-2.5rem)] bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#282828] text-neutral-400">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">Priority Filter</span>
                    {filters.priorities.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, priorities: [] }))}
                        className="text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    {priorities.map((p) => {
                      const isSelected = filters.priorities.includes(p.value);
                      const count = countByPriority[p.value] || 0;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          id={`dropdown-priority-item-${p.value}`}
                          onClick={() => togglePriority(p.value)}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#262626] text-neutral-200 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-amber-600 border-amber-500 text-white' : 'border-[#444444] bg-[#222222]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${p.dotColor}`} />
                            <span className="font-medium">{p.label}</span>
                          </div>
                          <span className="text-[11px] text-neutral-500 font-mono ml-2 shrink-0">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Assignee Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                id="dropdown-filter-assignee-btn"
                onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  filters.assigneeIds.length > 0
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 shadow-xs'
                    : 'bg-[#181818] text-neutral-300 hover:text-white border-[#2e2e2e] hover:border-[#404040]'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[130px]">{assigneeButtonLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'assignee' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'assignee' && (
                <div className="absolute left-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2.5rem)] bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#282828] text-neutral-400">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">Assignee Filter</span>
                    {filters.assigneeIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, assigneeIds: [] }))}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Search inside Assignees if more than 4 users */}
                  {users.length > 4 && (
                    <div className="p-2 border-b border-[#282828]">
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full px-2 py-1 bg-[#121212] border border-[#333333] rounded text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto py-1">
                    {filteredUsers.map((user) => {
                      const isSelected = filters.assigneeIds.includes(user.id);
                      const count = countByAssignee[user.id] || 0;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          id={`dropdown-assignee-item-${user.id}`}
                          onClick={() => toggleAssignee(user.id)}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#262626] text-neutral-200 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-[#444444] bg-[#222222]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <UserAvatar
                              src={user.avatar}
                              name={user.name}
                              size="xs"
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-neutral-200">{user.name}</p>
                              {user.title && <p className="truncate text-[10px] text-neutral-400">{user.title}</p>}
                            </div>
                          </div>
                          <span className="text-[11px] text-neutral-500 font-mono ml-2 shrink-0">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Deadline Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                id="dropdown-filter-date-btn"
                onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  filters.dueDateFilter !== 'all'
                    ? 'bg-purple-950/40 text-purple-300 border-purple-800/80 shadow-xs'
                    : 'bg-[#181818] text-neutral-300 hover:text-white border-[#2e2e2e] hover:border-[#404040]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate max-w-[130px]">{dueDateButtonLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'date' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'date' && (
                <div className="absolute left-0 top-full mt-1.5 w-52 max-w-[calc(100vw-2.5rem)] bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-[#282828] text-neutral-400">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">Deadline Filter</span>
                  </div>

                  <div className="py-1">
                    {dueDates.map((d) => {
                      const isSelected = filters.dueDateFilter === d.value;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          id={`dropdown-date-item-${d.value}`}
                          onClick={() => {
                            setFilters((prev) => ({ ...prev, dueDateFilter: d.value }));
                            setOpenDropdown(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer text-left ${
                            isSelected ? 'bg-purple-950/50 text-purple-200 font-semibold' : 'text-neutral-200 hover:bg-[#262626]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {d.icon || <div className="w-3.5 h-3.5" />}
                            <span>{d.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Tag Dropdown Menu (if tags exist) */}
            {allTags.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  id="dropdown-filter-tag-btn"
                  onClick={() => setOpenDropdown(openDropdown === 'tag' ? null : 'tag')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    Boolean(filters.tag)
                      ? 'bg-sky-950/40 text-sky-300 border-sky-800/80 shadow-xs'
                      : 'bg-[#181818] text-neutral-300 hover:text-white border-[#2e2e2e] hover:border-[#404040]'
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate max-w-[130px]">{tagButtonLabel}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'tag' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'tag' && (
                  <div className="absolute left-0 top-full mt-1.5 w-56 max-w-[calc(100vw-2.5rem)] bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#282828] text-neutral-400">
                      <span className="font-semibold text-[11px] uppercase tracking-wider">Tag Filter</span>
                      {filters.tag && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilters((prev) => ({ ...prev, tag: '' }));
                            setOpenDropdown(null);
                          }}
                          className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {allTags.length > 5 && (
                      <div className="p-2 border-b border-[#282828]">
                        <input
                          type="text"
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          placeholder="Search tags..."
                          className="w-full px-2 py-1 bg-[#121212] border border-[#333333] rounded text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    )}

                    <div className="max-h-56 overflow-y-auto py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, tag: '' }));
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer text-left ${
                          !filters.tag ? 'bg-sky-950/50 text-sky-200 font-semibold' : 'text-neutral-200 hover:bg-[#262626]'
                        }`}
                      >
                        <span>All Tags</span>
                        {!filters.tag && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </button>

                      {filteredTags.map((tag) => {
                        const isSelected = filters.tag === tag;
                        const style = getTagStyle(tag);
                        const count = countByTag[tag] || 0;
                        return (
                          <button
                            key={tag}
                            type="button"
                            id={`dropdown-tag-item-${tag}`}
                            onClick={() => {
                              setFilters((prev) => ({ ...prev, tag: isSelected ? '' : tag }));
                              setOpenDropdown(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer text-left ${
                              isSelected ? 'bg-sky-950/50 text-sky-200 font-semibold' : 'text-neutral-200 hover:bg-[#262626]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                              <span className="truncate font-medium">#{tag}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-neutral-500 font-mono">{count}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right section: Results Summary & Reset All */}
          <div className={`${isMobileFiltersOpen ? 'flex' : 'hidden'} sm:flex items-center gap-3 justify-between lg:justify-end shrink-0 pt-1 lg:pt-0`}>
            {/* Lister Sync Button */}
            <SyncWithListerButton variant="toolbar" />

            <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
              <strong className="text-neutral-200">{filteredTasks.length}</strong>/{' '}
              <strong className="text-neutral-200">{tasks.length}</strong> tasks
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                id="btn-reset-filters"
                onClick={resetFilters}
                title="Clear all active filters and search"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            )}
          </div>

        </div>

        {/* Active Filter Badges Strip (Quick Dismiss Pills) */}
        {hasActiveFilters && (
          <div className="flex items-center sm:flex-wrap gap-1.5 pt-1.5 border-t border-[#1e1e1e] text-[11px] overflow-x-auto no-scrollbar whitespace-nowrap pb-0.5">
            <span className="text-neutral-500 font-medium mr-1 shrink-0">Active:</span>

            {/* Search badge */}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#202020] border border-[#333333] text-neutral-200 shrink-0">
                <span>Search: <strong className="text-white">"{filters.search}"</strong></span>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="hover:text-rose-400 cursor-pointer p-0.5"
                  title="Remove search query"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Status badges */}
            {filters.statusIds.map((sid) => {
              const st = statuses.find((s) => s.id === sid);
              if (!st) return null;
              return (
                <span
                  key={sid}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/40 border border-blue-800/60 text-blue-300 font-medium shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color || '#3b82f6' }} />
                  <span>{st.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleStatus(sid)}
                    className="hover:text-rose-400 cursor-pointer p-0.5"
                    title={`Remove ${st.name} filter`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}

            {/* Priority badges */}
            {filters.priorities.map((pr) => {
              const p = priorities.find((item) => item.value === pr);
              if (!p) return null;
              return (
                <span
                  key={pr}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${p.bgClass} border border-amber-800/40 ${p.textClass} font-medium shrink-0`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dotColor}`} />
                  <span>{p.label}</span>
                  <button
                    type="button"
                    onClick={() => togglePriority(pr)}
                    className="hover:text-rose-400 cursor-pointer p-0.5"
                    title={`Remove ${p.label} priority filter`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}

            {/* Assignee badges */}
            {filters.assigneeIds.map((uid) => {
              const u = users.find((usr) => usr.id === uid);
              if (!u) return null;
              return (
                <span
                  key={uid}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-medium shrink-0"
                >
                  <UserAvatar src={u.avatar} name={u.name} size="xs" className="w-3.5 h-3.5" />
                  <span>{u.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleAssignee(uid)}
                    className="hover:text-rose-400 cursor-pointer p-0.5"
                    title={`Remove ${u.name} filter`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}

            {/* Due date badge */}
            {filters.dueDateFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/60 text-purple-300 font-medium shrink-0">
                <Calendar className="w-3 h-3 text-purple-400" />
                <span>{dueDateButtonLabel}</span>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, dueDateFilter: 'all' }))}
                  className="hover:text-rose-400 cursor-pointer p-0.5"
                  title="Remove deadline filter"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Tag badge */}
            {filters.tag && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/60 text-sky-300 font-medium shrink-0">
                <TagIcon className="w-3 h-3 text-sky-400" />
                <span>#{filters.tag}</span>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, tag: '' }))}
                  className="hover:text-rose-400 cursor-pointer p-0.5"
                  title="Remove tag filter"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

