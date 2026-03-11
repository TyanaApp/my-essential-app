import { useNavigate } from 'react-router-dom';
import { ChevronRight, Camera } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney } from '@/lib/formatMoney';

const cardStyle = { borderRadius: '20px', boxShadow: '0 2px 16px rgba(124,58,237,0.08)' };

interface Props {
  monthlyData: any;
  receipts: any[];
  currency: string;
}

const SavingsMoneyTab = ({ monthlyData, receipts, currency }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sp = (t as any).savingsPage || {};

  const hasData = monthlyData?.hasData;

  if (!hasData) {
    return (
      <div className="space-y-4">
        <div style={cardStyle} className="p-6 bg-card text-center">
          <div className="text-5xl mb-4">💰</div>
          <p className="text-sm text-muted-foreground mb-4">
            {sp.addPricesHint || 'Add prices when shopping or scan receipts to track spending'}
          </p>
          <button
            onClick={() => navigate('/shopping')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground"
          >
            <Camera className="w-4 h-4" />
            {sp.scanReceipt || 'Scan receipt'}
          </button>
        </div>
      </div>
    );
  }

  const diff = monthlyData.diff;
  const pct = monthlyData.pctChange;

  return (
    <div className="space-y-4">
      {/* This month spending */}
      <div style={cardStyle} className="p-5 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🛒</span>
          <h3 className="text-sm font-bold text-foreground">{sp.foodSpending || 'Food spending this month'}</h3>
        </div>
        <p className="text-3xl font-bold text-foreground">{formatMoney(monthlyData.thisMonth, currency)}</p>
      </div>

      {/* Month comparison */}
      {monthlyData.lastMonth > 0 && (
        <div style={cardStyle} className="p-5 bg-card">
          <h3 className="text-sm font-bold mb-2 text-foreground">{sp.monthComparison || 'Monthly Comparison'}</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{sp.thisMonth || 'This month'}</span>
            <span className="font-bold text-foreground">{formatMoney(monthlyData.thisMonth, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">{sp.lastMonth || 'Last month'}</span>
            <span className="font-medium text-muted-foreground">{formatMoney(monthlyData.lastMonth, currency)}</span>
          </div>
          {diff !== 0 && (
            <p className="text-xs mt-2 font-medium" style={{ color: diff < 0 ? '#059669' : '#DC2626' }}>
              {diff < 0 ? '↓' : '↑'} {formatMoney(Math.abs(diff), currency)} ({pct > 0 ? '+' : ''}{pct}%) {sp.comparedToLast || 'compared to last month'} {diff < 0 ? '🎉' : ''}
            </p>
          )}
        </div>
      )}

      {/* Receipts list */}
      {receipts.length > 0 && (
        <div style={cardStyle} className="p-5 bg-card">
          <h3 className="text-sm font-bold mb-2 text-foreground">{sp.recentReceipts || 'Recent receipts'}</h3>
          <div className="space-y-2">
            {receipts.slice(0, 5).map((r: any) => (
              <button key={r.id} onClick={() => navigate('/receipts')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors text-left">
                <div className="flex items-center gap-2">
                  <span>🧾</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.store_name || 'Receipt'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-primary">{formatMoney(r.total_amount || 0, r.currency || currency)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsMoneyTab;
