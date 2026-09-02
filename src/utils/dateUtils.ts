/**
 * Utility functions for date and time formatting across the application.
 * Specifically standardizes meeting date & time displays to `dd/mm/yyyy HH:MM`.
 */

/**
 * Formats a Date object or ISO string into `dd/mm/yyyy HH:MM` format.
 * Example: "02/09/2026 14:30"
 */
export function formatDateTimeDDMMYYYYHHMM(input?: string | Date | number | null): string {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a Date object or ISO string into `dd/mm/yyyy` format.
 * Example: "02/09/2026"
 */
export function formatDateDDMMYYYY(input?: string | Date | number | null): string {
  if (!input) return '';
  
  // If it's in YYYY-MM-DD format already, split directly to prevent timezone skew
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const [year, month, day] = input.trim().split('-');
    return `${day}/${month}/${year}`;
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats a meeting date string (YYYY-MM-DD or ISO) and start/end times (HH:MM)
 * into the required `dd/mm/yyyy HH:MM` or `dd/mm/yyyy HH:MM - HH:MM` format.
 *
 * Example outputs:
 * - formatMeetingDateTime("2026-09-02", "10:00") -> "02/09/2026 10:00"
 * - formatMeetingDateTime("2026-09-02", "10:00", "10:45") -> "02/09/2026 10:00 - 10:45"
 */
export function formatMeetingDateTime(
  dateStr?: string | null,
  startTime?: string | null,
  endTime?: string | null
): string {
  if (!dateStr && !startTime) return 'Date pending';

  let formattedDate = '';
  if (dateStr) {
    formattedDate = formatDateDDMMYYYY(dateStr);
  } else if (startTime && startTime.includes('T')) {
    formattedDate = formatDateDDMMYYYY(startTime);
  }

  // Extract clean HH:MM from startTime
  let startClean = startTime || '';
  if (startClean.includes('T')) {
    const d = new Date(startClean);
    if (!isNaN(d.getTime())) {
      startClean = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }

  // Extract clean HH:MM from endTime
  let endClean = endTime || '';
  if (endClean.includes('T')) {
    const d = new Date(endClean);
    if (!isNaN(d.getTime())) {
      endClean = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }

  if (formattedDate && startClean) {
    if (endClean) {
      return `${formattedDate} ${startClean} - ${endClean}`;
    }
    return `${formattedDate} ${startClean}`;
  }

  if (formattedDate) return formattedDate;
  if (startClean && endClean) return `${startClean} - ${endClean}`;
  return startClean || 'Scheduled';
}
