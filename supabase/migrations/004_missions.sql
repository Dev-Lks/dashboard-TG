-- =====================================================
-- Missions + flexible schedule (replaces time profiles)
-- =====================================================

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  location text,
  phone text,
  maps_url text,
  default_capacity integer not null default 15,
  default_schedule_mode text not null default 'slots'
    check (default_schedule_mode in ('slots', 'presence_only')),
  is_public boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists missions_set_updated_at on public.missions;
create trigger missions_set_updated_at
  before update on public.missions
  for each row execute function public.set_updated_at();

alter table public.missions enable row level security;

create policy "missions_read_public"
  on public.missions for select
  using (true);

-- Seed default blood donation mission
insert into public.missions (
  slug,
  name,
  description,
  location,
  phone,
  maps_url,
  default_capacity,
  default_schedule_mode,
  is_public,
  sort_order
) values (
  'doacao-sangue',
  'Doação de Sangue',
  'Missão de doação de sangue do efetivo do TG 11-002.',
  'Av. Quarenta e Nove, 125 — Elândia, Ituiutaba/MG',
  '(34) 3271-9275',
  'https://maps.app.goo.gl/6NC5uPAW1jxJRsBPA?g_st=iw',
  15,
  'slots',
  true,
  0
) on conflict (slug) do nothing;

-- Extend donation_dates with mission + schedule fields
alter table public.donation_dates
  add column if not exists mission_id uuid references public.missions(id) on delete restrict,
  add column if not exists schedule_mode text not null default 'slots'
    check (schedule_mode in ('slots', 'presence_only')),
  add column if not exists schedule_start text,
  add column if not exists schedule_end text,
  add column if not exists slot_interval integer;

-- Backfill existing dates to default mission
update public.donation_dates
set mission_id = (select id from public.missions where slug = 'doacao-sangue' limit 1)
where mission_id is null;

-- Backfill schedule from existing slots where possible
update public.donation_dates d
set
  schedule_start = sub.first_time,
  schedule_end = sub.last_time,
  slot_interval = sub.interval_min
from (
  select
    donation_date_id,
    min(time) as first_time,
    max(time) as last_time,
    case
      when count(*) > 1 then
        extract(epoch from (max(time::time) - min(time::time))) / 60 / (count(*) - 1)
      else 30
    end::integer as interval_min
  from public.donation_time_slots
  where is_active = true
  group by donation_date_id
) sub
where d.id = sub.donation_date_id
  and d.schedule_start is null;

-- Dates with no slots are presence-only
update public.donation_dates
set schedule_mode = 'presence_only'
where id not in (
  select distinct donation_date_id from public.donation_time_slots where is_active = true
);

alter table public.donation_dates
  alter column mission_id set not null;

-- Replace global unique date with per-mission unique
alter table public.donation_dates drop constraint if exists donation_dates_date_key;
create unique index if not exists donation_dates_mission_date_key
  on public.donation_dates (mission_id, date);

-- Denormalize mission_id on appointments for per-mission uniqueness
alter table public.appointments
  add column if not exists mission_id uuid references public.missions(id) on delete restrict;

update public.appointments a
set mission_id = d.mission_id
from public.donation_dates d
where d.id = a.donation_date_id
  and a.mission_id is null;

alter table public.appointments
  alter column mission_id set not null;

create index if not exists appointments_mission_idx on public.appointments (mission_id);

-- One confirmed appointment per volunteer per mission
drop index if exists public.appointments_one_confirmed_per_volunteer;

create unique index if not exists appointments_one_confirmed_per_volunteer_mission
  on public.appointments (volunteer_id, mission_id)
  where (status = 'confirmed');

-- =====================================================
-- Updated create_appointment: per-mission booking + schedule_mode
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
  v_mission_id uuid;
  v_schedule_mode text;
