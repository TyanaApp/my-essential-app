import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'PLN', symbol: 'zł' },
  { code: 'UAH', symbol: '₴' },
  { code: 'RUB', symbol: '₽' },
];

interface SavingsEntry {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

const Savings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  usePageTitle(t.savings.title);
  const [spent, setSpent] = useState(0);
  const [saved, setSaved] = useState(0);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [logsRes, profileRes] = await Promise.all([
        supabase.from('savings_log').select('*').eq('user_id', user.id).gte('created_at', monthStart).order('created_at', { ascending: false }),
        supabase.from('profiles').select('currency').eq('user_id', user.id).maybeSingle(),
      ]);
      const logs = (logsRes.data || []) as any[];
      setEntries(logs.map((l: any) => ({ id: l.id, amount: Number(l.amount || 0), type: l.type || 'other', description: l.description || '', created_at: l.created_at })));
      setSpent(logs.filter(l => l.type === 'purchase').reduce((s, l) => s + Math.abs(Number(l.amount || 0)), 0));
      setSaved(logs.filter(l => l.type === 'saved' || l.type === 'waste_prevented').reduce((s, l) => s + Number(l.amount || 0), 0));
      setCurrency(profileRes.data?.currency || 'EUR');
      setLoading(false);
    };
    load();
  }, [user]);

  const currSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '€';

  const cardStyle = { backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };

  return (
    <div className="min-h-screen p-6 pb-24">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm font-medium mb-5"
        style={{ color: '#7C3AED' }}
      >
        <ArrowLeft className="w-4 h-4" /> {t.savings.backToDashboard}
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.savings.title}</h1>
        <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>{t.savings.subtitle}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Spent card */}
            <div style={cardStyle} className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💸</span>
                <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>
                  {language === 'ru' ? 'Потрачено в этом месяце' : language === 'lv' ? 'Iztērēts šomēnes' : 'Spent this month'}
                </h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#DC2626' }}>{currSymbol}{spent.toFixed(2)}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                {language === 'ru' ? 'Покупки продуктов' : language === 'lv' ? 'Pārtikas pirkumi' : 'Grocery purchases'}
              </p>
            </div>

            {/* Saved card */}
            <div style={cardStyle} className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💚</span>
                <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>
                  {language === 'ru' ? 'Сэкономлено от отходов' : language === 'lv' ? 'Ietaupīts no atkritumiem' : 'Saved from waste'}
                </h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#059669' }}>{currSymbol}{saved.toFixed(2)}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                {language === 'ru' ? 'Продукты использованы до истечения срока' : language === 'lv' ? 'Produkti izlietoti pirms termiņa' : 'Items used before expiry'}
              </p>
            </div>

            {/* History */}
            <div style={cardStyle} className="p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: '#1E1B4B' }}>
                {language === 'ru' ? 'История' : language === 'lv' ? 'Vēsture' : 'History'}
              </h3>
              {entries.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>
                  {language === 'ru' ? 'Пока нет записей' : language === 'lv' ? 'Pagaidām nav ierakstu' : 'No entries yet'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {entries.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-2 rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
                      <div className="flex items-center gap-2">
                        <span>{e.type === 'purchase' ? '💸' : '💚'}</span>
                        <div>
                          <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{e.description || e.type}</p>
                          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
                            {new Date(e.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold" style={{ color: e.type === 'purchase' ? '#DC2626' : '#059669' }}>
                        {e.type === 'purchase' ? '-' : '+'}{currSymbol}{Math.abs(e.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Savings;
