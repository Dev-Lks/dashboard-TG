'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { markAttendanceAction } from '@/lib/appointments/actions';
import type { MissionAttendanceRow, MissionAttendanceSummary } from '@/lib/appointments/mission-attendance';
import type { MissionAttendanceState } from '@/lib/types';
import { TURMAS, type TurmaId } from '@/lib/volunteers/turmas';
import { getRoleLabel } from '@/lib/volunteers/roles';
import { formatDateBR } from '@/lib/date-utils';
import { StatCard } from '@/components/admin/StatCard';
import { MissionAttendanceStatusBadge } from './MissionAttendanceStatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';

type MissionAttendancePageProps = {
  missionName: string;
  missionSlug: string;
  rows: MissionAttendanceRow[];
  summary: MissionAttendanceSummary;
  initialFilters: {
    q?: string;
    status?: string;
    turma?: string;
    role?: string;
  };
};

function groupRowsByTurma(rows: MissionAttendanceRow[]) {
  const byTurma: Record<TurmaId, MissionAttendanceRow[]> = { t1: [], t2: [], t3: [] };
  const semTurma: MissionAttendanceRow[] = [];

  for (const row of rows) {
    if (row.turmaId) {
      byTurma[row.turmaId].push(row);
    } else {
      semTurma.push(row);
    }
  }

  return { byTurma, semTurma };
}

function AttendanceTable({
  rows,
  pending,
  onMark,
}: {
  rows: MissionAttendanceRow[];
  pending: boolean;
  onMark: (appointmentId: string, status: 'completed' | 'no_show') => void;
}) {
  if (rows.length === 0) {
    return <p className="px-1 py-2 text-sm text-[var(--text-muted)]">Ninguém nesta turma.</p>;
  }

  return (
    <>
      <table className="table hidden w-full text-sm md:table">
        <thead>
          <tr>
            <th>NR</th>
            <th>Guerra</th>
            <th>Função</th>
            <th>Data</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.volunteerId}>
              <td className="font-mono font-semibold">{row.nr}</td>
              <td className="font-medium">{row.warName || '—'}</td>
              <td>{getRoleLabel(row.role)}</td>
              <td className="font-mono text-xs">
                {row.scheduledDate ? (
                  <>
                    {formatDateBR(row.scheduledDate)}
                    {row.scheduledTime ? ` • ${row.scheduledTime}` : ''}
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td>
                <MissionAttendanceStatusBadge state={row.state} />
              </td>
              <td>
                {row.state === 'scheduled' && row.appointmentId && (
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onMark(row.appointmentId!, 'completed')}
                      className="admin-simple-btn admin-simple-btn--primary text-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Realizado
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onMark(row.appointmentId!, 'no_show')}
                      className="admin-simple-btn admin-simple-btn--danger text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Faltou
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <div key={row.volunteerId} className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-extrabold text-[var(--olive-900)]">{row.warName || row.fullName}</div>
                <div className="font-mono text-xs font-bold text-[var(--text-muted)]">NR {row.nr}</div>
              </div>
              <MissionAttendanceStatusBadge state={row.state} />
            </div>
            <div className="mt-2 text-xs text-[var(--text-muted)]">
              {getRoleLabel(row.role)}
              {row.scheduledDate && (
                <> • {formatDateBR(row.scheduledDate)}{row.scheduledTime ? ` ${row.scheduledTime}` : ''}</>
              )}
            </div>
            {row.state === 'scheduled' && row.appointmentId && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onMark(row.appointmentId!, 'completed')}
                  className="btn btn-primary btn-sm flex-1"
                >
                  Realizado
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onMark(row.appointmentId!, 'no_show')}
                  className="btn btn-danger btn-sm flex-1"
                >
                  Faltou
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function MissionAttendancePage({
  missionName,
  missionSlug,
  rows,
  summary,
  initialFilters,
}: MissionAttendancePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialFilters.q || '');

  const grouped = useMemo(() => groupRowsByTurma(rows), [rows]);

  const applyFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/missoes/${missionSlug}/controle?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: search.trim() });
  };

  const handleMark = (appointmentId: string, status: 'completed' | 'no_show') => {
    startTransition(async () => {
      const result = await markAttendanceAction(appointmentId, status);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao registrar');
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Realizados" value={summary.completed} tone="success" />
        <StatCard label="Agendados" value={summary.scheduled} />
        <StatCard label="Não compareceu" value={summary.noShow} tone="danger" />
        <StatCard label="Pendentes" value={summary.notScheduled} tone="sand" />
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar NR ou nome..."
              className="input w-full pl-9 text-sm"
            />
          </div>
          <select
            name="status"
            defaultValue={initialFilters.status || ''}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="input text-sm"
          >
            <option value="">Todos os status</option>
            <option value="completed">Realizado</option>
            <option value="scheduled">Agendado</option>
            <option value="no_show">Não compareceu</option>
            <option value="not_scheduled">Pendente</option>
          </select>
          <select
            name="turma"
            defaultValue={initialFilters.turma || ''}
            onChange={(e) => applyFilters({ turma: e.target.value })}
            className="input text-sm"
          >
            <option value="">Todas as turmas</option>
            {TURMAS.map((t) => (
              <option key={t.id} value={t.id}>{t.label} — {t.name}</option>
            ))}
          </select>
          <select
            name="role"
            defaultValue={initialFilters.role || 'atirador'}
            onChange={(e) => applyFilters({ role: e.target.value })}
            className="input text-sm"
          >
            <option value="atirador">Só atiradores</option>
            <option value="monitor">Só monitores</option>
            <option value="all">Monitores e atiradores</option>
          </select>
        </form>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => applyFilters({ q: search.trim() })} className="btn btn-secondary btn-sm">
            Buscar
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum resultado" description="Ajuste os filtros ou cadastre voluntários." />
      ) : (
        <div className="space-y-4">
          {TURMAS.map((t) => {
            const turmaRows = grouped.byTurma[t.id];
            if (turmaRows.length === 0) return null;
            return (
              <div key={t.id} className="card overflow-hidden">
                <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                  <span className="font-extrabold text-[var(--olive-900)]">{t.label} — {t.name}</span>
                  <span className="ml-2 text-sm font-semibold text-[var(--text-muted)]">({turmaRows.length})</span>
                </div>
                <div className="p-3">
                  <AttendanceTable rows={turmaRows} pending={pending} onMark={handleMark} />
                </div>
              </div>
            );
          })}

          {grouped.semTurma.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <span className="font-extrabold text-[var(--olive-900)]">Sem turma</span>
                <span className="ml-2 text-sm font-semibold text-[var(--text-muted)]">({grouped.semTurma.length})</span>
              </div>
              <div className="p-3">
                <AttendanceTable rows={grouped.semTurma} pending={pending} onMark={handleMark} />
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-[var(--text-muted)]">
        Missão: <strong>{missionName}</strong> • {summary.total} no efetivo filtrado
      </p>
    </div>
  );
}
