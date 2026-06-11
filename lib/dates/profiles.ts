import { getDay, parseISO } from 'date-fns';

export const donationProfiles = {
  monday: {
    shortLabel: 'SEG',
    dayLabel: 'Segunda-feira',
    dayIndex: 1,
    timeRange: '07h às 10h',
    tableTimeRange: '07:00 a 10:00',
    times: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'],
  },
  thursday: {
    shortLabel: 'QUI',
    dayLabel: 'Quinta-feira',
    dayIndex: 4,
    timeRange: '13h às 17h',
    tableTimeRange: '13:00 a 17:00',
    times: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
  },
} as const;

export type DonationProfileKey = keyof typeof donationProfiles;

export function isValidMissionDay(dateStr: string): boolean {
  const dow = getDay(parseISO(dateStr));
  return dow === donationProfiles.monday.dayIndex || dow === donationProfiles.thursday.dayIndex;
}

export function getDonationProfileKey(dateStr: string): DonationProfileKey | null {
  const dow = getDay(parseISO(dateStr));
  if (dow === donationProfiles.monday.dayIndex) return 'monday';
  if (dow === donationProfiles.thursday.dayIndex) return 'thursday';
  return null;
}

export function getDonationDayInfo(date: string) {
  const dow = getDay(parseISO(date));
  if (dow === donationProfiles.monday.dayIndex) {
    return {
      dayLabel: donationProfiles.monday.dayLabel,
      shortLabel: donationProfiles.monday.shortLabel,
      timeRange: donationProfiles.monday.tableTimeRange,
      isAutomatic: true,
      profileKey: 'monday' as DonationProfileKey,
    };
  }
  if (dow === donationProfiles.thursday.dayIndex) {
    return {
      dayLabel: donationProfiles.thursday.dayLabel,
      shortLabel: donationProfiles.thursday.shortLabel,
      timeRange: donationProfiles.thursday.tableTimeRange,
      isAutomatic: true,
      profileKey: 'thursday' as DonationProfileKey,
    };
  }
  return {
    dayLabel: 'Outro dia',
    shortLabel: '—',
    timeRange: 'Sem geração automática',
    isAutomatic: false,
    profileKey: null,
  };
}

export function getTimeRangeForDay(dateStr: string): string {
  const info = getDonationDayInfo(dateStr);
  return info.timeRange;
}
