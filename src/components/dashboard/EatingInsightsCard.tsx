import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

const EatingInsightsCard = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [insights, setInsights] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const adaptive = (t as any).adaptive || {};

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const cacheKey = `tyana_insights_${user.id}`;
      const today = new Date().toISOString().split('T')[0];

      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { date, data } = JSON.parse(cached);
          if (date === today) {
            setInsights(data);
            return;
          }
        }
      } catch {}

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('eating-insights', {
          body: { language },
        });

        if (!error && data?.insights && Array.isArray(data.insights) && data.insights.length > 0) {
          setInsights(data.insights);
          localStorage.setItem(cacheKey, JSON.stringify({ date: today, data: data.insights }));
        } else if (data?.reason === 'not_enough_data') {
          setInsights(null);
        }
      } catch (e) {
        console.error('Insights error:', e);
      }
      setLoading(false);
    };

    fetch();
  }, [user, language]);

  if (!loading && !insights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-[0_2px_16px_rgba(124,58,237,0.08)]"
    >
      <h3 className="text-sm font-bold mb-2 text-foreground">
        {adaptive.insightsTitle || '📊 TYANA noticed:'}
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 rounded-full animate-spin border-accent border-t-primary" />
          <span className="text-xs text-muted-foreground">
            {adaptive.insightsLoading || 'Analyzing your patterns...'}
          </span>
        </div>
      ) : insights ? (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/80">
              {insight}
            </p>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
};

export default EatingInsightsCard;
