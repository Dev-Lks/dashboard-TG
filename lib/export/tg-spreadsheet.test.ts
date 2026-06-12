import { describe, expect, it } from 'vitest';
import { parseExcelDateValue } from '@/lib/volunteer-import';
import {
  filterAppointmentsByTurma,
  filterVolunteersByTurma,
  formatDateBanner,
  formatGradForExport,
  toExcelDateSerial,
  type ExportAppointment,
  type ExportVolunteer,
} from './tg-spreadsheet';

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
    { created_at: '', volunteers: { seq: 10, grad: 'ATIRADOR', nr: '10', full_name: 'A', war_name: 'A', birth_date: null, phone: null }, donation_dates: { date: '2025-06-02' } },
    { created_at: '', volunteers: { seq: 90, grad: 'ATIRADOR', nr: '90', full_name: 'B', war_name: 'B', birth_date: null, phone: null }, donation_dates: { date: '2025-06-02' } },
  ];

  it('filters appointments by volunteer turma', () => {
    expect(filterAppointmentsByTurma(appointments, 't1')).toHaveLength(1);
    expect(filterAppointmentsByTurma(appointments, 't3')).toHaveLength(1);
  });
});

describe('formatDateBanner', () => {
  it('formats Monday mission banner', () => {
    expect(formatDateBanner('2025-06-02')).toBe('2 JUN (SEG) - 07h às 10h');
  });

  it('formats Thursday mission banner', () => {
    expect(formatDateBanner('2025-06-05')).toBe('5 JUN (QUI) - 13h às 17h');
  });
});
