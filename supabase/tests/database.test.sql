-- Database tests. Run with: npm run db:test (needs a Postgres URL in DATABASE_URL).
-- Any failed check raises an exception and the script exits with an error.
\set ON_ERROR_STOP on

do $$
declare
  o public.orders;
  ok boolean;
  n integer;
begin
  -- Menu and zones are seeded.
  select count(*) into n from public.dishes;
  assert n = 22, 'expected 22 dishes, got ' || n;

  -- 40 portions: 39 taken, then 1 left, then sold out.
  assert public.reserve_portions('2026-11-02', 'jollof', 39), 'first 39 portions';
  assert public.reserve_portions('2026-11-02', 'jollof', 1), 'last portion';
  ok := public.reserve_portions('2026-11-02', 'jollof', 1);
  assert not ok, 'the 41st portion must be refused';
  select sold into n from public.daily_stock where delivery_date = '2026-11-02' and dish_id = 'jollof';
  assert n = 40, 'sold must stay at 40, got ' || n;

  -- An order for a sold-out dish is refused and leaves nothing behind.
  begin
    perform public.create_order(
      '{"delivery_date":"2026-11-02","kind":"today","slot":"asap","customer_name":"Test",
        "phone":"55551234","zone_id":"west-bay","street":"850","building":"12",
        "payment_method":"card","subtotal_qar":45,"delivery_qar":10,"total_qar":55}',
      '[{"dish_id":"jollof","qty":1}]');
    assert false, 'sold-out order should have failed';
  exception when raise_exception then
    assert sqlerrm = 'sold_out:jollof', 'unexpected error: ' || sqlerrm;
  end;
  select count(*) into n from public.orders;
  assert n = 0, 'no order may be saved when a dish is sold out';

  -- A valid order is saved with its items, price from the database, and stock taken.
  o := public.create_order(
    '{"delivery_date":"2026-11-02","kind":"today","slot":"asap","customer_name":"Test",
      "phone":"55551234","zone_id":"west-bay","street":"850","building":"12",
      "payment_method":"cash","subtotal_qar":105,"delivery_qar":10,"total_qar":115}',
    '[{"dish_id":"mafe","qty":2},{"dish_id":"bissap","qty":1}]');
  assert o.number like 'JC-%', 'order number';
  assert o.payment_status = 'cash_on_delivery', 'cash orders are paid on delivery';
  select count(*) into n from public.order_items where order_id = o.id;
  assert n = 2, 'two lines';
  select sold into n from public.daily_stock where delivery_date = '2026-11-02' and dish_id = 'mafe';
  assert n = 2, 'mafe stock taken';
  select count(*) into n from public.daily_stock where dish_id = 'bissap';
  assert n = 0, 'fixed menu has no stock row';

  -- Cancelling gives the portions back, once.
  perform public.cancel_order(o.id);
  perform public.cancel_order(o.id);
  select sold into n from public.daily_stock where delivery_date = '2026-11-02' and dish_id = 'mafe';
  assert n = 0, 'mafe portions released exactly once, got ' || n;

  -- Bad phone numbers are rejected by the database too.
  begin
    perform public.create_order(
      '{"delivery_date":"2026-11-02","kind":"today","slot":"asap","customer_name":"Test",
        "phone":"44441234","zone_id":"west-bay","street":"1","building":"1",
        "payment_method":"card","subtotal_qar":50,"delivery_qar":10,"total_qar":60}',
      '[{"dish_id":"yassa","qty":1}]');
    assert false, 'landline should be refused';
  exception when check_violation then
    null;
  end;

  -- Kitchen statuses follow the allowed steps.
  o := public.create_order(
    '{"delivery_date":"2026-11-02","kind":"today","slot":"asap","customer_name":"Test",
      "phone":"55551234","zone_id":"west-bay","street":"850","building":"12",
      "payment_method":"cash","subtotal_qar":50,"delivery_qar":10,"total_qar":60}',
    '[{"dish_id":"mafe","qty":1}]');
  o := public.set_order_status(o.id, 'cooking');
  assert o.status = 'cooking', 'received -> cooking';
  begin
    perform public.set_order_status(o.id, 'delivered');
    assert false, 'cooking -> delivered must be refused';
  exception when raise_exception then
    assert sqlerrm = 'invalid_transition:cooking->delivered', 'unexpected error: ' || sqlerrm;
  end;
  o := public.set_order_status(o.id, 'cancelled');
  assert o.status = 'cancelled', 'cooking -> cancelled';
  select sold into n from public.daily_stock where delivery_date = '2026-11-02' and dish_id = 'mafe';
  assert n = 0, 'cancelling from the kitchen gives the portion back, got ' || n;

  -- Staff roles.
  insert into public.staff values ('00000000-0000-0000-0000-000000000001', 'Chef', 'kitchen');
  perform set_config('test.uid', '00000000-0000-0000-0000-000000000001', true);
  assert public.staff_role() = 'kitchen', 'kitchen role';
  perform set_config('test.uid', '00000000-0000-0000-0000-000000000002', true);
  assert public.staff_role() is null, 'customers have no staff role';

  -- Riders: kitchen hands over, only that rider can mark it delivered, cash becomes paid.
  insert into public.staff values ('00000000-0000-0000-0000-0000000000a1', 'Rider A', 'rider');
  insert into public.staff values ('00000000-0000-0000-0000-0000000000b2', 'Rider B', 'rider');
  perform set_config('test.uid', '', true);
  o := public.create_order(
    '{"delivery_date":"2026-11-02","kind":"today","slot":"asap","customer_name":"Test",
      "phone":"55551234","zone_id":"west-bay","street":"850","building":"12",
      "payment_method":"cash","subtotal_qar":48,"delivery_qar":10,"total_qar":58}',
    '[{"dish_id":"yassa","qty":1}]');
  begin
    perform public.assign_rider(o.id, '00000000-0000-0000-0000-0000000000a1');
    assert false, 'an order that is not cooked yet cannot leave';
  exception when raise_exception then
    assert sqlerrm = 'order_not_ready', 'unexpected error: ' || sqlerrm;
  end;
  perform public.set_order_status(o.id, 'cooking');
  o := public.assign_rider(o.id, '00000000-0000-0000-0000-0000000000a1');
  assert o.status = 'on_the_way' and o.picked_up_at is not null, 'handed to rider A';

  -- From here, calls look like they come through the API as a signed-in user.
  perform set_config('request.jwt.claims', '{"role":"authenticated"}', true);

  -- Rider B cannot close rider A's delivery, nor move orders through kitchen steps.
  perform set_config('test.uid', '00000000-0000-0000-0000-0000000000b2', true);
  begin
    perform public.set_order_status(o.id, 'delivered');
    assert false, 'riders must not use the kitchen steps';
  exception when raise_exception then
    assert sqlerrm = 'not_allowed', 'unexpected error: ' || sqlerrm;
  end;
  begin
    perform public.mark_delivered(o.id);
    assert false, 'rider B must not close rider A''s order';
  exception when raise_exception then
    assert sqlerrm = 'not_your_delivery', 'unexpected error: ' || sqlerrm;
  end;
  perform set_config('test.uid', '00000000-0000-0000-0000-0000000000a1', true);
  o := public.mark_delivered(o.id);
  assert o.status = 'delivered' and o.payment_status = 'paid', 'cash collected on delivery';

  -- A customer (signed in, not staff) can do none of this.
  perform set_config('test.uid', '00000000-0000-0000-0000-0000000000c3', true);
  begin
    perform public.assign_rider(o.id, '00000000-0000-0000-0000-0000000000a1');
    assert false, 'customers cannot assign riders';
  exception when raise_exception then
    assert sqlerrm = 'not_allowed', 'unexpected error: ' || sqlerrm;
  end;

  -- Admin: only admins change prices and portions; portions never below sold.
  begin
    perform public.update_dish('jollof', 50, null);
    assert false, 'customers cannot change prices';
  exception when raise_exception then
    assert sqlerrm = 'not_allowed', 'unexpected error: ' || sqlerrm;
  end;
  insert into public.staff values ('00000000-0000-0000-0000-0000000000ad', 'Owner', 'admin');
  perform set_config('test.uid', '00000000-0000-0000-0000-0000000000ad', true);
  assert (public.update_dish('jollof', 50, null)).price_qar = 50, 'price updated';
  assert not (public.update_dish('jollof', null, false)).active, 'dish turned off';
  begin
    perform public.update_dish('jollof', 4500, null);
    assert false, 'price too high';
  exception when raise_exception then
    assert sqlerrm = 'invalid_price', 'unexpected error: ' || sqlerrm;
  end;
  assert (public.set_portions('2026-11-09', 'jollof', 60)).portions = 60, 'more portions for a future day';
  begin
    perform public.set_portions('2026-11-02', 'jollof', 30); -- 40 already sold that day
    assert false, 'cannot go below sold';
  exception when raise_exception then
    assert sqlerrm = 'below_sold', 'unexpected error: ' || sqlerrm;
  end;
  begin
    perform public.set_portions('2026-11-02', 'bissap', 30);
    assert false, 'fixed menu has no portions';
  exception when raise_exception then
    assert sqlerrm = 'not_a_dish_of_the_day', 'unexpected error: ' || sqlerrm;
  end;

  raise notice 'database tests passed';
end;
$$;
