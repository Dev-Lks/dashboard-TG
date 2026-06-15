'use client';

import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Users } from 'lucide-react';
import type { PublicMissionWithDates } from '@/lib/dates/public-queries';
import { MISSION_EYEBROW, UNIT_LABEL } from '@/lib/branding';

type MissionHubProps = {
  missions: PublicMissionWithDates[];
};

function MissionCard({ mission }: { mission: PublicMissionWithDates }) {
  const hasOpen = mission.open_dates_count > 0;
  const nextDate = mission.upcoming_dates[0];

  return (
    <article className="card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
        <h2 className="text-lg font-extrabold text-[var(--olive-900)]">{mission.name}</h2>
        {mission.description && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{mission.description}</p>
        )}
      </div>

      <div className="space-y-3 p-4">
        {mission.location && (
          <div className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div>{mission.location}</div>
              {mission.maps_url && (
                <a href={mission.maps_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-bold text-[var(--olive)] hover:underline">
                  Ver no mapa
                </a>
              )}
            </div>
          </div>
        )}

        {nextDate && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-[var(--olive)]" />
            <span>
              Próxima: <strong>{nextDate.formatted_date}</strong>
              {nextDate.is_full ? ' (cheia)' : ` — ${nextDate.remaining} vagas`}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {hasOpen ? (
            <Link href={`/agendar/${mission.slug}`} className="btn btn-primary">
              Escolher missão <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button type="button" disabled className="btn btn-primary opacity-60">
              Sem vagas abertas
            </button>
          )}
          {mission.phone && (
            <a href={`tel:${mission.phone.replace(/\D/g, '')}`} className="btn btn-ghost">
              <Phone className="h-4 w-4" />
              {mission.phone}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function MissionHub({ missions }: MissionHubProps) {
  if (missions.length === 0) {
    return (
      <section className="mission-panel rounded-lg px-5 py-8 sm:px-8 sm:py-10">
        <div className="max-w-2xl">
          <p className="panel-eyebrow text-xs font-extrabold uppercase tracking-[0.18em]">{MISSION_EYEBROW}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{UNIT_LABEL}</h1>
          <p className="panel-muted mt-4 text-base leading-7">
            Nenhuma missão aberta para agendamento no momento. Aguarde a publicação pela coordenação.
          </p>
          <Link href="/meus-agendamentos" className="panel-link mt-6 inline-block text-sm font-bold hover:underline">
            Já confirmou presença? Consulte seu agendamento
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="mission-panel rounded-lg px-5 py-6 sm:px-8 sm:py-8">
        <p className="panel-eyebrow text-xs font-extrabold uppercase tracking-[0.18em]">{MISSION_EYEBROW}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{UNIT_LABEL}</h1>
        <p className="panel-muted mt-2 text-sm">
          Escolha uma missão para confirmar sua presença no efetivo.
        </p>
        <Link href="/meus-agendamentos" className="panel-link mt-4 inline-block text-sm font-bold hover:underline">
          Já confirmou presença? Consulte seu agendamento
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {missions.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
      </section>
    </div>
  );
}
