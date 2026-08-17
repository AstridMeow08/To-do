import type { Habit } from '../../types/habit';
import { HabitCard } from '../HabitCard';
import { EmptyState } from '../EmptyState';
import styles from './HabitsGrid.module.css';

interface HabitsGridProps {
  habits: Habit[];
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function HabitsGrid({ habits, onToggle, onEdit, onDelete, onAdd }: HabitsGridProps) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>My Habits</span>
      </div>
      <div className={styles.grid}>
        {habits.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={() => onToggle(habit.id)}
              onEdit={() => onEdit(habit)}
              onDelete={() => onDelete(habit.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
