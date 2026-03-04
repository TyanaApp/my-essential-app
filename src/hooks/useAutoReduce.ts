import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const REDUCE_RATES: Record<string, number> = {
  fast: 0.20,
  normal: 0.10,
  slow: 0.05,
};

export const useAutoReduce = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const key = `auto_reduce_last_${user.id}`;
    const today = new Date().toDateString();
    const lastRun = localStorage.getItem(key);
    if (lastRun === today) return;

    const run = async () => {
      const { data: items } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_opened', true) as any;

      if (!items || items.length === 0) {
        localStorage.setItem(key, today);
        return;
      }

      for (const item of items) {
        if (item.tracking_mode === 'date_only') continue;
        const rate = REDUCE_RATES[item.consumption_rate || 'normal'] || 0.10;
        const newQty = Math.max(0, (item.quantity || 1) * (1 - rate));
        const rounded = Math.round(newQty * 100) / 100;

        await supabase
          .from('inventory_items')
          .update({ quantity: rounded } as any)
          .eq('id', item.id);
      }

      localStorage.setItem(key, today);
    };

    run();
  }, [user]);
};
