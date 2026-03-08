import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isNotificationsEnabled } from '@/hooks/useNotifications';

export interface Reminder {
  id: string;
  user_id: string;
  text: string;
  remind_at: string;
  repeat_type: string;
  is_completed: boolean;
  created_at: string;
}

export const useReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true }) as any;
    setReminders(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = useCallback(async (text: string, remindAt: string, repeatType: string = 'once') => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('reminders')
      .insert({ user_id: user.id, text, remind_at: remindAt, repeat_type: repeatType } as any)
      .select()
      .single() as any;
    if (!error && data) {
      setReminders(prev => [...prev, data].sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
    }
    return { data, error };
  }, [user]);

  const completeReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    if (reminder.repeat_type === 'once') {
      await supabase.from('reminders').update({ is_completed: true } as any).eq('id', id) as any;
      setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: true } : r));
    } else {
      // For recurring, calculate next occurrence
      const next = getNextOccurrence(new Date(reminder.remind_at), reminder.repeat_type);
      await supabase.from('reminders').update({ remind_at: next.toISOString() } as any).eq('id', id) as any;
      setReminders(prev => prev.map(r => r.id === id ? { ...r, remind_at: next.toISOString() } : r));
    }
  }, [reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id) as any;
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  // Check for due reminders every 60 seconds
  useEffect(() => {
    if (!user) return;

    const checkDue = () => {
      const now = new Date();
      const dueReminders = reminders.filter(r =>
        !r.is_completed &&
        new Date(r.remind_at) <= now &&
        new Date(r.remind_at) >= new Date(now.getTime() - 60000)
      );

      dueReminders.forEach(r => {
        // Send browser notification
        if (isNotificationsEnabled() && Notification.permission === 'granted') {
          new Notification('TYANA 🔔', {
            body: r.text,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: r.id,
          });
        }

        // Complete or advance
        completeReminder(r.id);
      });
    };

    intervalRef.current = setInterval(checkDue, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, reminders, completeReminder]);

  const todayCount = reminders.filter(r => {
    if (r.is_completed && r.repeat_type === 'once') return false;
    const d = new Date(r.remind_at);
    const now = new Date();
    return d.toDateString() === now.toDateString() && !r.is_completed;
  }).length;

  return { reminders, loading, addReminder, completeReminder, deleteReminder, fetchReminders, todayCount };
};

function getNextOccurrence(current: Date, repeatType: string): Date {
  const next = new Date(current);
  switch (repeatType) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekdays':
      do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
      break;
    case 'weekends':
      do { next.setDate(next.getDate() + 1); } while (next.getDay() !== 0 && next.getDay() !== 6);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return next;
}
