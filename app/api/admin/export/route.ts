import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  buildDateOnlyWorkbook,
  buildFullTgWorkbook,
  buildTurmaDateWorkbook,
  buildTurmaWorkbook,
  type ExportAppointment,
  type ExportVolunteer,
} from '@/lib/export/tg-spreadsheet';
import {
  exportFilenameByDate,
  exportFilenameByTurma,
  exportFilenameByTurmaAndDate,
  exportFilenameFull,
} from '@/lib/branding';
import { normalizeRole } from '@/lib/volunteers/roles';
import { type TurmaId } from '@/lib/volunteers/turmas';

type VolunteerRecord = ExportVolunteer & { id?: string };

function mapVolunteer(v: VolunteerRecord | null): ExportVolunteer | null {
  if (!v) return null;
  return {
    seq: v.seq ?? null,
    grad: v.grad,
    nr: v.nr,
    full_name: v.full_name,
    war_name: v.war_name,
    birth_date: v.birth_date,
    phone: v.phone,
  };
}

function isTurmaId(value: string | null): value is TurmaId {
  return value === 't1' || value === 't2' || value === 't3';
}

export async function GET(request: NextRequest) {
  const isAuthed = await isAdminAuthenticated();
  if (!isAuthed) {
    return NextResponse.json(
      { error: 'Não autorizado. Faça login na área administrativa novamente.' },
      { status: 401 },
    );
  }

  const dateFilter = request.nextUrl.searchParams.get('date') || undefined;
  const turmaFilter = request.nextUrl.searchParams.get('turma');
  const supabase = createServiceRoleClient();

  const { data: volunteersRaw } = await supabase
    .from('volunteers')
    .select('seq, grad, nr, full_name, war_name, birth_date, phone')
    .order('seq', { ascending: true });

  const volunteers = (volunteersRaw || [])
    .map((v) => mapVolunteer(v as VolunteerRecord))
    .filter((v): v is ExportVolunteer => v !== null && normalizeRole(v.grad) !== null);

  let appointmentsQuery = supabase
    .from('appointments')
    .select(`
      created_at,
      status,
      volunteers (seq, grad, nr, full_name, war_name, birth_date, phone),
      donation_dates (date),
      donation_time_slots (time)
    `)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true });

  if (dateFilter) {
    const { data: dateRow } = await supabase
      .from('donation_dates')
      .select('id')
      .eq('date', dateFilter)
      .maybeSingle();

    if (!dateRow) {
      return NextResponse.json({ error: 'Data não encontrada' }, { status: 404 });
    }

    appointmentsQuery = appointmentsQuery.eq('donation_date_id', dateRow.id);
  }

  const { data: appointmentsRaw } = await appointmentsQuery;

  const appointments: ExportAppointment[] = (appointmentsRaw || []).map((a) => {
    const vol = a.volunteers as VolunteerRecord | VolunteerRecord[] | null;
    const v = Array.isArray(vol) ? vol[0] : vol;
    const dates = a.donation_dates as { date: string } | { date: string }[] | null;
    const d = Array.isArray(dates) ? dates[0] : dates;
    const slots = a.donation_time_slots as { time: string } | { time: string }[] | null;
    const slot = Array.isArray(slots) ? slots[0] : slots;
    return {
      created_at: a.created_at,
      time: slot?.time ?? null,
      volunteers: mapVolunteer(v),
      donation_dates: d ?? null,
    };
  });

  let wb;
  let filename: string;

  if (turmaFilter) {
    if (!isTurmaId(turmaFilter)) {
      return NextResponse.json({ error: 'Turma inválida' }, { status: 400 });
    }
    if (dateFilter) {
      wb = buildTurmaDateWorkbook(turmaFilter, dateFilter, appointments);
      filename = exportFilenameByTurmaAndDate(turmaFilter, dateFilter);
    } else {
      wb = buildTurmaWorkbook(turmaFilter, volunteers);
      filename = exportFilenameByTurma(turmaFilter);
    }
  } else if (dateFilter) {
    wb = buildDateOnlyWorkbook(dateFilter, appointments);
    filename = exportFilenameByDate(dateFilter);
  } else {
    const { data: dates } = await supabase
      .from('donation_dates')
      .select('date, is_active')
      .order('date', { ascending: true });

    wb = buildFullTgWorkbook(appointments, dates || []);
    filename = exportFilenameFull();
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
