import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isNotificationsEnabled } from '@/hooks/useNotifications';

const MEAL_REMINDER_SETTINGS_KEY = 'tyana_meal_reminders';

export interface MealReminderSettings {
  breakfast: { enabled: boolean; time: string };
  lunch: { enabled: boolean; time: string };
  dinner: { enabled: boolean; time: string };
}

const defaultSettings: MealReminderSettings = {
  breakfast: { enabled: false, time: '08:00' },
  lunch: { enabled: false, time: '13:00' },
  dinner: { enabled: false, time: '19:00' },
};

export const getMealReminderSettings = (): MealReminderSettings => {
  try {
    const stored = localStorage.getItem(MEAL_REMINDER_SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch { return defaultSettings; }
};

export const setMealReminderSettings = (settings: MealReminderSettings) => {
  localStorage.setItem(MEAL_REMINDER_SETTINGS_KEY, JSON.stringify(settings));
};

const LAST_MEAL_CHECK_KEY = 'tyana_meal_reminder_last_check';

const mealMessages: Record<string, Record<string, { title: string; body: string }>> = {
  en: {
    breakfast: { title: '🌅 Good morning!', body: "Don't forget to log breakfast" },
    lunch: { title: '☀️ Lunchtime!', body: "What's for lunch today?" },
    dinner: { title: '🌙 How was your day?', body: 'Log your dinner' },
  },
  ru: {
    breakfast: { title: '🌅 Доброе утро!', body: 'Не забудь записать завтрак' },
    lunch: { title: '☀️ Время обеда!', body: 'Что сегодня?' },
    dinner: { title: '🌙 Как прошёл день?', body: 'Запиши ужин' },
  },
  lv: {
    breakfast: { title: '🌅 Labrīt!', body: 'Neaizmirsti ierakstīt brokastis' },
    lunch: { title: '☀️ Pusdienu laiks!', body: 'Kas šodien pusdienās?' },
    dinner: { title: '🌙 Kā pagāja diena?', body: 'Ieraksti vakariņas' },
  },
  uk: {
    breakfast: { title: '🌅 Доброго ранку!', body: 'Не забудь записати сніданок' },
    lunch: { title: '☀️ Час обіду!', body: 'Що сьогодні?' },
    dinner: { title: '🌙 Як пройшов день?', body: 'Запиши вечерю' },
  },
};

export const useMealReminders = (language: string) => {
  const { user } = useAuth();

  const checkMealReminders = useCallback(async () => {
    if (!user || !isNotificationsEnabled() || Notification.permission !== 'granted') return;

    const settings = getMealReminderSettings();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastCheck = localStorage.getItem(LAST_MEAL_CHECK_KEY);

    const meals = ['breakfast', 'lunch', 'dinner'] as const;
    const mealTypeMap: Record<string, string> = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };

    for (const meal of meals) {
      const config = settings[meal];
      if (!config.enabled) continue;

      // Check if it's the right time (within 1 minute window)
      const [h, m] = config.time.split(':').map(Number);
      const targetMinutes = h * 60 + m;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (Math.abs(currentMinutes - targetMinutes) > 1) continue;

      // Check if already sent today for this meal
      const checkKey = `${LAST_MEAL_CHECK_KEY}_${meal}_${todayStr}`;
      if (localStorage.getItem(checkKey) === '1') continue;

      // Check if meal already logged today
      const { data } = await supabase
        .from('meal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .eq('meal_type', mealTypeMap[meal])
        .limit(1);

      if (data && data.length > 0) continue; // Already logged

      // Send notification
      const lang = language in mealMessages ? language : 'en';
      const msg = mealMessages[lang][meal];
      new Notification(msg.title, {
        body: msg.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `meal-${meal}-${todayStr}`,
      });

      localStorage.setItem(checkKey, '1');
    }
  }, [user, language]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkMealReminders, 60000);
    checkMealReminders(); // Initial check
    return () => clearInterval(interval);
  }, [user, checkMealReminders]);
};
