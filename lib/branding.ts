import { getTurmaInfo, type TurmaId } from '@/lib/volunteers/turmas';

export const UNIT_ID = 'TG 11-002';
export const UNIT_CITY = 'Ituiutaba/MG';
export const UNIT_LABEL = `${UNIT_ID} — ${UNIT_CITY}`;
export const MISSION_EYEBROW = 'Missão: Doação de Sangue';
export const SITE_TITLE = `${UNIT_ID} | Missão Doação de Sangue`;
export const SITE_DESCRIPTION = `Agendamento de doação de sangue — ${UNIT_ID} ${UNIT_CITY}.`;

const EXPORT_PREFIX = UNIT_ID;

export function exportFilenameFull(dateIso = new Date().toISOString().slice(0, 10)): string {
  return `${EXPORT_PREFIX} DOAÇÃO DE SANGUE-${dateIso}.xlsx`;
}

export function exportFilenameByDate(date: string): string {
  return `${EXPORT_PREFIX}-doacao-${date}.xlsx`;
}

export function exportFilenameByTurma(turmaId: TurmaId): string {
  const turma = getTurmaInfo(turmaId);
  return `${EXPORT_PREFIX}-${turma.label}-${turma.name}-efetivo.xlsx`;
}

export function exportFilenameByTurmaAndDate(turmaId: TurmaId, date: string): string {
  const turma = getTurmaInfo(turmaId);
  return `${EXPORT_PREFIX}-${turma.label}-${turma.name}-${date}.xlsx`;
}
