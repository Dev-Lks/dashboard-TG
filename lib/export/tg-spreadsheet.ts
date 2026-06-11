import ExcelJS from 'exceljs';
import { format, parseISO } from 'date-fns';
import { getDonationDayInfo } from '@/lib/dates/profiles';
import { normalizeRole } from '@/lib/volunteers/roles';

export const TG_COLUMNS = ['SEQ', 'GRAD', 'NR', 'NOME', 'NOME GUERRA', 'NASCIMENTO', 'TELEFONE'] as const;

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
  volunteers: ExportVolunteer | null;
  donation_dates: { date: string } | null;
};

const MONTHS_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

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

export function formatDateBanner(dateStr: string): string {
  const d = parseISO(dateStr);
  const day = format(d, 'd');
  const month = MONTHS_PT[d.getMonth()];
  const info = getDonationDayInfo(dateStr);
  const time =
    info.profileKey === 'monday' ? '7h às 10h' : info.profileKey === 'thursday' ? '13h às 17h' : '';
  return `${day} ${month} (${info.shortLabel}) - ${time}`;
}

function applyMonAtdrColumnWidths(ws: ExcelJS.Worksheet) {
  const widths = [4.43, 13.57, 9.43, 47, 18.43, 16.43, 17.57];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function applyVolunteersColumnWidths(ws: ExcelJS.Worksheet) {
  const widths = [4.43, 11.43, 4.86, 39.71, 13.14, 11.14, 13.71];
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

function addColumnHeaderRow(ws: ExcelJS.Worksheet, rowNum: number, birthLabel: 'NASCIMENTO' | 'DATA DE NASCIMENTO' = 'NASCIMENTO') {
  const headers = ['SEQ', 'GRAD', 'NR', 'NOME', 'NOME GUERRA', birthLabel, 'TELEFONE'];
  const row = ws.getRow(rowNum);
  row.values = headers;
  styleHeaderRow(row);
  return rowNum + 1;
}

function addDateSection(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  dateStr: string,
  appointments: ExportAppointment[],
  startSeq: number,
): number {
  ws.mergeCells(`A${rowNum}:G${rowNum}`);
  const bannerRow = ws.getRow(rowNum);
  bannerRow.getCell(1).value = formatDateBanner(dateStr);
  styleDateBannerRow(bannerRow);
  rowNum += 1;

  rowNum = addColumnHeaderRow(ws, rowNum, 'NASCIMENTO');

  let seq = startSeq;
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const appt of sorted) {
    const v = appt.volunteers;
    if (!v) continue;
    const role = normalizeRole(v.grad);
    if (!role) continue;

    const row = ws.getRow(rowNum);
    row.values = volunteerToRow(v, seq);
    rowNum += 1;
    seq += 1;
  }

  return rowNum;
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

export function addMonAtdrFlatSheet(
  wb: ExcelJS.Workbook,
  appointments: ExportAppointment[],
) {
  const ws = wb.addWorksheet('Mon e Atdr');
  let rowNum = addColumnHeaderRow(ws, 1, 'DATA DE NASCIMENTO');

  const confirmed = appointments
    .filter((a) => {
      const role = normalizeRole(a.volunteers?.grad);
      return role === 'monitor' || role === 'atirador';
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  confirmed.forEach((appt, i) => {
    const v = appt.volunteers!;
    const row = ws.getRow(rowNum);
    row.values = volunteerToRow(v, i + 1);
    rowNum += 1;
  });

  applyMonAtdrColumnWidths(ws);
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

export function addVolunteersSheetWithDateSections(
  wb: ExcelJS.Workbook,
  volunteers: ExportVolunteer[],
  appointmentsByDate: Map<string, ExportAppointment[]>,
  dateOrder: string[],
) {
  const ws = wb.addWorksheet('VOLUNTÁRIOS');

  const headerRow = ws.getRow(1);
  headerRow.values = ['SEQ', 'GRAD', 'NR', 'NOME', 'NOME GUERRA', 'DATA DE NASCIMENTO', 'TELEFONE'];
  styleHeaderRow(headerRow);

  let rowNum = 2;
  for (const values of buildVolunteersMasterRows(volunteers)) {
    ws.getRow(rowNum).values = values;
    rowNum += 1;
  }

  let globalSeq = 1;
  for (const dateStr of dateOrder) {
    const appts = appointmentsByDate.get(dateStr) || [];
    const confirmed = appts.filter((a) => {
      const role = normalizeRole(a.volunteers?.grad);
      return role === 'monitor' || role === 'atirador';
    });
    if (confirmed.length === 0) continue;

    rowNum = addDateSection(ws, rowNum, dateStr, confirmed, globalSeq);
    globalSeq += confirmed.length;
  }

  applyVolunteersColumnWidths(ws);
}

export function buildDateOnlyWorkbook(dateStr: string, appointments: ExportAppointment[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Mon e Atdr');

  let rowNum = 1;
  rowNum = addDateSection(ws, rowNum, dateStr, appointments, 1);

  applyMonAtdrColumnWidths(ws);
  return wb;
}

export function buildFullTgWorkbook(
  volunteers: ExportVolunteer[],
  appointments: ExportAppointment[],
  dates: { date: string; is_active: boolean }[],
) {
  const wb = new ExcelJS.Workbook();

  const confirmed = appointments.filter((a) => {
    const role = normalizeRole(a.volunteers?.grad);
    return role === 'monitor' || role === 'atirador';
  });

  const byDate = new Map<string, ExportAppointment[]>();
  for (const appt of confirmed) {
    const d = appt.donation_dates?.date;
    if (!d) continue;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(appt);
  }

  const dateOrder = dates
    .filter((d) => d.is_active && byDate.has(d.date))
    .map((d) => d.date)
    .sort();

  addVolunteersSheetWithDateSections(wb, volunteers, byDate, dateOrder);
  addMonAtdrFlatSheet(wb, confirmed);

  return wb;
}
