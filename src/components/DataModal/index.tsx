import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Habit } from '../../types/habit';
import { exportBoth, exportToJson, exportToCsv, parseImportFile } from '../../utils/dataManager';
import { ConfirmModal } from '../ConfirmModal';
import styles from './DataModal.module.css';

interface DataModalProps {
  open: boolean;
  habits: Habit[];
  onClose: () => void;
  onImport: (importedHabits: Habit[], mode: 'merge' | 'replace') => void;
}

interface ParsedFileInfo {
  fileName: string;
  format: 'json' | 'csv';
  habits: Habit[];
  totalCompletions: number;
}

export function DataModal({ open, habits, onClose, onImport }: DataModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<ParsedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset states on open/close
  useEffect(() => {
    if (!open) {
      setParsedInfo(null);
      setError(null);
      setReplaceConfirmOpen(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !replaceConfirmOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, replaceConfirmOpen]);

  if (!open) return null;

  const handleFileProcess = async (file: File) => {
    setError(null);
    try {
      const { habits: loadedHabits, format } = await parseImportFile(file);
      const totalCompletions = loadedHabits.reduce(
        (acc, h) => acc + Object.values(h.completions || {}).filter(Boolean).length,
        0
      );
      setParsedInfo({
        fileName: file.name,
        format,
        habits: loadedHabits,
        totalCompletions,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to read file. Please ensure it is a valid JSON or CSV file.';
      setError(msg);
      setParsedInfo(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input value so re-uploading same file works
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyImport = (mode: 'merge' | 'replace') => {
    if (!parsedInfo) return;
    if (mode === 'replace') {
      setReplaceConfirmOpen(true);
      return;
    }
    onImport(parsedInfo.habits, 'merge');
    onClose();
  };

  const handleConfirmReplace = () => {
    if (parsedInfo) {
      onImport(parsedInfo.habits, 'replace');
      setReplaceConfirmOpen(false);
      onClose();
    }
  };

  return createPortal(
    <div
      className={`${styles.backdrop} ${open ? styles.open : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="data-modal-title">
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle} id="data-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Data Backup & Export
          </div>
          <button className="btn btn-glass btn-icon" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Export Section ── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Export Habits
          </div>
          <p className={styles.sectionDesc}>
            Download a full backup of all your habits, streaks, schedules, and completion logs.
          </p>

          <div className={styles.exportBtnGroup}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => exportBoth(habits)}
              disabled={habits.length === 0}
              title="Download both JSON backup and Excel/CSV report"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Both (JSON & CSV)
            </button>

            <div className={styles.individualExportRow}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => exportToJson(habits)}
                disabled={habits.length === 0}
              >
                JSON Backup (.json)
              </button>
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => exportToCsv(habits)}
                disabled={habits.length === 0}
              >
                Excel Report (.csv)
              </button>
            </div>
          </div>
        </div>

        {/* ── Import Section ── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import Habits (JSON or CSV)
          </div>
          <p className={styles.sectionDesc}>
            Restore your habits from a JSON backup file or CSV spreadsheet report.
          </p>

          {!parsedInfo ? (
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropzoneIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
              </div>
              <div className={styles.dropzoneText}>Click or drag & drop backup file</div>
              <div className={styles.dropzoneSub}>Supports .json and .csv files</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,application/json,text/csv"
                className={styles.hiddenInput}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.fileName}>{parsedInfo.fileName}</span>
                <span className={styles.formatBadge}>{parsedInfo.format}</span>
              </div>
              <div className={styles.previewStats}>
                <div className={styles.statItem}>
                  <span>Habits:</span>
                  <strong>{parsedInfo.habits.length}</strong>
                </div>
                <div className={styles.statItem}>
                  <span>Completions:</span>
                  <strong>{parsedInfo.totalCompletions}</strong>
                </div>
              </div>
              <div className={styles.importActions}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApplyImport('merge')}
                  title="Keeps current habits and merges imported data"
                >
                  ✓ Merge with Existing
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleApplyImport('replace')}
                  title="Overwrites all current habits"
                >
                  Replace All Data
                </button>
                <button
                  type="button"
                  className="btn btn-glass"
                  onClick={() => setParsedInfo(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={replaceConfirmOpen}
        title="Replace All Habits?"
        message="This will overwrite all current habits and streak records with the imported file. This action cannot be undone."
        confirmText="Replace All Data"
        cancelText="Keep Current Data"
        variant="danger"
        onConfirm={handleConfirmReplace}
        onCancel={() => setReplaceConfirmOpen(false)}
      />
    </div>,
    document.body
  );
}
