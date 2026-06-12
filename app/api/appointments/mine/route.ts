import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { lookupAppointmentSchema } from '@/lib/schemas';
import { verifyVerificationToken } from '@/lib/volunteer-verification';
import { getDonationDayInfo } from '@/lib/dates/profiles';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = lookupAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { volunteerId, verificationToken } = parsed.data;

  if (!verifyVerificationToken(verificationToken, volunteerId)) {
    return NextResponse.json(
      { error: 'Identidade não verificada. Volte e confirme sua data de nascimento.' },
      { status: 403 },
    );
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      created_at,
      volunteers (nr, grad, full_name, war_name),
      donation_dates (date),
      donation_time_slots (time)
    `)
    .eq('volunteer_id', volunteerId)
    .eq('status', 'confirmed')
    .maybeSingle();

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

  const donationDateRaw = data.donation_dates as { date: string } | { date: string }[] | null;
  const donationDate = Array.isArray(donationDateRaw) ? donationDateRaw[0] : donationDateRaw;

  const timeSlotRaw = data.donation_time_slots as { time: string } | { time: string }[] | null;
  const timeSlot = Array.isArray(timeSlotRaw) ? timeSlotRaw[0] : timeSlotRaw;

  if (!volunteer || !donationDate) {
    return NextResponse.json({ appointment: null });
  }

  const dayInfo = getDonationDayInfo(donationDate.date);

  return NextResponse.json({
    appointment: {
      nr: volunteer.nr,
      warName: volunteer.war_name,
      fullName: volunteer.full_name,
      grad: volunteer.grad,
      date: donationDate.date,
      dayName: dayInfo.dayLabel,
      time: timeSlot?.time ?? null,
    },
  });
}
