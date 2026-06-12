import { requireAdmin } from '@/lib/admin-auth';
import {
  getAppointments,
  getAppointmentStats,
  getDateOccupancy,
  getActiveDatesRoster,
} from '@/lib/appointments/queries';
import { ExportButton } from './_components/ExportButton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AppointmentsSimplePage } from '@/components/admin/appointments/AppointmentsSimplePage';
import { AppointmentList } from '@/components/admin/appointments/AppointmentList';

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
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

  const today = new Date().toISOString().slice(0, 10);
  const selectedDate =
    params.date ||
    rosters.find((r) => r.date >= today)?.date ||
    rosters[0]?.date ||
    null;

  // Vista simplificada (padrão): efetivo por data
  if (params.status !== 'cancelled') {
    const appointments = selectedDate
      ? await getAppointments({ date: selectedDate, status: 'confirmed' })
      : [];

    return (
      <div>
        <AdminPageHeader
          eyebrow="Doação de sangue"
          title="Quem vai doar?"
          action={<ExportButton />}
        />
        <AppointmentsSimplePage
          rosters={rosters}
          stats={stats}
          appointments={appointments}
          availableDates={availableDates}
          selectedDate={selectedDate}
        />
      </div>
    );
  }

  // Vista de cancelados (link do avançado)
  const cancelled = await getAppointments({ status: 'cancelled' });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Doação de sangue"
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
