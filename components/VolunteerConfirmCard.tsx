'use client';

import type { Volunteer } from '@/lib/types';

interface Props {
  volunteer: Volunteer;
  onConfirm: () => void;
  onBack: () => void;
}

export function VolunteerConfirmCard({ volunteer, onConfirm, onBack }: Props) {
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

      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
        <button onClick={onBack} className="btn btn-secondary flex-1">
          Buscar novamente
        </button>
        <button onClick={onConfirm} className="btn btn-primary flex-1">
          Confirmar identidade
        </button>
      </div>
    </div>
  );
}
