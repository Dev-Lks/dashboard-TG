import { z } from 'zod';

export const volunteerSearchSchema = z.object({
  query: z.string().min(2, 'Digite pelo menos 2 caracteres').max(80),
});

export const verifyVolunteerSchema = z.object({
  volunteerId: z.string().uuid(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
});

export const createAppointmentSchema = z.object({
  volunteerId: z.string().uuid(),
  donationDateId: z.string().uuid(),
  timeSlotId: z.string().uuid().optional().nullable(),
  verificationToken: z.string().min(1),
});

export const lookupAppointmentSchema = z.object({
  volunteerId: z.string().uuid(),
  verificationToken: z.string().min(1),
  missionSlug: z.string().optional(),
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
export type VerifyVolunteerInput = z.infer<typeof verifyVolunteerSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type LookupAppointmentInput = z.infer<typeof lookupAppointmentSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type DonationDateInput = z.infer<typeof donationDateSchema>;
export const markAttendanceSchema = z.object({
  appointmentId: z.string().uuid(),
  attendanceStatus: z.enum(['completed', 'no_show']),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
