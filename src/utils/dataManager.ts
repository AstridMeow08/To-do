import type { Habit } from '../types/habit';
import { todayKey, uid, getStreak } from './dateUtils';

/**
 * Triggers a client-side file download in the browser.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports habit data as a JSON backup file.
 */
export function exportToJson(habits: Habit[]): void {
  const dateStr = todayKey();
  const exportPayload = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    habits,
  };
  const jsonString = JSON.stringify(exportPayload, null, 2);
  downloadFile(jsonString, `habit-tracker-backup-${dateStr}.json`, 'application/json');
}

/**
 * Escapes a string for safe inclusion in CSV fields.
 */
function escapeCsv(val: string | number | undefined): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports habit data as an Excel-compatible CSV file.
 */
export function exportToCsv(habits: Habit[]): void {
  const dateStr = todayKey();
  const headers = [
    'ID',
    'Name',
    'Description',
    'From Time',
    'To Time',
    'Color Index',
    'Icon Index',
    'Current Streak',
    'Total Completions',
    'Completions List (YYYY-MM-DD)',
  ];

  const rows = habits.map((h) => {
    const completionDates = Object.keys(h.completions || {})
      .filter((k) => h.completions[k])
      .sort()
      .join(';');

    return [
      escapeCsv(h.id),
      escapeCsv(h.name),
      escapeCsv(h.desc || ''),
      escapeCsv(h.timeFrom || ''),
      escapeCsv(h.timeTo || ''),
      escapeCsv(h.colorIdx ?? 0),
      escapeCsv(h.iconIdx ?? 0),
      escapeCsv(getStreak(h.completions || {})),
      escapeCsv(Object.values(h.completions || {}).filter(Boolean).length),
      escapeCsv(completionDates),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility with international characters
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  downloadFile(csvContent, `habit-tracker-report-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports both JSON and CSV files simultaneously.
 */
export function exportBoth(habits: Habit[]): void {
  exportToJson(habits);
  // Slight timeout so the browser doesn't block dual download triggers
  setTimeout(() => {
    exportToCsv(habits);
  }, 250);
}

/**
 * Safely parses and validates a JSON backup file content.
 */
export function parseJsonContent(rawText: string): Habit[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Invalid JSON format. Please ensure the file is valid JSON.');
  }

  let habitList: unknown[];
  if (Array.isArray(parsed)) {
    habitList = parsed;
  } else if (parsed && typeof parsed === 'object' && 'habits' in parsed && Array.isArray((parsed as { habits: unknown[] }).habits)) {
    habitList = (parsed as { habits: unknown[] }).habits;
  } else {
    throw new Error('JSON does not contain a valid list of habits.');
  }

  return habitList.map((item) => {
    const record = item as Record<string, unknown>;
    if (!record.name || typeof record.name !== 'string') {
      throw new Error('One or more habits are missing a valid name.');
    }
    return {
      id: record.id && typeof record.id === 'string' ? record.id : uid(),
      name: record.name.trim(),
      desc: record.desc && typeof record.desc === 'string' ? record.desc.trim() : '',
      colorIdx: typeof record.colorIdx === 'number' ? record.colorIdx : 0,
      iconIdx: typeof record.iconIdx === 'number' ? record.iconIdx : 0,
      timeFrom: record.timeFrom && typeof record.timeFrom === 'string' ? record.timeFrom : undefined,
      timeTo: record.timeTo && typeof record.timeTo === 'string' ? record.timeTo : undefined,
      completions: record.completions && typeof record.completions === 'object' ? (record.completions as Record<string, boolean>) : {},
    };
  });
}

/**
 * Robust CSV Line Parser (handles quoted strings with commas).
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

/**
 * Safely parses and validates a CSV file content into habits.
 */
export function parseCsvContent(rawText: string): Habit[] {
  // Remove BOM if present
  const cleanText = rawText.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('The CSV file is empty.');
  }

  // Extract header columns to map column positions dynamically
  const headerRow = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = headerRow.findIndex((h) => h.includes('name'));
  const descIdx = headerRow.findIndex((h) => h.includes('desc'));
  const idIdx = headerRow.findIndex((h) => h === 'id');
  const timeFromIdx = headerRow.findIndex((h) => h.includes('from') || h === 'time' || h === 'start');
  const timeToIdx = headerRow.findIndex((h) => h.includes('to') || h === 'end');
  const colorIdx = headerRow.findIndex((h) => h.includes('color'));
  const iconIdx = headerRow.findIndex((h) => h.includes('icon'));
  const completionsIdx = headerRow.findIndex((h) => h.includes('completion') && !h.includes('total'));

  if (nameIdx === -1) {
    throw new Error('CSV file must contain a "Name" column header.');
  }

  const habits: Habit[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[nameIdx];
    if (!name) continue;

    const id = idIdx !== -1 && cols[idIdx] ? cols[idIdx] : uid();
    const desc = descIdx !== -1 && cols[descIdx] ? cols[descIdx] : '';
    const timeFrom = timeFromIdx !== -1 && cols[timeFromIdx] ? cols[timeFromIdx] : undefined;
    const timeTo = timeToIdx !== -1 && cols[timeToIdx] ? cols[timeToIdx] : undefined;
    const cIdx = colorIdx !== -1 && !isNaN(parseInt(cols[colorIdx], 10)) ? parseInt(cols[colorIdx], 10) : 0;
    const iIdx = iconIdx !== -1 && !isNaN(parseInt(cols[iconIdx], 10)) ? parseInt(cols[iconIdx], 10) : 0;

    // Parse completions
    const completions: Record<string, boolean> = {};
    if (completionsIdx !== -1 && cols[completionsIdx]) {
      const dates = cols[completionsIdx].split(/[;,|]/).map((d) => d.trim());
      for (const d of dates) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          completions[d] = true;
        }
      }
    }

    habits.push({
      id,
      name,
      desc,
      colorIdx: cIdx,
      iconIdx: iIdx,
      timeFrom,
      timeTo,
      completions,
    });
  }

  if (habits.length === 0) {
    throw new Error('No valid habits found in the CSV file.');
  }

  return habits;
}

/**
 * Reads and parses an uploaded File (JSON or CSV).
 */
export async function parseImportFile(file: File): Promise<{ habits: Habit[]; format: 'json' | 'csv' }> {
  const content = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json' || file.type === 'application/json') {
    const habits = parseJsonContent(content);
    return { habits, format: 'json' };
  }

  if (ext === 'csv' || file.type === 'text/csv' || file.type.includes('spreadsheet') || file.type.includes('excel')) {
    const habits = parseCsvContent(content);
    return { habits, format: 'csv' };
  }

  // Fallback: try parsing JSON, then try CSV
  try {
    const habits = parseJsonContent(content);
    return { habits, format: 'json' };
  } catch {
    const habits = parseCsvContent(content);
    return { habits, format: 'csv' };
  }
}

/**
 * Merges imported habits with existing habits.
 * If a habit with the same ID or same name exists, it merges their completion records.
 * Otherwise, adds the new habit.
 */
export function mergeHabits(existing: Habit[], incoming: Habit[]): Habit[] {
  const map = new Map<string, Habit>();

  // Add all existing habits
  for (const h of existing) {
    map.set(h.id, { ...h, completions: { ...h.completions } });
  }

  for (const inc of incoming) {
    // Check match by ID or matching name
    let match = map.get(inc.id);
    if (!match) {
      match = Array.from(map.values()).find((h) => h.name.toLowerCase() === inc.name.toLowerCase());
    }

    if (match) {
      // Merge completions
      match.completions = { ...match.completions, ...inc.completions };
      if (!match.desc && inc.desc) match.desc = inc.desc;
      if (!match.timeFrom && inc.timeFrom) match.timeFrom = inc.timeFrom;
      if (!match.timeTo && inc.timeTo) match.timeTo = inc.timeTo;
    } else {
      map.set(inc.id, { ...inc, completions: { ...inc.completions } });
    }
  }

  return Array.from(map.values());
}
