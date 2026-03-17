import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const NOTIF_I18N: Record<string, {
  expiringTitle: string;
  expiresToday: (n: string) => string;
  expiresTomorrow: (n: string) => string;
  expiresInDays: (n: string, d: number) => string;
  browserTitle: string;
  browserTomorrow: (n: string) => string;
  browserInDays: (n: string, d: number) => string;
}> = {
  en: {
    expiringTitle: '⚠️ Food expiring soon',
    expiresToday: (n) => `${n} expires today!`,
    expiresTomorrow: (n) => `${n} expires tomorrow!`,
    expiresInDays: (n, d) => `${n} expires in ${d} days`,
    browserTitle: '⚠️ TYANA — Food expiring soon',
    browserTomorrow: (n) => `${n} expires tomorrow! Open app to see recipe ideas.`,
    browserInDays: (n, d) => `${n} expires in ${d} days.`,
  },
  ru: {
    expiringTitle: '⚠️ Продукт скоро испортится',
    expiresToday: (n) => `${n} — истекает сегодня!`,
    expiresTomorrow: (n) => `${n} — истекает завтра!`,
    expiresInDays: (n, d) => `${n} — истекает через ${d} дн.`,
    browserTitle: '⚠️ TYANA — Продукт скоро испортится',
    browserTomorrow: (n) => `${n} истекает завтра! Откройте приложение для идей рецептов.`,
    browserInDays: (n, d) => `${n} истекает через ${d} дн.`,
  },
  uk: {
    expiringTitle: '⚠️ Продукт скоро зіпсується',
    expiresToday: (n) => `${n} — спливає сьогодні!`,
    expiresTomorrow: (n) => `${n} — спливає завтра!`,
    expiresInDays: (n, d) => `${n} — спливає через ${d} дн.`,
    browserTitle: '⚠️ TYANA — Продукт скоро зіпсується',
    browserTomorrow: (n) => `${n} спливає завтра! Відкрийте додаток для ідей рецептів.`,
    browserInDays: (n, d) => `${n} спливає через ${d} дн.`,
  },
  lv: {
    expiringTitle: '⚠️ Produktam drīz beigsies derīguma termiņš',
    expiresToday: (n) => `${n} — derīguma termiņš beidzas šodien!`,
    expiresTomorrow: (n) => `${n} — derīguma termiņš beidzas rīt!`,
    expiresInDays: (n, d) => `${n} — derīguma termiņš beidzas pēc ${d} dienām`,
    browserTitle: '⚠️ TYANA — Produktam beidzas derīguma termiņš',
    browserTomorrow: (n) => `${n} derīguma termiņš beidzas rīt! Atveriet lietotni recepšu idejām.`,
    browserInDays: (n, d) => `${n} derīguma termiņš beidzas pēc ${d} dienām.`,
  },
};

export interface AppAlert {
  id: string;
  type: 'expiring' | 'expired' | 'savings' | 'recipe';
  title: string;
  body: string;
  icon: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationSettings {
  expiryAlerts: boolean;
  weeklySummary: boolean;
  recipeSuggestions: boolean;
}

const ALERTS_KEY = 'tyana_alerts';
const SETTINGS_KEY = 'tyana_notification_settings';
const PERMISSION_KEY = 'tyana_notifications_enabled';
const LAST_CHECK_KEY = 'tyana_last_expiry_check';
const WEEKLY_CHECK_KEY = 'tyana_last_weekly_check';

const getStoredAlerts = (): AppAlert[] => {
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]');
  } catch { return []; }
};

const storeAlerts = (alerts: AppAlert[]) => {
  // Keep only last 20
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 20)));
};

export const getNotificationSettings = (): NotificationSettings => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch { return { expiryAlerts: true, weeklySummary: true, recipeSuggestions: true }; }
};

