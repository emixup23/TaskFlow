import React, { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Trash2,
  Inbox,
  AlertCircle
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
    deleteStatus
  } = useTasks();
  const { isAdmin, currentUser } = useAuth();
  const [activeMenuStatusId, setActiveMenuStatusId] = useState<string | null>(null);
  const [draggedOverStatusId, setDraggedOverStatusId] = useState<string | null>(null);

  const canCreate = isAdmin || currentUser?.privileges?.canCreateTask !== false;
  const canManageStatuses = isAdmin || Boolean(currentUser?.privileges?.canManageStatuses);

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
    <div className="flex-1 p-4 sm:p-6 flex gap-5 sm:gap-6 overflow-x-auto overflow-y-hidden bg-[#0d0d0d] dark:bg-[#0d0d0d] min-w-0 transition-colors duration-200">
      {statuses.map((status, index) => {
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
                {canManageStatuses && (
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
                      <div className="absolute right-0 mt-1 w-48 bg-[#181818] rounded shadow-xl border border-[#333333] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                        <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Column Settings
                        </div>

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
                          disabled={index === statuses.length - 1}
                          onClick={() => handleMoveColumn(status.id, 'right')}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-[#262626] disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Move Column Right</span>
                        </button>

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
                      </div>
                    )}
                  </div>
                )}
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
    </div>
  );
};
