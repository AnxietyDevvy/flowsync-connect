CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO anon, authenticated;
GRANT ALL ON public.suppliers TO service_role;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers open" ON public.suppliers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;