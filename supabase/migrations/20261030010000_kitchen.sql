-- Kitchen and staff access.
-- Staff sign in with Supabase Auth; their role decides what they can see and change.

create table public.staff (
  user_id uuid primary key,
  name    text not null,
  role    text not null check (role in ('kitchen', 'rider', 'admin'))
);

alter table public.staff enable row level security;

-- Role of the signed-in user, or null for customers and anonymous visitors.
create function public.staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.staff where user_id = auth.uid();
$$;

create policy "staff see themselves" on public.staff
  for select to authenticated using (user_id = auth.uid() or public.staff_role() = 'admin');

-- Kitchen, riders and admins can read orders and their items.
create policy "staff read orders" on public.orders
  for select to authenticated using (public.staff_role() is not null);
create policy "staff read order items" on public.order_items
  for select to authenticated using (public.staff_role() is not null);

-- Moves an order to a new status, following the same rules as packages/core/src/kitchen.ts.
-- Cancelling gives the portions back.
create function public.set_order_status(p_order_id uuid, p_status text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  allowed text[];
begin
  if public.staff_role() is null and current_user not in ('postgres', 'service_role') then
    raise exception 'not_staff';
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

revoke execute on function public.set_order_status(uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, text) to authenticated;

-- The kitchen screen updates live when orders arrive or change.
do $$ begin
  if exists (select from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
