-- =====================================================
-- TG 11 - DOAÇÃO DE SANGUE - Initial Schema
-- Execute this in Supabase SQL Editor (or psql)
-- =====================================================

-- Enable extensions
create extension if not exists "pgcrypto";

-- =====================================================
-- VOLUNTEERS (Atiradores / Voluntários)
-- =====================================================
create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  seq integer,
  grad text,
  nr text not null,
  full_name text not null,
  war_name text,
  birth_date date,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique by NR (principal identifier)
create unique index if not exists volunteers_nr_key on public.volunteers (nr);

-- Helpful search indexes
create index if not exists volunteers_nr_idx on public.volunteers (nr);
create index if not exists volunteers_war_name_idx on public.volunteers (war_name);
create index if not exists volunteers_full_name_idx on public.volunteers (full_name);

-- =====================================================
-- DONATION DATES
-- =====================================================
create table if not exists public.donation_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  capacity integer not null default 15,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donation_dates_date_idx on public.donation_dates (date);
create index if not exists donation_dates_active_idx on public.donation_dates (is_active);

-- =====================================================
-- TIME SLOTS (auto-generated per date)
-- =====================================================
create table if not exists public.donation_time_slots (
  id uuid primary key default gen_random_uuid(),
  donation_date_id uuid not null references public.donation_dates(id) on delete cascade,
  time text not null, -- '07:00', '13:30' etc.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (donation_date_id, time)
);

create index if not exists donation_time_slots_date_idx on public.donation_time_slots (donation_date_id);

-- =====================================================
-- APPOINTMENTS (Agendamentos)
-- =====================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  donation_date_id uuid not null references public.donation_dates(id) on delete cascade,
  time_slot_id uuid references public.donation_time_slots(id) on delete set null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_volunteer_idx on public.appointments (volunteer_id);
create index if not exists appointments_date_idx on public.appointments (donation_date_id);
create index if not exists appointments_status_idx on public.appointments (status);

-- Partial unique index: a volunteer can have at most ONE confirmed appointment
create unique index if not exists appointments_one_confirmed_per_volunteer
  on public.appointments (volunteer_id)
  where (status = 'confirmed');

-- =====================================================
-- UPDATED_AT trigger helper
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists volunteers_set_updated_at on public.volunteers;
create trigger volunteers_set_updated_at
  before update on public.volunteers
  for each row execute function public.set_updated_at();

drop trigger if exists donation_dates_set_updated_at on public.donation_dates;
create trigger donation_dates_set_updated_at
  before update on public.donation_dates
  for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (basic safe defaults)
-- =====================================================
alter table public.volunteers enable row level security;
alter table public.donation_dates enable row level security;
alter table public.donation_time_slots enable row level security;
alter table public.appointments enable row level security;

-- Public can read volunteers (we control exposure in application search)
create policy "volunteers_read_public"
  on public.volunteers for select
  using (true);

-- Public can read active donation dates
create policy "donation_dates_read_public"
  on public.donation_dates for select
  using (is_active = true);

create policy "time_slots_read_public"
  on public.donation_time_slots for select
  using (true);

-- Public can read their own appointments (via volunteer search later) - but we mostly use server
create policy "appointments_read_public"
  on public.appointments for select
  using (true);

-- Only service role (or authenticated admin via functions) can write volunteers/dates normally.
-- We will use service role key from server actions for imports/admin writes.
-- For appointments we use a SECURITY DEFINER function (see below).

