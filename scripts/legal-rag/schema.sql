-- ============================================================================
-- Legal case RAG — Supabase schema
-- Run this ONCE, in the Supabase dashboard -> SQL Editor -> New query -> Run.
--
-- Design in one line: ONE project, ONE bucket, ONE vector table.
-- Cases are separated by a `case_id` column + Row Level Security, NOT by
-- creating a new bucket/table/project per case.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- A matter/case. One row per case the firm is working.
create table if not exists public.cases (
  id             uuid primary key default gen_random_uuid(),
  matter_number  text        not null unique,   -- e.g. "2026-0142"
  client_name    text        not null,
  caption        text,                          -- "Doe v. Acme Corp."
  jurisdiction   text,
  status         text        not null default 'open',
  opened_at      date        not null default current_date,
  created_at     timestamptz not null default now()
);

-- Who is allowed to see which case. This is the ethical wall.
create table if not exists public.case_members (
  case_id  uuid not null references public.cases (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  role     text not null default 'attorney',    -- attorney | paralegal | reviewer
  added_at timestamptz not null default now(),
  primary key (case_id, user_id)
);

-- One row per uploaded file. The file itself lives in Storage.
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases (id) on delete cascade,
  storage_path text not null unique,            -- "<case_id>/discovery/depo-smith.pdf"
  filename     text not null,
  doc_type     text,                            -- pleading | discovery | correspondence | transcript | exhibit
  doc_date     date,
  bates_start  text,
  bates_end    text,
  page_count   integer,
  privileged   boolean not null default false,
  sha256       text,                            -- dedupe + chain of custody
  uploaded_by  uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

create index if not exists documents_case_id_idx on public.documents (case_id);

-- The vector table. One row per ~1000-token slice of a document.
-- 1024 dimensions = voyage-law-2. If you use OpenAI text-embedding-3-small,
-- change every 1024 below to 1536.
create table if not exists public.chunks (
  id           bigint generated always as identity primary key,
  case_id      uuid   not null references public.cases (id) on delete cascade,
  document_id  uuid   not null references public.documents (id) on delete cascade,
  chunk_index  integer not null,
  page_number  integer,
  content      text   not null,
  embedding    extensions.vector(1024),
  created_at   timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists chunks_case_id_idx on public.chunks (case_id);

-- Semantic index. HNSW + cosine distance.
create index if not exists chunks_embedding_idx
  on public.chunks using hnsw (embedding extensions.vector_cosine_ops);

-- Keyword index, so exact terms ("Bates 004512", "indemnification") still hit.
alter table public.chunks
  add column if not exists fts tsvector
  generated always as (to_tsvector('english', content)) stored;

create index if not exists chunks_fts_idx on public.chunks using gin (fts);

-- ---------------------------------------------------------------------------
-- 3. Access helper
--    SECURITY DEFINER so the policies below can read case_members without
--    triggering their own RLS check (which would recurse).
-- ---------------------------------------------------------------------------
create or replace function public.is_case_member(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.case_members m
    where m.case_id = p_case_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_case_member(uuid) from public;
grant execute on function public.is_case_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    Default deny. A signed-in user sees a case only if they are on its
--    case_members list. The service_role key bypasses all of this — that key
--    belongs on your server only, never in a browser or a chat client.
-- ---------------------------------------------------------------------------
alter table public.cases        enable row level security;
alter table public.case_members enable row level security;
alter table public.documents    enable row level security;
alter table public.chunks       enable row level security;

drop policy if exists "members read cases" on public.cases;
create policy "members read cases" on public.cases
  for select to authenticated
  using (public.is_case_member(id));

drop policy if exists "members read own membership" on public.case_members;
create policy "members read own membership" on public.case_members
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "members read documents" on public.documents;
create policy "members read documents" on public.documents
  for select to authenticated
  using (public.is_case_member(case_id));

drop policy if exists "members read chunks" on public.chunks;
create policy "members read chunks" on public.chunks
  for select to authenticated
  using (public.is_case_member(case_id));

-- ---------------------------------------------------------------------------
-- 5. Storage: ONE private bucket, one folder per case.
--    Path convention: <case_id>/<anything>/<filename>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;

drop policy if exists "members read case files" on storage.objects;
create policy "members read case files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'case-files'
    and public.is_case_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "members write case files" on storage.objects;
create policy "members write case files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'case-files'
    and public.is_case_member(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- 6. The search function Claude will call.
--    Hybrid: cosine similarity + keyword match, fused by Reciprocal Rank
--    Fusion so an exact term like a Bates number is never lost.
--    SECURITY INVOKER => the caller's RLS still applies. Belt and braces:
--    the case filter is also in the WHERE clause.
-- ---------------------------------------------------------------------------
create or replace function public.match_case_chunks(
  p_case_id         uuid,
  p_query_embedding extensions.vector(1024),
  p_query_text      text    default '',
  p_match_count     integer default 12
)
returns table (
  chunk_id    bigint,
  document_id uuid,
  filename    text,
  doc_type    text,
  bates_start text,
  page_number integer,
  content     text,
  similarity  double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with limited as (
    select least(greatest(p_match_count, 1), 50) as n
  ),
  semantic as (
    select c.id,
           row_number() over (order by c.embedding <=> p_query_embedding) as rank,
           1 - (c.embedding <=> p_query_embedding) as similarity
    from public.chunks c, limited
    where c.case_id = p_case_id
      and c.embedding is not null
    order by c.embedding <=> p_query_embedding
    limit (select n * 3 from limited)
  ),
  keyword as (
    select c.id,
           row_number() over (
             order by ts_rank_cd(c.fts, websearch_to_tsquery('english', p_query_text)) desc
           ) as rank
    from public.chunks c, limited
    where c.case_id = p_case_id
      and p_query_text <> ''
      and c.fts @@ websearch_to_tsquery('english', p_query_text)
    order by rank
    limit (select n * 3 from limited)
  ),
  fused as (
    select coalesce(s.id, k.id) as id,
           coalesce(1.0 / (60 + s.rank), 0.0)
             + coalesce(1.0 / (60 + k.rank), 0.0) as score,
           s.similarity
    from semantic s
    full outer join keyword k on k.id = s.id
  )
  select c.id,
         c.document_id,
         d.filename,
         d.doc_type,
         d.bates_start,
         c.page_number,
         c.content,
         coalesce(f.similarity, 0.0)
  from fused f
  join public.chunks c    on c.id = f.id
  join public.documents d on d.id = c.document_id
  where c.case_id = p_case_id
  order by f.score desc
  limit (select n from limited);
$$;

grant execute on function public.match_case_chunks(uuid, extensions.vector, text, integer)
  to authenticated, service_role;
