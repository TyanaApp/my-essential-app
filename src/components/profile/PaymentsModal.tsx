import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription, SUBSCRIPTION_PLANS, PlanType } from '@/hooks/useSubscription';
import { Check, X, Sparkles, Crown, Loader2, ExternalLink, Gift, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const T = {
  en: {
    choosePlan: 'Choose your plan',
    currentPlan: 'Your current plan',
    trialBanner: '🎁 Pro trial',
    trialDaysLeft: 'days left',
    freeBanner: 'Free plan',
    liteBanner: '✅ TYANA Lite • €5.99/mo',
    proFounderBanner: '⭐️ TYANA Pro • €6.49/mo forever',
    proFounderSubtext: "You're among the first TYANA users",
    proRegularBanner: '✅ TYANA Pro • €12.99/mo',
    free: 'Free',
    freePrice: '€0',
    freeFeatures: [
      '5 scans/month',
      '3 recipes/day',
      'Shopping list',
      'Calorie tracking (today only)',
    ],
    freeAnti: ['Nutrition history', 'AI analysis', 'Family mode'],
    liteTitle: 'TYANA Lite',
    litePrice: '€5.99',
    liteFeatures: [
      '15 scans/month',
      'Unlimited recipes',
      '30-day nutrition history',
      'Calories + macros tracking',
      'Priority support',
    ],
    liteAnti: ['Unlimited scans', 'Family mode', 'Advanced AI analysis'],
    proTitle: 'TYANA Pro',
    proFeatures: [
      'Unlimited scans',
      'Unlimited recipes',
      'Full nutrition history',
      'Advanced AI analysis',
      'Family mode',
      'Weekly reports',
      'Priority support',
    ],
    yourSpecialPrice: '⭐️ Your special price',
    lockedForever: 'Price locked forever',
    yourPlan: 'Your current plan',
    startTrial: 'Start 7 days free',
    getProSubscribe: '🚀 Get Pro — €6.49/mo',
    getProRegular: '🚀 Get Pro — €12.99/mo',
    getLite: 'Get Lite — €5.99/mo',
    switchToFree: 'Switch to Free',
    switchToLite: 'Switch to Lite',
    switchToPro: 'Switch to Pro',
    downgrade: 'Downgrade',
    spotsLeft: 'spots left at special price',
    manageTitle: 'Manage subscription',
    paymentHistory: '📋 Payment history',
    cancelSub: '❌ Cancel subscription',
    cancelNote: 'After cancellation, access remains until the end of the paid period',
    perMonth: '/mo',
    redirecting: 'Redirecting to checkout...',
    failedCheckout: 'Failed to start checkout',
    failedPortal: 'Failed to open billing portal',
    cancelAnytime: 'Cancel anytime · Secure payment via Stripe',
  },
  ru: {
    choosePlan: 'Выбери план',
    currentPlan: 'Ваш текущий план',
    trialBanner: '🎁 Пробный период Pro',
    trialDaysLeft: 'дней осталось',
    freeBanner: 'Бесплатный план',
    liteBanner: '✅ TYANA Lite • €5.99/мес',
    proFounderBanner: '⭐️ TYANA Pro • €6.49/мес навсегда',
    proFounderSubtext: 'Вы в числе первых пользователей TYANA',
    proRegularBanner: '✅ TYANA Pro • €12.99/мес',
    free: 'Бесплатно',
    freePrice: '€0',
    freeFeatures: [
      '5 сканирований в месяц',
      '3 рецепта в день',
      'Список покупок',
      'Трекинг калорий (только сегодня)',
    ],
    freeAnti: ['История питания', 'ИИ-анализ', 'Семейный режим'],
    liteTitle: 'TYANA Lite',
    litePrice: '€5.99',
    liteFeatures: [
      '15 сканирований в месяц',
      'Рецепты без лимита',
      'История питания 30 дней',
      'Трекинг калорий + макросы',
      'Приоритетная поддержка',
    ],
    liteAnti: ['Безлимитные сканирования', 'Семейный режим', 'Продвинутый ИИ-анализ'],
    proTitle: 'TYANA Pro',
    proFeatures: [
      'Безлимитные сканирования',
      'Рецепты без лимита',
      'Полная история питания',
      'Продвинутый ИИ-анализ',
      'Семейный режим',
      'Еженедельные отчёты',
      'Приоритетная поддержка',
    ],
    yourSpecialPrice: '⭐️ Ваша специальная цена',
    lockedForever: 'Цена зафиксирована навсегда',
    yourPlan: 'Ваш текущий план',
    startTrial: 'Начать 7 дней бесплатно',
    getProSubscribe: '🚀 Оформить Pro — €6.49/мес',
    getProRegular: '🚀 Перейти на Pro — €6.49/мес',
    getLite: 'Перейти на Lite — €4.99/мес',
    switchToFree: 'Перейти на бесплатный',
    switchToLite: 'Перейти на Lite',
    switchToPro: 'Перейти на Pro',
    downgrade: 'Понизить план',
    spotsLeft: 'мест осталось по специальной цене',
    manageTitle: 'Управление подпиской',
    paymentHistory: '📋 История платежей',
    cancelSub: '❌ Отменить подписку',
    cancelNote: 'При отмене доступ сохраняется до конца оплаченного периода',
    perMonth: '/мес',
    redirecting: 'Переход к оплате...',
    failedCheckout: 'Не удалось начать оплату',
    failedPortal: 'Не удалось открыть портал',
    cancelAnytime: 'Отмена в любое время · Безопасная оплата через Stripe',
  },
  lv: {
    choosePlan: 'Izvēlies plānu',
    currentPlan: 'Jūsu pašreizējais plāns',
    trialBanner: '🎁 Pro izmēģinājums',
    trialDaysLeft: 'dienas atlikušas',
    freeBanner: 'Bezmaksas plāns',
    liteBanner: '✅ TYANA Lite • €5.99/mēn',
    proFounderBanner: '⭐️ TYANA Pro • €6.49/mēn uz visiem laikiem',
    proFounderSubtext: 'Jūs esat starp pirmajiem TYANA lietotājiem',
    proRegularBanner: '✅ TYANA Pro • €12.99/mēn',
    free: 'Bezmaksas',
    freePrice: '€0',
    freeFeatures: [
      '5 skenēšanas mēnesī',
      '3 receptes dienā',
      'Iepirkumu saraksts',
      'Kaloriju izsekošana (tikai šodien)',
    ],
    freeAnti: ['Uztura vēsture', 'AI analīze', 'Ģimenes režīms'],
    liteTitle: 'TYANA Lite',
    litePrice: '€5.99',
    liteFeatures: [
      '15 skenēšanas mēnesī',
      'Neierobežotas receptes',
      'Uztura vēsture 30 dienas',
      'Kalorijas + makro izsekošana',
      'Prioritārs atbalsts',
    ],
    liteAnti: ['Neierobežotas skenēšanas', 'Ģimenes režīms', 'Uzlabota AI analīze'],
    proTitle: 'TYANA Pro',
    proFeatures: [
      'Neierobežotas skenēšanas',
      'Neierobežotas receptes',
      'Pilna uztura vēsture',
      'Uzlabota AI analīze',
      'Ģimenes režīms',
      'Iknedēļas pārskati',
      'Prioritārs atbalsts',
    ],
    yourSpecialPrice: '⭐️ Jūsu īpašā cena',
    lockedForever: 'Cena fiksēta uz visiem laikiem',
    yourPlan: 'Jūsu pašreizējais plāns',
    startTrial: 'Sākt 7 dienas bezmaksas',
    getProSubscribe: '🚀 Iegūt Pro — €6.49/mēn',
    getProRegular: '🚀 Pāriet uz Pro — €6.49/mēn',
    getLite: 'Iegūt Lite — €4.99/mēn',
    switchToFree: 'Pāriet uz bezmaksas',
    switchToLite: 'Pāriet uz Lite',
    switchToPro: 'Pāriet uz Pro',
    downgrade: 'Pazemināt plānu',
    spotsLeft: 'vietas atlikušas par īpašo cenu',
    manageTitle: 'Pārvaldīt abonementu',
    paymentHistory: '📋 Maksājumu vēsture',
    cancelSub: '❌ Atcelt abonementu',
    cancelNote: 'Pēc atcelšanas piekļuve saglabājas līdz apmaksātā perioda beigām',
    perMonth: '/mēn',
    redirecting: 'Pārvirzīšana uz norēķinu...',
    failedCheckout: 'Neizdevās sākt norēķinu',
    failedPortal: 'Neizdevās atvērt portālu',
    cancelAnytime: 'Atceliet jebkurā laikā · Droši maksājumi caur Stripe',
  },
  uk: {
    choosePlan: 'Обери план',
    currentPlan: 'Ваш поточний план',
    trialBanner: '🎁 Пробний період Pro',
    trialDaysLeft: 'днів залишилось',
    freeBanner: 'Безкоштовний план',
    liteBanner: '✅ TYANA Lite • €5.99/міс',
    proFounderBanner: '⭐️ TYANA Pro • €6.49/міс назавжди',
    proFounderSubtext: 'Ви серед перших користувачів TYANA',
    proRegularBanner: '✅ TYANA Pro • €12.99/міс',
    free: 'Безкоштовно',
    freePrice: '€0',
    freeFeatures: [
      '5 сканувань на місяць',
      '3 рецепти на день',
      'Список покупок',
      'Трекінг калорій (тільки сьогодні)',
    ],
    freeAnti: ['Історія харчування', 'ШІ-аналіз', 'Сімейний режим'],
    liteTitle: 'TYANA Lite',
    litePrice: '€5.99',
    liteFeatures: [
      '15 сканувань на місяць',
      'Рецепти без ліміту',
      'Історія харчування 30 днів',
      'Трекінг калорій + макроси',
      'Пріоритетна підтримка',
    ],
    liteAnti: ['Безлімітні сканування', 'Сімейний режим', 'Просунутий ШІ-аналіз'],
    proTitle: 'TYANA Pro',
    proFeatures: [
      'Безлімітні сканування',
      'Рецепти без ліміту',
      'Повна історія харчування',
      'Просунутий ШІ-аналіз',
      'Сімейний режим',
      'Щотижневі звіти',
      'Пріоритетна підтримка',
    ],
    yourSpecialPrice: '⭐️ Ваша спеціальна ціна',
    lockedForever: 'Ціна зафіксована назавжди',
    yourPlan: 'Ваш поточний план',
    startTrial: 'Почати 7 днів безкоштовно',
    getProSubscribe: '🚀 Оформити Pro — €6.49/міс',
    getProRegular: '🚀 Перейти на Pro — €6.49/міс',
    getLite: 'Перейти на Lite — €4.99/міс',
    switchToFree: 'Перейти на безкоштовний',
    switchToLite: 'Перейти на Lite',
    switchToPro: 'Перейти на Pro',
    downgrade: 'Знизити план',
    spotsLeft: 'місць залишилось за спеціальною ціною',
    manageTitle: 'Управління підпискою',
    paymentHistory: '📋 Історія платежів',
    cancelSub: '❌ Скасувати підписку',
    cancelNote: 'Після скасування доступ зберігається до кінця оплаченого періоду',
    perMonth: '/міс',
    redirecting: 'Перехід до оплати...',
    failedCheckout: 'Не вдалося почати оплату',
    failedPortal: 'Не вдалося відкрити портал',
    cancelAnytime: 'Скасування в будь-який час · Безпечна оплата через Stripe',
  },
};

const PaymentsModal: React.FC<PaymentsModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language as keyof typeof T] || T.en;
  const { subscribed, plan, subscriptionEnd, loading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [processingPortal, setProcessingPortal] = useState(false);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [trialUsed, setTrialUsed] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState(0);
  const [earlyBirdActive, setEarlyBirdActive] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    checkSubscription();

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_founding_member, subscription_plan, subscription_status, trial_end, trial_used')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setIsFoundingMember(!!profile.is_founding_member);
        setSubscriptionStatus(profile.subscription_status || 'free');
        setTrialUsed(!!profile.trial_used);

        if (profile.subscription_status === 'trial' && profile.trial_end) {
          const days = Math.max(0, Math.ceil((new Date(profile.trial_end).getTime() - Date.now()) / 86400000));
          setTrialDaysLeft(days);
        }
      }

      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'total_registered_users')
        .maybeSingle();

      if (settings) {
        const totalUsers = parseInt(settings.value) || 0;
        const spots = Math.max(0, 1000 - totalUsers);
        setSpotsLeft(spots);
        setEarlyBirdActive(totalUsers < 1000);
      }
    };
    loadProfile();
  }, [open, user]);

  const handleSubscribe = async (planKey: 'lite' | 'pro_founding' | 'pro_regular') => {
    setProcessingPlan(planKey);
    try {
      await createCheckout(planKey);
      toast.success(t.redirecting);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t.failedCheckout);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setProcessingPortal(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error(t.failedPortal);
    } finally {
      setProcessingPortal(false);
    }
  };

  // Determine which pro price to show
  const showFounderPrice = isFoundingMember || earlyBirdActive;
  const proPrice = showFounderPrice ? '€6.49' : '€12.99';
  const proPlanKey = showFounderPrice ? 'pro_founding' : 'pro_regular';

  // Determine current status banner
  const renderStatusBanner = () => {
    if (subscriptionStatus === 'trial' && trialDaysLeft > 0) {
      const progress = ((7 - trialDaysLeft) / 7) * 100;
      return (
        <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30">
          <p className="text-sm font-bold text-primary">{t.trialBanner}</p>
          <p className="text-xs text-muted-foreground mt-1">{trialDaysLeft} {t.trialDaysLeft}</p>
          <Progress value={progress} className="mt-2 h-1.5" />
        </div>
      );
    }
    if (plan === 'lite') {
      return (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{t.liteBanner}</p>
        </div>
      );
    }
    if (plan === 'pro_founding') {
      return (
        <div className="p-4 rounded-2xl border-2" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1))', borderColor: 'rgba(245,158,11,0.4)' }}>
          <p className="text-sm font-bold" style={{ color: '#B45309' }}>{t.proFounderBanner}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.proFounderSubtext}</p>
        </div>
      );
    }
    if (plan === 'pro_regular') {
      return (
        <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30">
          <p className="text-sm font-bold text-primary">{t.proRegularBanner}</p>
        </div>
      );
    }
    return (
      <div className="p-4 rounded-2xl bg-secondary border-2 border-border">
        <p className="text-sm font-bold text-muted-foreground">{t.freeBanner}</p>
      </div>
    );
  };

  const isPro = plan === 'pro_founding' || plan === 'pro_regular';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-bold text-foreground flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t.choosePlan}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* Current plan banner */}
          {renderStatusBanner()}

          {/* Spots left urgency banner */}
          {showFounderPrice && spotsLeft > 0 && spotsLeft < 200 && !isPro && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-destructive/10 border border-destructive/30">
              <Flame className="w-4 h-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive">
                🔥 {spotsLeft} {t.spotsLeft}
              </span>
            </div>
          )}

          {/* FREE card */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${plan === 'free' && subscriptionStatus !== 'trial' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">{t.free}</h3>
                <p className="text-2xl font-bold text-foreground">{t.freePrice}</p>
              </div>
              {plan === 'free' && subscriptionStatus !== 'trial' && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t.yourPlan}</Badge>
              )}
            </div>
            <div className="space-y-1.5 mb-3">
              {t.freeFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                </div>
              ))}
              {t.freeAnti.map((f, i) => (
                <div key={`anti-${i}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <X className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" /> {f}
                </div>
              ))}
            </div>
            {plan === 'free' && subscriptionStatus !== 'trial' ? (
              <Button variant="outline" size="sm" className="w-full" disabled>{t.yourPlan}</Button>
            ) : (plan !== 'free' || subscriptionStatus === 'trial') ? (
              <Button variant="outline" size="sm" className="w-full text-muted-foreground" onClick={handleManageSubscription} disabled={processingPortal}>
                {t.switchToFree}
              </Button>
            ) : null}
          </div>

          {/* LITE card */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${plan === 'lite' ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">{t.liteTitle}</h3>
                <p className="text-2xl font-bold text-primary">
                  {t.litePrice}<span className="text-xs font-normal text-muted-foreground">{t.perMonth}</span>
                </p>
              </div>
              {plan === 'lite' && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t.yourPlan}</Badge>
              )}
            </div>
            <div className="space-y-1.5 mb-3">
              {t.liteFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                </div>
              ))}
              {t.liteAnti.map((f, i) => (
                <div key={`anti-${i}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <X className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" /> {f}
                </div>
              ))}
            </div>
            {plan === 'lite' ? (
              <Button variant="outline" size="sm" className="w-full" disabled>{t.yourPlan} ✓</Button>
            ) : (
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => handleSubscribe('lite')}
                disabled={!!processingPlan}
              >
                {processingPlan === 'lite' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {subscriptionStatus === 'trial' ? t.switchToLite : plan === 'pro_founding' || plan === 'pro_regular' ? t.switchToLite : t.getLite}
              </Button>
            )}
          </div>

          {/* PRO card */}
          <div className={`p-4 rounded-2xl border-2 transition-all relative ${
            isPro
              ? 'border-amber-400 dark:border-amber-600'
              : showFounderPrice
                ? 'border-amber-300 dark:border-amber-700'
                : 'border-primary'
          }`} style={showFounderPrice && !isPro ? {
            background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(217,119,6,0.08))',
          } : undefined}>
            {/* Special price badge for early bird */}
            {showFounderPrice && !isPro && (
              <Badge className="absolute -top-3 right-4 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 text-[10px]">
                {t.yourSpecialPrice}
              </Badge>
            )}

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">{t.proTitle}</h3>
                <div className="flex items-baseline gap-2">
                  {showFounderPrice && (
                    <span className="text-sm line-through text-muted-foreground">€12.99</span>
                  )}
                  <p className="text-2xl font-bold" style={{ color: showFounderPrice ? '#B45309' : 'hsl(var(--primary))' }}>
                    {proPrice}<span className="text-xs font-normal text-muted-foreground">{t.perMonth}</span>
                  </p>
                </div>
                {showFounderPrice && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">{t.lockedForever}</p>
                )}
              </div>
              {isPro && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t.yourPlan} ✓</Badge>
              )}
            </div>

            <div className="space-y-1.5 mb-3">
              {t.proFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                </div>
              ))}
            </div>

            {isPro ? (
              <Button variant="outline" size="sm" className="w-full border-amber-300 text-amber-700" disabled>
                {t.yourPlan} ✓
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full text-white"
                style={{ background: showFounderPrice ? 'linear-gradient(135deg, #D97706, #B45309)' : 'linear-gradient(135deg, hsl(var(--primary)), #7C3AED)' }}
                onClick={() => handleSubscribe(proPlanKey)}
                disabled={!!processingPlan}
              >
                {processingPlan === proPlanKey ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {subscriptionStatus === 'trial' ? t.getProSubscribe : trialUsed ? t.getProRegular : plan === 'free' ? t.startTrial : t.switchToPro}
              </Button>
            )}
          </div>

          {/* Manage subscription section */}
          {subscribed && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-sm font-semibold text-foreground">{t.manageTitle}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleManageSubscription}
                disabled={processingPortal}
              >
                {processingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {t.paymentHistory}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={handleManageSubscription}
                disabled={processingPortal}
              >
                {t.cancelSub}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">{t.cancelNote}</p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-2">{t.cancelAnytime}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentsModal;
