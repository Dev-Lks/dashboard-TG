-- Fix ambiguous "status" references inside create_appointment.
-- In PL/pgSQL RETURNS TABLE, output columns are variables; the returned
-- "status" column conflicted with appointments.status in unqualified queries.

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
  select exists(select 1 from volunteers where volunteers.id = p_volunteer_id)
  into v_volunteer_exists;
  if not v_volunteer_exists then
    raise exception 'Voluntário não encontrado';
  end if;

  select donation_dates.is_active, donation_dates.capacity
  into v_date_active, v_capacity
  from donation_dates
  where donation_dates.id = p_donation_date_id;

  if v_date_active is null then
    raise exception 'Data de doação não encontrada';
  end if;

  if not v_date_active then
    raise exception 'Esta data está inativa e não aceita agendamentos';
  end if;

  perform 1 from donation_dates where donation_dates.id = p_donation_date_id for update;

  select exists(
    select 1 from appointments
    where appointments.volunteer_id = p_volunteer_id
      and appointments.status = 'confirmed'
  ) into v_already_has_appointment;

  if v_already_has_appointment then
    raise exception 'Você já possui um agendamento confirmado. Cancele o anterior antes de criar outro.';
  end if;

  if p_time_slot_id is not null then
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
    status
  ) values (
    p_volunteer_id,
    p_donation_date_id,
    p_time_slot_id,
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
