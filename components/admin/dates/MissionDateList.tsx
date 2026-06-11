import { EmptyState } from '@/components/shared/EmptyState';
import { CapacityBadge } from '@/components/admin/appointments/CapacityBadge';
import { getDonationDayInfo } from '@/lib/dates/profiles';
import { formatDateBR } from '@/lib/date-utils';
import type { RegisteredDateInfo } from '@/lib/dates/calendar-utils';

type DateWithSlots = RegisteredDateInfo & {
  notes: string | null;
  donation_time_slots?: { time: string }[];
};

type MissionDateListProps = {
  dates: DateWithSlots[];
};

export function MissionDateList({ dates }: MissionDateListProps) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-5 py-4">
        <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--olive-dark)]">
          Datas cadastradas
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Controle de status, capacidade e ocupação da missão.
        </p>
      </div>

      <table className="table hidden w-full md:table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Dia</th>
            <th>Ocupação</th>
            <th>Capacidade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((d) => {
            const info = getDonationDayInfo(d.date);
            return (
              <tr key={d.id}>
                <td className="font-medium">{formatDateBR(d.date)}</td>
                <td>{info.dayLabel}</td>
                <td>
                  <CapacityBadge booked={d.booked} capacity={d.capacity} isFull={d.is_full} compact />
                  <span className="ml-2 text-xs text-[var(--text-muted)]">{d.booked}/{d.capacity}</span>
                </td>
                <td>{d.capacity}</td>
                <td>
                  {!d.is_active ? (
                    <span className="badge badge-command">Inativa</span>
                  ) : d.is_full ? (
                    <span className="badge badge-closed">Cheia</span>
                  ) : (
                    <span className="badge badge-open">Aberta</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {dates.length === 0 ? (
        <div className="p-4">
          <EmptyState title="Nenhuma data cadastrada" description="Selecione uma segunda ou quinta no calendário para iniciar a missão." />
        </div>
      ) : (
        <div className="grid gap-3 p-3 md:hidden">
          {dates.map((d) => {
            const info = getDonationDayInfo(d.date);
            const percent = Math.min(100, Math.round((d.booked / d.capacity) * 100));
            return (
              <div key={d.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-[var(--olive-900)]">{formatDateBR(d.date)}</div>
                    <div className="text-sm text-[var(--text-muted)]">{info.dayLabel}</div>
                  </div>
                  {!d.is_active ? (
                    <span className="badge badge-command">Inativa</span>
                  ) : d.is_full ? (
                    <span className="badge badge-closed">Cheia</span>
                  ) : (
                    <span className="badge badge-open">Aberta</span>
                  )}
                </div>
                <div className="progress-track mt-3">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-2 text-sm font-bold text-[var(--text-muted)]">
                  {d.booked}/{d.capacity} confirmados
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
