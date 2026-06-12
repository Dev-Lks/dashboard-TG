import { describe, expect, it } from 'vitest';
import { formatDayName, formatTimeRangeFromSlots, formatDateBanner } from './schedule-display';

describe('schedule-display', () => {
  it('formats day name in Portuguese', () => {
    expect(formatDayName('2025-06-02')).toBe('segunda-feira');
  });

  it('formats time range from slots', () => {
    expect(formatTimeRangeFromSlots(['07:00', '07:30', '10:00'])).toBe('07h às 10h');
  });

  it('shows presence when no slots', () => {
    expect(formatTimeRangeFromSlots([])).toBe('Presença no dia');
  });

  it('formats date banner', () => {
    expect(formatDateBanner('2025-06-05', ['13:00', '17:00'])).toBe('5 JUN (QUI) — 13:00 a 17:00');
  });
});
