import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/layout/PublicShell';
import { EventHero } from '@/components/EventHero';
import { AgendarFlow } from '@/components/AgendarFlow';
import { getUpcomingMissionDates } from '@/lib/dates/public-queries';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgendarMissionPage({ params }: PageProps) {
  const { slug } = await params;
  const { mission, dates } = await getUpcomingMissionDates(slug);

  if (!mission) notFound();

  return (
    <PublicShell compact>
      <EventHero mission={mission} dates={dates} />
      <div className="mt-6">
        <AgendarFlow mission={mission} />
      </div>
    </PublicShell>
  );
}
