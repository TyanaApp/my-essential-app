import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'free' | 'lite' | 'pro';

export type FeatureKey =
  | 'workouts'
  | 'familyMode'
  | 'mealPlan'
  | 'analytics'
  | 'receiptScan'
  | 'emailReports'
  | 'prioritySupport';

export type LimitKey =
  | 'inventory'
  | 'shopping'
  | 'gptDaily'
  | 'recipesDaily'
  | 'fridgeScanTotal'
  | 'fridgeScanMonthly'
  | 'barcodeTotal'
  | 'barcodeScans'
  | 'receiptScanMonthly'
  | 'diaryHistory';

export interface PlanLimits {
  inventory: number;
  shopping: number;
  gptDaily: number;
  recipesDaily: number;
  fridgeScanTotal?: number;
  fridgeScanMonthly?: number;
  barcodeTotal?: number;
  barcodeScans?: number;
  receiptScanMonthly: number;
  diaryHistory: number | false;
  workouts: boolean;
  familyMode: boolean;
  mealPlan: boolean;
  analytics: number | false;
  emailReports: boolean;
  prioritySupport: boolean;
}

const LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    inventory: 15,
    shopping: 10,
    gptDaily: 3,
    recipesDaily: 1,
    fridgeScanTotal: 1,
    barcodeTotal: 3,
    receiptScanMonthly: 0,
    diaryHistory: false,
    workouts: false,
    familyMode: false,
    mealPlan: false,
    analytics: false,
    emailReports: false,
    prioritySupport: false,
  },
  lite: {
    inventory: 100,
    shopping: 999,
    gptDaily: 10,
    recipesDaily: 5,
    fridgeScanMonthly: 10,
    barcodeScans: 999,
    receiptScanMonthly: 10,
    diaryHistory: 30,
    workouts: true,
    familyMode: false,
    mealPlan: false,
    analytics: 7,
    emailReports: false,
    prioritySupport: false,
  },
  pro: {
    inventory: 999,
    shopping: 999,
    gptDaily: 999,
    recipesDaily: 999,
    fridgeScanMonthly: 999,
    barcodeScans: 999,
    receiptScanMonthly: 999,
    diaryHistory: 999,
    workouts: true,
    familyMode: true,
    mealPlan: true,
    analytics: 999,
    emailReports: true,
    prioritySupport: true,
  },
};

