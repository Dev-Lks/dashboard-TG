import { createServerSupabase } from '@/lib/supabase/server';
import { formatDayName, formatTimeRangeFromSlots } from '@/lib/dates/schedule-display';
import { resolveScheduleMode } from '@/lib/dates/schedule-mode';
import { formatDateBR } from '@/lib/date-utils';
import type { Mission } from '@/lib/missions/types';
import type { ScheduleMode } from '@/lib/types';

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
  schedule_mode: ScheduleMode;
};

export type PublicMissionWithDates = Mission & {
  upcoming_dates: PublicMissionDate[];
  open_dates_count: number;
};

export async function getPublicMissionsWithDates(): Promise<PublicMissionWithDates[]> {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!missions?.length) return [];

  const { data: dates } = await supabase
    .from('donation_dates')
    .select(`
      id,
      date,
      capacity,
      is_active,
      mission_id,
      schedule_mode,
      donation_time_slots (time, is_active)
    `)
    .eq('is_active', true)
    .gte('date', today)
    .order('date', { ascending: true });

  const { data: allConfirmed } = await supabase
    .from('appointments')
    .select('donation_date_id')
    .eq('status', 'confirmed');

  const bookedMap = new Map<string, number>();
  (allConfirmed || []).forEach((a: { donation_date_id: string }) => {
    bookedMap.set(a.donation_date_id, (bookedMap.get(a.donation_date_id) || 0) + 1);
  });

  return (missions as Mission[]).map((mission) => {
    const missionDates = (dates || []).filter((d: { mission_id: string }) => d.mission_id === mission.id);
    const upcoming: PublicMissionDate[] = [];

    for (const d of missionDates) {
      const activeSlots = (d.donation_time_slots || [])
        .filter((slot: { is_active: boolean }) => slot.is_active)
        .map((slot: { time: string }) => slot.time)
        .sort();

      const scheduleMode = resolveScheduleMode(
        d.schedule_mode as ScheduleMode,
        mission.default_schedule_mode,
      );
      if (scheduleMode === 'slots' && activeSlots.length === 0) continue;

      const booked = bookedMap.get(d.id) || 0;
      const remaining = Math.max(0, d.capacity - booked);

      upcoming.push({
        id: d.id,
        date: d.date,
        capacity: d.capacity,
        booked,
        remaining,
        is_full: booked >= d.capacity,
        day_name: formatDayName(d.date),
        time_range: scheduleMode === 'presence_only'
          ? 'Presença no dia'
          : formatTimeRangeFromSlots(activeSlots),
        formatted_date: formatDateBR(d.date),
        schedule_mode: scheduleMode,
      });
    }

    return {
      ...mission,
      upcoming_dates: upcoming.slice(0, 5),
      open_dates_count: upcoming.filter((d) => !d.is_full).length,
    };
  });
}

export async function getUpcomingMissionDates(missionSlug: string, limit = 12): Promise<{
  mission: Mission | null;
  dates: PublicMissionDate[];
}> {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: mission } = await supabase
    .from('missions')
    .select('*')
    .eq('slug', missionSlug)
    .eq('is_public', true)
    .maybeSingle();

  if (!mission) return { mission: null, dates: [] };

  const { data: dates } = await supabase
    .from('donation_dates')
    .select(`
      id,
      date,
      capacity,
      is_active,
      schedule_mode,
      donation_time_slots (time, is_active)
    `)
    .eq('mission_id', mission.id)
    .eq('is_active', true)
    .gte('date', today)
    .order('date', { ascending: true });

  if (!dates?.length) return { mission: mission as Mission, dates: [] };

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

    const scheduleMode = resolveScheduleMode(
      d.schedule_mode as ScheduleMode,
      mission.default_schedule_mode,
    );
    if (scheduleMode === 'slots' && activeSlots.length === 0) continue;

    const booked = bookedMap.get(d.id) || 0;
    const remaining = Math.max(0, d.capacity - booked);

    result.push({
      id: d.id,
      date: d.date,
      capacity: d.capacity,
      booked,
      remaining,
      is_full: booked >= d.capacity,
      day_name: formatDayName(d.date),
      time_range: scheduleMode === 'presence_only'
        ? 'Presença no dia'
        : formatTimeRangeFromSlots(activeSlots),
      formatted_date: formatDateBR(d.date),
      schedule_mode: scheduleMode,
    });

    if (result.length >= limit) break;
  }

  return { mission: mission as Mission, dates: result };
}
