import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { triggerInstallPrompt, canInstall } from '@/components/InstallBanner';
import { useIsStandalone } from '@/hooks/useStandalone';
import { useIsMobile } from '@/hooks/use-mobile';

type BrowserType = 'android-chrome' | 'ios-safari' | 'ios-other' | 'android-auto';

const detectBrowser = (): BrowserType => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);

  if (canInstall()) return 'android-auto';
  if (isIOS && isSafari) return 'ios-safari';
  if (isIOS) return 'ios-other';
  return 'android-chrome';
};

const getLanguage = (): 'en' | 'ru' | 'lv' => {
  const stored = localStorage.getItem('tyana_language');
  if (stored === 'ru' || stored === 'lv' || stored === 'en') return stored;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('lv')) return 'lv';
  return 'en';
};

const texts = {
  en: {
    title: '📱 Add TYANA to your phone',
    subtitle: "So I'm always at your fingertips — like a regular app!",
    step1: "You're almost there! 😊",
    androidStep2: 'Tap the three dots ⋮ in the top-right corner',
    androidStep3: 'Select "Add to Home screen" or "Install app"',
    androidStep4: 'Tap "Install" ✓',
    androidDone: "Done! Open TYANA from your home screen 🎉",
    iosStep2: 'Tap the Share button at the bottom',
    iosStep2hint: '(square with arrow up ↑□)',
    iosStep3: 'Scroll down the list',
    iosStep4: 'Tap "Add to Home Screen" 🏠',
    iosStep5: 'Tap "Add" in the top-right corner',
    iosDone: "Done! TYANA will appear on your screen 🎉",
    otherBrowser: 'To install, open this page in Safari:',
    copyLink: 'Copy link 📋',
    copied: 'Copied! ✓',
    otherHint: 'Safari → Share → Add to Home Screen',
    autoTitle: '📲 Install TYANA with one tap!',
    autoBtn: '✨ Install now',
    autoDone: "🎉 Done! Now open TYANA from your home screen",
    gotIt: "Got it, I'll install!",
    skip: 'Skip, use in browser',
    illustration: '⋮ → 📲 → ✓',
  },
  ru: {
    title: '📱 Добавь TYANA на экран телефона',
    subtitle: 'Так я всегда буду у тебя под рукой — как обычное приложение!',
    step1: 'Ты уже почти там! 😊',
    androidStep2: 'Нажми три точки ⋮ в правом верхнем углу браузера',
    androidStep3: 'Выбери «Добавить на главный экран» или «Установить приложение»',
    androidStep4: 'Нажми «Установить» ✓',
    androidDone: 'Готово! Открывай TYANA с экрана телефона 🎉',
    iosStep2: 'Нажми кнопку «Поделиться» внизу экрана',
    iosStep2hint: '(квадратик со стрелкой вверх ↑□)',
    iosStep3: 'Прокрути список вниз',
    iosStep4: 'Нажми «На экран Домой» 🏠',
    iosStep5: 'Нажми «Добавить» в правом верхнем углу',
    iosDone: 'Готово! TYANA появится на экране 🎉',
    otherBrowser: 'Для установки открой эту страницу в Safari:',
    copyLink: 'Скопировать ссылку 📋',
    copied: 'Скопировано! ✓',
    otherHint: 'Safari → Поделиться → На экран Домой',
    autoTitle: '📲 Установить TYANA одним нажатием!',
    autoBtn: '✨ Установить сейчас',
    autoDone: '🎉 Готово! Теперь открывай TYANA с экрана телефона',
    gotIt: 'Понятно, установлю!',
    skip: 'Пропустить, войти через браузер',
    illustration: '⋮ → 📲 → ✓',
  },
  lv: {
    title: '📱 Pievieno TYANA savam tālrunim',
    subtitle: 'Tā es vienmēr būšu pie rokas — kā parasta lietotne!',
    step1: 'Tu esi gandrīz klāt! 😊',
    androidStep2: 'Spied trīs punktus ⋮ augšējā labajā stūrī',
    androidStep3: 'Izvēlies "Pievienot sākuma ekrānam" vai "Instalēt lietotni"',
    androidStep4: 'Spied "Instalēt" ✓',
    androidDone: 'Gatavs! Atver TYANA no sākuma ekrāna 🎉',
    iosStep2: 'Spied "Kopīgot" pogu apakšā',
    iosStep2hint: '(kvadrāts ar bultiņu uz augšu ↑□)',
    iosStep3: 'Ritini sarakstu uz leju',
    iosStep4: 'Spied "Pievienot sākuma ekrānam" 🏠',
    iosStep5: 'Spied "Pievienot" augšējā labajā stūrī',
    iosDone: 'Gatavs! TYANA parādīsies ekrānā 🎉',
    otherBrowser: 'Lai instalētu, atver šo lapu Safari:',
    copyLink: 'Kopēt saiti 📋',
    copied: 'Nokopēts! ✓',
    otherHint: 'Safari → Kopīgot → Pievienot sākuma ekrānam',
    autoTitle: '📲 Instalē TYANA ar vienu pieskārienu!',
    autoBtn: '✨ Instalēt tagad',
    autoDone: '🎉 Gatavs! Tagad atver TYANA no sākuma ekrāna',
    gotIt: 'Sapratu, instalēšu!',
    skip: 'Izlaist, lietot pārlūkā',
    illustration: '⋮ → 📲 → ✓',
  },
};

