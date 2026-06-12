'use client';

import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Users } from 'lucide-react';
import type { PublicMissionDate } from '@/lib/dates/public-queries';
import { MISSION_EYEBROW, UNIT_LABEL } from '@/lib/branding';

type EventHeroProps = {
  dates: PublicMissionDate[];
};

const MAPS_URL = 'https://maps.app.goo.gl/6NC5uPAW1jxJRsBPA?g_st=iw';
const PHONE = '(34) 3271-9275';

function DateCard({ date }: { date: PublicMissionDate }) {
  const percent = Math.min(100, Math.round((date.booked / date.capacity) * 100));

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-[var(--olive-900)]">{date.day_name}</div>
          <div className="text-sm font-semibold text-[var(--olive)]">{date.formatted_date}</div>
          <div className="mt-1 text-sm text-[var(--text-muted)]">{date.time_range}</div>
        </div>
        <span className={`badge shrink-0 ${date.is_full ? 'badge-closed' : 'badge-open'}`}>
          {date.is_full ? 'Cheia' : `${date.remaining} vagas`}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Users className="h-3.5 w-3.5" />
        <span>{date.booked}/{date.capacity} confirmados</span>
      </div>
      <div className="progress-track mt-2" aria-label={`Ocupação ${percent}%`}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function EventHero({ dates }: EventHeroProps) {
  const hasOpenSlots = dates.some((d) => !d.is_full);

  if (dates.length === 0) {
    return (
      <section className="mission-panel rounded-lg px-5 py-8 sm:px-8 sm:py-10">
        <div className="max-w-2xl">
          <p className="panel-eyebrow text-xs font-extrabold uppercase tracking-[0.18em]">{MISSION_EYEBROW}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{UNIT_LABEL}</h1>
          <p className="panel-muted mt-4 text-base leading-7">
            Nenhuma data aberta no momento. Aguarde a publicação de novas datas pela coordenação.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" disabled className="btn btn-primary btn-lg opacity-60 sm:w-auto">
              Aguardando nova data
            </button>
            <a href="tel:3432719275" className="panel-link inline-flex items-center gap-2 text-sm font-bold hover:underline">
              <Phone className="h-4 w-4" />
              {PHONE}
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="mission-panel rounded-lg px-5 py-6 sm:px-8 sm:py-8">
        <div className="max-w-2xl">
          <p className="panel-eyebrow text-xs font-extrabold uppercase tracking-[0.18em]">{MISSION_EYEBROW}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{UNIT_LABEL}</h1>
          <p className="panel-muted mt-2 text-sm">
            {dates.length} data{dates.length !== 1 ? 's' : ''} disponíve{dates.length !== 1 ? 'is' : 'l'} para agendamento
          </p>

          <div className="panel-muted mt-4 flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div>Av. Quarenta e Nove, 125 — Elândia, Ituiutaba/MG</div>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="panel-link mt-1 inline-block font-bold hover:underline">
                Ver no mapa
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {hasOpenSlots ? (
              <Link href="/agendar" className="btn btn-primary btn-lg sm:w-auto">
                Fazer meu agendamento <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button type="button" disabled className="btn btn-primary btn-lg opacity-60 sm:w-auto">
                Todas as vagas preenchidas
              </button>
            )}
            <a href="tel:3432719275" className="btn btn-ghost btn-lg sm:w-auto">
              <Phone className="h-4 w-4" />
              {PHONE}
            </a>
          </div>
          <Link
            href="/meus-agendamentos"
            className="panel-link mt-3 inline-block text-sm font-bold hover:underline"
          >
            Já agendou? Consulte seu agendamento
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Datas da missão
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {dates.map((d) => (
            <DateCard key={d.id} date={d} />
          ))}
        </div>
      </section>
    </div>
  );
}
