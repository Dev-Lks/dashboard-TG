import { describe, expect, it } from 'vitest';
import { resolveScheduleMode } from '@/lib/dates/schedule-mode';

describe('resolveScheduleMode', () => {
  it('uses date mode when mission default is slots', () => {
    expect(resolveScheduleMode('presence_only', 'slots')).toBe('presence_only');
    expect(resolveScheduleMode('slots', 'slots')).toBe('slots');
  });

  it('forces presence_only when mission default is presence_only', () => {
    expect(resolveScheduleMode('slots', 'presence_only')).toBe('presence_only');
    expect(resolveScheduleMode('presence_only', 'presence_only')).toBe('presence_only');
  });

  it('falls back to date mode when mission default is missing', () => {
    expect(resolveScheduleMode('slots', null)).toBe('slots');
    expect(resolveScheduleMode('presence_only', undefined)).toBe('presence_only');
  });
});
