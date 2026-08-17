import { useMemo, useState } from 'react';
import type { Habit } from '../../types/habit';
import {
  buildHeatmapGrid,
  buildMonthLabels,
  formatShortDate,
  todayKey,
} from '../../utils/dateUtils';
import styles from './ContributionGraph.module.css';

interface Props {
  habits: Habit[];
  /** If provided, only show data for this single habit */
  habit?: Habit;
  /** Compact single-row mode for per-habit rows */
  compact?: boolean;
  /** Callback when a cell is clicked */
  onDayClick?: (dateKey: string) => void;
  /** The currently selected date key */
  selectedDate?: string | null;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function ContributionGraph({ habits, habit, compact = false, onDayClick, selectedDate }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const cells = useMemo(() => buildHeatmapGrid(), []);
  const monthLabels = useMemo(() => buildMonthLabels(cells), [cells]);

  // Count total habits (denominator for shading)
  const totalHabits = habit ? 1 : habits.length;
  const today = todayKey();

  // Build a map: dateKey → completed count
  const countMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const source = habit ? [habit] : habits;
    for (const h of source) {
      for (const [key, done] of Object.entries(h.completions)) {
        if (done) map[key] = (map[key] ?? 0) + 1;
      }
    }
    return map;
  }, [habits, habit]);

  // Compute the max weeks for grid sizing
  const maxWeek = cells.reduce((m, c) => Math.max(m, c.weekIndex), 0) + 1;

  // Shade level 0-4
  function level(key: string): number {
    const count = countMap[key] ?? 0;
    if (count === 0 || totalHabits === 0) return 0;
    const ratio = count / totalHabits;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  function handleMouseEnter(e: React.MouseEvent, cell: ReturnType<typeof buildHeatmapGrid>[number]) {
    const count = countMap[cell.key] ?? 0;
    const label = habit
      ? (count ? '✓ Completed' : 'Not done')
      : `${count} / ${totalHabits} habit${totalHabits !== 1 ? 's' : ''}`;
    setTooltip({
      text: `${formatShortDate(cell.date)} — ${label}`,
      x: e.clientX,
      y: e.clientY,
    });
  }

  function handleMouseMove(e: React.MouseEvent) {
    setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
  }

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      {/* Month labels */}
      {!compact && (
        <div className={styles.monthRow} style={{ '--weeks': maxWeek } as React.CSSProperties}>
          <div className={styles.dayLabelSpacer} />
          {monthLabels.map((ml) => (
            <span
              key={`${ml.month}-${ml.weekIndex}`}
              className={styles.monthLabel}
              style={{ gridColumn: ml.weekIndex + 1 }}
            >
              {ml.month}
            </span>
          ))}
        </div>
      )}

      <div className={styles.gridArea}>
        {/* Day-of-week labels */}
        {!compact && (
          <div className={styles.dayLabels}>
            {DAY_LABELS.map((d, i) => (
              <span key={i} className={styles.dayLabel}>{i % 2 === 1 ? d : ''}</span>
            ))}
          </div>
        )}

        {/* The heatmap grid */}
        <div
          className={styles.grid}
          style={{ '--weeks': maxWeek } as React.CSSProperties}
          onMouseLeave={() => setTooltip(null)}
          onMouseMove={handleMouseMove}
        >
          {cells.map((cell) => {
            const isSelected = selectedDate === cell.key;
            return (
              <div
                key={cell.key}
                className={`${styles.cell} ${styles[`level${level(cell.key)}`]} ${cell.isToday ? styles.today : ''} ${cell.key > today ? styles.future : ''} ${isSelected ? styles.selected : ''}`}
                style={{ gridColumn: cell.weekIndex + 1, gridRow: cell.dayOfWeek + 1 }}
                onMouseEnter={(e) => handleMouseEnter(e, cell)}
                onClick={() => onDayClick?.(cell.key)}
                aria-label={`${cell.key}: ${countMap[cell.key] ?? 0} completed`}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {!compact && (
        <div className={styles.legend}>
          <span className={styles.legendLabel}>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`${styles.cell} ${styles[`level${l}`]} ${styles.legendCell}`} />
          ))}
          <span className={styles.legendLabel}>More</span>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
