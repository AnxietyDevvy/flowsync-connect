-- Restrict anon access on four tables; keep authenticated full access.
DROP POLICY IF EXISTS "orders open" ON public.orders;
DROP POLICY IF EXISTS "products open" ON public.products;
DROP POLICY IF EXISTS "supplies open" ON public.supplies;
DROP POLICY IF EXISTS "manufacturing_requests open" ON public.manufacturing_requests;

REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.supplies FROM anon;
REVOKE ALL ON public.manufacturing_requests FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturing_requests TO authenticated;

CREATE POLICY "orders_authenticated_all" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_authenticated_all" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "supplies_authenticated_all" ON public.supplies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "manufacturing_requests_authenticated_all" ON public.manufacturing_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);