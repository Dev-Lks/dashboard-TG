'use client';

import {
  SCHEDULE_PRESETS,
  detectPreset,
  generateTimeSlots,
  type SchedulePreset,
} from '@/lib/dates/slot-generator';
import { scheduleModeLabel } from '@/lib/dates/schedule-display';
import type { ScheduleMode } from '@/lib/types';

export type ScheduleEditorValue = {
  mode: ScheduleMode;
  start: string;
  end: string;
  interval: number;
};

type ScheduleEditorProps = {
  value: ScheduleEditorValue;
  onChange: (value: ScheduleEditorValue) => void;
  disabled?: boolean;
};

function SlotPreview({ times }: { times: string[] }) {
  if (times.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {times.map((t) => (
        <span
          key={t}
          className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--olive)]"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function ScheduleEditor({ value, onChange, disabled }: ScheduleEditorProps) {
  const preset = detectPreset(value.start, value.end, value.interval);
  const previewTimes = value.mode === 'slots'
    ? generateTimeSlots(value.start, value.end, value.interval)
    : [];

  const applyPreset = (p: SchedulePreset) => {
    if (p === 'custom') return;
    const cfg = SCHEDULE_PRESETS[p];
    onChange({ ...value, mode: 'slots', start: cfg.start, end: cfg.end, interval: cfg.interval });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">
          Modo de agendamento
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['slots', 'presence_only'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, mode })}
              className={`rounded border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                value.mode === mode
                  ? 'border-[var(--olive)] bg-[var(--olive)]/10 text-[var(--olive-dark)]'
                  : 'border-[var(--border)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              {scheduleModeLabel(mode)}
            </button>
          ))}
        </div>
      </div>

      {value.mode === 'slots' && (
        <>
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">
              Presets rápidos
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={disabled} onClick={() => applyPreset('morning')} className={`rounded border px-2.5 py-1 text-xs font-bold ${preset === 'morning' ? 'border-[var(--olive)] bg-[var(--olive)]/10' : 'border-[var(--border)]'}`}>
                Manhã (07–10h)
              </button>
              <button type="button" disabled={disabled} onClick={() => applyPreset('afternoon')} className={`rounded border px-2.5 py-1 text-xs font-bold ${preset === 'afternoon' ? 'border-[var(--olive)] bg-[var(--olive)]/10' : 'border-[var(--border)]'}`}>
                Tarde (13–17h)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[var(--text-muted)]">Início</span>
              <input
                type="time"
                value={value.start}
                disabled={disabled}
                onChange={(e) => onChange({ ...value, start: e.target.value })}
                className="input w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[var(--text-muted)]">Fim</span>
              <input
                type="time"
                value={value.end}
                disabled={disabled}
                onChange={(e) => onChange({ ...value, end: e.target.value })}
                className="input w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[var(--text-muted)]">Intervalo (min)</span>
              <select
                value={value.interval}
                disabled={disabled}
                onChange={(e) => onChange({ ...value, interval: parseInt(e.target.value) })}
                className="input w-full"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </label>
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">
              Horários gerados ({previewTimes.length})
            </div>
            <SlotPreview times={previewTimes} />
          </div>
        </>
      )}
    </div>
  );
}

export function SchedulePreviewReadonly({
  mode,
  times,
}: {
  mode: ScheduleMode;
  times: string[];
}) {
  if (mode === 'presence_only') {
    return <p className="text-sm font-semibold text-[var(--olive)]">Presença no dia (sem horário)</p>;
  }
  return <SlotPreview times={times} />;
}
