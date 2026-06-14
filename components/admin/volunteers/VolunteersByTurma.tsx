'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Volunteer } from '@/lib/types';
import { TURMAS, type TurmaId, groupVolunteersByTurma } from '@/lib/volunteers/turmas';
import { EmptyState } from '@/components/shared/EmptyState';

type VolunteersByTurmaProps = {
  volunteers: Volunteer[];
};

function TurmaTable({ volunteers }: { volunteers: Volunteer[] }) {
  if (volunteers.length === 0) {
    return <p className="px-1 py-2 text-sm text-[var(--text-muted)]">Nenhum cadastrado nesta turma.</p>;
  }

  return (
    <table className="table w-full text-sm">
      <thead>
        <tr>
          <th>NR</th>
          <th>Guerra</th>
          <th>Função</th>
          <th>Telefone</th>
        </tr>
      </thead>
      <tbody>
        {volunteers.map((v) => (
          <tr key={v.id}>
            <td className="font-mono font-semibold">{v.nr}</td>
            <td className="font-medium">{v.war_name || '—'}</td>
            <td>{v.grad || '—'}</td>
            <td className="font-mono text-xs">{v.phone || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TurmaCards({ volunteers }: { volunteers: Volunteer[] }) {
  if (volunteers.length === 0) {
    return <p className="px-1 py-2 text-sm text-[var(--text-muted)]">Nenhum cadastrado nesta turma.</p>;
  }

  return (
    <div className="grid gap-2">
      {volunteers.map((v) => (
        <div key={v.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-extrabold text-[var(--olive-900)]">{v.war_name || v.full_name}</div>
              <div className="font-mono text-xs font-bold text-[var(--text-muted)]">NR {v.nr}</div>
            </div>
            <span className="badge badge-command shrink-0">{v.grad || 'Voluntário'}</span>
          </div>
          {v.phone && (
            <div className="mt-2 font-mono text-xs text-[var(--text-muted)]">{v.phone}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function TurmaSection({
  turmaId,
  label,
  name,
  volunteers,
  defaultOpen,
  accordion,
}: {
  turmaId: TurmaId;
  label: string;
  name: string;
  volunteers: Volunteer[];
  defaultOpen: boolean;
  accordion: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const header = (
    <div className="flex items-center justify-between gap-2">
      <div>
        <span className="font-extrabold text-[var(--olive-900)]">{label} — {name}</span>
        <span className="ml-2 text-sm font-semibold text-[var(--text-muted)]">({volunteers.length})</span>
      </div>
      {accordion && (
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      )}
    </div>
  );

  if (accordion) {
    return (
      <div className="card overflow-hidden" id={`turma-${turmaId}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface-muted)]"
          aria-expanded={open}
        >
          {header}
        </button>
        {open && (
          <div className="border-t border-[var(--border)] p-3 md:hidden">
            <TurmaCards volunteers={volunteers} />
          </div>
        )}
        {open && (
          <div className="hidden border-t border-[var(--border)] p-3 md:block">
            <TurmaTable volunteers={volunteers} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">{header}</div>
      <div className="hidden p-3 md:block">
        <TurmaTable volunteers={volunteers} />
      </div>
      <div className="p-3 md:hidden">
        <TurmaCards volunteers={volunteers} />
      </div>
    </div>
  );
}

export function VolunteersByTurma({ volunteers }: VolunteersByTurmaProps) {
  const { byTurma, semTurma } = groupVolunteersByTurma(volunteers);

  if (volunteers.length === 0) {
    return <EmptyState title="Nenhum voluntário encontrado" />;
  }

  return (
    <>
      {/* Mobile: accordion */}
      <div className="space-y-3 md:hidden">
        {TURMAS.map((t, i) => (
          <TurmaSection
            key={t.id}
            turmaId={t.id}
            label={t.label}
            name={t.name}
            volunteers={byTurma[t.id]}
            defaultOpen={i === 0}
            accordion
          />
        ))}
        {semTurma.length > 0 && (
          <TurmaSection
            turmaId="t1"
            label="—"
            name="Sem turma"
            volunteers={semTurma}
            defaultOpen={false}
            accordion
          />
        )}
      </div>

      {/* Desktop: 3 columns */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {TURMAS.map((t) => (
          <TurmaSection
            key={t.id}
            turmaId={t.id}
            label={t.label}
            name={t.name}
            volunteers={byTurma[t.id]}
            defaultOpen
            accordion={false}
          />
        ))}
      </div>

      {semTurma.length > 0 && (
        <div className="mt-4 hidden md:block">
          <TurmaSection
            turmaId="t1"
            label="—"
            name="Sem turma"
            volunteers={semTurma}
            defaultOpen
            accordion={false}
          />
        </div>
      )}
    </>
  );
}
