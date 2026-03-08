
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_name TEXT,
  total_amount NUMERIC,
  currency TEXT DEFAULT 'EUR',
  receipt_date DATE,
  image_url TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_receipts_select" ON public.receipts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_receipts_insert" ON public.receipts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_receipts_update" ON public.receipts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_receipts_delete" ON public.receipts FOR DELETE TO authenticated USING (auth.uid() = user_id);
