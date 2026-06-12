'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { DateRoster } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';
import { getDonationDayInfo } from '@/lib/dates/profiles';
import { downloadSpreadsheetWithToast } from '@/lib/export/download-spreadsheet';

type ExportPanelProps = {
  rosters: DateRoster[];
};

export function ExportPanel({ rosters }: ExportPanelProps) {
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingDate, setLoadingDate] = useState<string | null>(null);

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

  return (
    <div className="card admin-export-panel">
      <div className="admin-export-panel-head">
        <h2 className="admin-export-panel-title">Exportar planilhas</h2>
        <p className="admin-export-panel-sub">Arquivos Excel (.xlsx) prontos para uso</p>
      </div>

      <button
        type="button"
        onClick={handleFullExport}
        disabled={loadingFull}
        className="btn btn-primary btn-block admin-export-full-btn"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        {loadingFull ? 'Baixando...' : 'Baixar planilha completa'}
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
                      {formatDateBR(r.date)} • {info.shortLabel} • {info.timeRange}
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
