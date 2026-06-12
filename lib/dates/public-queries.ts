import { createServerSupabase } from '@/lib/supabase/server';
import { getDonationDayInfo } from '@/lib/dates/profiles';
import { formatDateBR } from '@/lib/date-utils';

export type PublicMissionDate = {
  id: string;
  date: string;
  capacity: number;
  booked: number;
  remaining: number;
  is_full: boolean;
  day_name: string;
  time_range: string;
  formatted_date: string;
};

function formatTimeRange(times: string[]): string {
  if (times.length === 0) return 'Horário a definir';
  const first = times[0];
  const last = times[times.length - 1];
  const fmt = (t: string) => {
    const [h, m] = t.split(':');
    return m === '00' ? `${h}h` : `${h}h${m}`;
  };
  return `${fmt(first)} às ${fmt(last)}`;
}

export async function getUpcomingMissionDates(limit = 5): Promise<PublicMissionDate[]> {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: dates } = await supabase
    .from('donation_dates')
    .select(`
      id,
      date,
      capacity,
      is_active,
      donation_time_slots (time, is_active)
    `)
    .eq('is_active', true)
    .gte('date', today)
    .order('date', { ascending: true });

  if (!dates?.length) return [];

  const { data: allConfirmed } = await supabase
    .from('appointments')
    .select('donation_date_id')
    .eq('status', 'confirmed');

  const bookedMap = new Map<string, number>();
  (allConfirmed || []).forEach((a: { donation_date_id: string }) => {
    bookedMap.set(a.donation_date_id, (bookedMap.get(a.donation_date_id) || 0) + 1);
  });

  const result: PublicMissionDate[] = [];

  for (const d of dates) {
    const activeSlots = (d.donation_time_slots || [])
      .filter((slot: { is_active: boolean }) => slot.is_active)
      .map((slot: { time: string }) => slot.time)
      .sort();

    if (activeSlots.length === 0) continue;

    const booked = bookedMap.get(d.id) || 0;
    const remaining = Math.max(0, d.capacity - booked);
    const dayInfo = getDonationDayInfo(d.date);

    result.push({
      id: d.id,
      date: d.date,
      capacity: d.capacity,
      booked,
      remaining,
      is_full: booked >= d.capacity,
      day_name: dayInfo.dayLabel,
      time_range: formatTimeRange(activeSlots),
      formatted_date: formatDateBR(d.date),
    });

    if (result.length >= limit) break;
  }

  return result;
}
