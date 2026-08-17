import { useMemo, useState } from 'react';
import type { Habit } from '../../types/habit';
import { todayKey, getStreak, buildHeatmapGrid, formatShortDate } from '../../utils/dateUtils';
import { COLORS } from '../../constants/colors';
import { ICON_PATHS } from '../../constants/icons';
import { ContributionGraph } from '../ContributionGraph';
import styles from './Dashboard.module.css';

interface Props {
  habits: Habit[];
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={styles.statTile}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

export function Dashboard({ habits }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = todayKey();
  const cells = useMemo(() => buildHeatmapGrid(), []);

  const timelineHabits = useMemo(() => {
    if (!selectedDate) return [];
    return [...habits]
      .filter(h => h.completions[selectedDate])
      .sort((a, b) => (a.timeFrom || '23:59').localeCompare(b.timeFrom || '23:59'));
  }, [habits, selectedDate]);

  // Global stats
  const totalHabits = habits.length;
  const doneToday = habits.filter((h) => h.completions[today]).length;
  const rateToday = totalHabits === 0 ? 0 : Math.round((doneToday / totalHabits) * 100);
  const bestStreak = habits.reduce((best, h) => Math.max(best, getStreak(h.completions)), 0);

  // Total completions across all time
  const totalCompletions = useMemo(
    () => habits.reduce((sum, h) => sum + Object.values(h.completions).filter(Boolean).length, 0),
    [habits]
  );

  // Best single day (most habits done)
  const bestDay = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        if (v) countMap[k] = (countMap[k] ?? 0) + 1;
      }
    }
    let best = { key: '', count: 0 };
    for (const [k, v] of Object.entries(countMap)) {
      if (v > best.count) best = { key: k, count: v };
    }
    return best;
  }, [habits]);

  // Active days (any habit done)
  const activeDays = useMemo(() => {
    const days = new Set<string>();
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        if (v) days.add(k);
      }
    }
    return days.size;
  }, [habits]);

  // Per-habit: longest streak
  const habitStats = useMemo(
    () =>
      habits.map((h) => ({
        habit: h,
        streak: getStreak(h.completions),
        total: Object.values(h.completions).filter(Boolean).length,
        doneToday: !!h.completions[today],
      })),
    [habits, today]
  );

  // Find longest streak across all 364 days worth of cells
  const cellKeys = new Set(cells.map((c) => c.key));
  const activeInWindow = useMemo(() => {
    const days = new Set<string>();
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        if (v && cellKeys.has(k)) days.add(k);
      }
    }
    return days.size;
  }, [habits, cellKeys]);

  if (habits.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <p className={styles.emptyText}>Add habits to see your contribution dashboard</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>

      {/* ── Global Stats ── */}
      <div className={styles.statsRow}>
        <StatTile label="Total Habits" value={totalHabits} />
        <StatTile label="Done Today" value={`${doneToday}/${totalHabits}`} sub={`${rateToday}%`} />
        <StatTile label="Best Streak" value={`${bestStreak}d`} sub="consecutive" />
        <StatTile label="All-time Completions" value={totalCompletions} />
        <StatTile label="Active Days" value={activeDays} sub="all time" />
        <StatTile label="Best Day" value={bestDay.count > 0 ? `${bestDay.count} habits` : '—'} sub={bestDay.key || ''} />
        <StatTile label="Active (year)" value={activeInWindow} sub="last 52 weeks" />
      </div>

      {/* ── Overall Heatmap ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Overall Activity</h2>
          <span className={styles.sectionSub}>{totalCompletions} completions in the last year</span>
        </div>
        <div className={styles.graphCard}>
          <ContributionGraph 
            habits={habits} 
            onDayClick={(date) => setSelectedDate(date)}
            selectedDate={selectedDate}
          />
        </div>

        {selectedDate && (
          <div className={styles.timelineCard}>
            <div className={styles.timelineTitle}>
              <span>Activity on {formatShortDate(new Date(selectedDate + 'T12:00:00'))}</span>
              <button className={styles.timelineClose} onClick={() => setSelectedDate(null)} aria-label="Close timeline">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className={styles.timelineList}>
              {timelineHabits.length === 0 ? (
                <div className={styles.timelineEmpty}>No habits completed on this day.</div>
              ) : (
                timelineHabits.map(habit => {
                  const color = COLORS[habit.colorIdx] ?? COLORS[0];
                  const iconPath = ICON_PATHS[habit.iconIdx] ?? ICON_PATHS[0];
                  
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
                    <div key={habit.id} className={styles.timelineItem}>
                      <div className={styles.timelineIcon} style={{ background: color.bg }}>
                        <svg
                          width="16" height="16" viewBox="0 0 24 24"
                          fill="none" stroke={color.icon}
                          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                          dangerouslySetInnerHTML={{ __html: iconPath }}
                        />
                      </div>
                      <div className={styles.timelineDetails}>
                        <div className={styles.timelineHeader}>
                          <div className={styles.timelineName}>{habit.name}</div>
                          {formattedTime && <div className={styles.timelineTime}>{formattedTime}</div>}
                        </div>
                        {habit.desc && <div className={styles.timelineDesc}>{habit.desc}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Per-Habit Rows ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Per-Habit Contributions</h2>
        </div>
        <div className={styles.habitRows}>
          {habitStats.map(({ habit, streak, total, doneToday: done }) => {
            const color = COLORS[habit.colorIdx] ?? COLORS[0];
            const iconPath = ICON_PATHS[habit.iconIdx] ?? ICON_PATHS[0];
            return (
              <div key={habit.id} className={styles.habitRow}>
                <div className={styles.habitRowMeta}>
                  <div
                    className={styles.habitIcon}
                    style={{ background: color.bg }}
                  >
                    <svg
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke={color.icon}
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: iconPath }}
                    />
                  </div>
                  <div className={styles.habitRowInfo}>
                    <span className={styles.habitRowName}>{habit.name}</span>
                    <span className={styles.habitRowStats}>
                      {streak > 0 && <span className={styles.streakPill}>🔥 {streak}d streak</span>}
                      <span className={styles.totalPill}>{total} done</span>
                      {done && <span className={styles.todayPill}>✓ today</span>}
                    </span>
                  </div>
                </div>
                <div className={styles.habitGraphWrap}>
                  <ContributionGraph habits={habits} habit={habit} compact />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
