'use client';

import { Users } from 'lucide-react';
import type { AvailableDate } from '@/lib/types';
import { formatDateBR } from '@/lib/date-utils';

interface Props {
  date: AvailableDate;
  selected: boolean;
  onSelect: (d: AvailableDate) => void;
}

export function DateAvailabilityCard({ date, selected, onSelect }: Props) {
  const isClosed = date.is_full || !date.remaining;
  const percent = Math.min(100, Math.round((date.booked / date.capacity) * 100));

  return (
    <button
      onClick={() => !isClosed && onSelect(date)}
      disabled={isClosed}
      className={`card w-full p-5 text-left transition-all ${selected ? 'ring-2 ring-[var(--olive)]' : 'hover:border-[var(--olive)]'} ${isClosed ? 'cursor-not-allowed opacity-65' : 'active:bg-[var(--surface-muted)]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-[var(--olive-900)]">{date.day_name}, {formatDateBR(date.date)}</div>
          <div className="mt-0.5 font-semibold text-[var(--olive)]">{date.time_range}</div>
        </div>
        <div className={`badge ${isClosed ? 'badge-closed' : 'badge-open'}`}>
          {isClosed ? 'Cheia' : 'Disponível'}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Users className="h-4 w-4" />
        <span className="font-semibold">{date.booked} de {date.capacity} vagas preenchidas</span>
      </div>
      <div className="progress-track mt-3" aria-label={`Ocupação ${percent}%`}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      {!isClosed && (
        <div className="mt-2 text-sm font-bold text-[var(--success)]">
          {date.remaining} vagas disponíveis
        </div>
      )}
    </button>
  );
}
