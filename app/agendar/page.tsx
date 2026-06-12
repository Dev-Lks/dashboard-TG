'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Volunteer, AvailableDate, AvailableSlot } from '@/lib/types';
import { toast } from 'sonner';
import { VolunteerSearch } from '@/components/VolunteerSearch';
import { VolunteerConfirmCard } from '@/components/VolunteerConfirmCard';
import { DateAvailabilityCard } from '@/components/DateAvailabilityCard';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { SuccessCard } from '@/components/SuccessCard';
import { PublicShell } from '@/components/layout/PublicShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateBR } from '@/lib/date-utils';

type Step = 'search' | 'confirm' | 'pick-date' | 'pick-time' | 'success';

const steps: { id: Step; label: string }[] = [
  { id: 'search', label: 'Identificar' },
  { id: 'confirm', label: 'Confirmar' },
  { id: 'pick-date', label: 'Data' },
  { id: 'pick-time', label: 'Horário' },
  { id: 'success', label: 'Registro' },
];

export default function AgendarPage() {
  const [step, setStep] = useState<Step>('search');
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<AvailableDate | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === step));

  function handleVolunteerSelect(v: Volunteer) {
    setVolunteer(v);
    setStep('confirm');
  }

  function backToSearch() {
    setVolunteer(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlotId(null);
    setStep('search');
  }

  async function handleConfirmIdentity() {
    if (!volunteer) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/dates/available');
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

  async function handleConfirmAppointment() {
    if (!volunteer || !selectedDate || !selectedSlotId) {
      toast.error('Selecione data e horário');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer.id,
          donationDateId: selectedDate.id,
          timeSlotId: selectedSlotId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Não foi possível confirmar o agendamento');
      }

      setSuccessData({
        nr: json.appointment.volunteer_nr || volunteer.nr,
        warName: json.appointment.volunteer_war_name || volunteer.war_name,
        fullName: json.appointment.volunteer_full_name || volunteer.full_name,
        date: json.appointment.donation_date,
        dayName: selectedDate.day_name,
        time: json.appointment.time_slot,
      });
      setStep('success');
      toast.success('Agendamento confirmado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao agendar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PublicShell compact>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <button onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--olive)] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="mission-panel rounded-lg px-5 py-6 sm:px-7">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sand)]">Missão: Doação de Sangue</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Registrar agendamento</h1>
          </div>
        </div>

        <div className="mb-5">
          {/* Mobile: single progress bar + step label */}
          <div className="sm:hidden" role="group" aria-label="Progresso do agendamento">
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={currentIndex + 1}
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-label={`Passo ${currentIndex + 1} de ${steps.length}: ${steps[currentIndex]?.label}`}
            >
              <div
                className="progress-fill transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop: full stepper with labels */}
          <div className="hidden grid-cols-5 gap-1.5 sm:grid" role="list" aria-label="Etapas do agendamento">
            {steps.map((s, index) => (
              <div key={s.id} role="listitem" aria-current={index === currentIndex ? 'step' : undefined}>
                <div className={`h-1.5 rounded-full ${index <= currentIndex ? 'bg-[var(--olive)]' : 'bg-[var(--sand-light)]'}`} />
                <div className={`mt-1 truncate text-center text-[10px] font-bold uppercase tracking-[0.08em] ${index <= currentIndex ? 'text-[var(--olive-dark)]' : 'text-[var(--text-muted)]'}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
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
              <h2 className="mt-1 text-xl font-extrabold text-[var(--olive-900)]">Encontre seu cadastro</h2>
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
                <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">3. Data</div>
                <h2 className="text-xl font-extrabold text-[var(--olive-900)]">Escolha a data disponível</h2>
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
                  <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">4. Horário</div>
                  <h2 className="text-xl font-extrabold text-[var(--olive-900)]">Escolha o horário</h2>
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
                {isLoading ? 'Confirmando...' : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && successData && (
          <SuccessCard {...successData} />
        )}
      </div>
    </PublicShell>
  );
}
