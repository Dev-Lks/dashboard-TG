export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export function daysInMonth(month: number, year: number): number {
  if (month < 1 || month > 12 || year < 1) return 31;
  return new Date(year, month, 0).getDate();
}

export function formatBirthDateBR(birthDate: string): string | null {
  const normalized = normalizeBirthDate(birthDate);
  if (!normalized) return null;

  const [year, month, day] = normalized.split('-').map(Number);
  const monthName = MONTH_NAMES[month - 1]?.toLowerCase() ?? '';
  return `${day} de ${monthName} de ${year}`;
}

export function getBirthYearRange(now = new Date()): { min: number; max: number } {
  const currentYear = now.getFullYear();
  return { min: currentYear - 35, max: currentYear - 10 };
}

/** Normalize a YYYY-MM-DD string; returns null if invalid. */
export function normalizeBirthDate(date: string): string | null {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** Compare stored birth_date (from DB) with user-provided YYYY-MM-DD. */
export function birthDatesMatch(stored: string | null | undefined, provided: string): boolean {
  if (!stored) return false;

  const normalizedStored = normalizeBirthDate(stored.slice(0, 10));
  const normalizedProvided = normalizeBirthDate(provided);

  if (!normalizedStored || !normalizedProvided) return false;
  return normalizedStored === normalizedProvided;
}

/** Build YYYY-MM-DD from day/month/year numeric parts. */
export function buildBirthDate(day: number, month: number, year: number): string | null {
  const padded = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return normalizeBirthDate(padded);
}
