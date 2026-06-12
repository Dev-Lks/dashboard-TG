import ExcelJS from 'exceljs';
import { formatDateBanner } from '@/lib/dates/schedule-display';
import { normalizeRole } from '@/lib/volunteers/roles';
import { getTurmaFromSeq, getTurmaInfo, type TurmaId } from '@/lib/volunteers/turmas';

export const TG_COLUMNS = ['SEQ', 'GRAD', 'NR', 'NOME', 'NOME GUERRA', 'NASCIMENTO', 'TELEFONE'] as const;

const ROSTER_COLUMNS = ['#', 'NR', 'NOME DE GUERRA', 'NOME COMPLETO', 'HORÁRIO', 'TELEFONE', 'MISSÃO'] as const;
const ROSTER_COL_COUNT = ROSTER_COLUMNS.length;

export type ExportVolunteer = {
  seq: number | null;
  grad: string | null;
  nr: string;
  full_name: string;
  war_name: string | null;
  birth_date: string | null;
  phone: string | null;
};

export type ExportAppointment = {
  created_at: string;
  time: string | null;
  mission_name?: string | null;
  volunteers: ExportVolunteer | null;
  donation_dates: { date: string } | null;
};

export function toExcelDateSerial(dateStr: string | null | undefined): number | '' {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((utc - epoch.getTime()) / 86400000);
}

export function formatGradForExport(grad: string | null | undefined): string {
  const role = normalizeRole(grad);
  if (role === 'monitor') return 'MONITOR';
  if (role === 'atirador') return 'ATIRADOR';
  return (grad || '').toUpperCase();
}

export function collectTimesForDate(appointments: ExportAppointment[]): string[] {
  return appointments
    .map((a) => a.time)
    .filter((t): t is string => !!t)
    .sort();
}

export function filterVolunteersByTurma(volunteers: ExportVolunteer[], turmaId: TurmaId): ExportVolunteer[] {
  return volunteers.filter((v) => getTurmaFromSeq(v.seq) === turmaId);
}

export function filterAppointmentsByTurma(appointments: ExportAppointment[], turmaId: TurmaId): ExportAppointment[] {
  return appointments.filter((a) => {
    const seq = a.volunteers?.seq ?? null;
    return getTurmaFromSeq(seq) === turmaId;
  });
}

export function filterConfirmedAppointments(appointments: ExportAppointment[]): ExportAppointment[] {
  return appointments.filter((a) => {
    const role = normalizeRole(a.volunteers?.grad);
    return role === 'monitor' || role === 'atirador';
  });
}

export function sortAppointmentsByWarName(appointments: ExportAppointment[]): ExportAppointment[] {
  return [...appointments].sort((a, b) => {
    const nameA = a.volunteers?.war_name || a.volunteers?.full_name || '';
    const nameB = b.volunteers?.war_name || b.volunteers?.full_name || '';
    return nameA.localeCompare(nameB, 'pt-BR');
  });
}

export function splitByRole(appointments: ExportAppointment[]) {
  const monitors: ExportAppointment[] = [];
  const atiradores: ExportAppointment[] = [];

  for (const appt of appointments) {
    const role = normalizeRole(appt.volunteers?.grad);
    if (role === 'monitor') monitors.push(appt);
    else if (role === 'atirador') atiradores.push(appt);
    else if (appt.volunteers) atiradores.push(appt);
  }

  return {
    monitors: sortAppointmentsByWarName(monitors),
    atiradores: sortAppointmentsByWarName(atiradores),
  };
}

export function groupAppointmentsByDate(appointments: ExportAppointment[]): Map<string, ExportAppointment[]> {
  const byDate = new Map<string, ExportAppointment[]>();
  for (const appt of appointments) {
    const d = appt.donation_dates?.date;
    if (!d) continue;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(appt);
  }
  return byDate;
}

function applyVolunteersColumnWidths(ws: ExcelJS.Worksheet) {
  const widths = [4.43, 11.43, 4.86, 39.71, 13.14, 11.14, 13.71];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function applyRosterColumnWidths(ws: ExcelJS.Worksheet) {
  const widths = [4, 8, 18, 36, 10, 14, 20];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6E6' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
}

function styleDateBannerRow(row: ExcelJS.Row) {
  row.height = 22;
  row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006400' },
    };
  });
}

function styleRoleSectionRow(row: ExcelJS.Row) {
  row.font = { bold: true, size: 11 };
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };
  });
}

function volunteerToRow(v: ExportVolunteer, seq: number | string) {
  return [
    seq,
    formatGradForExport(v.grad),
    v.nr,
    v.full_name,
    v.war_name || '',
    toExcelDateSerial(v.birth_date),
    v.phone || '',
  ];
}

function appointmentToRosterRow(appt: ExportAppointment, index: number) {
  const v = appt.volunteers!;
  return [
    index,
    v.nr,
    v.war_name || '',
    v.full_name,
    appt.time || 'Presença',
    v.phone || '',
    appt.mission_name || '',
  ];
}

function mergeRow(ws: ExcelJS.Worksheet, rowNum: number) {
  const lastCol = String.fromCharCode(64 + ROSTER_COL_COUNT);
  ws.mergeCells(`A${rowNum}:${lastCol}${rowNum}`);
}

