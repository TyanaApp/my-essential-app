import React from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const T = {
  en: {
    inventory: { title: 'Inventory limit reached', desc: 'Upgrade to Lite to add up to 100 products' },
    gpt: { title: 'AI requests used up today', desc: 'Limit resets tomorrow or upgrade to Lite' },
    recipes: { title: 'Recipe suggestion limit reached', desc: 'Upgrade for more daily recipes' },
    receiptScan: { title: 'Receipt scanning is available in Lite and Pro', desc: 'Upgrade to start scanning receipts' },
    fridgeScan: { title: 'Fridge scan limit reached', desc: 'Upgrade for more scans' },
    mealPlan: { title: 'Weekly meal plan is available in Pro', desc: 'Upgrade to Pro for AI meal planning' },
    familyMode: { title: 'Family mode is available in Pro', desc: 'Upgrade to Pro for family sharing' },
    workouts: { title: 'Workouts are available in Lite and Pro', desc: 'Upgrade to track your workouts' },
    analytics: { title: 'Analytics available in Lite and Pro', desc: 'Upgrade to see your nutrition trends' },
    lite: 'Lite — €4.99/mo',
    pro: 'Pro — €6.49/mo',
    proRegular: 'Pro — €9.99/mo',
    viewPlans: 'View all plans',
    notNow: 'Not now',
    waitTomorrow: 'Not now — wait until tomorrow',
  },
  ru: {
    inventory: { title: 'Лимит продуктов — Free план', desc: 'Перейди на Lite чтобы добавить до 100 продуктов' },
    gpt: { title: 'Использованы ИИ-расчёты сегодня', desc: 'Лимит обновится завтра или перейди на Lite' },
    recipes: { title: 'Лимит рецептов на сегодня', desc: 'Перейди на Lite для 5 рецептов в день' },
    receiptScan: { title: 'Сканирование чеков доступно в Lite и Pro', desc: 'Перейди на Lite чтобы сканировать чеки' },
    fridgeScan: { title: 'Лимит сканирований холодильника', desc: 'Перейди на Lite для 10 сканирований в месяц' },
    mealPlan: { title: 'План питания на неделю доступен в Pro', desc: 'Перейди на Pro для ИИ-планирования' },
    familyMode: { title: 'Семейный режим доступен в Pro', desc: 'Перейди на Pro для совместного использования' },
    workouts: { title: 'Тренировки доступны в Lite и Pro', desc: 'Перейди на Lite для трекера тренировок' },
    analytics: { title: 'Аналитика доступна в Lite и Pro', desc: 'Перейди на Lite для трендов питания' },
    lite: 'Lite — €4.99/мес',
    pro: 'Pro — €6.49/мес',
    proRegular: 'Pro — €9.99/мес',
    viewPlans: 'Посмотреть все планы',
    notNow: 'Не сейчас',
    waitTomorrow: 'Не сейчас — подождать до завтра',
  },
  lv: {
    inventory: { title: 'Produktu limits sasniegts', desc: 'Pāriet uz Lite, lai pievienotu līdz 100 produktiem' },
    gpt: { title: 'AI pieprasījumi šodien izlietoti', desc: 'Limits atjaunosies rīt vai pārejiet uz Lite' },
    recipes: { title: 'Recepšu ieteikumu limits sasniegts', desc: 'Uzlabojiet, lai iegūtu vairāk recepšu' },
    receiptScan: { title: 'Čeku skenēšana pieejama Lite un Pro', desc: 'Pārejiet uz Lite, lai skenētu čekus' },
    fridgeScan: { title: 'Ledusskapja skenēšanas limits', desc: 'Pārejiet uz Lite, lai iegūtu vairāk skenēšanu' },
    mealPlan: { title: 'Nedēļas ēdienreižu plāns pieejams Pro', desc: 'Pārejiet uz Pro AI plānošanai' },
    familyMode: { title: 'Ģimenes režīms pieejams Pro', desc: 'Pārejiet uz Pro kopīgai lietošanai' },
    workouts: { title: 'Treniņi pieejami Lite un Pro', desc: 'Pārejiet uz Lite treniņu izsekošanai' },
    analytics: { title: 'Analītika pieejama Lite un Pro', desc: 'Pārejiet uz Lite uztura tendencēm' },
    lite: 'Lite — €4.99/mēn',
    pro: 'Pro — €6.49/mēn',
    proRegular: 'Pro — €9.99/mēn',
    viewPlans: 'Skatīt visus plānus',
    notNow: 'Ne tagad',
    waitTomorrow: 'Ne tagad — gaidīt līdz rītdienai',
  },
  uk: {
    inventory: { title: 'Ліміт продуктів — Free план', desc: 'Перейди на Lite щоб додати до 100 продуктів' },
    gpt: { title: 'Використано ШІ-розрахунки сьогодні', desc: 'Ліміт оновиться завтра або перейди на Lite' },
    recipes: { title: 'Ліміт рецептів на сьогодні', desc: 'Перейди на Lite для 5 рецептів на день' },
    receiptScan: { title: 'Сканування чеків доступне в Lite і Pro', desc: 'Перейди на Lite щоб сканувати чеки' },
    fridgeScan: { title: 'Ліміт сканувань холодильника', desc: 'Перейди на Lite для 10 сканувань на місяць' },
    mealPlan: { title: 'План харчування на тиждень доступний в Pro', desc: 'Перейди на Pro для ШІ-планування' },
    familyMode: { title: 'Сімейний режим доступний в Pro', desc: 'Перейди на Pro для спільного використання' },
    workouts: { title: 'Тренування доступні в Lite і Pro', desc: 'Перейди на Lite для трекера тренувань' },
    analytics: { title: 'Аналітика доступна в Lite і Pro', desc: 'Перейди на Lite для трендів харчування' },
    lite: 'Lite — €4.99/міс',
    pro: 'Pro — €6.49/міс',
    proRegular: 'Pro — €9.99/міс',
    viewPlans: 'Переглянути всі плани',
    notNow: 'Не зараз',
    waitTomorrow: 'Не зараз — почекати до завтра',
  },
};

