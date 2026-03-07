import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { usePageTitle } from '@/hooks/usePageTitle';
import SkeletonCard from '@/components/SkeletonCard';
import NotificationBanner from '@/components/NotificationBanner';
import { useTranslation } from '@/hooks/useTranslation';

const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'PLN', symbol: 'zł' },
  { code: 'UAH', symbol: '₴' },
  { code: 'RUB', symbol: '₽' },
];

interface DashboardData {
  displayName: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  protein: number;
  fat: number;
  carbs: number;
  expiringItems: { id: string; name: string; days: number }[];
  recentRecipes: { id: string; title: string; prepTime: number | null; estimatedCost: number | null }[];
  savingsThisMonth: number;
  monthlyBudget: number;
  currency: string;
  useItUpRecipe: { id: string; title: string; matchCount: number } | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  usePageTitle(t.nav.home);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkSubscription } = useSubscription();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t.dashboard.morning;
    if (h < 18) return t.dashboard.afternoon;
    return t.dashboard.evening;
  };

  const formatDate = () => {
    const locale = language === 'ru' ? 'ru-RU' : language === 'lv' ? 'lv-LV' : 'en-US';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle upgrade success
  useEffect(() => {
    if (searchParams.get('upgrade') === 'success') {
      const planName = searchParams.get('plan') || 'Pro';
      toast.success(t.dashboard.upgradeSuccess.replace('{plan}', planName));
      checkSubscription();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [profileRes, goalsRes, mealsRes, expiringRes, recipesRes, savingsRes] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_goals').select('daily_calories_target, monthly_budget').eq('user_id', user.id).maybeSingle(),
        supabase.from('meal_entries').select('total_calories, total_protein, total_fat, total_carbs').eq('user_id', user.id).eq('date', today),
        supabase.from('inventory_items').select('id, name, expires_at').eq('user_id', user.id).not('expires_at', 'is', null).lte('expires_at', threeDaysFromNow).gte('expires_at', today).order('expires_at', { ascending: true }).limit(5),
        supabase.from('recipes').select('id, title, prep_time, estimated_cost, ingredients').eq('user_id', user.id).eq('is_favorite', true).order('created_at', { ascending: false }).limit(20),
        supabase.from('savings_log').select('amount').eq('user_id', user.id).gte('created_at', monthStart),
      ]);

      const meals = mealsRes.data || [];
      const caloriesConsumed = meals.reduce((s, m) => s + (m.total_calories || 0), 0);
      const protein = meals.reduce((s, m) => s + Number(m.total_protein || 0), 0);
      const fat = meals.reduce((s, m) => s + Number(m.total_fat || 0), 0);
      const carbs = meals.reduce((s, m) => s + Number(m.total_carbs || 0), 0);

      const expiringItems = (expiringRes.data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        days: Math.ceil((new Date(i.expires_at).getTime() - Date.now()) / 86400000),
      }));

      const savingsThisMonth = (savingsRes.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

      // Find "use it up" recipe — the saved recipe that uses the most expiring ingredients
      let useItUpRecipe: DashboardData['useItUpRecipe'] = null;
      if (expiringItems.length > 0 && recipesRes.data && recipesRes.data.length > 0) {
        const expiringNames = expiringItems.map(i => i.name.toLowerCase());
        let bestMatch = { id: '', title: '', matchCount: 0 };
        
        for (const recipe of recipesRes.data) {
          if (!recipe.ingredients) continue;
          const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : typeof recipe.ingredients === 'object'
              ? Object.values(recipe.ingredients)
              : [];
          
          let matchCount = 0;
          for (const ing of ingredients) {
            const ingName = typeof ing === 'string' ? ing.toLowerCase() : (ing as any)?.name?.toLowerCase() || '';
            if (expiringNames.some(en => ingName.includes(en) || en.includes(ingName))) {
              matchCount++;
            }
          }
          if (matchCount > bestMatch.matchCount) {
            bestMatch = { id: recipe.id, title: recipe.title, matchCount };
          }
        }
        if (bestMatch.matchCount > 0) {
          useItUpRecipe = bestMatch;
        }
      }

      setData({
        displayName: profileRes.data?.display_name || 'there',
        caloriesConsumed,
        caloriesTarget: goalsRes.data?.daily_calories_target || 2000,
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
        expiringItems,
        recentRecipes: (recipesRes.data || []).slice(0, 3) as any,
        savingsThisMonth,
        monthlyBudget: Number(goalsRes.data?.monthly_budget) || 200,
        useItUpRecipe,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 pb-mobile-safe space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (!data) return null;

  const remaining = data.caloriesTarget - data.caloriesConsumed;
  const pct = Math.min(data.caloriesConsumed / data.caloriesTarget, 1);
  const circumference = 2 * Math.PI * 72;
  const strokeDashoffset = circumference * (1 - pct);

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 2px 16px rgba(124,58,237,0.08)',
  };

  const fadeUp = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: i * 0.1 },
  });

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      {/* Notification opt-in banner */}
      <NotificationBanner />

      {/* Greeting */}
      <motion.div {...fadeUp(0)} className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>
          {getGreeting()}, {data.displayName}! 👋
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{formatDate()}</p>
      </motion.div>

      <div className="space-y-4">
        {/* Card 1 — Calories */}
        <motion.div {...fadeUp(1)} style={cardStyle} className="p-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="72" fill="none" stroke="#EDE9FE" strokeWidth="12" />
                <circle
                  cx="90" cy="90" r="72"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 90 90)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>
                  {data.caloriesConsumed}
                </span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  / {data.caloriesTarget} kcal
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="space-y-2 mb-3">
                {[
                  { label: t.dashboard.protein, value: data.protein, color: '#059669', max: 150 },
                  { label: t.dashboard.fat, value: data.fat, color: '#EA580C', max: 80 },
                  { label: t.dashboard.carbs, value: data.carbs, color: '#2563EB', max: 250 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: '#6B7280' }}>{m.label}</span>
                      <span className="font-medium" style={{ color: m.color }}>{m.value}g</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: m.color,
                          width: `${Math.min((m.value / m.max) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm font-semibold" style={{ color: remaining >= 0 ? '#059669' : '#DC2626' }}>
                {remaining >= 0 ? `${remaining} ${t.dashboard.remaining}` : `${Math.abs(remaining)} ${t.dashboard.overTarget}`}
              </p>

              <button
                onClick={() => navigate('/diary')}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-[1.5px]"
                style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
              >
                <Plus className="w-3.5 h-3.5" /> {t.dashboard.logMeal}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Card 2 — Expiring Soon */}
        <motion.div {...fadeUp(2)} style={cardStyle} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#1E1B4B' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#EA580C' }} />
              {data.expiringItems.length > 0
                ? t.dashboard.expiringTitle.replace('{count}', String(data.expiringItems.length))
                : t.dashboard.nothingExpiring}
            </h3>
            <button
              onClick={() => navigate('/inventory?tab=expiring')}
              className="text-xs font-medium flex items-center gap-0.5"
              style={{ color: '#7C3AED' }}
            >
              {t.dashboard.viewAll} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.expiringItems.length > 0 ? (
            <div className="space-y-2">
              {data.expiringItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <span className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{item.name}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: item.days <= 1 ? '#FEE2E2' : '#FEF3C7',
                      color: item.days <= 1 ? '#DC2626' : '#EA580C',
                    }}
                  >
                    {item.days <= 0 ? t.dashboard.today : t.dashboard.daysLeft.replace('{days}', String(item.days))}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>

        {/* Card 2.5 — Use It Up suggestion */}
        {data.useItUpRecipe && (
          <motion.div {...fadeUp(2.5)} style={cardStyle} className="p-5">
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1E1B4B' }}>
              {t.notifications.useBeforeGone}
            </h3>
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍳</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{data.useItUpRecipe.title}</p>
                  <p className="text-[11px]" style={{ color: '#059669' }}>
                    {data.useItUpRecipe.matchCount} {language === 'ru' ? 'совпадающих продуктов' : language === 'lv' ? 'atbilstoši produkti' : 'matching ingredients'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/recipes')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                style={{ backgroundColor: '#059669' }}
              >
                {t.notifications.cookNow}
              </button>
            </div>
          </motion.div>
        )}

        {/* Card 3 — Recipe Ideas */}
        <motion.div {...fadeUp(3)} style={cardStyle} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{t.dashboard.ideasToday}</h3>
            <button
              onClick={() => navigate('/recipes')}
              className="text-xs font-medium flex items-center gap-0.5"
              style={{ color: '#7C3AED' }}
            >
              {t.recipes.allRecipes} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.recentRecipes.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {data.recentRecipes.map((r) => (
                <div
                  key={r.id}
                  className="shrink-0 w-40 rounded-xl overflow-hidden cursor-pointer"
                  style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE' }}
                  onClick={() => navigate('/recipes')}
                >
                  <div
                    className="h-20 flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
                  >
                    🍽
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1E1B4B' }}>{r.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>
                      {r.prepTime ? `⏱ ${r.prepTime} min` : ''}{r.estimatedCost ? ` · €${r.estimatedCost.toFixed(2)}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate('/recipes')}
              className="w-full py-6 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px dashed #DDD6FE' }}
            >
              {t.dashboard.generateRecipes}
            </button>
          )}
        </motion.div>

        {/* Card 4 — Savings */}
        <motion.div {...fadeUp(4)} style={cardStyle} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>
              💚 €{data.savingsThisMonth.toFixed(2)} {t.dashboard.savedMonth}
            </h3>
            <button
              onClick={() => navigate('/savings')}
              className="text-xs font-medium flex items-center gap-0.5"
              style={{ color: '#7C3AED' }}
            >
              {t.dashboard.seeDetails} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: '#059669',
                width: `${Math.min((data.savingsThisMonth / data.monthlyBudget) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>
            {t.dashboard.ofGoal.replace('{amount}', String(data.monthlyBudget))}
          </p>
        </motion.div>

        {/* Card 5 — Zero Waste Tip */}
        <motion.div {...fadeUp(5)} style={cardStyle} className="p-5">
          <h3 className="text-sm font-bold mb-2" style={{ color: '#1E1B4B' }}>
            ♻️ {(t as any).tips?.title || 'Zero waste tip of the day'}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {(() => {
              const tips = (t as any).tips?.daily || [
                'Use leftover rice for fried rice tomorrow',
                'Vegetable peels make great broth',
                'Freeze bread before it goes stale',
                'Wilting herbs? Make herb oil',
                'Almost-expired yogurt works great in smoothies',
                'Plan meals Sunday to waste 40% less',
                'Check your fridge before grocery shopping',
              ];
              return tips[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
            })()}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
