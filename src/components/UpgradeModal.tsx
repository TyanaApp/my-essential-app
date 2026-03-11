import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Gift, Zap, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const T = {
  en: {
    tryFreeTitle: '🎁 Try Pro free for 7 days',
    tryFreeDesc: 'No card needed. Just try it.',
    startTrial: 'Start free trial',
    trialActivated: 'Pro activated! 7 days ahead 🎉',
    maybeLater: 'Maybe later',
    currentPlan: 'Current plan',
    subscribe: 'Subscribe',
    manageSub: 'Manage subscription',
    downgradeToFree: 'Downgrade to Free',
    switchToLite: 'Switch to Lite — €4.99/mo',
    downgradeToLite: 'Downgrade to Lite',
    getLite: 'Get Lite — €4.99/mo',
    getPro: '🚀 Get Pro — €6.49/mo',
    tryPro7: '🚀 Try Pro free for 7 days',
    getProSubscribe: '🚀 Subscribe to Pro — €6.49/mo',
    freeName: 'Free', freeTag: 'Try it',
    liteName: 'Lite', liteTag: 'For yourself',
    proName: 'Pro', proTag: '🌟 Best value',
    foundingTag: '🌟 Early access price',
    spotsLeft: 'spots left', forever: 'forever', perMonth: '/mo',
    fProducts: 'products', fShopping: 'shopping items', fAiDaily: 'AI requests/day',
    fRecipesDaily: 'recipes/day', fFridgeScans: 'fridge scan', fBarcode: 'barcode scans',
    fReceipts: 'receipt scans', fDiary: 'diary history', fWorkouts: 'Workouts',
    fFamily: 'Family mode', fMealPlan: 'Meal plan', fAnalytics: 'Analytics',
    fEmail: 'Email reports', fPriority: 'Priority support',
    todayOnly: 'Today only', days: 'days', unlimited: 'Unlimited', basic: 'Basic', full: 'Full',
  },
  ru: {
    tryFreeTitle: '🎁 Попробуй Pro бесплатно 7 дней',
    tryFreeDesc: 'Карта не нужна. Просто попробуй.',
    startTrial: 'Начать бесплатный trial',
    trialActivated: 'Pro активирован! 7 дней впереди 🎉',
    maybeLater: 'Позже',
    currentPlan: 'Текущий план',
    subscribe: 'Подписаться',
    manageSub: 'Управлять подпиской',
    downgradeToFree: 'Перейти на Free',
    switchToLite: 'Перейти на Lite — €4.99/мес',
    downgradeToLite: 'Понизить до Lite',
    getLite: 'Перейти на Lite — €4.99/мес',
    getPro: '🚀 Перейти на Pro — €6.49/мес',
    tryPro7: '🚀 Попробовать Pro 7 дней бесплатно',
    getProSubscribe: '🚀 Оформить Pro — €6.49/мес',
    freeName: 'Free', freeTag: 'Попробовать',
    liteName: 'Lite', liteTag: 'Для себя',
    proName: 'Pro', proTag: '🌟 Лучший выбор',
    foundingTag: '🌟 Цена раннего доступа',
    spotsLeft: 'мест осталось', forever: 'навсегда', perMonth: '/мес',
    fProducts: 'продуктов', fShopping: 'покупок', fAiDaily: 'ИИ-запросов/день',
    fRecipesDaily: 'рецептов/день', fFridgeScans: 'скан холодильника', fBarcode: 'сканов штрихкодов',
    fReceipts: 'сканов чеков', fDiary: 'история дневника', fWorkouts: 'Тренировки',
    fFamily: 'Семейный режим', fMealPlan: 'План питания', fAnalytics: 'Аналитика',
    fEmail: 'Отчёты на email', fPriority: 'Приоритетная поддержка',
    todayOnly: 'Только сегодня', days: 'дней', unlimited: 'Безлимитно', basic: 'Базовая', full: 'Полная',
  },
  lv: {
    tryFreeTitle: '🎁 Izmēģini Pro bez maksas 7 dienas',
    tryFreeDesc: 'Karte nav vajadzīga. Vienkārši izmēģini.',
    startTrial: 'Sākt bezmaksas izmēģinājumu',
    trialActivated: 'Pro aktivizēts! 7 dienas priekšā 🎉',
    maybeLater: 'Varbūt vēlāk',
    currentPlan: 'Pašreizējais plāns',
    subscribe: 'Abonēt',
    manageSub: 'Pārvaldīt abonementu',
    downgradeToFree: 'Pāriet uz Free',
    switchToLite: 'Pāriet uz Lite — €4.99/mēn',
    downgradeToLite: 'Pazemināt uz Lite',
    getLite: 'Iegūt Lite — €4.99/mēn',
    getPro: '🚀 Iegūt Pro — €6.49/mēn',
    tryPro7: '🚀 Izmēģināt Pro 7 dienas bezmaksas',
    getProSubscribe: '🚀 Iegūt Pro — €6.49/mēn',
    freeName: 'Free', freeTag: 'Izmēģināt',
    liteName: 'Lite', liteTag: 'Sev',
    proName: 'Pro', proTag: '🌟 Labākā vērtība',
    foundingTag: '🌟 Agrīnā piekļuves cena',
    spotsLeft: 'vietas atlikušas', forever: 'uz visiem laikiem', perMonth: '/mēn',
    fProducts: 'produkti', fShopping: 'iepirkumu preces', fAiDaily: 'AI pieprasījumi/dienā',
    fRecipesDaily: 'receptes/dienā', fFridgeScans: 'ledusskapja skenēšana', fBarcode: 'svītrkodu skenēšanas',
    fReceipts: 'čeku skenēšanas', fDiary: 'dienasgrāmatas vēsture', fWorkouts: 'Treniņi',
    fFamily: 'Ģimenes režīms', fMealPlan: 'Ēdienreižu plāns', fAnalytics: 'Analītika',
    fEmail: 'E-pasta atskaites', fPriority: 'Prioritārais atbalsts',
    todayOnly: 'Tikai šodien', days: 'dienas', unlimited: 'Neierobežoti', basic: 'Pamata', full: 'Pilna',
  },
  uk: {
    tryFreeTitle: '🎁 Спробуй Pro безкоштовно 7 днів',
    tryFreeDesc: 'Картка не потрібна. Просто спробуй.',
    startTrial: 'Почати безкоштовний trial',
    trialActivated: 'Pro активовано! 7 днів попереду 🎉',
    maybeLater: 'Пізніше',
    currentPlan: 'Поточний план',
    subscribe: 'Підписатися',
    manageSub: 'Керувати підпискою',
    downgradeToFree: 'Перейти на Free',
    switchToLite: 'Перейти на Lite — €4.99/міс',
    downgradeToLite: 'Знизити до Lite',
    getLite: 'Перейти на Lite — €4.99/міс',
    getPro: '🚀 Перейти на Pro — €6.49/міс',
    tryPro7: '🚀 Спробувати Pro 7 днів безкоштовно',
    getProSubscribe: '🚀 Оформити Pro — €6.49/міс',
    freeName: 'Free', freeTag: 'Спробувати',
    liteName: 'Lite', liteTag: 'Для себе',
    proName: 'Pro', proTag: '🌟 Найкращий вибір',
    foundingTag: '🌟 Ціна раннього доступу',
    spotsLeft: 'місць залишилось', forever: 'назавжди', perMonth: '/міс',
    fProducts: 'продуктів', fShopping: 'покупок', fAiDaily: 'ШІ-запитів/день',
    fRecipesDaily: 'рецептів/день', fFridgeScans: 'скан холодильника', fBarcode: 'сканів штрихкодів',
    fReceipts: 'сканів чеків', fDiary: 'історія щоденника', fWorkouts: 'Тренування',
    fFamily: 'Сімейний режим', fMealPlan: 'План харчування', fAnalytics: 'Аналітика',
    fEmail: 'Звіти на email', fPriority: 'Пріоритетна підтримка',
    todayOnly: 'Тільки сьогодні', days: 'днів', unlimited: 'Безлімітно', basic: 'Базова', full: 'Повна',
  },
};

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { createCheckout, openCustomerPortal, plan: currentStripePlan } = useSubscription();
  const [processing, setProcessing] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const t = T[language as keyof typeof T] || T.en;

  useEffect(() => {
    if (!open || !user) return;
    const check = async () => {
      const [profileRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('subscription_status, subscription_plan, trial_end, is_founding_member, trial_used').eq('user_id', user.id).maybeSingle(),
        supabase.from('app_settings').select('value').eq('key', 'total_registered_users').maybeSingle(),
      ]);
      if (profileRes.data) {
        const p = profileRes.data as any;
        setIsFoundingMember(!!p.is_founding_member);
        const plan = p.subscription_plan || 'free';
        setCurrentPlan(plan);
        setSubscriptionStatus(p.subscription_status || 'free');
        setIsOnTrial(p.subscription_status === 'trial');
        setTrialUsed(!!p.trial_used);
      }
      if (settingsRes.data) {
        const count = parseInt(settingsRes.data.value) || 0;
        setSpotsLeft(Math.max(0, 1000 - count));
      }
      setLoaded(true);
    };
    check();
  }, [open, user]);

  const handleStartTrial = async () => {
    if (!user) return;
    setProcessing('trial');
    try {
      const { error } = await supabase.rpc('activate_trial');
      if (error) throw error;
      toast.success(t.trialActivated);
      onOpenChange(false);
    } catch (e: any) {
      console.error('Trial error:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleCheckout = async (plan: 'lite' | 'pro_founding' | 'pro_regular') => {
    setProcessing(plan);
    try {
      await createCheckout(plan);
    } catch { /* fallback */ } finally {
      setProcessing(null);
    }
  };

  if (!loaded && open) return null;

  const isPaid = currentStripePlan !== 'free' && currentStripePlan !== undefined;
  const isOnPro = currentPlan === 'pro' || currentPlan === 'pro_founding';
  const isOnLite = currentPlan === 'lite';
  const isOnFree = !isOnPro && !isOnLite;

  // Determine button for each plan card
  const getPlanButton = (planKey: string) => {
    if (planKey === 'free') {
      if (isOnFree && !isOnTrial) {
        return { text: t.currentPlan, disabled: true, style: 'gray' as const };
      }
      if (isOnTrial || isOnLite || isOnPro) {
        return { text: t.downgradeToFree, disabled: false, style: 'outline' as const };
      }
    }
    if (planKey === 'lite') {
      if (isOnLite) {
        return { text: t.currentPlan, disabled: true, style: 'gray' as const };
      }
      if (isOnTrial) {
        return { text: t.switchToLite, disabled: false, style: 'outline' as const };
      }
      if (isOnPro) {
        return { text: t.downgradeToLite, disabled: false, style: 'outline' as const };
      }
      return { text: t.getLite, disabled: false, style: 'violet' as const };
    }
    if (planKey === 'pro') {
      if (isOnPro && !isOnTrial) {
        return { text: t.currentPlan, disabled: true, style: 'gray' as const };
      }
      if (isOnTrial) {
        // User is ON trial — show subscribe button, NOT trial button
        return { text: t.getProSubscribe, disabled: false, style: 'violet' as const };
      }
      if (trialUsed) {
        // Trial already used — no free trial option
        return { text: t.getPro, disabled: false, style: 'violet' as const };
      }
      // Free user, trial NOT used — show trial offer
      return { text: t.tryPro7, disabled: false, style: 'violet' as const };
    }
    return { text: t.subscribe, disabled: false, style: 'violet' as const };
  };

  // Show trial banner ONLY when: Free plan AND trial NOT used AND NOT on trial
  const showTrialBanner = isOnFree && !trialUsed && !isOnTrial;

  const FeatureRow = ({ has, label }: { has: boolean | string; label: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {has ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
      <span className={has ? 'text-foreground' : 'text-muted-foreground/60'}>{typeof has === 'string' ? `${has} ${label}` : label}</span>
    </div>
  );

  const plans = [
    {
      key: 'free', name: t.freeName, tag: t.freeTag, price: '€0',
      features: [
        { has: '15', label: t.fProducts }, { has: '10', label: t.fShopping },
        { has: '3', label: t.fAiDaily }, { has: '1', label: t.fRecipesDaily },
        { has: '1', label: t.fFridgeScans }, { has: '3', label: t.fBarcode },
        { has: false, label: t.fReceipts }, { has: t.todayOnly, label: t.fDiary },
        { has: false, label: t.fWorkouts }, { has: false, label: t.fFamily },
        { has: false, label: t.fMealPlan }, { has: false, label: t.fAnalytics },
      ],
    },
    {
      key: 'lite', name: t.liteName, tag: t.liteTag, price: '€4.99',
      features: [
        { has: '100', label: t.fProducts }, { has: t.unlimited, label: t.fShopping },
        { has: '10', label: t.fAiDaily }, { has: '5', label: t.fRecipesDaily },
        { has: '10', label: `${t.fFridgeScans}/mo` }, { has: t.unlimited, label: t.fBarcode },
        { has: '10', label: `${t.fReceipts}/mo` }, { has: `30 ${t.days}`, label: t.fDiary },
        { has: true, label: t.fWorkouts }, { has: false, label: t.fFamily },
        { has: false, label: t.fMealPlan }, { has: `${t.basic} (7d)`, label: t.fAnalytics },
      ],
    },
    {
      key: 'pro', name: t.proName, tag: isFoundingMember ? t.foundingTag : t.proTag,
      price: isFoundingMember ? '€6.49' : '€9.99',
      originalPrice: isFoundingMember ? '€9.99' : undefined,
      features: [
        { has: t.unlimited, label: t.fProducts }, { has: t.unlimited, label: t.fShopping },
        { has: t.unlimited, label: t.fAiDaily }, { has: t.unlimited, label: t.fRecipesDaily },
        { has: t.unlimited, label: t.fFridgeScans }, { has: t.unlimited, label: t.fBarcode },
        { has: t.unlimited, label: t.fReceipts }, { has: t.unlimited, label: t.fDiary },
        { has: true, label: t.fWorkouts }, { has: true, label: t.fFamily },
        { has: true, label: t.fMealPlan }, { has: `${t.full}`, label: t.fAnalytics },
      ],
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border px-4 pb-8 pt-4 max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        {/* Trial offer banner — ONLY for free users who haven't used trial */}
        {showTrialBanner && (
          <div className="text-center mb-6 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--accent)/0.1))' }}>
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-lg font-bold text-foreground">{t.tryFreeTitle}</h3>
            <p className="text-sm text-muted-foreground mb-3">{t.tryFreeDesc}</p>
            <Button
              className="w-full text-base py-5 text-white"
              style={{ backgroundColor: '#7C3AED' }}
              onClick={handleStartTrial}
              disabled={!!processing}
            >
              {processing === 'trial' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Gift className="w-5 h-5 mr-2" />}
              {t.startTrial}
            </Button>
          </div>
        )}

        {/* Plan cards */}
        <div className="space-y-4">
          {plans.map((p) => {
            const isCurrent = (p.key === 'free' && isOnFree && !isOnTrial) ||
              (p.key === 'lite' && isOnLite) ||
              (p.key === 'pro' && isOnPro && !isOnTrial);
            const btn = getPlanButton(p.key);

            return (
              <div
                key={p.key}
                className="rounded-2xl border-2 p-4 transition-all"
                style={{
                  borderColor: isCurrent ? '#7C3AED' : 'hsl(var(--border))',
                  background: isCurrent ? 'hsl(var(--primary)/0.03)' : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs text-muted-foreground">{p.tag}</span>
                    <h4 className="text-lg font-bold text-foreground">{p.name}</h4>
                  </div>
                  <div className="text-right">
                    {p.originalPrice && (
                      <span className="text-sm line-through text-muted-foreground mr-1">{p.originalPrice}</span>
                    )}
                    <span className="text-2xl font-bold" style={{ color: p.key !== 'free' ? '#7C3AED' : undefined }}>
                      {p.price}
                    </span>
                    {p.key !== 'free' && <span className="text-sm text-muted-foreground">{t.perMonth}</span>}
                  </div>
                </div>

                {p.key === 'pro' && isFoundingMember && spotsLeft !== null && (
                  <p className="text-xs text-green-600 font-medium mb-2">
                    {spotsLeft} {t.spotsLeft} · {t.forever}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-1 mb-3">
                  {p.features.map((f, i) => (
                    <FeatureRow key={i} has={f.has} label={f.label} />
                  ))}
                </div>

                {/* Button logic */}
                {btn.disabled ? (
                  <div className="text-center">
                    {isPaid && p.key !== 'free' ? (
                      <Button variant="outline" className="w-full" onClick={() => openCustomerPortal()}>
                        {t.manageSub}
                      </Button>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">✓ {btn.text}</span>
                    )}
                  </div>
                ) : p.key !== 'free' ? (
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: btn.style === 'violet' ? '#7C3AED' : undefined }}
                    variant={btn.style === 'outline' ? 'outline' : 'default'}
                    onClick={() => {
                      // For pro card: if user hasn't used trial and is on free plan, start trial
                      if (p.key === 'pro' && !trialUsed && isOnFree && !isOnTrial) {
                        handleStartTrial();
                      } else if (p.key === 'lite') {
                        handleCheckout('lite');
                      } else {
                        handleCheckout(isFoundingMember ? 'pro_founding' : 'pro_regular');
                      }
                    }}
                    disabled={!!processing}
                  >
                    {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {p.key !== 'free' && btn.style === 'violet' && <Zap className="w-4 h-4 mr-1" />}
                    {btn.text}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        <button onClick={() => onOpenChange(false)} className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-foreground">
          {t.maybeLater}
        </button>
      </DrawerContent>
    </Drawer>
  );
};

export default UpgradeModal;
