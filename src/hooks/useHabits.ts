import { useState, useCallback } from 'react';
import type { Habit, HabitFormData } from '../types/habit';
import { todayKey, uid } from '../utils/dateUtils';
import { mergeHabits } from '../utils/dataManager';

const STORAGE_KEY = 'habitTrackerData_v2';

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Habit[]) : [];
  } catch {
    return [];
  }
}

function persist(habits: Habit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(loadHabits);

  const update = useCallback((next: Habit[]) => {
    setHabits(next);
    persist(next);
  }, []);

  const addHabit = useCallback(
    (data: HabitFormData) => {
      const habit: Habit = { id: uid(), ...data, completions: {} };
      update([...habits, habit]);
    },
    [habits, update]
  );

  const updateHabit = useCallback(
    (id: string, data: HabitFormData) => {
      update(habits.map((h) => (h.id === id ? { ...h, ...data } : h)));
    },
    [habits, update]
  );

  const deleteHabit = useCallback(
    (id: string) => {
      update(habits.filter((h) => h.id !== id));
    },
    [habits, update]
  );

  const toggleHabit = useCallback(
    (id: string) => {
      const today = todayKey();
      update(
        habits.map((h) => {
          if (h.id !== id) return h;
          const completions = { ...h.completions };
          if (completions[today]) {
            delete completions[today];
          } else {
            completions[today] = true;
          }
          return { ...h, completions };
        })
      );
    },
    [habits, update]
  );

  const importHabits = useCallback(
    (incoming: Habit[], mode: 'merge' | 'replace') => {
      if (mode === 'replace') {
        update(incoming);
      } else {
        const merged = mergeHabits(habits, incoming);
        update(merged);
      }
    },
    [habits, update]
  );

  return { habits, addHabit, updateHabit, deleteHabit, toggleHabit, importHabits };
}
