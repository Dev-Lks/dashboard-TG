import { requireAdmin } from '@/lib/admin-auth';
import { getAllMissions } from '@/lib/missions/queries';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MissionsPageClient } from '@/components/admin/missions/MissionsPageClient';
import { UNIT_ID } from '@/lib/branding';

export default async function AdminMissionsPage() {
  await requireAdmin();
  const missions = await getAllMissions();

  return (
    <div>
      <AdminPageHeader eyebrow={UNIT_ID} title="Missões" />
      <MissionsPageClient missions={missions} />
    </div>
  );
}
