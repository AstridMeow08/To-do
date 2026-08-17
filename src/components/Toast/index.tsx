import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div className={`${styles.toast} ${visible ? styles.show : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