function addRosterColumnHeaderRow(ws: ExcelJS.Worksheet, rowNum: number): number {
  const row = ws.getRow(rowNum);
  row.values = [...ROSTER_COLUMNS];
  styleHeaderRow(row);
  return rowNum + 1;
}

function addRoleGroup(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  title: string,
  appointments: ExportAppointment[],
): number {
  if (appointments.length === 0) return rowNum;

  mergeRow(ws, rowNum);
  const sectionRow = ws.getRow(rowNum);
  sectionRow.getCell(1).value = `${title} (${appointments.length})`;
  styleRoleSectionRow(sectionRow);
  rowNum += 1;

  rowNum = addRosterColumnHeaderRow(ws, rowNum);

  appointments.forEach((appt, i) => {
    if (!appt.volunteers) return;
    ws.getRow(rowNum).values = appointmentToRosterRow(appt, i + 1);
    rowNum += 1;
  });

  return rowNum + 1;
}

export function addDateRosterSection(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  dateStr: string,
  appointments: ExportAppointment[],
): number {
  const confirmed = filterConfirmedAppointments(appointments);
  if (confirmed.length === 0) return rowNum;

  const times = collectTimesForDate(confirmed);
  const banner = formatDateBanner(dateStr, times);

  mergeRow(ws, rowNum);
  const bannerRow = ws.getRow(rowNum);
  bannerRow.getCell(1).value = `${banner}  •  ${confirmed.length} confirmado${confirmed.length !== 1 ? 's' : ''}`;
  styleDateBannerRow(bannerRow);
  rowNum += 1;

  const { monitors, atiradores } = splitByRole(confirmed);
  rowNum = addRoleGroup(ws, rowNum, 'MONITORES', monitors);
  rowNum = addRoleGroup(ws, rowNum, 'ATIRADORES', atiradores);

  return rowNum;
}

export function addRosterByDateSheet(
  wb: ExcelJS.Workbook,
  appointments: ExportAppointment[],
  dateOrder: string[],
  sheetName = 'POR DATA',
) {
  const ws = wb.addWorksheet(sheetName);
  const byDate = groupAppointmentsByDate(filterConfirmedAppointments(appointments));

  let rowNum = 1;
  for (const dateStr of dateOrder) {
    const appts = byDate.get(dateStr) || [];
    if (appts.length === 0) continue;
    rowNum = addDateRosterSection(ws, rowNum, dateStr, appts);
  }

  applyRosterColumnWidths(ws);
  return ws;
}

export function buildVolunteersMasterRows(volunteers: ExportVolunteer[]) {
  const filtered = volunteers.filter((v) => normalizeRole(v.grad) !== null);
  const sorted = [...filtered].sort((a, b) => {
    const sa = a.seq ?? 9999;
    const sb = b.seq ?? 9999;
    if (sa !== sb) return sa - sb;
    return a.full_name.localeCompare(b.full_name, 'pt-BR');
  });

  return sorted.map((v, i) => volunteerToRow(v, v.seq ?? i + 1));
}

export function buildDateOnlyWorkbook(dateStr: string, appointments: ExportAppointment[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('POR DATA');
  addDateRosterSection(ws, 1, dateStr, appointments);
  applyRosterColumnWidths(ws);
  return wb;
}

export function buildTurmaWorkbook(turmaId: TurmaId, volunteers: ExportVolunteer[]) {
  const turma = getTurmaInfo(turmaId);
  const filtered = filterVolunteersByTurma(volunteers, turmaId);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${turma.label} ${turma.name}`);

  const headerRow = ws.getRow(1);
  headerRow.values = ['SEQ', 'GRAD', 'NR', 'NOME', 'NOME GUERRA', 'DATA DE NASCIMENTO', 'TELEFONE'];
  styleHeaderRow(headerRow);

  let rowNum = 2;
  for (const values of buildVolunteersMasterRows(filtered)) {
    ws.getRow(rowNum).values = values;
    rowNum += 1;
  }

  applyVolunteersColumnWidths(ws);
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  return wb;
}

export function buildTurmaDateWorkbook(
  turmaId: TurmaId,
  dateStr: string,
  appointments: ExportAppointment[],
) {
  const turma = getTurmaInfo(turmaId);
  const filtered = filterAppointmentsByTurma(appointments, turmaId);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${turma.label} ${dateStr}`);

  addDateRosterSection(ws, 1, dateStr, filtered);
  applyRosterColumnWidths(ws);
  return wb;
}

export function buildFullTgWorkbook(
  appointments: ExportAppointment[],
  dates: { date: string; is_active: boolean }[],
) {
  const wb = new ExcelJS.Workbook();
  const byDate = groupAppointmentsByDate(filterConfirmedAppointments(appointments));

  const dateOrder = dates
    .filter((d) => d.is_active && byDate.has(d.date))
    .map((d) => d.date)
    .sort();

  addRosterByDateSheet(wb, appointments, dateOrder);
  return wb;
}

export function buildMissionWorkbook(
  missionName: string,
  appointments: ExportAppointment[],
  dates: { date: string; is_active: boolean }[],
) {
  const wb = new ExcelJS.Workbook();
  const byDate = groupAppointmentsByDate(filterConfirmedAppointments(appointments));

  const dateOrder = dates
    .filter((d) => d.is_active && byDate.has(d.date))
    .map((d) => d.date)
    .sort();

  addRosterByDateSheet(wb, appointments, dateOrder, missionName.slice(0, 31));
  return wb;
}
