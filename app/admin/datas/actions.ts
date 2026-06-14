'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { generateTimeSlots } from '@/lib/dates/slot-generator';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ScheduleMode } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export type DateActionResult = {
  success: boolean;
  error?: string;
};

type ScheduleInput = {
  scheduleMode: ScheduleMode;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  slotInterval?: number | null;
};

function parseScheduleFromForm(formData: FormData): ScheduleInput {
  const scheduleMode = formData.get('scheduleMode') === 'presence_only' ? 'presence_only' : 'slots';
  return {
    scheduleMode,
    scheduleStart: (formData.get('scheduleStart') as string) || null,
    scheduleEnd: (formData.get('scheduleEnd') as string) || null,
    slotInterval: parseInt(formData.get('slotInterval') as string) || 30,
  };
}

function buildSlotRows(dateId: string, schedule: ScheduleInput) {
  if (schedule.scheduleMode !== 'slots') return [];
  const start = schedule.scheduleStart || '08:00';
  const end = schedule.scheduleEnd || '12:00';
  const interval = schedule.slotInterval || 30;
  const times = generateTimeSlots(start, end, interval);
  if (times.length === 0) return [];
  return times.map((t) => ({ donation_date_id: dateId, time: t, is_active: true }));
}

export async function createDateAction(formData: FormData): Promise<DateActionResult> {
  await requireAdmin();

  const missionId = formData.get('missionId') as string;
  const dateStr = formData.get('date') as string;
  const requestedCapacity = parseInt(formData.get('capacity') as string) || 15;
  const capacity = Math.max(1, Math.min(100, requestedCapacity));
  const notes = (formData.get('notes') as string) || null;
  const schedule = parseScheduleFromForm(formData);

  if (!missionId) return { success: false, error: 'Missão é obrigatória' };
  if (!dateStr) return { success: false, error: 'Data é obrigatória' };

  if (schedule.scheduleMode === 'slots') {
    const times = generateTimeSlots(
      schedule.scheduleStart || '08:00',
      schedule.scheduleEnd || '12:00',
      schedule.slotInterval || 30,
    );
    if (times.length === 0) {
      return { success: false, error: 'Configure um intervalo de horários válido' };
    }
  }

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('donation_dates')
    .select('id')
    .eq('mission_id', missionId)
    .eq('date', dateStr)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Data já cadastrada nesta missão' };
  }

  const { data: newDate, error } = await supabase
    .from('donation_dates')
    .insert({
      mission_id: missionId,
      date: dateStr,
      capacity,
      notes,
      is_active: true,
      schedule_mode: schedule.scheduleMode,
      schedule_start: schedule.scheduleMode === 'slots' ? schedule.scheduleStart : null,
      schedule_end: schedule.scheduleMode === 'slots' ? schedule.scheduleEnd : null,
      slot_interval: schedule.scheduleMode === 'slots' ? schedule.slotInterval : null,
    })
    .select('id')
    .single();

  if (error || !newDate) {
    return { success: false, error: 'Erro ao cadastrar data' };
  }

  const slots = buildSlotRows(newDate.id, schedule);
  if (slots.length > 0) {
    await supabase.from('donation_time_slots').insert(slots);
  }

  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export type BatchCreateResult = DateActionResult & {
  created?: number;
  skipped?: number;
  errors?: string[];
};

