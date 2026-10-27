-- Elkoll – databas i Supabase (delar projekt med Jaktvind och Svampkartan)
-- Kör hela filen i Supabase: SQL Editor → New query → klistra in → Run.
-- Filen går att köra flera gånger.
--
-- Allt här har prefixet elkoll_ och rör inte de andra apparnas tabeller.
--
-- Rättigheter: ett team (företaget) har medlemmar som pekas ut med e-post.
-- Den som är inloggad med en e-post som finns i elkoll_medlem ser och ändrar
-- teamets medlemmar och uppdrag – inget annat. anon får ingenting.

-- ---------------------------------------------------------------------------
-- Team (företaget)
create table if not exists public.elkoll_team (
  id          uuid primary key,                                   -- skapas i appen
  namn        text not null,
  skapad_av   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Medlemmar. Inbjudan = en rad med kollegans e-post. När kollegan skapar konto
-- med samma e-post får hen tillgång till teamet. Ta bort = radera raden.
create table if not exists public.elkoll_medlem (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.elkoll_team(id) on delete cascade,
  namn        text not null,
  telefon     text,
  epost       text not null check (epost = lower(epost)),
  created_at  timestamptz not null default now(),
  unique (team_id, epost)
);

-- Uppdrag
create table if not exists public.elkoll_uppdrag (
  id          text primary key,                                   -- skapas i appen, så uppdrag kan sparas offline först
  team_id     uuid not null references public.elkoll_team(id) on delete cascade,
  skapad_av   uuid default auth.uid() references auth.users(id) on delete set null,
  fran        uuid references public.elkoll_medlem(id) on delete set null,   -- vem som lade in uppdraget
  tilldelad   uuid references public.elkoll_medlem(id) on delete set null,   -- tas medlemmen bort blir uppdraget otilldelat
  datum       date not null,
  tid         text,                                               -- 'HH:MM' eller tomt
  adress      text not null,
  kund        text,
  telefon     text,
  portkod     text,
  uppgift     text not null,
  material    text[] not null default '{}',
  saknas      text[] not null default '{}',                       -- fält som tolkningen inte hittade, t.ex. {'portkod'}
  fritext     text,                                               -- det som dikterades/skrevs
  status      text not null default 'planerad' check (status in ('planerad', 'klar', 'aterbesok')),
  kommentar   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Fakturering: debiteras = false för garanti/internt, fakturerad_at sätts när ägaren markerat uppdraget fakturerat
alter table public.elkoll_uppdrag add column if not exists debiteras boolean not null default true;
alter table public.elkoll_uppdrag add column if not exists fakturerad_at timestamptz;

-- Plats på kartan (steg 4). Slås upp från adressen när uppdraget sparas.
alter table public.elkoll_uppdrag add column if not exists lat double precision;
alter table public.elkoll_uppdrag add column if not exists lon double precision;

create index if not exists elkoll_medlem_epost   on public.elkoll_medlem (epost);
create index if not exists elkoll_uppdrag_team_d on public.elkoll_uppdrag (team_id, datum);

-- Teamen som den inloggade är medlem i (matchas på e-post i inloggningen).
-- security definer så att policies inte loopar på elkoll_medlem.
create or replace function public.elkoll_mina_team()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select m.team_id from public.elkoll_medlem m
  where m.epost = lower(coalesce((select auth.jwt()) ->> 'email', ''))
$$;
revoke all on function public.elkoll_mina_team() from public, anon;
grant execute on function public.elkoll_mina_team() to authenticated, service_role;

alter table public.elkoll_team    enable row level security;
alter table public.elkoll_medlem  enable row level security;
alter table public.elkoll_uppdrag enable row level security;

-- Team
drop policy if exists "elkoll_team_select" on public.elkoll_team;
drop policy if exists "elkoll_team_insert" on public.elkoll_team;
drop policy if exists "elkoll_team_update" on public.elkoll_team;
drop policy if exists "elkoll_team_delete" on public.elkoll_team;
create policy "elkoll_team_select" on public.elkoll_team for select to authenticated
  using (id in (select public.elkoll_mina_team()) or skapad_av = (select auth.uid()));
create policy "elkoll_team_insert" on public.elkoll_team for insert to authenticated
  with check (skapad_av = (select auth.uid()));
create policy "elkoll_team_update" on public.elkoll_team for update to authenticated
  using (id in (select public.elkoll_mina_team())) with check (id in (select public.elkoll_mina_team()));
create policy "elkoll_team_delete" on public.elkoll_team for delete to authenticated
  using (skapad_av = (select auth.uid()));

-- Medlemmar
drop policy if exists "elkoll_medlem_select" on public.elkoll_medlem;
drop policy if exists "elkoll_medlem_insert" on public.elkoll_medlem;
drop policy if exists "elkoll_medlem_update" on public.elkoll_medlem;
drop policy if exists "elkoll_medlem_delete" on public.elkoll_medlem;
create policy "elkoll_medlem_select" on public.elkoll_medlem for select to authenticated
  using (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_medlem_insert" on public.elkoll_medlem for insert to authenticated
  with check (team_id in (select public.elkoll_mina_team())
              or team_id in (select t.id from public.elkoll_team t where t.skapad_av = (select auth.uid())));
create policy "elkoll_medlem_update" on public.elkoll_medlem for update to authenticated
  using (team_id in (select public.elkoll_mina_team())) with check (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_medlem_delete" on public.elkoll_medlem for delete to authenticated
  using (team_id in (select public.elkoll_mina_team()));

-- Uppdrag
drop policy if exists "elkoll_uppdrag_select" on public.elkoll_uppdrag;
drop policy if exists "elkoll_uppdrag_insert" on public.elkoll_uppdrag;
drop policy if exists "elkoll_uppdrag_update" on public.elkoll_uppdrag;
drop policy if exists "elkoll_uppdrag_delete" on public.elkoll_uppdrag;
create policy "elkoll_uppdrag_select" on public.elkoll_uppdrag for select to authenticated
  using (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_uppdrag_insert" on public.elkoll_uppdrag for insert to authenticated
  with check (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_uppdrag_update" on public.elkoll_uppdrag for update to authenticated
  using (team_id in (select public.elkoll_mina_team())) with check (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_uppdrag_delete" on public.elkoll_uppdrag for delete to authenticated
  using (team_id in (select public.elkoll_mina_team()));

revoke all on public.elkoll_team, public.elkoll_medlem, public.elkoll_uppdrag from anon;
grant select, insert, update, delete on public.elkoll_team, public.elkoll_medlem, public.elkoll_uppdrag to authenticated;
grant select, insert, update, delete on public.elkoll_team, public.elkoll_medlem, public.elkoll_uppdrag to service_role;

-- ---------------------------------------------------------------------------
-- Tidrapport: en rad per arbetspass på ett uppdrag. slut = null betyder att tiden pågår.
create table if not exists public.elkoll_tid (
  id          text primary key,                                   -- skapas i appen, så tid kan rapporteras offline
  team_id     uuid not null references public.elkoll_team(id) on delete cascade,
  uppdrag_id  text not null references public.elkoll_uppdrag(id) on delete cascade,
  medlem_id   uuid references public.elkoll_medlem(id) on delete set null,
  start       timestamptz not null,
  slut        timestamptz check (slut is null or slut >= start),
  created_at  timestamptz not null default now()
);
create index if not exists elkoll_tid_team_start on public.elkoll_tid (team_id, start);
create index if not exists elkoll_tid_uppdrag on public.elkoll_tid (uppdrag_id);

alter table public.elkoll_tid enable row level security;
drop policy if exists "elkoll_tid_select" on public.elkoll_tid;
drop policy if exists "elkoll_tid_insert" on public.elkoll_tid;
drop policy if exists "elkoll_tid_update" on public.elkoll_tid;
drop policy if exists "elkoll_tid_delete" on public.elkoll_tid;
create policy "elkoll_tid_select" on public.elkoll_tid for select to authenticated
  using (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_tid_insert" on public.elkoll_tid for insert to authenticated
  with check (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_tid_update" on public.elkoll_tid for update to authenticated
  using (team_id in (select public.elkoll_mina_team())) with check (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_tid_delete" on public.elkoll_tid for delete to authenticated
  using (team_id in (select public.elkoll_mina_team()));
revoke all on public.elkoll_tid from anon;
grant select, insert, update, delete on public.elkoll_tid to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Foton (dokumentation på plats). Filen ligger i bucketen elkoll-foton under
-- <team_id>/<uppdrag_id>/<foto_id>.jpg, raden här talar om vilket uppdrag och före/efter.
create table if not exists public.elkoll_foto (
  id          text primary key,                                   -- skapas i appen, så foton kan sparas offline först
  uppdrag_id  text not null references public.elkoll_uppdrag(id) on delete cascade,
  team_id     uuid not null references public.elkoll_team(id) on delete cascade,
  typ         text not null default 'fore' check (typ in ('fore', 'efter')),
  path        text not null,
  skapad_av   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists elkoll_foto_uppdrag on public.elkoll_foto (uppdrag_id);

alter table public.elkoll_foto enable row level security;
drop policy if exists "elkoll_foto_select" on public.elkoll_foto;
drop policy if exists "elkoll_foto_insert" on public.elkoll_foto;
drop policy if exists "elkoll_foto_update" on public.elkoll_foto;
drop policy if exists "elkoll_foto_delete" on public.elkoll_foto;
create policy "elkoll_foto_select" on public.elkoll_foto for select to authenticated
  using (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_foto_insert" on public.elkoll_foto for insert to authenticated
  with check (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_foto_update" on public.elkoll_foto for update to authenticated
  using (team_id in (select public.elkoll_mina_team())) with check (team_id in (select public.elkoll_mina_team()));
create policy "elkoll_foto_delete" on public.elkoll_foto for delete to authenticated
  using (team_id in (select public.elkoll_mina_team()));
revoke all on public.elkoll_foto from anon;
grant select, insert, update, delete on public.elkoll_foto to authenticated, service_role;

-- Privat bucket, max 1 MB per foto (appen krymper till ca 150–250 kB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('elkoll-foton', 'elkoll-foton', false, 1048576, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Teamets medlemmar kommer åt mappen <team_id>/ – inget annat
drop policy if exists "elkoll_foton_select" on storage.objects;
drop policy if exists "elkoll_foton_insert" on storage.objects;
drop policy if exists "elkoll_foton_update" on storage.objects;
drop policy if exists "elkoll_foton_delete" on storage.objects;
create policy "elkoll_foton_select" on storage.objects for select to authenticated
  using (bucket_id = 'elkoll-foton' and (storage.foldername(name))[1] in (select t::text from public.elkoll_mina_team() t));
create policy "elkoll_foton_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'elkoll-foton' and (storage.foldername(name))[1] in (select t::text from public.elkoll_mina_team() t));
create policy "elkoll_foton_update" on storage.objects for update to authenticated
  using (bucket_id = 'elkoll-foton' and (storage.foldername(name))[1] in (select t::text from public.elkoll_mina_team() t))
  with check (bucket_id = 'elkoll-foton' and (storage.foldername(name))[1] in (select t::text from public.elkoll_mina_team() t));
create policy "elkoll_foton_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'elkoll-foton' and (storage.foldername(name))[1] in (select t::text from public.elkoll_mina_team() t));
