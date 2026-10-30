-- Riders: the kitchen hands each order to a rider, the rider marks it delivered.

-- True for trusted callers: the server (service_role key) or a direct database
-- connection (migrations, tests, admin psql), which carries no API claims.
-- Note: inside a security definer function current_user is always the owner,
-- so it can't be used to tell callers apart.
create function public.is_trusted_caller()
returns boolean
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'service_role')
         = 'service_role';
$$;

-- Only kitchen and admin staff move orders through the kitchen steps (riders use mark_delivered).
create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  allowed text[];
begin
  if coalesce(public.staff_role(), '') not in ('kitchen', 'admin') and not public.is_trusted_caller() then
    raise exception 'not_allowed';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'unknown_order';
  end if;

  allowed := case o.status
    when 'received' then array['cooking', 'cancelled']
    when 'cooking' then array['on_the_way', 'cancelled']
    when 'on_the_way' then array['delivered']
    else array[]::text[]
  end;
  if not p_status = any (allowed) then
    raise exception 'invalid_transition:%->%', o.status, p_status;
  end if;

  if p_status = 'cancelled' then
    perform public.cancel_order(o.id);
    select * into o from public.orders where id = p_order_id;
  else
    update public.orders set status = p_status where id = p_order_id returning * into o;
  end if;
  return o;
end;
$$;

alter table public.orders add column rider_id uuid references public.staff (user_id);
alter table public.orders add column picked_up_at timestamptz;
alter table public.orders add column delivered_at timestamptz;

-- Kitchen or admin hands a cooked order to a rider. Moves it to "on_the_way".
create function public.assign_rider(p_order_id uuid, p_rider_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  if coalesce(public.staff_role(), '') not in ('kitchen', 'admin') and not public.is_trusted_caller() then
    raise exception 'not_allowed';
  end if;
  if not exists (select from public.staff where user_id = p_rider_id and role = 'rider') then
    raise exception 'not_a_rider';
  end if;

  update public.orders
     set rider_id = p_rider_id, status = 'on_the_way', picked_up_at = now()
   where id = p_order_id and status = 'cooking'
   returning * into o;
  if not found then
    raise exception 'order_not_ready';
  end if;
  return o;
end;
$$;

-- A rider marks one of their own orders delivered.
create function public.mark_delivered(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  update public.orders
     set status = 'delivered',
         delivered_at = now(),
         payment_status = case when payment_status = 'cash_on_delivery' then 'paid' else payment_status end
   where id = p_order_id
     and status = 'on_the_way'
     and (rider_id = auth.uid() or public.staff_role() = 'admin' or public.is_trusted_caller())
   returning * into o;
  if not found then
    raise exception 'not_your_delivery';
  end if;
  return o;
end;
$$;

-- Riders only see the orders handed to them; kitchen and admin see all.
drop policy "staff read orders" on public.orders;
create policy "staff read orders" on public.orders
  for select to authenticated using (
    public.staff_role() in ('kitchen', 'admin')
    or (public.staff_role() = 'rider' and rider_id = auth.uid())
  );

drop policy "staff read order items" on public.order_items;
create policy "staff read order items" on public.order_items
  for select to authenticated using (
    exists (select from public.orders o where o.id = order_id)
  );

-- Riders list, for the kitchen's "hand to rider" picker.
create policy "kitchen sees riders" on public.staff
  for select to authenticated using (role = 'rider' and public.staff_role() in ('kitchen', 'admin'));

revoke execute on function public.assign_rider(uuid, uuid) from public, anon;
revoke execute on function public.mark_delivered(uuid) from public, anon;
grant execute on function public.assign_rider(uuid, uuid) to authenticated;
grant execute on function public.mark_delivered(uuid) to authenticated;
