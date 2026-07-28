CREATE TABLE public.profiles (
  name_key text PRIMARY KEY,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT '',
  avatar_color text NOT NULL DEFAULT 'red',
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_authenticated_all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.app_settings_touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;