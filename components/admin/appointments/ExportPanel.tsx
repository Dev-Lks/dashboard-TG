'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { DateRoster } from '@/lib/appointments/queries';
import { formatDateBR } from '@/lib/date-utils';
import { formatDayShortLabel } from '@/lib/dates/schedule-display';
import { downloadSpreadsheetWithToast } from '@/lib/export/download-spreadsheet';

type ExportMission = {
  slug: string;
  name: string;
};

type ExportPanelProps = {
  missions: ExportMission[];
  rosters: DateRoster[];
  selectedMission: string | null;
  selectedDate: string | null;
};

export function ExportPanel({
  missions,
  selectedMission,
  selectedDate,
}: ExportPanelProps) {
  const [loading, setLoading] = useState<'selection' | 'full' | 'mission' | null>(null);

  const selectedMissionName = missions.find((m) => m.slug === selectedMission)?.name;
  const dateLabel = selectedDate
    ? `${formatDateBR(selectedDate)} · ${formatDayShortLabel(selectedDate)}`
    : null;

  async function handleSelectionExport() {
    setLoading('selection');
    try {
      await downloadSpreadsheetWithToast({
        mission: selectedMission || undefined,
        date: selectedDate || undefined,
        missionName: selectedMissionName,
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleFullExport() {
    setLoading('full');
    try {
      await downloadSpreadsheetWithToast();
    } finally {
      setLoading(null);
    }
  }

  async function handleMissionExport() {
    if (!selectedMission) return;
    setLoading('mission');
    try {
      await downloadSpreadsheetWithToast({
        mission: selectedMission,
        missionName: selectedMissionName,
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="admin-export-toolbar card">
      <div className="admin-export-toolbar-row">
        <span className="admin-export-toolbar-label">Exportar</span>

        <div className="admin-export-toolbar-context">
          {selectedMissionName && (
            <span className="admin-export-context-item">{selectedMissionName}</span>
          )}
          {dateLabel && (
            <>
              <span className="admin-export-context-sep" aria-hidden="true">·</span>
              <span className="admin-export-context-item">{dateLabel}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleSelectionExport}
          disabled={loading !== null || !selectedMission}
          className="btn btn-secondary admin-export-download-btn"
          title="Baixar seleção atual"
          aria-label="Baixar seleção atual"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {loading === 'selection' ? '...' : ''}
        </button>
      </div>

      <div className="admin-export-toolbar-links">
        <button
          type="button"
          onClick={handleFullExport}
          disabled={loading !== null}
          className="admin-export-link"
        >
          {loading === 'full' ? 'Baixando...' : 'Baixar tudo'}
        </button>
        {selectedMission && (
          <>
            <span className="admin-export-link-sep" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleMissionExport}
              disabled={loading !== null}
              className="admin-export-link"
            >
              {loading === 'mission' ? 'Baixando...' : 'Baixar missão'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
