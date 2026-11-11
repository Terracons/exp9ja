-- Run once after 1960_upgrade.sql. Supports Google accounts without pre-existing business metadata.
begin;
alter table profiles add column if not exists onboarding_complete boolean not null default true;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare google_user boolean := coalesce(new.raw_app_meta_data->>'provider','')='google';
  r text := new.raw_user_meta_data->>'role';
  business text := trim(coalesce(new.raw_user_meta_data->>'company',''));
  location text := trim(coalesce(new.raw_user_meta_data->>'country','Nigeria'));
  service text := new.raw_user_meta_data->>'provider_type';
  description text := coalesce(new.raw_user_meta_data->>'about','');
begin
  if google_user then
    business := left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),nullif(trim(new.raw_user_meta_data->>'name'),''),'New member'),120);
    insert into profiles(id,role,company,country,about,onboarding_complete) values(new.id,'buyer',business,'Not specified','',false);
    return new;
  end if;
  if r is null or r not in ('buyer','supplier','provider') then r := 'buyer'; end if;
  if length(business) not between 1 and 120 or length(location) not between 1 and 80 or length(description)>1000 then raise exception 'Provide a valid business name, country and description'; end if;
  if r='provider' and (service is null or service not in ('Freight forwarder','Haulage provider','Clearing agent','Inspection provider','Warehouse provider','Shipping line','Insurance provider','Laboratory')) then raise exception 'Choose a supported logistics service'; end if;
  insert into profiles(id,role,company,country,provider_type,about,onboarding_complete) values(new.id,r,business,location,case when r='provider' then service else null end,description,true);
  return new;
end $$;

create or replace function complete_my_onboarding(account_role text,business text,location text,description text,service text default null)
returns void language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into p from profiles where id=auth.uid() for update;
  if not found or p.onboarding_complete then raise exception 'This account has already been set up'; end if;
  if account_role is null or account_role not in ('buyer','supplier','provider') then raise exception 'Choose an account type'; end if;
  if business is null or location is null or length(trim(business)) not between 1 and 120 or length(trim(location)) not between 1 and 80 or length(coalesce(description,''))>1000 then raise exception 'Provide your business name and country'; end if;
  if account_role='provider' and (service is null or service not in ('Freight forwarder','Haulage provider','Clearing agent','Inspection provider','Warehouse provider','Shipping line','Insurance provider','Laboratory')) then raise exception 'Choose a supported logistics service'; end if;
  update profiles set role=account_role,company=trim(business),country=trim(location),about=trim(coalesce(description,'')),provider_type=case when account_role='provider' then service else null end,verified=false,onboarding_complete=true where id=auth.uid();
end $$;
revoke all on function complete_my_onboarding(text,text,text,text,text) from public;
grant execute on function complete_my_onboarding(text,text,text,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
