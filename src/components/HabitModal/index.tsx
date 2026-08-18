import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Habit, HabitFormData } from '../../types/habit';
import { IconPicker } from '../IconPicker';
import { ColorPicker } from '../ColorPicker';
import { TimePicker } from '../TimePicker';
import { todayKey } from '../../utils/dateUtils';
import styles from './HabitModal.module.css';

interface HabitModalProps {
  open: boolean;
  editing: Habit | null;
  onClose: () => void;
  onSave: (data: HabitFormData) => void;
}

const DEFAULT_FORM: HabitFormData = { 
  name: '', desc: '', colorIdx: 0, iconIdx: 0, timeFrom: '', timeTo: '', 
  startDate: todayKey(), frequency: 'everyday' 
};

export function HabitModal({ open, editing, onClose, onSave }: HabitModalProps) {
  const [form, setForm] = useState<HabitFormData>(DEFAULT_FORM);
  const nameRef = useRef<HTMLInputElement>(null);

  // Sync form when opening
  useEffect(() => {
    if (open) {
      setForm(editing
        ? { 
            name: editing.name, desc: editing.desc, colorIdx: editing.colorIdx, 
            iconIdx: editing.iconIdx, timeFrom: editing.timeFrom || '', timeTo: editing.timeTo || '',
            startDate: editing.startDate || todayKey(), frequency: editing.frequency || 'everyday'
          }
        : { ...DEFAULT_FORM, startDate: todayKey() }
      );
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, editing]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim(), desc: form.desc.trim() });
  }

  if (!open) return null;

  return createPortal(
    <div
      className={`${styles.backdrop} ${open ? styles.open : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Modal header */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle} id="modal-title">
            {editing ? 'Edit Habit' : 'Add New Habit'}
          </span>
          <button className="btn btn-glass btn-icon" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="habit-name">Habit Name</label>
            <input
              ref={nameRef}
              id="habit-name"
              className={styles.formInput}
              type="text"
              placeholder="e.g. Morning Walk"
              maxLength={50}
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="habit-desc">Description (optional)</label>
            <textarea
              id="habit-desc"
              className={styles.formInput}
              placeholder="Brief note about this habit..."
              maxLength={120}
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            />
          </div>

          {/* Time Picker */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Schedule & Reminder (optional)</label>
            <TimePicker
              timeFrom={form.timeFrom}
              timeTo={form.timeTo}
              onChange={({ timeFrom, timeTo }) => setForm((f) => ({ ...f, timeFrom, timeTo }))}
            />
          </div>

          {/* Start Date */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="habit-startDate">Start Date</label>
            <input
              id="habit-startDate"
              className={styles.formInput}
              type="date"
              required
              value={form.startDate || ''}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>

          {/* Frequency */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="habit-frequency">Frequency</label>
            <select
              id="habit-frequency"
              className={styles.formInput}
              value={form.frequency || 'everyday'}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as any }))}
            >
              <option value="everyday">Every Day</option>
              <option value="weekdays">Weekdays (Mon-Fri)</option>
              <option value="weekends">Weekends (Sat-Sun)</option>
            </select>
          </div>

          {/* Icon picker */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Icon</label>
            <IconPicker
              selected={form.iconIdx}
              onChange={(idx) => setForm((f) => ({ ...f, iconIdx: idx }))}
            />
          </div>

          {/* Color picker */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Color</label>
            <ColorPicker
              selected={form.colorIdx}
              onChange={(idx) => setForm((f) => ({ ...f, colorIdx: idx }))}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-glass" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save Changes' : 'Add Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
