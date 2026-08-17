import { ICON_PATHS } from '../../constants/icons';
import styles from './IconPicker.module.css';

interface IconPickerProps {
  selected: number;
  onChange: (idx: number) => void;
}

export function IconPicker({ selected, onChange }: IconPickerProps) {
  return (
    <div className={styles.row}>
      {ICON_PATHS.map((paths, i) => (
        <button
          key={i}
          type="button"
          className={`${styles.iconBtn} ${i === selected ? styles.selected : ''}`}
          onClick={() => onChange(i)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: paths }}
          />
        </button>
      ))}
    </div>
  );
}
