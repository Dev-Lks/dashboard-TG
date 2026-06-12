import { describe, expect, it } from 'vitest';
import { generateTimeSlots, detectPreset } from './slot-generator';

describe('generateTimeSlots', () => {
  it('generates 30-min slots inclusive of end', () => {
    expect(generateTimeSlots('07:00', '10:00', 30)).toEqual([
      '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00',
    ]);
  });

  it('returns empty for invalid interval', () => {
    expect(generateTimeSlots('07:00', '10:00', 0)).toEqual([]);
  });
});

describe('detectPreset', () => {
  it('detects morning preset', () => {
    expect(detectPreset('07:00', '10:00', 30)).toBe('morning');
  });

  it('detects custom', () => {
    expect(detectPreset('08:00', '12:00', 30)).toBe('custom');
  });
});
