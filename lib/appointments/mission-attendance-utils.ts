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

export function buildVolunteerRow(
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

export function countByState(rows: MissionAttendanceRow[]): MissionAttendanceSummary {
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

export function applyFilters(rows: MissionAttendanceRow[], filters?: MissionAttendanceFilters): MissionAttendanceRow[] {
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
