import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X } from 'lucide-react';
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

const getLanguage = (): 'en' | 'ru' | 'lv' | 'uk' => {
  const stored = localStorage.getItem('tyana_language');
  if (stored === 'ru' || stored === 'lv' || stored === 'en' || stored === 'uk') return stored as any;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('lv')) return 'lv';
  if (nav.startsWith('uk')) return 'uk';
  return 'en';
};

interface IOSStep {
  icon: string;
  title: string;
  text: string;
  illustration: string;
}

const iosSteps: Record<string, IOSStep[]> = {
  en: [
    {
      icon: '🌐', title: 'Open in Safari',
      text: 'Open in Safari specifically — only Safari has the install button on iPhone.\n\nChrome and other browsers don\'t have this option on iPhone.',
      illustration: '🧭',
    },
    {
      icon: '📱', title: 'Find three dots in bottom right',
      text: 'Look at the bottom right corner of your screen.\n\nYou\'ll see a button with three dots ···\n\nTap on it.',
      illustration: '···',
    },
    {
      icon: '📤', title: 'Tap Share button',
      text: 'In the menu that appears, find the Share button.\n\nIt looks like a box with an arrow pointing up ⬆️\n\nTap on it.',
      illustration: '⬆️',
    },
    {
      icon: '☝️', title: 'Swipe the menu up',
      text: 'A list of actions will appear.\n\nSwipe this list up with your finger — there are more options hidden below.\n\nOr tap the "More" button.',
      illustration: '👆',
    },
    {
      icon: '➕', title: 'Find "Add to Home Screen"',
      text: 'Look for:\n\n📱 Add to Home Screen\n\nIf you don\'t see it — scroll down the list.\n\nTap on it.',
      illustration: '📱',
    },
    {
      icon: '✅', title: 'Tap "Add"',
      text: 'You\'ll see the name TYANA at the top of the screen.\n\nTap the "Add" button in the top right corner.\n\nDone! 🎉',
      illustration: '✓',
    },
  ],
  ru: [
    {
      icon: '🌐', title: 'Открой Safari',
      text: 'Важно! Только через Safari — другие браузеры не подойдут.\n\nЕсли ты сейчас в Chrome или другом браузере — скопируй ссылку tyana.app и открой в Safari.',
      illustration: '🧭',
    },
    {
      icon: '📱', title: 'Найди три точки внизу справа',
      text: 'Посмотри в правый нижний угол экрана.\n\nТам будет кнопка с тремя точками ···\n\nНажми на неё.',
      illustration: '···',
    },
    {
      icon: '📤', title: 'Нажми Share (Поделиться)',
      text: 'В появившемся меню найди кнопку Share.\n\nОна выглядит как квадрат со стрелкой вверх ⬆️\n\nНажми на неё.',
      illustration: '⬆️',
    },
    {
      icon: '☝️', title: 'Потяни меню вверх',
      text: 'Появится список действий.\n\nПотяни этот список пальцем вверх — там спрятаны дополнительные пункты.\n\nИли нажми кнопку More (Ещё).',
      illustration: '👆',
    },
    {
      icon: '➕', title: 'Найди «На экран Домой»',
      text: 'Ищи пункт:\n\n📱 Add to Home Screen\nили\n📱 На экран Домой\n\nЕсли не видишь — листай список вниз.\nНажми на этот пункт.',
      illustration: '📱',
    },
    {
      icon: '✅', title: 'Нажми «Добавить»',
      text: 'Вверху экрана появится название TYANA.\n\nНажми кнопку Add (Добавить) в правом верхнем углу.\n\nГотово! 🎉',
      illustration: '✓',
    },
  ],
  lv: [
    {
      icon: '🌐', title: 'Atver Safari',
      text: 'Svarīgi! Tikai Safari darbojas — ne Chrome vai citi pārlūki.\n\nJa tu esi Chrome vai citā pārlūkā — nokopē saiti tyana.app un atver Safari.',
      illustration: '🧭',
    },
    {
      icon: '📱', title: 'Atrodi trīs punktus apakšā pa labi',
      text: 'Paskaties apakšējā labajā stūrī.\n\nTur būs poga ar trim punktiem ···\n\nNospied to.',
      illustration: '···',
    },
    {
      icon: '📤', title: 'Nospied Share (Kopīgot)',
      text: 'Parādītajā izvēlnē atrodi pogu Share.\n\nIzskatās kā kvadrāts ar bultiņu uz augšu ⬆️\n\nNospied to.',
      illustration: '⬆️',
    },
    {
      icon: '☝️', title: 'Velc izvēlni uz augšu',
      text: 'Parādīsies darbību saraksts.\n\nVelc sarakstu uz augšu ar pirkstu — tur ir paslēptas papildu opcijas.\n\nVai nospied pogu "More".',
      illustration: '👆',
    },
    {
      icon: '➕', title: 'Atrodi "Add to Home Screen"',
      text: 'Meklē:\n\n📱 Add to Home Screen\n\nJa neredzi — ritini sarakstu uz leju.\nNospied to.',
      illustration: '📱',
    },
    {
      icon: '✅', title: 'Nospied "Add" (Pievienot)',
      text: 'Ekrāna augšā parādīsies nosaukums TYANA.\n\nNospied "Add" pogu augšējā labajā stūrī.\n\nGatavs! 🎉',
      illustration: '✓',
    },
  ],
  uk: [
    {
      icon: '🌐', title: 'Відкрий Safari',
      text: 'Важливо! Тільки Safari — інші браузери не підійдуть.\n\nЯкщо ти зараз у Chrome або іншому браузері — скопіюй посилання tyana.app і відкрий у Safari.',
      illustration: '🧭',
    },
    {
      icon: '📱', title: 'Знайди три крапки внизу справа',
      text: 'Подивись у правий нижній кут екрану.\n\nТам буде кнопка з трьома крапками ···\n\nНатисни на неї.',
      illustration: '···',
    },
    {
      icon: '📤', title: 'Натисни Share (Поділитися)',
      text: 'У меню, що з\'явилось, знайди кнопку Share.\n\nВиглядає як квадрат зі стрілкою вгору ⬆️\n\nНатисни на неї.',
      illustration: '⬆️',
    },
    {
      icon: '☝️', title: 'Потягни меню вгору',
      text: 'З\'явиться список дій.\n\nПотягни цей список пальцем вгору — там сховані додаткові пункти.\n\nАбо натисни кнопку More (Ще).',
      illustration: '👆',
    },
    {
      icon: '➕', title: 'Знайди «Add to Home Screen»',
      text: 'Шукай пункт:\n\n📱 Add to Home Screen\nабо\n📱 На початковий екран\n\nЯкщо не бачиш — гортай вниз.\nНатисни на цей пункт.',
      illustration: '📱',
    },
    {
      icon: '✅', title: 'Натисни «Add» (Додати)',
      text: 'Вгорі екрану з\'явиться назва TYANA.\n\nНатисни кнопку Add (Додати) у правому верхньому куті.\n\nГотово! 🎉',
      illustration: '✓',
    },
  ],
};

