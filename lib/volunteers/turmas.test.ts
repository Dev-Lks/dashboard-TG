import { describe, expect, it } from 'vitest';
import { getTurmaFromSeq, groupVolunteersByTurma } from './turmas';
import type { Volunteer } from '@/lib/types';

function makeVolunteer(seq: number | null): Volunteer {
  return {
    id: `id-${seq}`,
    seq,
    grad: 'Soldado',
    nr: String(seq),
    full_name: 'Test',
    war_name: 'TEST',
    birth_date: null,
    phone: null,
    created_at: '',
    updated_at: '',
  };
}

describe('getTurmaFromSeq', () => {
  it('maps seq ranges to turmas', () => {
    expect(getTurmaFromSeq(1)).toBe('t1');
    expect(getTurmaFromSeq(40)).toBe('t1');
    expect(getTurmaFromSeq(41)).toBe('t2');
    expect(getTurmaFromSeq(80)).toBe('t2');
    expect(getTurmaFromSeq(81)).toBe('t3');
    expect(getTurmaFromSeq(120)).toBe('t3');
    expect(getTurmaFromSeq(null)).toBeNull();
    expect(getTurmaFromSeq(200)).toBeNull();
  });
});

describe('groupVolunteersByTurma', () => {
  it('groups volunteers by turma', () => {
    const grouped = groupVolunteersByTurma([
      makeVolunteer(5),
      makeVolunteer(50),
      makeVolunteer(100),
      makeVolunteer(null),
    ]);
    expect(grouped.byTurma.t1).toHaveLength(1);
    expect(grouped.byTurma.t2).toHaveLength(1);
    expect(grouped.byTurma.t3).toHaveLength(1);
    expect(grouped.semTurma).toHaveLength(1);
  });
});
