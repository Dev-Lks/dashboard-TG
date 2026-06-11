'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { RoleBadge } from './RoleBadge';
import { saveAdminNotesAction } from '@/lib/appointments/actions';
import type { AppointmentRow } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';

type AppointmentCardMobileProps = {
  appointments: AppointmentRow[];
  onViewDetails: (a: AppointmentRow) => void;
  onReschedule: (a: AppointmentRow) => void;
  onCancel: (a: AppointmentRow) => void;
};

export function AppointmentCardMobile({
  appointments,
  onViewDetails,
  onReschedule,
  onCancel,
}: AppointmentCardMobileProps) {
  const [pending, startTransition] = useTransition();

  const handleSaveNotes = (id: string, notes: string) => {
    startTransition(async () => {
      const result = await saveAdminNotesAction(id, notes || null);
      if (result.success) toast.success('Observação salva');
      else toast.error(result.error || 'Erro ao salvar');
    });
  };

  return (
    <div className="grid gap-3 p-3 md:hidden">
      {appointments.map((a) => (
        <div key={a.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold text-[var(--olive-900)]">
                {a.volunteers?.war_name || a.volunteers?.full_name}
              </div>
              <div className="font-mono text-sm font-bold text-[var(--text-muted)]">NR {a.volunteers?.nr}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <AppointmentStatusBadge status={a.status} />
              <RoleBadge grad={a.volunteers?.grad} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="info-label">Data</div>
              <div className="font-bold">{formatDateBR(a.donation_dates?.date || '')}</div>
            </div>
            <div>
              <div className="info-label">Horário</div>
              <div className="font-bold">{a.donation_time_slots?.time || '—'}</div>
            </div>
            <div className="col-span-2">
              <div className="info-label">Nome completo</div>
              <div className="truncate font-medium">{a.volunteers?.full_name}</div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleSaveNotes(a.id, fd.get('admin_notes') as string);
            }}
            className="mt-4 grid gap-2"
          >
            <input
              name="admin_notes"
              defaultValue={a.admin_notes || ''}
              className="input text-sm"
              placeholder="Observação administrativa"
            />
            <button type="submit" disabled={pending} className="btn btn-secondary btn-sm">
              Salvar observação
            </button>
          </form>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => onViewDetails(a)} className="btn btn-secondary btn-sm">
              Ver detalhes
            </button>
            {a.status === 'confirmed' && (
              <>
                <button type="button" onClick={() => onReschedule(a)} className="btn btn-primary btn-sm">
                  Reagendar
                </button>
                <button type="button" onClick={() => onCancel(a)} className="btn btn-danger btn-sm">
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
