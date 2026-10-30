-- jollof&co initial schema.
-- Business rules live in packages/core; the database enforces the ones that
-- must hold even under concurrent orders (the 40-portion limit).

-- ---------------------------------------------------------------- menu
create table public.dishes (
  id            text primary key,
  section       text not null check (section in ('mains', 'sides', 'drinks', 'desserts', 'combos')),
  region        text not null check (region in ('west', 'east', 'north', 'all')),
  origin        text not null,
  price_qar     numeric(8, 2) not null check (price_qar >= 0),
  daily_special boolean not null default false,
  spicy         boolean not null default false,
  tags          text[] not null default '{}',
  name_en       text not null,
  name_ar       text not null,
  description_en text not null,
  description_ar text not null,
  active        boolean not null default true
);

create table public.zones (
  id      text primary key,
  name_en text not null,
  name_ar text not null,
  fee_qar numeric(8, 2) not null check (fee_qar >= 0)
);

-- ---------------------------------------------------------------- stock
-- One row per dish of the day and delivery date. Created on first sale.
create table public.daily_stock (
  delivery_date date not null,
  dish_id       text not null references public.dishes (id),
  portions      integer not null default 40 check (portions >= 0),
  sold          integer not null default 0,
  primary key (delivery_date, dish_id),
  check (sold between 0 and portions)
);

-- Atomically takes `qty` portions. Returns false (and takes nothing) if not enough are left.
-- The row lock makes two simultaneous orders for the last portion safe: one wins, one gets false.
create function public.reserve_portions(p_date date, p_dish text, p_qty integer, p_default integer default 40)
returns boolean
language plpgsql
as $$
declare
  updated integer;
begin
  insert into public.daily_stock (delivery_date, dish_id, portions)
  values (p_date, p_dish, p_default)
  on conflict do nothing;

  update public.daily_stock
     set sold = sold + p_qty
   where delivery_date = p_date and dish_id = p_dish and sold + p_qty <= portions;
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

create function public.release_portions(p_date date, p_dish text, p_qty integer)
returns void
language sql
as $$
  update public.daily_stock
     set sold = greatest(0, sold - p_qty)
   where delivery_date = p_date and dish_id = p_dish;
$$;

-- ---------------------------------------------------------------- orders
create sequence public.order_number_seq start 1001;

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  number          text not null unique default ('JC-' || nextval('public.order_number_seq')),
  created_at      timestamptz not null default now(),
  delivery_date   date not null,
  kind            text not null check (kind in ('today', 'preorder')),
  slot            text not null,
  customer_name   text not null,
  phone           text not null check (phone ~ '^[3567][0-9]{7}$'),
  zone_id         text not null references public.zones (id),
  street          text not null,
  building        text not null,
  unit            text,
  note            text,
  payment_method  text not null check (payment_method in ('card', 'apple_pay', 'cash')),
  payment_status  text not null default 'pending'
                  check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cash_on_delivery')),
  status          text not null default 'received'
                  check (status in ('received', 'cooking', 'on_the_way', 'delivered', 'cancelled')),
  payment_ref     text,
  subtotal_qar    numeric(8, 2) not null,
  delivery_qar    numeric(8, 2) not null,
  total_qar       numeric(8, 2) not null
);

create index orders_delivery_date_idx on public.orders (delivery_date, status);

create table public.order_items (
  order_id       uuid not null references public.orders (id) on delete cascade,
  dish_id        text not null references public.dishes (id),
  qty            integer not null check (qty > 0),
  unit_price_qar numeric(8, 2) not null,
  primary key (order_id, dish_id)
);

-- Creates an order and reserves dishes of the day in one transaction.
-- Called by the server only (after packages/core validateOrder), never by the app directly.
-- Raises 'sold_out:<dish id>' if a dish of the day has run out in the meantime.
create function public.create_order(p_order jsonb, p_items jsonb)
returns public.orders
language plpgsql
as $$
declare
  item   jsonb;
  dish   public.dishes;
  result public.orders;
begin
  insert into public.orders (
    delivery_date, kind, slot, customer_name, phone, zone_id, street, building, unit, note,
    payment_method, payment_status, subtotal_qar, delivery_qar, total_qar
  ) values (
    (p_order ->> 'delivery_date')::date, p_order ->> 'kind', p_order ->> 'slot',
    p_order ->> 'customer_name', p_order ->> 'phone', p_order ->> 'zone_id',
    p_order ->> 'street', p_order ->> 'building', p_order ->> 'unit', p_order ->> 'note',
    p_order ->> 'payment_method',
    case when p_order ->> 'payment_method' = 'cash' then 'cash_on_delivery' else 'pending' end,
    (p_order ->> 'subtotal_qar')::numeric, (p_order ->> 'delivery_qar')::numeric,
    (p_order ->> 'total_qar')::numeric
  ) returning * into result;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into dish from public.dishes where id = item ->> 'dish_id';
    if not found then
      raise exception 'unknown_dish:%', item ->> 'dish_id';
    end if;
    if dish.daily_special
       and not public.reserve_portions(result.delivery_date, dish.id, (item ->> 'qty')::integer) then
      raise exception 'sold_out:%', dish.id;
    end if;
    insert into public.order_items (order_id, dish_id, qty, unit_price_qar)
    values (result.id, dish.id, (item ->> 'qty')::integer, dish.price_qar);
  end loop;

  return result;
end;
$$;

-- Cancels an order and gives its portions back (failed payment, customer or kitchen cancellation).
create function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  o public.orders;
begin
  update public.orders set status = 'cancelled'
   where id = p_order_id and status <> 'cancelled'
   returning * into o;
  if not found then
    return;
  end if;
  perform public.release_portions(o.delivery_date, i.dish_id, i.qty)
     from public.order_items i
     join public.dishes d on d.id = i.dish_id
    where i.order_id = o.id and d.daily_special;
end;
$$;

-- ---------------------------------------------------------------- access
-- The app (anon/authenticated) may read the menu, zones and stock counters.
-- Orders are written and read through the server (service role) only.
alter table public.dishes enable row level security;
alter table public.zones enable row level security;
alter table public.daily_stock enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "menu is public" on public.dishes for select to anon, authenticated using (active);
create policy "zones are public" on public.zones for select to anon, authenticated using (true);
create policy "stock counters are public" on public.daily_stock for select to anon, authenticated using (true);

revoke execute on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.reserve_portions(date, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.cancel_order(uuid) from public, anon, authenticated;
revoke execute on function public.release_portions(date, text, integer) from public, anon, authenticated;
