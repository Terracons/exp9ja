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
