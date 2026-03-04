import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { isNotificationsEnabled, setNotificationsEnabled, isDismissedBanner, dismissBanner } from '@/hooks/useNotifications';

const NotificationBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => {
    if (isDismissedBanner() || isNotificationsEnabled()) return false;
    if (typeof Notification === 'undefined') return false;
    return Notification.permission !== 'granted' && Notification.permission !== 'denied';
  });

  const handleEnable = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
    }
    dismissBanner();
    setVisible(false);
  };

  const handleDismiss = () => {
    dismissBanner();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{
            backgroundColor: '#EDE9FE',
            border: '1px solid #DDD6FE',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#7C3AED' }}>
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              {t.notifications.bannerTitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnable}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: '#7C3AED' }}
            >
              {t.notifications.enable}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X className="w-4 h-4" style={{ color: '#6B7280' }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationBanner;
