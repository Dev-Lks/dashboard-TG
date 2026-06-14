'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { slugifyMissionName } from '@/lib/missions/slug';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type MissionActionResult = { success: boolean; error?: string; id?: string };

export async function createMissionAction(formData: FormData): Promise<MissionActionResult> {
  await requireAdmin();

  const name = (formData.get('name') as string)?.trim();
  const slugRaw = (formData.get('slug') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const location = (formData.get('location') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim() || null;
  const mapsUrl = (formData.get('maps_url') as string)?.trim() || null;
  const defaultCapacity = Math.max(1, Math.min(100, parseInt(formData.get('default_capacity') as string) || 15));
  const defaultScheduleMode = formData.get('default_schedule_mode') === 'presence_only' ? 'presence_only' : 'slots';
  const isPublic = formData.get('is_public') === 'on';

  if (!name) return { success: false, error: 'Nome é obrigatório' };

  const slug = slugRaw || slugifyMissionName(name);
  if (!slug) return { success: false, error: 'Slug inválido' };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('missions')
    .insert({
      name,
      slug,
      description,
      location,
      phone,
      maps_url: mapsUrl,
      default_capacity: defaultCapacity,
      default_schedule_mode: defaultScheduleMode,
      is_public: isPublic,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Já existe uma missão com este slug' };
    return { success: false, error: 'Erro ao criar missão' };
  }

  revalidatePath('/admin/missoes');
  revalidatePath('/admin/datas');
  revalidatePath('/');
  revalidatePath('/agendar');
  return { success: true, id: data.id };
}

export async function updateMissionAction(formData: FormData): Promise<MissionActionResult> {
  await requireAdmin();

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const location = (formData.get('location') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim() || null;
  const mapsUrl = (formData.get('maps_url') as string)?.trim() || null;
  const defaultCapacity = Math.max(1, Math.min(100, parseInt(formData.get('default_capacity') as string) || 15));
  const defaultScheduleMode = formData.get('default_schedule_mode') === 'presence_only' ? 'presence_only' : 'slots';

  if (!id || !name) return { success: false, error: 'Dados inválidos' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('missions')
    .update({
      name,
      description,
      location,
      phone,
      maps_url: mapsUrl,
      default_capacity: defaultCapacity,
      default_schedule_mode: defaultScheduleMode,
    })
    .eq('id', id);

  if (error) return { success: false, error: 'Erro ao atualizar missão' };

  if (defaultScheduleMode === 'presence_only') {
    const { data: missionDates } = await supabase
      .from('donation_dates')
      .select('id')
      .eq('mission_id', id);

    if (missionDates?.length) {
      const dateIds = missionDates.map((d) => d.id);

      await supabase
        .from('donation_dates')
        .update({
          schedule_mode: 'presence_only',
          schedule_start: null,
          schedule_end: null,
          slot_interval: null,
        })
        .eq('mission_id', id);

      await supabase.from('donation_time_slots').delete().in('donation_date_id', dateIds);
    }
  } else if (defaultScheduleMode === 'slots') {
    await supabase
      .from('donation_dates')
      .update({ schedule_mode: 'slots' })
      .eq('mission_id', id);
  }

  revalidatePath('/admin/missoes');
  revalidatePath('/admin/datas');
  revalidatePath('/');
  revalidatePath('/agendar');
  revalidatePath('/agendar/doacao-sangue');
  return { success: true, id };
}

export async function toggleMissionPublicAction(id: string, current: boolean): Promise<MissionActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('missions').update({ is_public: !current }).eq('id', id);
  if (error) return { success: false, error: 'Erro ao alterar visibilidade' };

  revalidatePath('/admin/missoes');
  revalidatePath('/');
  revalidatePath('/agendar');
  return { success: true };
}

export async function deleteMissionAction(id: string): Promise<MissionActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const { count } = await supabase
    .from('donation_dates')
    .select('*', { count: 'exact', head: true })
    .eq('mission_id', id);

  if ((count || 0) > 0) {
    return { success: false, error: 'Não é possível excluir: existem datas vinculadas' };
  }

  const { error } = await supabase.from('missions').delete().eq('id', id);
  if (error) return { success: false, error: 'Erro ao excluir missão' };

  revalidatePath('/admin/missoes');
  return { success: true };
}
