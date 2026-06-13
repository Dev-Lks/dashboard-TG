import type { ScheduleMode } from '@/lib/types';

export function resolveScheduleMode(
  dateMode: ScheduleMode,
  missionDefaultMode?: ScheduleMode | null,
): ScheduleMode {
  if (missionDefaultMode === 'presence_only') {
    return 'presence_only';
  }
  return dateMode;
}
