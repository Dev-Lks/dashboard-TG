'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { FormField } from '@/components/shared/FormField';
import { createDatesBatchAction } from '@/app/admin/datas/actions';
import { getDonationDayInfo } from '@/lib/dates/profiles';
import { formatDateBR } from '@/lib/date-utils';

type MissionBatchPanelProps = {
  selectedDates: string[];
  onRemoveDate: (dateStr: string) => void;
  onClear: () => void;
};

export function MissionBatchPanel({ selectedDates, onRemoveDate, onClear }: MissionBatchPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [capacity, setCapacity] = useState(15);
  const [notes, setNotes] = useState('');

  if (selectedDates.length === 0) return null;

  const sorted = [...selectedDates].sort();

  const handleBatchCreate = () => {
    startTransition(async () => {
      const result = await createDatesBatchAction(sorted, capacity, notes || null);
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
              {selectedDates.length} data(s) selecionada(s) para cadastro
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--danger)]"
          >
            Limpar seleção
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {sorted.map((dateStr) => {
            const info = getDonationDayInfo(dateStr);
            return (
              <div
                key={dateStr}
                className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-bold text-[var(--olive-900)]">{formatDateBR(dateStr)}</span>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">{info.shortLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveDate(dateStr)}
                  className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--danger)]"
                  aria-label={`Remover ${dateStr}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <FormField label="Capacidade (todas as datas)" hint="Limite operacional: 15 por data">
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Math.min(15, Math.max(1, parseInt(e.target.value) || 15)))}
            min={1}
            max={15}
            className="input"
          />
        </FormField>

        <FormField label="Observações (opcional)" hint="Aplicada a todas as datas do lote">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="Orientação interna..."
          />
        </FormField>

        <button type="button" onClick={handleBatchCreate} disabled={pending} className="btn btn-primary w-full">
          {pending ? 'Cadastrando...' : `Cadastrar ${selectedDates.length} data(s) da missão`}
        </button>
      </div>
    </div>
  );
}
