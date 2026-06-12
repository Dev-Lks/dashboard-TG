import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEEKDAYS_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function formatDayName(date: string): string {
  return format(parseISO(date), 'EEEE', { locale: ptBR });
}

export function formatDayShortLabel(date: string): string {
  const d = parseISO(date);
  return WEEKDAYS_SHORT[d.getDay()];
}

export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':');
  return m === '00' ? `${h}h` : `${h}h${m}`;
}

export function formatTimeRangeFromSlots(times: string[]): string {
  if (times.length === 0) return 'Presença no dia';
  const sorted = [...times].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return `${formatTimeDisplay(first)} às ${formatTimeDisplay(last)}`;
}

export function formatTimeRangeTable(times: string[]): string {
  if (times.length === 0) return 'Presença confirmada';
  const sorted = [...times].sort();
  return `${sorted[0]} a ${sorted[sorted.length - 1]}`;
}

export function formatDateBanner(dateStr: string, times: string[]): string {
  const d = parseISO(dateStr);
  const day = format(d, 'd');
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const month = months[d.getMonth()];
  const short = formatDayShortLabel(dateStr);
  const time = times.length > 0 ? formatTimeRangeTable(times) : 'Presença confirmada';
  return `${day} ${month} (${short}) — ${time}`;
}

export function scheduleModeLabel(mode: 'slots' | 'presence_only'): string {
  return mode === 'presence_only' ? 'Só presença no dia' : 'Com horários';
}
