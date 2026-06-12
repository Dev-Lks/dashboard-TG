import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatDayName, formatTimeRangeFromSlots } from '@/lib/dates/schedule-display';
import type { ScheduleMode } from '@/lib/types';

export async function GET(request: NextRequest) {
  const missionSlug = request.nextUrl.searchParams.get('mission');
  const supabase = await createServerSupabase();

  let missionId: string | null = null;
  if (missionSlug) {
    const { data: mission } = await supabase
      .from('missions')
      .select('id, is_public')
      .eq('slug', missionSlug)
      .maybeSingle();

    if (!mission?.is_public) {
      return NextResponse.json({ dates: [], mission: null });
    }
    missionId = mission.id;
  }

  let datesQuery = supabase
    .from('donation_dates')
    .select(`
      id,
      date,
      capacity,
      is_active,
      schedule_mode,
      mission_id,
      donation_time_slots (time, is_active)
    `)
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (missionId) {
    datesQuery = datesQuery.eq('mission_id', missionId);
  }

  const { data: dates, error } = await datesQuery;

  if (error) {
    return NextResponse.json({ error: 'Erro ao carregar datas' }, { status: 500 });
  }

  const { data: allConfirmed } = await supabase
    .from('appointments')
    .select('donation_date_id')
    .eq('status', 'confirmed');

  const bookedMap = new Map<string, number>();
  (allConfirmed || []).forEach((a: { donation_date_id: string }) => {
    bookedMap.set(a.donation_date_id, (bookedMap.get(a.donation_date_id) || 0) + 1);
  });

  const result = (dates || []).flatMap((d: {
    id: string;
    date: string;
    capacity: number;
    schedule_mode: ScheduleMode;
    donation_time_slots?: { time: string; is_active: boolean }[];
  }) => {
    const booked = bookedMap.get(d.id) || 0;
    const remaining = Math.max(0, d.capacity - booked);
    const isFull = booked >= d.capacity;

    const activeSlots = (d.donation_time_slots || [])
      .filter((slot) => slot.is_active)
      .map((slot) => slot.time)
      .sort();

    if (d.schedule_mode === 'slots' && activeSlots.length === 0) {
      return [];
    }

    return [{
      id: d.id,
      date: d.date,
      capacity: d.capacity,
      booked,
      remaining,
      is_full: isFull,
      day_name: formatDayName(d.date),
      time_range: d.schedule_mode === 'presence_only'
        ? 'Presença no dia'
        : formatTimeRangeFromSlots(activeSlots),
      schedule_mode: d.schedule_mode,
    }];
  });

  return NextResponse.json({ dates: result });
}
