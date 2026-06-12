'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { DateCapacityIndicator } from './DateCapacityIndicator';
import { DonationSchedulePreview } from './DonationSchedulePreview';
import { donationProfiles, getDonationDayInfo, getDonationProfileKey } from '@/lib/dates/profiles';
import { createDateAction, updateDateAction, toggleActiveAction, deleteDateAction } from '@/app/admin/datas/actions';
import type { RegisteredDateInfo } from '@/lib/dates/calendar-utils';
import { formatDateBR } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

type MissionDateDetailPanelProps = {
  selectedDateStr: string | null;
  registered?: RegisteredDateInfo & { notes?: string | null };
  initialNotes?: string;
  initialCapacity?: number;
};

export function MissionDateDetailPanel({
  selectedDateStr,
  registered,
  initialNotes = '',
  initialCapacity = 15,
}: MissionDateDetailPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [capacity, setCapacity] = useState(initialCapacity);
  const [notes, setNotes] = useState(initialNotes);

  if (!selectedDateStr) {
    return (
      <div className="card p-5">
        <p className="text-sm text-[var(--text-muted)]">Selecione uma data no calendário para ver detalhes ou cadastrar.</p>
      </div>
    );
  }

  const dayInfo = getDonationDayInfo(selectedDateStr);
  const profileKey = getDonationProfileKey(selectedDateStr);
  const isEdit = !!registered;

  if (!dayInfo.isAutomatic) {
    return (
      <div className="card p-5">
        <div className="text-sm font-extrabold text-[var(--warning)]">Este dia não gera horários automaticamente</div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Apenas segundas e quintas podem ser cadastradas.
        </p>
      </div>
    );
  }

  const profile = profileKey ? donationProfiles[profileKey] : null;

  const handleCreate = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('date', selectedDateStr);
      fd.set('capacity', String(capacity));
      fd.set('notes', notes);
      const result = await createDateAction(fd);
      if (result.success) {
        toast.success('Data da missão cadastrada');
        setNotes('');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao cadastrar');
      }
    });
  };

  const handleUpdate = () => {
    if (!registered) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', registered.id);
      fd.set('capacity', String(capacity));
      fd.set('notes', notes);
      const result = await updateDateAction(fd);
      if (result.success) {
        toast.success('Data atualizada');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao atualizar');
      }
    });
  };

  const handleToggle = () => {
    if (!registered) return;
    startTransition(async () => {
      const result = await toggleActiveAction(registered.id, registered.is_active);
      if (result.success) {
        toast.success(registered.is_active ? 'Data desativada' : 'Data ativada');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro');
      }
    });
  };

  const handleDelete = () => {
    if (!registered) return;
    startTransition(async () => {
      const result = await deleteDateAction(registered.id);
      if (result.success) {
        toast.success('Data excluída');
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao excluir');
        setDeleteOpen(false);
      }
    });
  };

  return (
    <>
      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
          <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--olive-dark)]">
            {isEdit ? 'Data cadastrada' : 'Nova data da missão'}
          </div>
          <div className="mt-1 text-lg font-extrabold text-[var(--olive-900)]">{formatDateBR(selectedDateStr)}</div>
          <div className="text-sm text-[var(--text-muted)]">{dayInfo.dayLabel}</div>
        </div>

        <div className="space-y-4 p-4">
          {profile && (
            <DonationSchedulePreview
              times={profile.times}
              dayLabel={dayInfo.dayLabel}
              timeRange={dayInfo.timeRange}
            />
          )}

          {isEdit && registered && (
            <DateCapacityIndicator
              booked={registered.booked}
              capacity={registered.capacity}
              isFull={registered.is_full}
            />
          )}

          <FormField label="Capacidade">
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Math.min(15, Math.max(1, parseInt(e.target.value) || 15)))}
              min={1}
              max={15}
              className="input"
              disabled={isEdit && registered?.is_full}
            />
          </FormField>

          <FormField label="Observações">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder="Orientação interna, observação operacional..."
            />
          </FormField>

          {isEdit && registered ? (
            <div className="grid gap-2">
              <button type="button" onClick={handleUpdate} disabled={pending} className="btn btn-primary">
                Atualizar data
              </button>
              <button type="button" onClick={handleToggle} disabled={pending} className="btn btn-secondary">
                {registered.is_active ? 'Desativar data' : 'Ativar data'}
              </button>
              <button type="button" onClick={() => setDeleteOpen(true)} disabled={pending} className="btn btn-danger">
                Excluir data
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleCreate} disabled={pending} className="btn btn-primary w-full">
              Cadastrar data da missão
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir data"
        description="Confirma a exclusão desta data? Só é possível excluir datas sem agendamentos."
        confirmLabel="Excluir"
        variant="danger"
        loading={pending}
      />
    </>
  );
}
