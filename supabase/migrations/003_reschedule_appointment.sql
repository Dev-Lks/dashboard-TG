-- Secure transactional reschedule for admin operations.
-- Uses SELECT FOR UPDATE to prevent race conditions on capacity.

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
begin
  -- 1. Lock and validate appointment
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

  -- 2. If moving to a different date, validate and lock new date
  if p_new_donation_date_id <> v_old_date_id then
    select donation_dates.is_active, donation_dates.capacity
    into v_date_active, v_capacity
    from donation_dates
    where donation_dates.id = p_new_donation_date_id;

    if v_date_active is null then
      raise exception 'Data de doação não encontrada';
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

  -- 3. Validate time slot if provided
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

  -- 4. Append admin note if provided
  if p_admin_note is not null and trim(p_admin_note) <> '' then
    v_note_line := '[Reagendado ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') || ']: ' || trim(p_admin_note);
    if v_new_notes is not null and trim(v_new_notes) <> '' then
      v_new_notes := v_new_notes || E'\n' || v_note_line;
    else
      v_new_notes := v_note_line;
    end if;
  end if;

  -- 5. Update appointment atomically
  update appointments
  set
    donation_date_id = p_new_donation_date_id,
    time_slot_id = p_new_time_slot_id,
    admin_notes = v_new_notes
  where appointments.id = p_appointment_id;

  -- 6. Return rich data for confirmation
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

-- Admin-only: called via service role, not exposed to anon/authenticated
revoke all on function public.reschedule_appointment(uuid, uuid, uuid, text) from public;
grant execute on function public.reschedule_appointment(uuid, uuid, uuid, text) to service_role;

comment on function public.reschedule_appointment is 'Atomic, race-condition safe appointment reschedule. Locks appointment + target date, enforces capacity on new date, appends admin note history.';
