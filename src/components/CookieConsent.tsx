import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const { language } = useTranslation();

  useEffect(() => {
    if (!localStorage.getItem('cookies_accepted')) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const texts: Record<string, { msg: string; accept: string; learn: string }> = {
    en: { msg: '🍪 We use only essential cookies to make TYANA work. No ads, no tracking.', accept: 'Accept', learn: 'Learn more' },
    ru: { msg: '🍪 Мы используем только необходимые cookie для работы TYANA. Без рекламы, без отслеживания.', accept: 'Принять', learn: 'Подробнее' },
    uk: { msg: '🍪 Ми використовуємо лише необхідні cookie для роботи TYANA. Без реклами, без відстеження.', accept: 'Прийняти', learn: 'Детальніше' },
    lv: { msg: '🍪 Mēs izmantojam tikai būtiskās sīkdatnes TYANA darbībai. Bez reklāmām, bez izsekošanas.', accept: 'Pieņemt', learn: 'Uzzināt vairāk' },
  };

  const t = texts[language] || texts.en;

  const handleAccept = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-card border-t border-border px-4 py-4"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        <p className="text-sm flex-1 text-foreground">{t.msg}</p>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/cookies" className="text-sm underline text-primary">{t.learn}</Link>
          <Button
            onClick={handleAccept}
            className="text-white text-sm font-semibold px-6 rounded-xl"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {t.accept}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
