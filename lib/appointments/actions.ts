'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { rescheduleAppointmentSchema, cancelAppointmentSchema, updateAppointmentNotesSchema, markAttendanceSchema } from '@/lib/schemas';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResult> {
  await requireAdmin();

  const parsed = cancelAppointmentSchema.safeParse({ appointmentId });
  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos' };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', parsed.data.appointmentId)
    .eq('status', 'confirmed');

  if (error) {
    return { success: false, error: 'Erro ao cancelar agendamento' };
  }

  revalidatePath('/admin/agendamentos');
  revalidatePath('/admin');
  return { success: true, message: 'Agendamento cancelado' };
}

export async function saveAdminNotesAction(appointmentId: string, adminNotes: string | null): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateAppointmentNotesSchema.safeParse({ appointmentId, admin_notes: adminNotes });
  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos' };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('appointments')
    .update({ admin_notes: parsed.data.admin_notes })
    .eq('id', parsed.data.appointmentId);

  if (error) {
    return { success: false, error: 'Erro ao salvar observação' };
  }

  revalidatePath('/admin/agendamentos');
  return { success: true, message: 'Observação salva' };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  newDonationDateId: string,
  newTimeSlotId?: string | null,
  adminNote?: string | null
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = rescheduleAppointmentSchema.safeParse({
    appointmentId,
    newDonationDateId,
    newTimeSlotId: newTimeSlotId || null,
    adminNote: adminNote || null,
  });

  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos para reagendamento' };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc('reschedule_appointment', {
    p_appointment_id: parsed.data.appointmentId,
    p_new_donation_date_id: parsed.data.newDonationDateId,
    p_new_time_slot_id: parsed.data.newTimeSlotId || null,
    p_admin_note: parsed.data.adminNote || null,
  });

  if (error) {
    const msg = error.message || 'Erro ao reagendar';
    if (msg.includes('capacidade máxima')) {
      return { success: false, error: 'Data em capacidade máxima. Não há vagas disponíveis.' };
    }
    if (msg.includes('inativa')) {
      return { success: false, error: 'Esta data está inativa e não aceita agendamentos.' };
    }
    return { success: false, error: msg };
  }

  revalidatePath('/admin/agendamentos');
  revalidatePath('/admin');
  revalidatePath('/admin/datas');
  return { success: true, message: 'Voluntário reagendado com sucesso' };
}

export async function markAttendanceAction(
  appointmentId: string,
  attendanceStatus: 'completed' | 'no_show',
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = markAttendanceSchema.safeParse({ appointmentId, attendanceStatus });
  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos' };
  }

  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from('appointments')
    .select('id, status, attendance_status, mission_id')
    .eq('id', parsed.data.appointmentId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'Agendamento não encontrado' };
  }

  if (existing.status !== 'confirmed') {
    return { success: false, error: 'Apenas agendamentos confirmados podem ser marcados' };
  }

  if (existing.attendance_status !== 'pending') {
    return { success: false, error: 'Este agendamento já foi marcado' };
  }

  const updatePayload =
    parsed.data.attendanceStatus === 'completed'
      ? { attendance_status: 'completed' as const, completed_at: new Date().toISOString() }
      : { attendance_status: 'no_show' as const, completed_at: null };

  const { error } = await supabase
    .from('appointments')
    .update(updatePayload)
    .eq('id', parsed.data.appointmentId)
    .eq('status', 'confirmed')
    .eq('attendance_status', 'pending');

  if (error) {
    return { success: false, error: 'Erro ao registrar presença' };
  }

  const { data: mission } = await supabase
    .from('missions')
    .select('slug')
    .eq('id', existing.mission_id)
    .maybeSingle();

  revalidatePath('/admin/missoes');
  revalidatePath('/admin');
  if (mission?.slug) {
    revalidatePath(`/admin/missoes/${mission.slug}/controle`);
  }

  const message =
    parsed.data.attendanceStatus === 'completed'
      ? 'Missão marcada como realizada'
      : 'Registrado como não compareceu';

  return { success: true, message };
}
