import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { volunteerSearchSchema } from '@/lib/schemas';
import type { Volunteer } from '@/lib/types';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  const parsed = volunteerSearchSchema.safeParse({ query: q });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Busca inválida' }, { status: 400 });
  }

  const searchTerm = parsed.data.query.trim();

  const supabase = await createServerSupabase();

  // Limit results heavily for privacy. Search across nr, war_name and full_name.
  const { data, error } = await supabase
    .from('volunteers')
    .select('id, seq, grad, nr, full_name, war_name, created_at, updated_at')
    .or(`nr.ilike.%${searchTerm}%,war_name.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
    .order('nr', { ascending: true })
    .limit(8);

  if (error) {
    console.error('Search error', error);
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 });
  }

  return NextResponse.json({ volunteers: (data || []) as Volunteer[] });
}
