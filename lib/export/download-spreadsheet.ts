import { toast } from 'sonner';

type DownloadSpreadsheetOptions = {
  date?: string;
};

function getFilename(date?: string): string {
  if (date) return `TG11-doacao-${date}.xlsx`;
  return `TG 11-002 DOAÇÃO DE SANGUE-${new Date().toISOString().slice(0, 10)}.xlsx`;
}

export async function downloadSpreadsheet(options?: DownloadSpreadsheetOptions): Promise<void> {
  const url = options?.date
    ? `/api/admin/export?date=${encodeURIComponent(options.date)}`
    : '/api/admin/export';

  const res = await fetch(url, { credentials: 'include' });
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
  a.download = getFilename(options?.date);
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
