import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHabits } from '../hooks/useHabits';
import type { Habit } from '../types/habit';

// ─────────────────────────────────────────────────────────
// Mock localStorage
// ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const STORAGE_KEY = 'habitTrackerData_v2';

const sampleFormData = {
  name: 'Morning Run',
  desc: 'Run 5km',
  colorIdx: 0,
  iconIdx: 1,
  timeFrom: '06:00',
  timeTo: '07:00',
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────
// useHabits Tests
// ─────────────────────────────────────────────────────────
describe('useHabits()', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('starts with an empty list when localStorage is empty', () => {
    const { result } = renderHook(() => useHabits());
    expect(result.current.habits).toHaveLength(0);
  });

  it('loads pre-existing habits from localStorage', () => {
    const existing: Habit[] = [{
      id: 'pre1', name: 'Pre-existing', desc: '', colorIdx: 0, iconIdx: 0, completions: {},
    }];
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(existing));
    const { result } = renderHook(() => useHabits());
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].name).toBe('Pre-existing');
  });

  it('addHabit() creates a new habit with unique ID', () => {
    const { result } = renderHook(() => useHabits());
    act(() => {
      result.current.addHabit(sampleFormData);
    });
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].name).toBe('Morning Run');
    expect(typeof result.current.habits[0].id).toBe('string');
    expect(result.current.habits[0].completions).toEqual({});
  });

  it('addHabit() persists to localStorage', () => {
    const { result } = renderHook(() => useHabits());
    act(() => {
      result.current.addHabit(sampleFormData);
    });
    const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY) || '[]') as Habit[];
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Morning Run');
  });

  it('updateHabit() changes only the specified habit', () => {
    const { result } = renderHook(() => useHabits());
    act(() => {
      result.current.addHabit(sampleFormData);
    });
    act(() => {
      result.current.addHabit({ ...sampleFormData, name: 'Read' });
    });
    const idToUpdate = result.current.habits[0].id;
    act(() => {
      result.current.updateHabit(idToUpdate, { ...sampleFormData, name: 'Evening Walk' });
    });
    expect(result.current.habits[0].name).toBe('Evening Walk');
    expect(result.current.habits[1].name).toBe('Read');
  });

  it('deleteHabit() removes the correct habit', () => {
    const { result } = renderHook(() => useHabits());
    act(() => {
      result.current.addHabit(sampleFormData);
    });
    act(() => {
      result.current.addHabit({ ...sampleFormData, name: 'Meditate' });
    });
    const idToDelete = result.current.habits[0].id;
    act(() => {
      result.current.deleteHabit(idToDelete);
    });
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].name).toBe('Meditate');
  });

  it('deleteHabit() persists removal to localStorage', () => {
    const { result } = renderHook(() => useHabits());
    act(() => result.current.addHabit(sampleFormData));
    const id = result.current.habits[0].id;
    act(() => result.current.deleteHabit(id));
    const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY) || '[]') as Habit[];
    expect(stored).toHaveLength(0);
  });

  it('toggleHabit() marks todays completion as true', () => {
    const { result } = renderHook(() => useHabits());
    act(() => result.current.addHabit(sampleFormData));
    const id = result.current.habits[0].id;
    act(() => result.current.toggleHabit(id));
    expect(result.current.habits[0].completions[getTodayKey()]).toBe(true);
  });

  it('toggleHabit() removes todays completion on second toggle (un-mark)', () => {
    const { result } = renderHook(() => useHabits());
    act(() => result.current.addHabit(sampleFormData));
    const id = result.current.habits[0].id;
    act(() => result.current.toggleHabit(id)); // mark
    act(() => result.current.toggleHabit(id)); // unmark
    expect(result.current.habits[0].completions[getTodayKey()]).toBeUndefined();
  });

  it('toggleHabit() only affects the targeted habit', () => {
    const { result } = renderHook(() => useHabits());
    act(() => {
      result.current.addHabit(sampleFormData);
    });
    act(() => {
      result.current.addHabit({ ...sampleFormData, name: 'Meditate' });
    });
    const id1 = result.current.habits[0].id;
    act(() => result.current.toggleHabit(id1));
    expect(result.current.habits[0].completions[getTodayKey()]).toBe(true);
    expect(result.current.habits[1].completions[getTodayKey()]).toBeUndefined();
  });

  it('importHabits() replace mode overwrites all habits', () => {
    const { result } = renderHook(() => useHabits());
    act(() => result.current.addHabit(sampleFormData));
    const incoming: Habit[] = [{
      id: 'imp1', name: 'Imported Habit', desc: '', colorIdx: 0, iconIdx: 0, completions: {},
    }];
    act(() => result.current.importHabits(incoming, 'replace'));
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].name).toBe('Imported Habit');
  });

  it('importHabits() merge mode adds new and merges existing habits', () => {
    const { result } = renderHook(() => useHabits());
    act(() => result.current.addHabit(sampleFormData));
    const existingId = result.current.habits[0].id;
    const incoming: Habit[] = [
      { id: existingId, name: 'Morning Run', desc: 'Run 5km', colorIdx: 0, iconIdx: 1, completions: { '2024-09-01': true } },
      { id: 'new1', name: 'Swim', desc: '', colorIdx: 1, iconIdx: 2, completions: {} },
    ];
    act(() => result.current.importHabits(incoming, 'merge'));
    expect(result.current.habits).toHaveLength(2);
    const runHabit = result.current.habits.find((h) => h.name === 'Morning Run');
    expect(runHabit?.completions['2024-09-01']).toBe(true);
  });

  it('handles corrupted localStorage gracefully (returns empty)', () => {
    localStorageMock.setItem(STORAGE_KEY, '{{invalid json}}');
    const { result } = renderHook(() => useHabits());
    expect(result.current.habits).toHaveLength(0);
  });
});
