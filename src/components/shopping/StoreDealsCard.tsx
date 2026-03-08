import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

const StoreDealsCard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const stores = (t as any).storeDeals || {};
  const [joined, setJoined] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Check if user already joined waitlist - use raw query to avoid type issues
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data && (data as any).store_integration_waitlist) setJoined(true);
    });
    // Count waitlist users
    supabase.rpc('count_store_waitlist' as any).then(({ data: count }) => {
      setWaitlistCount(count || 0);
    });
  }, [user]);

  const handleJoin = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ store_integration_waitlist: true } as any).eq('user_id', user.id);
    setJoined(true);
    setWaitlistCount(prev => prev + 1);
    toast.success(stores.joined || 'Great! We\'ll notify you when ready ✓');
  };

  return (
    <div className="p-4 rounded-2xl" style={{
      background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
      boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
    }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🏪</span>
        <h3 className="text-sm font-bold text-white">{stores.title || 'Store deals — coming soon!'}</h3>
      </div>
      <p className="text-xs text-white/80 mb-3">
        {stores.subtitle || "We'll connect stores in your country — current deals right in the app"}
      </p>
      {!joined ? (
        <button onClick={handleJoin}
          className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}>
          <Bell className="w-4 h-4" /> {stores.notify || '🔔 Notify me when ready'}
        </button>
      ) : (
        <div className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
          ✅ {stores.alreadyJoined || 'You\'ll be notified'}
        </div>
      )}
      {waitlistCount > 0 && (
        <p className="text-[11px] text-white/60 text-center mt-2">
          {(stores.waitlistCount || '{count} users are waiting').replace('{count}', String(waitlistCount))}
        </p>
      )}
    </div>
  );
};

export default StoreDealsCard;
