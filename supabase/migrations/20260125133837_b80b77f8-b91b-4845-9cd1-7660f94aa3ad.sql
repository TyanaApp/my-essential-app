-- Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_display_name TEXT;
BEGIN
  -- Extract and validate display name from OAuth metadata
  safe_display_name := COALESCE(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'display_name'
  );
  
  -- Sanitize: trim whitespace and limit length to 100 characters
  safe_display_name := LEFT(TRIM(safe_display_name), 100);
  
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, safe_display_name);
  
  RETURN new;
END;
$$;

-- Add constraint on profiles.display_name column for additional safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'display_name_length' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT display_name_length CHECK (LENGTH(display_name) <= 100);
  END IF;
END $$;