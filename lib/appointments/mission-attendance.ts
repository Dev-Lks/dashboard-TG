import { createServiceRoleClient } from '@/lib/supabase/server';
import type { AttendanceStatus } from '@/lib/types';
import {
  applyFilters,
  buildVolunteerRow,
  countByState,
  type MissionAppointmentRecord,
  type MissionAttendanceFilters,
  type MissionAttendanceRow,
  type MissionAttendanceSummary,
} from '@/lib/appointments/mission-attendance-utils';
import { compareByNr } from '@/lib/volunteers/sort';

export type {
  MissionAppointmentRecord,
  MissionAttendanceFilters,
  MissionAttendanceRow,
  MissionAttendanceSummary,
} from '@/lib/appointments/mission-attendance-utils';

export {
  deriveMissionAttendanceState,
  getMissionAttendanceStateLabel,
  pickActiveAppointment,
} from '@/lib/appointments/mission-attendance-utils';

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

  if (roleFilter === 'atirador') {
    filtered.sort((a, b) => compareByNr(a.nr, b.nr));
  } else if (roleFilter === 'monitor') {
    filtered.sort((a, b) =>
      (a.warName || a.fullName).localeCompare(b.warName || b.fullName, 'pt-BR'),
    );
  } else {
    filtered.sort((a, b) => {
      if (a.role === 'atirador' && b.role === 'atirador') return compareByNr(a.nr, b.nr);
      if (a.role === 'monitor' && b.role === 'monitor') {
        return (a.warName || a.fullName).localeCompare(b.warName || b.fullName, 'pt-BR');
      }
      if (a.role === 'monitor') return -1;
      if (b.role === 'monitor') return 1;
      return compareByNr(a.nr, b.nr);
    });
  }

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
