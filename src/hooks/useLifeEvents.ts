import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LucideIcon, Briefcase, ShieldPlus, Globe, PersonStanding, Baby, Target, Heart, Plane, Trophy } from 'lucide-react';

export interface LifeEvent {
  id?: string;
  title: string;
  date: string;
  type: 'trigger' | 'goal';
  status: string;
  icon: LucideIcon;
  iconName: string;
  side: 'left' | 'right';
}

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  ShieldPlus,
  Globe,
  PersonStanding,
  Baby,
  Target,
  Heart,
  Plane,
  Trophy,
};

export const getIconByName = (name: string): LucideIcon => {
  return iconMap[name] || Target;
};

export const useLifeEvents = () => {
  const { user } = useAuth();
  const [leftEvents, setLeftEvents] = useState<LifeEvent[]>([]);
  const [rightEvents, setRightEvents] = useState<LifeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default events for users who haven't added any
  const defaultLeftEvents: LifeEvent[] = [
    { title: 'Job Change', date: '01/23', type: 'trigger', status: 'stress peak', icon: Briefcase, iconName: 'Briefcase', side: 'left' },
    { title: 'Illness', date: '06/23', type: 'trigger', status: 'goal', icon: ShieldPlus, iconName: 'ShieldPlus', side: 'left' },
    { title: 'Trip', date: '09/23', type: 'goal', status: 'stress peak', icon: Globe, iconName: 'Globe', side: 'left' },
  ];

  const defaultRightEvents: LifeEvent[] = [
    { title: 'Marathon', date: '05/24', type: 'trigger', status: 'stress peak', icon: PersonStanding, iconName: 'PersonStanding', side: 'right' },
    { title: 'Pregnancy', date: '08/24', type: 'goal', status: 'stress peak', icon: Baby, iconName: 'Baby', side: 'right' },
    { title: 'Big Project', date: '12/24', type: 'trigger', status: 'stress peak', icon: Target, iconName: 'Target', side: 'right' },
  ];

  const fetchEvents = async () => {
    if (!user) {
      setLeftEvents(defaultLeftEvents);
      setRightEvents(defaultRightEvents);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const left = data
          .filter((e) => e.side === 'left')
          .map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            type: e.type as 'trigger' | 'goal',
            status: e.status,
            icon: getIconByName(e.icon_name),
            iconName: e.icon_name,
            side: 'left' as const,
          }));

        const right = data
          .filter((e) => e.side === 'right')
          .map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            type: e.type as 'trigger' | 'goal',
            status: e.status,
            icon: getIconByName(e.icon_name),
            iconName: e.icon_name,
            side: 'right' as const,
          }));

        setLeftEvents(left);
        setRightEvents(right);
      } else {
        // No saved events, use defaults
        setLeftEvents(defaultLeftEvents);
        setRightEvents(defaultRightEvents);
      }
    } catch (error) {
      console.error('Error fetching life events:', error);
      toast.error('Failed to load events');
      setLeftEvents(defaultLeftEvents);
      setRightEvents(defaultRightEvents);
    } finally {
      setIsLoading(false);
    }
  };

  const addEvent = async (event: Omit<LifeEvent, 'id' | 'side'>) => {
    if (!user) {
      toast.error('Please login to save events');
      return false;
    }

    // Determine which side has fewer events
    const side = leftEvents.length <= rightEvents.length ? 'left' : 'right';

    try {
      const { data, error } = await supabase
        .from('life_events')
        .insert({
          user_id: user.id,
          title: event.title,
          date: event.date,
          type: event.type,
          status: event.status,
          icon_name: event.iconName,
          side,
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent: LifeEvent = {
        id: data.id,
        title: data.title,
        date: data.date,
        type: data.type as 'trigger' | 'goal',
        status: data.status,
        icon: getIconByName(data.icon_name),
        iconName: data.icon_name,
        side: data.side as 'left' | 'right',
      };

      if (side === 'left') {
        setLeftEvents([...leftEvents, newEvent]);
      } else {
        setRightEvents([...rightEvents, newEvent]);
      }

      toast.success(`"${event.title}" added to timeline!`);
      return true;
    } catch (error) {
      console.error('Error adding life event:', error);
      toast.error('Failed to save event');
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('life_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setLeftEvents(leftEvents.filter((e) => e.id !== eventId));
      setRightEvents(rightEvents.filter((e) => e.id !== eventId));

      toast.success('Event removed from timeline');
      return true;
    } catch (error) {
      console.error('Error deleting life event:', error);
      toast.error('Failed to delete event');
      return false;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return {
    leftEvents,
    rightEvents,
    isLoading,
    addEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
