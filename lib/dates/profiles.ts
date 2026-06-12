import { format, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const donationProfiles = {
  monday: {
    shortLabel: 'SEG',
    dayLabel: 'Segunda-feira',
    profileLabel: 'Segunda (07h–10h)',
    dayIndex: 1,
    timeRange: '07h às 10h',
    tableTimeRange: '07:00 a 10:00',
    times: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'],
  },
  thursday: {
    shortLabel: 'QUI',
    dayLabel: 'Quinta-feira',
    profileLabel: 'Quinta (13h–17h)',
    dayIndex: 4,
    timeRange: '13h às 17h',
    tableTimeRange: '13:00 a 17:00',
    times: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
  },
  generic: {
    shortLabel: 'GEN',
    dayLabel: 'Genérico',
    profileLabel: 'Genérico (08h–12h)',
    dayIndex: -1,
    timeRange: '08h às 12h',
    tableTimeRange: '08:00 a 12:00',
    times: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'],
  },
} as const;

export type DonationProfileKey = keyof typeof donationProfiles;

export const PROFILE_KEYS: DonationProfileKey[] = ['monday', 'thursday', 'generic'];

export function isDonationProfileKey(value: string): value is DonationProfileKey {
  return PROFILE_KEYS.includes(value as DonationProfileKey);
}

export function isValidMissionDay(_dateStr: string): boolean {
  return true;
}

export function getSuggestedProfileKey(dateStr: string): DonationProfileKey {
  const dow = getDay(parseISO(dateStr));
  if (dow === donationProfiles.monday.dayIndex) return 'monday';
  if (dow === donationProfiles.thursday.dayIndex) return 'thursday';
  return 'generic';
}

/** @deprecated Use getSuggestedProfileKey — kept for compatibility */
export function getDonationProfileKey(dateStr: string): DonationProfileKey | null {
  return getSuggestedProfileKey(dateStr);
}

export function getDonationDayInfo(date: string) {
  const parsed = parseISO(date);
  const dow = getDay(parsed);
  const dayLabel = format(parsed, 'EEEE', { locale: ptBR });
  const shortLabel = format(parsed, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3);
  const suggestedProfileKey = getSuggestedProfileKey(date);
  const profile = donationProfiles[suggestedProfileKey];

  return {
    dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
    shortLabel,
    timeRange: profile.tableTimeRange,
    isAutomatic: true,
    profileKey: suggestedProfileKey,
  };
}

export function getTimeRangeForDay(dateStr: string): string {
  const info = getDonationDayInfo(dateStr);
  return info.timeRange;
}

export function getProfileTimeRange(profileKey: DonationProfileKey): string {
  return donationProfiles[profileKey].timeRange;
}
