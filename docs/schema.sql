-- ============================================================
-- NexPulse — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- ---------- PROFILES (extends Supabase's auth.users) ----------
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  email        text not null,
  full_name    text not null,
  role         text not null check (role in ('patient','doctor')),
  -- patient-specific
  date_of_birth date,
  sex          text check (sex in ('M','F','Other')),
  assigned_doctor_id uuid references public.profiles(id) on delete set null,
  -- doctor-specific
  specialty    text,
  license_no   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---------- VITALS (live + historical readings) ----------
create table public.vitals (
  id           bigserial primary key,
  patient_id   uuid references public.profiles(id) on delete cascade not null,
  recorded_at  timestamptz default now() not null,
  heart_rate   int,
  spo2         int,
  bp_systolic  int,
  bp_diastolic int,
  glucose      int,
  steps        int,
  sleep_score  int,
  source       text default 'manual'  -- 'manual' | 'apple_watch' | 'fitbit' etc
);
create index on public.vitals (patient_id, recorded_at desc);

-- ---------- ALERTS (triage events) ----------
create table public.alerts (
  id           bigserial primary key,
  patient_id   uuid references public.profiles(id) on delete cascade not null,
  severity     text not null check (severity in ('critical','high','watch','info')),
  category     text not null,          -- 'cardiac','pulmonary','metabolic','sleep','other'
  message      text not null,
  metadata     jsonb,
  resolved     boolean default false,
  created_at   timestamptz default now()
);
create index on public.alerts (patient_id, created_at desc);

-- ---------- APPOINTMENTS ----------
create table public.appointments (
  id           bigserial primary key,
  patient_id   uuid references public.profiles(id) on delete cascade not null,
  doctor_id    uuid references public.profiles(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  duration_min int default 30,
  kind         text default 'consult',  -- 'consult','telehealth','follow-up'
  location     text,
  notes        text,
  status       text default 'scheduled', -- 'scheduled','done','cancelled','no-show'
  created_at   timestamptz default now()
);
create index on public.appointments (doctor_id, scheduled_at);
create index on public.appointments (patient_id, scheduled_at);

-- ---------- CHAT CONVERSATIONS + MESSAGES ----------
create table public.conversations (
  id           bigserial primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  title        text default 'New conversation',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index on public.conversations (user_id, updated_at desc);

create table public.messages (
  id              bigserial primary key,
  conversation_id bigint references public.conversations(id) on delete cascade not null,
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  created_at      timestamptz default now()
);
create index on public.messages (conversation_id, created_at);

-- ---------- ACTIVITY LOG ----------
create table public.activity_log (
  id           bigserial primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  kind         text not null,   -- 'lab_upload','medication_taken','vitals_sync','message' etc
  description  text not null,
  metadata     jsonb,
  created_at   timestamptz default now()
);
create index on public.activity_log (user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — who can see what
-- This is what prevents User A from seeing User B's data
-- ============================================================

alter table public.profiles     enable row level security;
alter table public.vitals       enable row level security;
alter table public.alerts       enable row level security;
alter table public.appointments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages     enable row level security;
alter table public.activity_log enable row level security;

-- PROFILES: users see their own profile; doctors see profiles of assigned patients
create policy "own profile read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "doctor reads assigned patients"
  on public.profiles for select
  using (
    assigned_doctor_id = auth.uid()
    or (
      -- doctors can also read each other's basic info (optional, can be removed)
      role = 'doctor'
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'doctor')
    )
  );

create policy "user updates own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "anyone can insert their own profile on signup"
  on public.profiles for insert
  with check (auth.uid() = id);

-- VITALS: patient sees own; doctor sees assigned patients'
create policy "patient reads own vitals"
  on public.vitals for select
  using (auth.uid() = patient_id);

create policy "doctor reads assigned patient vitals"
  on public.vitals for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = vitals.patient_id
        and p.assigned_doctor_id = auth.uid()
    )
  );

create policy "patient inserts own vitals"
  on public.vitals for insert
  with check (auth.uid() = patient_id);

-- ALERTS: same pattern as vitals
create policy "patient reads own alerts"
  on public.alerts for select
  using (auth.uid() = patient_id);

create policy "doctor reads assigned alerts"
  on public.alerts for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = alerts.patient_id
        and p.assigned_doctor_id = auth.uid()
    )
  );

create policy "patient or system inserts alert"
  on public.alerts for insert
  with check (auth.uid() = patient_id);

-- APPOINTMENTS: both parties see them
create policy "appointment parties read"
  on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointment parties insert"
  on public.appointments for insert
  with check (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointment parties update"
  on public.appointments for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

-- CONVERSATIONS: only owner
create policy "own conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- MESSAGES: only if you own the conversation
create policy "own conversation messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- ACTIVITY LOG: own only
create policy "own activity"
  on public.activity_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile row when a user signs up via auth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- OPTIONAL: seed a bit of demo data (comment out in production)
-- ============================================================
-- You'll add demo patients manually after signup in the app.

-- Done. Your schema is ready.
