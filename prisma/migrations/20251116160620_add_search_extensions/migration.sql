-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for full-text search on entry title and content
CREATE INDEX IF NOT EXISTS entries_title_trgm_idx ON entries USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS entries_content_trgm_idx ON entries USING gin (content gin_trgm_ops);

-- Create composite index for combined title and content search
CREATE INDEX IF NOT EXISTS entries_search_idx ON entries USING gin (to_tsvector('english', title || ' ' || content));