import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFoundingCounter = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'total_registered_users')
        .maybeSingle();
      if (data) setCount(parseInt(data.value) || 0);
      setLoading(false);
    };
    fetch();
  }, []);

  return { count, loading, isFull: count >= 1000 };
};
