'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Drawer } from '@/components/shared/Drawer';
import { FormField } from '@/components/shared/FormField';
import { CapacityBadge } from './CapacityBadge';
import { RoleBadge } from './RoleBadge';
import { rescheduleAppointmentAction } from '@/lib/appointments/actions';
import type { AppointmentRow, DateOccupancy } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';
import { formatDayName, formatDayShortLabel } from '@/lib/dates/schedule-display';

type RescheduleDrawerProps = {
  appointment: AppointmentRow | null;
  availableDates: DateOccupancy[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function RescheduleDrawer({ appointment, availableDates, open, onClose, onSuccess }: RescheduleDrawerProps) {
  const [selectedDateId, setSelectedDateId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [pending, startTransition] = useTransition();

  if (!appointment) return null;

  const v = appointment.volunteers;
  const currentDateId = appointment.donation_date_id;

  const selectableDates = availableDates.filter(
    (d) => d.is_active && (!d.is_full || d.id === currentDateId)
  );

  const selectedDate = selectableDates.find((d) => d.id === selectedDateId);
  const nearCapacity = selectedDate && selectedDate.remaining <= 3 && selectedDate.remaining > 0;

  const handleConfirm = () => {
    if (!selectedDateId) {
      toast.error('Selecione uma nova data da missão');
      return;
    }

    if (selectedDateId === currentDateId) {
      toast.error('Selecione uma data diferente da atual');
      return;
    }

    startTransition(async () => {
      const result = await rescheduleAppointmentAction(
        appointment.id,
        selectedDateId,
        null,
        adminNote || null
      );

      if (result.success) {
        toast.success(result.message || 'Voluntário reagendado com sucesso');
        setSelectedDateId('');
        setAdminNote('');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Erro ao reagendar');
      }
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Reagendar voluntário" side="bottom">
      <div className="space-y-5">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <div className="info-label">Voluntário</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div>
              <div className="font-extrabold text-[var(--olive-900)]">{v?.war_name || v?.full_name}</div>
              <div className="font-mono text-xs text-[var(--text-muted)]">NR {v?.nr}</div>
            </div>
            <RoleBadge grad={v?.grad} />
          </div>
        </div>

        <div className="rounded-md border border-[var(--border)] p-4">
          <div className="info-label">Agendamento atual</div>
          <div className="mt-1 font-bold text-[var(--olive-900)]">
            {formatDateBR(appointment.donation_dates?.date || '')}
            {appointment.donation_time_slots?.time && ` • ${appointment.donation_time_slots.time}`}
          </div>
        </div>

        <div>
          <div className="info-label mb-2">Nova data</div>
          <div className="grid gap-2">
            {selectableDates.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Nenhuma data disponível para reagendamento.</p>
            ) : (
              selectableDates.map((d) => {
                const dayLabel = formatDayName(d.date);
                const shortLabel = formatDayShortLabel(d.date);
                const isCurrent = d.id === currentDateId;
                const isFull = d.is_full && !isCurrent;
                const isSelected = selectedDateId === d.id;

                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={isFull || isCurrent}
                    onClick={() => setSelectedDateId(d.id)}
                    className={`flex items-center justify-between rounded-md border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-[var(--olive)] bg-[var(--sand-light)]'
                        : isFull || isCurrent
                        ? 'cursor-not-allowed border-[var(--border)] bg-[var(--surface-muted)] opacity-60'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--olive)]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[var(--olive-900)]">{formatDateBR(d.date)}</div>
                      <div className="text-xs text-[var(--text-muted)]">{dayLabel} ({shortLabel})</div>
                      {isCurrent && <div className="text-xs font-semibold text-[var(--warning)]">Data atual</div>}
                    </div>
                    <CapacityBadge booked={d.booked} capacity={d.capacity} isFull={d.is_full} compact />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {nearCapacity && (
          <div className="rounded-md border border-[var(--sand)] bg-[var(--sand-light)] p-3 text-xs font-semibold text-[var(--warning)]">
            Atenção: a data selecionada está perto da capacidade máxima ({selectedDate?.remaining} vagas restantes).
          </div>
        )}

        <FormField label="Observação (opcional)">
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="input min-h-[80px] resize-y text-sm"
            placeholder="Motivo do reagendamento..."
            maxLength={1000}
          />
        </FormField>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || !selectedDateId || selectedDateId === currentDateId}
          className="btn btn-primary w-full"
        >
          {pending ? 'Processando...' : 'Confirmar reagendamento'}
        </button>
      </div>
    </Drawer>
  );
}
