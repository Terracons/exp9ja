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

-- Run after schema.sql. Adds listing photos (Supabase Storage, free tier).
alter table listings add column if not exists image_url text;
insert into storage.buckets (id, name, public) values ('listings', 'listings', true) on conflict (id) do nothing;
create policy "listing images public read" on storage.objects for select using (bucket_id = 'listings');
create policy "suppliers upload own listing images" on storage.objects for insert to authenticated
  with check (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);

-- Run after schema.sql and images.sql. Adds shipment tracking and an admin flag.
alter table profiles add column if not exists is_admin boolean not null default false; -- tick this yourself in the Table Editor
create function is_admin() returns boolean language sql security definer stable set search_path = public as
$$ select coalesce((select is_admin from profiles where id = auth.uid()), false) $$;
create policy "admins verify profiles" on profiles for update using (is_admin()) with check (is_admin());

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  reference text not null, carrier text, origin text not null default 'Nigeria', destination text not null,
  status text not null default 'Booked',
  created_at timestamptz not null default now()
);
create table shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  status text not null, location text, note text,
  source text not null default 'supplier' check (source in ('supplier','carrier')), -- who reported it
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table shipments enable row level security;
alter table shipment_events enable row level security;

create policy "parties read shipments" on shipments for select using (
  exists (select 1 from orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.supplier_id = auth.uid())));
create policy "supplier creates shipment" on shipments for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.supplier_id = auth.uid()));
create policy "parties read events" on shipment_events for select using (
  exists (select 1 from shipments s join orders o on o.id = s.order_id
          where s.id = shipment_id and (o.buyer_id = auth.uid() or o.supplier_id = auth.uid())));
create policy "supplier adds events" on shipment_events for insert with check (
  source = 'supplier' and exists (select 1 from shipments s join orders o on o.id = s.order_id
          where s.id = shipment_id and o.supplier_id = auth.uid()));

create function sync_shipment_status() returns trigger language plpgsql security definer set search_path = public as $$
begin update shipments set status = new.status where id = new.shipment_id; return new; end $$;
create trigger on_shipment_event after insert on shipment_events for each row execute function sync_shipment_status();

-- Run after tracking.sql. Adds buyer/supplier messaging per quotation and price revisions.
create table messages (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  sender_id uuid not null default auth.uid() references profiles(id),
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table messages enable row level security;
create policy "parties read messages" on messages for select using (
  exists (select 1 from quotes q join rfqs r on r.id = q.rfq_id
          where q.id = quote_id and (q.supplier_id = auth.uid() or r.buyer_id = auth.uid())));
create policy "parties send messages" on messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from quotes q join rfqs r on r.id = q.rfq_id
          where q.id = quote_id and (q.supplier_id = auth.uid() or r.buyer_id = auth.uid())));
create policy "suppliers revise own quotes" on quotes for update
  using (supplier_id = auth.uid() and status = 'submitted')
  with check (supplier_id = auth.uid() and status = 'submitted');

-- Run after messages.sql. Adds service providers, freight requests and quotations, order documents, unread badges.
alter table profiles add column if not exists provider_type text;
alter table profiles add column if not exists about text;
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('buyer','supplier','provider'));

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data->>'role';
begin
  insert into profiles (id, role, company, country, provider_type, about) values (
    new.id,
    case when r in ('supplier','provider') then r else 'buyer' end,
    coalesce(nullif(new.raw_user_meta_data->>'company', ''), 'Unnamed company'),
    coalesce(nullif(new.raw_user_meta_data->>'country', ''), 'Nigeria'),
    case when r = 'provider' then nullif(new.raw_user_meta_data->>'provider_type', '') end,
    case when r = 'provider' then nullif(new.raw_user_meta_data->>'about', '') end);
  return new;
end $$;

create table freight_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  requested_by uuid not null default auth.uid() references profiles(id),
  service text not null, commodity text, quantity_tons numeric, origin text not null default 'Nigeria',
  destination text not null, notes text,
  status text not null default 'open' check (status in ('open','assigned','closed')),
  created_at timestamptz not null default now()
);
create table freight_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references freight_requests(id) on delete cascade,
  provider_id uuid not null default auth.uid() references profiles(id),
  price_usd numeric not null, transit_days int, note text,
  status text not null default 'submitted' check (status in ('submitted','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique (request_id, provider_id)
);
create table documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references profiles(id),
  doc_type text not null, file_name text not null, file_path text not null,
  created_at timestamptz not null default now()
);
create table message_reads (
  quote_id uuid not null references quotes(id) on delete cascade,
  user_id uuid not null default auth.uid() references profiles(id),
  last_read_at timestamptz not null default now(),
  primary key (quote_id, user_id)
);
alter table freight_requests enable row level security;
alter table freight_quotes enable row level security;
alter table documents enable row level security;
alter table message_reads enable row level security;

