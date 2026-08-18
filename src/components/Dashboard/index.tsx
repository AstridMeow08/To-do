import { useMemo, useState } from 'react';
import type { Habit } from '../../types/habit';
import {
  todayKey,
  getStreak,
  buildHeatmapGrid,
  buildMonthGrid,
  formatShortDate,
  formatTime12Hour,
  MONTH_NAMES,
} from '../../utils/dateUtils';
import { COLORS } from '../../constants/colors';
import { ICON_PATHS } from '../../constants/icons';
import { ContributionGraph } from '../ContributionGraph';
import styles from './Dashboard.module.css';

interface Props {
  habits: Habit[];
}

const DAY_LETTERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const today = todayKey();

  // Available years list based on completions + current year
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    for (const h of habits) {
      for (const k of Object.keys(h.completions)) {
        const y = parseInt(k.slice(0, 4), 10);
        if (!isNaN(y)) years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [habits, currentYear]);

  // Cells for the 52-week full-year heatmap
  const fullYearCells = useMemo(() => buildHeatmapGrid(), []);
  const cellKeys = useMemo(() => new Set(fullYearCells.map((c) => c.key)), [fullYearCells]);

  // Cells for the selected month calendar
  const monthCells = useMemo(
    () => buildMonthGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleGoToCurrentMonth = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  };

  const isCurrentMonthSelected = selectedYear === currentYear && selectedMonth === currentMonth;

  // Global map: dateKey -> count of completed habits
  const countMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        if (v) map[k] = (map[k] ?? 0) + 1;
      }
    }
    return map;
  }, [habits]);

  // Timeline habits for selectedDate
  const timelineHabits = useMemo(() => {
    if (!selectedDate) return [];
    return [...habits]
      .filter((h) => h.completions[selectedDate])
      .sort((a, b) => (a.timeFrom || '23:59').localeCompare(b.timeFrom || '23:59'));
  }, [habits, selectedDate]);

  // Total days in selected month
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const selectedMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Month-scoped completions
  const monthCompletionsCount = useMemo(() => {
    let count = 0;
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        if (v && k.startsWith(selectedMonthPrefix)) count++;
      }
    }
    return count;
  }, [habits, selectedMonthPrefix]);

  // Month-scoped active days (at least 1 habit completed on that day)
  const monthActiveDays = useMemo(() => {
    const days = new Set<string>();
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        if (v && k.startsWith(selectedMonthPrefix)) days.add(k);
      }
    }
    return days.size;
  }, [habits, selectedMonthPrefix]);

  // Month completion rate (%)
  const totalHabits = habits.length;
  const daysToCountInRate = isCurrentMonthSelected ? Math.min(now.getDate(), daysInSelectedMonth) : daysInSelectedMonth;
  const possibleMonthCompletions = totalHabits * daysToCountInRate;
  const monthCompletionRate = possibleMonthCompletions === 0 ? 0 : Math.min(100, Math.round((monthCompletionsCount / possibleMonthCompletions) * 100));

  // Global summary stats
  const doneToday = habits.filter((h) => h.completions[today]).length;
  const rateToday = totalHabits === 0 ? 0 : Math.round((doneToday / totalHabits) * 100);
  const bestStreak = habits.reduce((best, h) => Math.max(best, getStreak(h.completions)), 0);
  const totalAllTimeCompletions = useMemo(
    () => habits.reduce((sum, h) => sum + Object.values(h.completions).filter(Boolean).length, 0),
    [habits]
  );

  // Active days in 52-week window
  const activeInWindow = useMemo(() => {
    const days = new Set<string>();
    for (const h of habits) {
      for (const [k, v] of Object.entries(h.completions)) {
        if (v && cellKeys.has(k)) days.add(k);
      }
    }
    return days.size;
  }, [habits, cellKeys]);

  // Per-habit statistics
  const habitStats = useMemo(
    () =>
      habits.map((h) => {
        let monthDone = 0;
        for (const [k, v] of Object.entries(h.completions)) {
          if (v && k.startsWith(selectedMonthPrefix)) monthDone++;
        }
        const monthPct = daysInSelectedMonth === 0 ? 0 : Math.round((monthDone / daysInSelectedMonth) * 100);

        return {
          habit: h,
          streak: getStreak(h.completions),
          total: Object.values(h.completions).filter(Boolean).length,
          doneToday: !!h.completions[today],
          monthDone,
          monthPct,
        };
      }),
    [habits, selectedMonthPrefix, daysInSelectedMonth, today]
  );

  // Shade level calculation (0 to 4)
  const getShadeLevel = (dateKey: string): number => {
    const count = countMap[dateKey] ?? 0;
    if (count === 0 || totalHabits === 0) return 0;
    const ratio = count / totalHabits;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

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

      {/* ── Month / Year Control Bar ── */}
      <div className={styles.controlBar}>
        <div className={styles.selectorGroup}>
          <button
            type="button"
            className={styles.navArrowBtn}
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            title="Previous Month"
          >
            ‹
          </button>

          {/* Month Dropdown */}
          <select
            className={styles.selectDropdown}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            aria-label="Select Month"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            className={styles.selectDropdown}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            aria-label="Select Year"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={styles.navArrowBtn}
            onClick={handleNextMonth}
            aria-label="Next Month"
            title="Next Month"
          >
            ›
          </button>

          {!isCurrentMonthSelected && (
            <button
              type="button"
              className={styles.todayBtn}
              onClick={handleGoToCurrentMonth}
            >
              This Month
            </button>
          )}
        </div>

        {/* View Switcher: Month vs Full Year */}
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'month' ? styles.activeView : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month View
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'year' ? styles.activeView : ''}`}
            onClick={() => setViewMode('year')}
          >
            Year Overview
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className={styles.statsRow}>
        <StatTile
          label="Month Completions"
          value={monthCompletionsCount}
          sub={`${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
        />
        <StatTile
          label="Active Days"
          value={`${monthActiveDays}/${daysInSelectedMonth}`}
          sub="in selected month"
        />
        <StatTile
          label="Monthly Rate"
          value={`${monthCompletionRate}%`}
          sub="of possible habits"
        />
        <StatTile
          label="Done Today"
          value={`${doneToday}/${totalHabits}`}
          sub={`${rateToday}% today`}
        />
        <StatTile
          label="Best Streak"
          value={`${bestStreak}d`}
          sub="consecutive"
        />
        <StatTile
          label="All-time Done"
          value={totalAllTimeCompletions}
          sub="completions"
        />
      </div>

      {/* ── Main Activity Visualizer ── */}
      {viewMode === 'month' ? (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              {MONTH_NAMES[selectedMonth]} {selectedYear} Activity
            </h2>
            <span className={styles.sectionSub}>
              {monthCompletionsCount} completions • Click any date to view timeline
            </span>
          </div>

          <div className={styles.monthCard}>
            {/* Day Header Row */}
            <div className={styles.monthCalendarHeader}>
              {DAY_LETTERS.map((d) => (
                <div key={d} className={styles.monthDayHeader}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Matrix */}
            <div className={styles.monthCalendarGrid}>
              {monthCells.map((cell) => {
                const count = countMap[cell.key] ?? 0;
                const shadeLevel = getShadeLevel(cell.key);
                const isSelected = selectedDate === cell.key;

                return (
                  <div
                    key={cell.key}
                    className={`
                      ${styles.monthCell}
                      ${styles[`level${shadeLevel}`]}
                      ${!cell.isCurrentMonth ? styles.otherMonth : ''}
                      ${cell.isFuture ? styles.futureDay : ''}
                      ${cell.isToday ? styles.todayCell : ''}
                      ${isSelected ? styles.selectedCell : ''}
                    `}
                    onClick={() => setSelectedDate(cell.key)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${cell.key}: ${count} habits completed`}
                  >
                    <span className={styles.monthCellDayNum}>{cell.dayNumber}</span>
                    {cell.isCurrentMonth && count > 0 && (
                      <span className={styles.monthCellCount}>
                        {count}✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className={styles.calendarLegend}>
              <span className={styles.legendLabel}>Less</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`${styles.legendBox} ${styles[`level${lvl}`]}`}
                />
              ))}
              <span className={styles.legendLabel}>More</span>
            </div>
          </div>

          {/* Timeline when date selected */}
          {selectedDate && (
            <div className={styles.timelineCard}>
              <div className={styles.timelineTitle}>
                <span>Activity on {formatShortDate(new Date(selectedDate + 'T12:00:00'))}</span>
                <button
                  className={styles.timelineClose}
                  onClick={() => setSelectedDate(null)}
                  aria-label="Close timeline"
                >
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
                  timelineHabits.map((habit) => {
                    const color = COLORS[habit.colorIdx] ?? COLORS[0];
                    const iconPath = ICON_PATHS[habit.iconIdx] ?? ICON_PATHS[0];

                    const formattedTime = (habit.timeFrom || habit.timeTo)
                      ? [formatTime12Hour(habit.timeFrom), formatTime12Hour(habit.timeTo)].filter(Boolean).join(' – ')
                      : null;

                    return (
                      <div key={habit.id} className={styles.timelineItem}>
                        <div className={styles.timelineIcon} style={{ background: color.bg }}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={color.icon}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dangerouslySetInnerHTML={{ __html: iconPath }}
                          />
                        </div>
                        <div className={styles.timelineDetails}>
                          <div className={styles.timelineHeader}>
                            <div className={styles.timelineName}>{habit.name}</div>
                            {formattedTime && <div className={styles.timelineTime}>⏰ {formattedTime}</div>}
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
      ) : (
        /* Year Overview View (52 weeks) */
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Full Year Overview (52 Weeks)</h2>
            <span className={styles.sectionSub}>{activeInWindow} active days in the last year</span>
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
                <button
                  className={styles.timelineClose}
                  onClick={() => setSelectedDate(null)}
                  aria-label="Close timeline"
                >
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
                  timelineHabits.map((habit) => {
                    const color = COLORS[habit.colorIdx] ?? COLORS[0];
                    const iconPath = ICON_PATHS[habit.iconIdx] ?? ICON_PATHS[0];

                    const formattedTime = (habit.timeFrom || habit.timeTo)
                      ? [formatTime12Hour(habit.timeFrom), formatTime12Hour(habit.timeTo)].filter(Boolean).join(' – ')
                      : null;

                    return (
                      <div key={habit.id} className={styles.timelineItem}>
                        <div className={styles.timelineIcon} style={{ background: color.bg }}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={color.icon}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            dangerouslySetInnerHTML={{ __html: iconPath }}
                          />
                        </div>
                        <div className={styles.timelineDetails}>
                          <div className={styles.timelineHeader}>
                            <div className={styles.timelineName}>{habit.name}</div>
                            {formattedTime && <div className={styles.timelineTime}>⏰ {formattedTime}</div>}
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
      )}

      {/* ── Per-Habit Breakdown ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            Habit Consistency ({MONTH_NAMES[selectedMonth]} {selectedYear})
          </h2>
        </div>
        <div className={styles.habitRows}>
          {habitStats.map(({ habit, streak, total, doneToday: done, monthDone, monthPct }) => {
            const color = COLORS[habit.colorIdx] ?? COLORS[0];
            const iconPath = ICON_PATHS[habit.iconIdx] ?? ICON_PATHS[0];

            return (
              <div key={habit.id} className={styles.habitRow}>
                <div className={styles.habitRowMeta}>
                  <div className={styles.habitIcon} style={{ background: color.bg }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={color.icon}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: iconPath }}
                    />
                  </div>
                  <div className={styles.habitRowInfo}>
                    <span className={styles.habitRowName}>{habit.name}</span>
                    <span className={styles.habitRowStats}>
                      {streak > 0 && <span className={styles.streakPill}>🔥 {streak}d streak</span>}
                      <span className={styles.totalPill}>{total} total</span>
                      {done && <span className={styles.todayPill}>✓ today</span>}
                    </span>
                  </div>
                </div>

                {viewMode === 'month' ? (
                  /* Monthly Progress Bar */
                  <div className={styles.habitProgressWrap}>
                    <div className={styles.habitProgressTop}>
                      <span>{monthDone} / {daysInSelectedMonth} days completed</span>
                      <span className={styles.habitProgressRate}>{monthPct}%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${monthPct}%`,
                          backgroundColor: color.swatch || 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Mini Heatmap for Year Overview */
                  <div className={styles.habitGraphWrap}>
                    <ContributionGraph habits={habits} habit={habit} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
