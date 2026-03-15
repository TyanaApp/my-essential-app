import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Watch, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface WatchMetrics {
  caloriesBurned?: number | null;
  heartRate?: number | null;
  heartRateMin?: number | null;
  heartRateMax?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  sleepQuality?: string | null;
  stressLevel?: number | null;
  bloodOxygen?: number | null;
  activeMinutes?: number | null;
  distance?: number | null;
}

interface WatchAdvice {
  adjustedCalories?: number;
  calorieAdjustment?: number;
  adjustmentReason?: string;
  tip?: string;
  tipCategory?: string;
  tipEmoji?: string;
}

interface WatchData {
  metrics: { metrics: WatchMetrics; watchBrand?: string; confidence?: string };
  advice: WatchAdvice | null;
}

const WATCH_LABELS: Record<string, Record<string, string>> = {
  button: { en: '⌚️ Upload watch data', ru: '⌚️ Загрузить данные с часов', uk: '⌚️ Завантажити дані з годинника', lv: '⌚️ Augšupielādēt pulksteņa datus' },
  hint: { en: 'Take a photo of your watch screen', ru: 'Сфотографируй экран своих часов', uk: 'Сфотографуй екран своїх годинників', lv: 'Nofotografē sava pulksteņa ekrānu' },
  loading: { en: 'Analyzing watch data...', ru: 'Анализируем данные с часов...', uk: 'Аналізуємо дані з годинника...', lv: 'Analizējam pulksteņa datus...' },
  title: { en: '⌚️ Watch data today', ru: '⌚️ Данные с часов сегодня', uk: '⌚️ Дані з годинника сьогодні', lv: '⌚️ Pulksteņa dati šodien' },
  locked: { en: 'Available in Pro', ru: 'Доступно в Pro', uk: 'Доступно в Pro', lv: 'Pieejams Pro' },
  lockedBtn: { en: '⌚️ Watch data', ru: '⌚️ Данные с часов', uk: '⌚️ Дані з годинника', lv: '⌚️ Pulksteņa dati' },
  burned: { en: 'burned', ru: 'сожжено', uk: 'спалено', lv: 'sadedzināts' },
  bpm: { en: 'bpm', ru: 'уд/мин', uk: 'уд/хв', lv: 'sird./min' },
  steps: { en: 'steps', ru: 'шагов', uk: 'кроків', lv: 'soļi' },
  sleep: { en: 'h sleep', ru: 'ч сна', uk: 'г сну', lv: 'h miega' },
  stress: { en: 'Stress', ru: 'Стресс', uk: 'Стрес', lv: 'Stress' },
  stressLow: { en: 'low', ru: 'низкий', uk: 'низький', lv: 'zems' },
  stressMedium: { en: 'medium', ru: 'средний', uk: 'середній', lv: 'vidējs' },
  stressHigh: { en: 'high', ru: 'высокий', uk: 'високий', lv: 'augsts' },
  sleepGood: { en: 'Good', ru: 'Хорошо', uk: 'Добре', lv: 'Labi' },
  sleepFair: { en: 'Fair', ru: 'Средне', uk: 'Середньо', lv: 'Vidēji' },
  sleepPoor: { en: 'Poor', ru: 'Плохо', uk: 'Погано', lv: 'Slikti' },
  watchAdj: { en: '⌚️ +{cal} kcal from watch data', ru: '⌚️ +{cal} ккал по данным часов', uk: '⌚️ +{cal} ккал з даних годинника', lv: '⌚️ +{cal} kcal no pulksteņa' },
  error: { en: 'Failed to analyze watch data', ru: 'Не удалось проанализировать данные', uk: 'Не вдалося проаналізувати дані', lv: 'Neizdevās analizēt datus' },
};

const l = (key: string, lang: string) => WATCH_LABELS[key]?.[lang] || WATCH_LABELS[key]?.en || key;

interface Props {
  fadeUp: (i: number) => any;
  cardClass: string;
  isPro: boolean;
  onWatchCalories?: (cal: number, adjustment: number) => void;
  onWatchAdvice?: (advice: WatchAdvice) => void;
}

