import type { MissionAttendanceState } from '@/lib/types';
import { getMissionAttendanceStateLabel } from '@/lib/appointments/mission-attendance';

type MissionAttendanceStatusBadgeProps = {
  state: MissionAttendanceState;
};

const BADGE_CLASS: Record<MissionAttendanceState, string> = {
  completed: 'badge badge-confirmed',
  scheduled: 'badge badge-open',
  no_show: 'badge badge-closed',
  not_scheduled: 'badge badge-command',
};

export function MissionAttendanceStatusBadge({ state }: MissionAttendanceStatusBadgeProps) {
  return (
    <span className={BADGE_CLASS[state]}>
      {getMissionAttendanceStateLabel(state)}
    </span>
  );
}
