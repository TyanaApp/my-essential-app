import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const offlineText: Record<string, string> = {
  en: "You're offline. Some features may be limited.",
  ru: 'Вы офлайн. Некоторые функции могут быть ограничены.',
  lv: 'Esat bezsaistē. Dažas funkcijas var būt ierobežotas.',
  uk: 'Ви офлайн. Деякі функції можуть бути обмежені.',
};

const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const { language } = useLanguage();

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium"
          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
        >
          <WifiOff className="w-4 h-4" />
          {offlineText[language] || offlineText.en}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
