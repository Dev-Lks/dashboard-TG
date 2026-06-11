'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/export', { credentials: 'include' });
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
      a.download = `TG 11-002 DOAÇÃO DE SANGUE-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    <button onClick={handleExport} disabled={loading} className="btn btn-auto btn-primary admin-simple-export w-auto">
      <Download className="h-5 w-5" />
      {loading ? 'Baixando...' : 'Baixar planilha completa'}
    </button>
  );
}
