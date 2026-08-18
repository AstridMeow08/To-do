import type { Habit } from '../../types/habit';
import { formatTime12Hour } from '../../utils/dateUtils';
import { COLORS } from '../../constants/colors';
import { ICON_PATHS } from '../../constants/icons';
import styles from './ReminderModal.module.css';

interface ReminderModalProps {
  habit: Habit | null;
  onClose: () => void;
  onComplete: (habitId: string) => void;
}

export function ReminderModal({ habit, onClose, onComplete }: ReminderModalProps) {
  if (!habit) return null;

  const color = COLORS[habit.colorIdx % COLORS.length] || COLORS[0];
  const iconPaths = ICON_PATHS[habit.iconIdx % ICON_PATHS.length] || ICON_PATHS[0];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconContainer} style={{ background: color.bg }}>
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke={color.icon}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: iconPaths }}
            />
          </div>
          <h2 className={styles.title}>Time for your habit!</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <h3 className={styles.habitName}>{habit.name}</h3>
          {habit.desc && (
            <p className={styles.habitDescription}>{habit.desc}</p>
          )}
          <div className={styles.timeLabel}>
            Scheduled for {formatTime12Hour(habit.timeFrom)}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.dismissButton} onClick={onClose}>
            Dismiss
          </button>
          <button 
            className={styles.completeButton} 
            style={{ backgroundColor: color.swatch }}
            onClick={() => onComplete(habit.id)}
          >
            Mark as Completed
          </button>
        </div>
      </div>
    </div>
  );
}
