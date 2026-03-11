
CREATE TABLE public.product_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_name text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'pcs',
  price_per_unit numeric NOT NULL,
  store_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_price_history_select" ON public.product_price_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_price_history_insert" ON public.product_price_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_price_history_delete" ON public.product_price_history FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_price_history_user_product ON public.product_price_history (user_id, product_name);
CREATE INDEX idx_price_history_created ON public.product_price_history (user_id, created_at DESC);
