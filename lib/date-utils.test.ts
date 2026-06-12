import { describe, expect, it } from 'vitest';
import { formatDateBR } from './date-utils';

describe('formatDateBR', () => {
  it('formats ISO date as DD/MM/YYYY', () => {
    expect(formatDateBR('2025-06-09')).toBe('09/06/2025');
  });

  it('returns original string when format is invalid', () => {
    expect(formatDateBR('invalid')).toBe('invalid');
    expect(formatDateBR('2025-06')).toBe('2025-06');
  });
});
