ALTER TABLE public.research
  ADD COLUMN IF NOT EXISTS game text,
  ADD COLUMN IF NOT EXISTS document_size_bytes bigint;

ALTER TABLE public.research
  ADD CONSTRAINT research_document_size_bytes_nonnegative
  CHECK (document_size_bytes IS NULL OR document_size_bytes >= 0);