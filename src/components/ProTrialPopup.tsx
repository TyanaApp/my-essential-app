import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const TRANSLATIONS = {
  en: {
    title: '7 days Pro for free!',
    earlyBirdBadge: '🎉 Your special price €6.49/mo — locked forever',
    feat1: '✨ Unlimited scanning',
    feat2: '🤖 AI recipes for your products',
    feat3: '📊 Personal nutrition analysis',
    feat4: '🔔 Smart notifications',
    feat5: '💰 Savings tracker',
    noCard: 'No card needed. Cancel anytime.',
    tryPro: '🚀 Try Pro for free',
    skip: 'Skip',
    activated: 'Pro activated! 7 days ahead 🎉',
  },
  ru: {
    title: '7 дней Pro бесплатно!',
    earlyBirdBadge: '🎉 Ваша специальная цена €6.49/мес — навсегда',
    feat1: '✨ Безлимитное сканирование',
    feat2: '🤖 ИИ-рецепты под ваши продукты',
    feat3: '📊 Персональный анализ питания',
    feat4: '🔔 Умные уведомления',
    feat5: '💰 Трекер экономии',
    noCard: 'Карта не нужна. Отменить можно в любой момент.',
    tryPro: '🚀 Попробовать Pro бесплатно',
    skip: 'Пропустить',
    activated: 'Pro активирован! 7 дней впереди 🎉',
  },
  lv: {
    title: '7 dienas Pro bez maksas!',
    foundingBadge: '🏆 Jūs esat viens no pirmajiem 1000! Cena €6.49 fiksēta mūžīgi',
    feat1: '✨ Neierobežota skenēšana',
    feat2: '🤖 AI receptes jūsu produktiem',
    feat3: '📊 Personalizēta uztura analīze',
    feat4: '🔔 Gudri paziņojumi',
    feat5: '💰 Ietaupījumu izsekotājs',
    noCard: 'Karte nav vajadzīga. Atceliet jebkurā laikā.',
    tryPro: '🚀 Izmēģināt Pro bez maksas',
    skip: 'Izlaist',
    activated: 'Pro aktivizēts! 7 dienas priekšā 🎉',
  },
  uk: {
    title: '7 днів Pro безкоштовно!',
    foundingBadge: '🏆 Ви один з перших 1000! Ціна €6.49 зафіксована назавжди',
    feat1: '✨ Безлімітне сканування',
    feat2: '🤖 ШІ-рецепти під ваші продукти',
    feat3: '📊 Персональний аналіз харчування',
    feat4: '🔔 Розумні сповіщення',
    feat5: '💰 Трекер заощаджень',
    noCard: 'Картка не потрібна. Скасувати можна в будь-який момент.',
    tryPro: '🚀 Спробувати Pro безкоштовно',
    skip: 'Пропустити',
    activated: 'Pro активовано! 7 днів попереду 🎉',
  },
};

const ProTrialPopup = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const [isFoundingMember, setIsFoundingMember] = useState(false);

  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  useEffect(() => {
    if (!user) return;
    const shown = localStorage.getItem('trial_popup_shown');
    if (shown) return;

    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_founding_member, subscription_status, onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) return;
      const profile = data as any;
      if (!profile.onboarding_completed) return;
      if (profile.subscription_status === 'trial') return; // already on trial

      setIsFoundingMember(!!profile.is_founding_member);
      setShow(true);
    };
    check();
  }, [user]);

  const handleTryPro = async () => {
    if (!user) return;
    await supabase.from('profiles').update({
      subscription_plan: 'pro',
      subscription_status: 'trial',
      trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
    } as any).eq('user_id', user.id);

    localStorage.setItem('trial_popup_shown', '1');
    setShow(false);
    toast.success(t.activated);
  };

  const handleSkip = () => {
    localStorage.setItem('trial_popup_shown', '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' }} />
          <motion.div
            className="relative z-10 w-full max-w-sm text-center text-white"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold mb-3">{t.title}</h2>

            {isFoundingMember && (
              <div className="rounded-xl px-4 py-2 mb-4 text-sm font-medium" style={{ backgroundColor: 'rgba(255,215,0,0.25)', border: '1px solid rgba(255,215,0,0.5)' }}>
                {t.foundingBadge}
              </div>
            )}

            <div className="space-y-2 text-left mb-6 px-4">
              {[t.feat1, t.feat2, t.feat3, t.feat4, t.feat5].map((f, i) => (
                <p key={i} className="text-sm">{f}</p>
              ))}
            </div>

            <p className="text-xs text-white/70 mb-6">{t.noCard}</p>

            <button
              onClick={handleTryPro}
              className="w-full py-4 rounded-2xl text-base font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'white', color: '#7C3AED' }}
            >
              {t.tryPro}
            </button>

            <button onClick={handleSkip} className="mt-4 text-sm text-white/60 hover:text-white/80">
              {t.skip}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProTrialPopup;