const finalTexts = {
  en: {
    title: 'TYANA is installed!',
    text: 'Now find the TYANA icon on your home screen and open the app like any other!\n\nNo more opening through the browser 🎉',
    button: 'Great! Let\'s go →',
  },
  ru: {
    title: 'TYANA установлена!',
    text: 'Теперь найди иконку TYANA на главном экране и открывай приложение как обычное!\n\nБольше не нужно заходить через браузер 🎉',
    button: 'Отлично! Начать →',
  },
  lv: {
    title: 'TYANA ir instalēta!',
    text: 'Tagad atrodi TYANA ikonu sākuma ekrānā un atver lietotni kā parasti!\n\nVairs nav jāiet caur pārlūku 🎉',
    button: 'Lieliski! Sākt →',
  },
  uk: {
    title: 'TYANA встановлена!',
    text: 'Тепер знайди іконку TYANA на головному екрані і відкривай додаток як звичайний!\n\nБільше не потрібно заходити через браузер 🎉',
    button: 'Чудово! Почати →',
  },
};

const uiTexts = {
  en: { skip: 'Skip instructions', back: '← Back', next: 'Next →', copyLink: 'Copy link 📋', copied: 'Copied! ✓', otherBrowser: 'To install, open this page in Safari:', otherHint: 'Safari → Share → Add to Home Screen', autoTitle: '📲 Install TYANA with one tap!', autoBtn: '✨ Install now', autoDone: '🎉 Done! Open TYANA from your home screen', gotIt: "Got it, I'll install!", skipBrowser: 'Skip, use in browser' },
  ru: { skip: 'Пропустить инструкцию', back: '← Назад', next: 'Далее →', copyLink: 'Скопировать ссылку 📋', copied: 'Скопировано! ✓', otherBrowser: 'Для установки открой эту страницу в Safari:', otherHint: 'Safari → Поделиться → На экран Домой', autoTitle: '📲 Установить TYANA одним нажатием!', autoBtn: '✨ Установить сейчас', autoDone: '🎉 Готово! Открывай TYANA с экрана телефона', gotIt: 'Понятно, установлю!', skipBrowser: 'Пропустить' },
  lv: { skip: 'Izlaist instrukciju', back: '← Atpakaļ', next: 'Tālāk →', copyLink: 'Kopēt saiti 📋', copied: 'Nokopēts! ✓', otherBrowser: 'Lai instalētu, atver šo lapu Safari:', otherHint: 'Safari → Kopīgot → Pievienot sākuma ekrānam', autoTitle: '📲 Instalē TYANA ar vienu pieskārienu!', autoBtn: '✨ Instalēt tagad', autoDone: '🎉 Gatavs! Atver TYANA no sākuma ekrāna', gotIt: 'Sapratu, instalēšu!', skipBrowser: 'Izlaist' },
  uk: { skip: 'Пропустити інструкцію', back: '← Назад', next: 'Далі →', copyLink: 'Скопіювати посилання 📋', copied: 'Скопійовано! ✓', otherBrowser: 'Для встановлення відкрий цю сторінку в Safari:', otherHint: 'Safari → Поділитися → На початковий екран', autoTitle: '📲 Встановити TYANA одним натиском!', autoBtn: '✨ Встановити зараз', autoDone: '🎉 Готово! Відкривай TYANA з головного екрану', gotIt: 'Зрозуміло, встановлю!', skipBrowser: 'Пропустити' },
};

