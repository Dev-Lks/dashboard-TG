import { requireAdmin } from '@/lib/admin-auth';
import {
  getAppointments,
  getAppointmentStats,
  getDateOccupancy,
  getActiveDatesRoster,
} from '@/lib/appointments/queries';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AppointmentsSimplePage } from '@/components/admin/appointments/AppointmentsSimplePage';
import { AppointmentList } from '@/components/admin/appointments/AppointmentList';
import { UNIT_ID } from '@/lib/branding';

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    mission?: string;
    status?: string;
    q?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const [rosters, stats, availableDates] = await Promise.all([
    getActiveDatesRoster(),
    getAppointmentStats(),
    getDateOccupancy(),
  ]);

  const missions = Array.from(
    new Map(
      rosters.map((r) => [
        r.mission_slug,
        { slug: r.mission_slug, name: r.mission_name, sort_order: r.mission_sort_order },
      ]),
    ).values(),
  ).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'pt-BR'));

  const today = new Date().toISOString().slice(0, 10);
  const selectedMission =
    (params.mission && missions.some((m) => m.slug === params.mission) ? params.mission : null) ||
    missions[0]?.slug ||
    null;

  const missionRosters = selectedMission
    ? rosters.filter((r) => r.mission_slug === selectedMission)
    : rosters;

  const selectedDate =
    (params.date && missionRosters.some((r) => r.date === params.date) ? params.date : null) ||
    missionRosters.find((r) => r.date >= today)?.date ||
    missionRosters[0]?.date ||
    null;

  if (params.status !== 'cancelled') {
    const appointments =
      selectedDate && selectedMission
        ? await getAppointments({
            date: selectedDate,
            mission: selectedMission,
            status: 'confirmed',
          })
        : [];

    return (
      <div>
        <AdminPageHeader eyebrow={UNIT_ID} title="Quem vai doar?" />
        <AppointmentsSimplePage
          rosters={rosters}
          missions={missions}
          stats={stats}
          appointments={appointments}
          availableDates={availableDates}
          selectedMission={selectedMission}
          selectedDate={selectedDate}
        />
      </div>
    );
  }

  const cancelled = await getAppointments({ status: 'cancelled' });

  return (
    <div>
      <AdminPageHeader
        eyebrow={UNIT_ID}
        title="Agendamentos cancelados"
        action={
          <a href="/admin/agendamentos" className="btn btn-secondary">
            Voltar à lista principal
          </a>
        }
      />
      <AppointmentList appointments={cancelled} availableDates={availableDates} />
    </div>
  );
}
