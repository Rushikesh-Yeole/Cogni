-- COGNI — Database Setup (Fully Idempotent — safe to re-run)
-- Identity anchor: email address

CREATE TABLE IF NOT EXISTS fingerprints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  ocean_vector jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_email ON fingerprints(email);

-- ═══ Row Level Security ═══
ALTER TABLE fingerprints ENABLE ROW LEVEL SECURITY;

-- Drop + recreate policies (idempotent)
DROP POLICY IF EXISTS "allow_anon_insert" ON fingerprints;
CREATE POLICY "allow_anon_insert" ON fingerprints FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_select" ON fingerprints;
CREATE POLICY "allow_anon_select" ON fingerprints FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "allow_anon_update" ON fingerprints;
CREATE POLICY "allow_anon_update" ON fingerprints FOR UPDATE TO anon USING (true) WITH CHECK (true);
