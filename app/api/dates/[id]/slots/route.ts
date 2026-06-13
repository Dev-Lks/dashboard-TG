import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { resolveScheduleMode } from '@/lib/dates/schedule-mode';
import type { ScheduleMode } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: dateRow } = await supabase
    .from('donation_dates')
    .select(`
      schedule_mode,
      missions (default_schedule_mode)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!dateRow) {
    return NextResponse.json({ slots: [] });
  }

  const mission = dateRow.missions as { default_schedule_mode: ScheduleMode } | { default_schedule_mode: ScheduleMode }[] | null;
  const missionDefault = Array.isArray(mission) ? mission[0]?.default_schedule_mode : mission?.default_schedule_mode;
  const effectiveMode = resolveScheduleMode(dateRow.schedule_mode as ScheduleMode, missionDefault);

  if (effectiveMode === 'presence_only') {
    return NextResponse.json({ slots: [] });
  }

  const { data, error } = await supabase
    .from('donation_time_slots')
    .select('id, time, is_active')
    .eq('donation_date_id', id)
    .order('time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Erro ao carregar horários' }, { status: 500 });
  }

  return NextResponse.json({ slots: data || [] });
}
