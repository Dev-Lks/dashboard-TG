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
import { normalizeRole } from '@/lib/volunteers/roles';
import { TURMAS, type TurmaId } from '@/lib/volunteers/turmas';

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
      donation_dates (date)
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
    return {
      created_at: a.created_at,
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
    const turma = TURMAS.find((t) => t.id === turmaFilter)!;

    if (dateFilter) {
      wb = buildTurmaDateWorkbook(turmaFilter, dateFilter, appointments);
      filename = `TG11-${turma.label}-${turma.name}-${dateFilter}.xlsx`;
    } else {
      wb = buildTurmaWorkbook(turmaFilter, volunteers);
      filename = `TG11-${turma.label}-${turma.name}-efetivo.xlsx`;
    }
  } else if (dateFilter) {
    wb = buildDateOnlyWorkbook(dateFilter, appointments);
    filename = `TG11-doacao-${dateFilter}.xlsx`;
  } else {
    const { data: dates } = await supabase
      .from('donation_dates')
      .select('date, is_active')
      .order('date', { ascending: true });

    wb = buildFullTgWorkbook(volunteers, appointments, dates || []);
    filename = `TG 11-002 DOAÇÃO DE SANGUE-${new Date().toISOString().slice(0, 10)}.xlsx`;
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
