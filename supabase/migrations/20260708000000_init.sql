-- SignupDingus initial schema
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.signup_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique default encode(gen_random_bytes(6), 'hex'),
  title text not null,
  description text not null default '',
  location text not null default '',
  contact_name text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.signup_lists (id) on delete cascade,
  slot_date date not null,
  label text not null,
  details text not null default '',
  capacity int not null default 1 check (capacity >= 1),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.signup_lists (id) on delete cascade,
  prompt text not null,
  qtype text not null default 'short_text' check (qtype in ('short_text', 'long_text', 'yes_no')),
  required boolean not null default false,
  sort_order int not null default 0
);

create table public.signups (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots (id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null default '',
  comment text not null default '',
  edit_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  signup_id uuid not null references public.signups (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  value text not null default '',
  unique (signup_id, question_id)
);

create index slots_list_id_idx on public.slots (list_id);
create index questions_list_id_idx on public.questions (list_id);
create index signups_slot_id_idx on public.signups (slot_id);
create index answers_signup_id_idx on public.answers (signup_id);
create index answers_question_id_idx on public.answers (question_id);
create index signup_lists_owner_id_idx on public.signup_lists (owner_id);

-- ---------------------------------------------------------------------------
-- Capacity enforcement: lock the slot row so concurrent signups can't
-- overfill it, then verify the count.
-- ---------------------------------------------------------------------------

create function public.enforce_slot_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  slot_capacity int;
  filled int;
begin
  select capacity into slot_capacity
  from public.slots
  where id = new.slot_id
  for update;

  if slot_capacity is null then
    raise exception 'slot_not_found';
  end if;

  select count(*) into filled
  from public.signups
  where slot_id = new.slot_id;

  if filled >= slot_capacity then
    raise exception 'slot_full';
  end if;

  return new;
end;
$$;

create trigger enforce_slot_capacity
before insert on public.signups
for each row
execute function public.enforce_slot_capacity();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Coordinators (authenticated users) manage their own lists and children.
-- Volunteers never talk to the database directly: public reads and signup
-- writes go through Next.js route handlers using the service role key,
-- which bypasses RLS. No anon policies are defined on purpose.
-- ---------------------------------------------------------------------------

alter table public.signup_lists enable row level security;
alter table public.slots enable row level security;
alter table public.questions enable row level security;
alter table public.signups enable row level security;
alter table public.answers enable row level security;

create policy "owners manage their lists"
on public.signup_lists
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "owners manage slots of their lists"
on public.slots
for all
to authenticated
using (
  exists (
    select 1 from public.signup_lists l
    where l.id = list_id and l.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.signup_lists l
    where l.id = list_id and l.owner_id = (select auth.uid())
  )
);

create policy "owners manage questions of their lists"
on public.questions
for all
to authenticated
using (
  exists (
    select 1 from public.signup_lists l
    where l.id = list_id and l.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.signup_lists l
    where l.id = list_id and l.owner_id = (select auth.uid())
  )
);

create policy "owners manage signups of their lists"
on public.signups
for all
to authenticated
using (
  exists (
    select 1
    from public.slots s
    join public.signup_lists l on l.id = s.list_id
    where s.id = slot_id and l.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.slots s
    join public.signup_lists l on l.id = s.list_id
    where s.id = slot_id and l.owner_id = (select auth.uid())
  )
);

create policy "owners manage answers of their lists"
on public.answers
for all
to authenticated
using (
  exists (
    select 1
    from public.signups su
    join public.slots s on s.id = su.slot_id
    join public.signup_lists l on l.id = s.list_id
    where su.id = signup_id and l.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.signups su
    join public.slots s on s.id = su.slot_id
    join public.signup_lists l on l.id = s.list_id
    where su.id = signup_id and l.owner_id = (select auth.uid())
  )
);
