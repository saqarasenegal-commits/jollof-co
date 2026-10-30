-- Fixes from the Supabase security advisor.

-- Pin search_path so a caller can't make these functions resolve objects from another schema.
alter function public.reserve_portions(date, text, integer, integer) set search_path = public;
alter function public.release_portions(date, text, integer) set search_path = public;
alter function public.create_order(jsonb, jsonb) set search_path = public;
alter function public.cancel_order(uuid) set search_path = public;
alter function public.is_trusted_caller() set search_path = public;

-- staff_role() is used by row-level security for signed-in users only.
revoke execute on function public.staff_role() from public, anon;
grant execute on function public.staff_role() to authenticated;

-- require_admin() is only called from inside other admin functions.
revoke execute on function public.require_admin() from authenticated;

-- Intentionally callable by signed-in users (each checks the caller's role itself):
-- set_order_status, assign_rider, mark_delivered, update_dish, set_portions.
