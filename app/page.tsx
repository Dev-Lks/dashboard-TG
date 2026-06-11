import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin, Phone, ShieldCheck, Users } from 'lucide-react';
import { PublicShell } from '@/components/layout/PublicShell';

export default function LandingPage() {
  return (
    <PublicShell>
      <section className="mission-panel -mx-4 px-4 py-8 sm:mx-0 sm:rounded-lg sm:px-8 sm:py-10">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded border border-[var(--sand)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--sand)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Operação de doação
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Missão: Doação de Sangue</h1>
          <p className="mt-2 text-base font-semibold text-[var(--sand)] sm:text-lg">TG 11 — Tiro de Guerra de Ituiutaba/MG</p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-inverse)]/85 sm:text-base">
            Sistema de apoio operacional para organizar o efetivo de Monitores e Atiradores nas datas autorizadas de doação. Cada data comporta até 15 agendamentos confirmados.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/agendar" className="btn btn-primary btn-lg sm:w-auto">
              Iniciar agendamento <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin" className="btn btn-ghost btn-lg border border-white/10 sm:w-auto">
              Painel de comando
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card operation-strip p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--olive)]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="font-extrabold text-[var(--olive-900)]">Janelas autorizadas</div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Segunda-feira, 07h às 10h. Quinta-feira, 13h às 17h.</p>
        </div>
        <div className="card operation-strip p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--olive)]">
            <Users className="h-5 w-5" />
          </div>
          <div className="font-extrabold text-[var(--olive-900)]">Capacidade controlada</div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Limite máximo de 15 confirmados por data, validado no banco de dados.</p>
        </div>
        <div className="card operation-strip p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--olive)]">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="font-extrabold text-[var(--olive-900)]">Local de apresentação</div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Av. Quarenta e Nove, 125 — Elândia, Ituiutaba/MG.</p>
          <a href="https://maps.app.goo.gl/6NC5uPAW1jxJRsBPA?g_st=iw" target="_blank" className="mt-2 inline-flex text-sm font-bold text-[var(--olive)] hover:underline">
            Ver no mapa
          </a>
        </div>
      </section>

      <section className="mt-4 card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--olive-dark)]">Contato operacional</div>
            <a href="tel:3432719275" className="mt-1 inline-flex items-center gap-2 text-xl font-extrabold text-[var(--olive-900)]">
              <Phone className="h-5 w-5 text-[var(--olive)]" />
              (34) 3271-9275
            </a>
          </div>
          <Link href="/agendar" className="btn btn-secondary sm:w-auto">
            Fazer meu agendamento
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
