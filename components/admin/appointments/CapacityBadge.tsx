type CapacityBadgeProps = {
  booked: number;
  capacity: number;
  isFull?: boolean;
  compact?: boolean;
};

export function CapacityBadge({ booked, capacity, isFull, compact }: CapacityBadgeProps) {
  const full = isFull ?? booked >= capacity;
  const remaining = Math.max(0, capacity - booked);

  if (full) {
    return (
      <span className="badge badge-closed">
        {compact ? 'Cheia' : 'Capacidade máxima'}
      </span>
    );
  }

  return (
    <span className="badge badge-open">
      {compact ? `${booked}/${capacity}` : `${remaining} vagas disponíveis`}
    </span>
  );
}
