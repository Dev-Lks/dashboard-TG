import { describe, expect, it } from 'vitest';
import {
  donationProfiles,
  getDonationDayInfo,
  getDonationProfileKey,
  getSuggestedProfileKey,
  getTimeRangeForDay,
  isValidMissionDay,
} from './profiles';

describe('isValidMissionDay', () => {
  it('accepts any day', () => {
    expect(isValidMissionDay('2025-06-02')).toBe(true);
    expect(isValidMissionDay('2025-06-05')).toBe(true);
    expect(isValidMissionDay('2025-06-03')).toBe(true);
    expect(isValidMissionDay('2025-06-07')).toBe(true);
  });
});

describe('getSuggestedProfileKey', () => {
  it('suggests monday, thursday, or generic', () => {
    expect(getSuggestedProfileKey('2025-06-02')).toBe('monday');
    expect(getSuggestedProfileKey('2025-06-05')).toBe('thursday');
    expect(getSuggestedProfileKey('2025-06-03')).toBe('generic');
  });
});

describe('getDonationProfileKey', () => {
  it('returns suggested profile keys', () => {
    expect(getDonationProfileKey('2025-06-02')).toBe('monday');
    expect(getDonationProfileKey('2025-06-05')).toBe('thursday');
    expect(getDonationProfileKey('2025-06-03')).toBe('generic');
  });
});

describe('getDonationDayInfo', () => {
  it('returns Monday schedule metadata', () => {
    const info = getDonationDayInfo('2025-06-02');
    expect(info.profileKey).toBe('monday');
    expect(info.isAutomatic).toBe(true);
    expect(info.timeRange).toBe(donationProfiles.monday.tableTimeRange);
  });

  it('returns Thursday schedule metadata', () => {
    const info = getDonationDayInfo('2025-06-05');
    expect(info.profileKey).toBe('thursday');
  });

  it('returns generic profile for other weekdays', () => {
    const info = getDonationDayInfo('2025-06-03');
    expect(info.profileKey).toBe('generic');
    expect(info.isAutomatic).toBe(true);
  });
});

describe('getTimeRangeForDay', () => {
  it('returns table time range for suggested profile', () => {
    expect(getTimeRangeForDay('2025-06-02')).toBe('07:00 a 10:00');
    expect(getTimeRangeForDay('2025-06-05')).toBe('13:00 a 17:00');
    expect(getTimeRangeForDay('2025-06-03')).toBe('08:00 a 12:00');
  });
});
