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

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

