'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Volunteer, AvailableDate, AvailableSlot } from '@/lib/types';
import type { Mission } from '@/lib/missions/types';
import { toast } from 'sonner';
import { VolunteerSearch } from '@/components/VolunteerSearch';
import { VolunteerConfirmCard } from '@/components/VolunteerConfirmCard';
import { DateAvailabilityCard } from '@/components/DateAvailabilityCard';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { SuccessCard } from '@/components/SuccessCard';
import {
  AppointmentDetailsCard,
  LookupCardFooter,
  type AppointmentDetails,
} from '@/components/AppointmentDetailsCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateBR } from '@/lib/date-utils';

type Step = 'search' | 'confirm' | 'pick-date' | 'pick-time' | 'success' | 'already-booked';

type AgendarFlowProps = {
  mission: Mission;
};

export function AgendarFlow({ mission }: AgendarFlowProps) {
  const [step, setStep] = useState<Step>('search');
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<AvailableDate | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<AppointmentDetails | null>(null);
  const [existingAppointment, setExistingAppointment] = useState<AppointmentDetails | null>(null);

  function handleVolunteerSelect(v: Volunteer) {
    setVolunteer(v);
    setStep('confirm');
  }

  function backToSearch() {
    setVolunteer(null);
    setVerificationToken(null);
    setExistingAppointment(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlotId(null);
    setStep('search');
  }

  async function handleConfirmIdentity(token: string) {
    if (!volunteer) return;
    setVerificationToken(token);
    setIsLoading(true);
    try {
      const mineRes = await fetch('/api/appointments/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer.id,
          verificationToken: token,
          missionSlug: mission.slug,
        }),
      });
      const mineData = await mineRes.json();

      if (!mineRes.ok) {
        toast.error(mineData.error || 'Erro ao verificar agendamento existente');
        return;
      }

      if (mineData.appointment) {
        setExistingAppointment(mineData.appointment);
        setStep('already-booked');
        return;
      }

      const res = await fetch(`/api/dates/available?mission=${encodeURIComponent(mission.slug)}`);
      const data = await res.json();
      setAvailableDates(data.dates || []);
      setStep('pick-date');
    } catch {
      toast.error('Erro ao carregar datas disponíveis. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDateSelect(date: AvailableDate) {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedSlotId(null);

    if (date.schedule_mode === 'presence_only') {
      await confirmPresence(date, null, null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/dates/${date.id}/slots`);
      const data = await res.json();
      setSlots(data.slots || []);
      setStep('pick-time');
    } catch {
      toast.error('Erro ao carregar horários.');
    } finally {
      setIsLoading(false);
    }
  }

  function backToDates() {
    setSelectedDate(null);
    setSlots([]);
    setSelectedTime(null);
    setSelectedSlotId(null);
    setStep('pick-date');
  }

  function handleTimeSelect(time: string, slotId: string) {
    setSelectedTime(time);
    setSelectedSlotId(slotId);
  }

  async function confirmPresence(
    date: AvailableDate,
    slotId: string | null,
    time: string | null,
  ) {
    if (!volunteer || !verificationToken) {
      toast.error('Identidade não verificada.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer.id,
          donationDateId: date.id,
          timeSlotId: slotId,
          verificationToken,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Não foi possível confirmar a presença');
      }

      setSuccessData({
        nr: json.appointment.volunteer_nr || volunteer.nr,
        warName: json.appointment.volunteer_war_name || volunteer.war_name,
        fullName: json.appointment.volunteer_full_name || volunteer.full_name,
        date: json.appointment.donation_date,
        dayName: date.day_name,
        time: json.appointment.time_slot || time,
        missionName: mission.name,
      });
      setStep('success');
      toast.success('Presença confirmada.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao confirmar. Tente novamente.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmAppointment() {
    if (!selectedDate) return;
    await confirmPresence(selectedDate, selectedSlotId, selectedTime);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">
          Agendamento
        </div>
        <h2 className="mt-1 text-xl font-extrabold text-[var(--olive-900)]">{mission.name}</h2>
      </div>

      {isLoading && step !== 'search' && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      )}

      {step === 'search' && (
        <div className="card p-5 sm:p-6">
          <div className="mb-4">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">1. Identificação</div>
            <h3 className="mt-1 text-xl font-extrabold text-[var(--olive-900)]">Quem vai participar?</h3>
          </div>
          <VolunteerSearch onSelect={handleVolunteerSelect} isLoading={isLoading} setIsLoading={setIsLoading} />
        </div>
      )}

      {step === 'confirm' && volunteer && (
        <VolunteerConfirmCard volunteer={volunteer} onConfirm={handleConfirmIdentity} onBack={backToSearch} />
      )}

      {step === 'pick-date' && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">2. Data</div>
              <h3 className="text-xl font-extrabold text-[var(--olive-900)]">Escolha a data disponível</h3>
            </div>
            <button onClick={backToSearch} className="text-sm font-bold text-[var(--olive)] hover:underline">Trocar voluntário</button>
          </div>

          {availableDates.length === 0 ? (
            <EmptyState title="Nenhuma data disponível" description="Não há datas ativas com vagas no momento." />
          ) : (
            <div className="space-y-3">
              {availableDates.map((date) => (
                <DateAvailabilityCard key={date.id} date={date} selected={selectedDate?.id === date.id} onSelect={handleDateSelect} />
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'pick-time' && selectedDate && (
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">3. Horário</div>
                <h3 className="text-xl font-extrabold text-[var(--olive-900)]">Escolha o horário</h3>
              </div>
              <button onClick={backToDates} className="text-sm font-bold text-[var(--olive)] hover:underline">Trocar data</button>
            </div>
            <TimeSlotPicker slots={slots} selectedTime={selectedTime} onSelect={handleTimeSelect} disabled={isLoading} />
          </div>

          <div className="card p-5">
            <div className="mb-5 grid gap-2 text-sm">
              <div><span className="info-label">Voluntário</span><div className="font-bold">{volunteer?.war_name || volunteer?.full_name}</div></div>
              <div><span className="info-label">Data</span><div className="font-bold">{selectedDate.day_name}, {formatDateBR(selectedDate.date)}</div></div>
              <div><span className="info-label">Horário</span><div className="font-bold">{selectedTime || 'Selecione um horário'}</div></div>
            </div>

            <button onClick={handleConfirmAppointment} disabled={!selectedTime || isLoading} className="btn btn-primary w-full">
              {isLoading ? 'Confirmando...' : 'Confirmar presença'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && successData && (
        <SuccessCard {...successData} />
      )}

      {step === 'already-booked' && existingAppointment && (
        <AppointmentDetailsCard
          {...existingAppointment}
          variant="lookup"
          footer={<LookupCardFooter />}
        />
      )}
    </div>
  );
}
