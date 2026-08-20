create table public.integrations (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.integrations is
  'Read-only catalog of integration identifiers used by saved BuildBrief records.';

create table public.briefs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  client_request_id uuid not null,
  prompt text not null,
  output text not null,
  created_at timestamptz not null default now(),
  constraint briefs_prompt_length_check
    check (char_length(btrim(prompt)) between 10 and 2000),
  constraint briefs_output_length_check
    check (char_length(btrim(output)) between 1 and 12000),
  constraint briefs_user_request_unique
    unique (user_id, client_request_id)
);

comment on table public.briefs is
  'Completed AI-generated build briefs owned by authenticated users.';

create index briefs_user_id_created_at_idx
  on public.briefs (user_id, created_at desc);

create table public.brief_integrations (
  brief_id bigint not null
    references public.briefs (id) on delete cascade,
  integration_id text not null
    references public.integrations (id),
  primary key (brief_id, integration_id)
);

comment on table public.brief_integrations is
  'Many-to-many relationship between saved briefs and integration context.';

create index brief_integrations_integration_id_idx
  on public.brief_integrations (integration_id);

insert into public.integrations (id, name)
values
  ('stripe', 'Stripe'),
  ('shopify', 'Shopify'),
  ('gmail', 'Gmail'),
  ('slack', 'Slack'),
  ('google-sheets', 'Google Sheets');

alter table public.integrations enable row level security;
alter table public.briefs enable row level security;
alter table public.brief_integrations enable row level security;

revoke all on table public.integrations from public, anon, authenticated;
revoke all on table public.briefs from public, anon, authenticated;
revoke all on table public.brief_integrations from public, anon, authenticated;
revoke all on sequence public.briefs_id_seq from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on table public.integrations to authenticated;
grant select, insert, delete on table public.briefs to authenticated;
grant select, insert on table public.brief_integrations to authenticated;
grant usage, select on sequence public.briefs_id_seq to authenticated;

create policy "Authenticated users can read the integration catalog"
  on public.integrations
  for select
  to authenticated
  using (true);

create policy "Users can read their own briefs"
  on public.briefs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own briefs"
  on public.briefs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own briefs"
  on public.briefs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read integrations for their own briefs"
  on public.brief_integrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.briefs
      where briefs.id = brief_integrations.brief_id
        and briefs.user_id = (select auth.uid())
    )
  );

create policy "Users can attach integrations to their own briefs"
  on public.brief_integrations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.briefs
      where briefs.id = brief_integrations.brief_id
        and briefs.user_id = (select auth.uid())
    )
  );

create function public.save_brief(
  p_client_request_id uuid,
  p_prompt text,
  p_output text,
  p_integration_ids text[] default '{}'::text[]
)
returns table (id bigint, created_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_user_id uuid := auth.uid();
  saved_brief_id bigint;
  saved_created_at timestamptz;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_integration_ids, '{}'::text[])) as requested(id)
    where not exists (
      select 1
      from public.integrations
      where integrations.id = requested.id
    )
  ) then
    raise exception 'One or more integration identifiers are invalid.'
      using errcode = '23514';
  end if;

  insert into public.briefs (
    user_id,
    client_request_id,
    prompt,
    output
  )
  values (
    request_user_id,
    p_client_request_id,
    p_prompt,
    p_output
  )
  on conflict (user_id, client_request_id) do nothing
  returning briefs.id, briefs.created_at
  into saved_brief_id, saved_created_at;

  if saved_brief_id is null then
    select briefs.id, briefs.created_at
    into saved_brief_id, saved_created_at
    from public.briefs
    where briefs.user_id = request_user_id
      and briefs.client_request_id = p_client_request_id;

    return query select saved_brief_id, saved_created_at;
    return;
  end if;

  insert into public.brief_integrations (brief_id, integration_id)
  select saved_brief_id, requested.integration_id
  from (
    select distinct ids.integration_id
    from unnest(coalesce(p_integration_ids, '{}'::text[])) as ids(integration_id)
  ) as requested;

  return query select saved_brief_id, saved_created_at;
end;
$$;

revoke all on function public.save_brief(uuid, text, text, text[])
  from public, anon;
grant execute on function public.save_brief(uuid, text, text, text[])
  to authenticated;
