import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// New Stripe plans
export const SUBSCRIPTION_PLANS = {
  lite: {
    priceId: 'price_1T79tP2N2asjxki49FFBKFeL',
    productId: 'prod_U5KY1HNe6IirjK',
    name: 'TYANA Lite',
    price: 5.99,
    currency: '€',
    interval: 'month',
    scansPerMonth: 15,
    maxRecipes: 50,
  },
  pro_founding: {
    priceId: 'price_1T79ut2N2asjxki45jclLOlc',
    productId: 'prod_U5Ka0VFomXsCwg',
    name: 'TYANA Pro',
    price: 6.49,
    currency: '€',
    interval: 'month',
    scansPerMonth: Infinity,
    maxRecipes: Infinity,
    badge: '✅ Early Bird',
  },
  pro_regular: {
    priceId: 'price_1T79vc2N2asjxki4EpkvxSDD',
    productId: 'prod_U5Ka0ihj35s3M0',
    name: 'TYANA Pro',
    price: 12.99,
    currency: '€',
    interval: 'month',
    scansPerMonth: Infinity,
    maxRecipes: Infinity,
  },
} as const;

export type PlanType = 'free' | 'lite' | 'pro_founding' | 'pro_regular';

// Plan limits
export const PLAN_LIMITS: Record<PlanType, { scansPerMonth: number; maxRecipes: number }> = {
  free: { scansPerMonth: 5, maxRecipes: 3 },
  lite: { scansPerMonth: 15, maxRecipes: 50 },
  pro_founding: { scansPerMonth: Infinity, maxRecipes: Infinity },
  pro_regular: { scansPerMonth: Infinity, maxRecipes: Infinity },
};

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  plan: PlanType;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    productId: null,
    priceId: null,
    subscriptionEnd: null,
    plan: 'free',
  });
  const [loading, setLoading] = useState(true);

  const determinePlan = (productId: string | null): PlanType => {
    if (!productId) return 'free';
    if (productId === SUBSCRIPTION_PLANS.lite.productId) return 'lite';
    if (productId === SUBSCRIPTION_PLANS.pro_founding.productId) return 'pro_founding';
    if (productId === SUBSCRIPTION_PLANS.pro_regular.productId) return 'pro_regular';
    return 'free';
  };

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setStatus({ subscribed: false, productId: null, priceId: null, subscriptionEnd: null, plan: 'free' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;

      const plan = determinePlan(data.product_id);
      setStatus({
        subscribed: data.subscribed,
        productId: data.product_id,
        priceId: data.price_id,
        subscriptionEnd: data.subscription_end,
        plan,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const createCheckout = async (planType: 'lite' | 'pro_founding' | 'pro_regular') => {
    if (!session?.access_token) throw new Error('Not authenticated');
    const priceId = SUBSCRIPTION_PLANS[planType].priceId;

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId, planType },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, '_blank');
    return data;
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) throw new Error('Not authenticated');
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, '_blank');
    return data;
  };

  useEffect(() => { checkSubscription(); }, [checkSubscription]);
  useEffect(() => {
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return { ...status, loading, checkSubscription, createCheckout, openCustomerPortal };
};
