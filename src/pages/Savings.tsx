import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/formatMoney';

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
  const { t } = useTranslation();
  usePageTitle(t.savings.title);
  const [spent, setSpent] = useState(0);
  const [saved, setSaved] = useState(0);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);

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

  // Group receipt entries by date for receipt history
  const receiptEntries = useMemo(() => {
    return entries.filter(e => e.type === 'purchase' && e.description?.startsWith('🧾'));
  }, [entries]);

  const otherEntries = useMemo(() => {
    return entries.filter(e => !(e.type === 'purchase' && e.description?.startsWith('🧾')));
  }, [entries]);

  const cardStyle = { borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };
  const receipt = (t as any).receipt || {};

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
        <h1 className="text-2xl font-bold mb-2 text-foreground">{t.savings.title}</h1>
        <p className="text-sm mb-6 text-muted-foreground">{t.savings.subtitle}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-[3px] rounded-full animate-spin" style={{ borderColor: '#EDE9FE', borderTopColor: '#7C3AED' }} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Spent card */}
            <div style={cardStyle} className="p-5 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💸</span>
                <h3 className="text-sm font-bold text-foreground">{t.savings.spent}</h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#DC2626' }}>{formatMoney(spent, currency)}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{t.savings.groceryPurchases}</p>
            </div>

            {/* Saved card */}
            <div style={cardStyle} className="p-5 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💚</span>
                <h3 className="text-sm font-bold text-foreground">{t.savings.saved}</h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#059669' }}>{formatMoney(saved, currency)}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{t.savings.usedBeforeExpiry}</p>
            </div>

            {/* Receipt History */}
            {receiptEntries.length > 0 && (
              <div style={cardStyle} className="p-5 bg-card">
                <h3 className="text-sm font-bold mb-3 text-foreground">
                  🧾 {receipt.receiptHistory || 'Receipt History'}
                </h3>
                <div className="space-y-2">
                  {receiptEntries.map(e => {
                    // Parse description like "🧾 Rimi 2026-03-08"
                    const parts = e.description.replace('🧾 ', '').split(' ');
                    const store = parts.slice(0, -1).join(' ') || receipt.receipt || 'Receipt';
                    const date = parts[parts.length - 1] || '';
                    return (
                      <button key={e.id} onClick={() => setExpandedReceipt(expandedReceipt === e.id ? null : e.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors hover:bg-[#F5F3FF]"
                        style={{ backgroundColor: expandedReceipt === e.id ? '#F5F3FF' : 'transparent' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧾</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{store}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                              {date ? new Date(date).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#DC2626' }}>
                          -{formatMoney(Math.abs(e.amount), currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other History */}
            <div style={cardStyle} className="p-5 bg-card">
              <h3 className="text-sm font-bold mb-3 text-foreground">{t.savings.history}</h3>
              {otherEntries.length === 0 && receiptEntries.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>{t.savings.noEntries}</p>
              ) : otherEntries.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>—</p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {otherEntries.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-2 rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
                      <div className="flex items-center gap-2">
                        <span>{e.type === 'purchase' ? '💸' : '💚'}</span>
                        <div>
                          <p className="text-xs font-medium text-foreground">{e.description || e.type}</p>
                          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{new Date(e.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold" style={{ color: e.type === 'purchase' ? '#DC2626' : '#059669' }}>
                        {e.type === 'purchase' ? '-' : '+'}{formatMoney(Math.abs(e.amount), currency)}
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
