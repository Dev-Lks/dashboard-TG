import { PublicShell } from '@/components/layout/PublicShell';
import { MissionHub } from '@/components/MissionHub';
import { getPublicMissionsWithDates } from '@/lib/dates/public-queries';
import { UNIT_ID } from '@/lib/branding';

export default async function AgendarHubPage() {
  const missions = await getPublicMissionsWithDates();

  return (
    <PublicShell compact>
      <div className="mb-5">
        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">{UNIT_ID}</div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--olive-900)] sm:text-3xl">
          Escolha a missão
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Selecione uma missão aberta para confirmar sua presença.
        </p>
      </div>
      <MissionHub missions={missions} />
    </PublicShell>
  );
}
