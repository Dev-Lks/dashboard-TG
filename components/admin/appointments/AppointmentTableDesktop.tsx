'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { RoleBadge } from './RoleBadge';
import { saveAdminNotesAction } from '@/lib/appointments/actions';
import type { AppointmentRow } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';

type AppointmentTableDesktopProps = {
  appointments: AppointmentRow[];
  onViewDetails: (a: AppointmentRow) => void;
  onReschedule: (a: AppointmentRow) => void;
  onCancel: (a: AppointmentRow) => void;
};

export function AppointmentTableDesktop({
  appointments,
  onViewDetails,
  onReschedule,
  onCancel,
}: AppointmentTableDesktopProps) {
  const [pending, startTransition] = useTransition();

  const handleSaveNotes = (id: string, notes: string) => {
    startTransition(async () => {
      const result = await saveAdminNotesAction(id, notes || null);
      if (result.success) toast.success('Observação salva');
      else toast.error(result.error || 'Erro ao salvar');
    });
  };

  return (
    <table className="table hidden w-full text-sm md:table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Horário</th>
          <th>Status</th>
          <th>Tipo</th>
          <th>NR</th>
          <th>Nome Guerra</th>
          <th>Nome Completo</th>
          <th>Observação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((a) => (
          <tr key={a.id}>
            <td className="whitespace-nowrap font-medium">{formatDateBR(a.donation_dates?.date || '')}</td>
            <td>{a.donation_time_slots?.time || '—'}</td>
            <td><AppointmentStatusBadge status={a.status} /></td>
            <td><RoleBadge grad={a.volunteers?.grad} /></td>
            <td className="font-mono text-xs">{a.volunteers?.nr}</td>
            <td className="font-medium">{a.volunteers?.war_name}</td>
            <td>{a.volunteers?.full_name}</td>
            <td>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  handleSaveNotes(a.id, fd.get('admin_notes') as string);
                }}
                className="flex gap-1"
              >
                <input
                  name="admin_notes"
                  defaultValue={a.admin_notes || ''}
                  className="input !min-h-8 w-36 py-1 text-xs"
                  placeholder="Obs..."
                />
                <button type="submit" disabled={pending} className="px-2 text-xs font-bold text-[var(--olive)]">
                  Salvar
                </button>
              </form>
            </td>
            <td>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onViewDetails(a)} className="text-xs font-bold text-[var(--olive)] hover:underline">
                  Detalhes
                </button>
                {a.status === 'confirmed' && (
                  <>
                    <button type="button" onClick={() => onReschedule(a)} className="text-xs font-bold text-[var(--olive-dark)] hover:underline">
                      Reagendar
                    </button>
                    <button type="button" onClick={() => onCancel(a)} className="text-xs font-bold text-[var(--danger)] hover:underline">
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
