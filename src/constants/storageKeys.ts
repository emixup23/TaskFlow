/**
 * Centralized localStorage key constants.
 * Prevents key name typos and documents application persistence domains.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'taskflow_auth_token',
  USER_ID: 'taskflow_user_id',
  VIEW_MODE: 'taskflow_view_mode',
  SIDEBAR_OPEN: 'taskflow_sidebar_open',
  METRICS_VISIBILITY: 'taskflow_metrics_visibility_v3',
  KANBAN_COLUMN_SORT: 'taskflow_kanban_column_sort',
  KANBAN_TASK_SORT: 'taskflow_kanban_task_sort',
  KANBAN_COL_TASK_SORTS: 'taskflow_kanban_col_task_sorts',
  HIDDEN_KANBAN_COLUMNS: 'taskflow_hidden_kanban_columns',
  KUDOS_WALLETS: 'taskflow_kudos_wallets',
  GAMIFICATION_DATA: 'taskflow_gamification_data',
  ADVENTURE_PROGRESS_PREFIX: 'taskflow_adventure_progress_'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