export interface UsageData {
  gptCallsToday: number;
  recipesShownToday: number;
  fridgeScansUsed: number;
  barcodeScansUsed: number;
  monthlyFridgeScans: number;
  monthlyReceiptScans: number;
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [usage, setUsage] = useState<UsageData>({
    gptCallsToday: 0,
    recipesShownToday: 0,
    fridgeScansUsed: 0,
    barcodeScansUsed: 0,
    monthlyFridgeScans: 0,
    monthlyReceiptScans: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const today = new Date().toISOString().split('T')[0];

    const [profileRes, usageRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, trial_end, is_founding_member, fridge_scans_used, barcode_scans_used, monthly_fridge_scans, monthly_receipt_scans, monthly_reset_date')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('usage_tracking')
        .select('gpt_calls_today, recipes_shown_today')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle(),
    ]);

    if (profileRes.data) {
      setProfileData(profileRes.data);
      setUsage({
        gptCallsToday: (usageRes.data as any)?.gpt_calls_today || 0,
        recipesShownToday: (usageRes.data as any)?.recipes_shown_today || 0,
        fridgeScansUsed: profileRes.data.fridge_scans_used || 0,
        barcodeScansUsed: profileRes.data.barcode_scans_used || 0,
        monthlyFridgeScans: profileRes.data.monthly_fridge_scans || 0,
        monthlyReceiptScans: profileRes.data.monthly_receipt_scans || 0,
      });

      // Monthly reset check
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0];
      if (profileRes.data.monthly_reset_date !== firstOfMonthStr) {
        await supabase
          .from('profiles')
          .update({
            monthly_fridge_scans: 0,
            monthly_receipt_scans: 0,
            monthly_reset_date: firstOfMonthStr,
          })
          .eq('user_id', user.id);
        setUsage(prev => ({ ...prev, monthlyFridgeScans: 0, monthlyReceiptScans: 0 }));
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const plan: PlanType = (() => {
    const p = profileData?.subscription_plan;
    if (p === 'pro' || p === 'pro_founding') return 'pro';
    if (p === 'lite') return 'lite';
    return 'free';
  })();

  const isTrial = profileData?.subscription_status === 'trial';
  const isPro = plan === 'pro' || isTrial;
  const isLite = plan === 'lite';
  const isFree = !isPro && !isLite;

  const currentLimits = isPro ? LIMITS.pro : isLite ? LIMITS.lite : LIMITS.free;

  const canUse = (feature: FeatureKey): boolean => {
    return !!currentLimits[feature];
  };

  const isAtLimit = (feature: LimitKey, currentCount: number): boolean => {
    const limit = currentLimits[feature as keyof PlanLimits];
    if (limit === undefined || limit === 999 || limit === true || limit === false) return false;
    return currentCount >= (limit as number);
  };

  const incrementUsage = useCallback(async (field: 'gpt_calls_today' | 'recipes_shown_today') => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('usage_tracking')
      .upsert(
        { user_id: user.id, date: today, [field]: (field === 'gpt_calls_today' ? usage.gptCallsToday : usage.recipesShownToday) + 1 },
        { onConflict: 'user_id,date' }
      );
    setUsage(prev => ({
      ...prev,
      [field === 'gpt_calls_today' ? 'gptCallsToday' : 'recipesShownToday']:
        (field === 'gpt_calls_today' ? prev.gptCallsToday : prev.recipesShownToday) + 1,
    }));
  }, [user, usage]);

  const incrementScanCount = useCallback(async (type: 'fridge' | 'barcode' | 'receipt') => {
    if (!user) return;
    const field =
      type === 'fridge' ? (isFree ? 'fridge_scans_used' : 'monthly_fridge_scans') :
      type === 'barcode' ? (isFree ? 'barcode_scans_used' : 'barcode_scans_used') :
      'monthly_receipt_scans';

    const currentVal =
      type === 'fridge' ? (isFree ? usage.fridgeScansUsed : usage.monthlyFridgeScans) :
      type === 'barcode' ? usage.barcodeScansUsed :
      usage.monthlyReceiptScans;

    await supabase
      .from('profiles')
      .update({ [field]: currentVal + 1 })
      .eq('user_id', user.id);

    setUsage(prev => {
      const key =
        type === 'fridge' ? (isFree ? 'fridgeScansUsed' : 'monthlyFridgeScans') :
        type === 'barcode' ? 'barcodeScansUsed' :
        'monthlyReceiptScans';
      return { ...prev, [key]: prev[key] + 1 };
    });
  }, [user, usage, isFree]);

  // Determine which upgrade prompt to show
  type LimitHitInfo = {
    emoji: string;
    feature: string;
    suggestedPlan: 'lite' | 'pro';
  } | null;

  const checkLimit = (feature: string): LimitHitInfo => {
    if (isPro) return null;

    switch (feature) {
      case 'inventory':
        if (isFree) return { emoji: '📦', feature: 'inventory', suggestedPlan: 'lite' };
        if (isLite) return { emoji: '📦', feature: 'inventory', suggestedPlan: 'pro' };
        return null;
      case 'gpt':
        return { emoji: '🤖', feature: 'gpt', suggestedPlan: isFree ? 'lite' : 'pro' };
      case 'recipes':
        return { emoji: '👨‍🍳', feature: 'recipes', suggestedPlan: isFree ? 'lite' : 'pro' };
      case 'receiptScan':
        return { emoji: '📷', feature: 'receiptScan', suggestedPlan: isFree ? 'lite' : 'pro' };
      case 'fridgeScan':
        return { emoji: '📸', feature: 'fridgeScan', suggestedPlan: isFree ? 'lite' : 'pro' };
      case 'mealPlan':
        return { emoji: '📅', feature: 'mealPlan', suggestedPlan: 'pro' };
      case 'familyMode':
        return { emoji: '👨‍👩‍👧', feature: 'familyMode', suggestedPlan: 'pro' };
      case 'workouts':
        return { emoji: '💪', feature: 'workouts', suggestedPlan: 'lite' };
      case 'analytics':
        return { emoji: '📊', feature: 'analytics', suggestedPlan: isFree ? 'lite' : 'pro' };
      default:
        return null;
    }
  };

  return {
    plan,
    isPro,
    isLite,
    isFree,
    isTrial,
    currentLimits,
    usage,
    canUse,
    isAtLimit,
    checkLimit,
    incrementUsage,
    incrementScanCount,
    loading,
    refetch: fetchData,
    isFoundingMember: !!profileData?.is_founding_member,
  };
};
