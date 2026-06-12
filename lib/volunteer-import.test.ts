import { describe, expect, it } from 'vitest';
import { chooseVolunteerSheet, parseExcelDateValue, parseVolunteerRow } from './volunteer-import';

describe('parseExcelDateValue', () => {
  it('returns null for empty values', () => {
    expect(parseExcelDateValue(null)).toBeNull();
    expect(parseExcelDateValue('')).toBeNull();
  });

  it('formats Date objects as YYYY-MM-DD', () => {
    expect(parseExcelDateValue(new Date('1990-05-15T12:00:00Z'))).toBe('1990-05-15');
  });

  it('parses Brazilian DD/MM/YYYY strings', () => {
    expect(parseExcelDateValue('15/05/1990')).toBe('1990-05-15');
    expect(parseExcelDateValue('05/03/2001')).toBe('2001-03-05');
  });

  it('parses Excel serial numbers consistently with export helper', () => {
    const serial = 45306;
    expect(parseExcelDateValue(serial)).toBe('2024-01-15');
  });

  it('rejects invalid serial numbers', () => {
    expect(parseExcelDateValue(-1)).toBeNull();
    expect(parseExcelDateValue(999999)).toBeNull();
  });
});

describe('parseVolunteerRow', () => {
  it('returns null when NR is missing', () => {
    expect(parseVolunteerRow([1, 'MONITOR', null, 'Nome'])).toBeNull();
  });

  it('maps spreadsheet columns to volunteer fields', () => {
    const row = parseVolunteerRow([10, 'MONITOR', '123', 'Nome Completo', 'Guerra', '15/05/1990', '34999999999']);
    expect(row).toEqual({
      seq: 10,
      grad: 'MONITOR',
      nr: '123',
      nome: 'Nome Completo',
      nome_guerra: 'Guerra',
      data_nascimento: '1990-05-15',
      telefone: '34999999999',
    });
  });
});

describe('chooseVolunteerSheet', () => {
  it('prefers Mon e Atdr tab', () => {
    const wb = {
      SheetNames: ['Outra', 'Mon e Atdr'],
      Sheets: { 'Mon e Atdr': { A1: {} } },
    };
    expect(chooseVolunteerSheet(wb)).toEqual({ ws: wb.Sheets['Mon e Atdr'], name: 'Mon e Atdr' });
  });

  it('falls back to VOLUNTÁRIOS then first sheet', () => {
    const wb = {
      SheetNames: ['Planilha1', 'VOLUNTÁRIOS'],
      Sheets: { Planilha1: { A1: {} }, 'VOLUNTÁRIOS': { B1: {} } },
    };
    expect(chooseVolunteerSheet(wb)).toEqual({ ws: wb.Sheets['VOLUNTÁRIOS'], name: 'VOLUNTÁRIOS' });

    const onlyFirst = {
      SheetNames: ['Planilha1'],
      Sheets: { Planilha1: { A1: {} } },
    };
    expect(chooseVolunteerSheet(onlyFirst)).toEqual({ ws: onlyFirst.Sheets.Planilha1, name: 'Planilha1' });
  });
});
