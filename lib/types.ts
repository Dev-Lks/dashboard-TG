export type Volunteer = {
  id: string;
  seq: number | null;
  grad: string | null;
  nr: string;
  full_name: string;
  war_name: string | null;
  birth_date: string | null; // YYYY-MM-DD
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleMode = 'slots' | 'presence_only';

export type DonationDate = {
  id: string;
  mission_id: string;
  date: string; // YYYY-MM-DD
  capacity: number;
  is_active: boolean;
  notes: string | null;
  schedule_mode: ScheduleMode;
  schedule_start: string | null;
  schedule_end: string | null;
  slot_interval: number | null;
  created_at: string;
  updated_at: string;
};

export type TimeSlot = {
  id: string;
  donation_date_id: string;
  time: string; // HH:MM
  is_active: boolean;
  created_at: string;
};

export type Appointment = {
  id: string;
  volunteer_id: string;
  donation_date_id: string;
  mission_id: string;
  time_slot_id: string | null;
  status: 'confirmed' | 'cancelled';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentWithDetails = Appointment & {
  volunteer: Pick<Volunteer, 'nr' | 'grad' | 'full_name' | 'war_name' | 'phone' | 'birth_date'>;
  donation_date: Pick<DonationDate, 'date' | 'capacity'>;
  time_slot?: Pick<TimeSlot, 'time'> | null;
};

export type AvailableDate = {
  id: string;
  date: string;
  capacity: number;
  booked: number;
  remaining: number;
  is_full: boolean;
  day_name: string;
  time_range: string;
  schedule_mode: ScheduleMode;
};

export type AvailableSlot = {
  id: string;
  time: string;
  is_active: boolean;
};

export type ImportPreviewRow = {
  seq: number | null;
  grad: string | null;
  nr: string;
  nome: string;
  nome_guerra: string | null;
  data_nascimento: string | null;
  telefone: string | null;
};
