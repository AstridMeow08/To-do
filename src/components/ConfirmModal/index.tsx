import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmModal.module.css';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Close on Escape or confirm on Enter
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const renderIcon = () => {
    if (variant === 'danger') {
      return (
        <div className={`${styles.iconWrap} ${styles.dangerIcon}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className={`${styles.iconWrap} ${styles.warningIcon}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      );
    }
    return (
      <div className={`${styles.iconWrap} ${styles.primaryIcon}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
    );
  };

  const confirmBtnClass = variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary';

  return createPortal(
    <div
      className={`${styles.backdrop} ${open ? styles.open : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className={styles.modal} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
        {renderIcon()}

        <h3 className={styles.title} id="confirm-title">
          {title}
        </h3>
        <p className={styles.message} id="confirm-desc">
          {message}
        </p>

        <div className={styles.actions}>
          <button type="button" className="btn btn-glass" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={confirmBtnClass} onClick={onConfirm} autoFocus>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
