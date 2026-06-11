import type { ImportPreviewRow } from './types';

/**
 * Robust parser for Excel date serials / strings / Dates.
 * Used for the "DATA DE NASCIMENTO" column.
 */
export function parseExcelDateValue(value: any): string | null {
  if (value == null || value === '') return null;

  // Already a real Date (thanks to cellDates: true in XLSX.read)
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  // Number → treat as Excel serial date
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0 || value > 100000) return null;

    try {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = excelEpoch.getTime() + value * 86400 * 1000;
      const date = new Date(ms);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }

  // String value (sometimes dates are stored as text, or already formatted)
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const direct = new Date(trimmed);
    if (!isNaN(direct.getTime())) {
      return direct.toISOString().slice(0, 10);
    }

    // Brazilian DD/MM/YYYY or DD-MM-YYYY
    const brMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (brMatch) {
      const day = parseInt(brMatch[1], 10);
      const month = parseInt(brMatch[2], 10) - 1;
      let year = parseInt(brMatch[3], 10);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    }
  }

  return null;
}

/**
 * Parses one row from the raw sheet (header:1 array style).
 * Returns null if the row has no valid NR.
 */
export function parseVolunteerRow(r: any[]): ImportPreviewRow | null {
  if (!r || !r[2]) return null; // NR is at index 2

  return {
    seq: r[0] ? Number(r[0]) : null,
    grad: r[1] || null,
    nr: String(r[2]).trim(),
    nome: r[3] || '',
    nome_guerra: r[4] || null,
    data_nascimento: parseExcelDateValue(r[5]),
    telefone: r[6] ? String(r[6]).trim() : null,
  };
}

/**
 * Chooses the preferred worksheet, prioritizing the "Mon e Atdr" tab (Monitores e Atiradores)
 * as requested. Falls back to VOLUNTÁRIOS then the first sheet.
 */
export function chooseVolunteerSheet(wb: any): { ws: any; name: string } {
  let ws = wb.Sheets['Mon e Atdr'] || wb.Sheets['Mon e Atr'];
  let name = 'Mon e Atdr';

  if (!ws) {
    const monAtdrName = (wb.SheetNames as string[]).find((n: string) => {
      const lower = n.toLowerCase();
      return lower.includes('mon') && (lower.includes('atdr') || lower.includes('atr'));
    });
    if (monAtdrName) {
      ws = wb.Sheets[monAtdrName];
      name = monAtdrName;
    } else {
      ws = wb.Sheets['VOLUNTÁRIOS'];
      name = 'VOLUNTÁRIOS';
      if (!ws) {
        name = wb.SheetNames[0];
        ws = wb.Sheets[name];
      }
    }
  }

  return { ws, name };
}
