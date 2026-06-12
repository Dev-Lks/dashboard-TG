'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Volunteer } from '@/lib/types';
import { FormField } from '@/components/shared/FormField';
import { BirthDatePicker } from '@/components/BirthDatePicker';

interface Props {
  volunteer: Volunteer;
  onConfirm: (verificationToken: string) => void;
  onBack: () => void;
}

export function VolunteerConfirmCard({ volunteer, onConfirm, onBack }: Props) {
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleBirthDateChange = useCallback((date: string | null) => {
    setBirthDate(date);
    if (date) setError(null);
  }, []);

  async function handleConfirm() {
    if (!birthDate) return;

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/volunteers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: volunteer.id, birthDate }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Data de nascimento incorreta');
        return;
      }

      onConfirm(json.verificationToken);
    } catch {
      setError('Erro ao verificar identidade. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm">
        <div className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[96px,1fr]">
          <div className="info-label">NR</div>
          <div className="font-mono text-base font-bold">{volunteer.nr}</div>
        </div>
        <div className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[96px,1fr]">
          <div className="info-label">Função</div>
          <div className="font-semibold">{volunteer.grad || 'Monitor / Atirador'}</div>
        </div>
        <div className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[96px,1fr]">
          <div className="info-label">Guerra</div>
          <div className="text-lg font-extrabold tracking-tight text-[var(--olive-900)]">{volunteer.war_name || '—'}</div>
        </div>
        <div className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[96px,1fr]">
          <div className="info-label">Nome</div>
          <div className="font-medium">{volunteer.full_name}</div>
        </div>
      </div>

      <div className="mt-6">
        <FormField
          label="Confirme sua identidade"
          hint="Só você deve saber sua data de nascimento."
        >
          <BirthDatePicker
            onChange={handleBirthDateChange}
            disabled={isVerifying}
            hasError={!!error}
          />
        </FormField>

        {error && (
          <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        )}

        <p className="mt-3 text-[11px] font-medium text-[var(--text-muted)]">
          Data errada no cadastro? Fale com o monitor para corrigir.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
        <button onClick={onBack} className="btn btn-secondary flex-1" disabled={isVerifying}>
          Buscar novamente
        </button>
        <button
          onClick={handleConfirm}
          className="btn btn-primary flex-1"
          disabled={!birthDate || isVerifying}
        >
          {isVerifying ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando...
            </span>
          ) : (
            'Confirmar identidade'
          )}
        </button>
      </div>
    </div>
  );
}
