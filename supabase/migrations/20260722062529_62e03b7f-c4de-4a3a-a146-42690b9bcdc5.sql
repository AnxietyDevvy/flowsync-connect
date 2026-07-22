
-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','completed')),
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders open" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Supplies
CREATE TABLE public.supplies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stock text NOT NULL DEFAULT '',
  reorder text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','low','reorder')),
  noticed_by_office boolean NOT NULL DEFAULT false,
  noticed_by text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplies TO anon, authenticated;
GRANT ALL ON public.supplies TO service_role;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplies open" ON public.supplies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Products catalog
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products open" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed 28 products
INSERT INTO public.products (name, category, is_custom) VALUES
('ICW1 Level III +++ ULTRA LIGHT', 'ICW / SA Plates', false),
('ICW2 Level III ++ SUPA LIGHT', 'ICW / SA Plates', false),
('ICW3 Level III S A Mix', 'ICW / SA Plates', false),
('ICW4 Level III S A Mix Ladies Front', 'ICW / SA Plates', false),
('ICW5 Level IV', 'ICW / SA Plates', false),
('ICW6 Level IV', 'ICW / SA Plates', false),
('SA1 Level III ++ ULTRA LIGHT- SA', 'ICW / SA Plates', false),
('SA2 Level III +++ SUPA LIGHT- SA', 'ICW / SA Plates', false),
('SA3 Level III +++ ULTRA STEEL- SA', 'ICW / SA Plates', false),
('SA4 Level III S A Mix- SA', 'ICW / SA Plates', false),
('SA5 Level IV- SA', 'ICW / SA Plates', false),
('SA6 Level III ++ ULTRA LIGHT- SA (side plate)', 'ICW / SA Plates', false),
('SA7 Level III +++ ULTRA LIGHT- SA (side plate)', 'ICW / SA Plates', false),
('SA8 Level IV- SA (side plate)', 'ICW / SA Plates', false),
('SA9 Level III +++ ULTRA STEEL- SA (Large)', 'ICW / SA Plates', false),
('ARAMID B4 (ARAB4)', 'Vehicle Armor', false),
('UHMWPE Level B4 (UHMWPE5)', 'Vehicle Armor', false),
('UHMWPE Level B6 (UHMWPE15)', 'Vehicle Armor', false),
('UHMWPE Level B6 (UHMWPE18)', 'Vehicle Armor', false),
('Vikashield Glass Reinforced Matrix', 'Vehicle Armor', false),
('STANAG Level 2', 'Military Vehicle Armor', false),
('STANAG Level 3(-)', 'Military Vehicle Armor', false),
('STANAG Level 3 Full', 'Military Vehicle Armor', false),
('STANAG Level 4', 'Military Vehicle Armor', false),
('Vikashield', 'Military Vehicle Armor', false),
('Aramid', 'Military Vehicle Armor', false),
('UHMWPE', 'Military Vehicle Armor', false),
('Level IIIA Shield', 'Ballistic Shield', false);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