begin
  select exists(select 1 from volunteers where volunteers.id = p_volunteer_id)
  into v_volunteer_exists;
  if not v_volunteer_exists then
    raise exception 'Voluntário não encontrado';
  end if;

  select
    donation_dates.is_active,
    donation_dates.capacity,
    donation_dates.mission_id,
    donation_dates.schedule_mode
  into v_date_active, v_capacity, v_mission_id, v_schedule_mode
  from donation_dates
  where donation_dates.id = p_donation_date_id;

  if v_date_active is null then
    raise exception 'Data da missão não encontrada';
  end if;

  if not v_date_active then
    raise exception 'Esta data está inativa e não aceita agendamentos';
  end if;

  perform 1 from donation_dates where donation_dates.id = p_donation_date_id for update;

  select exists(
    select 1
    from appointments a
    join donation_dates dd on dd.id = a.donation_date_id
    where a.volunteer_id = p_volunteer_id
      and a.status = 'confirmed'
      and dd.mission_id = v_mission_id
  ) into v_already_has_appointment;

  if v_already_has_appointment then
    raise exception 'Você já confirmou presença nesta missão.';
  end if;

  if v_schedule_mode = 'slots' then
    if p_time_slot_id is null then
      raise exception 'Selecione um horário para esta data';
    end if;

    select
      (donation_time_slots.donation_date_id = p_donation_date_id),
      donation_time_slots.is_active
    into v_slot_belongs, v_slot_active
    from donation_time_slots
    where donation_time_slots.id = p_time_slot_id;

    if not v_slot_belongs or v_slot_active is null then
      raise exception 'Horário inválido para esta data';
    end if;

    if not v_slot_active then
      raise exception 'Este horário está inativo';
    end if;
  elsif p_time_slot_id is not null then
    raise exception 'Esta data não utiliza horários';
  end if;

  select count(*)
  into v_booked
  from appointments
  where appointments.donation_date_id = p_donation_date_id
    and appointments.status = 'confirmed';

  if v_booked >= v_capacity then
    raise exception 'Limite de % vagas atingido para esta data. Data fechada.', v_capacity;
  end if;

  insert into appointments (
    volunteer_id,
    donation_date_id,
    time_slot_id,
    mission_id,
    status
  ) values (
    p_volunteer_id,
    p_donation_date_id,
    p_time_slot_id,
    v_mission_id,
    'confirmed'
  )
  returning appointments.id into v_new_appointment_id;

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

grant execute on function public.create_appointment(uuid, uuid, uuid) to anon, authenticated;

comment on function public.create_appointment is 'Atomic appointment creation. Enforces: 1 confirmed per volunteer per mission, capacity per date, schedule_mode slot rules.';

-- Update reschedule to sync mission_id when date changes
create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_new_donation_date_id uuid,
  p_new_time_slot_id uuid default null,
  p_admin_note text default null
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
  v_old_date_id uuid;
  v_old_status text;
  v_capacity int;
  v_booked int;
  v_date_active boolean;
  v_slot_belongs boolean;
  v_slot_active boolean;
  v_new_notes text;
  v_note_line text;
  v_new_mission_id uuid;
begin
  select
    appointments.donation_date_id,
    appointments.status,
    appointments.admin_notes
  into v_old_date_id, v_old_status, v_new_notes
  from appointments
  where appointments.id = p_appointment_id
  for update;

  if v_old_date_id is null then
    raise exception 'Agendamento não encontrado';
  end if;

  if v_old_status <> 'confirmed' then
    raise exception 'Apenas agendamentos confirmados podem ser reagendados';
  end if;

  select donation_dates.mission_id
  into v_new_mission_id
  from donation_dates
  where donation_dates.id = p_new_donation_date_id;

  if p_new_donation_date_id <> v_old_date_id then
    select donation_dates.is_active, donation_dates.capacity
    into v_date_active, v_capacity
    from donation_dates
    where donation_dates.id = p_new_donation_date_id;

    if v_date_active is null then
      raise exception 'Data da missão não encontrada';
    end if;

    if not v_date_active then
      raise exception 'Esta data está inativa e não aceita agendamentos';
    end if;

    perform 1 from donation_dates where donation_dates.id = p_new_donation_date_id for update;

    select count(*)
    into v_booked
    from appointments
    where appointments.donation_date_id = p_new_donation_date_id
      and appointments.status = 'confirmed';

    if v_booked >= v_capacity then
      raise exception 'Data em capacidade máxima. Não há vagas disponíveis.';
    end if;
  end if;

  if p_new_time_slot_id is not null then
    select
      (donation_time_slots.donation_date_id = p_new_donation_date_id),
      donation_time_slots.is_active
    into v_slot_belongs, v_slot_active
    from donation_time_slots
    where donation_time_slots.id = p_new_time_slot_id;

    if not v_slot_belongs or v_slot_active is null then
      raise exception 'Horário inválido para esta data';
    end if;

    if not v_slot_active then
      raise exception 'Este horário está inativo';
    end if;
  end if;

  if p_admin_note is not null and trim(p_admin_note) <> '' then
    v_note_line := '[Reagendado ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') || ']: ' || trim(p_admin_note);
    if v_new_notes is not null and trim(v_new_notes) <> '' then
      v_new_notes := v_new_notes || E'\n' || v_note_line;
    else
      v_new_notes := v_note_line;
    end if;
  end if;

  update appointments
  set
    donation_date_id = p_new_donation_date_id,
    time_slot_id = p_new_time_slot_id,
    mission_id = v_new_mission_id,
    admin_notes = v_new_notes
  where appointments.id = p_appointment_id;

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
  where a.id = p_appointment_id;
end;
$$;

revoke all on function public.reschedule_appointment(uuid, uuid, uuid, text) from public;
grant execute on function public.reschedule_appointment(uuid, uuid, uuid, text) to service_role;
