-- 1) Purge any stored passwords and prevent re-adding
DELETE FROM public.app_settings
WHERE key IN ('office_password','admin_password','dev_password');

ALTER TABLE public.app_settings
  ADD CONSTRAINT app_settings_no_password_keys
  CHECK (key NOT IN ('office_password','admin_password','dev_password'));

-- 2) Lock down app_settings: no anon access, authenticated only
DROP POLICY IF EXISTS "app_settings open" ON public.app_settings;

REVOKE ALL ON public.app_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

CREATE POLICY "app_settings_authenticated_all"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3) Lock down suppliers: no anon access, authenticated only
DROP POLICY IF EXISTS "suppliers open" ON public.suppliers;

REVOKE ALL ON public.suppliers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;

CREATE POLICY "suppliers_authenticated_all"
  ON public.suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
