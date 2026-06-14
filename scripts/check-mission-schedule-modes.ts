/**
 * Verification script: checks mission default_schedule_mode consistency with dates.
 *
 * Usage:
 *   pnpm tsx scripts/check-mission-schedule-modes.ts
 *
 * Loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local / .env.
 * Reports missions where dates' schedule_mode conflicts with the mission default.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing env vars. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type DateRow = {
  id: string;
  mission_id: string;
  date: string;
  schedule_mode: 'slots' | 'presence_only';
};

async function main() {
  // Fetch all missions
  const { data: missions, error: missionsError } = await supabase
    .from('missions')
    .select('id, name, default_schedule_mode')
    .order('name');

  if (missionsError) {
    console.error('Error fetching missions:', missionsError.message);
    process.exit(1);
  }

  if (!missions?.length) {
    console.log('No missions found.');
    return;
  }

  // Fetch all dates for all missions
  const { data: dates, error: datesError } = await supabase
    .from('donation_dates')
    .select('id, mission_id, date, schedule_mode')
    .order('date');

  if (datesError) {
    console.error('Error fetching dates:', datesError.message);
    process.exit(1);
  }

  // Group dates by mission
  const datesByMission = new Map<string, DateRow[]>();
  for (const d of (dates ?? [])) {
    const list = datesByMission.get(d.mission_id) ?? [];
    list.push(d);
    datesByMission.set(d.mission_id, list);
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\nMission Schedule Mode Consistency Report');
  console.log('========================================\n');

  console.log(
    'MISSION'.padEnd(30),
    'DEFAULT'.padEnd(12),
    'DATES'.padEnd(6),
    'SLOTS_DATES'.padEnd(12),
    'PO_DATES'.padEnd(10),
    'STATUS',
  );
  console.log('-'.repeat(80));

  for (const m of missions) {
    const missionDates = datesByMission.get(m.id) ?? [];
    const slotsDates = missionDates.filter((d) => d.schedule_mode === 'slots');
    const poDates = missionDates.filter((d) => d.schedule_mode === 'presence_only');
    const defaultMode = m.default_schedule_mode;

    let status = '\x1b[32mOK\x1b[0m'; // green

    if (defaultMode === 'presence_only' && slotsDates.length > 0) {
      status = '\x1b[31mERROR\x1b[0m'; // red
      errors.push(
        `Mission "${m.name}" (${m.id}): default=presence_only but ${slotsDates.length} date(s) have schedule_mode=slots: ${slotsDates.map((d) => d.date).join(', ')}`,
      );
    } else if (defaultMode === 'slots' && poDates.length > 0) {
      status = '\x1b[33mWARN\x1b[0m'; // yellow
      warnings.push(
        `Mission "${m.name}" (${m.id}): default=slots but ${poDates.length} date(s) have schedule_mode=presence_only: ${poDates.map((d) => d.date).join(', ')}`,
      );
    }

    console.log(
      m.name.slice(0, 28).padEnd(30),
      defaultMode.padEnd(12),
      String(missionDates.length).padEnd(6),
      String(slotsDates.length).padEnd(12),
      String(poDates.length).padEnd(10),
      status,
    );
  }

  console.log();

  if (errors.length > 0) {
    console.log(`\x1b[31m${errors.length} ERROR(S)\x1b[0m:`);
    for (const e of errors) console.log(`  • ${e}`);
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`\x1b[33m${warnings.length} WARNING(S)\x1b[0m (dates can override the default; review if intentional):`);
    for (const w of warnings) console.log(`  • ${w}`);
    console.log();
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\x1b[32mAll missions consistent.\x1b[0m');
  }

  if (errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
