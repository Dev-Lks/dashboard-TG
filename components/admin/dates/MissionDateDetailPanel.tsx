'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { DateCapacityIndicator } from './DateCapacityIndicator';
import { DonationSchedulePreview } from './DonationSchedulePreview';
import { ScheduleEditor, type ScheduleEditorValue } from './ScheduleEditor';
import { formatDayName, formatTimeRangeFromSlots } from '@/lib/dates/schedule-display';
import { generateTimeSlots } from '@/lib/dates/slot-generator';
import { createDateAction, updateDateAction, toggleActiveAction, deleteDateAction } from '@/app/admin/datas/actions';
import type { RegisteredDateInfo } from '@/lib/dates/calendar-utils';
import type { Mission } from '@/lib/missions/types';
import { formatDateBR } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

type MissionDateDetailPanelProps = {
  selectedDateStr: string | null;
  mission: Mission;
  registered?: RegisteredDateInfo & { notes?: string | null };
  initialNotes?: string;
  initialCapacity?: number;
};

function defaultSchedule(mission: Mission): ScheduleEditorValue {
  return {
    mode: mission.default_schedule_mode,
    start: '07:00',
    end: '10:00',
    interval: 30,
  };
}

export function MissionDateDetailPanel({
  selectedDateStr,
  mission,
  registered,
  initialNotes = '',
  initialCapacity,
}: MissionDateDetailPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [capacity, setCapacity] = useState(initialCapacity ?? mission.default_capacity);
  const [notes, setNotes] = useState(initialNotes);
  const [schedule, setSchedule] = useState<ScheduleEditorValue>(() =>
    registered
      ? {
          mode: registered.schedule_mode ?? mission.default_schedule_mode,
          start: registered.schedule_start ?? '07:00',
          end: registered.schedule_end ?? '10:00',
          interval: registered.slot_interval ?? 30,
        }
      : defaultSchedule(mission),
  );

  useEffect(() => {
    if (!registered) {
      setSchedule(defaultSchedule(mission));
      setCapacity(mission.default_capacity);
    }
  }, [mission, registered, selectedDateStr]);

  if (!selectedDateStr) {
    return (
      <div className="card p-5">
        <p className="text-sm text-[var(--text-muted)]">Selecione uma data no calendário para ver detalhes ou cadastrar.</p>
      </div>
    );
  }

  const isEdit = !!registered;
  const dayLabel = formatDayName(selectedDateStr);
  const registeredTimes = registered?.donation_time_slots?.map((s) => s.time) ?? [];
  const previewTimes = isEdit
    ? registeredTimes
    : schedule.mode === 'slots'
      ? generateTimeSlots(schedule.start, schedule.end, schedule.interval)
      : [];

  const handleCreate = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('missionId', mission.id);
      fd.set('date', selectedDateStr);
      fd.set('scheduleMode', schedule.mode);
      fd.set('scheduleStart', schedule.start);
      fd.set('scheduleEnd', schedule.end);
      fd.set('slotInterval', String(schedule.interval));
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
      fd.set('scheduleMode', schedule.mode);
      fd.set('scheduleStart', schedule.start);
      fd.set('scheduleEnd', schedule.end);
      fd.set('slotInterval', String(schedule.interval));
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
          <div className="text-sm text-[var(--text-muted)]">{dayLabel} · {mission.name}</div>
        </div>

        <div className="space-y-4 p-4">
          <ScheduleEditor value={schedule} onChange={setSchedule} />

          <DonationSchedulePreview
            times={previewTimes}
            dayLabel={dayLabel}
            timeRange={isEdit ? formatTimeRangeFromSlots(registeredTimes) : undefined}
          />

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
              onChange={(e) => setCapacity(Math.min(100, Math.max(1, parseInt(e.target.value) || mission.default_capacity)))}
              min={1}
              max={100}
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
              placeholder="Orientação interna..."
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
