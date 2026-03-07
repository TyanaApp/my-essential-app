import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const TrialManager = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkTrial = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, trial_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) return;
      const profile = data as any;

      if (profile.subscription_status === 'trial' && profile.trial_end) {
        const trialEnd = new Date(profile.trial_end);
        const now = new Date();

        if (trialEnd < now) {
          // Trial expired — downgrade
          await supabase
            .from('profiles')
            .update({
              subscription_plan: 'free',
              subscription_status: 'expired',
            } as any)
            .eq('user_id', user.id);

          // Show modal once per session
          const shown = sessionStorage.getItem('trial_expired_shown');
          if (!shown) {
            setShowExpiredModal(true);
            sessionStorage.setItem('trial_expired_shown', '1');
          }
        } else {
          // Calculate days left
          const msLeft = trialEnd.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / 86400000);
          if (daysLeft <= 2) {
            setTrialDaysLeft(daysLeft);
          }
        }
      }
    };

    checkTrial();
  }, [user]);

  const handleUpgrade = () => {
    setShowExpiredModal(false);
    navigate('/profile');
    // Trigger payments modal via URL param
    setTimeout(() => {
      const event = new CustomEvent('open-payments');
      window.dispatchEvent(event);
    }, 500);
  };

  // Don't show banner on auth/onboarding pages
  const showBanner = trialDaysLeft !== null && 
    !['/auth', '/onboarding', '/'].includes(location.pathname);

  return (
    <>
      {/* Trial ending banner */}
      {showBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] px-4 py-2 text-center text-sm font-medium text-white"
          style={{ backgroundColor: '#EA580C' }}
        >
          ⏰ {(t as any).trial?.endsIn?.replace('{days}', String(trialDaysLeft)) || `Pro trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}`}
          {' → '}
          <button
            onClick={handleUpgrade}
            className="underline font-bold"
          >
            {(t as any).trial?.upgradeNow || 'Upgrade now'}
          </button>
        </div>
      )}

      {/* Trial expired modal */}
      <Dialog open={showExpiredModal} onOpenChange={setShowExpiredModal}>
        <DialogContent className="bg-card border-border max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {(t as any).trial?.expiredTitle || 'Your trial ended'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">
            {(t as any).trial?.expiredDesc || 'Upgrade to keep Pro features.'}
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              onClick={handleUpgrade}
              className="w-full font-semibold"
              style={{ backgroundColor: '#7C3AED' }}
            >
              {(t as any).trial?.upgradeBtn || 'Upgrade €6.49/mo'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowExpiredModal(false)}
              className="w-full text-muted-foreground"
            >
              {(t as any).trial?.continueFree || 'Continue Free'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrialManager;
