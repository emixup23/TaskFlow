/**
 * Resilient localStorage utilities with automatic JSON serialization,
 * error handling, and safe fallbacks for edge cases.
 */

export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
