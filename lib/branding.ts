import { getTurmaInfo, type TurmaId } from '@/lib/volunteers/turmas';

export const UNIT_ID = 'TG 11-002';
export const UNIT_CITY = 'Ituiutaba/MG';
export const UNIT_LABEL = `${UNIT_ID} — ${UNIT_CITY}`;
export const MISSION_EYEBROW = 'Missões de Voluntariado';
export const SITE_TITLE = `${UNIT_ID} | Missões de Voluntariado`;
export const SITE_DESCRIPTION = `Agendamento de missões de voluntariado — ${UNIT_ID} ${UNIT_CITY}.`;

const EXPORT_PREFIX = UNIT_ID;

function sanitizeFilenamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
}

export function exportFilenameFull(missionName?: string, dateIso = new Date().toISOString().slice(0, 10)): string {
  const mission = missionName ? sanitizeFilenamePart(missionName) : 'MISSOES';
  return `${EXPORT_PREFIX} ${mission}-${dateIso}.xlsx`;
}

export function exportFilenameByDate(missionName: string | undefined, date: string): string {
  const mission = missionName ? sanitizeFilenamePart(missionName) : 'MISSAO';
  return `${EXPORT_PREFIX}-${mission}-${date}.xlsx`;
}

export function exportFilenameByTurma(turmaId: TurmaId): string {
  const turma = getTurmaInfo(turmaId);
  return `${EXPORT_PREFIX}-${turma.label}-${turma.name}-efetivo.xlsx`;
}

export function exportFilenameByTurmaAndDate(turmaId: TurmaId, date: string, missionName?: string): string {
  const turma = getTurmaInfo(turmaId);
  const mission = missionName ? sanitizeFilenamePart(missionName) : 'MISSAO';
  return `${EXPORT_PREFIX}-${mission}-${turma.label}-${turma.name}-${date}.xlsx`;
}

export function exportFilenameByMission(missionName: string, dateIso = new Date().toISOString().slice(0, 10)): string {
  return exportFilenameFull(missionName, dateIso);
}
