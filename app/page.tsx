import { PublicShell } from '@/components/layout/PublicShell';
import { MissionHub } from '@/components/MissionHub';
import { getPublicMissionsWithDates } from '@/lib/dates/public-queries';

export default async function LandingPage() {
  const missions = await getPublicMissionsWithDates();

  return (
    <PublicShell>
      <MissionHub missions={missions} />
    </PublicShell>
  );
}
