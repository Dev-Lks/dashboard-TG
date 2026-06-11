'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

type ExportDateButtonProps = {
  date: string;
};

export function ExportDateButton({ date }: ExportDateButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/export?date=${encodeURIComponent(date)}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        let msg = 'Falha ao gerar arquivo';
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TG11-doacao-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Planilha baixada');
    } catch {
      toast.error('Não foi possível baixar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleExport} disabled={loading} className="btn btn-auto btn-secondary admin-simple-export-date w-auto">
      <Download className="h-5 w-5" />
      {loading ? 'Baixando...' : 'Baixar esta data'}
    </button>
  );
}
