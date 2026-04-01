create table if not exists public.availability_slots (
  id bigint generated always as identity primary key,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique (session_date, start_time, end_time)
);

alter table public.availability_slots enable row level security;

create policy "Public can read availability"
on public.availability_slots
for select
to anon
using (true);

create index if not exists availability_slots_date_idx
on public.availability_slots (session_date, start_time);
