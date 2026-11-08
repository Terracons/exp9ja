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
