import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatDayName, formatTimeRangeFromSlots } from '@/lib/dates/schedule-display';
import { resolveScheduleMode } from '@/lib/dates/schedule-mode';
import type { ScheduleMode } from '@/lib/types';

export async function GET(request: NextRequest) {
  const missionSlug = request.nextUrl.searchParams.get('mission');
  const supabase = await createServerSupabase();

  let missionId: string | null = null;
  let missionDefaultMode: ScheduleMode | null = null;
  if (missionSlug) {
    const { data: mission } = await supabase
      .from('missions')
      .select('id, is_public, default_schedule_mode')
      .eq('slug', missionSlug)
      .maybeSingle();

    if (!mission?.is_public) {
      return NextResponse.json({ dates: [], mission: null });
    }
    missionId = mission.id;
    missionDefaultMode = mission.default_schedule_mode as ScheduleMode;
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

  const missionDefaultsById = new Map<string, ScheduleMode>();
  if (!missionSlug && dates?.length) {
    const missionIds = [...new Set(dates.map((d: { mission_id: string }) => d.mission_id))];
    const { data: missions } = await supabase
      .from('missions')
      .select('id, default_schedule_mode')
      .in('id', missionIds);

    for (const mission of missions || []) {
      missionDefaultsById.set(mission.id, mission.default_schedule_mode as ScheduleMode);
    }
  }

  const result = (dates || []).flatMap((d: {
    id: string;
    date: string;
    capacity: number;
    schedule_mode: ScheduleMode;
    mission_id: string;
    donation_time_slots?: { time: string; is_active: boolean }[];
  }) => {
    const booked = bookedMap.get(d.id) || 0;
    const remaining = Math.max(0, d.capacity - booked);
    const isFull = booked >= d.capacity;

    const activeSlots = (d.donation_time_slots || [])
      .filter((slot) => slot.is_active)
      .map((slot) => slot.time)
      .sort();

    const effectiveScheduleMode = resolveScheduleMode(
      d.schedule_mode,
      missionDefaultMode ?? missionDefaultsById.get(d.mission_id),
    );

    if (effectiveScheduleMode === 'slots' && activeSlots.length === 0) {
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
      time_range: effectiveScheduleMode === 'presence_only'
        ? 'Presença no dia'
        : formatTimeRangeFromSlots(activeSlots),
      schedule_mode: effectiveScheduleMode,
    }];
  });

  return NextResponse.json({ dates: result });
}
