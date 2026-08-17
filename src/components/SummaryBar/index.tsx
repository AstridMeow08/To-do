import type { Habit } from '../../types/habit';
import { todayKey, getStreak } from '../../utils/dateUtils';
import { StatCard } from '../StatCard';
import styles from './SummaryBar.module.css';

interface SummaryBarProps {
  habits: Habit[];
}

export function SummaryBar({ habits }: SummaryBarProps) {
  const today = todayKey();
  const total = habits.length;
  const done = habits.filter((h) => h.completions[today]).length;
  const bestStreak = habits.reduce((best, h) => Math.max(best, getStreak(h.completions)), 0);
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className={styles.bar}>
      <StatCard label="Total Habits" value={String(total)} desc="being tracked" />
      <StatCard label="Completed Today" value={String(done)} desc={`out of ${total}`} />
      <StatCard label="Best Streak" value={String(bestStreak)} desc="consecutive days" />
      <StatCard label="Completion Rate" value={`${rate}%`} desc="today" />
    </div>
  );
}
