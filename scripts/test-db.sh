#!/usr/bin/env bash
# Applies the migrations and seed to an empty Postgres database, then runs the database tests.
# Usage: DATABASE_URL=postgres://user:pass@localhost:5432/postgres ./scripts/test-db.sh
# The database is dropped and recreated as "jollofco_test", so never point this at production.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?Set DATABASE_URL to a local Postgres server}"

psql "$DATABASE_URL" -qX -c "drop database if exists jollofco_test" -c "create database jollofco_test"
TEST_URL="${DATABASE_URL%/*}/jollofco_test"

# Supabase creates these roles itself; plain Postgres needs them for the policies.
psql "$TEST_URL" -qX -v ON_ERROR_STOP=1 <<'SQL'
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
end $$;
-- Minimal stand-in for Supabase Auth: auth.uid() reads the "test.uid" setting.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable
  as $f$ select nullif(current_setting('test.uid', true), '')::uuid $f$;
SQL

for f in supabase/migrations/*.sql supabase/seed.sql; do
  psql "$TEST_URL" -qX -v ON_ERROR_STOP=1 -f "$f"
done
psql "$TEST_URL" -qX -v ON_ERROR_STOP=1 -f supabase/tests/database.test.sql
