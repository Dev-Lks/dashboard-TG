import {
  addDays,
  addMonths,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type CalendarDayState =
  | 'invalid'
  | 'valid'
  | 'registered'
  | 'registered-full'
  | 'registered-inactive'
  | 'selected'
  | 'today';

export type RegisteredDateInfo = {
  id: string;
  date: string;
  capacity: number;
  is_active: boolean;
  booked: number;
  remaining: number;
  is_full: boolean;
  notes?: string | null;
  donation_time_slots?: { time: string }[];
};

export type CalendarDay = {
  date: Date;
  dateStr: string;
  inMonth: boolean;
  isToday: boolean;
  state: CalendarDayState;
  registered?: RegisteredDateInfo;
};

export function buildMonthGrid(
  month: Date,
  registeredMap: Map<string, RegisteredDateInfo>,
  selectedDateStrs?: Set<string>,
  focusDateStr?: string | null,
): CalendarDay[] {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const today = startOfDay(new Date());

  const days: CalendarDay[] = [];
  let current = gridStart;

  for (let i = 0; i < 42; i++) {
    const dateStr = format(current, 'yyyy-MM-dd');
    const inMonth = isSameMonth(current, month);
    const isToday = isSameDay(current, today);
    const registered = registeredMap.get(dateStr);
    const isPast = isBefore(startOfDay(current), today);

    let state: CalendarDayState = 'invalid';

    if (focusDateStr && dateStr === focusDateStr) {
      state = 'selected';
    } else if (selectedDateStrs?.has(dateStr)) {
      state = 'selected';
    } else if (registered) {
      if (!registered.is_active) state = 'registered-inactive';
      else if (registered.is_full) state = 'registered-full';
      else state = 'registered';
    } else if (inMonth && !isPast) {
      state = 'valid';
    }

    days.push({ date: current, dateStr, inMonth, isToday, state, registered });
    current = addDays(current, 1);
  }

  return days;
}

export function formatMonthYear(month: Date): string {
  return format(month, 'MMMM yyyy', { locale: ptBR });
}

export function prevMonth(month: Date): Date {
  return addMonths(month, -1);
}

export function nextMonth(month: Date): Date {
  return addMonths(month, 1);
}

export function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateStr(dateStr: string): Date {
  return parseISO(dateStr);
}
