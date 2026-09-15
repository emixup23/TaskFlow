import { Task, Status, ListerTask, Priority } from '../types';

export const DEFAULT_LISTER_API_BASE_URL = 'https://ais-pre-qyqoe3bbej7dvas46lbdfd-899663363473.europe-west2.run.app';

/**
 * Checks if a status represents a completed state.
 */
export function isStatusDone(statusId: string, statuses: Status[]): boolean {
  const s = statuses.find((st) => st.id === statusId);
  if (s && typeof s.isDone === 'boolean') {
    return s.isDone;
  }
  const lower = statusId.toLowerCase();
  return lower.includes('done') || lower.includes('closed') || lower.includes('solved') || lower.includes('completed');
}

/**
 * Finds an appropriate completed status ID from available statuses.
 */
export function getDoneStatusId(statuses: Status[]): string {
  const doneStatus = statuses.find((s) => s.isDone);
  if (doneStatus) return doneStatus.id;
  const namedDone = statuses.find((s) => ['status-done', 'status-solved', 'status-closed'].includes(s.id));
  if (namedDone) return namedDone.id;
  return statuses[statuses.length - 1]?.id || 'status-solved';
}

/**
 * Finds an appropriate active / in-progress status ID from available statuses.
 */
export function getActiveStatusId(statuses: Status[]): string {
  const activeStatus = statuses.find((s) => !s.isDone && s.order > 0);
  if (activeStatus) return activeStatus.id;
  const firstStatus = statuses.find((s) => !s.isDone);
  if (firstStatus) return firstStatus.id;
  return statuses[0]?.id || 'status-in-progress';
}

/**
 * Maps app Priority to Lister's priority ('low' | 'medium' | 'high').
 */