export const setNotificationSettings = (settings: NotificationSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const isNotificationsEnabled = () => localStorage.getItem(PERMISSION_KEY) === 'true';
export const setNotificationsEnabled = (v: boolean) => localStorage.setItem(PERMISSION_KEY, String(v));
export const isDismissedBanner = () => localStorage.getItem('tyana_notif_banner_dismissed') === '1';
export const dismissBanner = () => localStorage.setItem('tyana_notif_banner_dismissed', '1');

export const useNotifications = () => {
  const { user } = useAuth();
  const { language: currentLanguage } = useLanguage();
  const ni = NOTIF_I18N[currentLanguage] || NOTIF_I18N.ru;
  const [alerts, setAlerts] = useState<AppAlert[]>(getStoredAlerts());
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const s = getNotificationSettings();
    return {
      expiryAlerts: s.expiryAlerts ?? true,
      weeklySummary: s.weeklySummary ?? true,
      recipeSuggestions: s.recipeSuggestions ?? true,
    };
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  const addAlert = useCallback((alert: Omit<AppAlert, 'id' | 'read' | 'createdAt'>) => {
    const newAlert: AppAlert = {
      ...alert,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setAlerts(prev => {
      const updated = [newAlert, ...prev].slice(0, 20);
      storeAlerts(updated);
      return updated;
    });
    return newAlert;
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => {
      const updated = prev.map(a => ({ ...a, read: true }));
      storeAlerts(updated);
      return updated;
    });
  }, []);

  const deleteAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      storeAlerts(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
    storeAlerts([]);
  }, []);

  const updateSettings = useCallback((newSettings: NotificationSettings) => {
    setSettings(newSettings);
    setNotificationSettings(newSettings);
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string, link?: string) => {
    if (!isNotificationsEnabled() || Notification.permission !== 'granted') return;
    const notif = new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    });
    if (link) {
      notif.onclick = () => {
        window.focus();
        window.location.href = link;
      };
    }
  }, []);

  // Daily expiry check
  const checkExpiring = useCallback(async () => {
    if (!user || !settings.expiryAlerts) return;

    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (lastCheck === today) return;

    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    const { data } = await supabase
      .from('inventory_items')
      .select('id, name, expires_at')
      .eq('user_id', user.id)
      .not('expires_at', 'is', null)
      .lte('expires_at', threeDaysFromNow)
      .gte('expires_at', today)
      .order('expires_at', { ascending: true })
      .limit(5);

    if (data && data.length > 0) {
      localStorage.setItem(LAST_CHECK_KEY, today);

      data.forEach((item: any) => {
        const days = Math.ceil((new Date(item.expires_at).getTime() - Date.now()) / 86400000);
        const icon = days <= 1 ? '🔴' : '🟠';
        const bodyText = days <= 0
          ? ni.expiresToday(item.name)
          : days === 1
            ? ni.expiresTomorrow(item.name)
            : ni.expiresInDays(item.name, days);

        addAlert({
          type: 'expiring',
          title: ni.expiringTitle,
          body: bodyText,
          icon,
          link: '/inventory?tab=expiring',
        });
      });

      // Send one browser notification for the most urgent
      const urgent = data[0] as any;
      const urgentDays = Math.ceil((new Date(urgent.expires_at).getTime() - Date.now()) / 86400000);
      const urgentBody = urgentDays <= 1
        ? ni.browserTomorrow(urgent.name)
        : ni.browserInDays(urgent.name, urgentDays);

      sendBrowserNotification(
        ni.browserTitle,
        urgentBody,
        '/inventory?tab=expiring'
      );
    }
  }, [user, settings.expiryAlerts, addAlert, sendBrowserNotification, ni]);

  // Weekly summary check (Monday)
  const checkWeeklySummary = useCallback(async () => {
    if (!user || !settings.weeklySummary) return;

    const now = new Date();
    if (now.getDay() !== 1) return; // Monday only

    const lastWeekly = localStorage.getItem(WEEKLY_CHECK_KEY);
    const thisWeek = `${now.getFullYear()}-W${Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000)}`;
    if (lastWeekly === thisWeek) return;

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const [savingsRes, expiringRes] = await Promise.all([
      supabase.from('savings_log').select('amount').eq('user_id', user.id).gte('created_at', weekStart.toISOString()),
      supabase.from('inventory_items').select('id').eq('user_id', user.id).not('expires_at', 'is', null)
        .lte('expires_at', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
        .gte('expires_at', now.toISOString().split('T')[0]),
    ]);

    const totalSaved = (savingsRes.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const expiringCount = expiringRes.data?.length || 0;

    localStorage.setItem(WEEKLY_CHECK_KEY, thisWeek);

    const body = `This week: €${totalSaved.toFixed(2)} saved. ${expiringCount} items expiring this week.`;

    addAlert({
      type: 'savings',
      title: '📊 Your TYANA weekly report',
      body,
      icon: '✅',
      link: '/savings',
    });

    sendBrowserNotification('📊 Your TYANA weekly report', body, '/savings');
  }, [user, settings.weeklySummary, addAlert, sendBrowserNotification]);

  useEffect(() => {
    if (!user) return;
    checkExpiring();
    checkWeeklySummary();
  }, [user, checkExpiring, checkWeeklySummary]);

  return {
    alerts,
    unreadCount,
    settings,
    updateSettings,
    markAllRead,
    deleteAlert,
    clearAll,
    addAlert,
  };
};
