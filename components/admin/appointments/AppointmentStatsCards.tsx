import { StatCard } from '@/components/admin/StatCard';
import type { AppointmentStats } from '@/lib/appointments/queries';

type AppointmentStatsCardsProps = {
  stats: AppointmentStats;
};

export function AppointmentStatsCards({ stats }: AppointmentStatsCardsProps) {
  const nextDateValue = stats.nextDateLabel
    ? `${stats.nextDateOccupied}/${stats.nextDateCapacity}`
    : '—';

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="Total confirmados" value={stats.totalConfirmed} tone="success" />
      <StatCard label="Vagas próxima data" value={nextDateValue} />
      <StatCard label="Datas ativas" value={stats.activeDates} tone="success" />
      <StatCard label="Datas cheias" value={stats.fullDates} tone="danger" />
      <StatCard label="Cancelados" value={stats.totalCancelled} tone="sand" />
      <StatCard label="Monitores agendados" value={stats.monitorsScheduled} />
      <StatCard label="Atiradores agendados" value={stats.atiradoresScheduled} />
      <StatCard
        label="Vagas restantes"
        value={stats.nextDateRemaining ?? '—'}
        tone={stats.nextDateRemaining === 0 ? 'danger' : 'default'}
      />
    </div>
  );
}
