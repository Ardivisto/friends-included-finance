-- Apply in the Supabase SQL Editor. Keep the service-role key server-side.
create extension if not exists pgcrypto;

create table if not exists employees (
  id text primary key check (id in ('svetlana','richard','anastasia','jean_claude','kevin')),
  display_name text not null,
  telegram_user_id bigint unique,
  telegram_chat_id bigint,
  linked_at timestamptz
);
insert into employees (id, display_name) values
  ('svetlana','Svetlana de Monte Carlo'), ('richard','Richard Darling'),
  ('anastasia','Anastasia Ferrari'), ('jean_claude','Jean-Claude Bērziņš'),
  ('kevin','Kevin von Whatever')
on conflict (id) do update set display_name = excluded.display_name;

create table if not exists transaction_refs (
  reference text primary key,
  kind text not null check (kind in ('sale','expense'))
);

create table if not exists sales (
  reference text primary key check (reference ~ '^[A-Z][A-Z0-9-]{1,31}$'),
  submitted_at timestamptz not null default now(),
  origin text not null check (origin in ('telegram','website')),
  origin_chat_id bigint,
  salesperson text not null references employees(id),
  customer text not null check (length(btrim(customer)) > 0),
  project text not null check (project in ('A','B')),
  description text not null check (length(btrim(description)) > 0),
  amount_cents bigint not null check (amount_cents > 0),
  proposed_split integer[] not null check (array_length(proposed_split,1)=3 and proposed_split[1]+proposed_split[2]+proposed_split[3]=100 and proposed_split[1] between 0 and 100 and proposed_split[2] between 0 and 100 and proposed_split[3] between 0 and 100),
  final_split integer[] check (final_split is null or (array_length(final_split,1)=3 and final_split[1]+final_split[2]+final_split[3]=100 and final_split[1] between 0 and 100 and final_split[2] between 0 and 100 and final_split[3] between 0 and 100)),
  status text not null default 'pending' check (status in ('pending','approved')),
  decided_at timestamptz,
  decided_by text references employees(id),
  check ((status='pending' and final_split is null and decided_at is null) or (status='approved' and final_split is not null and decided_at is not null and decided_by='svetlana'))
);
create table if not exists expenses (
  reference text primary key check (reference ~ '^[A-Z][A-Z0-9-]{1,31}$'),
  submitted_at timestamptz not null default now(),
  origin text not null check (origin in ('telegram','website')),
  origin_chat_id bigint,
  reporter text not null references employees(id) check (reporter='kevin'),
  description text not null check (length(btrim(description)) > 0),
  amount_cents bigint not null check (amount_cents > 0),
  category text not null check (category in ('Materials','Travel','Other')),
  proposed_allocation text not null check (proposed_allocation in ('A','B','overhead')),
  final_allocation text check (final_allocation in ('A','B','overhead')),
  status text not null check (status in ('awaiting','allocated')),
  decided_at timestamptz,
  decided_by text references employees(id),
  check ((status='awaiting' and final_allocation is null and decided_at is null) or (status='allocated' and final_allocation is not null))
);
create table if not exists deliveries (
  id bigserial primary key,
  kind text not null check (kind in ('sheet','telegram')),
  entity_type text not null check (entity_type in ('sale','expense')),
  reference text not null,
  event text not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','no_recipient')),
  attempt_count integer not null default 0,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  delivered_at timestamptz,
  recipient_chat_id bigint,
  payload text,
  created_at timestamptz not null default now(),
  unique(kind,entity_type,reference,event)
);
create index if not exists deliveries_ready on deliveries(status,next_attempt_at) where status in ('pending','failed','sending');

create or replace function queue_delivery(p_kind text, p_type text, p_ref text, p_event text, p_chat bigint default null, p_payload text default null)
returns void language sql as $$
  insert into deliveries(kind,entity_type,reference,event,recipient_chat_id,payload)
  values (p_kind,p_type,p_ref,p_event,p_chat,p_payload)
  on conflict(kind,entity_type,reference,event) do update
  set status='pending',next_attempt_at=now(),last_error=null,delivered_at=null,
      recipient_chat_id=coalesce(excluded.recipient_chat_id,deliveries.recipient_chat_id),
      payload=coalesce(excluded.payload,deliveries.payload);
$$;

create or replace function submit_sale(p_record jsonb) returns sales language plpgsql security definer set search_path=public as $$
declare v sales;
begin
  if p_record->>'salesperson' not in ('richard','anastasia','jean_claude') then raise exception 'Only salespeople can submit sales' using errcode='42501'; end if;
  insert into transaction_refs(reference,kind) values (p_record->>'reference','sale');
  insert into sales(reference,origin,origin_chat_id,salesperson,customer,project,description,amount_cents,proposed_split)
  values (p_record->>'reference',p_record->>'origin',(p_record->>'origin_chat_id')::bigint,p_record->>'salesperson',p_record->>'customer',p_record->>'project',p_record->>'description',(p_record->>'amount_cents')::bigint,array(select jsonb_array_elements_text(p_record->'proposed_split')::integer)) returning * into v;
  perform queue_delivery('sheet','sale',v.reference,'current');
  return v;
