import { describe, expect, it } from 'vitest';
import {
  birthDatesMatch,
  buildBirthDate,
  daysInMonth,
  formatBirthDateBR,
  getBirthYearRange,
  normalizeBirthDate,
} from './birth-date';

describe('normalizeBirthDate', () => {
  it('accepts valid YYYY-MM-DD', () => {
    expect(normalizeBirthDate('2005-08-29')).toBe('2005-08-29');
  });

  it('rejects invalid dates', () => {
    expect(normalizeBirthDate('2005-02-30')).toBeNull();
    expect(normalizeBirthDate('05-08-29')).toBeNull();
    expect(normalizeBirthDate('not-a-date')).toBeNull();
  });
});

describe('buildBirthDate', () => {
  it('builds padded YYYY-MM-DD from parts', () => {
    expect(buildBirthDate(8, 5, 2005)).toBe('2005-05-08');
    expect(buildBirthDate(29, 8, 2005)).toBe('2005-08-29');
  });

  it('returns null for invalid combinations', () => {
    expect(buildBirthDate(31, 2, 2005)).toBeNull();
  });
});

describe('daysInMonth', () => {
  it('returns correct days for months', () => {
    expect(daysInMonth(2, 2004)).toBe(29);
    expect(daysInMonth(2, 2005)).toBe(28);
    expect(daysInMonth(8, 2005)).toBe(31);
  });
});

describe('formatBirthDateBR', () => {
  it('formats valid dates in Portuguese', () => {
    expect(formatBirthDateBR('2005-08-29')).toBe('29 de agosto de 2005');
  });

  it('returns null for invalid dates', () => {
    expect(formatBirthDateBR('2005-02-30')).toBeNull();
  });
});

describe('getBirthYearRange', () => {
  it('returns a sensible year window', () => {
    const range = getBirthYearRange(new Date('2025-06-12'));
    expect(range.min).toBe(1990);
    expect(range.max).toBe(2015);
  });
});

describe('birthDatesMatch', () => {
  it('matches equal dates', () => {
    expect(birthDatesMatch('2005-08-29', '2005-08-29')).toBe(true);
  });

  it('matches when stored value includes time suffix', () => {
    expect(birthDatesMatch('2005-08-29T00:00:00.000Z', '2005-08-29')).toBe(true);
  });

  it('rejects mismatched dates', () => {
    expect(birthDatesMatch('2005-08-29', '2005-08-30')).toBe(false);
  });

  it('rejects null stored date', () => {
    expect(birthDatesMatch(null, '2005-08-29')).toBe(false);
  });
});
