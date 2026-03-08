import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

const T = {
  en: {
    endsIn3: '⏰ Pro trial ends in 3 days',
    endsIn1: '🔔 Pro trial ends tomorrow',
    endsToday: 'Your Pro trial ends today',
    viewPlans: 'View plans',
    choosePlan: 'Choose plan',
    founderPro: '👑 Pro Founder €6.49/mo — forever',
    regularPro: '👑 Pro €12.99/mo',
    lite: '⭐️ Lite €5.99/mo',
    founderNote: 'Founder price available only now',
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
    founderPro: '👑 Pro Founder €6.49/мес — навсегда',
    regularPro: '👑 Pro €12.99/мес',
    lite: '⭐️ Lite €5.99/мес',
    founderNote: 'Цена основателя доступна только сейчас',
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
    founderPro: '👑 Pro Dibinātājs €6.49/mēn — mūžīgi',
    regularPro: '👑 Pro €12.99/mēn',
    lite: '⭐️ Lite €5.99/mēn',
    founderNote: 'Dibinātāja cena pieejama tikai tagad',
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
    founderPro: '👑 Pro Засновник €6.49/міс — назавжди',
    regularPro: '👑 Pro €12.99/міс',
    lite: '⭐️ Lite €5.99/міс',
    founderNote: 'Ціна засновника доступна тільки зараз',
    continueFree: 'Продовжити безкоштовно',
    expiredTitle: 'Пробний період закінчився',
    expiredDesc: 'Оновіть підписку, щоб зберегти Pro функції.',
  },
};

const TrialManager = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { createCheckout } = useSubscription();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);

  const t = T[language as keyof typeof T] || T.en;

  useEffect(() => {
    if (!user) return;

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
          await supabase.from('profiles').update({
            subscription_plan: 'free',
            subscription_status: 'expired',
          } as any).eq('user_id', user.id);

          const shown = sessionStorage.getItem('trial_expired_shown');
          if (!shown) {
            setShowExpiredModal(true);
            sessionStorage.setItem('trial_expired_shown', '1');
          }
        } else {
          const msLeft = trialEnd.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / 86400000);
          if (daysLeft <= 3) {
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

  const showBanner = trialDaysLeft !== null && 
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
          className="fixed top-0 left-0 right-0 z-[60] px-4 py-2 text-center text-sm font-medium text-white"
          style={{ backgroundColor: getBannerColor() }}
        >
          {getBannerText()}
          {' → '}
          <button onClick={handleUpgrade} className="underline font-bold">
            {trialDaysLeft && trialDaysLeft <= 1 ? t.choosePlan : t.viewPlans}
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
