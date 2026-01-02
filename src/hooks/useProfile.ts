import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  gender: string | null;
  birth_date: string | null;
  avatar_url: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create profile if doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('Not authenticated'), url: null };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await updateProfile({ avatar_url: avatarUrl });

      return { error: null, url: avatarUrl };
    } catch (error) {
      return { error: error as Error, url: null };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
};
