-- NaijaBulk MVP schema. Paste into Supabase SQL Editor and run once.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('buyer','supplier')),
  company text not null,
  country text not null default 'Nigeria',
  verified boolean not null default false -- set by an admin in the Table Editor, never by payment
);
create table listings (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  commodity text not null, title text not null, origin_state text,
  moq_tons numeric not null, price_usd_per_ton numeric not null,
  created_at timestamptz not null default now()
);
create table rfqs (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  commodity text not null, quantity_tons numeric not null, destination text not null, specs text,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create table quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  supplier_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  price_usd_per_ton numeric not null, lead_time_days int not null, note text,
  status text not null default 'submitted' check (status in ('submitted','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique (rfq_id, supplier_id)
);
create table orders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references quotes(id),
  rfq_id uuid not null references rfqs(id),
  buyer_id uuid not null references profiles(id),
  supplier_id uuid not null references profiles(id),
  commodity text not null, quantity_tons numeric not null, price_usd_per_ton numeric not null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table listings enable row level security;
alter table rfqs enable row level security;
alter table quotes enable row level security;
alter table orders enable row level security;

create function is_role(r text) returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = r) $$;

create policy "profiles readable" on profiles for select using (true);
create policy "listings readable" on listings for select using (true);
create policy "suppliers add listings" on listings for insert with check (supplier_id = auth.uid() and is_role('supplier'));
create policy "suppliers delete own listings" on listings for delete using (supplier_id = auth.uid());
create policy "rfqs visible to owner and suppliers" on rfqs for select using (buyer_id = auth.uid() or is_role('supplier'));
create policy "buyers add rfqs" on rfqs for insert with check (buyer_id = auth.uid() and is_role('buyer'));
create policy "quotes visible to parties" on quotes for select using (
  supplier_id = auth.uid() or exists (select 1 from rfqs r where r.id = rfq_id and r.buyer_id = auth.uid()));
create policy "suppliers quote open rfqs" on quotes for insert with check (
  supplier_id = auth.uid() and is_role('supplier') and exists (select 1 from rfqs r where r.id = rfq_id and r.status = 'open'));
create policy "orders visible to parties" on orders for select using (buyer_id = auth.uid() or supplier_id = auth.uid());

-- Accepting a quote is one atomic step: accept it, reject the rest, close the RFQ, create the order.
create function accept_quote(q uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare qt quotes; rf rfqs; oid uuid;
begin
  select * into qt from quotes where id = q;
  select * into rf from rfqs where id = qt.rfq_id;
  if rf.buyer_id is distinct from auth.uid() or rf.status <> 'open' then raise exception 'Not allowed'; end if;
  update quotes set status = case when id = q then 'accepted' else 'rejected' end where rfq_id = rf.id;
  update rfqs set status = 'closed' where id = rf.id;
  insert into orders (quote_id, rfq_id, buyer_id, supplier_id, commodity, quantity_tons, price_usd_per_ton)
    values (q, rf.id, rf.buyer_id, qt.supplier_id, rf.commodity, rf.quantity_tons, qt.price_usd_per_ton)
    returning id into oid;
  return oid;
end $$;

-- Create a profile automatically when someone signs up.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, company, country) values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'supplier' then 'supplier' else 'buyer' end,
    coalesce(nullif(new.raw_user_meta_data->>'company', ''), 'Unnamed company'),
    coalesce(nullif(new.raw_user_meta_data->>'country', ''), 'Nigeria'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
