create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
  on public.user_roles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;

-- After creating the two accounts in Supabase Authentication, assign their roles:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do update set role = excluded.role;
--
-- insert into public.user_roles (user_id, role)
-- select id, 'staff' from auth.users where email = 'staff@example.com'
-- on conflict (user_id) do update set role = excluded.role;
