-- Apply after naijabulk_all.sql on an existing database. This migration is transactional.
begin;
alter table profiles add column if not exists about text;
alter table orders add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid'));
alter table listings add column if not exists category text;
alter table listings add column if not exists sale_type text not null default 'bulk';
alter table listings add column if not exists unit text not null default 'tonne';
alter table listings add column if not exists pack_sizes text;
alter table rfqs add column if not exists unit text not null default 'tonne';
alter table orders add column if not exists unit text not null default 'tonne';
alter table freight_requests add column if not exists unit text not null default 'tonne';

-- NOT VALID preserves historical rows but enforces positive values on all future writes.
alter table listings add constraint listing_positive_values check (moq_tons > 0 and price_usd_per_ton > 0) not valid;
alter table rfqs add constraint rfq_positive_quantity check (quantity_tons > 0) not valid;
alter table quotes add constraint quote_positive_values check (price_usd_per_ton > 0 and lead_time_days > 0) not valid;
alter table freight_quotes add constraint freight_positive_values check (price_usd > 0 and (transit_days is null or transit_days > 0)) not valid;
create policy "suppliers edit own listings" on listings for update using (supplier_id = auth.uid() and is_role('supplier')) with check (supplier_id = auth.uid() and is_role('supplier'));

-- Validate signup metadata at the database boundary, including non-browser registrations.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data->>'role';
  business text := trim(coalesce(new.raw_user_meta_data->>'company',''));
  location text := trim(coalesce(new.raw_user_meta_data->>'country','Nigeria'));
  service text := new.raw_user_meta_data->>'provider_type';
  description text := coalesce(new.raw_user_meta_data->>'about','');
begin
  if r is null or r not in ('buyer','supplier','provider') then r := 'buyer'; end if;
  if length(business) not between 1 and 120 or length(location) not between 1 and 80 or length(description)>1000 then raise exception 'Provide a valid business name, country and description'; end if;
  if r='provider' and (service is null or service not in ('Freight forwarder','Haulage provider','Clearing agent','Inspection provider','Warehouse provider','Shipping line','Insurance provider','Laboratory')) then raise exception 'Choose a supported logistics service'; end if;
  insert into profiles(id,role,company,country,provider_type,about) values(new.id,r,business,location,case when r='provider' then service else null end,description);
  return new;
end $$;

