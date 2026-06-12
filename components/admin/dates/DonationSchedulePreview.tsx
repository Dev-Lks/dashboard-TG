import { formatTimeRangeFromSlots } from '@/lib/dates/schedule-display';

type DonationSchedulePreviewProps = {
  times: string[];
  dayLabel: string;
  timeRange?: string;
};

export function DonationSchedulePreview({ times, dayLabel, timeRange }: DonationSchedulePreviewProps) {
  const range = timeRange || formatTimeRangeFromSlots(times);

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">
        {dayLabel}
      </div>
      <div className="mt-1 font-mono text-sm font-bold text-[var(--olive)]">{range}</div>
      {times.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {times.map((t) => (
            <span key={t} className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--text-muted)]">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
