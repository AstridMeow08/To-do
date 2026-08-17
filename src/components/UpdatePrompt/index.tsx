import styles from './UpdatePrompt.module.css';

interface UpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
  visible: boolean;
}

export function UpdatePrompt({ onUpdate, onDismiss, visible }: UpdatePromptProps) {
  if (!visible) return null;
  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <span className={styles.text}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        New version available!
      </span>
      <div className={styles.actions}>
        <button className={styles.updateBtn} onClick={onUpdate}>Update</button>
        <button className={styles.dismissBtn} onClick={onDismiss}>Later</button>
      </div>
    </div>
  );
}
