-- Every row belongs to exactly one anonymous visitor's workspace.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.friends (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  preferred_name text not null check (char_length(preferred_name) between 1 and 60),
  nickname text, pronouns text, how_we_met text not null default 'other',
  university text not null default 'UNSW', campus text, degree_program text, year_of_study text,
  closeness smallint not null default 1 check (closeness between 1 and 5),
  crush text not null default 'none' check (crush in ('none','friends','crush','dating','past')),
  my_intent text not null default 'friend' check (my_intent in ('friend','date','unclear')),
  private_note text, last_contacted_at timestamptz, last_seen_in_person_at timestamptz,
  interests text[] not null default '{}', societies text[] not null default '{}',
  contact_points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index friends_workspace_closeness_idx on public.friends (workspace_id, closeness desc, preferred_name);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  happened_at timestamptz not null, channel text not null, hangout_type text, title text not null,
  notes text, location text, vibe smallint check (vibe between 1 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);
create index events_workspace_happened_idx on public.events (workspace_id, happened_at desc);

create table public.event_attendees (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid not null, friend_id uuid not null,
  primary key (event_id, friend_id),
  foreign key (workspace_id, event_id) references public.events(workspace_id, id) on delete cascade,
  foreign key (workspace_id, friend_id) references public.friends(workspace_id, id) on delete cascade
);
create index event_attendees_workspace_friend_idx on public.event_attendees (workspace_id, friend_id);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  friend_id uuid not null, title text not null, detail text not null, template text not null,
  status text not null default 'pending' check (status in ('pending','saved','dismissed','went')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (workspace_id, friend_id) references public.friends(workspace_id, id) on delete cascade
);
create index suggestions_workspace_status_idx on public.suggestions (workspace_id, status, created_at desc);

alter table public.workspaces enable row level security;
alter table public.friends enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.suggestions enable row level security;

create policy "owners manage their workspace" on public.workspaces for all to authenticated
  using ((select auth.uid()) = owner_user_id) with check ((select auth.uid()) = owner_user_id);
create policy "owners manage friends" on public.friends for all to authenticated
  using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy "owners manage events" on public.events for all to authenticated
  using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy "owners manage event attendees" on public.event_attendees for all to authenticated
  using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy "owners manage suggestions" on public.suggestions for all to authenticated
  using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));

-- The trigger is never directly callable.  It only clones a fixed, non-sensitive demo set.
create or replace function public.seed_demo_workspace()
returns trigger language plpgsql security definer set search_path = '' as $$
declare maya uuid; zara uuid; ari uuid; lachie uuid;
begin
  insert into public.friends (workspace_id, preferred_name, nickname, pronouns, how_we_met, university, campus, degree_program, year_of_study, closeness, crush, my_intent, last_contacted_at, last_seen_in_person_at, interests, societies, contact_points)
  values
  (new.id,'Maya','May','she/her','tutorial','UNSW','Kensington','Computer Science','2',5,'none','friend',now()-interval '25 days',now()-interval '25 days',array['matcha','indie gigs'],array['CSESoc','DevSoc'],'[{"kind":"instagram","value":"maya_irl","label":"@maya_irl"}]'),
  (new.id,'Zara','Z','she/they','society','UNSW','Kensington','Media Arts','2',3,'crush','date',now()-interval '49 days',now()-interval '51 days',array['film','thrifting'],array['Arc','UNSW Film Society'],'[{"kind":"instagram","value":"zara_irl","label":"@zara_irl"}]'),
  (new.id,'Ari',null,'they/them','party','UNSW','Kensington','Mechanical Engineering','4',4,'none','friend',now()-interval '30 days',now()-interval '33 days',array['bouldering','house music'],array['EngSoc'],'[]'),
  (new.id,'Lachie',null,'he/him','college','UNSW','Kensington','Commerce / Information Systems','3',4,'none','friend',now()-interval '7 days',now()-interval '12 days',array['footy','pub trivia'],array['Unibros','CSESoc'],'[]');
  select id into maya from public.friends where workspace_id = new.id and preferred_name = 'Maya';
  select id into zara from public.friends where workspace_id = new.id and preferred_name = 'Zara';
  select id into ari from public.friends where workspace_id = new.id and preferred_name = 'Ari';
  select id into lachie from public.friends where workspace_id = new.id and preferred_name = 'Lachie';
  insert into public.events (workspace_id,happened_at,channel,hangout_type,title,location,vibe) values
  (new.id,now()-interval '3 days','in_person','drinks','Golden Sheaf pre-drinks','Double Bay',5),
  (new.id,now()-interval '16 days','in_person','beach','Coogee almost-summer day','Coogee Beach',5);
  insert into public.event_attendees (workspace_id,event_id,friend_id)
  select new.id,e.id,f.id from public.events e join public.friends f on f.workspace_id=new.id
  where e.workspace_id=new.id and ((e.title='Golden Sheaf pre-drinks' and f.id in (maya, lachie, ari)) or (e.title='Coogee almost-summer day' and f.id in (ari,zara)));
  insert into public.suggestions (workspace_id,friend_id,title,detail,template) values
  (new.id,zara,'Zara + Newtown gig 🍻','Find a tiny Newtown gig and call it a proper plan. You both have film in the orbit.','Newtown gig'),
  (new.id,ari,'Ari + beach day 🍻','Lock in a beach day before everyone disappears into assignments. You both have bouldering in the orbit.','beach day');
  return new;
end; $$;
revoke execute on function public.seed_demo_workspace() from public, anon, authenticated;
create trigger seed_demo_workspace_after_insert after insert on public.workspaces for each row execute function public.seed_demo_workspace();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.workspaces, public.friends, public.events, public.event_attendees, public.suggestions to authenticated;
