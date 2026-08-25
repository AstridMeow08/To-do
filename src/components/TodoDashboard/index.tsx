import { useMemo, useState } from 'react';
import type { Todo } from '../../types/todo';
import { buildMonthGrid, MONTH_NAMES, todayKey } from '../../utils/dateUtils';
import styles from './TodoDashboard.module.css';

interface Props {
  todos: Todo[];
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

export function TodoDashboard({ todos }: Props) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const today = todayKey();

  // Metrics (All Time)
  const totalCreated = todos.length;
  const completedTodos = todos.filter(t => t.completed);
  const totalCompleted = completedTodos.length;
  const totalPending = totalCreated - totalCompleted;

  const todayCompleted = completedTodos.filter(t => {
    if (!t.completedAt) return false;
    const dateStr = new Date(t.completedAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return dateStr === today;
  }).length;

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

  // Available years based on completed tasks
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    for (const t of completedTodos) {
      if (t.completedAt) {
        const y = new Date(t.completedAt).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [completedTodos, currentYear]);

  // Build heatmap countMap (dateKey -> number of todos completed)
  const countMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of completedTodos) {
      if (t.completedAt) {
        const dateKey = new Date(t.completedAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        map[dateKey] = (map[dateKey] ?? 0) + 1;
      }
    }
    return map;
  }, [completedTodos]);

  const maxDailyCompletions = useMemo(() => {
    const counts = Object.values(countMap);
    return counts.length > 0 ? Math.max(...counts) : 1;
  }, [countMap]);

  // Shade level 0-4
  function getShadeLevel(key: string): number {
    const count = countMap[key] ?? 0;
    if (count === 0) return 0;
    const ratio = count / maxDailyCompletions;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  // Cells for the selected month calendar
  const monthCells = useMemo(
    () => buildMonthGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsRow}>
        <StatTile label="Total Tasks" value={totalCreated} sub="created all time" />
        <StatTile label="Pending Tasks" value={totalPending} sub="waiting to be done" />
        <StatTile label="Completed Tasks" value={totalCompleted} sub="finished all time" />
        <StatTile label="Done Today" value={todayCompleted} sub="tasks checked off today" />
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Task Completion History</h2>
        </div>
        
        <div className={styles.graphCard}>
          <div className={styles.controlBar}>
            <div className={styles.selectorGroup}>
              <button className={styles.navArrowBtn} onClick={handlePrevMonth}>‹</button>
              <select
                className={styles.selectDropdown}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              >
                {MONTH_NAMES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
              </select>
              <select
                className={styles.selectDropdown}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              >
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className={styles.navArrowBtn} onClick={handleNextMonth}>›</button>

              {!isCurrentMonthSelected && (
                <button className={styles.todayBtn} onClick={handleGoToCurrentMonth}>This Month</button>
              )}
            </div>
          </div>

          <div className={styles.monthCalendarHeader}>
            {DAY_LETTERS.map((d) => (
              <div key={d} className={styles.monthDayHeader}>{d}</div>
            ))}
          </div>

          <div className={styles.monthCalendarGrid}>
            {monthCells.map((cell) => {
              const count = countMap[cell.key] ?? 0;
              const shadeLevel = getShadeLevel(cell.key);

              return (
                <div
                  key={cell.key}
                  className={`
                    ${styles.monthCell}
                    ${styles[`level${shadeLevel}`]}
                    ${!cell.isCurrentMonth ? styles.otherMonth : ''}
                    ${cell.isFuture ? styles.futureDay : ''}
                    ${cell.isToday ? styles.todayCell : ''}
                  `}
                  title={`${cell.key}: ${count} task(s) completed`}
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

          <div className={styles.legend}>
            <span className={styles.legendLabel}>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <div key={l} className={`${styles.legendBox} ${styles[`level${l}`]}`} />
            ))}
            <span className={styles.legendLabel}>More</span>
          </div>
        </div>
      </section>
    </div>
  );
}
