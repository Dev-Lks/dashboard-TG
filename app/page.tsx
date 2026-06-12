import { PublicShell } from '@/components/layout/PublicShell';
import { EventHero } from '@/components/EventHero';
import { getUpcomingMissionDates } from '@/lib/dates/public-queries';

export default async function LandingPage() {
  const dates = await getUpcomingMissionDates(12);

  return (
    <PublicShell>
      <EventHero dates={dates} />
    </PublicShell>
  );
}
