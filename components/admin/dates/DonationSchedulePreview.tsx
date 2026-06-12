import { donationProfiles } from '@/lib/dates/profiles';

type DonationSchedulePreviewProps = {
  times: readonly string[];
  dayLabel: string;
  timeRange: string;
};

export function DonationSchedulePreview({ times }: DonationSchedulePreviewProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {times.map((t) => (
          <span
            key={t}
            className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 font-mono text-xs font-bold text-[var(--olive-dark)]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ScheduleWindowCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(['monday', 'thursday', 'generic'] as const).map((key) => (
        <div key={key} className="card p-4">
          <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">
            {donationProfiles[key].profileLabel}
          </div>
          <div className="mt-2 font-mono text-sm font-bold text-[var(--olive)]">
            {donationProfiles[key].timeRange}
          </div>
        </div>
      ))}
    </div>
  );
}