export function priorityToLister(priority: Priority): 'low' | 'medium' | 'high' {
  if (priority === 'urgent' || priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'medium';
}

/**
 * Maps Lister's priority to app Priority.
 */
export function priorityFromLister(priority?: 'low' | 'medium' | 'high' | string, existing?: Priority): Priority {
  if (!priority) return existing || 'medium';
  if (priority === 'high') {
    return existing === 'urgent' ? 'urgent' : 'high';
  }
  if (priority === 'low') return 'low';
  return 'medium';
}

/**
 * Transforms an internal Task into the Lister Task schema.
 */
export function taskToListerTask(task: Task, statuses: Status[]): ListerTask {
  const completed = isStatusDone(task.statusId, statuses);
  const listerPriority = priorityToLister(task.priority);

  // Format dueDate to YYYY-MM-DD if available
  let dueDateStr: string | undefined;
  if (task.dueDate) {
    if (task.dueDate.includes('T')) {
      dueDateStr = task.dueDate.split('T')[0];
    } else {
      dueDateStr = task.dueDate;
    }
  }

  const categoryId = task.tags && task.tags.length > 0 ? task.tags[0].toLowerCase() : undefined;

  return {
    id: task.id,
    title: task.title,
    notes: task.description || '',
    categoryId,
    listId: task.projectId || undefined,
    priority: listerPriority,
    completed,
    dueDate: dueDateStr,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
  };
}

/**
 * Converts a Lister Task (or synced task object) into the app's internal Task model.
 */
export function listerTaskToTask(
  listerTask: ListerTask | (Task & { notes?: string; completed?: boolean }),
  existingTask?: Task,
  statuses: Status[] = [],
  defaultUserId: string = 'user-admin-1'
): Task {
  const isCompleted =
    typeof (listerTask as ListerTask).completed === 'boolean'
      ? (listerTask as ListerTask).completed
      : (existingTask ? isStatusDone(existingTask.statusId, statuses) : false);

  const doneStatusId = getDoneStatusId(statuses);
  const activeStatusId = getActiveStatusId(statuses);

  // Status calculation
  let targetStatusId: string;
  if (isCompleted) {
    if (existingTask && isStatusDone(existingTask.statusId, statuses)) {
      targetStatusId = existingTask.statusId;
    } else {
      targetStatusId = doneStatusId;
    }
  } else {
    if (existingTask && !isStatusDone(existingTask.statusId, statuses)) {
      targetStatusId = existingTask.statusId;
    } else {
      targetStatusId = activeStatusId;
    }
  }

  // Description / notes
  const notesContent = (listerTask as ListerTask).notes;
  const desc = notesContent !== undefined ? notesContent : (existingTask?.description || '');

  // Due date
  const dueDateVal = listerTask.dueDate || existingTask?.dueDate;

  // Priority
  const prio = priorityFromLister(listerTask.priority, existingTask?.priority);

  // Tags and Category
  const incomingCategoryId = 'categoryId' in listerTask && typeof listerTask.categoryId === 'string' ? listerTask.categoryId : undefined;
  const incomingListId = 'listId' in listerTask && typeof listerTask.listId === 'string' ? listerTask.listId : undefined;

  let tags = existingTask?.tags ? [...existingTask.tags] : [];
  if (incomingCategoryId && !tags.some((t) => t.toLowerCase() === incomingCategoryId.toLowerCase())) {
    tags.push(incomingCategoryId);
  }

  if (existingTask) {
    return {
      ...existingTask,
      title: listerTask.title || existingTask.title,
      description: desc,
      statusId: targetStatusId,
      priority: prio,
      dueDate: dueDateVal,
      tags,
      projectId: incomingListId || existingTask.projectId,
      updatedAt: listerTask.updatedAt || new Date().toISOString()
    };
  }

  // Create new task from Lister
  const now = new Date().toISOString();
  return {
    id: listerTask.id || `task-lister-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    projectId: incomingListId || undefined,
    title: listerTask.title || 'Untitled Lister Task',
    description: desc,
    statusId: targetStatusId,
    priority: prio,
    assigneeIds: [defaultUserId],
    dueDate: dueDateVal,
    tags: tags.length > 0 ? tags : ['Lister'],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: listerTask.createdAt || now,
    updatedAt: listerTask.updatedAt || now,
    createdBy: defaultUserId,
    createdByName: 'Lister Sync'
  };
}

/**
 * Resolves conflicts between two task objects using timestamp-based last-write-wins.
 */
export function resolveTaskConflict(localTask: Task, incomingItem: ListerTask | Task, statuses: Status[]): Task {
  const localTime = new Date(localTask.updatedAt || localTask.createdAt || 0).getTime();
  const incomingTime = new Date(incomingItem.updatedAt || incomingItem.createdAt || 0).getTime();

  if (localTime >= incomingTime) {
    // Local version is newer or equal: preserve local
    return localTask;
  }

  // Incoming version is newer: merge incoming into local
  return listerTaskToTask(incomingItem as ListerTask, localTask, statuses);
}

/**
 * Merges authoritative synced tasks from Lister response into local tasks.
 */
export function mergeSyncedTasksWithLocal(
  localTasks: Task[],
  syncedItems: (ListerTask | Task)[],
  statuses: Status[],
  defaultUserId: string = 'user-admin-1'
): { mergedTasks: Task[]; conflictsCount: number; newAddedCount: number; updatedCount: number } {
  const localMap = new Map<string, Task>();
  localTasks.forEach((t) => localMap.set(t.id, t));

  let conflictsCount = 0;
  let newAddedCount = 0;
  let updatedCount = 0;

  const resultMap = new Map<string, Task>();

  // Process all incoming synced tasks
  syncedItems.forEach((item) => {
    const existing = localMap.get(item.id);
    if (existing) {
      const localTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();

      if (Math.abs(localTime - itemTime) > 1000) {
        conflictsCount++;
      }

      // If item is newer, update existing
      if (itemTime > localTime) {
        const merged = listerTaskToTask(item as ListerTask, existing, statuses, defaultUserId);
        resultMap.set(item.id, merged);
        updatedCount++;
      } else {
        resultMap.set(item.id, existing);
      }
    } else {
      // New item from remote server
      const created = listerTaskToTask(item as ListerTask, undefined, statuses, defaultUserId);
      resultMap.set(item.id, created);
      newAddedCount++;
    }
  });

  // Also retain any local tasks that may have been created locally since last sync
  localTasks.forEach((loc) => {
    if (!resultMap.has(loc.id)) {
      resultMap.set(loc.id, loc);
    }
  });

  return {
    mergedTasks: Array.from(resultMap.values()),
    conflictsCount,
    newAddedCount,
    updatedCount
  };
}
