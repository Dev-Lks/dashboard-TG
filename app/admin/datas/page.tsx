import { requireAdmin } from '@/lib/admin-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAllMissions } from '@/lib/missions/queries';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DatesPageClient } from '@/components/admin/dates/DatesPageClient';
import { MissionDateList } from '@/components/admin/dates/MissionDateList';
import { UNIT_ID } from '@/lib/branding';

async function getDatesWithOccupancy(missionId?: string) {
  const supabase = createServiceRoleClient();
  let occupancyQuery = supabase.from('vw_date_occupancy').select('*').order('date', { ascending: true });
  if (missionId) {
    const { data: missionDates } = await supabase
      .from('donation_dates')
      .select('id')
      .eq('mission_id', missionId);
    const ids = (missionDates || []).map((d) => d.id);
    if (ids.length === 0) return [];
    occupancyQuery = occupancyQuery.in('id', ids);
  }

  const { data: occupancy } = await occupancyQuery;

  let datesQuery = supabase
    .from('donation_dates')
    .select('id, date, mission_id, notes, schedule_mode, schedule_start, schedule_end, slot_interval, donation_time_slots(time)')
    .order('date', { ascending: true });
  if (missionId) {
    datesQuery = datesQuery.eq('mission_id', missionId);
  }

  const { data: dates } = await datesQuery;

  const notesMap = new Map((dates || []).map((d) => [d.date, d]));
  return (occupancy || []).map((o) => ({
    ...o,
    mission_id: notesMap.get(o.date)?.mission_id,
    schedule_mode: notesMap.get(o.date)?.schedule_mode,
    schedule_start: notesMap.get(o.date)?.schedule_start,
    schedule_end: notesMap.get(o.date)?.schedule_end,
    slot_interval: notesMap.get(o.date)?.slot_interval,
    notes: notesMap.get(o.date)?.notes ?? null,
    donation_time_slots: notesMap.get(o.date)?.donation_time_slots,
  }));
}
export default async function AdminDatesPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const missions = await getAllMissions();
  const initialMission = params.mission
    ? missions.find((m) => m.id === params.mission || m.slug === params.mission)
    : missions[0];

  const dates = await getDatesWithOccupancy(initialMission?.id);

  return (
    <div>
      <AdminPageHeader eyebrow={UNIT_ID} title="Calendário da Missão" />

      <DatesPageClient
        missions={missions}
        registeredDates={dates}
        initialMissionId={initialMission?.id}
      />

      {initialMission && <MissionDateList dates={dates} missionName={initialMission.name} />}
    </div>
  );
}
