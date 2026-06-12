import { formatDayName, formatTimeRangeFromSlots } from '@/lib/dates/schedule-display';
import type { RegisteredDateInfo } from '@/lib/dates/calendar-utils';
import { formatDateBR } from '@/lib/date-utils';

type MissionDateListProps = {
  dates: RegisteredDateInfo[];
  missionName?: string;
};

export function MissionDateList({ dates, missionName }: MissionDateListProps) {
  const active = dates.filter((d) => d.is_active);
  const inactive = dates.filter((d) => !d.is_active);

  if (dates.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        Datas cadastradas{missionName ? ` — ${missionName}` : ''}
      </h2>

      {active.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--olive)]">Ativas</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((d) => {
              const times = d.donation_time_slots?.map((s) => s.time) ?? [];
              const info = { dayLabel: formatDayName(d.date), timeRange: formatTimeRangeFromSlots(times) };
              return (
                <div key={d.id} className="card p-3">
                  <div className="font-extrabold">{formatDateBR(d.date)}</div>
                  <div className="text-xs text-[var(--text-muted)]">{info.dayLabel}</div>
                  <div className="mt-1 text-sm font-semibold text-[var(--olive)]">{info.timeRange}</div>
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    {d.booked}/{d.capacity} confirmados
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Inativas</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inactive.map((d) => {
              const times = d.donation_time_slots?.map((s) => s.time) ?? [];
              const info = { dayLabel: formatDayName(d.date), timeRange: formatTimeRangeFromSlots(times) };
              return (
                <div key={d.id} className="card p-3 opacity-60">
                  <div className="font-extrabold">{formatDateBR(d.date)}</div>
                  <div className="text-xs text-[var(--text-muted)]">{info.dayLabel}</div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">{info.timeRange}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
