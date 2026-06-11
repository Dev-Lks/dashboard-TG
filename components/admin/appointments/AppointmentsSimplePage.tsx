'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { AppointmentRow, AppointmentStats, DateOccupancy, DateRoster, RosterVolunteer } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';
import { getDonationDayInfo } from '@/lib/dates/profiles';
import { RescheduleDrawer } from './RescheduleDrawer';
import { CancelAppointmentDialog } from './CancelAppointmentDialog';
import { ExportDateButton } from './ExportDateButton';
import { EmptyState } from '@/components/shared/EmptyState';

type AppointmentsSimplePageProps = {
  rosters: DateRoster[];
  stats: AppointmentStats;
  appointments: AppointmentRow[];
  availableDates: DateOccupancy[];
  selectedDate: string | null;
};

function filterVolunteers(list: RosterVolunteer[], query: string) {
  if (!query.trim()) return list;
  const s = query.toLowerCase();
  return list.filter(
    (v) =>
      v.nr.toLowerCase().includes(s) ||
      (v.war_name || '').toLowerCase().includes(s) ||
      v.full_name.toLowerCase().includes(s)
  );
}

function VolunteerTable({
  title,
  volunteers,
  appointmentsById,
  onReschedule,
  onCancel,
}: {
  title: string;
  volunteers: RosterVolunteer[];
  appointmentsById: Map<string, AppointmentRow>;
  onReschedule: (a: AppointmentRow) => void;
  onCancel: (a: AppointmentRow) => void;
}) {
  if (volunteers.length === 0) {
    return (
      <div className="admin-simple-section">
        <h3 className="admin-simple-section-title">{title}</h3>
        <p className="admin-simple-empty">Ninguém agendado ainda.</p>
      </div>
    );
  }

  return (
    <div className="admin-simple-section">
      <h3 className="admin-simple-section-title">{title} ({volunteers.length})</h3>
      <div className="admin-simple-table-wrap">
        <table className="admin-simple-table">
          <thead>
            <tr>
              <th>#</th>
              <th>NR</th>
              <th>Nome de Guerra</th>
              <th>Nome Completo</th>
              <th>Horário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((v, i) => {
              const appt = appointmentsById.get(v.id);
              return (
                <tr key={v.id}>
                  <td>{i + 1}</td>
                  <td className="font-mono">{v.nr}</td>
                  <td className="font-bold">{v.war_name || '—'}</td>
                  <td>{v.full_name}</td>
                  <td className="font-mono">{v.time || '—'}</td>
                  <td>
                    {appt && (
                      <div className="admin-simple-actions">
                        <button type="button" className="admin-simple-btn admin-simple-btn--primary" onClick={() => onReschedule(appt)}>
                          Reagendar
                        </button>
                        <button type="button" className="admin-simple-btn admin-simple-btn--danger" onClick={() => onCancel(appt)}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="admin-simple-cards">
        {volunteers.map((v, i) => {
          const appt = appointmentsById.get(v.id);
          return (
            <div key={v.id} className="admin-simple-card">
              <div className="admin-simple-card-head">
                <span className="admin-simple-card-num">{i + 1}</span>
                <div>
                  <div className="admin-simple-card-name">{v.war_name || v.full_name}</div>
                  <div className="admin-simple-card-nr">NR {v.nr}</div>
                </div>
                {v.time && <span className="admin-simple-card-time">{v.time}</span>}
              </div>
              {appt && (
                <div className="admin-simple-actions">
                  <button type="button" className="admin-simple-btn admin-simple-btn--primary" onClick={() => onReschedule(appt)}>
                    Reagendar
                  </button>
                  <button type="button" className="admin-simple-btn admin-simple-btn--danger" onClick={() => onCancel(appt)}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AppointmentsSimplePage({
  rosters,
  stats,
  appointments,
  availableDates,
  selectedDate,
}: AppointmentsSimplePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const activeRoster = rosters.find((r) => r.date === selectedDate) || rosters[0];

  const appointmentsById = useMemo(() => {
    const map = new Map<string, AppointmentRow>();
    appointments.forEach((a) => map.set(a.id, a));
    return map;
  }, [appointments]);

  const monitors = useMemo(
    () => filterVolunteers(activeRoster?.monitors || [], search),
    [activeRoster, search]
  );
  const atiradores = useMemo(
    () => filterVolunteers(activeRoster?.atiradores || [], search),
    [activeRoster, search]
  );

  const selectDate = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', date);
    router.push(`/admin/agendamentos?${params.toString()}`);
  };

  const handleRefresh = () => router.refresh();

  if (rosters.length === 0) {
    return (
      <div className="card p-6">
        <EmptyState
          title="Nenhuma data ativa"
          description="Cadastre datas da missão em Datas antes de ver os agendamentos."
        />
      </div>
    );
  }

  const dayInfo = activeRoster ? getDonationDayInfo(activeRoster.date) : null;

  return (
    <div className="admin-simple">
      {/* Resumo rápido */}
      <div className="admin-simple-summary">
        <div className="admin-simple-stat">
          <span className="admin-simple-stat-value">{stats.totalConfirmed}</span>
          <span className="admin-simple-stat-label">Confirmados</span>
        </div>
        <div className="admin-simple-stat">
          <span className="admin-simple-stat-value">{stats.activeDates}</span>
          <span className="admin-simple-stat-label">Datas abertas</span>
        </div>
        <div className="admin-simple-stat">
          <span className="admin-simple-stat-value">{stats.monitorsScheduled + stats.atiradoresScheduled}</span>
          <span className="admin-simple-stat-label">No efetivo</span>
        </div>
      </div>

      {/* Busca */}
      <div className="admin-simple-search">
        <Search className="admin-simple-search-icon" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por NR ou nome..."
          className="admin-simple-search-input"
        />
      </div>

      {/* Abas de data */}
      <div className="admin-simple-dates">
        {rosters.map((r) => {
          const info = getDonationDayInfo(r.date);
          const isActive = r.date === activeRoster?.date;
          const shortDate = formatDateBR(r.date).slice(0, 5);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => selectDate(r.date)}
              className={`admin-simple-date-tab ${isActive ? 'admin-simple-date-tab--active' : ''} ${r.is_full ? 'admin-simple-date-tab--full' : ''}`}
            >
              <span className="admin-simple-date-tab-date">{shortDate}</span>
              <span className="admin-simple-date-tab-day">{info.shortLabel}</span>
              <span className="admin-simple-date-tab-count">{r.booked}/{r.capacity}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da data selecionada */}
      {activeRoster && (
        <div className="card admin-simple-panel">
          <div className="admin-simple-panel-head">
            <div>
              <h2 className="admin-simple-panel-title">{formatDateBR(activeRoster.date)}</h2>
              <p className="admin-simple-panel-sub">
                {dayInfo?.dayLabel} • {dayInfo?.timeRange} •{' '}
                <strong>{activeRoster.remaining} vagas livres</strong>
                {activeRoster.is_full && ' • CHEIA'}
              </p>
            </div>
            <ExportDateButton date={activeRoster.date} />
          </div>

          <VolunteerTable
            title="Monitores"
            volunteers={monitors}
            appointmentsById={appointmentsById}
            onReschedule={(a) => { setSelected(a); setRescheduleOpen(true); }}
            onCancel={(a) => { setSelected(a); setCancelOpen(true); }}
          />

          <VolunteerTable
            title="Atiradores"
            volunteers={atiradores}
            appointmentsById={appointmentsById}
            onReschedule={(a) => { setSelected(a); setRescheduleOpen(true); }}
            onCancel={(a) => { setSelected(a); setCancelOpen(true); }}
          />
        </div>
      )}

      {/* Avançado (escondido) */}
      <details className="admin-simple-advanced">
        <summary>Ver cancelados e outras opções</summary>
        <p className="mt-3 text-base text-[var(--text-muted)]">
          Cancelados no sistema: <strong>{stats.totalCancelled}</strong>. Datas cheias: <strong>{stats.fullDates}</strong>.
        </p>
        <a href="/admin/agendamentos?status=cancelled" className="btn btn-secondary mt-3">
          Ver lista de cancelados
        </a>
      </details>

      <RescheduleDrawer
        appointment={selected}
        availableDates={availableDates}
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onSuccess={handleRefresh}
      />

      <CancelAppointmentDialog
        appointment={selected}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
