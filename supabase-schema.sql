-- ============================================================
-- Carona Bairro - Schema do Supabase
-- Cole este script em: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- 1) TABELA: perfis dos motoristas (vinculada à auth.users do Supabase)
create table if not exists public.driver_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  whatsapp text not null,          -- número com DDI, ex: 5511988887777
  car_model text default '',
  created_at timestamptz default now()
);

-- 2) TABELA: agendamentos de viagem criados pelos motoristas
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.driver_profiles (id) on delete cascade,
  from_place text not null,
  to_place text not null,
  time_of_day text not null,        -- ex: "07:30"
  days text[] not null default '{}',-- ex: {seg,ter,qua,qui,sex}
  price numeric(10,2) default 0,
  seats int not null default 1 check (seats >= 0),
  booked int not null default 0,
  notes text default '',
  active boolean not null default true,
  created_at timestamptz default now()
);

-- 3) TABELA: reservas feitas pelos passageiros
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  passenger_name text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.driver_profiles enable row level security;
alter table public.rides           enable row level security;
alter table public.bookings        enable row level security;

-- Motorista: lê/cria/atualiza o PRÓPRIO perfil
create policy "driver_profile_select_own" on public.driver_profiles
  for select using (auth.uid() = id);
create policy "driver_profile_insert_own" on public.driver_profiles
  for insert with check (auth.uid() = id);
create policy "driver_profile_update_own" on public.driver_profiles
  for update using (auth.uid() = id);

-- Qualquer pessoa (mesmo deslogada): vê viagens ativas e perfis de motoristas com viagem ativa
create policy "rides_select_public_active" on public.rides
  for select using (active = true OR auth.uid() = driver_id);
create policy "profiles_select_public" on public.driver_profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.rides r where r.driver_id = id and r.active = true)
  );

-- Motorista autenticado: cria/edita/exclua as PRÓPRIAS viagens
create policy "rides_insert_own" on public.rides
  for insert with check (auth.uid() = driver_id);
create policy "rides_update_own" on public.rides
  for update using (auth.uid() = driver_id);
create policy "rides_delete_own" on public.rides
  for delete using (auth.uid() = driver_id);

-- Público: pode reservar (inserir) e ver reservas
create policy "bookings_select" on public.bookings
  for select using (true);
create policy "bookings_insert" on public.bookings
  for insert with check (true);

-- Motorista: vê as reservas das PRÓPRIAS viagens
create policy "bookings_select_own_rides" on public.bookings
  for select using (
    exists (select 1 from public.rides r where r.id = ride_id and r.driver_id = auth.uid())
  );

-- ============================================================
-- FUNÇÃO RPC: reserva atômica (executa como dono/service role)
-- Trava a vaga e impede corrida (overbooking) entre usuários.
-- ============================================================
create or replace function public.book_ride(p_ride_id uuid, p_passenger_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride rides;
begin
  select * into v_ride
    from rides
    where id = p_ride_id and active = true
    for update;               -- trava a linha

  if not found then
    return json_build_object('ok', false, 'error', 'Viagem não encontrada ou cancelada.');
  end if;

  if v_ride.booked >= v_ride.seats then
    return json_build_object('ok', false, 'error', 'Lotação completa.');
  end if;

  insert into bookings (ride_id, passenger_name)
    values (p_ride_id, trim(coalesce(p_passenger_name, '')));

  update rides set booked = booked + 1 where id = p_ride_id;

  return json_build_object(
    'ok', true,
    'whatsapp', (select whatsapp from driver_profiles where id = v_ride.driver_id),
    'driver_name', (select name from driver_profiles where id = v_ride.driver_id)
  );
end $$;
