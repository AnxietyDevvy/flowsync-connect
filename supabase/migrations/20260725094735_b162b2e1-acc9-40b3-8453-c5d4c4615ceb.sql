CREATE TABLE public.manufacturing_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supply_id uuid,
  supply_name text NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  requested_by text NOT NULL DEFAULT '',
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_by text NOT NULL DEFAULT '',
  started_at timestamptz,
  completed_by text NOT NULL DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturing_requests TO anon, authenticated;
GRANT ALL ON public.manufacturing_requests TO service_role;

ALTER TABLE public.manufacturing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manufacturing_requests open" ON public.manufacturing_requests
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.manufacturing_requests;