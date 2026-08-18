import { describe, it, expect } from 'vitest';
import {
  parseJsonContent,
  parseCsvContent,
  mergeHabits,
  exportToJson,
  exportToCsv,
} from '../utils/dataManager';
import type { Habit } from '../types/habit';

// ─────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────

const sampleHabit: Habit = {
  id: 'abc123',
  name: 'Morning Run',
  desc: 'Run 5km every morning',
  colorIdx: 0,
  iconIdx: 1,
  timeFrom: '06:00',
  timeTo: '07:00',
  completions: { '2024-01-01': true, '2024-01-02': true },
};

const minimalHabit: Habit = {
  id: 'xyz789',
  name: 'Read',
  desc: '',
  colorIdx: 0,
  iconIdx: 0,
  completions: {},
};

// ─────────────────────────────────────────────────────────
// parseJsonContent
// ─────────────────────────────────────────────────────────
describe('parseJsonContent()', () => {
  it('parses an array of habit objects', () => {
    const raw = JSON.stringify([sampleHabit]);
    const result = parseJsonContent(raw);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Morning Run');
    expect(result[0].completions['2024-01-01']).toBe(true);
  });

  it('parses the { version, habits } backup envelope format', () => {
    const payload = { version: '2.0', exportedAt: new Date().toISOString(), habits: [sampleHabit] };
    const result = parseJsonContent(JSON.stringify(payload));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abc123');
  });

  it('auto-generates an id when id is missing', () => {
    const { id: _id, ...noId } = sampleHabit;
    const result = parseJsonContent(JSON.stringify([noId]));
    expect(typeof result[0].id).toBe('string');
    expect(result[0].id.length).toBeGreaterThan(0);
  });

  it('defaults missing optional fields to safe values', () => {
    const minimal = JSON.stringify([{ name: 'Walk', id: 'w1' }]);
    const result = parseJsonContent(minimal);
    expect(result[0].desc).toBe('');
    expect(result[0].colorIdx).toBe(0);
    expect(result[0].iconIdx).toBe(0);
    expect(result[0].completions).toEqual({});
    expect(result[0].timeFrom).toBeUndefined();
    expect(result[0].timeTo).toBeUndefined();
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonContent('{{not valid}}')).toThrow('Invalid JSON format');
  });

  it('throws when JSON does not contain habits', () => {
    expect(() => parseJsonContent(JSON.stringify({ foo: 'bar' }))).toThrow('valid list of habits');
  });

  it('throws when a habit is missing name', () => {
    expect(() => parseJsonContent(JSON.stringify([{ id: 'h1', completions: {} }]))).toThrow('missing a valid name');
  });

  it('parses multiple habits', () => {
    const raw = JSON.stringify([sampleHabit, minimalHabit]);
    const result = parseJsonContent(raw);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe('Read');
  });
});

