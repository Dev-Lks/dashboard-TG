type AppointmentStatusBadgeProps = {
  status: string;
};

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  if (status === 'confirmed') {
    return <span className="badge badge-confirmed">Confirmado</span>;
  }
  return <span className="badge badge-cancelled">Cancelado</span>;
}
