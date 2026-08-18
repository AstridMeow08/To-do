import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  todayKey,
  weekKeys,
  getStreak,
  buildHeatmapGrid,
  buildMonthGrid,
  buildMonthLabels,
  formatKey,
  formatShortDate,
  formatTime12Hour,
  parseTimeTo12Hour,
  to24HourString,
  uid,
} from '../utils/dateUtils';

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string offset by `days` from today */
function keyOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatKey(d);
}

/** Build a completions map for the last `n` consecutive days (including today) */
function lastNDaysCompletions(n: number): Record<string, boolean> {
  const c: Record<string, boolean> = {};
  for (let i = 0; i < n; i++) {
    c[keyOffset(-i)] = true;
  }
  return c;
}

// ─────────────────────────────────────────────────────────
// todayKey
// ─────────────────────────────────────────────────────────
describe('todayKey()', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches the actual current local date', () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(todayKey()).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────
// formatKey
// ─────────────────────────────────────────────────────────
describe('formatKey()', () => {
  it('returns zero-padded month and day', () => {
    const d = new Date(2024, 0, 5); // Jan 5 2024
    expect(formatKey(d)).toBe('2024-01-05');
  });

  it('handles December correctly', () => {
    const d = new Date(2023, 11, 31);
    expect(formatKey(d)).toBe('2023-12-31');
  });
});

// ─────────────────────────────────────────────────────────
// weekKeys
// ─────────────────────────────────────────────────────────
describe('weekKeys()', () => {
  it('returns exactly 7 keys', () => {
    expect(weekKeys()).toHaveLength(7);
  });

  it('all keys match YYYY-MM-DD format', () => {
    weekKeys().forEach((k) => {
      expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('contains todays key', () => {
    expect(weekKeys()).toContain(todayKey());
  });

  it('starts on a Sunday', () => {
    const d = new Date(weekKeys()[0] + 'T00:00:00');
    expect(d.getDay()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// getStreak
// ─────────────────────────────────────────────────────────
describe('getStreak()', () => {
  it('returns 0 for empty completions', () => {
    expect(getStreak({})).toBe(0);
  });

  it('returns 1 when only today is completed', () => {
    expect(getStreak({ [todayKey()]: true })).toBe(1);
  });

  it('returns the correct consecutive streak', () => {
    const completions = lastNDaysCompletions(7);
    expect(getStreak(completions)).toBe(7);
  });

  it('breaks streak if a day is missing', () => {
    const completions: Record<string, boolean> = {
      [keyOffset(0)]: true,
      [keyOffset(-1)]: true,
      // gap on -2
      [keyOffset(-3)]: true,
      [keyOffset(-4)]: true,
    };
    expect(getStreak(completions)).toBe(2);
  });

  it('returns 0 when only past completions exist (no recent)', () => {
    const completions: Record<string, boolean> = {
      [keyOffset(-5)]: true,
      [keyOffset(-6)]: true,
    };
    expect(getStreak(completions)).toBe(0);
  });

  it('ignores false values', () => {
    const completions = { [todayKey()]: false };
    expect(getStreak(completions)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// buildHeatmapGrid
// ─────────────────────────────────────────────────────────
describe('buildHeatmapGrid()', () => {
  it('returns cells in YYYY-MM-DD format', () => {
    const cells = buildHeatmapGrid();
    expect(cells.length).toBeGreaterThan(350);
    cells.forEach((c) => expect(c.key).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  });

  it('marks exactly one cell as today', () => {
    const cells = buildHeatmapGrid();
    const todayCells = cells.filter((c) => c.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].key).toBe(todayKey());
  });

  it('first cell falls on a Sunday (dayOfWeek === 0)', () => {
    const cells = buildHeatmapGrid();
    expect(cells[0].dayOfWeek).toBe(0);
  });

  it('weekIndex increments monotonically', () => {
    const cells = buildHeatmapGrid();
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].weekIndex).toBeGreaterThanOrEqual(cells[i - 1].weekIndex);
    }
  });
});

// ─────────────────────────────────────────────────────────
// buildMonthGrid
// ─────────────────────────────────────────────────────────
describe('buildMonthGrid()', () => {
  it('returns a multiple of 7 cells', () => {
    const cells = buildMonthGrid(2024, 1); // Feb 2024 (leap year)
    expect(cells.length % 7).toBe(0);
  });

  it('marks today correctly', () => {
    const now = new Date();
    const cells = buildMonthGrid(now.getFullYear(), now.getMonth());
    const todayCells = cells.filter((c) => c.isToday);
    expect(todayCells).toHaveLength(1);
  });

  it('only cells for the target month have isCurrentMonth=true', () => {
    const cells = buildMonthGrid(2024, 5); // June 2024
    const outOfMonth = cells.filter((c) => !c.isCurrentMonth);
    outOfMonth.forEach((c) => {
      const month = c.date.getMonth();
      expect(month).not.toBe(5);
    });
  });

  it('marks future dates as isFuture', () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const cells = buildMonthGrid(tomorrow.getFullYear(), tomorrow.getMonth());
    const tomorrowCell = cells.find((c) => c.key === formatKey(tomorrow));
    expect(tomorrowCell?.isFuture).toBe(true);
  });

  it('today is not marked isFuture', () => {
    const now = new Date();
    const cells = buildMonthGrid(now.getFullYear(), now.getMonth());
    const todayCell = cells.find((c) => c.isToday);
    expect(todayCell?.isFuture).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// buildMonthLabels
// ─────────────────────────────────────────────────────────
describe('buildMonthLabels()', () => {
  it('returns labels with valid month names and weekIndex', () => {
    const cells = buildHeatmapGrid();
    const labels = buildMonthLabels(cells);
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach((l) => {
      expect(l.month).toMatch(/^[A-Z][a-z]{2}$/);
      expect(typeof l.weekIndex).toBe('number');
    });
  });
});

// ─────────────────────────────────────────────────────────
// formatShortDate
// ─────────────────────────────────────────────────────────
describe('formatShortDate()', () => {
  it('formats a known date correctly', () => {
    const d = new Date(2024, 0, 1); // Jan 1, 2024
    expect(formatShortDate(d)).toMatch(/Jan\s*1,?\s*2024/);
  });
});

// ─────────────────────────────────────────────────────────
// formatTime12Hour
// ─────────────────────────────────────────────────────────
describe('formatTime12Hour()', () => {
  it('converts "09:00" to "9:00 AM"', () => {
    expect(formatTime12Hour('09:00')).toBe('9:00 AM');
  });

  it('converts "00:00" to "12:00 AM"', () => {
    expect(formatTime12Hour('00:00')).toBe('12:00 AM');
  });

  it('converts "12:00" to "12:00 PM"', () => {
    expect(formatTime12Hour('12:00')).toBe('12:00 PM');
  });

  it('converts "13:30" to "1:30 PM"', () => {
    expect(formatTime12Hour('13:30')).toBe('1:30 PM');
  });

  it('converts "23:59" to "11:59 PM"', () => {
    expect(formatTime12Hour('23:59')).toBe('11:59 PM');
  });

  it('returns empty string for undefined', () => {
    expect(formatTime12Hour(undefined)).toBe('');
  });

  it('returns original string for invalid format', () => {
    expect(formatTime12Hour('invalid')).toBe('invalid');
  });
});

// ─────────────────────────────────────────────────────────
// parseTimeTo12Hour
// ─────────────────────────────────────────────────────────
describe('parseTimeTo12Hour()', () => {
  it('parses "08:30" correctly', () => {
    const result = parseTimeTo12Hour('08:30');
    expect(result).toEqual({ hour: 8, minute: 30, ampm: 'AM' });
  });

  it('parses "20:45" correctly', () => {
    const result = parseTimeTo12Hour('20:45');
    expect(result).toEqual({ hour: 8, minute: 45, ampm: 'PM' });
  });

  it('parses "00:00" as 12:00 AM', () => {
    const result = parseTimeTo12Hour('00:00');
    expect(result).toEqual({ hour: 12, minute: 0, ampm: 'AM' });
  });

  it('parses "12:00" as 12:00 PM', () => {
    const result = parseTimeTo12Hour('12:00');
    expect(result).toEqual({ hour: 12, minute: 0, ampm: 'PM' });
  });

  it('returns null for undefined', () => {
    expect(parseTimeTo12Hour(undefined)).toBeNull();
  });

  it('returns null for invalid string', () => {
    expect(parseTimeTo12Hour('abc')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────
// to24HourString
// ─────────────────────────────────────────────────────────
describe('to24HourString()', () => {
  it('converts 9 AM to "09:00"', () => {
    expect(to24HourString(9, 0, 'AM')).toBe('09:00');
  });

  it('converts 12 AM to "00:00"', () => {
    expect(to24HourString(12, 0, 'AM')).toBe('00:00');
  });

  it('converts 12 PM to "12:00"', () => {
    expect(to24HourString(12, 0, 'PM')).toBe('12:00');
  });

  it('converts 1 PM to "13:00"', () => {
    expect(to24HourString(1, 0, 'PM')).toBe('13:00');
  });

  it('converts 11 PM to "23:00"', () => {
    expect(to24HourString(11, 0, 'PM')).toBe('23:00');
  });

  it('pads minutes with leading zero', () => {
    expect(to24HourString(3, 5, 'PM')).toBe('15:05');
  });
});

// ─────────────────────────────────────────────────────────
// uid
// ─────────────────────────────────────────────────────────
describe('uid()', () => {
  it('returns a non-empty string', () => {
    expect(typeof uid()).toBe('string');
    expect(uid().length).toBeGreaterThan(4);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, uid));
    expect(ids.size).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────
// Round-trip: parseTimeTo12Hour ↔ to24HourString
// ─────────────────────────────────────────────────────────
describe('Round-trip time conversion', () => {
  const times = ['00:00', '01:15', '09:45', '12:00', '13:30', '22:00', '23:59'];

  times.forEach((t) => {
    it(`round-trips "${t}" without loss`, () => {
      const parsed = parseTimeTo12Hour(t);
      expect(parsed).not.toBeNull();
      const back = to24HourString(parsed!.hour, parsed!.minute, parsed!.ampm);
      expect(back).toBe(t);
    });
  });
});
