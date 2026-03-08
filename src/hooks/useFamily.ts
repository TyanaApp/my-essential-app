import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyMember {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  family_role: string | null;
}

export interface FamilySubMember {
  id: string;
  family_id: string;
  user_id: string | null;
  name: string;
  avatar_emoji: string;
  gender: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: string | null;
  goals: string[] | null;
  diet_type: string | null;
  allergies: string[] | null;
  daily_calories_target: number | null;
  is_owner: boolean;
  created_at: string;
}

// Mifflin-St Jeor calorie calculation
export const calculateCalories = (
  weight: number | null, height: number | null, age: number | null,
  gender: string | null, activity: string | null, goals: string[] | null
): number => {
  if (!weight || !height || !age) return 2000;
  // BMR (Mifflin-St Jeor)
  let bmr: number;
  if (gender === 'female' || gender === 'girl') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }
  // Activity multiplier
  const actMultiplier: Record<string, number> = {
    sedentary: 1.2, low: 1.2, lightlyActive: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9,
  };
  const tdee = bmr * (actMultiplier[activity || 'moderate'] || 1.55);
  // Goal adjustments
  let adjustment = 0;
  if (goals?.includes('Lose weight') || goals?.includes('lose')) adjustment = -400;
  if (goals?.includes('Gain muscle') || goals?.includes('gain')) adjustment = 300;
  // Kids under 12 get lower base
  if (age < 12) return Math.round(Math.max(1200, tdee + adjustment));
  return Math.round(Math.max(1200, tdee + adjustment));
};

export const useFamily = () => {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [subMembers, setSubMembers] = useState<FamilySubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyMode, setFamilyMode] = useState(false);

  const fetchFamily = useCallback(async () => {
    if (!user) { setFamily(null); setMembers([]); setSubMembers([]); setLoading(false); return; }
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id, family_role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.family_id) {
        setFamily(null);
        setMembers([]);
        setSubMembers([]);
        setFamilyMode(false);
        setLoading(false);
        return;
      }

      setFamilyMode(true);

      const [familyRes, membersRes, subMembersRes] = await Promise.all([
        supabase.from('families').select('*').eq('id', profile.family_id).single(),
        supabase.from('profiles').select('user_id, display_name, avatar_url, family_role').eq('family_id', profile.family_id),
        supabase.from('family_members').select('*').eq('family_id', profile.family_id).order('created_at', { ascending: true }) as any,
      ]);

      if (familyRes.data) setFamily(familyRes.data as unknown as Family);
      if (membersRes.data) setMembers(membersRes.data as unknown as FamilyMember[]);
      if (subMembersRes.data) setSubMembers(subMembersRes.data as FamilySubMember[]);
    } catch (e) {
      console.error('Error fetching family:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFamily(); }, [fetchFamily]);

  const generateInviteCode = (): string => {
    const num = Math.floor(100 + Math.random() * 900);
    return `TYA-${num}`;
  };

  const createFamily = async (name: string) => {
    if (!user) return { error: 'Not authenticated' };
    
    const invite_code = generateInviteCode();
    const { data, error } = await supabase
      .from('families')
      .insert({ name, owner_id: user.id, invite_code } as any)
      .select()
      .single();

    if (error) return { error: error.message };

    const familyId = (data as any).id;

    await supabase
      .from('profiles')
      .update({ family_id: familyId, family_role: 'owner' } as any)
      .eq('user_id', user.id);

    // Auto-add owner as family member
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('display_name, gender')
      .eq('user_id', user.id)
      .maybeSingle();

    await (supabase.from('family_members').insert({
      family_id: familyId,
      user_id: user.id,
      name: ownerProfile?.display_name || 'Me',
      avatar_emoji: ownerProfile?.gender === 'female' ? '👩' : '👨',
      is_owner: true,
    }) as any);

    await fetchFamily();
    return { error: null, invite_code };
  };

  const joinFamily = async (code: string) => {
    if (!user) return { error: 'Not authenticated', familyName: '' };

    const { data, error } = await supabase
      .from('families')
      .select('id, name')
      .eq('invite_code', code.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) return { error: 'Invalid code', familyName: '' };

    const familyId = (data as any).id;

    await supabase
      .from('profiles')
      .update({ family_id: familyId, family_role: 'member' } as any)
      .eq('user_id', user.id);

    // Add as family member
    const { data: joinerProfile } = await supabase
      .from('profiles')
      .select('display_name, gender')
      .eq('user_id', user.id)
      .maybeSingle();

    await (supabase.from('family_members').insert({
      family_id: familyId,
      user_id: user.id,
      name: joinerProfile?.display_name || 'Member',
      avatar_emoji: joinerProfile?.gender === 'female' ? '👩' : '👨',
      is_owner: false,
    }) as any);

    await fetchFamily();
    return { error: null, familyName: (data as any).name };
  };

  const leaveFamily = async () => {
    if (!user) return;

    const isOwner = family?.owner_id === user.id;
    
    if (isOwner && family) {
      // Delete all family_members first (cascade will handle via FK)
      await supabase
        .from('profiles')
        .update({ family_id: null, family_role: null } as any)
        .eq('family_id', family.id);

      await supabase
        .from('families')
        .delete()
        .eq('id', family.id);
    } else {
      // Remove from family_members
      if (family) {
        await (supabase.from('family_members').delete().eq('family_id', family.id).eq('user_id', user.id) as any);
      }
      await supabase
        .from('profiles')
        .update({ family_id: null, family_role: null } as any)
        .eq('user_id', user.id);
    }

    setFamily(null);
    setMembers([]);
    setSubMembers([]);
    setFamilyMode(false);
  };

  const addSubMember = async (member: Omit<FamilySubMember, 'id' | 'family_id' | 'created_at'>) => {
    if (!family) return { error: 'No family' };
    const { data, error } = await (supabase.from('family_members').insert({
      ...member,
      family_id: family.id,
    }).select().single() as any);
    if (!error) await fetchFamily();
    return { data, error };
  };

  const updateSubMember = async (id: string, updates: Partial<FamilySubMember>) => {
    const { error } = await (supabase.from('family_members').update(updates).eq('id', id) as any);
    if (!error) await fetchFamily();
    return { error };
  };

  const deleteSubMember = async (id: string) => {
    const { error } = await (supabase.from('family_members').delete().eq('id', id) as any);
    if (!error) await fetchFamily();
    return { error };
  };

  return {
    family,
    members,
    subMembers,
    loading,
    familyMode,
    isOwner: family?.owner_id === user?.id,
    createFamily,
    joinFamily,
    leaveFamily,
    addSubMember,
    updateSubMember,
    deleteSubMember,
    refetch: fetchFamily,
  };
};
