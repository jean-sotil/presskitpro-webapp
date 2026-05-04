-- ============================================================================
-- Task-02 spike: storage buckets + auth.users → /api/webhooks/supabase-auth
-- ============================================================================
-- Creates the two storage buckets used in v1 (avatars, gallery) and a Postgres
-- trigger that POSTs to our Next.js webhook on every auth.users mutation.
-- pg_net is enabled by Supabase by default; we just call into it.
-- ----------------------------------------------------------------------------

-- Storage buckets (idempotent)
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Spike-only RLS posture: public read on both buckets, authenticated write.
-- Hardened RLS lands in task-27.
do $$ begin
  create policy "public read avatars"
    on storage.objects for select
    using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read gallery"
    on storage.objects for select
    using (bucket_id = 'gallery');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth write avatars"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth write gallery"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'gallery');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Auth-sync trigger
-- ----------------------------------------------------------------------------
-- Reads two settings configured at the database level:
--   app.webhook_url     — full URL to the Next.js handler
--   app.webhook_secret  — shared secret matched by SUPABASE_AUTH_WEBHOOK_SECRET
-- Set them once with:
--   alter database postgres set app.webhook_url    = 'http://host.docker.internal:3000/api/webhooks/supabase-auth';
--   alter database postgres set app.webhook_secret = 'replace-me';
-- ----------------------------------------------------------------------------

create or replace function public.sync_auth_user_to_payload()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  webhook_url text := current_setting('app.webhook_url', true);
  webhook_secret text := current_setting('app.webhook_secret', true);
  payload jsonb;
begin
  if webhook_url is null or webhook_url = '' then
    raise notice 'app.webhook_url not configured; skipping auth sync.';
    return coalesce(new, old);
  end if;

  payload := jsonb_build_object(
    'type', tg_op,
    'table', 'users',
    'schema', 'auth',
    'record', case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    'old_record', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end
  );

  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-webhook-secret', coalesce(webhook_secret, '')
    ),
    body := payload
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_auth_user on auth.users;
create trigger trg_sync_auth_user
  after insert or update or delete on auth.users
  for each row execute function public.sync_auth_user_to_payload();
