import type { Habit } from '../../types/habit';
import { todayKey, weekKeys, getStreak } from '../../utils/dateUtils';
import { COLORS } from '../../constants/colors';
import { ICON_PATHS } from '../../constants/icons';
import styles from './HabitCard.module.css';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface HabitCardProps {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  const today = todayKey();
  const wk = weekKeys();
  const color = COLORS[habit.colorIdx % COLORS.length];
  const iconPaths = ICON_PATHS[habit.iconIdx % ICON_PATHS.length];
  const isDone = !!habit.completions[today];
  const streak = getStreak(habit.completions);
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10), parseInt(m, 10));
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formattedTime = (habit.timeFrom || habit.timeTo) ? (
    [formatTime(habit.timeFrom), formatTime(habit.timeTo)].filter(Boolean).join(' - ')
  ) : null;

  return (
    <div className={`${styles.card} ${isDone ? styles.done : ''}`}>
      {/* Top row */}
      <div className={styles.cardTop}>
        <div className={styles.iconWrap} style={{ background: color.bg }}>
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke={color.icon}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: iconPaths }}
          />
        </div>
        <div className={styles.actions}>
          <button className="btn btn-glass btn-icon" onClick={onEdit} title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
          <button className="btn btn-danger btn-icon" onClick={onDelete} title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.name}>{habit.name}</div>
        {habit.desc && <div className={styles.desc}>{habit.desc}</div>}
        {formattedTime && (
          <div className={styles.timeBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {formattedTime}
          </div>
        )}
      </div>

      {/* Week dots */}
      <div className={styles.weekRow}>
        <span className={styles.weekLabel}>Week</span>
        <div className={styles.weekDots}>
          {wk.map((key, i) => {
            const filled = !!habit.completions[key];
            const isToday = key === today;
            return (
              <div
                key={key}
                className={`${styles.dot} ${filled ? styles.filled : ''} ${isToday ? styles.todayDot : ''}`}
              >
                {DAYS_SHORT[i]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={`${styles.streakBadge} ${streak > 0 ? styles.active : ''}`}>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill={streak > 0 ? '#fbbf24' : 'none'}
            stroke={streak > 0 ? '#fbbf24' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          {streak} day streak
        </div>

        <button
          className={`${styles.checkBtn} ${isDone ? styles.checked : ''}`}
          onClick={onToggle}
          title={isDone ? 'Mark incomplete' : 'Mark complete'}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
