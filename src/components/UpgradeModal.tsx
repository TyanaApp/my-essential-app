import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Sparkles, Gift, Zap } from 'lucide-react';
import { toast } from 'sonner';

const T = {
  en: {
    tryFreeTitle: '🎁 Try Pro free for 7 days',
    tryFreeDesc: 'No card needed. Just try it.',
    startTrial: 'Start free trial',
    viewPlans: 'View plans',
    trialActivated: 'Pro activated! 7 days ahead 🎉',
    earlyBirdTitle: '🎉 Your special price',
    earlyBirdDesc: 'Your price €6.49/mo is locked forever',
    earlyBirdSaving: "That's 2x cheaper than the regular price",
    subscribe: 'Subscribe for €6.49/mo',
    expiredTitle: 'Upgrade to Pro',
    regularPrice: '€12.99/mo',
    subscribePro: 'Subscribe',
    tryLite: 'Try Lite for €5.99',
    maybeLater: 'Maybe later',
  },
  ru: {
    tryFreeTitle: '🎁 Попробуй Pro бесплатно 7 дней',
    tryFreeDesc: 'Карта не нужна. Просто попробуй.',
    startTrial: 'Начать бесплатный trial',
    viewPlans: 'Посмотреть планы',
    trialActivated: 'Pro активирован! 7 дней впереди 🎉',
    founderTitle: '⚡️ Специальное предложение для вас',
    founderDesc: 'Вы в числе первых 1000 пользователей',
    founderPrice: '€6.49/мес — навсегда',
    founderOnly: 'Эта цена только для вас и только сейчас',
    subscribe: 'Подписаться за €6.49/мес',
    offerValid: 'Предложение действительно 24 часа',
    expiredTitle: 'Перейди на Pro',
    regularPrice: '€12.99/мес',
    subscribePro: 'Подписаться',
    tryLite: 'Попробовать Lite за €5.99',
    maybeLater: 'Позже',
  },
  lv: {
    tryFreeTitle: '🎁 Izmēģini Pro bez maksas 7 dienas',
    tryFreeDesc: 'Karte nav vajadzīga. Vienkārši izmēģini.',
    startTrial: 'Sākt bezmaksas izmēģinājumu',
    viewPlans: 'Skatīt plānus',
    trialActivated: 'Pro aktivizēts! 7 dienas priekšā 🎉',
    founderTitle: '⚡️ Īpašs piedāvājums jums',
    founderDesc: 'Jūs esat viens no pirmajiem 1000 lietotājiem',
    founderPrice: '€6.49/mēn — mūžīgi',
    founderOnly: 'Šī cena tikai jums un tikai tagad',
    subscribe: 'Abonēt par €6.49/mēn',
    offerValid: 'Piedāvājums derīgs 24 stundas',
    expiredTitle: 'Pāriet uz Pro',
    regularPrice: '€12.99/mēn',
    subscribePro: 'Abonēt',
    tryLite: 'Izmēģināt Lite par €5.99',
    maybeLater: 'Varbūt vēlāk',
  },
  uk: {
    tryFreeTitle: '🎁 Спробуй Pro безкоштовно 7 днів',
    tryFreeDesc: 'Картка не потрібна. Просто спробуй.',
    startTrial: 'Почати безкоштовний trial',
    viewPlans: 'Переглянути плани',
    trialActivated: 'Pro активовано! 7 днів попереду 🎉',
    founderTitle: '⚡️ Спеціальна пропозиція для вас',
    founderDesc: 'Ви серед перших 1000 користувачів',
    founderPrice: '€6.49/міс — назавжди',
    founderOnly: 'Ця ціна тільки для вас і тільки зараз',
    subscribe: 'Підписатися за €6.49/міс',
    offerValid: 'Пропозиція дійсна 24 години',
    expiredTitle: 'Перейди на Pro',
    regularPrice: '€12.99/міс',
    subscribePro: 'Підписатися',
    tryLite: 'Спробувати Lite за €5.99',
    maybeLater: 'Пізніше',
  },
};

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  suggestedPlan?: 'lite' | 'pro_founding' | 'pro_regular';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { createCheckout } = useSubscription();
  const [processing, setProcessing] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<'none' | 'active' | 'expired'>('none');
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const t = T[language as keyof typeof T] || T.en;

  useEffect(() => {
    if (!open || !user) return;
    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, trial_end, is_founding_member')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) return;
      const p = data as any;
      setIsFoundingMember(!!p.is_founding_member);
      if (p.subscription_status === 'trial') setTrialStatus('active');
      else if (p.subscription_status === 'expired') setTrialStatus('expired');
      else if (!p.trial_end && p.subscription_status !== 'trial') setTrialStatus('none');
      else setTrialStatus('expired');
      setLoaded(true);
    };
    check();
  }, [open, user]);

  const handleStartTrial = async () => {
    if (!user) return;
    setProcessing('trial');
    await supabase.from('profiles').update({
      subscription_plan: 'pro',
      subscription_status: 'trial',
      trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
    } as any).eq('user_id', user.id);
    toast.success(t.trialActivated);
    setProcessing(null);
    onOpenChange(false);
  };

  const handleCheckout = async (plan: 'lite' | 'pro_founding' | 'pro_regular') => {
    setProcessing(plan);
    try {
      await createCheckout(plan);
    } catch {
      toast.error('Checkout failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleViewPlans = () => {
    onOpenChange(false);
    const event = new CustomEvent('open-payments');
    window.dispatchEvent(event);
    // navigate to profile if needed
    if (!window.location.pathname.includes('/profile')) {
      window.location.href = '/profile';
    }
  };

  if (!loaded && open) return null;

  // Determine which view to show
  const showTrialOffer = trialStatus === 'none';
  const showFounderOffer = trialStatus === 'expired' && isFoundingMember;
  const showRegularOffer = trialStatus === 'expired' && !isFoundingMember;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border px-6 pb-8 pt-4 max-w-lg mx-auto">
        {showTrialOffer && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎁</div>
            <DrawerHeader className="p-0">
              <DrawerTitle className="text-xl font-bold text-foreground">{t.tryFreeTitle}</DrawerTitle>
            </DrawerHeader>
            <p className="text-sm text-muted-foreground">{t.tryFreeDesc}</p>
            <Button
              className="w-full gap-2 text-base py-6"
              style={{ backgroundColor: '#7C3AED' }}
              onClick={handleStartTrial}
              disabled={!!processing}
            >
              {processing === 'trial' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
              {t.startTrial}
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleViewPlans}>
              {t.viewPlans}
            </Button>
          </div>
        )}

        {showFounderOffer && (
          <div className="text-center space-y-4">
            <div className="text-5xl">⚡️</div>
            <DrawerHeader className="p-0">
              <DrawerTitle className="text-xl font-bold text-foreground">{t.founderTitle}</DrawerTitle>
            </DrawerHeader>
            <p className="text-sm text-muted-foreground">{t.founderDesc}</p>
            <div className="py-2">
              <span className="text-lg line-through text-muted-foreground mr-2">€12.99</span>
              <span className="text-3xl font-bold" style={{ color: '#7C3AED' }}>{t.founderPrice}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.founderOnly}</p>
            <Button
              className="w-full gap-2 text-base py-6"
              style={{ backgroundColor: '#7C3AED' }}
              onClick={() => handleCheckout('pro_founding')}
              disabled={!!processing}
            >
              {processing === 'pro_founding' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {t.subscribe}
            </Button>
            <p className="text-xs text-amber-600 font-medium">⏳ {t.offerValid}</p>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
              {t.maybeLater}
            </Button>
          </div>
        )}

        {showRegularOffer && (
          <div className="text-center space-y-4">
            <div className="text-5xl">👑</div>
            <DrawerHeader className="p-0">
              <DrawerTitle className="text-xl font-bold text-foreground">{t.expiredTitle}</DrawerTitle>
            </DrawerHeader>
            <p className="text-2xl font-bold text-foreground">{t.regularPrice}</p>
            <Button
              className="w-full gap-2 text-base py-6"
              style={{ backgroundColor: '#7C3AED' }}
              onClick={() => handleCheckout('pro_regular')}
              disabled={!!processing}
            >
              {processing === 'pro_regular' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {t.subscribePro}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleCheckout('lite')}
              disabled={!!processing}
            >
              {processing === 'lite' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t.tryLite}
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
              {t.maybeLater}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default UpgradeModal;
