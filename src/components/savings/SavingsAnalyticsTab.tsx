import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney } from '@/lib/formatMoney';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { TrendingUp, TrendingDown } from 'lucide-react';

const cardStyle = { borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };

interface TopProduct {
  name: string;
  count: number;
  latestPrice: number;
  avgPrice: number;
  trend: number | null;
  currency: string;
  topStore: string | null;
}

interface Props {
  topProducts: TopProduct[];
  receipts: any[];
  currency: string;
}

const SavingsAnalyticsTab = ({ topProducts, receipts, currency }: Props) => {
  const { t } = useTranslation();
  const sp = (t as any).savingsPage || {};
  const { canUse, isFree } = usePlanLimits();

  if (isFree) {
    return (
      <div style={cardStyle} className="p-6 bg-card text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-sm font-medium text-foreground mb-1">{sp.analyticsLocked || 'Analytics available in Lite & Pro'}</p>
        <p className="text-xs text-muted-foreground">{sp.analyticsLockedDesc || 'Upgrade to see spending trends and price insights'}</p>
      </div>
    );
  }

  if (!topProducts.length) {
    return (
      <div style={cardStyle} className="p-6 bg-card text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-sm text-muted-foreground">{sp.needMoreData || 'Add prices or scan receipts to see analytics'}</p>
      </div>
    );
  }

  // Store breakdown from receipts
  const storeSpending: Record<string, number> = {};
  for (const r of receipts) {
    if (r.store_name) {
      storeSpending[r.store_name] = (storeSpending[r.store_name] || 0) + Number(r.total_amount || 0);
    }
  }
  const storeEntries = Object.entries(storeSpending).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Top products */}
      <div style={cardStyle} className="p-5 bg-card">
        <h3 className="text-sm font-bold mb-3 text-foreground">{sp.topProducts || 'Most bought'}</h3>
        <div className="space-y-2.5">
          {topProducts.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground capitalize truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.count}× • {formatMoney(p.latestPrice, p.currency)}
                  {p.topStore && <> • {p.topStore}</>}
                </p>
              </div>
              {p.trend !== null && Math.abs(p.trend) >= 5 && (
                <div className="flex items-center gap-1 text-xs font-medium" style={{ color: p.trend > 0 ? '#DC2626' : '#059669' }}>
                  {p.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {p.trend > 0 ? '+' : ''}{Math.round(p.trend)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price trends */}
      {topProducts.some(p => p.trend !== null && Math.abs(p.trend) >= 5) && (
        <div style={cardStyle} className="p-5 bg-card">
          <h3 className="text-sm font-bold mb-3 text-foreground">{sp.priceTrends || 'Price trends'}</h3>
          <div className="space-y-2">
            {topProducts.filter(p => p.trend !== null && Math.abs(p.trend!) >= 5).map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span>{p.trend! > 0 ? '📈' : '📉'}</span>
                <span className="text-foreground capitalize">{p.name}</span>
                <span className="ml-auto font-medium" style={{ color: p.trend! > 0 ? '#DC2626' : '#059669' }}>
                  {p.trend! > 0 ? '+' : ''}{Math.round(p.trend!)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store breakdown */}
      {storeEntries.length > 1 && (
        <div style={cardStyle} className="p-5 bg-card">
          <h3 className="text-sm font-bold mb-3 text-foreground">{sp.storeBreakdown || 'Spending by store'}</h3>
          <div className="space-y-2">
            {storeEntries.map(([store, amount], idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground">🏪 {store}</span>
                <span className="font-medium text-muted-foreground">{formatMoney(amount, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsAnalyticsTab;
