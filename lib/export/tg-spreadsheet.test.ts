import { describe, expect, it } from 'vitest';
import { parseExcelDateValue } from '@/lib/volunteer-import';
import { formatDateBanner, formatGradForExport, toExcelDateSerial } from './tg-spreadsheet';

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

describe('formatDateBanner', () => {
  it('formats Monday mission banner', () => {
    expect(formatDateBanner('2025-06-02')).toBe('2 JUN (SEG) - 7h às 10h');
  });

  it('formats Thursday mission banner', () => {
    expect(formatDateBanner('2025-06-05')).toBe('5 JUN (QUI) - 13h às 17h');
  });
});
