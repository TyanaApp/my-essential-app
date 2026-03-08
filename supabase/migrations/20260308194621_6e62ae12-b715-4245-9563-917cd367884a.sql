ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS app_version text;