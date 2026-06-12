export type SchedulePreset = 'morning' | 'afternoon' | 'custom';

export const SCHEDULE_PRESETS = {
  morning: { start: '07:00', end: '10:00', interval: 30 },
  afternoon: { start: '13:00', end: '17:00', interval: 30 },
} as const;

export type ScheduleConfig = {
  mode: 'slots' | 'presence_only';
  start: string;
  end: string;
  interval: number;
};

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  if (intervalMinutes < 1) return [];

  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (endMin < startMin) return [];

  const slots: string[] = [];
  for (let t = startMin; t <= endMin; t += intervalMinutes) {
    slots.push(formatMinutesToTime(t));
  }
  return slots;
}

export function detectPreset(start: string, end: string, interval: number): SchedulePreset {
  const morning = SCHEDULE_PRESETS.morning;
  const afternoon = SCHEDULE_PRESETS.afternoon;
  if (start === morning.start && end === morning.end && interval === morning.interval) return 'morning';
  if (start === afternoon.start && end === afternoon.end && interval === afternoon.interval) return 'afternoon';
  return 'custom';
}
