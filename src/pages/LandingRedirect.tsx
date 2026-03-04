import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsStandalone } from '@/hooks/useStandalone';
import Index from './Index';

const LandingRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isStandalone = useIsStandalone();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If standalone PWA → skip landing, go to auth
    if (isStandalone && !user && !loading) {
      navigate('/auth', { replace: true });
      return;
    }

    if (loading) return;
    if (!user) { setChecking(false); return; }

    const checkOnboarding = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && (data as any).onboarding_completed) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    };
    checkOnboarding();
  }, [user, loading, navigate, isStandalone]);

  if (loading || checking) {
    if (user || isStandalone) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3FF' }}>
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
        </div>
      );
    }
  }

  return <Index />;
};

export default LandingRedirect;
