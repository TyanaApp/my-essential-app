import { useState, useEffect, useRef } from 'react';
import { searchProducts, OFFProduct } from '@/lib/openFoodFacts';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2 } from 'lucide-react';

interface OFFProductSuggestionsProps {
  query: string;
  onSelect: (product: OFFProduct) => void;
  className?: string;
}

const OFFProductSuggestions = ({ query, onSelect, className = '' }: OFFProductSuggestionsProps) => {
  const { language } = useTranslation();
  const off = ((useTranslation().t) as any).openFoodFacts || {};
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.trim().length < 3) {
      setResults([]);
      setVisible(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const found = await searchProducts(query, language);
      setResults(found);
      setVisible(found.length > 0);
      setLoading(false);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, language]);

  if (!visible && !loading) return null;

  return (
    <div className={`bg-card border border-border rounded-xl shadow-lg overflow-hidden ${className}`}>
      {loading ? (
        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          {off.searching || 'Searching...'}
        </div>
      ) : (
        <>
          <div className="px-3 py-2 bg-muted/50 border-b border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              📦 {off.foundInDatabase || 'Found in product database'}
            </p>
          </div>
          {results.map((product, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelect(product);
                setVisible(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-sm">📦</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {product.name}
                  {product.brand && <span className="text-muted-foreground font-normal"> • {product.brand}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.calories} kcal/100g • 
                  {language === 'ru' || language === 'uk' ? ' Б' : ' P'}:{product.protein} 
                  {language === 'ru' || language === 'uk' ? ' Ж' : ' F'}:{product.fat} 
                  {language === 'ru' || language === 'uk' ? ' У' : ' C'}:{product.carbs}
                </p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium whitespace-nowrap">
                ✅ {off.dataFromLabel || 'Label'}
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

export default OFFProductSuggestions;
