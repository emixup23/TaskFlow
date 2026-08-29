import React from 'react';
import {
  Search,
  X,
  Filter,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle2,
  User as UserIcon,
  Tag as TagIcon
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Priority } from '../types';
import { getTagStyle } from '../utils/tagColors';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, statuses, tasks, filteredTasks } = useTasks();
  const { users } = useAuth();

  const priorities: { value: Priority; label: string; dotColor: string }[] = [
    { value: 'urgent', label: 'Urgent', dotColor: 'bg-rose-500' },
    { value: 'high', label: 'High', dotColor: 'bg-amber-500' },
    { value: 'medium', label: 'Medium', dotColor: 'bg-blue-500' },
    { value: 'low', label: 'Low', dotColor: 'bg-slate-400' }
  ];

  const dueDates: { value: 'all' | 'overdue' | 'today' | 'this_week' | 'no_date'; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'All Dates' },
    { value: 'overdue', label: 'Overdue', icon: <AlertCircle className="w-3 h-3 text-rose-500" /> },
    { value: 'today', label: 'Due Today', icon: <Clock className="w-3 h-3 text-amber-500" /> },
    { value: 'this_week', label: 'This Week', icon: <Calendar className="w-3 h-3 text-blue-500" /> },
    { value: 'no_date', label: 'No Deadline' }
  ];

  // Collect all unique tags
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || []))).filter(Boolean);

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

  return (
    <div className="bg-[#121212] dark:bg-[#121212] border-b border-[#262626] py-3 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Top Filter Row: Search + Quick Stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="filter-search-input"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search tasks, descriptions, or tags..."
              className="w-full pl-9 pr-8 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Summary & Reset */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <span className="text-xs text-neutral-400 font-medium">
              Showing <strong className="text-neutral-200">{filteredTasks.length}</strong> of{' '}
              <strong className="text-neutral-200">{tasks.length}</strong> tasks
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                id="btn-reset-filters"
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          
          {/* Priority filter pills */}
          <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded border border-[#262626]">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">Priority:</span>
            {priorities.map((p) => {
              const isSelected = filters.priorities.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  id={`filter-priority-${p.value}`}
                  onClick={() => togglePriority(p.value)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#262626] text-white shadow-xs border border-[#404040] font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-[#222222]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded ${p.dotColor}`} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Due date filter selector */}
          <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded border border-[#262626] overflow-x-auto">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">Deadline:</span>
            {dueDates.map((d) => {
              const isSelected = filters.dueDateFilter === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  id={`filter-date-${d.value}`}
                  onClick={() => setFilters((prev) => ({ ...prev, dueDateFilter: d.value }))}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#262626] text-white shadow-xs border border-[#404040] font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-[#222222]'
                  }`}
                >
                  {d.icon}
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>

          {/* Assignee Filter Dropdown/Avatars */}
          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded border border-[#262626]">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">Assignee:</span>
            {users.map((u) => {
              const isSelected = filters.assigneeIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  id={`filter-assignee-${u.id}`}
                  onClick={() => toggleAssignee(u.id)}
                  title={`${u.name} (${u.title})`}
                  className={`relative p-0.5 rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-950/60'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-5 h-5 rounded object-cover"
                  />
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded border border-[#181818]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tag Filter pills if any */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1 bg-[#181818] p-1 rounded border border-[#262626] overflow-x-auto">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">Tag:</span>
              {allTags.slice(0, 6).map((tag) => {
                const isSelected = filters.tag === tag;
                const style = getTagStyle(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        tag: isSelected ? '' : tag
                      }))
                    }
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? `${style.badgeClass} ring-1 ring-white/50 font-bold shadow-xs`
                        : 'bg-[#222222] text-neutral-300 border border-[#333333] hover:bg-[#2b2b2b]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
