CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings open" ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.app_settings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.app_settings_touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;

INSERT INTO public.app_settings (key, value) VALUES
  ('office_password', to_jsonb('bpt-office'::text)),
  ('admin_password', to_jsonb('bpt-admin'::text)),
  ('dev_password', to_jsonb('bpt-dev'::text)),
  ('feature_manufacturing', to_jsonb(true)),
  ('feature_suppliers', to_jsonb(true)),
  ('feature_send_to_manufacturing', to_jsonb(true))
ON CONFLICT (key) DO NOTHING;