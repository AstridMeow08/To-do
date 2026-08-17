import { COLORS } from '../../constants/colors';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  selected: number;
  onChange: (idx: number) => void;
}

export function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <div className={styles.row}>
      {COLORS.map((color, i) => (
        <div
          key={color.id}
          className={`${styles.swatch} ${i === selected ? styles.selected : ''}`}
          style={{ background: color.swatch }}
          onClick={() => onChange(i)}
          title={color.id}
          role="radio"
          aria-checked={i === selected}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onChange(i)}
        />
      ))}
    </div>
  );
}
