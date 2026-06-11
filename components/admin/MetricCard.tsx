import { ReactNode } from 'react';

type MetricCardProps = {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'sand';
};

const tones = {
  default: 'text-[var(--olive-900)]',
  success: 'text-[var(--success)]',
  danger: 'text-[var(--danger)]',
  sand: 'text-[var(--warning)]',
};

export function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  return (
    <div className="metric-card p-4">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className={`mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl ${tones[tone]}`}>{value}</div>
    </div>
  );
}
