'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildMonthGrid,
  formatMonthYear,
  nextMonth,
  prevMonth,
  type RegisteredDateInfo,
} from '@/lib/dates/calendar-utils';
import { startOfMonth } from 'date-fns';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type DonationDateCalendarProps = {
  registeredDates: RegisteredDateInfo[];
  selectedDateStrs?: Set<string>;
  focusDateStr?: string | null;
  onDateClick: (dateStr: string, isRegistered: boolean, isValidNew: boolean) => void;
};

export function DonationDateCalendar({
  registeredDates,
  selectedDateStrs,
  focusDateStr,
  onDateClick,
}: DonationDateCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const registeredMap = useMemo(() => {
    const map = new Map<string, RegisteredDateInfo>();
    registeredDates.forEach((d) => map.set(d.date, d));
    return map;
  }, [registeredDates]);

  const days = useMemo(
    () => buildMonthGrid(month, registeredMap, selectedDateStrs, focusDateStr),
    [month, registeredMap, selectedDateStrs, focusDateStr]
  );

  const stateClass: Record<string, string> = {
    invalid: 'calendar-day--invalid',
    'valid-mon': 'calendar-day--valid-mon',
    'valid-thu': 'calendar-day--valid-thu',
    registered: 'calendar-day--registered',
    'registered-full': 'calendar-day--full',
    'registered-inactive': 'calendar-day--inactive',
    selected: 'calendar-day--selected',
    today: 'calendar-day--today',
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
        <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--olive-dark)]">
          Calendário da Missão
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Toque em segundas/quintas para selecionar múltiplas datas. Toque em data cadastrada para editar.
        </p>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(prevMonth(month))}
            className="flex h-10 w-10 items-center justify-center rounded border border-[var(--border)] hover:bg-[var(--surface-muted)]"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-extrabold capitalize text-[var(--olive-900)]">
            {formatMonthYear(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth(nextMonth(month))}
            className="flex h-10 w-10 items-center justify-center rounded border border-[var(--border)] hover:bg-[var(--surface-muted)]"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="calendar-grid mb-1 max-[400px]:gap-0.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="calendar-weekday max-[400px]:text-[9px]">
              {d}
            </div>
          ))}
        </div>

        <div className="calendar-grid max-[400px]:gap-0.5">
          {days.map((day) => {
            const isRegistered = !!day.registered;
            const isValidNew = day.state === 'valid-mon' || day.state === 'valid-thu';
            const isSelectable = isRegistered || isValidNew;

            return (
              <button
                key={day.dateStr}
                type="button"
                disabled={!isSelectable || !day.inMonth}
                onClick={() =>
                  day.inMonth && isSelectable && onDateClick(day.dateStr, isRegistered, isValidNew)
                }
                className={[
                  'calendar-day max-[400px]:min-h-10 max-[400px]:text-[13px]',
                  !day.inMonth ? 'calendar-day--outside' : '',
                  day.isToday ? 'calendar-day--today' : '',
                  stateClass[day.state] || '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={day.dateStr}
                aria-pressed={selectedDateStrs?.has(day.dateStr) || focusDateStr === day.dateStr}
              >
                <span className="calendar-day-num">{day.date.getDate()}</span>
                {day.registered && day.inMonth && (
                  <span className="calendar-day-dot" aria-hidden="true" />
                )}
                {selectedDateStrs?.has(day.dateStr) && !day.registered && (
                  <span className="calendar-day-check" aria-hidden="true">✓</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="calendar-legend calendar-legend--mon" /> Seg válida</span>
          <span className="flex items-center gap-1"><span className="calendar-legend calendar-legend--thu" /> Qui válida</span>
          <span className="flex items-center gap-1"><span className="calendar-legend calendar-legend--registered" /> Cadastrada</span>
          <span className="flex items-center gap-1"><span className="calendar-legend calendar-legend--full" /> Cheia</span>
        </div>
      </div>
    </div>
  );
}
