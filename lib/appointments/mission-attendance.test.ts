import { describe, expect, it } from 'vitest';
import {
  deriveMissionAttendanceState,
  getMissionAttendanceStateLabel,
  pickActiveAppointment,
  type MissionAppointmentRecord,
} from '@/lib/appointments/mission-attendance';

function appt(overrides: Partial<MissionAppointmentRecord>): MissionAppointmentRecord {
  return {
    id: '1',
    volunteer_id: 'v1',
    attendance_status: 'pending',
    scheduled_date: '2025-06-02',
    scheduled_time: '07:00',
    ...overrides,
  };
}

describe('deriveMissionAttendanceState', () => {
  it('returns not_scheduled when there are no appointments', () => {
    expect(deriveMissionAttendanceState([])).toBe('not_scheduled');
  });

  it('returns scheduled for pending appointment', () => {
    expect(deriveMissionAttendanceState([{ attendance_status: 'pending' }])).toBe('scheduled');
  });

  it('returns completed when any appointment is completed', () => {
    expect(
      deriveMissionAttendanceState([
        { attendance_status: 'no_show' },
        { attendance_status: 'completed' },
      ]),
    ).toBe('completed');
  });

  it('returns no_show when only no_show records exist', () => {
    expect(deriveMissionAttendanceState([{ attendance_status: 'no_show' }])).toBe('no_show');
  });

  it('returns scheduled when pending exists alongside no_show', () => {
    expect(
      deriveMissionAttendanceState([
        { attendance_status: 'no_show' },
        { attendance_status: 'pending' },
      ]),
    ).toBe('scheduled');
  });
});

describe('pickActiveAppointment', () => {
  it('prefers completed over pending', () => {
    const completed = appt({ id: 'c', attendance_status: 'completed' });
    const pending = appt({ id: 'p', attendance_status: 'pending' });
    expect(pickActiveAppointment([pending, completed])?.id).toBe('c');
  });

  it('prefers pending over no_show', () => {
    const pending = appt({ id: 'p', attendance_status: 'pending' });
    const noShow = appt({ id: 'n', attendance_status: 'no_show', scheduled_date: '2025-06-01' });
    expect(pickActiveAppointment([noShow, pending])?.id).toBe('p');
  });

  it('returns latest no_show when no active booking', () => {
    const older = appt({ id: 'old', attendance_status: 'no_show', scheduled_date: '2025-05-01' });
    const newer = appt({ id: 'new', attendance_status: 'no_show', scheduled_date: '2025-06-01' });
    expect(pickActiveAppointment([older, newer])?.id).toBe('new');
  });
});

describe('getMissionAttendanceStateLabel', () => {
  it('returns Portuguese labels', () => {
    expect(getMissionAttendanceStateLabel('completed')).toBe('Realizado');
    expect(getMissionAttendanceStateLabel('scheduled')).toBe('Agendado');
    expect(getMissionAttendanceStateLabel('no_show')).toBe('Não compareceu');
    expect(getMissionAttendanceStateLabel('not_scheduled')).toBe('Pendente');
  });
});
