import { CapacityBadge } from '@/components/admin/appointments/CapacityBadge';

type DateCapacityIndicatorProps = {
  booked: number;
  capacity: number;
  isFull: boolean;
};

export function DateCapacityIndicator({ booked, capacity, isFull }: DateCapacityIndicatorProps) {
  const percent = Math.min(100, Math.round((booked / capacity) * 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="info-label">Ocupação</span>
        <CapacityBadge booked={booked} capacity={capacity} isFull={isFull} compact />
      </div>
      <div className="progress-track mt-2">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
        {booked}/{capacity} confirmados • {Math.max(0, capacity - booked)} vagas restantes
      </div>
    </div>
  );
}
