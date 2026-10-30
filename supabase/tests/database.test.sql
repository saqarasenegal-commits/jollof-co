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

  raise notice 'database tests passed';
end;
$$;
