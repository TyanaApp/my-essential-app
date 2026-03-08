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
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Check localStorage first
    if (localStorage.getItem('store_waitlist_joined') === 'true') return;
    if (!user) { setHidden(false); return; }
    
    supabase.from('profiles').select('store_integration_waitlist').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data?.store_integration_waitlist) {
        localStorage.setItem('store_waitlist_joined', 'true');
      } else {
        setHidden(false);
      }
    });
  }, [user]);

  const handleJoin = async () => {
    if (user) {
      await supabase.from('profiles').update({ store_integration_waitlist: true } as any).eq('user_id', user.id);
    }
    localStorage.setItem('store_waitlist_joined', 'true');
    setHidden(true);
    toast.success(stores.joined || "We'll notify you when it's ready ✓");
  };

  if (hidden) return null;

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
      <button onClick={handleJoin}
        className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}>
        <Bell className="w-4 h-4" /> {stores.notify || '🔔 Notify me when ready'}
      </button>
    </div>
  );
};

export default StoreDealsCard;
