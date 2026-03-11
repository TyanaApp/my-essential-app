import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney } from '@/lib/formatMoney';

const cardStyle = { borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };

interface Props {
  productsData: { items: { name: string; count: number; value: number }[]; totalValue: number; currency: string } | null;
  wasteStats: { wasted: number; wastedValue: number };
  currency: string;
}

const SavingsProductsTab = ({ productsData, wasteStats, currency }: Props) => {
  const { t } = useTranslation();
  const sp = (t as any).savingsPage || {};

  const items = productsData?.items || [];
  const totalValue = productsData?.totalValue || 0;
  const totalCount = items.reduce((s, i) => s + i.count, 0);
  const hasValue = totalValue > 0;

  const totalItems = totalCount + wasteStats.wasted;
  const wasteScore = totalItems > 0 ? Math.round((totalCount / totalItems) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Used before expiry */}
      <div style={cardStyle} className="p-5 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌿</span>
          <h3 className="text-sm font-bold text-foreground">
            {sp.usedThisMonth || 'Used before expiry this month'}
          </h3>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{sp.noProductsSaved || 'No products saved yet'}</p>
        ) : (
          <>
            <div className="space-y-1.5 mb-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">
                    {item.count} {sp.times || '×'}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-sm font-medium text-foreground">
                {sp.totalNotWasted || 'Total'}: {totalCount} {sp.productsNotWasted || 'products not wasted'}
              </p>
              {hasValue && (
                <p className="text-xs mt-1" style={{ color: '#059669' }}>
                  ~{formatMoney(totalValue, currency)} {sp.savedBasedOnPrices || 'saved (based on your prices)'}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Waste stats */}
      <div style={cardStyle} className="p-5 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h3 className="text-sm font-bold text-foreground">{sp.itemsWasted || 'Items expired'}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {wasteStats.wasted} {sp.products || 'products'}
          {wasteStats.wastedValue > 0 && <> • {formatMoney(wasteStats.wastedValue, currency)} {sp.lost || 'lost'}</>}
        </p>
      </div>

      {/* Waste score */}
      <div style={cardStyle} className="p-5 bg-card">
        <h3 className="text-sm font-bold mb-2 text-foreground">{sp.wasteScore || 'Waste Score'}</h3>
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
        <p className="text-xs mt-1 text-muted-foreground">{sp.wasteScoreDesc || 'Products used before expiry'}</p>
      </div>
    </div>
  );
};

export default SavingsProductsTab;
