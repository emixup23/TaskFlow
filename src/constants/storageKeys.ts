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
  KANBAN_ACTIVE_COLUMN: 'taskflow_kanban_active_column',
  KUDOS_WALLETS: 'taskflow_kudos_wallets',
  GAMIFICATION_DATA: 'taskflow_gamification_data',
  ADVENTURE_PROGRESS_PREFIX: 'taskflow_adventure_progress_',
  DAILY_SHOW_USER_FILTER: 'taskflow_daily_show_user_filter',
  LISTER_API_BASE_URL: 'taskflow_lister_api_base_url',
  LISTER_API_KEY: 'taskflow_lister_api_key',
  LISTER_LAST_SYNC_TIME: 'taskflow_lister_last_sync_time'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
