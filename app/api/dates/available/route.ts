import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getDonationDayInfo } from '@/lib/dates/profiles';

export async function GET() {
  const supabase = await createServerSupabase();

  // Get active dates + current confirmed count in one go using the view if possible, otherwise join
  const { data: dates, error } = await supabase
    .from('donation_dates')
    .select(`
      id,
      date,
      capacity,
      is_active,
      donation_time_slots (time, is_active)
    `)
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Erro ao carregar datas' }, { status: 500 });
  }

  // Simpler & reliable: fetch all confirmed appointments and count client-side (dataset is tiny)
  const { data: allConfirmed } = await supabase
    .from('appointments')
    .select('donation_date_id')
    .eq('status', 'confirmed');

  const bookedMap = new Map<string, number>();
  (allConfirmed || []).forEach((a: any) => {
    bookedMap.set(a.donation_date_id, (bookedMap.get(a.donation_date_id) || 0) + 1);
  });

  const result = (dates || []).flatMap((d: any) => {
    const booked = bookedMap.get(d.id) || 0;
    const remaining = Math.max(0, d.capacity - booked);
    const isFull = booked >= d.capacity;

    const dayInfo = getDonationDayInfo(d.date);
    const activeSlots = (d.donation_time_slots || []).filter((slot: { is_active: boolean }) => slot.is_active);

    if (!dayInfo.isAutomatic || activeSlots.length === 0) {
      return [];
    }

    return [{
      id: d.id,
      date: d.date,
      capacity: d.capacity,
      booked,
      remaining,
      is_full: isFull,
      day_name: dayInfo.dayLabel,
      time_range: dayInfo.profileKey
        ? (dayInfo.profileKey === 'monday' ? '07h às 10h' : '13h às 17h')
        : 'Horário a definir',
    }];
  });

  return NextResponse.json({ dates: result });
}
