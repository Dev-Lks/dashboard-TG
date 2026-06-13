'use client';

import Link from 'next/link';
import { CheckCircle, MapPin, Phone, Calendar, Clock } from 'lucide-react';
import { formatDateBR } from '@/lib/date-utils';

export type AppointmentDetails = {
  nr: string;
  warName: string | null;
  fullName: string;
  date: string;
  dayName: string;
  time: string | null;
  missionName?: string | null;
};

type Variant = 'success' | 'lookup';

type AppointmentDetailsCardProps = AppointmentDetails & {
  variant?: Variant;
  footer?: React.ReactNode;
};

const titles: Record<Variant, string> = {
  success: 'Missão registrada',
  lookup: 'Sua missão agendada',
};

export function AppointmentDetailsCard({
  nr,
  warName,
  fullName,
  date,
  dayName,
  time,
  missionName,
  variant = 'lookup',
  footer,
}: AppointmentDetailsCardProps) {
  const formattedDate = `${dayName}, ${formatDateBR(date)}`;

  return (
    <div className="card max-w-xl mx-auto overflow-hidden">
      <div className="appointment-card-header p-6 text-center">
        <CheckCircle className="appointment-card-icon mx-auto h-12 w-12 mb-3" />
        <div className="text-2xl font-extrabold tracking-tight">{titles[variant]}</div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-y-3 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">NR:</span>{' '}
            <span className="font-mono font-semibold">{nr}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Nome de Guerra:</span>{' '}
            <span className="font-semibold">{warName || fullName}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Nome completo:</span>{' '}
            <span>{fullName}</span>
          </div>
        </div>

        <div className="border-t pt-5">
          {missionName && (
            <div className="mb-3 text-sm">
              <span className="text-[var(--text-muted)]">Missão:</span>{' '}
              <span className="font-semibold">{missionName}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-[var(--olive)] mt-0.5" />
            <div>
              <div className="font-semibold text-lg tracking-tight">{formattedDate}</div>
              <div className="text-[var(--olive)] font-bold flex items-center gap-1.5 mt-0.5">
                <Clock className="h-4 w-4" /> {time || 'Presença no dia'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
          <div className="font-semibold">Local</div>
          <div>Avenida Quarenta e Nove, nº 125 — Elândia, Ituiutaba-MG</div>
          <a
            href="https://maps.app.goo.gl/6NC5uPAW1jxJRsBPA?g_st=iw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-[var(--olive)] hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" /> Abrir no Google Maps
          </a>
          <div className="pt-1.5 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> (34) 3271-9275
          </div>
        </div>

        <div className="appointment-card-note rounded-md px-4 py-3 text-xs font-medium">
          Caso precise alterar ou cancelar seu agendamento, procure o responsável no TG.
        </div>
      </div>

      {footer && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] p-4 flex flex-col sm:flex-row justify-center gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}

export function SuccessCardFooter() {
  return (
    <>
      <Link href="/meus-agendamentos" className="btn btn-secondary text-sm">
        Consultar depois
      </Link>
      <Link href="/" className="btn btn-secondary text-sm">
        Voltar à página inicial
      </Link>
    </>
  );
}

export function LookupCardFooter({ onReset }: { onReset?: () => void }) {
  return (
    <>
      {onReset && (
        <button type="button" onClick={onReset} className="btn btn-secondary text-sm">
          Consultar outro cadastro
        </button>
      )}
      <Link href="/" className="btn btn-secondary text-sm">
        Voltar à página inicial
      </Link>
    </>
  );
}
