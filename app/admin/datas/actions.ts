'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { donationProfiles, getDonationProfileKey } from '@/lib/dates/profiles';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getDay, parseISO } from 'date-fns';
import { revalidatePath } from 'next/cache';

export type DateActionResult = {
  success: boolean;
  error?: string;
};

export async function createDateAction(formData: FormData): Promise<DateActionResult> {
  await requireAdmin();

  const dateStr = formData.get('date') as string;
  const requestedCapacity = parseInt(formData.get('capacity') as string) || 15;
  const capacity = Math.max(1, Math.min(15, requestedCapacity));
  const notes = (formData.get('notes') as string) || null;

  if (!dateStr) return { success: false, error: 'Data é obrigatória' };

  const profileKey = getDonationProfileKey(dateStr);
  if (!profileKey) {
    return { success: false, error: 'Este dia não gera horários automaticamente. Selecione uma segunda ou quinta.' };
  }

  const profile = donationProfiles[profileKey];
  const dow = getDay(parseISO(dateStr));
  if (dow !== profile.dayIndex) {
    return { success: false, error: `Data não corresponde ao perfil ${profile.shortLabel}` };
  }

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('donation_dates')
    .select('id')
    .eq('date', dateStr)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Data já cadastrada' };
  }

  const { data: newDate, error } = await supabase
    .from('donation_dates')
    .insert({ date: dateStr, capacity, notes, is_active: true })
    .select('id')
    .single();

  if (error || !newDate) {
    return { success: false, error: 'Erro ao cadastrar data' };
  }

  const slots = profile.times.map((t) => ({ donation_date_id: newDate.id, time: t, is_active: true }));
  await supabase.from('donation_time_slots').insert(slots);

  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  return { success: true };
}

export type BatchCreateResult = DateActionResult & {
  created?: number;
  skipped?: number;
  errors?: string[];
};

export async function createDatesBatchAction(
  dates: string[],
  capacity = 15,
  notes: string | null = null,
): Promise<BatchCreateResult> {
  await requireAdmin();

  if (!dates.length) {
    return { success: false, error: 'Selecione ao menos uma data' };
  }

  const cappedCapacity = Math.max(1, Math.min(15, capacity));
  const supabase = createServiceRoleClient();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const dateStr of dates) {
    const profileKey = getDonationProfileKey(dateStr);
    if (!profileKey) {
      skipped++;
      errors.push(`${dateStr}: dia inválido`);
      continue;
    }

    const profile = donationProfiles[profileKey];
    const dow = getDay(parseISO(dateStr));
    if (dow !== profile.dayIndex) {
      skipped++;
      errors.push(`${dateStr}: não corresponde ao perfil ${profile.shortLabel}`);
      continue;
    }

    const { data: existing } = await supabase
      .from('donation_dates')
      .select('id')
      .eq('date', dateStr)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { data: newDate, error } = await supabase
      .from('donation_dates')
      .insert({ date: dateStr, capacity: cappedCapacity, notes, is_active: true })
      .select('id')
      .single();

    if (error || !newDate) {
      skipped++;
      errors.push(`${dateStr}: erro ao cadastrar`);
      continue;
    }

    const slots = profile.times.map((t) => ({ donation_date_id: newDate.id, time: t, is_active: true }));
    await supabase.from('donation_time_slots').insert(slots);
    created++;
  }

  revalidatePath('/admin/datas');
  revalidatePath('/admin');

  if (created === 0) {
    return {
      success: false,
      error: 'Nenhuma data foi cadastrada. Verifique se já existem ou são inválidas.',
      created,
      skipped,
      errors,
    };
  }

  return { success: true, created, skipped, errors };
}

export async function updateDateAction(formData: FormData): Promise<DateActionResult> {
  await requireAdmin();

  const id = formData.get('id') as string;
  const requestedCapacity = parseInt(formData.get('capacity') as string) || 15;
  const capacity = Math.max(1, Math.min(15, requestedCapacity));
  const notes = (formData.get('notes') as string) || null;

  if (!id) return { success: false, error: 'ID inválido' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('donation_dates')
    .update({ capacity, notes })
    .eq('id', id);

  if (error) return { success: false, error: 'Erro ao atualizar data' };

  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  return { success: true };
}

export async function toggleActiveAction(id: string, current: boolean): Promise<DateActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('donation_dates').update({ is_active: !current }).eq('id', id);
  if (error) return { success: false, error: 'Erro ao alterar status' };
  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteDateAction(id: string): Promise<DateActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('donation_date_id', id);

  if ((count || 0) > 0) {
    return { success: false, error: 'Não é possível excluir: existem agendamentos nesta data' };
  }

  const { error } = await supabase.from('donation_dates').delete().eq('id', id);
  if (error) return { success: false, error: 'Erro ao excluir data' };

  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  return { success: true };
}
