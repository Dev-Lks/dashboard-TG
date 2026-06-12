import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';
import type { Mission } from './types';

export async function getAllMissions(): Promise<Mission[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('missions')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  return (data || []) as Mission[];
}

export async function getPublicMissions(): Promise<Mission[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('missions')
    .select('*')
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  return (data || []) as Mission[];
}

export async function getMissionBySlug(slug: string): Promise<Mission | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('missions')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as Mission) || null;
}

export async function getMissionById(id: string): Promise<Mission | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('missions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as Mission) || null;
}
