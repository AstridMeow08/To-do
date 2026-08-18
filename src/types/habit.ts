export interface Habit {
  id: string;
  name: string;
  desc: string;
  colorIdx: number;
  iconIdx: number;
  timeFrom?: string; // e.g. "08:00"
  timeTo?: string;   // e.g. "09:00"
  startDate?: string; // e.g. "2024-01-01"
  frequency?: 'everyday' | 'weekdays' | 'weekends';
  completions: Record<string, boolean>; // key: "YYYY-MM-DD"
}

export interface HabitFormData {
  name: string;
  desc: string;
  colorIdx: number;
  iconIdx: number;
  timeFrom?: string;
  timeTo?: string;
  startDate?: string;
  frequency?: 'everyday' | 'weekdays' | 'weekends';
}
