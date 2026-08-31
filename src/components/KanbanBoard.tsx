import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Trash2,
  Inbox,
  AlertCircle,
  Eye,
  EyeOff,
  Columns3,
  Check,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { Status, Task } from '../types';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from './TaskCard';

export const KanbanBoard: React.FC = () => {
  const {
    statuses,
    filteredTasks,
    moveTaskStatus,
    setIsCreateModalOpen,
    setIsStatusManagerOpen,
    reorderStatuses,
    deleteStatus,
    addToast
  } = useTasks();
  const { isAdmin, currentUser } = useAuth();
  const [activeMenuStatusId, setActiveMenuStatusId] = useState<string | null>(null);
  const [draggedOverStatusId, setDraggedOverStatusId] = useState<string | null>(null);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);

  // Column visibility state persisted in localStorage
  const [hiddenStatusIds, setHiddenStatusIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('taskflow_hidden_kanban_columns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('taskflow_hidden_kanban_columns', JSON.stringify(hiddenStatusIds));
    } catch (e) {
      console.warn('Failed to persist hidden columns:', e);
    }
  }, [hiddenStatusIds]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) {
        setShowColumnsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canCreate = isAdmin || currentUser?.privileges?.canCreateTask !== false;
  const canManageStatuses = isAdmin || Boolean(currentUser?.privileges?.canManageStatuses);

  // Filter visible statuses
  const visibleStatuses = statuses.filter((s) => !hiddenStatusIds.includes(s.id));
  const hiddenCount = statuses.length - visibleStatuses.length;

  const toggleColumnVisibility = (statusId: string) => {
    if (hiddenStatusIds.includes(statusId)) {
      setHiddenStatusIds((prev) => prev.filter((id) => id !== statusId));
      const st = statuses.find((s) => s.id === statusId);
      addToast('info', `Shown "${st?.name || 'Column'}"`);
    } else {
      if (visibleStatuses.length <= 1) {
        addToast('error', 'At least one column must remain visible on the board.');
        return;
      }
      setHiddenStatusIds((prev) => [...prev, statusId]);
      const st = statuses.find((s) => s.id === statusId);
      addToast('info', `Hidden "${st?.name || 'Column'}"`);
    }
  };

  const handleHideSpecificColumn = (statusId: string) => {
    if (visibleStatuses.length <= 1) {
      addToast('error', 'At least one column must remain visible on the board.');
      return;
    }
    setHiddenStatusIds((prev) => [...prev, statusId]);
    setActiveMenuStatusId(null);
    const st = statuses.find((s) => s.id === statusId);
    addToast('info', `Hidden "${st?.name || 'Column'}"`);
  };

  const handleShowAllColumns = () => {
    setHiddenStatusIds([]);
    addToast('success', 'All workflow columns are now visible');
  };

  // Group tasks by status
  const tasksByStatus: Record<string, Task[]> = {};
  statuses.forEach((s) => {
    tasksByStatus[s.id] = filteredTasks.filter((t) => t.statusId === s.id);
  });

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverStatusId !== statusId) {
      setDraggedOverStatusId(statusId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, statusId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDraggedOverStatusId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    setDraggedOverStatusId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTaskStatus(taskId, targetStatusId);
    }
  };

  const handleMoveColumn = (statusId: string, direction: 'left' | 'right') => {
    const sorted = [...statuses].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex((s) => s.id === statusId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const temp = sorted[currentIndex];
    sorted[currentIndex] = sorted[targetIndex];
    sorted[targetIndex] = temp;

    reorderStatuses(sorted.map((s) => s.id));
    setActiveMenuStatusId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d] dark:bg-[#0d0d0d] overflow-hidden transition-colors duration-200">
      
      {/* Board Controls Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#121212] border-b border-[#222222] flex items-center justify-between gap-3 shrink-0">
        
        {/* Left: Summary & Hidden status indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
            <Columns3 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Workflow Columns:</span>
            <strong className="text-white">
              {visibleStatuses.length} of {statuses.length} visible
            </strong>
          </div>

          {hiddenCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-800/60 px-2.5 py-0.5 rounded text-[11px] text-amber-300">
              <EyeOff className="w-3.5 h-3.5" />
              <span>{hiddenCount} {hiddenCount === 1 ? 'column' : 'columns'} hidden</span>
              <button
                type="button"
                onClick={handleShowAllColumns}
                className="ml-1 underline hover:text-white font-semibold cursor-pointer"
              >
                Unhide all
              </button>
            </div>
          )}
        </div>

        {/* Right: Customize Columns Dropdown & Workflow Manager */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Hide / Show Columns Toggle Button & Menu */}
          <div className="relative" ref={columnsMenuRef}>
            <button
              type="button"
              id="btn-toggle-columns-menu"
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                showColumnsMenu || hiddenCount > 0
                  ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                  : 'bg-[#1a1a1a] hover:bg-[#242424] border-[#333333] text-neutral-300 hover:text-white'
              }`}
              title={`Toggle Column Visibility (${visibleStatuses.length}/${statuses.length} active)`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Columns</span>
              {hiddenCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {hiddenCount}
                </span>
              )}
            </button>

            {showColumnsMenu && (
              <div
                id="columns-visibility-dropdown"
                className="absolute right-0 mt-1.5 w-64 bg-[#181818] rounded-lg shadow-2xl border border-[#333333] p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                  <div>
                    <h4 className="font-bold text-white text-xs">Visible Board Columns</h4>
                    <p className="text-[10px] text-neutral-400">Toggle columns to focus your workflow</p>
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={handleShowAllColumns}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Show All
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {statuses.map((status) => {
                    const isVisible = !hiddenStatusIds.includes(status.id);
                    const taskCount = tasksByStatus[status.id]?.length || 0;

                    return (
                      <button
                        key={status.id}
                        type="button"
                        id={`toggle-column-vis-${status.id}`}
                        onClick={() => toggleColumnVisibility(status.id)}
                        className={`w-full flex items-center justify-between p-2 rounded text-left transition-all cursor-pointer border ${
                          isVisible
                            ? 'bg-[#202020] border-[#383838] text-neutral-200 hover:bg-[#262626]'
                            : 'bg-[#141414] border-transparent text-neutral-500 hover:text-neutral-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded shrink-0"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className={`truncate text-xs ${isVisible ? 'font-semibold text-white' : 'line-through text-neutral-500'}`}>
                            {status.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-neutral-400 font-mono">
                            {taskCount}
                          </span>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isVisible
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-[#444444] bg-transparent text-transparent'
                          }`}>
                            {isVisible && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#2b2b2b] flex items-center justify-between text-[11px] text-neutral-400">
                  <span>{visibleStatuses.length} of {statuses.length} columns active</span>
                  {canManageStatuses && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowColumnsMenu(false);
                        setIsStatusManagerOpen(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manage Columns Action */}
          {canManageStatuses && (
            <button
              type="button"
              id="btn-kanban-manage-columns"
              onClick={() => setIsStatusManagerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#1a1a1a] hover:bg-[#242424] border border-[#333333] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Add, rename, recolor, or reorder statuses"
            >
              <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Statuses</span>
            </button>
          )}
        </div>

      </div>

      {/* Kanban Board Columns Horizontal Area */}
      <div className="flex-1 p-4 sm:p-6 flex gap-5 sm:gap-6 overflow-x-auto overflow-y-hidden min-w-0">
        {visibleStatuses.map((status, index) => {
          const columnTasks = tasksByStatus[status.id] || [];
          const isDraggedOver = draggedOverStatusId === status.id;
          const isMenuOpen = activeMenuStatusId === status.id;

          return (
            <div
              key={status.id}
              id={`kanban-column-${status.id}`}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDragLeave={(e) => handleDragLeave(e, status.id)}
              onDrop={(e) => handleDrop(e, status.id)}
              className={`w-72 sm:w-80 flex flex-col gap-3.5 shrink-0 transition-all ${
                isDraggedOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0d0d0d] rounded' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="font-bold text-neutral-300 text-xs sm:text-sm uppercase tracking-wider truncate">
                    {status.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400 font-medium bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#2b2b2b] shadow-xs">
                    {columnTasks.length}
                  </span>

                  {/* Add task quick button */}
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      title={`Add task to ${status.name}`}
                      className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-[#1f1f1f] rounded transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}

                  {/* Column Controls */}
                  <div className="relative">
                    <button
                      type="button"
                      id={`btn-col-menu-${status.id}`}
                      onClick={() => setActiveMenuStatusId(isMenuOpen ? null : status.id)}
                      className="p-1 text-neutral-400 hover:text-white hover:bg-[#1f1f1f] rounded transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-1 w-52 bg-[#181818] rounded shadow-xl border border-[#333333] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                        <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Column Settings
                        </div>

                        {/* Hide Column option */}
                        <button
                          type="button"
                          onClick={() => handleHideSpecificColumn(status.id)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#262626] text-left cursor-pointer"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>Hide this Column</span>
                        </button>

                        <div className="border-t border-[#2b2b2b] my-1" />

                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveColumn(status.id, 'left')}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#262626] disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Move Column Left</span>
                        </button>

                        <button
                          type="button"
                          disabled={index === visibleStatuses.length - 1}
                          onClick={() => handleMoveColumn(status.id, 'right')}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#262626] disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Move Column Right</span>
                        </button>

                        {canManageStatuses && (
                          <>
                            <div className="border-t border-[#2b2b2b] my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuStatusId(null);
                                setIsStatusManagerOpen(true);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#262626] text-left cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Workflow Manager</span>
                            </button>

                            {statuses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuStatusId(null);
                                  if (
                                    window.confirm(
                                      `Delete "${status.name}"? Tasks in this column will be moved to the first column.`
                                    )
                                  ) {
                                    deleteStatus(status.id);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 text-left cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Delete Column</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-6 scrollbar-thin">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <TaskCard task={task} />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-[#262626] rounded flex flex-col items-center justify-center text-neutral-500 p-4 text-center">
                    <Inbox className="w-5 h-5 mb-1 text-neutral-600" />
                    <p className="text-xs font-medium">No tasks here</p>
                    <p className="text-[10px] text-neutral-500">Drag tasks here or click +</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {visibleStatuses.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-400 space-y-3">
            <EyeOff className="w-10 h-10 text-neutral-600" />
            <h3 className="text-base font-bold text-white">All columns are currently hidden</h3>
            <p className="text-xs text-neutral-500 max-w-sm">
              Use the column visibility menu above to show your workflow columns or reset your board view.
            </p>
            <button
              type="button"
              onClick={handleShowAllColumns}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
            >
              Show All Columns
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
