import { useState, useEffect } from 'react';
import { formatTime12Hour, parseTimeTo12Hour, to24HourString } from '../../utils/dateUtils';
import styles from './TimePicker.module.css';

interface TimePickerProps {
  timeFrom?: string;
  timeTo?: string;
  onChange: (times: { timeFrom?: string; timeTo?: string }) => void;
}

const PRESETS = [
  { label: '🌅 Morning', from: '08:00', to: '09:00' },
  { label: '☀️ Afternoon', from: '13:00', to: '14:00' },
  { label: '🌆 Evening', from: '18:00', to: '19:00' },
  { label: '🌙 Night', from: '21:00', to: '22:00' },
];

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function TimePicker({ timeFrom = '', timeTo = '', onChange }: TimePickerProps) {
  const [showRange, setShowRange] = useState<boolean>(!!timeTo);

  // Sync range checkbox if external timeTo appears
  useEffect(() => {
    if (timeTo) setShowRange(true);
  }, [timeTo]);

  const parsedFrom = parseTimeTo12Hour(timeFrom) || { hour: 8, minute: 0, ampm: 'AM' as const };
  const parsedTo = parseTimeTo12Hour(timeTo) || { hour: 9, minute: 0, ampm: 'AM' as const };

  const handlePreset = (p: typeof PRESETS[0]) => {
    onChange({
      timeFrom: p.from,
      timeTo: showRange ? p.to : undefined,
    });
  };

  const handleClear = () => {
    onChange({ timeFrom: undefined, timeTo: undefined });
  };

  const updateFrom = (h: number, m: number, ampm: 'AM' | 'PM') => {
    const fromStr = to24HourString(h, m, ampm);
    onChange({
      timeFrom: fromStr,
      timeTo: showRange ? timeTo : undefined,
    });
  };

  const updateTo = (h: number, m: number, ampm: 'AM' | 'PM') => {
    const toStr = to24HourString(h, m, ampm);
    onChange({
      timeFrom: timeFrom || '08:00',
      timeTo: toStr,
    });
  };

  const handleRangeToggle = (checked: boolean) => {
    setShowRange(checked);
    if (!checked) {
      onChange({ timeFrom, timeTo: undefined });
    } else if (!timeTo && timeFrom) {
      // Auto-set To time 1 hour after From time
      const p = parseTimeTo12Hour(timeFrom);
      if (p) {
        const nextHour = (p.hour % 12) + 1;
        const nextAmpm = p.hour === 11 ? (p.ampm === 'AM' ? 'PM' : 'AM') : p.ampm;
        onChange({ timeFrom, timeTo: to24HourString(nextHour, p.minute, nextAmpm) });
      }
    }
  };

  const isPresetActive = (p: typeof PRESETS[0]) => {
    return timeFrom === p.from && (!showRange || timeTo === p.to);
  };

  const formattedPreview = timeFrom
    ? (timeTo && showRange ? `${formatTime12Hour(timeFrom)} – ${formatTime12Hour(timeTo)}` : formatTime12Hour(timeFrom))
    : 'Anytime (No reminder)';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.preview}>
          <span className={styles.previewIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <span>{formattedPreview}</span>
        </div>
        {timeFrom && (
          <button type="button" className={styles.clearBtn} onClick={handleClear}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className={styles.presets}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`${styles.presetBtn} ${isPresetActive(p) ? styles.active : ''}`}
            onClick={() => handlePreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Time Pickers */}
      <div className={styles.pickersRow}>
        <div className={styles.timeField}>
          <span className={styles.fieldLabel}>{showRange ? 'Start Time' : 'Reminder Time'}</span>
          <div className={styles.selectGroup}>
            <select
              className={styles.selectInput}
              aria-label="Start Hour"
              value={parsedFrom.hour}
              onChange={(e) => updateFrom(parseInt(e.target.value, 10), parsedFrom.minute, parsedFrom.ampm)}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className={styles.colon}>:</span>
            <select
              className={styles.selectInput}
              aria-label="Start Minute"
              value={String(parsedFrom.minute).padStart(2, '0')}
              onChange={(e) => updateFrom(parsedFrom.hour, parseInt(e.target.value, 10), parsedFrom.ampm)}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <div className={styles.ampmToggle}>
              <button
                type="button"
                className={`${styles.ampmBtn} ${parsedFrom.ampm === 'AM' ? styles.selected : ''}`}
                onClick={() => updateFrom(parsedFrom.hour, parsedFrom.minute, 'AM')}
              >
                AM
              </button>
              <button
                type="button"
                className={`${styles.ampmBtn} ${parsedFrom.ampm === 'PM' ? styles.selected : ''}`}
                onClick={() => updateFrom(parsedFrom.hour, parsedFrom.minute, 'PM')}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {showRange && (
          <div className={styles.timeField}>
            <span className={styles.fieldLabel}>End Time</span>
            <div className={styles.selectGroup}>
              <select
                className={styles.selectInput}
                aria-label="End Hour"
                value={parsedTo.hour}
                onChange={(e) => updateTo(parseInt(e.target.value, 10), parsedTo.minute, parsedTo.ampm)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className={styles.colon}>:</span>
              <select
                className={styles.selectInput}
                aria-label="End Minute"
                value={String(parsedTo.minute).padStart(2, '0')}
                onChange={(e) => updateTo(parsedTo.hour, parseInt(e.target.value, 10), parsedTo.ampm)}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className={styles.ampmToggle}>
                <button
                  type="button"
                  className={`${styles.ampmBtn} ${parsedTo.ampm === 'AM' ? styles.selected : ''}`}
                  onClick={() => updateTo(parsedTo.hour, parsedTo.minute, 'AM')}
                >
                  AM
                </button>
                <button
                  type="button"
                  className={`${styles.ampmBtn} ${parsedTo.ampm === 'PM' ? styles.selected : ''}`}
                  onClick={() => updateTo(parsedTo.hour, parsedTo.minute, 'PM')}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        )}

        <label className={styles.rangeToggle}>
          <input
            type="checkbox"
            checked={showRange}
            onChange={(e) => handleRangeToggle(e.target.checked)}
          />
          <span>Set time window (From – To)</span>
        </label>
      </div>
    </div>
  );
}