interface Props {
  onDismiss: () => void;
  forceOpen?: boolean;
}

const PWAInstallGuide = ({ onDismiss, forceOpen }: Props) => {
  const isStandalone = useIsStandalone();
  const isMobile = useIsMobile();
  const [browser, setBrowser] = useState<BrowserType>('android-chrome');
  const [currentStep, setCurrentStep] = useState(0);
  const [installed, setInstalled] = useState(false);
  const [copied, setCopied] = useState(false);
  const lang = getLanguage();
  const ui = uiTexts[lang];
  const steps = iosSteps[lang];
  const final = finalTexts[lang];
  const totalSteps = steps.length;

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  if (!forceOpen && (!isMobile || isStandalone)) return null;

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
    await navigator.clipboard.writeText('tyana.app');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Android auto-install
  if (browser === 'android-auto') {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-sm bg-card rounded-3xl p-6" style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }} initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}>
            {!installed ? (
              <div className="text-center space-y-5">
                <p className="text-5xl">📲</p>
                <h2 className="text-xl font-bold text-foreground">{ui.autoTitle}</h2>
                <button onClick={handleAutoInstall} className="w-full py-3.5 rounded-xl text-primary-foreground font-bold text-base bg-primary active:scale-95 transition-transform">{ui.autoBtn}</button>
                <button onClick={handleClose} className="w-full text-center text-xs py-2 text-muted-foreground">{ui.skipBrowser}</button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4">
                <p className="text-5xl">🎉</p>
                <p className="text-lg font-bold text-foreground">{ui.autoDone}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS other browser (not Safari)
  if (browser === 'ios-other') {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-sm bg-card rounded-3xl p-6" style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }} initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}>
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-5xl mb-3">🧭</p>
                <h2 className="text-xl font-bold text-foreground">{steps[0].title}</h2>
                <p className="text-sm mt-2 text-muted-foreground whitespace-pre-line">{steps[0].text}</p>
              </div>
              <div className="rounded-xl py-3 px-4 text-center bg-primary/10">
                <p className="text-base font-bold text-primary">tyana.app</p>
                <p className="text-xs mt-1 text-primary/70">{ui.otherHint}</p>
              </div>
              <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-[1.5px] border-border text-sm font-semibold text-primary">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? ui.copied : ui.copyLink}
              </button>
              <button onClick={handleClose} className="w-full text-center text-xs py-2 text-muted-foreground">{ui.skipBrowser}</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Android Chrome manual
  if (browser === 'android-chrome') {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-sm bg-card rounded-3xl p-6" style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }} initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}>
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">📱 {steps[0].title}</h2>
              </div>
              <div className="space-y-3.5">
                {[1, 2, 3, 4].map(n => {
                  const androidTexts: Record<string, string[]> = {
                    en: ['Tap three dots ⋮ in top-right corner', 'Select "Add to Home screen"', 'Tap "Install" ✓', 'Done! Open TYANA from home screen 🎉'],
                    ru: ['Нажми ⋮ в правом верхнем углу', 'Выбери «Добавить на главный экран»', 'Нажми «Установить» ✓', 'Готово! Открывай TYANA с экрана 🎉'],
                    lv: ['Spied ⋮ augšējā labajā stūrī', 'Izvēlies "Pievienot sākuma ekrānam"', 'Spied "Instalēt" ✓', 'Gatavs! Atver TYANA 🎉'],
                    uk: ['Натисни ⋮ у правому верхньому куті', 'Обери «Додати на головний екран»', 'Натисни «Встановити» ✓', 'Готово! Відкривай TYANA 🎉'],
                  };
                  return (
                    <div key={n} className="flex items-start gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary">{n}</div>
                      <p className="text-sm text-foreground font-medium pt-1">{(androidTexts[lang] || androidTexts.en)[n - 1]}</p>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleClose} className="w-full py-3.5 rounded-xl text-primary-foreground font-bold text-sm bg-primary active:scale-95 transition-transform">{ui.gotIt}</button>
              <button onClick={handleClose} className="w-full text-center text-xs py-1 text-muted-foreground">{ui.skipBrowser}</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS Safari — step-by-step guide
  const isLastStep = currentStep >= totalSteps;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 -4px 40px rgba(124,58,237,0.2)' }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Skip link */}
          <div className="flex justify-end p-4 pb-0">
            <button onClick={handleClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {ui.skip}
            </button>
          </div>

          <div className="px-6 pb-6 pt-2">
            <AnimatePresence mode="wait">
              {!isLastStep ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* Step number circle */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground bg-primary shadow-lg">
                      {currentStep + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center">
                    <span className="text-5xl">{steps[currentStep].icon}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-foreground text-center">
                    {steps[currentStep].title}
                  </h2>

                  {/* Text */}
                  <p className="text-sm text-muted-foreground text-center whitespace-pre-line leading-relaxed">
                    {steps[currentStep].text}
                  </p>

                  {/* Illustration area */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-4xl">{steps[currentStep].illustration}</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="final"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-center"
                >
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-5xl">✅</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{final.title}</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{final.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-6 mb-4">
              {Array.from({ length: totalSteps + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === currentStep ? '#7C3AED' : i < currentStep ? '#A78BFA' : 'hsl(var(--border))',
                    width: i === currentStep ? '20px' : '8px',
                  }}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && !isLastStep && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                  {ui.back}
                </button>
              )}
              {!isLastStep ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform"
                >
                  {ui.next}
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform"
                >
                  {final.button}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallGuide;
