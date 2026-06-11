import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ReactNode } from 'react';

type AppointmentCommandHeaderProps = {
  action?: ReactNode;
};

export function AppointmentCommandHeader({ action }: AppointmentCommandHeaderProps) {
  return (
    <AdminPageHeader
      eyebrow="Controle de agendamentos"
      title="Operação de Agendamentos"
      description="Acompanhe o efetivo agendado, filtre por data e tipo, reagende ou cancele conforme a operação da missão."
      action={action}
    />
  );
}
