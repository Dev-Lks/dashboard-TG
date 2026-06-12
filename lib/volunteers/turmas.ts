import type { Volunteer } from '@/lib/types';

export const TURMAS = [
  { id: 't1' as const, label: 'T1', name: 'Pantera', min: 1, max: 40 },
  { id: 't2' as const, label: 'T2', name: 'Tucandeira', min: 41, max: 80 },
  { id: 't3' as const, label: 'T3', name: 'Leão', min: 81, max: 120 },
] as const;

export type TurmaId = (typeof TURMAS)[number]['id'];

export type TurmaInfo = (typeof TURMAS)[number];

export function getTurmaFromSeq(seq: number | null): TurmaId | null {
  if (seq == null) return null;
  const turma = TURMAS.find((t) => seq >= t.min && seq <= t.max);
  return turma?.id ?? null;
}

export function getTurmaInfo(id: TurmaId): TurmaInfo {
  return TURMAS.find((t) => t.id === id)!;
}

export type GroupedVolunteers = {
  byTurma: Record<TurmaId, Volunteer[]>;
  semTurma: Volunteer[];
};

export function groupVolunteersByTurma(volunteers: Volunteer[]): GroupedVolunteers {
  const byTurma: Record<TurmaId, Volunteer[]> = { t1: [], t2: [], t3: [] };
  const semTurma: Volunteer[] = [];

  for (const v of volunteers) {
    const turmaId = getTurmaFromSeq(v.seq);
    if (turmaId) {
      byTurma[turmaId].push(v);
    } else {
      semTurma.push(v);
    }
  }

  for (const id of Object.keys(byTurma) as TurmaId[]) {
    byTurma[id].sort((a, b) => (a.seq ?? 9999) - (b.seq ?? 9999));
  }
  semTurma.sort((a, b) => (a.seq ?? 9999) - (b.seq ?? 9999));

  return { byTurma, semTurma };
}
