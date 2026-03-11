import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

interface PriceEntry {
  product_name: string;
  price: number;
  currency: string;
  quantity?: number;
  unit?: string;
  store_name?: string | null;
}

interface KnownPrice {
  latestPrice: number;
  averagePrice: number;
  currency: string;
  lastStore: string | null;
  purchaseCount: number;
  lastDate: string;
}

export const usePriceMemory = () => {
  const { user } = useAuth();

  const savePrice = useCallback(async (entry: PriceEntry) => {
    if (!user || !entry.price || entry.price <= 0) return;
    const qty = entry.quantity || 1;
    const pricePerUnit = entry.price / qty;

    await supabase.from('product_price_history' as any).insert({
      user_id: user.id,
      product_name: entry.product_name.toLowerCase().trim(),
      price: entry.price,
      currency: entry.currency || 'EUR',
      quantity: qty,
      unit: entry.unit || 'pcs',
      price_per_unit: pricePerUnit,
      store_name: entry.store_name || null,
    });
  }, [user]);

  const saveBatchPrices = useCallback(async (entries: PriceEntry[]) => {
    if (!user) return;
    const valid = entries.filter(e => e.price > 0 && e.product_name.trim());
    if (!valid.length) return;

    const rows = valid.map(e => ({
      user_id: user.id,
      product_name: e.product_name.toLowerCase().trim(),
      price: e.price,
      currency: e.currency || 'EUR',
      quantity: e.quantity || 1,
      unit: e.unit || 'pcs',
      price_per_unit: e.price / (e.quantity || 1),
      store_name: e.store_name || null,
    }));

    await supabase.from('product_price_history' as any).insert(rows);
  }, [user]);

  const getKnownPrice = useCallback(async (productName: string): Promise<KnownPrice | null> => {
    if (!user || !productName.trim()) return null;

    const { data } = await supabase
      .from('product_price_history' as any)
      .select('price_per_unit, currency, store_name, created_at')
      .eq('user_id', user.id)
      .ilike('product_name', `%${productName.toLowerCase().trim()}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!data?.length) return null;

    const latest = data[0] as any;
    const avg = data.reduce((s: number, p: any) => s + Number(p.price_per_unit), 0) / data.length;

    return {
      latestPrice: Number(latest.price_per_unit),
      averagePrice: avg,
      currency: latest.currency,
      lastStore: latest.store_name,
      purchaseCount: data.length,
      lastDate: latest.created_at,
    };
  }, [user]);

  const getProductsUsedBeforeExpiry = useCallback(async () => {
    if (!user) return { items: [], totalValue: 0, currency: 'EUR' };

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Get savings_log entries for used-before-expiry this month
    const { data: logs } = await supabase
      .from('savings_log')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['saved', 'waste_prevented', 'used_before_expiry'])
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false });

    if (!logs?.length) return { items: [], totalValue: 0, currency: 'EUR' };

    // Group by product name
    const grouped: Record<string, { count: number; totalValue: number }> = {};
    let totalValue = 0;
    let currency = 'EUR';

    for (const log of logs) {
      const name = (log.description || '').replace(/^[🌿💚✅]\s*/, '').trim() || 'Product';
      if (!grouped[name]) grouped[name] = { count: 0, totalValue: 0 };
      grouped[name].count++;
      grouped[name].totalValue += Number(log.amount || 0);
      totalValue += Number(log.amount || 0);
    }

    // Get user currency
    const { data: profile } = await supabase
      .from('profiles')
      .select('currency')
      .eq('user_id', user.id)
      .maybeSingle();
    currency = profile?.currency || 'EUR';

    const items = Object.entries(grouped).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.totalValue,
    }));

    return { items, totalValue, currency };
  }, [user]);

  const getMonthlySpending = useCallback(async () => {
    if (!user) return null;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [thisRes, lastRes, profileRes] = await Promise.all([
      supabase.from('receipts' as any).select('total_amount, currency').eq('user_id', user.id).gte('created_at', thisMonthStart),
      supabase.from('receipts' as any).select('total_amount').eq('user_id', user.id).gte('created_at', lastMonthStart).lt('created_at', thisMonthStart),
      supabase.from('profiles').select('currency').eq('user_id', user.id).maybeSingle(),
    ]);

    const currency = profileRes.data?.currency || 'EUR';
    const thisMonth = (thisRes.data || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
    const lastMonth = (lastRes.data || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
    const diff = lastMonth > 0 ? thisMonth - lastMonth : 0;
    const pctChange = lastMonth > 0 ? Math.round((diff / lastMonth) * 100) : 0;

    return { thisMonth, lastMonth, diff, pctChange, currency, hasData: thisMonth > 0 || lastMonth > 0 };
  }, [user]);

  const getTopProducts = useCallback(async (limit = 5) => {
    if (!user) return [];

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data } = await supabase
      .from('product_price_history' as any)
      .select('product_name, price_per_unit, currency, store_name, created_at')
      .eq('user_id', user.id)
      .gte('created_at', threeMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(200);

    if (!data?.length) return [];

    const counts: Record<string, { count: number; prices: number[]; stores: Set<string>; currency: string }> = {};
    for (const d of data as any[]) {
      const name = d.product_name;
      if (!counts[name]) counts[name] = { count: 0, prices: [], stores: new Set(), currency: d.currency };
      counts[name].count++;
      counts[name].prices.push(Number(d.price_per_unit));
      if (d.store_name) counts[name].stores.add(d.store_name);
    }

    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([name, info]) => {
        const prices = info.prices;
        const trend = prices.length >= 3 ? ((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1]) * 100 : null;
        return {
          name,
          count: info.count,
          latestPrice: prices[0],
          avgPrice: prices.reduce((s, p) => s + p, 0) / prices.length,
          trend,
          currency: info.currency,
          topStore: info.stores.size > 0 ? [...info.stores][0] : null,
        };
      });
  }, [user]);

  return { savePrice, saveBatchPrices, getKnownPrice, getProductsUsedBeforeExpiry, getMonthlySpending, getTopProducts };
};
