'use client';

import type { AvailableSlot } from '@/lib/types';

interface Props {
  slots: AvailableSlot[];
  selectedTime: string | null;
  onSelect: (time: string, slotId: string) => void;
  disabled?: boolean;
}

export function TimeSlotPicker({ slots, selectedTime, onSelect, disabled }: Props) {
  if (!slots.length) {
    return <div className="card p-6 text-center text-sm text-[var(--text-muted)]">Nenhum horário disponível para esta data.</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const active = slot.is_active;
        const isSelected = selectedTime === slot.time;
        return (
          <button
            key={slot.id}
            disabled={!active || disabled}
            onClick={() => active && onSelect(slot.time, slot.id)}
            className={`min-h-[54px] rounded-md border px-2 py-3 text-sm font-extrabold transition-all ${
              isSelected 
                ? 'border-[var(--olive-dark)] bg-[var(--olive)] text-[var(--text-inverse)]' 
                : active 
                  ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--olive-900)] hover:border-[var(--olive)] active:bg-[var(--surface-muted)]' 
                  : 'cursor-not-allowed border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]'
            }`}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
