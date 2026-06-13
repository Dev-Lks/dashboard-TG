import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getMissionAttendanceRoster } from '@/lib/appointments/mission-attendance';
import type { MissionAttendanceState } from '@/lib/types';
import type { TurmaId } from '@/lib/volunteers/turmas';
import type { VolunteerRole } from '@/lib/volunteers/roles';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MissionAttendancePage } from '@/components/admin/missions/MissionAttendancePage';
import { UNIT_ID } from '@/lib/branding';

export default async function MissionControlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    turma?: string;
    role?: string;
  }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const filters = await searchParams;

  const validStatuses: MissionAttendanceState[] = ['completed', 'scheduled', 'no_show', 'not_scheduled'];
  const statusFilter = validStatuses.includes(filters.status as MissionAttendanceState)
    ? (filters.status as MissionAttendanceState)
    : undefined;

  const turmaFilter = (['t1', 't2', 't3'] as TurmaId[]).includes(filters.turma as TurmaId)
    ? (filters.turma as TurmaId)
    : undefined;

  const roleFilter =
    filters.role === 'monitor' || filters.role === 'atirador' || filters.role === 'all'
      ? (filters.role as VolunteerRole | 'all')
      : 'atirador';

  const { mission, rows, summary } = await getMissionAttendanceRoster(slug, {
    q: filters.q,
    status: statusFilter || '',
    turma: turmaFilter || '',
    role: roleFilter,
  });

  if (!mission) {
    notFound();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow={UNIT_ID}
        title={`Controle — ${mission.name}`}
        action={
          <Link href="/admin/missoes" className="btn btn-secondary">
            Voltar às missões
          </Link>
        }
      />
      <MissionAttendancePage
        missionName={mission.name}
        missionSlug={mission.slug}
        rows={rows}
        summary={summary}
        initialFilters={{
          q: filters.q,
          status: filters.status,
          turma: filters.turma,
          role: roleFilter,
        }}
      />
    </div>
  );
}
