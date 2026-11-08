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
