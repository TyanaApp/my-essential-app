import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const T = {
  en: {
    endsIn3: '⏰ Pro trial ends in 3 days',
    endsIn1: '🔔 Pro trial ends tomorrow',
    endsToday: 'Your Pro trial ends today',
    viewPlans: 'View plans',
    choosePlan: 'Choose plan',
    earlyBirdPro: '👑 Pro €6.49/mo — locked forever',
    regularPro: '👑 Pro €12.99/mo',
    lite: '⭐️ Lite €5.99/mo',
    earlyBirdNote: 'Early Bird Price — locked forever',
    continueFree: 'Continue Free',
    expiredTitle: 'Your trial ended',
    expiredDesc: 'Upgrade to keep Pro features.',
  },
  ru: {
    endsIn3: '⏰ Pro заканчивается через 3 дня',
    endsIn1: '🔔 Завтра заканчивается Pro trial',
    endsToday: 'Ваш Pro trial завершается сегодня',
    viewPlans: 'Посмотреть планы',
    choosePlan: 'Выбрать план',
    earlyBirdPro: '👑 Pro €6.49/мес — навсегда',
    regularPro: '👑 Pro €12.99/мес',
    lite: '⭐️ Lite €5.99/мес',
    earlyBirdNote: 'Цена раннего доступа — навсегда',
    continueFree: 'Продолжить бесплатно',
    expiredTitle: 'Ваш пробный период завершён',
    expiredDesc: 'Обновите подписку, чтобы сохранить Pro функции.',
  },
  lv: {
    endsIn3: '⏰ Pro beidzas pēc 3 dienām',
    endsIn1: '🔔 Pro rīt beidzas',
    endsToday: 'Jūsu Pro beidzas šodien',
    viewPlans: 'Skatīt plānus',
    choosePlan: 'Izvēlēties plānu',
    earlyBirdPro: '👑 Pro €6.49/mēn — uz visiem laikiem',
    regularPro: '👑 Pro €12.99/mēn',
    lite: '⭐️ Lite €5.99/mēn',
    earlyBirdNote: 'Agrīnā piekļuve — uz visiem laikiem',
    continueFree: 'Turpināt bez maksas',
    expiredTitle: 'Jūsu izmēģinājums beidzies',
    expiredDesc: 'Uzlabojiet, lai saglabātu Pro funkcijas.',
  },
  uk: {
    endsIn3: '⏰ Pro закінчується через 3 дні',
    endsIn1: '🔔 Завтра закінчується Pro trial',
    endsToday: 'Ваш Pro trial завершується сьогодні',
    viewPlans: 'Переглянути плани',
    choosePlan: 'Обрати план',
    earlyBirdPro: '👑 Pro €6.49/міс — назавжди',
    regularPro: '👑 Pro €12.99/міс',
    lite: '⭐️ Lite €5.99/міс',
    earlyBirdNote: 'Ціна раннього доступу — назавжди',
    continueFree: 'Продовжити безкоштовно',
    expiredTitle: 'Пробний період закінчився',
    expiredDesc: 'Оновіть підписку, щоб зберегти Pro функції.',
  },
};

const BANNER_DISMISS_KEY = 'trial_banner_dismissed';
const MODAL_SESSION_KEY = 'trial_expired_shown';
const COOLDOWN_MS = 86400000; // 24 hours

const TrialManager = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { createCheckout } = useSubscription();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const t = T[language as keyof typeof T] || T.en;

  useEffect(() => {
    if (!user) return;

    // Check if banner was dismissed within 24h
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
          // Trial expired
          await supabase.from('profiles').update({
            subscription_plan: 'free',
            subscription_status: 'expired',
          } as any).eq('user_id', user.id);

          // Show modal ONCE per session, only on dashboard
          const shown = sessionStorage.getItem(MODAL_SESSION_KEY);
          if (!shown && location.pathname === '/dashboard') {
            setShowExpiredModal(true);
            sessionStorage.setItem(MODAL_SESSION_KEY, '1');
          }
        } else {
          const msLeft = trialEnd.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / 86400000);
          if (daysLeft <= 3) {
            setTrialDaysLeft(daysLeft);
          }
        }
      } else if (profile.subscription_status === 'expired') {
        // Already expired — show modal once per session on dashboard only
        const shown = sessionStorage.getItem(MODAL_SESSION_KEY);
        if (!shown && location.pathname === '/dashboard') {
          setShowExpiredModal(true);
          sessionStorage.setItem(MODAL_SESSION_KEY, '1');
        }
      }
    };

    checkTrial();
  }, [user, location.pathname]);

  const handleUpgrade = () => {
    setShowExpiredModal(false);
    navigate('/profile');
    setTimeout(() => {
      const event = new CustomEvent('open-payments');
      window.dispatchEvent(event);
    }, 500);
  };

  const handleCheckout = async (planType: 'lite' | 'pro_founding' | 'pro_regular') => {
    try {
      await createCheckout(planType);
      setShowExpiredModal(false);
    } catch {
      handleUpgrade();
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
    if (trialDaysLeft === 0) return '#DC2626';
    if (trialDaysLeft === 1) return '#EA580C';
    return '#CA8A04';
  };

  const getBannerText = () => {
    if (trialDaysLeft === 0) return t.endsToday;
    if (trialDaysLeft === 1) return t.endsIn1;
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

      <Dialog open={showExpiredModal} onOpenChange={setShowExpiredModal}>
        <DialogContent className="bg-card border-border max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t.expiredTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">{t.expiredDesc}</p>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              onClick={() => handleCheckout(isFoundingMember ? 'pro_founding' : 'pro_regular')}
              className="w-full font-semibold text-white"
              style={{ backgroundColor: '#7C3AED' }}
            >
              {isFoundingMember ? t.founderPro : t.regularPro}
            </Button>
            <Button
              onClick={() => handleCheckout('lite')}
              variant="outline"
              className="w-full font-semibold"
            >
              {t.lite}
            </Button>
            {isFoundingMember && (
              <p className="text-xs text-amber-600 font-medium">{t.founderNote}</p>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowExpiredModal(false)}
              className="w-full text-muted-foreground"
            >
              {t.continueFree}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrialManager;
