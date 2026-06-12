import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { lookupAppointmentSchema } from '@/lib/schemas';
import { verifyVerificationToken } from '@/lib/volunteer-verification';
import { formatDayName } from '@/lib/dates/schedule-display';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = lookupAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { volunteerId, verificationToken, missionSlug } = parsed.data;

  if (!verifyVerificationToken(verificationToken, volunteerId)) {
    return NextResponse.json(
      { error: 'Identidade não verificada. Volte e confirme sua data de nascimento.' },
      { status: 403 },
    );
  }

  const supabase = await createServerSupabase();

  let query = supabase
    .from('appointments')
    .select(`
      id,
      status,
      created_at,
      mission_id,
      volunteers (nr, grad, full_name, war_name),
      donation_dates (date, mission_id, missions (name, slug)),
      donation_time_slots (time)
    `)
    .eq('volunteer_id', volunteerId)
    .eq('status', 'confirmed');

  if (missionSlug) {
    const { data: mission } = await supabase
      .from('missions')
      .select('id')
      .eq('slug', missionSlug)
      .maybeSingle();

    if (mission) {
      query = query.eq('mission_id', mission.id);
    }
  }

  const { data: rows, error } = await query.order('created_at', { ascending: false }).limit(5);
  const data = rows?.[0] ?? null;

  if (error) {
    console.error('Lookup appointment error', error);
    return NextResponse.json({ error: 'Erro ao buscar agendamento' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ appointment: null });
  }

  type VolunteerRecord = {
    nr: string;
    grad: string | null;
    full_name: string;
    war_name: string | null;
  };

  const volunteerRaw = data.volunteers as VolunteerRecord | VolunteerRecord[] | null;
  const volunteer = Array.isArray(volunteerRaw) ? volunteerRaw[0] : volunteerRaw;

  const donationDateRaw = data.donation_dates as {
    date: string;
    missions?: { name: string; slug: string } | { name: string; slug: string }[] | null;
  } | { date: string; missions?: { name: string; slug: string } | { name: string; slug: string }[] | null }[] | null;
  const donationDate = Array.isArray(donationDateRaw) ? donationDateRaw[0] : donationDateRaw;

  const timeSlotRaw = data.donation_time_slots as { time: string } | { time: string }[] | null;
  const timeSlot = Array.isArray(timeSlotRaw) ? timeSlotRaw[0] : timeSlotRaw;

  if (!volunteer || !donationDate) {
    return NextResponse.json({ appointment: null });
  }

  const missionRaw = donationDate.missions;
  const mission = Array.isArray(missionRaw) ? missionRaw[0] : missionRaw;

  return NextResponse.json({
    appointment: {
      nr: volunteer.nr,
      warName: volunteer.war_name,
      fullName: volunteer.full_name,
      grad: volunteer.grad,
      date: donationDate.date,
      dayName: formatDayName(donationDate.date),
      time: timeSlot?.time ?? null,
      missionName: mission?.name ?? null,
    },
  });
}
