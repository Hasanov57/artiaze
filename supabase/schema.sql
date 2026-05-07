create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  topic text not null,
  field text not null,
  tags text[] not null default '{}',
  summary text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  views_count integer not null default 0,
  shares_count integer not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.article_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.increment_article_view(article_uuid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles
  set views_count = views_count + 1
  where id = article_uuid
    and status = 'published';
$$;

create or replace function public.increment_article_share(article_uuid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles
  set shares_count = shares_count + 1
  where id = article_uuid
    and status = 'published';
$$;

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.comments enable row level security;
alter table public.article_likes enable row level security;

drop policy if exists "Profiles are visible" on public.profiles;
create policy "Profiles are visible"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = 'student');

drop policy if exists "Published articles are visible" on public.articles;
create policy "Published articles are visible"
on public.articles for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Authors can view their own articles" on public.articles;
create policy "Authors can view their own articles"
on public.articles for select
to authenticated
using ((select auth.uid()) = author_id);

drop policy if exists "Admins can view all articles" on public.articles;
create policy "Admins can view all articles"
on public.articles for select
to authenticated
using (public.is_admin());

drop policy if exists "Students can submit pending articles" on public.articles;
create policy "Students can submit pending articles"
on public.articles for insert
to authenticated
with check ((select auth.uid()) = author_id and status = 'pending');

drop policy if exists "Authors can edit pending articles" on public.articles;
create policy "Authors can edit pending articles"
on public.articles for update
to authenticated
using ((select auth.uid()) = author_id and status = 'pending')
with check ((select auth.uid()) = author_id and status = 'pending');

drop policy if exists "Admins can review articles" on public.articles;
create policy "Admins can review articles"
on public.articles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Comments on published articles are visible" on public.comments;
create policy "Comments on published articles are visible"
on public.comments for select
to anon, authenticated
using (
  exists (
    select 1 from public.articles
    where articles.id = comments.article_id
      and articles.status = 'published'
  )
);

drop policy if exists "Users can comment on published articles" on public.comments;
create policy "Users can comment on published articles"
on public.comments for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.articles
    where articles.id = comments.article_id
      and articles.status = 'published'
  )
);

drop policy if exists "Likes are visible" on public.article_likes;
create policy "Likes are visible"
on public.article_likes for select
to anon, authenticated
using (true);

drop policy if exists "Users can like articles" on public.article_likes;
create policy "Users can like articles"
on public.article_likes for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their likes" on public.article_likes;
create policy "Users can remove their likes"
on public.article_likes for delete
to authenticated
using ((select auth.uid()) = user_id);
