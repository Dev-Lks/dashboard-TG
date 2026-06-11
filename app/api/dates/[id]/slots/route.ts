import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();

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
