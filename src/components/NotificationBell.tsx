import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppAlert } from '@/hooks/useNotifications';

interface NotificationBellProps {
  alerts: AppAlert[];
  unreadCount: number;
  onMarkAllRead: () => void;
}

const NotificationBell = ({ alerts, unreadCount, onMarkAllRead }: NotificationBellProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) {
      onMarkAllRead();
    }
  };

  const handleAlertClick = (alert: AppAlert) => {
    if (alert.link) {
      navigate(alert.link);
      setOpen(false);
    }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.notifications.justNow;
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg transition-colors hover:bg-accent"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ backgroundColor: '#DC2626' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-card border border-border overflow-hidden z-50"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">{t.notifications.title}</h4>
              {alerts.length > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs font-medium"
                  style={{ color: '#7C3AED' }}
                >
                  {t.notifications.markRead}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t.notifications.empty}</p>
                </div>
              ) : (
                alerts.slice(0, 10).map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-b-0 ${
                      !alert.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{alert.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(alert.createdAt)}</p>
                    </div>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: '#7C3AED' }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
