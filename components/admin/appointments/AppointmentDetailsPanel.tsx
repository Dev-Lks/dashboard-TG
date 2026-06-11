'use client';

import { Drawer } from '@/components/shared/Drawer';
import { RoleBadge } from './RoleBadge';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import type { AppointmentRow } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';

type AppointmentDetailsPanelProps = {
  appointment: AppointmentRow | null;
  open: boolean;
  onClose: () => void;
};

export function AppointmentDetailsPanel({ appointment, open, onClose }: AppointmentDetailsPanelProps) {
  if (!appointment) return null;

  const v = appointment.volunteers;

  return (
    <Drawer open={open} onClose={onClose} title="Detalhes do agendamento" side="bottom">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-[var(--olive-900)]">{v?.war_name || v?.full_name}</div>
            <div className="font-mono text-sm text-[var(--text-muted)]">NR {v?.nr}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <AppointmentStatusBadge status={appointment.status} />
            <RoleBadge grad={v?.grad} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="info-label">Nome completo</div>
            <div className="font-medium">{v?.full_name}</div>
          </div>
          <div>
            <div className="info-label">Telefone</div>
            <div className="font-mono text-xs">{v?.phone || '—'}</div>
          </div>
          <div>
            <div className="info-label">Data da missão</div>
            <div className="font-bold">{formatDateBR(appointment.donation_dates?.date || '')}</div>
          </div>
          <div>
            <div className="info-label">Horário</div>
            <div className="font-bold">{appointment.donation_time_slots?.time || '—'}</div>
          </div>
          <div className="col-span-2">
            <div className="info-label">Registrado em</div>
            <div className="text-sm">{new Date(appointment.created_at).toLocaleString('pt-BR')}</div>
          </div>
          {appointment.admin_notes && (
            <div className="col-span-2">
              <div className="info-label">Observação administrativa</div>
              <div className="mt-1 rounded border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm whitespace-pre-wrap">
                {appointment.admin_notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
