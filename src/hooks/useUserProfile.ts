import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  provider: string | null;
}

export const useUserProfile = (): UserProfile => {
  const { user } = useAuth();

  if (!user) {
    return {
      displayName: null,
      email: null,
      avatarUrl: null,
      provider: null,
    };
  }

  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};

  // Get display name from various sources
  const displayName = 
    metadata.full_name || 
    metadata.name || 
    metadata.display_name || 
    metadata.preferred_username ||
    user.email?.split('@')[0] || 
    null;

  // Get avatar from Google or other providers
  const avatarUrl = 
    metadata.avatar_url || 
    metadata.picture || 
    null;

  // Get provider info
  const provider = appMetadata.provider || null;

  return {
    displayName,
    email: user.email || null,
    avatarUrl,
    provider,
  };
};
