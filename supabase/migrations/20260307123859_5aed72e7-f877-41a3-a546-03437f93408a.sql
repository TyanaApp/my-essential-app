CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_display_name TEXT;
BEGIN
  -- Extract and validate display name from OAuth or email signup metadata
  safe_display_name := COALESCE(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(new.email, '@', 1)
  );
  
  -- Sanitize: trim whitespace and limit length to 100 characters
  safe_display_name := LEFT(TRIM(safe_display_name), 100);
  
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, safe_display_name);
  
  RETURN new;
END;
$function$;