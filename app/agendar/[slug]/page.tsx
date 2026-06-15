import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/layout/PublicShell';
import { AgendarFlow } from '@/components/AgendarFlow';
import { getUpcomingMissionDates } from '@/lib/dates/public-queries';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgendarMissionPage({ params }: PageProps) {
  const { slug } = await params;
  const { mission } = await getUpcomingMissionDates(slug);

  if (!mission) notFound();

  return (
    <PublicShell compact>
      <AgendarFlow mission={mission} />
    </PublicShell>
  );
}
