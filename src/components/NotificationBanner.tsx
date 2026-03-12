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
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 bg-secondary border border-border"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary">
            <Bell className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {t.notifications.bannerTitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnable}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
            >
              {t.notifications.enable}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationBanner;
