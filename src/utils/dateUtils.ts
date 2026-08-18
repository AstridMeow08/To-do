/** Returns today's date key as "YYYY-MM-DD" */
export function todayKey(): string {
  const d = new Date();
  return formatKey(d);
}

/** Returns an array of 7 date keys for the current Sun–Sat week */
export function weekKeys(): string[] {
  const keys: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    keys.push(formatKey(d));
  }
  return keys;
}

/** Returns the current consecutive day streak for a habit */
export function getStreak(completions: Record<string, boolean>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (completions[formatKey(d)]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export interface DayCell {
  key: string;          // "YYYY-MM-DD"
  date: Date;
  dayOfWeek: number;    // 0 = Sun
  weekIndex: number;    // column in the grid
  isToday: boolean;
  month: number;        // 0-indexed
}

/**
 * Returns a flat list of DayCell objects covering the last 52 full weeks
 * (364 days), padded at the front so the first column starts on Sunday.
 * Ordered oldest → newest, left-to-right, top-to-bottom.
 */
export function buildHeatmapGrid(): DayCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey_ = formatKey(today);

  // Go back to the most recent Sunday before/on (today - 363 days)
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(today.getDate() - 363); // 52 weeks = 364 days, idx 0..363
  // Back up to Sunday
  start.setDate(start.getDate() - start.getDay());

  const cells: DayCell[] = [];
  let weekIndex = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (cursor.getDay() === 0 && cells.length > 0) weekIndex++;
    cells.push({
      key: formatKey(cursor),
      date: new Date(cursor),
      dayOfWeek: cursor.getDay(),
      weekIndex,
      isToday: formatKey(cursor) === todayKey_,
      month: cursor.getMonth(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

/** Month label positions for the heatmap column headers */
export interface MonthLabel {
  month: string;
  weekIndex: number;
}

export function buildMonthLabels(cells: DayCell[]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  const seen = new Set<number>();
  const NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (const cell of cells) {
    if (cell.dayOfWeek === 0 && !seen.has(cell.weekIndex)) {
      const monthKey = cell.date.getFullYear() * 12 + cell.month;
      if (!seen.has(monthKey)) {
        seen.add(monthKey);
        labels.push({ month: NAMES[cell.month], weekIndex: cell.weekIndex });
      }
    }
  }
  return labels;
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export interface MonthDayCell {
  key: string;       // "YYYY-MM-DD"
  date: Date;
  dayNumber: number; // 1..31
  dayOfWeek: number; // 0=Sun..6=Sat
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Builds a 7-column calendar matrix for the specified year and month (0-indexed).
 * Includes padding days from previous and next months to form complete weeks.
 */
export function buildMonthGrid(year: number, month: number): MonthDayCell[] {
  const cells: MonthDayCell[] = [];
  const todayKey_ = todayKey();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // First day of target month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

  // Start date (backed up to previous Sunday)
  const cursor = new Date(year, month, 1 - firstDayOfWeek);

  // Last day of target month
  const lastDay = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDay.getDate();

  // Total slots needed: firstDayOfWeek + totalDaysInMonth, rounded up to next multiple of 7
  const slotsNeeded = Math.ceil((firstDayOfWeek + totalDaysInMonth) / 7) * 7;

  for (let i = 0; i < slotsNeeded; i++) {
    const key = formatKey(cursor);
    const isCurrentMonth = cursor.getMonth() === month && cursor.getFullYear() === year;
    const isToday = key === todayKey_;
    const isFuture = cursor > today;

    cells.push({
      key,
      date: new Date(cursor),
      dayNumber: cursor.getDate(),
      dayOfWeek: cursor.getDay(),
      isCurrentMonth,
      isToday,
      isFuture,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

/** Converts "HH:MM" (24h) to "h:mm AM/PM" */
export function formatTime12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/** Parses "HH:MM" (24h) into 12h components */
export function parseTimeTo12Hour(timeStr?: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return { hour, minute: m, ampm };
}

/** Converts 12h components into "HH:MM" (24h) */
export function to24HourString(hour12: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (ampm === 'PM') h += 12;
  const hh = String(h).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

