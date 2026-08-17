import styles from './Header.module.css';
import { formatDate } from '../../utils/dateUtils';

interface HeaderProps {
  onAdd: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ onAdd, theme, onToggleTheme }: HeaderProps) {
  const isDark = theme === 'dark';

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <img src="/logo.jpg" alt="Habits Logo" className={styles.logoImage} />
        </div>
        <div>
          <div className={styles.logoText}>Habit Tracker</div>
          <div className={styles.logoSub}>{formatDate(new Date())}</div>
        </div>
      </div>

      <div className={styles.headerRight}>
        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? (
            /* Sun icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          )}
        </button>

        {/* Add habit */}
        <button className="btn btn-primary" onClick={onAdd} id="add-habit-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Habit
        </button>
      </div>
    </header>
  );
}
