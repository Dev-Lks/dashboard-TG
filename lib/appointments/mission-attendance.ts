import { createServiceRoleClient } from '@/lib/supabase/server';
import type { AttendanceStatus, MissionAttendanceState, Volunteer } from '@/lib/types';
import { normalizeRole, type VolunteerRole } from '@/lib/volunteers/roles';
import { getTurmaFromSeq, type TurmaId } from '@/lib/volunteers/turmas';

export type MissionAppointmentRecord = {
  id: string;
  volunteer_id: string;
  attendance_status: AttendanceStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
};

export type MissionAttendanceRow = {
  volunteerId: string;
  nr: string;
  warName: string | null;
  fullName: string;
  role: VolunteerRole | null;
  turmaId: TurmaId | null;
  state: MissionAttendanceState;
  appointmentId: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
};

export type MissionAttendanceSummary = {
  completed: number;
  scheduled: number;
  noShow: number;
  notScheduled: number;
  total: number;
};

export type MissionAttendanceFilters = {
  q?: string;
  status?: MissionAttendanceState | '';
  turma?: TurmaId | '';
  role?: VolunteerRole | 'all' | '';
};

const STATE_LABELS: Record<MissionAttendanceState, string> = {
  completed: 'Realizado',
  scheduled: 'Agendado',
  no_show: 'Não compareceu',
  not_scheduled: 'Pendente',
};

export function getMissionAttendanceStateLabel(state: MissionAttendanceState): string {
  return STATE_LABELS[state];
}

export function deriveMissionAttendanceState(
  appointments: Pick<MissionAppointmentRecord, 'attendance_status'>[],
): MissionAttendanceState {
  if (appointments.some((a) => a.attendance_status === 'completed')) {
    return 'completed';
  }
  if (appointments.some((a) => a.attendance_status === 'pending')) {
    return 'scheduled';
  }
  if (appointments.some((a) => a.attendance_status === 'no_show')) {
    return 'no_show';
  }
  return 'not_scheduled';
}

export function pickActiveAppointment(
  appointments: MissionAppointmentRecord[],
): MissionAppointmentRecord | null {
  const completed = appointments.find((a) => a.attendance_status === 'completed');
  if (completed) return completed;

  const pending = appointments.find((a) => a.attendance_status === 'pending');
  if (pending) return pending;

  const noShow = appointments
    .filter((a) => a.attendance_status === 'no_show')
    .sort((a, b) => (b.scheduled_date || '').localeCompare(a.scheduled_date || ''))[0];
  return noShow ?? null;
}

function buildVolunteerRow(
  volunteer: Pick<Volunteer, 'id' | 'seq' | 'grad' | 'nr' | 'full_name' | 'war_name'>,
  appointments: MissionAppointmentRecord[],
): MissionAttendanceRow | null {
  const role = normalizeRole(volunteer.grad);
  if (!role) return null;

  const state = deriveMissionAttendanceState(appointments);
  const active = pickActiveAppointment(appointments);

  return {
    volunteerId: volunteer.id,
    nr: volunteer.nr,
    warName: volunteer.war_name,
    fullName: volunteer.full_name,
    role,
    turmaId: getTurmaFromSeq(volunteer.seq),
    state,
    appointmentId: active?.id ?? null,
    scheduledDate: active?.scheduled_date ?? null,
    scheduledTime: active?.scheduled_time ?? null,
  };
}

function countByState(rows: MissionAttendanceRow[]): MissionAttendanceSummary {
  const summary: MissionAttendanceSummary = {
    completed: 0,
    scheduled: 0,
    noShow: 0,
    notScheduled: 0,
    total: rows.length,
  };

  for (const row of rows) {
    if (row.state === 'completed') summary.completed++;
    else if (row.state === 'scheduled') summary.scheduled++;
    else if (row.state === 'no_show') summary.noShow++;
    else summary.notScheduled++;
  }

  return summary;
}

