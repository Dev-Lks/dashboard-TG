'use client';

import Link from 'next/link';
import { CheckCircle, MapPin, Phone, Calendar, Clock } from 'lucide-react';
import { formatDateBR } from '@/lib/date-utils';

interface SuccessProps {
  nr: string;
  warName: string | null;
  fullName: string;
  date: string;
  dayName: string;
  time: string | null;
}

export function SuccessCard({ nr, warName, fullName, date, dayName, time }: SuccessProps) {
  const formattedDate = `${dayName}, ${formatDateBR(date)}`;

  return (
    <div className="card max-w-xl mx-auto overflow-hidden">
      <div className="bg-[var(--surface-dark)] p-6 text-center text-[var(--text-inverse)]">
        <CheckCircle className="mx-auto h-12 w-12 mb-3" />
        <div className="text-2xl font-extrabold tracking-tight">Missão registrada</div>
        <div className="mt-1 text-sm font-medium text-[var(--sand)]">Agendamento confirmado com sucesso.</div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-widest text-[var(--olive-dark)]">Dados do agendamento</div>
          <div className="mt-3 grid gap-y-3 text-sm">
            <div><span className="text-[var(--text-muted)]">NR:</span> <span className="font-mono font-semibold">{nr}</span></div>
            <div><span className="text-[var(--text-muted)]">Nome de Guerra:</span> <span className="font-semibold">{warName || fullName}</span></div>
            <div><span className="text-[var(--text-muted)]">Nome completo:</span> <span>{fullName}</span></div>
          </div>
        </div>

        <div className="border-t pt-5">
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-[var(--olive)] mt-0.5" />
            <div>
              <div className="font-semibold text-lg tracking-tight">{formattedDate}</div>
              <div className="text-[var(--olive)] font-bold flex items-center gap-1.5 mt-0.5">
                <Clock className="h-4 w-4" /> {time || 'Horário a confirmar'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
          <div className="font-semibold">Local</div>
          <div>Avenida Quarenta e Nove, nº 125 — Elândia, Ituiutaba-MG</div>
          <a href="https://maps.app.goo.gl/6NC5uPAW1jxJRsBPA?g_st=iw" target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--olive)] hover:underline">
            <MapPin className="h-3.5 w-3.5" /> Abrir no Google Maps
          </a>
          <div className="pt-1.5 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> (34) 3271-9275
          </div>
        </div>

        <div className="rounded-md border border-[var(--sand)] bg-[var(--sand-light)] px-4 py-3 text-xs font-medium text-[var(--olive-900)]">
          Caso precise alterar ou cancelar seu agendamento, procure o responsável no TG.
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] p-4 flex justify-center">
        <Link href="/" className="btn btn-secondary text-sm">Voltar à página inicial</Link>
      </div>
    </div>
  );
}
