'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Volunteer } from '@/lib/types';
import { toast } from 'sonner';
import { VolunteerSearch } from '@/components/VolunteerSearch';
import { VolunteerConfirmCard } from '@/components/VolunteerConfirmCard';
import {
  AppointmentDetailsCard,
  LookupCardFooter,
  type AppointmentDetails,
} from '@/components/AppointmentDetailsCard';
import { PublicShell } from '@/components/layout/PublicShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { UNIT_ID } from '@/lib/branding';

type Step = 'search' | 'confirm' | 'result';

export default function MeusAgendamentosPage() {
  const [step, setStep] = useState<Step>('search');
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [hasNoAppointment, setHasNoAppointment] = useState(false);

  function handleVolunteerSelect(v: Volunteer) {
    setVolunteer(v);
    setStep('confirm');
  }

  function backToSearch() {
    setVolunteer(null);
    setAppointment(null);
    setHasNoAppointment(false);
    setStep('search');
  }

  async function handleConfirmIdentity(token: string) {
    if (!volunteer) return;

    setIsLoading(true);
    setHasNoAppointment(false);
    setAppointment(null);

    try {
      const res = await fetch('/api/appointments/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: volunteer.id, verificationToken: token }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Erro ao buscar agendamento');
        return;
      }

      if (json.appointment) {
        setAppointment(json.appointment);
      } else {
        setHasNoAppointment(true);
      }

      setStep('result');
    } catch {
      toast.error('Erro ao buscar agendamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PublicShell compact>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--olive)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">
            {UNIT_ID}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--olive-900)] sm:text-3xl">
            Meu agendamento
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Confirme sua identidade para consultar sua missão agendada.
          </p>
        </div>

        {isLoading && step !== 'search' && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando agendamento...
          </div>
        )}

        {step === 'search' && (
          <div className="card p-5 sm:p-6">
            <div className="mb-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">
                1. Identificação
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--olive-900)]">Encontre seu cadastro</h2>
            </div>
            <VolunteerSearch onSelect={handleVolunteerSelect} isLoading={isLoading} setIsLoading={setIsLoading} />
          </div>
        )}

        {step === 'confirm' && volunteer && (
          <VolunteerConfirmCard volunteer={volunteer} onConfirm={handleConfirmIdentity} onBack={backToSearch} />
        )}

        {step === 'result' && appointment && (
          <AppointmentDetailsCard
            {...appointment}
            variant="lookup"
            footer={<LookupCardFooter onReset={backToSearch} />}
          />
        )}

        {step === 'result' && hasNoAppointment && (
          <div className="space-y-4">
            <EmptyState
              title="Nenhum agendamento confirmado"
              description="Você ainda não possui uma missão agendada. Faça seu agendamento quando houver datas disponíveis."
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/agendar" className="btn btn-primary">
                Fazer agendamento
              </Link>
              <button type="button" onClick={backToSearch} className="btn btn-secondary">
                Consultar outro cadastro
              </button>
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
