-- Merchant profiles table and policies

create table if not exists public.merchant_profiles (
  id uuid primary key default gen_random_uuid(),
  merchant_wallet_address text not null unique,
  payout_address text not null,
  payout_mode smallint not null,
  split_bps smallint null check (split_bps between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists merchant_profiles_wallet_unique
  on public.merchant_profiles(merchant_wallet_address);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_merchant_profiles_updated_at on public.merchant_profiles;
create trigger set_merchant_profiles_updated_at
before update on public.merchant_profiles
for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public.merchant_profiles enable row level security;

-- Demo policy: allow inserts/updates for anon (adjust for production)
drop policy if exists merchant_profiles_anon_write on public.merchant_profiles;
create policy merchant_profiles_anon_write
  on public.merchant_profiles
  for all
  to anon
  using (true)
  with check (true);


