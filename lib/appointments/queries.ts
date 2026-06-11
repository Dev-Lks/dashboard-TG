import { createServiceRoleClient } from '@/lib/supabase/server';
import { matchesRoleFilter, normalizeRole } from '@/lib/volunteers/roles';

export type AppointmentFilters = {
  date?: string;
  status?: string;
  q?: string;
  role?: string;
  capacity?: string;
};

export type AppointmentRow = {
  id: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  donation_date_id: string;
  volunteers: {
    nr: string;
    grad: string | null;
    full_name: string;
    war_name: string | null;
    phone: string | null;
    birth_date: string | null;
  } | null;
  donation_dates: {
    date: string;
    capacity: number;
  } | null;
  donation_time_slots: {
    time: string;
  } | null;
};

export type DateOccupancy = {
  id: string;
  date: string;
  capacity: number;
  is_active: boolean;
  booked: number;
  remaining: number;
  is_full: boolean;
};

export type AppointmentStats = {
  totalConfirmed: number;
  totalCancelled: number;
  activeDates: number;
  fullDates: number;
  monitorsScheduled: number;
  atiradoresScheduled: number;
  nextDateOccupied: number | null;
  nextDateCapacity: number | null;
  nextDateRemaining: number | null;
  nextDateLabel: string | null;
};

export async function getDateOccupancy(): Promise<DateOccupancy[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from('vw_date_occupancy').select('*').order('date', { ascending: true });
  return (data || []) as DateOccupancy[];
}

