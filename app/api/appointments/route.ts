import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAppointmentSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { volunteerId, donationDateId, timeSlotId } = parsed.data;

  const supabase = await createServerSupabase();

  // Call the SECURITY DEFINER function - this is the single source of truth for the 15 limit
  const { data, error } = await supabase.rpc('create_appointment', {
    p_volunteer_id: volunteerId,
    p_donation_date_id: donationDateId,
    p_time_slot_id: timeSlotId || null,
  });

  if (error) {
    // The function raises friendly exceptions
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // data is an array with one row from the RETURNS TABLE
  const appointment = Array.isArray(data) && data.length > 0 ? data[0] : data;

  return NextResponse.json({ 
    success: true, 
    appointment 
  });
}