create function is_order_party(oid uuid) returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from orders where id = oid and (buyer_id = auth.uid() or supplier_id = auth.uid())) $$;
create function my_provider_type() returns text language sql security definer stable set search_path = public as
$$ select provider_type from profiles where id = auth.uid() $$;
create function owns_request(rid uuid) returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from freight_requests where id = rid and requested_by = auth.uid()) $$;
create function quoted_request(rid uuid) returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from freight_quotes where request_id = rid and provider_id = auth.uid()) $$;

create policy "see freight requests" on freight_requests for select using (
  requested_by = auth.uid() or is_order_party(order_id) or quoted_request(id)
  or (is_role('provider') and status = 'open' and service = my_provider_type()));
create policy "order parties request freight" on freight_requests for insert with check (requested_by = auth.uid() and is_order_party(order_id));
create policy "see freight quotes" on freight_quotes for select using (provider_id = auth.uid() or owns_request(request_id));
create policy "providers quote requests" on freight_quotes for insert with check (
  provider_id = auth.uid() and is_role('provider') and exists (
    select 1 from freight_requests r where r.id = request_id and r.status = 'open' and r.service = my_provider_type()));
create policy "parties read documents" on documents for select using (is_order_party(order_id));
create policy "parties add documents" on documents for insert with check (uploaded_by = auth.uid() and is_order_party(order_id));
create policy "own read marks" on message_reads for select using (user_id = auth.uid());

create function accept_freight_quote(q uuid) returns void language plpgsql security definer set search_path = public as $$
declare fq freight_quotes; fr freight_requests;
begin
  select * into fq from freight_quotes where id = q;
  select * into fr from freight_requests where id = fq.request_id;
  if fr.requested_by is distinct from auth.uid() or fr.status <> 'open' then raise exception 'Not allowed'; end if;
  update freight_quotes set status = case when id = q then 'accepted' else 'rejected' end where request_id = fr.id;
  update freight_requests set status = 'assigned' where id = fr.id;
end $$;

create function mark_read(q uuid) returns void language sql security definer set search_path = public as $$
  insert into message_reads (quote_id, user_id, last_read_at) values (q, auth.uid(), now())
  on conflict (quote_id, user_id) do update set last_read_at = now() $$;

-- Private storage for order documents (invoices, packing lists, certificates).
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;
create policy "parties read document files" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and is_order_party(((storage.foldername(name))[1])::uuid));
create policy "parties upload document files" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and is_order_party(((storage.foldername(name))[1])::uuid));

-- Retail and bulk listings, categories, units. Safe to run once after logistics.sql.
alter table listings add column if not exists category text;
alter table listings add column if not exists sale_type text not null default 'bulk' check (sale_type in ('bulk','retail'));
alter table listings add column if not exists unit text not null default 'tonne';
alter table listings add column if not exists pack_sizes text;
alter table rfqs add column if not exists unit text not null default 'tonne';
alter table orders add column if not exists unit text not null default 'tonne';
alter table freight_requests add column if not exists unit text not null default 'tonne';

create or replace function accept_quote(q uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare qt quotes; rf rfqs; oid uuid;
begin
  select * into qt from quotes where id = q;
  select * into rf from rfqs where id = qt.rfq_id;
  if rf.buyer_id is distinct from auth.uid() or rf.status <> 'open' then raise exception 'Not allowed'; end if;
  update quotes set status = case when id = q then 'accepted' else 'rejected' end where rfq_id = rf.id;
  update rfqs set status = 'closed' where id = rf.id;
  insert into orders (quote_id, rfq_id, buyer_id, supplier_id, commodity, quantity_tons, unit, price_usd_per_ton)
    values (q, rf.id, rf.buyer_id, qt.supplier_id, rf.commodity, rf.quantity_tons, rf.unit, qt.price_usd_per_ton)
    returning id into oid;
  return oid;
end $$;

notify pgrst, 'reload schema';
