import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Stripe price IDs
export const SUBSCRIPTION_PLANS = {
  monthly: {
    priceId: 'price_1SlYPf2N2asjxki4jv9oIyzb',
    productId: 'prod_Tj0Q4ajHpjp1SV',
    name: 'Core Monthly',
    price: 9.99,
    interval: 'month',
  },
  yearly: {
    priceId: 'price_1SlYS32N2asjxki4VOyrcOAw',
    productId: 'prod_Tj0SCqxIWNr9XU',
    name: 'Pro Yearly',
    price: 79.99,
    interval: 'year',
  },
} as const;

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  plan: 'monthly' | 'yearly' | null;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    productId: null,
    priceId: null,
    subscriptionEnd: null,
    plan: null,
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setStatus({
        subscribed: false,
        productId: null,
        priceId: null,
        subscriptionEnd: null,
        plan: null,
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      let plan: 'monthly' | 'yearly' | null = null;
      if (data.product_id === SUBSCRIPTION_PLANS.monthly.productId) {
        plan = 'monthly';
      } else if (data.product_id === SUBSCRIPTION_PLANS.yearly.productId) {
        plan = 'yearly';
      }

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

  const createCheckout = async (planType: 'monthly' | 'yearly') => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const priceId = SUBSCRIPTION_PLANS[planType].priceId;

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;

    if (data?.url) {
      window.open(data.url, '_blank');
    }

    return data;
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;

    if (data?.url) {
      window.open(data.url, '_blank');
    }

    return data;
  };

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh every minute
  useEffect(() => {
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    ...status,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
