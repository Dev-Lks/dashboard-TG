import { toast } from 'sonner';
import type { TurmaId } from '@/lib/volunteers/turmas';
import {
  exportFilenameByDate,
  exportFilenameByTurma,
  exportFilenameByTurmaAndDate,
  exportFilenameFull,
} from '@/lib/branding';

type DownloadSpreadsheetOptions = {
  date?: string;
  turma?: TurmaId;
};

function buildUrl(options?: DownloadSpreadsheetOptions): string {
  const params = new URLSearchParams();
  if (options?.date) params.set('date', options.date);
  if (options?.turma) params.set('turma', options.turma);
  const qs = params.toString();
  return qs ? `/api/admin/export?${qs}` : '/api/admin/export';
}

function getFilename(options?: DownloadSpreadsheetOptions): string {
  if (options?.date && options?.turma) {
    return exportFilenameByTurmaAndDate(options.turma, options.date);
  }
  if (options?.date) return exportFilenameByDate(options.date);
  if (options?.turma) return exportFilenameByTurma(options.turma);
  return exportFilenameFull();
}

export async function downloadSpreadsheet(options?: DownloadSpreadsheetOptions): Promise<void> {
  const res = await fetch(buildUrl(options), { credentials: 'include' });
  if (!res.ok) {
    let msg = 'Falha ao gerar arquivo';
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = getFilename(options);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
  toast.success('Planilha baixada');
}

export async function downloadSpreadsheetWithToast(options?: DownloadSpreadsheetOptions): Promise<void> {
  try {
    await downloadSpreadsheet(options);
  } catch {
    toast.error('Não foi possível baixar');
  }
}
