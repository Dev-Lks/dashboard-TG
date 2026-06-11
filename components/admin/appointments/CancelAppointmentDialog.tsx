'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cancelAppointmentAction } from '@/lib/appointments/actions';
import type { AppointmentRow } from '@/lib/appointments/queries';

type CancelAppointmentDialogProps = {
  appointment: AppointmentRow | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CancelAppointmentDialog({ appointment, open, onClose, onSuccess }: CancelAppointmentDialogProps) {
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!appointment) return;

    startTransition(async () => {
      const result = await cancelAppointmentAction(appointment.id);
      if (result.success) {
        toast.success(result.message || 'Agendamento cancelado');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Erro ao cancelar');
      }
    });
  };

  const name = appointment?.volunteers?.war_name || appointment?.volunteers?.full_name || 'voluntário';

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Cancelar agendamento"
      description={`Confirma o cancelamento do agendamento de ${name}? A vaga será liberada para novos agendamentos.`}
      confirmLabel="Confirmar cancelamento"
      variant="danger"
      loading={pending}
    />
  );
}
