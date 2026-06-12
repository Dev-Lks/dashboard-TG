'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { DateRoster } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';
import { getDonationDayInfo } from '@/lib/dates/profiles';
import { downloadSpreadsheetWithToast } from '@/lib/export/download-spreadsheet';
import { TURMAS, type TurmaId } from '@/lib/volunteers/turmas';

type ExportPanelProps = {
  rosters: DateRoster[];
  showTurma?: boolean;
};

export function ExportPanel({ rosters, showTurma = true }: ExportPanelProps) {
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const [loadingTurma, setLoadingTurma] = useState<TurmaId | null>(null);
  const [loadingTurmaDate, setLoadingTurmaDate] = useState<string | null>(null);

  async function handleFullExport() {
    setLoadingFull(true);
    try {
      await downloadSpreadsheetWithToast();
    } finally {
      setLoadingFull(false);
    }
  }

  async function handleDateExport(date: string) {
    setLoadingDate(date);
    try {
      await downloadSpreadsheetWithToast({ date });
    } finally {
      setLoadingDate(null);
    }
  }

  async function handleTurmaExport(turmaId: TurmaId) {
    setLoadingTurma(turmaId);
    try {
      await downloadSpreadsheetWithToast({ turma: turmaId });
    } finally {
      setLoadingTurma(null);
    }
  }

  async function handleTurmaDateExport(turmaId: TurmaId, date: string) {
    setLoadingTurmaDate(`${turmaId}:${date}`);
    try {
      await downloadSpreadsheetWithToast({ turma: turmaId, date });
    } finally {
      setLoadingTurmaDate(null);
    }
  }

  return (
    <div className="card admin-export-panel">
      <div className="admin-export-panel-head">
        <h2 className="admin-export-panel-title">Quem vai doar?</h2>
        <p className="admin-export-panel-sub">Baixe a lista de agendados por data em Excel (.xlsx)</p>
      </div>

      <button
        type="button"
        onClick={handleFullExport}
        disabled={loadingFull}
        className="btn btn-primary btn-block admin-export-full-btn"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        {loadingFull ? 'Baixando...' : 'Baixar todos os agendados'}
      </button>

      {rosters.length > 0 && (
        <div className="admin-export-dates">
          <h3 className="admin-export-dates-title">Por data</h3>
          <div className="admin-export-dates-list">
            {rosters.map((r) => {
              const info = getDonationDayInfo(r.date);
              const isLoading = loadingDate === r.date;
              return (
                <div key={r.id} className="admin-export-date-row">
                  <div className="admin-export-date-info">
                    <div className="admin-export-date-label">
                      {formatDateBR(r.date)} • {info.shortLabel}
                    </div>
                    <div className="admin-export-date-meta">
                      {r.booked} confirmado{r.booked !== 1 ? 's' : ''}
                      {r.is_full && ' • CHEIA'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDateExport(r.date)}
                    disabled={isLoading}
                    className="btn btn-secondary btn-block admin-export-date-btn"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {isLoading ? 'Baixando...' : 'Baixar'}
                  </button>
                  {showTurma && (
                    <div className="col-span-full grid grid-cols-3 gap-2 pt-1">
                      {TURMAS.map((t) => {
                        const key = `${t.id}:${r.date}`;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleTurmaDateExport(t.id, r.date)}
                            disabled={loadingTurmaDate === key}
                            className="btn btn-outline btn-sm text-xs"
                          >
                            {loadingTurmaDate === key ? '...' : t.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showTurma && (
        <details className="admin-export-dates">
          <summary className="admin-export-dates-title cursor-pointer">Por turma (efetivo cadastrado)</summary>
          <div className="admin-export-dates-list mt-3">
            {TURMAS.map((t) => (
              <div key={t.id} className="admin-export-date-row">
                <div className="admin-export-date-info">
                  <div className="admin-export-date-label">{t.label} — {t.name}</div>
                  <div className="admin-export-date-meta">SEQ {t.min}–{t.max}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTurmaExport(t.id)}
                  disabled={loadingTurma === t.id}
                  className="btn btn-secondary btn-block admin-export-date-btn"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {loadingTurma === t.id ? 'Baixando...' : 'Baixar'}
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
