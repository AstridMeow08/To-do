import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string;
  desc: string;
}

export function StatCard({ label, value, desc }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      <div className={styles.desc}>{desc}</div>
    </div>
  );
}
