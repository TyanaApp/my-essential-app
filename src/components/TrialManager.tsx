import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import TrialExpiredModal from '@/components/TrialExpiredModal';

const T = {
  en: {
    endsIn3: '⏰ Pro trial ends in 3 days',
    endsIn2: '⏰ Pro trial ends in 2 days',
    endsIn1: '🔔 Pro trial ends tomorrow',
    endsToday: '🎯 Today is the last day of Pro — don\'t lose access',
    viewPlans: 'View plans',
    choosePlan: 'Choose plan',
  },
  ru: {
    endsIn3: '⏰ Pro заканчивается через 3 дня',
    endsIn2: '⏰ Pro заканчивается через 2 дня',
    endsIn1: '🔔 Завтра заканчивается Pro trial',
    endsToday: '🎯 Сегодня последний день Pro — не теряй доступ',
    viewPlans: 'Посмотреть планы',
    choosePlan: 'Выбрать план',
  },
  lv: {
    endsIn3: '⏰ Pro beidzas pēc 3 dienām',
    endsIn2: '⏰ Pro beidzas pēc 2 dienām',
    endsIn1: '🔔 Pro rīt beidzas',
    endsToday: '🎯 Šodien pēdējā Pro diena — nezaudē piekļuvi',
    viewPlans: 'Skatīt plānus',
    choosePlan: 'Izvēlēties plānu',
  },
  uk: {
    endsIn3: '⏰ Pro закінчується через 3 дні',
    endsIn2: '⏰ Pro закінчується через 2 дні',
    endsIn1: '🔔 Завтра закінчується Pro trial',
    endsToday: '🎯 Сьогодні останній день Pro — не втрать доступ',
    viewPlans: 'Переглянути плани',
    choosePlan: 'Обрати план',
  },
};

const BANNER_DISMISS_KEY = 'trial_banner_dismissed';
const MODAL_SESSION_KEY = 'trial_expired_shown';
const COOLDOWN_MS = 86400000;

const TrialManager = () => {
  const { user, session } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const t = T[language as keyof typeof T] || T.en;

  useEffect(() => {
    if (!user) return;

    const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) {
      setBannerDismissed(true);
    }

    const checkTrial = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, trial_end, is_founding_member')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) return;
      const profile = data as any;
      setIsFoundingMember(!!profile.is_founding_member);

      if (profile.subscription_status === 'trial' && profile.trial_end) {
        const trialEnd = new Date(profile.trial_end);
        const now = new Date();

        if (trialEnd < now) {
          // Expire via edge function (service_role)
          if (session?.access_token) {
            await supabase.functions.invoke('expire-trial', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
          }

          const shown = sessionStorage.getItem(MODAL_SESSION_KEY);
          if (!shown && location.pathname === '/dashboard') {
            setShowExpiredModal(true);
            sessionStorage.setItem(MODAL_SESSION_KEY, '1');
          }
        } else {
          const msLeft = trialEnd.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / 86400000);
          if (daysLeft <= 3) setTrialDaysLeft(daysLeft);
        }
      } else if (profile.subscription_status === 'expired' || (profile.subscription_status === 'free' && profile.subscription_plan === 'free')) {
        // Check if just expired
        const shown = sessionStorage.getItem(MODAL_SESSION_KEY);
        if (!shown && location.pathname === '/dashboard' && profile.subscription_status === 'expired') {
          setShowExpiredModal(true);
          sessionStorage.setItem(MODAL_SESSION_KEY, '1');
        }
      }
    };

    checkTrial();
  }, [user, location.pathname, session]);

  const handleUpgrade = () => {
    setShowExpiredModal(false);
    const event = new CustomEvent('open-payments');
    window.dispatchEvent(event);
    if (!window.location.pathname.includes('/profile')) {
      window.location.href = '/profile';
    }
  };

  const handleDismissBanner = () => {
    setTrialDaysLeft(null);
    setBannerDismissed(true);
    localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()));
  };

  const showBanner = trialDaysLeft !== null &&
    !bannerDismissed &&
    !['/auth', '/onboarding', '/'].includes(location.pathname);

  const getBannerColor = () => {
    if (trialDaysLeft === 0) return '#7C3AED';
    if (trialDaysLeft === 1) return '#EA580C';
    return '#CA8A04';
  };

  const getBannerText = () => {
    if (trialDaysLeft === 0) return t.endsToday;
    if (trialDaysLeft === 1) return t.endsIn1;
    if (trialDaysLeft === 2) return t.endsIn2;
    return t.endsIn3;
  };

  return (
    <>
      {showBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] px-4 py-2 text-center text-sm font-medium text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: getBannerColor() }}
        >
          <span>
            {getBannerText()}
            {' → '}
            <button onClick={handleUpgrade} className="underline font-bold">
              {trialDaysLeft && trialDaysLeft <= 1 ? t.choosePlan : t.viewPlans}
            </button>
          </span>
          <button
            onClick={handleDismissBanner}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <TrialExpiredModal
        open={showExpiredModal}
        onOpenChange={setShowExpiredModal}
        isFoundingMember={isFoundingMember}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};

export default TrialManager;
