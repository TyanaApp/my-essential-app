import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ChevronRight } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/formatMoney';
import { toast } from 'sonner';

interface Receipt {
  id: string;
  store_name: string | null;
  total_amount: number | null;
  currency: string;
  receipt_date: string | null;
  items: any[];
  created_at: string;
}

const Receipts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const receipt = (t as any).receipt || {};
  const receiptPage = (t as any).receiptPage || {};
  usePageTitle(receipt.receiptHistory || 'Receipt History');

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [receiptsRes, profileRes] = await Promise.all([
        supabase.from('receipts' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('currency').eq('user_id', user.id).maybeSingle(),
      ]);
      setReceipts((receiptsRes.data || []) as any[]);
      setCurrency(profileRes.data?.currency || 'EUR');
      setLoading(false);
    };
    load();
  }, [user]);

  const totalSpent = receipts.reduce((s, r) => s + (r.total_amount || 0), 0);

  const handleDelete = async (id: string) => {
    const r = receipts.find(r => r.id === id);
    await supabase.from('receipts' as any).delete().eq('id', id);
    // Also remove associated savings_log entry
    if (r && user) {
      await supabase.from('savings_log').delete()
        .eq('user_id', user.id)
        .eq('type', 'purchase')
        .like('description', `🧾%${r.receipt_date || ''}%`);
    }
    setReceipts(prev => prev.filter(r => r.id !== id));
    toast.success(receiptPage.deleted || 'Receipt deleted ✓');
  };

  const cardStyle = { borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };

  return (
    <div className="min-h-screen p-6 pb-24">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium mb-5 text-primary">
        <ArrowLeft className="w-4 h-4" /> {t.common.back}
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1 text-foreground">🧾 {receipt.receiptHistory || 'Receipt History'}</h1>
        <p className="text-sm mb-6 text-muted-foreground">
          {receiptPage.totalScanned || 'Total scanned'}: {receipts.length} {receiptPage.receiptsWord || 'receipts'} • {formatMoney(totalSpent, currency)} {receiptPage.spentWord || 'spent'}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-[3px] rounded-full animate-spin border-accent border-t-primary" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🧾</div>
            <p className="text-sm text-muted-foreground">{receiptPage.noReceipts || 'No receipts scanned yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map(r => {
              const items = Array.isArray(r.items) ? r.items : [];
              const foodCount = items.filter((i: any) => i.isFood && i.addedToInventory).length;
              const isExpanded = expandedId === r.id;

              return (
                <div key={r.id} style={cardStyle} className="bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧾</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{r.store_name || receipt.receipt || 'Receipt'}</p>
                        <p className="text-xs text-muted-foreground">
                          📅 {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{formatMoney(r.total_amount || 0, r.currency || currency)}</span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <div className="space-y-1.5 mb-3">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-2">
                              <span>{item.isFood ? '🥗' : '🧴'}</span>
                              <span className="text-foreground">{item.name}</span>
                              <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                            </div>
                            <span className="font-medium text-foreground">{formatMoney(item.price || 0, r.currency || currency)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>{receiptPage.foodAdded || 'Food added to inventory'}: {foodCount}</span>
                      </div>
                      <button onClick={() => handleDelete(r.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline">
                        <Trash2 className="w-3.5 h-3.5" /> {receiptPage.deleteReceipt || 'Delete receipt'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Receipts;
