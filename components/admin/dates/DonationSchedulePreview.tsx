import { donationProfiles } from '@/lib/dates/profiles';

type DonationSchedulePreviewProps = {
  times: readonly string[];
  dayLabel: string;
  timeRange: string;
};

export function DonationSchedulePreview({ times, dayLabel, timeRange }: DonationSchedulePreviewProps) {
  return (
    <div>
      <div className="info-label mb-2">Horários gerados automaticamente</div>
      <div className="mb-2 text-sm font-bold text-[var(--olive-900)]">
        {dayLabel}: janela {timeRange}
      </div>
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
    <div className="grid gap-3 md:grid-cols-2">
      <div className="card p-4">
        <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">Segunda-feira</div>
        <div className="mt-2 font-mono text-sm font-bold text-[var(--olive)]">
          {donationProfiles.monday.timeRange}
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Janela 07:00–10:00</p>
      </div>
      <div className="card p-4">
        <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">Quinta-feira</div>
        <div className="mt-2 font-mono text-sm font-bold text-[var(--olive)]">
          {donationProfiles.thursday.timeRange}
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Janela 13:00–17:00</p>
      </div>
    </div>
  );
}