export async function createDatesBatchAction(
  missionId: string,
  dates: string[],
  capacity = 15,
  notes: string | null = null,
  schedule: ScheduleInput,
): Promise<BatchCreateResult> {
  await requireAdmin();

  if (!missionId) return { success: false, error: 'Missão é obrigatória' };
  if (!dates.length) return { success: false, error: 'Selecione ao menos uma data' };

  if (schedule.scheduleMode === 'slots') {
    const times = generateTimeSlots(
      schedule.scheduleStart || '08:00',
      schedule.scheduleEnd || '12:00',
      schedule.slotInterval || 30,
    );
    if (times.length === 0) {
      return { success: false, error: 'Configure um intervalo de horários válido' };
    }
  }

  const cappedCapacity = Math.max(1, Math.min(100, capacity));
  const supabase = createServiceRoleClient();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const dateStr of dates) {
    const { data: existing } = await supabase
      .from('donation_dates')
      .select('id')
      .eq('mission_id', missionId)
      .eq('date', dateStr)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { data: newDate, error } = await supabase
      .from('donation_dates')
      .insert({
        mission_id: missionId,
        date: dateStr,
        capacity: cappedCapacity,
        notes,
        is_active: true,
        schedule_mode: schedule.scheduleMode,
        schedule_start: schedule.scheduleMode === 'slots' ? schedule.scheduleStart : null,
        schedule_end: schedule.scheduleMode === 'slots' ? schedule.scheduleEnd : null,
        slot_interval: schedule.scheduleMode === 'slots' ? schedule.slotInterval : null,
      })
      .select('id')
      .single();

    if (error || !newDate) {
      skipped++;
      errors.push(`${dateStr}: erro ao cadastrar`);
      continue;
    }

    const slots = buildSlotRows(newDate.id, schedule);
    if (slots.length > 0) {
      await supabase.from('donation_time_slots').insert(slots);
    }
    created++;
  }

  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  revalidatePath('/');

  if (created === 0) {
    return {
      success: false,
      error: 'Nenhuma data foi cadastrada. Verifique se já existem.',
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
  const capacity = Math.max(1, Math.min(100, requestedCapacity));
  const notes = (formData.get('notes') as string) || null;

  if (!id) return { success: false, error: 'ID inválido' };

  const supabase = createServiceRoleClient();

  const scheduleModeRaw = formData.get('scheduleMode') as string | null;
  const scheduleMode: ScheduleMode | null = (scheduleModeRaw === 'presence_only' || scheduleModeRaw === 'slots')
    ? scheduleModeRaw
    : null;

  if (scheduleMode === 'presence_only') {
    await supabase.from('donation_time_slots').delete().eq('donation_date_id', id);
    const { error } = await supabase
      .from('donation_dates')
      .update({
        capacity,
        notes,
        schedule_mode: 'presence_only',
        schedule_start: null,
        schedule_end: null,
        slot_interval: null,
      })
      .eq('id', id);
    if (error) return { success: false, error: 'Erro ao atualizar data' };
  } else if (scheduleMode === 'slots') {
    const scheduleStart = (formData.get('scheduleStart') as string) || '08:00';
    const scheduleEnd = (formData.get('scheduleEnd') as string) || '12:00';
    const slotInterval = parseInt(formData.get('slotInterval') as string) || 30;

    const times = generateTimeSlots(scheduleStart, scheduleEnd, slotInterval);
    if (times.length === 0) {
      return { success: false, error: 'Configure um intervalo de horários válido' };
    }

    await supabase.from('donation_time_slots').delete().eq('donation_date_id', id);

    const { error } = await supabase
      .from('donation_dates')
      .update({
        capacity,
        notes,
        schedule_mode: 'slots',
        schedule_start: scheduleStart,
        schedule_end: scheduleEnd,
        slot_interval: slotInterval,
      })
      .eq('id', id);
    if (error) return { success: false, error: 'Erro ao atualizar data' };

    await supabase.from('donation_time_slots').insert(
      times.map((t) => ({ donation_date_id: id, time: t, is_active: true })),
    );
  } else {
    const { error } = await supabase
      .from('donation_dates')
      .update({ capacity, notes })
      .eq('id', id);
    if (error) return { success: false, error: 'Erro ao atualizar data' };
  }

  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function toggleActiveAction(id: string, current: boolean): Promise<DateActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('donation_dates').update({ is_active: !current }).eq('id', id);
  if (error) return { success: false, error: 'Erro ao alterar status' };
  revalidatePath('/admin/datas');
  revalidatePath('/admin');
  revalidatePath('/');
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
  revalidatePath('/');
  return { success: true };
}
