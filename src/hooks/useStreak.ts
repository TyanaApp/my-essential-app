import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreakData {
  streak_current: number;
  streak_longest: number;
  streak_last_activity: string | null;
  streak_badges: string[];
  bonus_scans: number;
}

interface StreakReward {
  badge: string;
  message: string;
  bonusScans?: number;
  grantLite?: boolean;
  grantPro?: boolean;
}

const MILESTONES: { days: number; badge: string; bonusScans?: number; grantLite?: boolean; grantPro?: boolean }[] = [
  { days: 3, badge: '🌱' },
  { days: 7, badge: '🔥', bonusScans: 5 },
  { days: 14, badge: '⚡️' },
  { days: 30, badge: '👑', grantLite: true },
  { days: 100, badge: '🏆', grantPro: true },
];

export const BADGE_DEFINITIONS = [
  { emoji: '🌱', key: 'first_steps', days: 3 },
  { emoji: '🔥', key: 'one_week', days: 7 },
  { emoji: '⚡️', key: 'two_weeks', days: 14 },
  { emoji: '👑', key: 'kitchen_master', days: 30 },
  { emoji: '🏆', key: 'tyana_legend', days: 100 },
  { emoji: '♻️', key: 'zero_waste', days: null },
  { emoji: '🍽', key: 'home_chef', days: null },
  { emoji: '💰', key: 'economist', days: null },
];

export const useStreak = () => {
  const { user } = useAuth();

  const updateStreak = useCallback(async (): Promise<StreakReward | null> => {
    if (!user) return null;

    // Fetch current streak data
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_current, streak_longest, streak_last_activity, streak_badges, bonus_scans')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) return null;

    const streakData: StreakData = {
      streak_current: (profile as any).streak_current || 0,
      streak_longest: (profile as any).streak_longest || 0,
      streak_last_activity: (profile as any).streak_last_activity,
      streak_badges: (profile as any).streak_badges || [],
      bonus_scans: (profile as any).bonus_scans || 0,
    };

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = streakData.streak_last_activity;

    // Already counted today
    if (lastActivity === today) return null;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newCurrent: number;
    if (lastActivity === yesterday) {
      newCurrent = streakData.streak_current + 1;
    } else {
      newCurrent = 1;
    }

    const newLongest = Math.max(newCurrent, streakData.streak_longest);

    // Check milestones
    let reward: StreakReward | null = null;
    const milestone = MILESTONES.find(m => m.days === newCurrent);
    if (milestone && !streakData.streak_badges.includes(milestone.badge)) {
      const newBadges = [...streakData.streak_badges, milestone.badge];
      const updates: Record<string, any> = {
        streak_current: newCurrent,
        streak_longest: newLongest,
        streak_last_activity: today,
        streak_badges: newBadges,
      };

      if (milestone.bonusScans) {
        updates.bonus_scans = streakData.bonus_scans + milestone.bonusScans;
      }

      if (milestone.grantLite) {
        try { await supabase.rpc('grant_streak_reward', { p_plan: 'lite', p_trial_days: 30 } as any); } catch {}
      }

      if (milestone.grantPro) {
        try { await supabase.rpc('grant_streak_reward', { p_plan: 'pro_founding', p_trial_days: 30 } as any); } catch {}
      }

      await supabase.from('profiles').update(updates as any).eq('user_id', user.id);

      reward = {
        badge: milestone.badge,
        message: `${newCurrent}`,
        bonusScans: milestone.bonusScans,
        grantLite: milestone.grantLite,
        grantPro: milestone.grantPro,
      };
    } else {
      // No milestone, just update streak
      await supabase.from('profiles').update({
        streak_current: newCurrent,
        streak_longest: newLongest,
        streak_last_activity: today,
      } as any).eq('user_id', user.id);
    }

    return reward;
  }, [user]);

  const getStreakData = useCallback(async (): Promise<StreakData | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('streak_current, streak_longest, streak_last_activity, streak_badges, bonus_scans')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) return null;
    return {
      streak_current: (data as any).streak_current || 0,
      streak_longest: (data as any).streak_longest || 0,
      streak_last_activity: (data as any).streak_last_activity,
      streak_badges: (data as any).streak_badges || [],
      bonus_scans: (data as any).bonus_scans || 0,
    };
  }, [user]);

  const useBonusScan = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase
      .from('profiles')
      .select('bonus_scans')
      .eq('user_id', user.id)
      .maybeSingle();
    const bonus = (data as any)?.bonus_scans || 0;
    if (bonus <= 0) return false;
    await supabase.from('profiles').update({ bonus_scans: bonus - 1 } as any).eq('user_id', user.id);
    return true;
  }, [user]);

  return { updateStreak, getStreakData, useBonusScan };
};