end $$;

create or replace function submit_expense(p_record jsonb) returns expenses language plpgsql security definer set search_path=public as $$
declare v expenses;
begin
  if p_record->>'reporter' <> 'kevin' then raise exception 'Only Kevin can submit expenses' using errcode='42501'; end if;
  insert into transaction_refs(reference,kind) values (p_record->>'reference','expense');
  insert into expenses(reference,origin,origin_chat_id,reporter,description,amount_cents,category,proposed_allocation,final_allocation,status)
  values (p_record->>'reference',p_record->>'origin',(p_record->>'origin_chat_id')::bigint,p_record->>'reporter',p_record->>'description',(p_record->>'amount_cents')::bigint,p_record->>'category',p_record->>'proposed_allocation',case when p_record->>'proposed_allocation'='overhead' then 'overhead' else null end,case when p_record->>'proposed_allocation'='overhead' then 'allocated' else 'awaiting' end) returning * into v;
  perform queue_delivery('sheet','expense',v.reference,'current');
  return v;
end $$;

create or replace function decide_sale(p_actor text,p_reference text,p_split integer[]) returns sales language plpgsql security definer set search_path=public as $$
declare v sales;
begin
  if p_actor <> 'svetlana' then raise exception 'Only Svetlana can approve sales' using errcode='42501'; end if;
  select * into v from sales where reference=p_reference for update;
  if not found then raise exception 'Sale not found' using errcode='P0002'; end if;
  if v.status='approved' then return v; end if;
  if array_length(p_split,1)<>3 or p_split[1]+p_split[2]+p_split[3]<>100 or p_split[1] not between 0 and 100 or p_split[2] not between 0 and 100 or p_split[3] not between 0 and 100 then raise exception 'Commission percentages must total 100' using errcode='22023'; end if;
  update sales set final_split=p_split,status='approved',decided_at=now(),decided_by=p_actor where reference=p_reference returning * into v;
  perform queue_delivery('sheet','sale',v.reference,'current');
  return v;
end $$;

create or replace function decide_expense(p_actor text,p_reference text,p_allocation text) returns expenses language plpgsql security definer set search_path=public as $$
declare v expenses;
begin
  if p_actor <> 'svetlana' then raise exception 'Only Svetlana can allocate expenses' using errcode='42501'; end if;
  select * into v from expenses where reference=p_reference for update;
  if not found then raise exception 'Expense not found' using errcode='P0002'; end if;
  if v.status='allocated' then return v; end if;
  if p_allocation not in ('A','B','overhead') then raise exception 'Invalid allocation' using errcode='22023'; end if;
  update expenses set final_allocation=p_allocation,status='allocated',decided_at=now(),decided_by=p_actor where reference=p_reference returning * into v;
  perform queue_delivery('sheet','expense',v.reference,'current');
  return v;
end $$;

create or replace function claim_delivery(p_id bigint) returns deliveries language plpgsql security definer set search_path=public as $$
declare v deliveries;
begin
  update deliveries set status='sending',attempt_count=attempt_count+1,locked_until=now()+interval '2 minutes'
  where id=p_id and (status in ('pending','failed') or (status='sending' and locked_until<now())) and next_attempt_at<=now()
  returning * into v;
  return v;
end $$;

create or replace function link_telegram(p_employee text,p_user_id bigint,p_chat_id bigint) returns employees language plpgsql security definer set search_path=public as $$
declare v employees;
begin
  if p_employee not in ('svetlana','richard','anastasia','jean_claude','kevin') then raise exception 'Invalid employee' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(718123);
  update employees set telegram_user_id=null,telegram_chat_id=null,linked_at=null where telegram_user_id=p_user_id and id<>p_employee;
  update employees set telegram_user_id=p_user_id,telegram_chat_id=p_chat_id,linked_at=now() where id=p_employee returning * into v;
  return v;
end $$;

alter table employees enable row level security;
alter table transaction_refs enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;
alter table deliveries enable row level security;
-- No client policies: the server uses the service role and enforces demonstration roles.
revoke execute on function queue_delivery(text,text,text,text,bigint,text) from public,anon,authenticated;
revoke execute on function submit_sale(jsonb) from public,anon,authenticated;
revoke execute on function submit_expense(jsonb) from public,anon,authenticated;
revoke execute on function decide_sale(text,text,integer[]) from public,anon,authenticated;
revoke execute on function decide_expense(text,text,text) from public,anon,authenticated;
revoke execute on function claim_delivery(bigint) from public,anon,authenticated;
revoke execute on function link_telegram(text,bigint,bigint) from public,anon,authenticated;
grant execute on function queue_delivery(text,text,text,text,bigint,text) to service_role;
grant execute on function submit_sale(jsonb) to service_role;
grant execute on function submit_expense(jsonb) to service_role;
grant execute on function decide_sale(text,text,integer[]) to service_role;
grant execute on function decide_expense(text,text,text) to service_role;
grant execute on function claim_delivery(bigint) to service_role;
grant execute on function link_telegram(text,bigint,bigint) to service_role;
