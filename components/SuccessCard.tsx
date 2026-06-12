'use client';

import { AppointmentDetailsCard, SuccessCardFooter, type AppointmentDetails } from '@/components/AppointmentDetailsCard';

export function SuccessCard(props: AppointmentDetails) {
  return <AppointmentDetailsCard {...props} variant="success" footer={<SuccessCardFooter />} />;
}
