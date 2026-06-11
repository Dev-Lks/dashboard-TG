/**
 * Seed script for volunteers from CSV.
 * 
 * Usage (recommended):
 *   pnpm seed:volunteers
 *
 * It will automatically load variables from .env.local (or .env) if present.
 * Make sure .env.local has:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * The script uses direct @supabase/supabase-js (not the Next SSR wrapper)
 * so it works outside of Next.js context.
 *
 * IMPORTANT: Only "MONITOR" and "ATIRADOR" grades are kept (Cabo, Soldado etc. are filtered out
 * as per requirement). Existing non-matching volunteers are purged on each run.
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Simple .env.local loader (no extra deps). Loads only if vars are not already set.
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

// Try to load .env.local from project root
loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

const csvPath = path.join(process.cwd(), 'data', 'volunteers.csv');

function convertBirthDate(value: any): string | null {
  if (!value) return null;

  // Excel serial number (common when xlsx parses CSV date columns)
  // Use round because of floating point / 1900 leap year artifacts from the library
  if (typeof value === 'number' && value > 0) {
    try {
      const serial = Math.round(value);
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + serial * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch {}
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Already ISO-like
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // MM/DD/YYYY or M/D/YYYY
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const [m, d, y] = parts.map((p) => parseInt(p, 10));
      if (m && d && y) {
        const year = y < 100 ? 2000 + y : y;
        return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // Try native parse as last resort
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  return null;
}

async function main() {
  console.log('🌱 Seeding volunteers from', csvPath);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    console.error('   Make sure you have them in .env.local or exported.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read CSV (xlsx handles .csv files)
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV not found at', csvPath);
    process.exit(1);
  }

  const wb = XLSX.readFile(csvPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  console.log(`📄 Found ${rows.length} rows in CSV.`);

  // Purge volunteers that are not Monitores or Atiradores (as per user request)
  console.log('🧹 Removing existing volunteers that are not Monitores or Atiradores...');
  const { error: purgeError } = await supabase
    .from('volunteers')
    .delete()
    .not('grad', 'ilike', '%monitor%')
    .not('grad', 'ilike', '%atirador%');
  if (purgeError) {
    console.error('Warning during purge:', purgeError.message);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const nr = row.NR != null ? String(row.NR).trim() : '';
    const fullName = (row.NOME || '').trim();
    const grad = (row.GRAD || '').trim().toUpperCase();

    if (!nr || !fullName) {
      skipped++;
      continue;
    }

    // Only keep Monitores and Atiradores (remove Cabo, Soldado, etc.)
    if (grad !== 'MONITOR' && grad !== 'ATIRADOR') {
      skipped++;
      continue;
    }

    const payload = {
      seq: row.SEQ != null ? Number(row.SEQ) : null,
      grad: row.GRAD || null,
      nr,
      full_name: fullName,
      war_name: row['NOME GUERRA'] || null,
      birth_date: convertBirthDate(row['DATA DE NASCIMENTO']),
      phone: row.TELEFONE != null ? String(row.TELEFONE).trim() : null,
    };

    try {
      const { data: existing } = await supabase
        .from('volunteers')
        .select('id')
        .eq('nr', nr)
        .maybeSingle();

      if (existing?.id) {
        await supabase.from('volunteers').update(payload).eq('id', existing.id);
        updated++;
      } else {
        await supabase.from('volunteers').insert(payload);
        inserted++;
      }
    } catch (err: any) {
      errors++;
      console.error(`  ❌ Error on NR ${nr}: ${err.message}`);
    }
  }

  console.log('\n✅ Seed completed!');
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped (non-Monitor/Atirador or incomplete): ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Total Monitores + Atiradores loaded: ${inserted + updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
