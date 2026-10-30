-- Admin: prices, dishes on/off, portions per day.
-- Same limits as packages/core/src/admin.ts.

create function public.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(public.staff_role(), '') <> 'admin' and not public.is_trusted_caller() then
    raise exception 'not_allowed';
  end if;
end;
$$;

-- Changes a dish's price and/or whether it is on the menu. Pass null to keep a value.
create function public.update_dish(p_dish_id text, p_price_qar numeric, p_active boolean)
returns public.dishes
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.dishes;
begin
  perform public.require_admin();
  if p_price_qar is not null and (p_price_qar < 0 or p_price_qar > 1000 or p_price_qar <> round(p_price_qar, 2)) then
    raise exception 'invalid_price';
  end if;
  update public.dishes
     set price_qar = coalesce(p_price_qar, price_qar),
         active = coalesce(p_active, active)
   where id = p_dish_id
   returning * into d;
  if not found then
    raise exception 'unknown_dish';
  end if;
  return d;
end;
$$;

-- Sets how many portions of a dish of the day are cooked on a date.
-- Never below what is already sold.
create function public.set_portions(p_date date, p_dish_id text, p_portions integer)
returns public.daily_stock
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.daily_stock;
begin
  perform public.require_admin();
  if not exists (select from public.dishes where id = p_dish_id and daily_special) then
    raise exception 'not_a_dish_of_the_day';
  end if;
  if p_portions < 0 or p_portions > 500 then
    raise exception 'invalid_portions';
  end if;

  insert into public.daily_stock (delivery_date, dish_id, portions)
  values (p_date, p_dish_id, p_portions)
  on conflict (delivery_date, dish_id) do update
    set portions = excluded.portions
    where public.daily_stock.sold <= excluded.portions
  returning * into s;
  if not found then
    raise exception 'below_sold';
  end if;
  return s;
end;
$$;

-- Admins also see inactive dishes.
create policy "admin sees all dishes" on public.dishes
  for select to authenticated using (public.staff_role() = 'admin');

revoke execute on function public.require_admin() from public, anon;
revoke execute on function public.update_dish(text, numeric, boolean) from public, anon;
revoke execute on function public.set_portions(date, text, integer) from public, anon;
grant execute on function public.update_dish(text, numeric, boolean) to authenticated;
grant execute on function public.set_portions(date, text, integer) to authenticated;
