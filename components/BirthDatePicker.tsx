'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cake } from 'lucide-react';
import {
  buildBirthDate,
  daysInMonth,
  formatBirthDateBR,
  getBirthYearRange,
  MONTH_NAMES,
} from '@/lib/birth-date';

interface Props {
  onChange: (birthDate: string | null) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function BirthDatePicker({ onChange, disabled, hasError }: Props) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const dayNum = day ? Number(day) : null;
  const monthNum = month ? Number(month) : null;
  const yearNum = year ? Number(year) : null;

  const { min: minYear, max: maxYear } = useMemo(() => getBirthYearRange(), []);

  const maxDay = useMemo(() => {
    if (!monthNum || !yearNum) return 31;
    return daysInMonth(monthNum, yearNum);
  }, [monthNum, yearNum]);

  const dayOptions = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => i + 1),
    [maxDay],
  );

  const yearOptions = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [minYear, maxYear],
  );

  const birthDate = useMemo(() => {
    if (!dayNum || !monthNum || !yearNum) return null;
    return buildBirthDate(dayNum, monthNum, yearNum);
  }, [dayNum, monthNum, yearNum]);

  const preview = birthDate ? formatBirthDateBR(birthDate) : null;

  useEffect(() => {
    if (dayNum && dayNum > maxDay) {
      setDay(String(maxDay));
    }
  }, [dayNum, maxDay]);

  useEffect(() => {
    onChange(birthDate);
  }, [birthDate, onChange]);

  const selectClass = `input appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%235a635f%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] ${
    hasError ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]' : ''
  }`;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--olive)]">
          <Cake className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-extrabold text-[var(--olive-900)]">Quando você nasceu?</div>
          <div className="text-[11px] font-medium text-[var(--text-muted)]">Selecione dia, mês e ano</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div>
          <label htmlFor="birth-day" className="info-label mb-1.5 block text-[10px]">
            Dia
          </label>
          <select
            id="birth-day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">—</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {String(d).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="birth-month" className="info-label mb-1.5 block text-[10px]">
            Mês
          </label>
          <select
            id="birth-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">—</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="birth-year" className="info-label mb-1.5 block text-[10px]">
            Ano
          </label>
          <select
            id="birth-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={disabled}
            className={selectClass}
          >
            <option value="">—</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`mt-4 rounded-md border px-4 py-3 text-sm transition-all ${
          preview
            ? 'border-[var(--olive)] bg-[var(--surface-muted)] text-[var(--olive-900)]'
            : 'border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
        }`}
        aria-live="polite"
      >
        {preview ? (
          <span>
            <span className="info-label mr-2">Selecionado:</span>
            <span className="font-bold capitalize">{preview}</span>
          </span>
        ) : (
          'Escolha os três campos para ver a data completa'
        )}
      </div>
    </div>
  );
}