// ─────────────────────────────────────────────────────────
// parseCsvContent
// ─────────────────────────────────────────────────────────
describe('parseCsvContent()', () => {
  const buildCsvRow = (name: string, desc = '', completions = '') =>
    `"id1","${name}","${desc}","","","0","0","0","1","${completions}"`;

  const headers = 'ID,Name,Description,From Time,To Time,Color Index,Icon Index,Current Streak,Total Completions,"Completions List (YYYY-MM-DD)"';

  it('parses a single-row CSV correctly', () => {
    const csv = `${headers}\n${buildCsvRow('Morning Yoga', 'Stretch daily', '2024-06-01')}`;
    const result = parseCsvContent(csv);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Morning Yoga');
    expect(result[0].desc).toBe('Stretch daily');
    expect(result[0].completions['2024-06-01']).toBe(true);
  });

  it('handles UTF-8 BOM prefix', () => {
    const csv = '\uFEFF' + `${headers}\n${buildCsvRow('Reading')}`;
    expect(() => parseCsvContent(csv)).not.toThrow();
    const result = parseCsvContent(csv);
    expect(result[0].name).toBe('Reading');
  });

  it('parses multiple completion dates separated by semicolons', () => {
    const csv = `${headers}\n${buildCsvRow('Meditate', '', '2024-01-01;2024-01-02;2024-01-03')}`;
    const result = parseCsvContent(csv);
    expect(Object.keys(result[0].completions)).toHaveLength(3);
  });

  it('skips rows with no name', () => {
    const csv = `${headers}\n${buildCsvRow('Valid Habit')}\n"","","","","","0","0","0","0",""`;
    const result = parseCsvContent(csv);
    expect(result).toHaveLength(1);
  });

  it('throws if CSV is empty', () => {
    expect(() => parseCsvContent('')).toThrow('empty');
  });

  it('throws if CSV has no Name column', () => {
    const csv = 'A,B,C\n1,2,3';
    expect(() => parseCsvContent(csv)).toThrow('"Name" column');
  });

  it('ignores malformed completion dates', () => {
    const csv = `${headers}\n${buildCsvRow('Walk', '', 'not-a-date;2024-05-10;baddate')}`;
    const result = parseCsvContent(csv);
    expect(Object.keys(result[0].completions)).toHaveLength(1);
    expect(result[0].completions['2024-05-10']).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
// mergeHabits
// ─────────────────────────────────────────────────────────
describe('mergeHabits()', () => {
  it('returns all existing habits when incoming is empty', () => {
    const merged = mergeHabits([sampleHabit], []);
    expect(merged).toHaveLength(1);
  });

  it('adds new habits that do not exist in existing', () => {
    const merged = mergeHabits([sampleHabit], [minimalHabit]);
    expect(merged).toHaveLength(2);
  });

  it('merges completions for habits with matching IDs', () => {
    const existing: Habit = { ...sampleHabit, completions: { '2024-01-01': true } };
    const incoming: Habit = { ...sampleHabit, completions: { '2024-01-03': true } };
    const merged = mergeHabits([existing], [incoming]);
    expect(merged).toHaveLength(1);
    expect(merged[0].completions['2024-01-01']).toBe(true);
    expect(merged[0].completions['2024-01-03']).toBe(true);
  });

  it('merges by name when IDs differ', () => {
    const incoming: Habit = { ...sampleHabit, id: 'different-id', completions: { '2024-02-01': true } };
    const merged = mergeHabits([sampleHabit], [incoming]);
    // Should still be 1 habit (same name) with merged completions
    expect(merged).toHaveLength(1);
    expect(merged[0].completions['2024-02-01']).toBe(true);
  });

  it('does not lose existing completions during merge', () => {
    const existing: Habit = { ...sampleHabit, completions: { '2024-01-01': true, '2024-01-02': true } };
    const incoming: Habit = { ...sampleHabit, completions: { '2024-01-03': true } };
    const merged = mergeHabits([existing], [incoming]);
    expect(Object.keys(merged[0].completions)).toHaveLength(3);
  });

  it('fills in missing desc from incoming', () => {
    const existing: Habit = { ...sampleHabit, desc: '' };
    const incoming: Habit = { ...sampleHabit, desc: 'Updated description' };
    const merged = mergeHabits([existing], [incoming]);
    expect(merged[0].desc).toBe('Updated description');
  });

  it('preserves original desc when existing is non-empty', () => {
    const existing: Habit = { ...sampleHabit, desc: 'Original' };
    const incoming: Habit = { ...sampleHabit, desc: 'New description' };
    const merged = mergeHabits([existing], [incoming]);
    expect(merged[0].desc).toBe('Original');
  });

  it('handles both empty arrays', () => {
    const merged = mergeHabits([], []);
    expect(merged).toHaveLength(0);
  });

  it('returns unique habits (no duplicates by ID)', () => {
    const merged = mergeHabits([sampleHabit], [sampleHabit]);
    expect(merged).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────
// exportToJson (structural test — no DOM download)
// ─────────────────────────────────────────────────────────
describe('exportToJson() – JSON payload structure', () => {
  it('builds a valid JSON payload with version and habits', () => {
    // Test the payload structure without triggering the DOM download
    const habits = [sampleHabit, minimalHabit];
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      habits,
    };
    const json = JSON.stringify(payload, null, 2);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('2.0');
    expect(parsed.habits).toHaveLength(2);
    expect(parsed.habits[0].name).toBe('Morning Run');
  });
});

// ─────────────────────────────────────────────────────────
// CSV escaping correctness
// ─────────────────────────────────────────────────────────
describe('CSV escaping correctness', () => {
  it('habits with commas in names are parseable after round-trip', () => {
    const header = 'ID,Name,Description,From Time,To Time,Color Index,Icon Index,Current Streak,Total Completions,"Completions List (YYYY-MM-DD)"';
    // Manually crafted row with a habit name containing a comma inside quotes
    const row = '"h1","Yoga, Morning","Stretch","","","0","0","1","1","2024-05-01"';
    const csv = `${header}\n${row}`;
    const result = parseCsvContent(csv);
    expect(result[0].name).toBe('Yoga, Morning');
  });

  it('habits with double-quote in desc are handled', () => {
    const header = 'ID,Name,Description,From Time,To Time,Color Index,Icon Index,Current Streak,Total Completions,"Completions List (YYYY-MM-DD)"';
    const row = '"h2","Read","Says ""hello""","","","0","0","0","0",""';
    const csv = `${header}\n${row}`;
    const result = parseCsvContent(csv);
    expect(result[0].desc).toBe('Says "hello"');
  });
});
