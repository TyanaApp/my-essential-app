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

export const useFamily = () => {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyMode, setFamilyMode] = useState(false);

  const fetchFamily = useCallback(async () => {
    if (!user) { setFamily(null); setMembers([]); setLoading(false); return; }
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id, family_role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.family_id) {
        setFamily(null);
        setMembers([]);
        setFamilyMode(false);
        setLoading(false);
        return;
      }

      setFamilyMode(true);

      const [familyRes, membersRes] = await Promise.all([
        supabase.from('families').select('*').eq('id', profile.family_id).single(),
        supabase.from('profiles').select('user_id, display_name, avatar_url, family_role').eq('family_id', profile.family_id),
      ]);

      if (familyRes.data) setFamily(familyRes.data as unknown as Family);
      if (membersRes.data) setMembers(membersRes.data as unknown as FamilyMember[]);
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

    await supabase
      .from('profiles')
      .update({ family_id: (data as any).id, family_role: 'owner' } as any)
      .eq('user_id', user.id);

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

    await supabase
      .from('profiles')
      .update({ family_id: (data as any).id, family_role: 'member' } as any)
      .eq('user_id', user.id);

    await fetchFamily();
    return { error: null, familyName: (data as any).name };
  };

  const leaveFamily = async () => {
    if (!user) return;

    const isOwner = family?.owner_id === user.id;
    
    if (isOwner && family) {
      // Dissolve family: remove all members first
      await supabase
        .from('profiles')
        .update({ family_id: null, family_role: null } as any)
        .eq('family_id', family.id);

      await supabase
        .from('families')
        .delete()
        .eq('id', family.id);
    } else {
      await supabase
        .from('profiles')
        .update({ family_id: null, family_role: null } as any)
        .eq('user_id', user.id);
    }

    setFamily(null);
    setMembers([]);
    setFamilyMode(false);
  };

  return {
    family,
    members,
    loading,
    familyMode,
    isOwner: family?.owner_id === user?.id,
    createFamily,
    joinFamily,
    leaveFamily,
    refetch: fetchFamily,
  };
};
