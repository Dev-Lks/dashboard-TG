import { describe, expect, it } from 'vitest';
import {
  donationProfiles,
  getDonationDayInfo,
  getDonationProfileKey,
  getTimeRangeForDay,
  isValidMissionDay,
} from './profiles';

describe('isValidMissionDay', () => {
  it('accepts Monday and Thursday only', () => {
    expect(isValidMissionDay('2025-06-02')).toBe(true); // Monday
    expect(isValidMissionDay('2025-06-05')).toBe(true); // Thursday
    expect(isValidMissionDay('2025-06-03')).toBe(false); // Tuesday
    expect(isValidMissionDay('2025-06-07')).toBe(false); // Saturday
  });
});

describe('getDonationProfileKey', () => {
  it('returns monday or thursday profile keys', () => {
    expect(getDonationProfileKey('2025-06-02')).toBe('monday');
    expect(getDonationProfileKey('2025-06-05')).toBe('thursday');
    expect(getDonationProfileKey('2025-06-03')).toBeNull();
  });
});

describe('getDonationDayInfo', () => {
  it('returns Monday schedule metadata', () => {
    const info = getDonationDayInfo('2025-06-02');
    expect(info.profileKey).toBe('monday');
    expect(info.shortLabel).toBe('SEG');
    expect(info.isAutomatic).toBe(true);
    expect(info.timeRange).toBe(donationProfiles.monday.tableTimeRange);
  });

  it('returns Thursday schedule metadata', () => {
    const info = getDonationDayInfo('2025-06-05');
    expect(info.profileKey).toBe('thursday');
    expect(info.shortLabel).toBe('QUI');
  });

  it('marks other days as non-automatic', () => {
    const info = getDonationDayInfo('2025-06-03');
    expect(info.profileKey).toBeNull();
    expect(info.isAutomatic).toBe(false);
    expect(info.shortLabel).toBe('—');
  });
});

describe('getTimeRangeForDay', () => {
  it('returns table time range for mission days', () => {
    expect(getTimeRangeForDay('2025-06-02')).toBe('07:00 a 10:00');
    expect(getTimeRangeForDay('2025-06-05')).toBe('13:00 a 17:00');
  });
});