export async function getAppointments(filters: AppointmentFilters): Promise<AppointmentRow[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('appointments')
    .select(`
      *,
      volunteers (nr, grad, full_name, war_name, phone, birth_date),
      donation_dates (date, capacity),
      donation_time_slots (time)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.date) {
    const { data: dateRow } = await supabase
      .from('donation_dates')
      .select('id')
      .eq('date', filters.date)
      .maybeSingle();
    if (dateRow) {
      query = query.eq('donation_date_id', dateRow.id);
    } else {
      return [];
    }
  }

  const { data } = await query.limit(200);
  let result = (data || []) as AppointmentRow[];

  if (filters.q) {
    const s = filters.q.toLowerCase();
    result = result.filter((a) =>
      (a.volunteers?.nr || '').toLowerCase().includes(s) ||
      (a.volunteers?.war_name || '').toLowerCase().includes(s) ||
      (a.volunteers?.full_name || '').toLowerCase().includes(s)
    );
  }

  if (filters.role) {
    result = result.filter((a) => matchesRoleFilter(a.volunteers?.grad, filters.role!));
  }

  if (filters.capacity) {
    const occupancy = await getDateOccupancy();
    const fullIds = new Set(occupancy.filter((d) => d.is_full).map((d) => d.id));
    const availableIds = new Set(occupancy.filter((d) => !d.is_full && d.is_active).map((d) => d.id));

    if (filters.capacity === 'full') {
      result = result.filter((a) => fullIds.has(a.donation_date_id));
    } else if (filters.capacity === 'available') {
      result = result.filter((a) => availableIds.has(a.donation_date_id));
    }
  }

  return result;
}

export async function getAppointmentStats(): Promise<AppointmentStats> {
  const supabase = createServiceRoleClient();

  const { count: totalConfirmed } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  const { count: totalCancelled } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'cancelled');

  const occupancy = await getDateOccupancy();
  const today = new Date().toISOString().slice(0, 10);

  const activeDates = occupancy.filter((d) => d.is_active).length;
  const fullDates = occupancy.filter((d) => d.is_full).length;

  const nextActive = occupancy.find((d) => d.is_active && d.date >= today);

  const { data: confirmedAppointments } = await supabase
    .from('appointments')
    .select('volunteers(grad)')
    .eq('status', 'confirmed');

  let monitorsScheduled = 0;
  let atiradoresScheduled = 0;
  for (const a of confirmedAppointments || []) {
    const vol = a.volunteers as { grad: string | null } | { grad: string | null }[] | null;
    const grad = Array.isArray(vol) ? vol[0]?.grad : vol?.grad;
    const role = normalizeRole(grad);
    if (role === 'monitor') monitorsScheduled++;
    if (role === 'atirador') atiradoresScheduled++;
  }

  return {
    totalConfirmed: totalConfirmed || 0,
    totalCancelled: totalCancelled || 0,
    activeDates,
    fullDates,
    monitorsScheduled,
    atiradoresScheduled,
    nextDateOccupied: nextActive?.booked ?? null,
    nextDateCapacity: nextActive?.capacity ?? null,
    nextDateRemaining: nextActive?.remaining ?? null,
    nextDateLabel: nextActive?.date ?? null,
  };
}

export async function getRegisteredDatesForSelect() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('donation_dates')
    .select('id, date')
    .order('date', { ascending: true });
  return data || [];
}

export type RosterVolunteer = {
  id: string;
  nr: string;
  war_name: string | null;
  full_name: string;
  grad: string | null;
  role: 'monitor' | 'atirador' | null;
  time: string | null;
  phone: string | null;
};

export type DateRoster = {
  id: string;
  date: string;
  capacity: number;
  booked: number;
  remaining: number;
  is_full: boolean;
  monitors: RosterVolunteer[];
  atiradores: RosterVolunteer[];
};

export async function getActiveDatesRoster(): Promise<DateRoster[]> {
  const supabase = createServiceRoleClient();

  const { data: occupancy } = await supabase
    .from('vw_date_occupancy')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (!occupancy?.length) return [];

  const dateIds = occupancy.map((d) => d.id);

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      donation_date_id,
      volunteers (nr, grad, full_name, war_name, phone),
      donation_time_slots (time)
    `)
    .eq('status', 'confirmed')
    .in('donation_date_id', dateIds);

  const rosterMap = new Map<string, { monitors: RosterVolunteer[]; atiradores: RosterVolunteer[] }>();
  dateIds.forEach((id) => rosterMap.set(id, { monitors: [], atiradores: [] }));

  for (const a of appointments || []) {
    const vol = a.volunteers as {
      nr: string;
      grad: string | null;
      full_name: string;
      war_name: string | null;
      phone: string | null;
    } | { nr: string; grad: string | null; full_name: string; war_name: string | null; phone: string | null }[] | null;

    const v = Array.isArray(vol) ? vol[0] : vol;
    if (!v) continue;

    const slot = a.donation_time_slots as { time: string } | { time: string }[] | null;
    const time = Array.isArray(slot) ? slot[0]?.time : slot?.time;

    const role = normalizeRole(v.grad);
    const entry: RosterVolunteer = {
      id: a.id,
      nr: v.nr,
      war_name: v.war_name,
      full_name: v.full_name,
      grad: v.grad,
      role,
      time: time ?? null,
      phone: v.phone,
    };

    const bucket = rosterMap.get(a.donation_date_id);
    if (!bucket) continue;

    if (role === 'monitor') bucket.monitors.push(entry);
    else if (role === 'atirador') bucket.atiradores.push(entry);
    else bucket.atiradores.push(entry);
  }

  const sortByWarName = (list: RosterVolunteer[]) =>
    [...list].sort((a, b) => (a.war_name || a.full_name).localeCompare(b.war_name || b.full_name, 'pt-BR'));

  return occupancy.map((d) => {
    const bucket = rosterMap.get(d.id) || { monitors: [], atiradores: [] };
    return {
      id: d.id,
      date: d.date,
      capacity: d.capacity,
      booked: d.booked,
      remaining: d.remaining,
      is_full: d.is_full,
      monitors: sortByWarName(bucket.monitors),
      atiradores: sortByWarName(bucket.atiradores),
    };
  });
}
