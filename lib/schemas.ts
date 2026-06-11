import { z } from 'zod';

export const volunteerSearchSchema = z.object({
  query: z.string().min(2, 'Digite pelo menos 2 caracteres').max(80),
});

export const createAppointmentSchema = z.object({
  volunteerId: z.string().uuid(),
  donationDateId: z.string().uuid(),
  timeSlotId: z.string().uuid().optional().nullable(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const donationDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  capacity: z.coerce.number().int().min(1).max(50).default(15),
  notes: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const updateAppointmentNotesSchema = z.object({
  appointmentId: z.string().uuid(),
  admin_notes: z.string().max(1000).nullable(),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  newDonationDateId: z.string().uuid(),
  newTimeSlotId: z.string().uuid().optional().nullable(),
  adminNote: z.string().max(1000).optional().nullable(),
});

export type VolunteerSearchInput = z.infer<typeof volunteerSearchSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type DonationDateInput = z.infer<typeof donationDateSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