function applyFilters(rows: MissionAttendanceRow[], filters?: MissionAttendanceFilters): MissionAttendanceRow[] {
  let result = rows;

  if (filters?.role && filters.role !== 'all') {
    result = result.filter((r) => r.role === filters.role);
  }

  if (filters?.turma) {
    result = result.filter((r) => r.turmaId === filters.turma);
  }

  if (filters?.status) {
    result = result.filter((r) => r.state === filters.status);
  }

  if (filters?.q?.trim()) {
    const s = filters.q.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.nr.toLowerCase().includes(s) ||
        (r.warName || '').toLowerCase().includes(s) ||
        r.fullName.toLowerCase().includes(s),
    );
  }

  return result;
}

async function loadMissionAttendanceData(missionSlug: string) {
  const supabase = createServiceRoleClient();

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('id, name, slug')
    .eq('slug', missionSlug)
    .maybeSingle();

  if (missionError || !mission) {
    return null;
  }

  const { data: volunteersRaw } = await supabase
    .from('volunteers')
    .select('id, seq, grad, nr, full_name, war_name')
    .order('seq', { ascending: true, nullsFirst: false });

  const { data: appointmentsRaw } = await supabase
    .from('appointments')
    .select(`
      id,
      volunteer_id,
      attendance_status,
      donation_dates (date),
      donation_time_slots (time)
    `)
    .eq('mission_id', mission.id)
    .eq('status', 'confirmed');

  const appointmentsByVolunteer = new Map<string, MissionAppointmentRecord[]>();

  for (const appt of appointmentsRaw || []) {
    const dates = appt.donation_dates as { date: string } | { date: string }[] | null;
    const d = Array.isArray(dates) ? dates[0] : dates;
    const slots = appt.donation_time_slots as { time: string } | { time: string }[] | null;
    const slot = Array.isArray(slots) ? slots[0] : slots;

    const record: MissionAppointmentRecord = {
      id: appt.id,
      volunteer_id: appt.volunteer_id,
      attendance_status: appt.attendance_status as AttendanceStatus,
      scheduled_date: d?.date ?? null,
      scheduled_time: slot?.time ?? null,
    };

    const list = appointmentsByVolunteer.get(appt.volunteer_id) || [];
    list.push(record);
    appointmentsByVolunteer.set(appt.volunteer_id, list);
  }

  const allRows: MissionAttendanceRow[] = [];
  for (const volunteer of volunteersRaw || []) {
    const appointments = appointmentsByVolunteer.get(volunteer.id) || [];
    const row = buildVolunteerRow(volunteer, appointments);
    if (row) allRows.push(row);
  }

  return { mission, allRows };
}

export async function getMissionAttendanceSummary(
  missionSlug: string,
  filters?: Pick<MissionAttendanceFilters, 'role'>,
): Promise<{ mission: { id: string; name: string; slug: string } | null; summary: MissionAttendanceSummary }> {
  const data = await loadMissionAttendanceData(missionSlug);
  if (!data) {
    return {
      mission: null,
      summary: { completed: 0, scheduled: 0, noShow: 0, notScheduled: 0, total: 0 },
    };
  }

  const filtered = applyFilters(data.allRows, { role: filters?.role ?? 'atirador' });
  return { mission: data.mission, summary: countByState(filtered) };
}

export async function getMissionAttendanceRoster(
  missionSlug: string,
  filters?: MissionAttendanceFilters,
): Promise<{ mission: { id: string; name: string; slug: string } | null; rows: MissionAttendanceRow[]; summary: MissionAttendanceSummary }> {
  const data = await loadMissionAttendanceData(missionSlug);
  if (!data) {
    return {
      mission: null,
      rows: [],
      summary: { completed: 0, scheduled: 0, noShow: 0, notScheduled: 0, total: 0 },
    };
  }

  const roleFilter = filters?.role === undefined ? 'atirador' : filters.role;
  const filtered = applyFilters(data.allRows, { ...filters, role: roleFilter });
  filtered.sort((a, b) => (a.warName || a.fullName).localeCompare(b.warName || b.fullName, 'pt-BR'));

  return {
    mission: data.mission,
    rows: filtered,
    summary: countByState(filtered),
  };
}

export async function getCompletedCountForMission(missionSlug: string): Promise<number> {
  const { summary } = await getMissionAttendanceSummary(missionSlug, { role: 'atirador' });
  return summary.completed;
}
