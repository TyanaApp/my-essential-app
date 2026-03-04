
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS consumption_rate text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_opened boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone DEFAULT null,
  ADD COLUMN IF NOT EXISTS tracking_mode text DEFAULT 'tracked';
