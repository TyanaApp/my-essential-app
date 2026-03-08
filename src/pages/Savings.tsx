import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/formatMoney';
import { toast } from 'sonner';

interface SavingsEntry {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface Receipt {
  id: string;
  store_name: string | null;
  total_amount: number | null;
  currency: string;
  receipt_date: string | null;
  items: any[];
  created_at: string;
}

interface AnalyticsData {
  totalSpent: number;
  avgWeekly: number;
  topProducts: string[];
  categories: { name: string; amount: number; percent: number; emoji?: string }[];
  insights: string[];
  savingTip: string;
  monthComparison?: { current: number; previous: number; diff: number };
}

const DONUT_COLORS = ['#7C3AED', '#059669', '#EA580C', '#2563EB', '#DC2626', '#D97706'];

const Savings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const savingsT = (t as any).savings || {};
  const savingsPageT = (t as any).savingsPage || {};
  usePageTitle(savingsT.title);

  const [spent, setSpent] = useState(0);
  const [saved, setSaved] = useState(0);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [currency, setCurrency] = useState('EUR');
  const [monthlyBudget, setMonthlyBudget] = useState(200);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Zero-waste stats
  const [wasteStats, setWasteStats] = useState({ used: 0, usedValue: 0, wasted: 0, wastedValue: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [logsRes, profileRes, receiptsRes, goalsRes] = await Promise.all([
        supabase.from('savings_log').select('*').eq('user_id', user.id).gte('created_at', monthStart).order('created_at', { ascending: false }),
        supabase.from('profiles').select('currency').eq('user_id', user.id).maybeSingle(),
        supabase.from('receipts' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_goals').select('monthly_budget').eq('user_id', user.id).maybeSingle(),
      ]);
      const logs = (logsRes.data || []) as any[];
      setEntries(logs.map((l: any) => ({ id: l.id, amount: Number(l.amount || 0), type: l.type || 'other', description: l.description || '', created_at: l.created_at })));
      setSpent(logs.filter(l => l.type === 'purchase').reduce((s, l) => s + Math.abs(Number(l.amount || 0)), 0));
      setSaved(logs.filter(l => l.type === 'saved' || l.type === 'waste_prevented').reduce((s, l) => s + Number(l.amount || 0), 0));
      setCurrency(profileRes.data?.currency || 'EUR');
      setReceipts((receiptsRes.data || []) as any[]);
      setMonthlyBudget(Number(goalsRes.data?.monthly_budget) || 200);

      // Calculate waste stats from inventory
      const [usedRes, expiredRes] = await Promise.all([
        supabase.from('inventory_items').select('price_per_unit, quantity').eq('user_id', user.id).eq('tracking_mode', 'tracked'),
        supabase.from('inventory_items').select('price_per_unit, quantity, expires_at').eq('user_id', user.id).not('expires_at', 'is', null).lt('expires_at', new Date().toISOString().split('T')[0]),
      ]);
      const expiredItems = expiredRes.data || [];
      const wastedValue = expiredItems.reduce((s, i: any) => s + (Number(i.price_per_unit || 0) * Number(i.quantity || 1)), 0);

      setWasteStats({
        used: saved > 0 ? Math.round(saved / 2) : 0, // Approximate from savings
        usedValue: saved,
        wasted: expiredItems.length,
        wastedValue,
      });

      setLoading(false);
    };
    load();
  }, [user]);

