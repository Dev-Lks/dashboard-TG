import { describe, expect, it } from 'vitest';
import { parseExcelDateValue } from '@/lib/volunteer-import';
import { formatDateBanner } from '@/lib/dates/schedule-display';
import {
  buildFullTgWorkbook,
  filterAppointmentsByTurma,
  filterVolunteersByTurma,
  formatGradForExport,
  formatAttendanceStatusForExport,
  groupAppointmentsByDate,
  sortAppointmentsByWarName,
  splitByRole,
  toExcelDateSerial,
  type ExportAppointment,
  type ExportVolunteer,
} from './tg-spreadsheet';

function appt(
  overrides: Partial<ExportAppointment> & { volunteers: ExportVolunteer },
): ExportAppointment {
  return {
    created_at: '',
    time: null,
    donation_dates: { date: '2025-06-02' },
    ...overrides,
  };
}

describe('toExcelDateSerial', () => {
  it('returns empty string for missing dates', () => {
    expect(toExcelDateSerial(null)).toBe('');
    expect(toExcelDateSerial(undefined)).toBe('');
  });

  it('converts ISO dates to Excel serial numbers', () => {
    expect(toExcelDateSerial('2024-01-15')).toBe(45306);
  });

  it('round-trips with parseExcelDateValue', () => {
    const serial = toExcelDateSerial('2024-01-15');
    expect(parseExcelDateValue(serial)).toBe('2024-01-15');
  });
});

describe('formatGradForExport', () => {
  it('normalizes monitor and atirador grades', () => {
    expect(formatGradForExport('Monitor')).toBe('MONITOR');
    expect(formatGradForExport('Atirador')).toBe('ATIRADOR');
  });

  it('uppercases unknown grades', () => {
    expect(formatGradForExport('cabo')).toBe('CABO');
    expect(formatGradForExport(null)).toBe('');
  });
});

describe('filterVolunteersByTurma', () => {
  const volunteers: ExportVolunteer[] = [
    { seq: 5, grad: 'ATIRADOR', nr: '5', full_name: 'A', war_name: 'A', birth_date: null, phone: null },
    { seq: 50, grad: 'ATIRADOR', nr: '50', full_name: 'B', war_name: 'B', birth_date: null, phone: null },
  ];

  it('filters by turma seq range', () => {
    expect(filterVolunteersByTurma(volunteers, 't1')).toHaveLength(1);
    expect(filterVolunteersByTurma(volunteers, 't2')).toHaveLength(1);
  });
});

describe('filterAppointmentsByTurma', () => {
  const appointments: ExportAppointment[] = [
    appt({ volunteers: { seq: 10, grad: 'ATIRADOR', nr: '10', full_name: 'A', war_name: 'A', birth_date: null, phone: null } }),
    appt({ volunteers: { seq: 90, grad: 'ATIRADOR', nr: '90', full_name: 'B', war_name: 'B', birth_date: null, phone: null } }),
  ];

  it('filters appointments by volunteer turma', () => {
    expect(filterAppointmentsByTurma(appointments, 't1')).toHaveLength(1);
    expect(filterAppointmentsByTurma(appointments, 't3')).toHaveLength(1);
  });
});

describe('formatAttendanceStatusForExport', () => {
  it('maps attendance statuses to export labels', () => {
    expect(formatAttendanceStatusForExport('completed')).toBe('Realizado');
    expect(formatAttendanceStatusForExport('pending')).toBe('Agendado');
    expect(formatAttendanceStatusForExport('no_show')).toBe('Não compareceu');
    expect(formatAttendanceStatusForExport(null)).toBe('Pendente');
  });
});

describe('formatDateBanner', () => {
  it('formats banner with slot times', () => {
    expect(formatDateBanner('2025-06-02', ['07:00', '10:00'])).toBe('2 JUN (SEG) — 07:00 a 10:00');
  });

  it('formats presence-only banner', () => {
    expect(formatDateBanner('2025-06-05', [])).toBe('5 JUN (QUI) — Presença confirmada');
  });
});

describe('splitByRole', () => {
  const appointments: ExportAppointment[] = [
    appt({ volunteers: { seq: 1, grad: 'Monitor', nr: '1', full_name: 'Zeca', war_name: 'Zeca', birth_date: null, phone: null } }),
    appt({ volunteers: { seq: 2, grad: 'Atirador', nr: '2', full_name: 'Ana', war_name: 'Ana', birth_date: null, phone: null } }),
    appt({ volunteers: { seq: 3, grad: 'Atirador', nr: '3', full_name: 'Bruno', war_name: 'Bruno', birth_date: null, phone: null } }),
  ];

  it('splits monitors and atiradores', () => {
    const { monitors, atiradores } = splitByRole(appointments);
    expect(monitors).toHaveLength(1);
    expect(atiradores).toHaveLength(2);
  });

  it('sorts each group by war name', () => {
    const { atiradores } = splitByRole(appointments);
    expect(atiradores.map((a) => a.volunteers?.war_name)).toEqual(['Ana', 'Bruno']);
  });
});

describe('groupAppointmentsByDate', () => {
  const appointments: ExportAppointment[] = [
    appt({ donation_dates: { date: '2025-06-02' }, volunteers: { seq: 1, grad: 'Monitor', nr: '1', full_name: 'A', war_name: 'A', birth_date: null, phone: null } }),
    appt({ donation_dates: { date: '2025-06-05' }, volunteers: { seq: 2, grad: 'Atirador', nr: '2', full_name: 'B', war_name: 'B', birth_date: null, phone: null } }),
    appt({ donation_dates: { date: '2025-06-02' }, volunteers: { seq: 3, grad: 'Atirador', nr: '3', full_name: 'C', war_name: 'C', birth_date: null, phone: null } }),
  ];

  it('groups appointments by donation date', () => {
    const byDate = groupAppointmentsByDate(appointments);
    expect(byDate.get('2025-06-02')).toHaveLength(2);
    expect(byDate.get('2025-06-05')).toHaveLength(1);
  });
});

describe('sortAppointmentsByWarName', () => {
  it('sorts by war name in pt-BR locale', () => {
    const appointments: ExportAppointment[] = [
      appt({ volunteers: { seq: 1, grad: 'Atirador', nr: '1', full_name: 'Zeca', war_name: 'Zeca', birth_date: null, phone: null } }),
      appt({ volunteers: { seq: 2, grad: 'Atirador', nr: '2', full_name: 'Ana', war_name: 'Ana', birth_date: null, phone: null } }),
    ];
    const sorted = sortAppointmentsByWarName(appointments);
    expect(sorted.map((a) => a.volunteers?.war_name)).toEqual(['Ana', 'Zeca']);
  });
});

describe('buildFullTgWorkbook', () => {
  it('creates a single POR DATA sheet without Mon e Atdr', () => {
    const appointments: ExportAppointment[] = [
      appt({ donation_dates: { date: '2025-06-02' }, volunteers: { seq: 1, grad: 'Monitor', nr: '1', full_name: 'A', war_name: 'A', birth_date: null, phone: null } }),
    ];
    const dates = [{ date: '2025-06-02', is_active: true }];

    const wb = buildFullTgWorkbook(appointments, dates);

    expect(wb.worksheets).toHaveLength(1);
    expect(wb.worksheets[0].name).toBe('POR DATA');
    expect(wb.getWorksheet('Mon e Atdr')).toBeUndefined();
    expect(wb.getWorksheet('VOLUNTÁRIOS')).toBeUndefined();
  });
});