interface Props {
  onDismiss: () => void;
}

const Step = ({ num, text, hint }: { num: number; text: string; hint?: string }) => (
  <div className="flex items-start gap-3">
    <div
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
      style={{ backgroundColor: '#7C3AED' }}
    >
      {num}
    </div>
    <div className="pt-1">
      <p className="text-sm text-foreground font-medium">{text}</p>
      {hint && <p className="text-xs mt-0.5" style={{ color: '#A78BFA' }}>{hint}</p>}
    </div>
  </div>
);

const PWAInstallGuide = ({ onDismiss }: Props) => {
  const isStandalone = useIsStandalone();
  const isMobile = useIsMobile();
  const [browser, setBrowser] = useState<BrowserType>('android-chrome');
  const [installed, setInstalled] = useState(false);
  const [copied, setCopied] = useState(false);
  const lang = getLanguage();
  const t = texts[lang];

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  // Don't show on desktop, standalone, or if already shown
  if (!isMobile || isStandalone) return null;

  const handleClose = () => {
    localStorage.setItem('install_prompt_shown', '1');
    onDismiss();
  };

  const handleAutoInstall = async () => {
    const accepted = await triggerInstallPrompt();
    if (accepted) {
      setInstalled(true);
      setTimeout(handleClose, 2500);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText('tyana.lovable.app');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-sm bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Auto-install (Android with beforeinstallprompt) */}
          {browser === 'android-auto' && !installed && (
            <div className="text-center space-y-5">
              <p className="text-5xl">📲</p>
              <h2 className="text-xl font-bold text-foreground">{t.autoTitle}</h2>
              <button
                onClick={handleAutoInstall}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-transform active:scale-95"
                style={{ backgroundColor: '#7C3AED' }}
              >
                {t.autoBtn}
              </button>
            </div>
          )}

          {browser === 'android-auto' && installed && (
            <div className="text-center space-y-4 py-4">
              <p className="text-5xl">🎉</p>
              <p className="text-lg font-bold text-foreground">{t.autoDone}</p>
            </div>
          )}

          {/* Android Chrome manual */}
          {browser === 'android-chrome' && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">{t.title}</h2>
                <p className="text-sm mt-1.5" style={{ color: '#7C3AED' }}>{t.subtitle}</p>
              </div>
              <div className="space-y-3.5">
                <Step num={1} text={t.step1} />
                <Step num={2} text={t.androidStep2} />
                <Step num={3} text={t.androidStep3} />
                <Step num={4} text={t.androidStep4} />
                <Step num={5} text={t.androidDone} />
              </div>
              <p className="text-center text-2xl tracking-widest" style={{ color: '#A78BFA' }}>
                {t.illustration}
              </p>
            </div>
          )}

          {/* iOS Safari */}
          {browser === 'ios-safari' && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">{t.title}</h2>
                <p className="text-sm mt-1.5" style={{ color: '#7C3AED' }}>{t.subtitle}</p>
              </div>
              <div className="space-y-3.5">
                <Step num={1} text={t.step1} />
                <Step num={2} text={t.iosStep2} hint={t.iosStep2hint} />
                <Step num={3} text={t.iosStep3} />
                <Step num={4} text={t.iosStep4} />
                <Step num={5} text={t.iosStep5} />
                <Step num={6} text={t.iosDone} />
              </div>
            </div>
          )}

          {/* iOS other browser */}
          {browser === 'ios-other' && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">{t.title}</h2>
                <p className="text-sm mt-1.5" style={{ color: '#7C3AED' }}>{t.subtitle}</p>
              </div>
              <p className="text-sm text-foreground text-center">{t.otherBrowser}</p>
              <div
                className="rounded-xl py-3 px-4 text-center"
                style={{ backgroundColor: '#F5F3FF' }}
              >
                <p className="text-base font-bold" style={{ color: '#7C3AED' }}>tyana.lovable.app</p>
                <p className="text-xs mt-1" style={{ color: '#A78BFA' }}>{t.otherHint}</p>
              </div>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-[1.5px] text-sm font-semibold transition-colors"
                style={{ borderColor: '#DDD6FE', color: '#7C3AED' }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t.copied : t.copyLink}
              </button>
            </div>
          )}

          {/* Bottom buttons */}
          {!(browser === 'android-auto' && installed) && (
            <div className="mt-6 space-y-2.5">
              {browser !== 'android-auto' && (
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-transform active:scale-95"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  {t.gotIt}
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full text-center text-xs py-2"
                style={{ color: '#9CA3AF' }}
              >
                {t.skip}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallGuide;