  // Fetch analytics when 3+ receipts
  useEffect(() => {
    if (receipts.length < 3 || analyticsLoading || analytics) return;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('receipt-analytics', {
          body: { receipts: receipts.slice(0, 20), language, monthlyBudget },
        });
        if (!error && data && !data.error) {
          setAnalytics(data);
        }
      } catch (e) {
        console.error('Analytics error:', e);
      }
      setAnalyticsLoading(false);
    };
    fetchAnalytics();
  }, [receipts, language]);

  const budgetPct = monthlyBudget > 0 ? Math.min((spent / monthlyBudget) * 100, 100) : 0;
  const totalItems = wasteStats.used + wasteStats.wasted;
  const wasteScore = totalItems > 0 ? Math.round((wasteStats.used / totalItems) * 100) : 100;

  const cardStyle = { borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };

  return (
    <div className="min-h-screen p-6 pb-24">
      <button onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm font-medium mb-5 text-primary">
        <ArrowLeft className="w-4 h-4" /> {savingsT.backToDashboard}
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-4 text-foreground">{savingsT.title}</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-[3px] rounded-full animate-spin border-accent border-t-primary" />
          </div>
        ) : (
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="analytics" className="flex-1 text-xs">📊 {savingsPageT.analyticsTab || 'Analytics'}</TabsTrigger>
              <TabsTrigger value="receipts" className="flex-1 text-xs">🧾 {savingsPageT.receiptsTab || 'Receipts'}</TabsTrigger>
              <TabsTrigger value="zerowaste" className="flex-1 text-xs">♻️ {savingsPageT.zeroWasteTab || 'Zero Waste'}</TabsTrigger>
            </TabsList>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="space-y-4">
              {/* Budget progress */}
              <div style={cardStyle} className="p-5 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">💸 {savingsT.spent}</span>
                  <span className="text-sm font-bold" style={{ color: '#DC2626' }}>{formatMoney(spent, currency)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted mb-1">
                  <div className="h-full rounded-full transition-all" style={{
                    backgroundColor: budgetPct > 90 ? '#DC2626' : budgetPct > 70 ? '#EA580C' : '#059669',
                    width: `${budgetPct}%`,
                  }} />
                </div>
                <p className="text-[11px] text-muted-foreground text-right">
                  📊 {formatMoney(spent, currency)} / {formatMoney(monthlyBudget, currency)}
                </p>
              </div>

              {/* Saved card */}
              <div style={cardStyle} className="p-5 bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💚</span>
                  <h3 className="text-sm font-bold text-foreground">{savingsT.saved}</h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#059669' }}>{formatMoney(saved, currency)}</p>
                <p className="text-xs mt-1 text-muted-foreground">{savingsT.usedBeforeExpiry}</p>
              </div>

              {/* Category donut chart */}
              {analytics && analytics.categories && analytics.categories.length > 0 && (
                <div style={cardStyle} className="p-5 bg-card">
                  <h3 className="text-sm font-bold mb-3 text-foreground">{savingsPageT.spendingBreakdown || 'Spending Breakdown'}</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.categories} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} strokeWidth={2}>
                            {analytics.categories.map((_, idx) => (
                              <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {analytics.categories.slice(0, 5).map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                          <span className="text-foreground">{cat.emoji || ''} {cat.name}</span>
                          <span className="ml-auto font-medium text-muted-foreground">{cat.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Month comparison */}
              {analytics?.monthComparison && (
                <div style={cardStyle} className="p-5 bg-card">
                  <h3 className="text-sm font-bold mb-2 text-foreground">{savingsPageT.monthComparison || 'Monthly Comparison'}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{savingsPageT.thisMonth || 'This month'}</span>
                    <span className="font-bold text-foreground">{formatMoney(analytics.monthComparison.current, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">{savingsPageT.lastMonth || 'Last month'}</span>
                    <span className="font-medium text-muted-foreground">{formatMoney(analytics.monthComparison.previous, currency)}</span>
                  </div>
                  {analytics.monthComparison.diff !== 0 && (
                    <p className="text-xs mt-2 font-medium" style={{ color: analytics.monthComparison.diff < 0 ? '#059669' : '#DC2626' }}>
                      {analytics.monthComparison.diff < 0 ? '↓' : '↑'} {formatMoney(Math.abs(analytics.monthComparison.diff), currency)} {savingsPageT.comparedToLast || 'compared to last month'} {analytics.monthComparison.diff < 0 ? '🎉' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Top products */}
              {analytics?.topProducts && analytics.topProducts.length > 0 && (
                <div style={cardStyle} className="p-5 bg-card">
                  <h3 className="text-sm font-bold mb-2 text-foreground">{savingsPageT.topProducts || 'Most bought'}</h3>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topProducts.map((p, idx) => (
                      <span key={idx} className="text-xs px-3 py-1.5 rounded-full bg-accent text-primary font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {analytics?.insights && analytics.insights.length > 0 && (
                <div className="space-y-2">
                  {analytics.insights.map((insight, idx) => (
                    <div key={idx} style={cardStyle} className="p-4 bg-card flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                      <p className="text-sm text-foreground">{insight}</p>
                    </div>
                  ))}
                  {analytics.savingTip && (
                    <div style={{ ...cardStyle, background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))' }} className="p-4 text-white">
                      <p className="text-sm font-medium">💡 {analytics.savingTip}</p>
                    </div>
                  )}
                </div>
              )}

              {analyticsLoading && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin border-accent border-t-primary" />
                  <span className="text-xs text-muted-foreground">{savingsPageT.analyzingReceipts || 'Analyzing receipts...'}</span>
                </div>
              )}

              {!analyticsLoading && receipts.length < 3 && (
                <div style={cardStyle} className="p-5 bg-card text-center">
                  <p className="text-sm text-muted-foreground">
                    {savingsPageT.needMoreReceipts || 'Scan 3+ receipts to see spending analytics'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* RECEIPTS TAB */}
            <TabsContent value="receipts" className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">
                {savingsPageT.totalScanned || 'Total scanned'}: {receipts.length} • {formatMoney(receipts.reduce((s, r) => s + (r.total_amount || 0), 0), currency)}
              </p>
              {receipts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🧾</div>
                  <p className="text-sm text-muted-foreground">{savingsPageT.noReceipts || 'No receipts yet'}</p>
                </div>
              ) : (
                receipts.map(r => (
                  <button key={r.id} onClick={() => navigate('/receipts')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-card text-left hover:bg-accent/50 transition-colors"
                    style={cardStyle}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🧾</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.store_name || 'Receipt'}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{formatMoney(r.total_amount || 0, r.currency || currency)}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </TabsContent>

            {/* ZERO WASTE TAB */}
            <TabsContent value="zerowaste" className="space-y-4">
              <div style={cardStyle} className="p-5 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✅</span>
                  <h3 className="text-sm font-bold text-foreground">{savingsPageT.usedBeforeExpiry || 'Used before expiry'}</h3>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#059669' }}>{formatMoney(saved, currency)}</p>
              </div>

              <div style={cardStyle} className="p-5 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚠️</span>
                  <h3 className="text-sm font-bold text-foreground">{savingsPageT.itemsWasted || 'Items expired'}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {wasteStats.wasted} {savingsPageT.products || 'products'} • {formatMoney(wasteStats.wastedValue, currency)} {savingsPageT.lost || 'lost'}
                </p>
              </div>

              <div style={cardStyle} className="p-5 bg-card">
                <h3 className="text-sm font-bold mb-2 text-foreground">{savingsPageT.wasteScore || 'Waste Score'}</h3>
                <div className="flex items-center gap-3">
                  <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      backgroundColor: wasteScore > 80 ? '#059669' : wasteScore > 50 ? '#EA580C' : '#DC2626',
                      width: `${wasteScore}%`,
                    }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: wasteScore > 80 ? '#059669' : '#EA580C' }}>
                    {wasteScore}% ✅
                  </span>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  {savingsPageT.wasteScoreDesc || 'Products used before expiry'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
};

export default Savings;
