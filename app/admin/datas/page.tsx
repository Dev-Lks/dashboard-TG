import { requireAdmin } from '@/lib/admin-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DatesPageClient } from '@/components/admin/dates/DatesPageClient';
import { MissionDateList } from '@/components/admin/dates/MissionDateList';
async function getDatesWithOccupancy() {
  const supabase = createServiceRoleClient();
  const { data: occupancy } = await supabase.from('vw_date_occupancy').select('*').order('date', { ascending: true });
  const { data: dates } = await supabase
    .from('donation_dates')
    .select('id, date, notes, donation_time_slots(time)')
    .order('date', { ascending: true });

  const notesMap = new Map((dates || []).map((d) => [d.date, d]));
  return (occupancy || []).map((o) => ({
    ...o,
    notes: notesMap.get(o.date)?.notes ?? null,
    donation_time_slots: notesMap.get(o.date)?.donation_time_slots,
  }));
}

export default async function AdminDatesPage() {
  await requireAdmin();
  const dates = await getDatesWithOccupancy();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Gerenciamento de datas"
        title="Calendário da Missão"
        description="Cadastre e acompanhe as datas operacionais da missão de doação. Selecione segundas ou quintas no calendário."
      />

      <DatesPageClient registeredDates={dates} />

      <MissionDateList dates={dates} />
    </div>
  );
}