interface UpgradeLimitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  emoji: string;
  suggestedPlan: 'lite' | 'pro';
  isFoundingMember?: boolean;
}

const UpgradeLimitSheet: React.FC<UpgradeLimitSheetProps> = ({
  open, onOpenChange, feature, emoji, suggestedPlan, isFoundingMember,
}) => {
  const { language } = useLanguage();
  const { createCheckout } = useSubscription();
  const [processing, setProcessing] = useState<string | null>(null);

  const t = T[language as keyof typeof T] || T.en;
  const featureT = (t as any)[feature] || { title: 'Limit reached', desc: 'Upgrade your plan' };
  const isGptOrRecipe = feature === 'gpt' || feature === 'recipes';

  const handleCheckout = async (plan: 'lite' | 'pro_founding' | 'pro_regular') => {
    setProcessing(plan);
    try {
      await createCheckout(plan);
      onOpenChange(false);
    } catch {
      // fallback
    } finally {
      setProcessing(null);
    }
  };

  const handleViewPlans = () => {
    onOpenChange(false);
    if (!window.location.pathname.includes('/profile')) {
      window.location.href = '/profile';
    }
    setTimeout(() => window.dispatchEvent(new CustomEvent('open-payments')), 500);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border px-6 pb-8 pt-4 max-w-lg mx-auto">
        <div className="text-center space-y-4">
          <div className="text-5xl">{emoji}</div>
          <h3 className="text-lg font-bold text-foreground">{featureT.title}</h3>
          <p className="text-sm text-muted-foreground">{featureT.desc}</p>

          <div className="flex flex-col gap-2 pt-2">
            {suggestedPlan === 'lite' && (
              <Button
                className="w-full text-base py-5 text-white"
                style={{ backgroundColor: '#7C3AED' }}
                onClick={() => handleCheckout('lite')}
                disabled={!!processing}
              >
                {processing === 'lite' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                ⭐️ {t.lite}
              </Button>
            )}

            {(suggestedPlan === 'pro' || feature === 'receiptScan') && (
              <Button
                className={`w-full text-base py-5 ${suggestedPlan === 'pro' ? 'text-white' : ''}`}
                style={suggestedPlan === 'pro' ? { backgroundColor: '#7C3AED' } : undefined}
                variant={suggestedPlan === 'pro' ? 'default' : 'outline'}
                onClick={() => handleCheckout(isFoundingMember ? 'pro_founding' : 'pro_regular')}
                disabled={!!processing}
              >
                {(processing === 'pro_founding' || processing === 'pro_regular') && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                🚀 {isFoundingMember ? t.pro : t.proRegular}
              </Button>
            )}

            {suggestedPlan === 'lite' && feature !== 'workouts' && (
              <Button variant="outline" className="w-full" onClick={handleViewPlans}>
                {t.viewPlans}
              </Button>
            )}

            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground hover:text-foreground pt-1"
            >
              {isGptOrRecipe ? t.waitTomorrow : t.notNow}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default UpgradeLimitSheet;
