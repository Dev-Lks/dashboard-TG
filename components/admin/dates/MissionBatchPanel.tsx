'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { FormField } from '@/components/shared/FormField';
import { ScheduleEditor, type ScheduleEditorValue } from './ScheduleEditor';
import { createDatesBatchAction } from '@/app/admin/datas/actions';
import type { Mission } from '@/lib/missions/types';
import { formatDateBR } from '@/lib/date-utils';

type MissionBatchPanelProps = {
  mission: Mission;
  selectedDates: string[];
  onRemoveDate: (dateStr: string) => void;
  onClear: () => void;
};

export function MissionBatchPanel({ mission, selectedDates, onRemoveDate, onClear }: MissionBatchPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [capacity, setCapacity] = useState(mission.default_capacity);
  const [notes, setNotes] = useState('');
  const [schedule, setSchedule] = useState<ScheduleEditorValue>({
    mode: mission.default_schedule_mode,
    start: '07:00',
    end: '10:00',
    interval: 30,
  });

  if (selectedDates.length === 0) return null;

  const sorted = [...selectedDates].sort();

  const handleBatchCreate = () => {
    startTransition(async () => {
      const result = await createDatesBatchAction(mission.id, sorted, capacity, notes || null, {
        scheduleMode: schedule.mode,
        scheduleStart: schedule.start,
        scheduleEnd: schedule.end,
        slotInterval: schedule.interval,
      });
      if (result.success) {
        const msg =
          result.skipped && result.skipped > 0
            ? `${result.created} data(s) cadastrada(s). ${result.skipped} ignorada(s).`
            : `${result.created} data(s) da missão cadastrada(s) com sucesso`;
        toast.success(msg);
        onClear();
        setNotes('');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao cadastrar datas');
      }
    });
  };

  return (
    <div className="card overflow-hidden border-[var(--olive)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--olive-dark)]">
              Cadastro em lote
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {selectedDates.length} data(s) · {mission.name}
            </p>
          </div>
          <button type="button" onClick={onClear} className="rounded p-1 hover:bg-[var(--surface-muted)]" aria-label="Limpar seleção">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {sorted.map((dateStr) => (
            <span key={dateStr} className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold">
              {formatDateBR(dateStr)}
              <button type="button" onClick={() => onRemoveDate(dateStr)} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <ScheduleEditor value={schedule} onChange={setSchedule} />

        <FormField label="Capacidade (todas as datas)">
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Math.min(100, Math.max(1, parseInt(e.target.value) || mission.default_capacity)))}
            min={1}
            max={100}
            className="input"
          />
        </FormField>

        <FormField label="Observações">
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Opcional..." />
        </FormField>

        <button type="button" onClick={handleBatchCreate} disabled={pending} className="btn btn-primary w-full">
          Cadastrar {selectedDates.length} data(s)
        </button>
      </div>
    </div>
  );
}