create or replace function update_my_profile(business text, location text, description text, service text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if business is null or location is null or length(trim(business)) not between 1 and 120 or length(trim(location)) not between 1 and 80 or length(description) > 1000 then raise exception 'Invalid profile details'; end if;
  if is_role('provider') and (service is null or service not in ('Freight forwarder','Haulage provider','Clearing agent','Inspection provider','Warehouse provider','Shipping line','Insurance provider','Laboratory')) then raise exception 'Invalid service'; end if;
  update profiles set company=trim(business), country=trim(location), about=trim(description),
    verified=case when company is distinct from trim(business) or country is distinct from trim(location) or provider_type is distinct from (case when role='provider' then service else null end) then false else verified end,
    provider_type=case when role='provider' then service else null end where id=auth.uid();
end $$;
revoke all on function update_my_profile(text,text,text,text) from public;
grant execute on function update_my_profile(text,text,text,text) to authenticated;

-- Freeze quote identity. A supplier can revise only the price of an open quotation.
create or replace function guard_quote_revision() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('postgres','service_role') then return new; end if;
  if new.id is distinct from old.id or new.rfq_id is distinct from old.rfq_id or new.supplier_id is distinct from old.supplier_id or new.status is distinct from old.status or new.created_at is distinct from old.created_at or new.lead_time_days is distinct from old.lead_time_days or new.note is distinct from old.note then raise exception 'Only price revisions are allowed'; end if;
  if not exists(select 1 from rfqs where id=old.rfq_id and status='open') then raise exception 'This request is closed'; end if;
  return new;
end $$;
create trigger quote_revision_guard before update on quotes for each row execute function guard_quote_revision();

-- Lock the request before accepting a quotation so two requests cannot create conflicting orders.
create or replace function accept_quote(q uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare qt quotes; rf rfqs; oid uuid;
begin
  select * into qt from quotes where id=q;
  if not found then raise exception 'Quotation not found'; end if;
  select * into rf from rfqs where id=qt.rfq_id for update;
  if rf.buyer_id is distinct from auth.uid() or rf.status <> 'open' then raise exception 'This request cannot be accepted'; end if;
  select * into qt from quotes where id=q for update;
  if qt.status <> 'submitted' or qt.price_usd_per_ton <= 0 then raise exception 'Quotation is no longer available'; end if;
  update quotes set status=case when id=q then 'accepted' else 'rejected' end where rfq_id=rf.id;
  update rfqs set status='closed' where id=rf.id;
  insert into orders(quote_id,rfq_id,buyer_id,supplier_id,commodity,quantity_tons,unit,price_usd_per_ton)
  values(q,rf.id,rf.buyer_id,qt.supplier_id,rf.commodity,rf.quantity_tons,rf.unit,qt.price_usd_per_ton) returning id into oid;
  return oid;
end $$;

create or replace function accept_freight_quote(q uuid) returns void language plpgsql security definer set search_path = public as $$
declare fq freight_quotes; fr freight_requests;
begin
  select * into fq from freight_quotes where id=q;
  if not found then raise exception 'Quotation not found'; end if;
  select * into fr from freight_requests where id=fq.request_id for update;
  if fr.requested_by is distinct from auth.uid() or fr.status <> 'open' or fq.status <> 'submitted' then raise exception 'This quotation cannot be assigned'; end if;
  update freight_quotes set status=case when id=q then 'accepted' else 'rejected' end where request_id=fr.id;
  update freight_requests set status='assigned' where id=fr.id;
end $$;

-- Only conversation participants can write read receipts.
create or replace function mark_read(q uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from quotes qt join rfqs r on r.id=qt.rfq_id where qt.id=q and (qt.supplier_id=auth.uid() or r.buyer_id=auth.uid())) then raise exception 'Not allowed'; end if;
  insert into message_reads(quote_id,user_id,last_read_at) values(q,auth.uid(),now()) on conflict(quote_id,user_id) do update set last_read_at=now();
end $$;

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id),
  buyer_id uuid not null references profiles(id),
  reference text not null unique,
  amount_minor bigint not null check(amount_minor > 0),
  currency text not null default 'NGN' check(currency='NGN'),
  usd_ngn_rate numeric not null check(usd_ngn_rate > 0),
  status text not null default 'pending' check(status in ('pending','paid')),
  checkout_url text,
  provider_transaction text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table payments enable row level security;
create policy "buyers read own payments" on payments for select to authenticated using(buyer_id=auth.uid());
-- No browser insert/update policies. The service role alone prepares and settles payments.
create or replace function settle_order_payment(payment_reference text, provider_transaction text) returns void
language plpgsql security definer set search_path = public as $$
declare p payments;
begin
  select * into p from payments where reference=payment_reference for update;
  if not found then raise exception 'Payment not found'; end if;
  if p.status='paid' then return; end if;
  update payments set status='paid',paid_at=now(),provider_transaction=settle_order_payment.provider_transaction where id=p.id;
  update orders set payment_status='paid' where id=p.order_id and buyer_id=p.buyer_id;
end $$;
revoke all on function settle_order_payment(text,text) from public,anon,authenticated;
grant execute on function settle_order_payment(text,text) to service_role;

-- Signed documents must belong to their order folder; reject metadata pointing to another order.
create or replace function validate_document_path() returns trigger language plpgsql as $$
begin
  if split_part(new.file_path,'/',1) <> new.order_id::text then raise exception 'Invalid document path'; end if;
  return new;
end $$;
create trigger validate_document_folder before insert on documents for each row execute function validate_document_path();
update storage.buckets set file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='listings';
update storage.buckets set file_size_limit=10485760, allowed_mime_types=array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] where id='documents';
notify pgrst, 'reload schema';
commit;
