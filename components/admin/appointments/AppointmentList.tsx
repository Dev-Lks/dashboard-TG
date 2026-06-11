'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppointmentTableDesktop } from './AppointmentTableDesktop';
import { AppointmentCardMobile } from './AppointmentCardMobile';
import { AppointmentDetailsPanel } from './AppointmentDetailsPanel';
import { RescheduleDrawer } from './RescheduleDrawer';
import { CancelAppointmentDialog } from './CancelAppointmentDialog';
import type { AppointmentRow, DateOccupancy } from '@/lib/appointments/queries';

type AppointmentListProps = {
  appointments: AppointmentRow[];
  availableDates: DateOccupancy[];
};

export function AppointmentList({ appointments, availableDates }: AppointmentListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleRefresh = () => router.refresh();

  const openDetails = (a: AppointmentRow) => {
    setSelected(a);
    setDetailsOpen(true);
  };

  const openReschedule = (a: AppointmentRow) => {
    setSelected(a);
    setRescheduleOpen(true);
  };

  const openCancel = (a: AppointmentRow) => {
    setSelected(a);
    setCancelOpen(true);
  };

  if (appointments.length === 0) {
    return (
      <div className="card p-4">
        <EmptyState title="Nenhum agendamento encontrado" description="Ajuste os filtros ou aguarde novas confirmações." />
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <AppointmentTableDesktop
          appointments={appointments}
          onViewDetails={openDetails}
          onReschedule={openReschedule}
          onCancel={openCancel}
        />
        <AppointmentCardMobile
          appointments={appointments}
          onViewDetails={openDetails}
          onReschedule={openReschedule}
          onCancel={openCancel}
        />
      </div>

      <AppointmentDetailsPanel
        appointment={selected}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />

      <RescheduleDrawer
        appointment={selected}
        availableDates={availableDates}
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onSuccess={handleRefresh}
      />

      <CancelAppointmentDialog
        appointment={selected}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}
