-- Named staff roles. No identities or memberships are provisioned by this migration.
begin;
alter table public.staff_members drop constraint staff_members_role_check;
alter table public.staff_members add constraint staff_members_role_check check(role in ('super_admin','operator','catalog_editor','kol','order_operator','analyst'));
alter table public.staff_members add column kol_id uuid references public.kols(id);
alter table public.staff_members add column updated_at timestamptz not null default now();
alter table public.staff_members add constraint staff_kol_binding check ((role='kol' and kol_id is not null) or (role<>'kol' and kol_id is null));
create index staff_kol_idx on public.staff_members(kol_id) where kol_id is not null;
create table public.staff_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id), target_id uuid not null references auth.users(id),
 action text not null check(action in ('membership_created','membership_updated')),
 before_state jsonb, after_state jsonb not null, created_at timestamptz not null default now()
);
alter table public.staff_audit enable row level security;
revoke all on public.staff_audit from public,anon,authenticated;
grant select,insert on public.staff_audit to service_role;
grant usage,select on sequence public.staff_audit_id_seq to service_role;
create table public.staff_revoked_sessions (session_id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,revoked_at timestamptz not null default now());
alter table public.staff_revoked_sessions enable row level security;
revoke all on public.staff_revoked_sessions from public,anon,authenticated;
grant select,insert on public.staff_revoked_sessions to service_role;
create table public.staff_invitations (
 id uuid primary key, actor_id uuid not null references auth.users(id), email text not null check(char_length(email)<=254),
 role text not null check(role in ('super_admin','operator','catalog_editor','kol','order_operator','analyst')), kol_id uuid references public.kols(id),
 user_id uuid references auth.users(id), status text not null default 'pending' check(status in ('pending','membership_pending','ready','failed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.staff_invitations enable row level security;
revoke all on public.staff_invitations from public,anon,authenticated;
grant select,insert,update on public.staff_invitations to service_role;
-- Only non-secret session identifiers/expiry are made readable by the existing
-- trusted service role. No refresh token, MFA secret or identity data grant.
grant usage on schema auth to service_role;
grant select(id,user_id,not_after) on auth.sessions to service_role;
grant select(id,is_anonymous) on auth.users to service_role;
create function public.staff_session_active(p_user uuid,p_session uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from auth.sessions where id=p_session and user_id=p_user and (not_after is null or not_after>now())) and not exists(select 1 from public.staff_revoked_sessions where session_id=p_session);
$$;
revoke execute on function public.staff_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.staff_session_active(uuid,uuid) to service_role;

-- Preserve owner checks and super-only approval across the expanded role set.
create or replace function public.batch_require_staff(p_actor uuid,p_super boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare r text; k uuid;
begin
 select role,kol_id into r,k from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','operator','catalog_editor','kol') or (r='kol' and k is null) or (p_super and r<>'super_admin') then raise exception 'STAFF_FORBIDDEN'; end if;
 return r;
end;$$;

-- Serialized membership edits prevent last-admin races. Team management does not
-- create accounts or send invitations. The API separately verifies current aal2.
create function public.staff_set_member(p_actor uuid,p_target uuid,p_role text,p_active boolean,p_kol uuid default null) returns public.staff_members
language plpgsql security invoker set search_path='' as $$
declare actor public.staff_members; previous public.staff_members; result public.staff_members;
begin
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended('isuntvmall:staff-membership',0));
 select * into actor from public.staff_members where user_id=p_actor and active for share;
 if actor.role is distinct from 'super_admin' then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_target=p_actor then raise exception 'SELF_MEMBERSHIP_CHANGE_DENIED'; end if;
 if p_role is null or p_role not in ('super_admin','operator','catalog_editor','kol','order_operator','analyst') or p_active is null then raise exception 'INVALID_ROLE'; end if;
 if (p_role='kol') is distinct from (p_kol is not null) then raise exception 'KOL_BINDING_REQUIRED'; end if;
 if p_kol is not null and not exists(select 1 from public.kols where id=p_kol and status='active') then raise exception 'KOL_NOT_ACTIVE'; end if;
 if not exists(select 1 from auth.users where id=p_target and not coalesce(is_anonymous,false)) then raise exception 'NAMED_USER_REQUIRED'; end if;
 select * into previous from public.staff_members where user_id=p_target for update;
 if previous.role='super_admin' and previous.active and (not p_active or p_role<>'super_admin') and (select count(*) from public.staff_members where role='super_admin' and active)<=1 then raise exception 'LAST_SUPER_ADMIN'; end if;
 insert into public.staff_members(user_id,role,active,kol_id) values(p_target,p_role,p_active,p_kol)
 on conflict(user_id) do update set role=excluded.role,active=excluded.active,kol_id=excluded.kol_id,updated_at=now() returning * into result;
 insert into public.staff_audit(actor_id,target_id,action,before_state,after_state) values(p_actor,p_target,case when previous.user_id is null then 'membership_created' else 'membership_updated' end,
 case when previous.user_id is null then null else jsonb_build_object('role',previous.role,'active',previous.active,'kolId',previous.kol_id) end,
 jsonb_build_object('role',result.role,'active',result.active,'kolId',result.kol_id));
 return result;
end;$$;
revoke execute on function public.staff_set_member(uuid,uuid,text,boolean,uuid) from public,anon,authenticated;
grant execute on function public.staff_set_member(uuid,uuid,text,boolean,uuid) to service_role;
commit;