-- =====================================================
-- SECURE FUNCTION: create_appointment (CRITICAL - prevents overbooking)
-- =====================================================
create or replace function public.create_appointment(
  p_volunteer_id uuid,
  p_donation_date_id uuid,
  p_time_slot_id uuid default null
)
returns table (
  appointment_id uuid,
  volunteer_nr text,
  volunteer_war_name text,
  volunteer_full_name text,
  donation_date date,
  time_slot text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_booked int;
  v_volunteer_exists boolean;
  v_date_active boolean;
  v_already_has_appointment boolean;
  v_slot_belongs boolean;
  v_slot_active boolean;
  v_new_appointment_id uuid;
begin
  -- 1. Validate volunteer
  select exists(select 1 from volunteers where id = p_volunteer_id)
  into v_volunteer_exists;
  if not v_volunteer_exists then
    raise exception 'Voluntário não encontrado';
  end if;

  -- 2. Validate date exists and is active
  select is_active, capacity
  into v_date_active, v_capacity
  from donation_dates
  where id = p_donation_date_id;

  if v_date_active is null then
    raise exception 'Data de doação não encontrada';
  end if;

  if not v_date_active then
    raise exception 'Esta data está inativa e não aceita agendamentos';
  end if;

  -- 3. Lock the donation date row to prevent race conditions
  perform 1 from donation_dates where id = p_donation_date_id for update;

  -- 4. Volunteer cannot have another confirmed appointment
  select exists(
    select 1 from appointments
    where appointments.volunteer_id = p_volunteer_id
      and appointments.status = 'confirmed'
  ) into v_already_has_appointment;

  if v_already_has_appointment then
    raise exception 'Você já possui um agendamento confirmado. Cancele o anterior antes de criar outro.';
  end if;

  -- 5 & 6. If time_slot provided, validate it belongs to the date and is active
  if p_time_slot_id is not null then
    select 
      (donation_date_id = p_donation_date_id),
      is_active
    into v_slot_belongs, v_slot_active
    from donation_time_slots
    where id = p_time_slot_id;

    if not v_slot_belongs or v_slot_active is null then
      raise exception 'Horário inválido para esta data';
    end if;

    if not v_slot_active then
      raise exception 'Este horário está inativo';
    end if;
  end if;

  -- 7 & 8. Count current confirmed bookings for the date (after lock)
  select count(*)
  into v_booked
  from appointments
  where appointments.donation_date_id = p_donation_date_id
    and appointments.status = 'confirmed';

  if v_booked >= v_capacity then
    raise exception 'Limite de % vagas atingido para esta data. Data fechada.', v_capacity;
  end if;

  -- 9 & 10. Create the appointment
  insert into appointments (
    volunteer_id,
    donation_date_id,
    time_slot_id,
    status
  ) values (
    p_volunteer_id,
    p_donation_date_id,
    p_time_slot_id,
    'confirmed'
  )
  returning id into v_new_appointment_id;

  -- 11. Return rich data for confirmation screen
  return query
  select 
    a.id,
    v.nr,
    v.war_name,
    v.full_name,
    d.date,
    ts.time,
    a.status
  from appointments a
  join volunteers v on v.id = a.volunteer_id
  join donation_dates d on d.id = a.donation_date_id
  left join donation_time_slots ts on ts.id = a.time_slot_id
  where a.id = v_new_appointment_id;
end;
$$;

-- Grant execution to anon + authenticated (used via anon key from server actions or client if desired)
grant execute on function public.create_appointment(uuid, uuid, uuid) to anon, authenticated;

-- =====================================================
-- Helper view for admin dashboard (optional convenience)
-- =====================================================
create or replace view public.vw_date_occupancy as
select
  d.id,
  d.date,
  d.capacity,
  d.is_active,
  coalesce(count(a.id) filter (where a.status = 'confirmed'), 0) as booked,
  d.capacity - coalesce(count(a.id) filter (where a.status = 'confirmed'), 0) as remaining,
  case 
    when coalesce(count(a.id) filter (where a.status = 'confirmed'), 0) >= d.capacity then true 
    else false 
  end as is_full
from donation_dates d
left join appointments a on a.donation_date_id = d.id
group by d.id, d.date, d.capacity, d.is_active;

-- Note: Views are readable by the policies of underlying tables.

comment on function public.create_appointment is 'Atomic, race-condition safe appointment creation. Enforces: 1 confirmed per volunteer, capacity limit per date, date active, slot validity. Uses SELECT FOR UPDATE.';
