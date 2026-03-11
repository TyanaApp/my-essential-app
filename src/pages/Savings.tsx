import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/formatMoney';
import { usePriceMemory } from '@/hooks/usePriceMemory';
import SavingsMoneyTab from '@/components/savings/SavingsMoneyTab';
import SavingsProductsTab from '@/components/savings/SavingsProductsTab';
import SavingsAnalyticsTab from '@/components/savings/SavingsAnalyticsTab';

const Savings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const savingsT = (t as any).savings || {};
  const sp = (t as any).savingsPage || {};
  usePageTitle(savingsT.title);

  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('EUR');
  const [receipts, setReceipts] = useState<any[]>([]);
  const { getMonthlySpending, getProductsUsedBeforeExpiry, getTopProducts } = usePriceMemory();

  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [wasteStats, setWasteStats] = useState({ wasted: 0, wastedValue: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, receiptsRes, monthly, products, top] = await Promise.all([
        supabase.from('profiles').select('currency').eq('user_id', user.id).maybeSingle(),
        supabase.from('receipts' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        getMonthlySpending(),
        getProductsUsedBeforeExpiry(),
        getTopProducts(),
      ]);

      setCurrency(profileRes.data?.currency || 'EUR');
      setReceipts(receiptsRes.data || []);
      setMonthlyData(monthly);
      setProductsData(products);
      setTopProducts(top);

      // Waste stats
      const { data: expired } = await supabase
        .from('inventory_items')
        .select('price_per_unit, quantity, expires_at')
        .eq('user_id', user.id)
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString().split('T')[0]);
      const expiredItems = expired || [];
      setWasteStats({
        wasted: expiredItems.length,
        wastedValue: expiredItems.reduce((s, i: any) => s + (Number(i.price_per_unit || 0) * Number(i.quantity || 1)), 0),
      });

      setLoading(false);
    };
    load();
  }, [user]);

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
          <Tabs defaultValue="money" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="money" className="flex-1 text-xs">💰 {sp.moneyTab || 'Money'}</TabsTrigger>
              <TabsTrigger value="products" className="flex-1 text-xs">🌿 {sp.productsTab || 'Products'}</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 text-xs">📊 {sp.analyticsTab || 'Analytics'}</TabsTrigger>
            </TabsList>

            <TabsContent value="money">
              <SavingsMoneyTab
                monthlyData={monthlyData}
                receipts={receipts}
                currency={currency}
              />
            </TabsContent>

            <TabsContent value="products">
              <SavingsProductsTab
                productsData={productsData}
                wasteStats={wasteStats}
                currency={currency}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <SavingsAnalyticsTab
                topProducts={topProducts}
                receipts={receipts}
                currency={currency}
              />
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
};

export default Savings;
