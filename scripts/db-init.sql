-- Database schema iniziale per RFP AI Co-Pilot

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- organizations
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- users (profilo applicativo, collegato a Supabase Auth)
create table if not exists users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- memberships
create table if not exists memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'reviewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (user_id, organization_id)
);

-- activity_logs
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_org on activity_logs(organization_id, created_at desc);

-- documents
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  uploader_id uuid not null references users(id) on delete cascade,
  title text,
  file_path text not null,
  document_type text not null,
  status text not null,
  language text,
  pages_count int,
  raw_text text,
  metadata jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_documents_org on documents(organization_id, created_at desc);

-- document_chunks
create table if not exists document_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768),
  section_title text,
  page_start int,
  page_end int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_chunks_doc on document_chunks(document_id, chunk_index);
create index if not exists idx_document_chunks_org on document_chunks(organization_id);
create index if not exists document_chunks_embedding_idx on document_chunks using ivfflat (embedding vector_l2_ops);

-- tenders
create table if not exists tenders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  creator_id uuid not null references users(id) on delete cascade,
  title text not null,
  tender_code text,
  status text not null,
  tender_document_id uuid references documents(id) on delete set null,
  submission_deadline timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_tenders_org on tenders(organization_id, created_at desc);

-- tender_criteria
create table if not exists tender_criteria (
  id uuid primary key default uuid_generate_v4(),
  tender_id uuid not null references tenders(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  parent_id uuid references tender_criteria(id) on delete set null,
  code text,
  title text not null,
  description text,
  max_score numeric,
  weight numeric,
  constraints jsonb,
  required_documents jsonb,
  keywords text[],
  analysis_notes text,
  needs_review boolean default true,
  order_index int,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_tender_criteria_tender on tender_criteria(tender_id, order_index);
create index if not exists idx_tender_criteria_org on tender_criteria(organization_id);

-- generated_sections
create table if not exists generated_sections (
  id uuid primary key default uuid_generate_v4(),
  tender_id uuid not null references tenders(id) on delete cascade,
  tender_criterion_id uuid not null references tender_criteria(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  version int not null,
  status text not null,
  generated_text text not null,
  notes text,
  quality_score numeric,
  weakness_flags jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_generated_sections_crit on generated_sections(tender_criterion_id, version desc);
create index if not exists idx_generated_sections_org on generated_sections(organization_id);

-- source_references
create table if not exists source_references (
  id uuid primary key default uuid_generate_v4(),
  generated_section_id uuid not null references generated_sections(id) on delete cascade,
  document_chunk_id uuid not null references document_chunks(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  relevance_score numeric,
  usage_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_source_references_section on source_references(generated_section_id);
create index if not exists idx_source_references_org on source_references(organization_id);