const WatchDataWidget = ({ fadeUp, cardClass, isPro, onWatchCalories, onWatchAdvice }: Props) => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [watchData, setWatchData] = useState<WatchData | null>(null);

  // Load today's existing watch data
  useEffect(() => {
    if (!user || !isPro) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('watch_data' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          const m = data.raw_metrics || {};
          setWatchData({ metrics: m, advice: data.advice });
          if (data.advice?.calorieAdjustment && onWatchCalories) {
            onWatchCalories(data.calories_burned || 0, data.advice.calorieAdjustment);
          }
          if (data.advice && onWatchAdvice) {
            onWatchAdvice(data.advice);
          }
        }
      });
  }, [user, isPro]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('analyze-watch-data', {
        body: { image: base64, language },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setWatchData(data);

      if (data.advice?.calorieAdjustment && onWatchCalories) {
        onWatchCalories(
          data.metrics?.metrics?.caloriesBurned || 0,
          data.advice.calorieAdjustment
        );
      }
      if (data.advice && onWatchAdvice) {
        onWatchAdvice(data.advice);
      }

      toast.success('✓');
    } catch (err: any) {
      console.error('Watch analysis error:', err);
      toast.error(l('error', language));
    }
    setLoading(false);
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const getStressLabel = (level: number | null | undefined) => {
    if (!level) return '';
    if (level < 40) return l('stressLow', language);
    if (level < 70) return l('stressMedium', language);
    return l('stressHigh', language);
  };

  const getSleepLabel = (quality: string | null | undefined) => {
    if (!quality) return '';
    if (quality === 'good') return l('sleepGood', language);
    if (quality === 'fair') return l('sleepFair', language);
    return l('sleepPoor', language);
  };

  // Locked state for non-Pro users
  if (!isPro) {
    return (
      <motion.div {...fadeUp(1.5)} className={`${cardClass} p-4`}>
        <button
          disabled
          className="w-full py-2.5 rounded-xl text-sm font-semibold border-[1.5px] border-muted text-muted-foreground flex items-center justify-center gap-2 opacity-60"
        >
          {l('lockedBtn', language)} <Lock className="w-3.5 h-3.5" />
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">{l('locked', language)}</p>
      </motion.div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <motion.div {...fadeUp(1.5)} className={`${cardClass} p-5 flex items-center justify-center gap-3`}>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{l('loading', language)}</span>
      </motion.div>
    );
  }

  // Results card
  if (watchData) {
    const m = watchData.metrics?.metrics;
    const adv = watchData.advice;
    if (!m) return null;

    const metrics = [
      m.caloriesBurned != null && { emoji: '🔥', value: `${m.caloriesBurned} ${language === 'ru' || language === 'uk' ? 'ккал' : 'kcal'} ${l('burned', language)}` },
      m.heartRate != null && { emoji: '💓', value: `${m.heartRate} ${l('bpm', language)}${m.heartRateMin != null && m.heartRateMax != null ? ` (${m.heartRateMin}-${m.heartRateMax})` : ''}` },
      m.steps != null && { emoji: '👣', value: `${m.steps.toLocaleString()} ${l('steps', language)}` },
      m.sleepHours != null && { emoji: '😴', value: `${m.sleepHours} ${l('sleep', language)}${m.sleepQuality ? ` • ${getSleepLabel(m.sleepQuality)}` : ''}` },
      m.bloodOxygen != null && { emoji: '🫁', value: `SpO2: ${m.bloodOxygen}%` },
      m.stressLevel != null && { emoji: '🧘', value: `${l('stress', language)}: ${getStressLabel(m.stressLevel)}` },
      m.activeMinutes != null && { emoji: '⚡', value: `${m.activeMinutes} min` },
      m.distance != null && { emoji: '📍', value: `${m.distance} km` },
    ].filter(Boolean) as { emoji: string; value: string }[];

    return (
      <motion.div {...fadeUp(1.5)} className={`${cardClass} p-4`}>
        <h3 className="text-sm font-bold text-foreground mb-3">{l('title', language)}</h3>
        <div className="space-y-1.5">
          {metrics.map((row, i) => (
            <p key={i} className="text-sm text-foreground">
              {row.emoji} {row.value}
            </p>
          ))}
        </div>

        {adv?.tip && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-sm text-foreground/90">
              {adv.tipEmoji} {adv.tip}
            </p>
          </div>
        )}

        {adv?.calorieAdjustment != null && adv.calorieAdjustment > 0 && (
          <p className="text-xs font-medium mt-2" style={{ color: '#059669' }}>
            {l('watchAdj', language).replace('{cal}', String(adv.calorieAdjustment))}
          </p>
        )}

        {/* Re-upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-3 w-full py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          🔄 {l('button', language)}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </motion.div>
    );
  }

  // Default: upload button
  return (
    <motion.div {...fadeUp(1.5)} className={`${cardClass} p-4`}>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border-[1.5px] border-primary text-primary flex items-center justify-center gap-2"
      >
        {l('button', language)}
      </button>
      <p className="text-[10px] text-muted-foreground text-center mt-1.5">{l('hint', language)}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
    </motion.div>
  );
};

export default WatchDataWidget;
