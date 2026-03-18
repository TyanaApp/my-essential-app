import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

/* ───────── types ───────── */
type Goal = 'lose' | 'gain' | 'balanced' | 'family' | 'time' | 'budget';
type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'gluten-free';
type Activity = 'low' | 'moderate' | 'active' | 'very_active';
type Gender = 'male' | 'female';
type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'ft';
type WeightLossSpeed = 'slow' | 'moderate' | 'fast' | 'intense';
type MuscleGainSpeed = 'slow' | 'moderate' | 'active';

const TOTAL_STEPS = 6;

/* ───────── i18n data ───────── */
const T: Record<string, any> = {
  en: {
    step1: { title: "Hey! I'm TYANA", sub: "Let's get started — what's your name?", placeholder: "Your name", btn: (n: string) => `Hello, ${n}! →` },
    step2: { title: "What's your main goal?", sub: "Pick one — you can change it later", btn: "Continue →",
      loseSpeedTitle: "How fast do you want to lose weight?",
      loseSpeeds: [
        { id: 'slow', emoji: '🐢', title: 'Slowly', desc: '−0.25 kg/week', sub: 'Gentle, no stress' },
        { id: 'moderate', emoji: '⚖️', title: 'Moderate', desc: '−0.5 kg/week', sub: 'Optimal pace', recommended: true },
        { id: 'fast', emoji: '🏃', title: 'Fast', desc: '−0.75 kg/week', sub: 'Noticeable results' },
        { id: 'intense', emoji: '⚡', title: 'Intense', desc: '−1 kg/week', sub: 'Maximum deficit' },
      ],
    },
    step3: { title: "A little about you", sub: "We'll calculate your personal calorie goal", gender: { male: "Male", female: "Female" }, age: "Age", weight: "Weight", height: "Height", kg: "kg", lbs: "lbs", cm: "cm", ft: "ft", btn: "Continue →" },
    step4: { title: "How do you eat?", sub: "We'll match recipes to you", allergiesTitle: "Any allergies?", allergiesSub: "Optional — can add later", btn: "Continue →" },
    step5: { title: "Who do you cook for?", sub: "We'll adjust portion sizes", dislikesTitle: "What don't you like?", dislikesPlaceholder: "E.g. cilantro, liver, eggplant...", optional: "Optional", btn: "Continue →" },
    step6: { allSet: "you're all set!", kcal: "kcal per day", personal: "Your personal daily goal", btn: "🚀 Start with TYANA", trial: "7 days Pro free • No card needed" },
    goals: [
      { id: 'lose', emoji: '🔥', title: 'Lose weight', desc: 'Shed extra pounds' },
      { id: 'gain', emoji: '💪', title: 'Build muscle', desc: 'Increase muscle mass' },
      { id: 'balanced', emoji: '⚖️', title: 'Eat balanced', desc: 'A balanced diet' },
      { id: 'family', emoji: '👨‍👩‍👧', title: 'Feed the family', desc: 'Cook for loved ones' },
      { id: 'time', emoji: '⏱️', title: 'Save time', desc: 'Quick and easy recipes' },
      { id: 'budget', emoji: '💰', title: 'Save money', desc: 'Waste less food' },
    ],
    activity: [
      { id: 'low', emoji: '🛋', title: 'Low', desc: 'Mostly sitting' },
      { id: 'moderate', emoji: '🚶', title: 'Moderate', desc: 'Walking, light activity' },
      { id: 'active', emoji: '🏃', title: 'Active', desc: 'Sports 3-4 times a week' },
      { id: 'very_active', emoji: '🔥', title: 'Very active', desc: 'Sports every day' },
    ],
    diets: [
      { id: 'omnivore', emoji: '🍽', title: 'Everything', desc: 'No restrictions' },
      { id: 'vegetarian', emoji: '🥗', title: 'Vegetarian', desc: 'No meat' },
      { id: 'vegan', emoji: '🌱', title: 'Vegan', desc: 'Plant-based only' },
      { id: 'keto', emoji: '🥑', title: 'Keto', desc: 'Low carbs' },
      { id: 'gluten-free', emoji: '🌾', title: 'Gluten-free', desc: 'Gluten intolerance' },
    ],
    allergies: [
      { id: 'nuts', emoji: '🥜', label: 'Nuts' },
      { id: 'dairy', emoji: '🥛', label: 'Dairy' },
      { id: 'eggs', emoji: '🥚', label: 'Eggs' },
      { id: 'gluten', emoji: '🌾', label: 'Gluten' },
      { id: 'fish', emoji: '🐟', label: 'Fish' },
      { id: 'soy', emoji: '🫘', label: 'Soy' },
    ],
    household: [
      { size: 1, emoji: '👤', label: 'Just me' },
      { size: 2, emoji: '👥', label: 'Two' },
      { size: 3, emoji: '👨‍👩‍👧', label: 'Three' },
      { size: 4, emoji: '👨‍👩‍👧‍👦', label: 'Four or more' },
    ],
    goalMessages: {
      lose: "At this deficit you'll lose ~0.5kg per week — safe and steady",
      gain: "A slight surplus will help build muscle without excess fat",
      balanced: "A balanced diet tailored to your lifestyle",
      family: (n: number) => `Recipes for ${n} people, tailored to you`,
      time: "Quick recipes under 30 minutes from what you have at home",
      budget: "We'll help you spend less and waste less food",
    },
    stepOf: (c: number, t: number) => `${c} of ${t}`,
    saving: "Saving...",
    errorSaving: "Error saving data",
    P: "P", F: "F", C: "C",
  },
  ru: {
    step1: { title: "Привет! Я TYANA", sub: "Давай познакомимся — как тебя зовут?", placeholder: "Твоё имя", btn: (n: string) => `Привет, ${n}! →` },
    step2: { title: "Какая главная цель?", sub: "Выбери одну — потом можно изменить", btn: "Продолжить →",
      loseSpeedTitle: "Как быстро хочешь худеть?",
      loseSpeeds: [
        { id: 'slow', emoji: '🐢', title: 'Медленно', desc: '−0.25 кг/нед', sub: 'Мягко, без стресса' },
        { id: 'moderate', emoji: '⚖️', title: 'Умеренно', desc: '−0.5 кг/нед', sub: 'Оптимальный темп', recommended: true },
        { id: 'fast', emoji: '🏃', title: 'Быстро', desc: '−0.75 кг/нед', sub: 'Заметный результат' },
        { id: 'intense', emoji: '⚡', title: 'Интенсивно', desc: '−1 кг/нед', sub: 'Максимальный дефицит' },
      ],
    },
    step3: { title: "Немного о себе", sub: "Рассчитаем твою личную норму калорий", gender: { male: "Мужчина", female: "Женщина" }, age: "Возраст", weight: "Вес", height: "Рост", kg: "кг", lbs: "фунты", cm: "см", ft: "футы", btn: "Продолжить →" },
    step4: { title: "Как ты питаешься?", sub: "Подберём рецепты под тебя", allergiesTitle: "Есть аллергии?", allergiesSub: "Необязательно — можно добавить позже", btn: "Продолжить →" },
    step5: { title: "Для кого готовишь?", sub: "Подберём размер порций", dislikesTitle: "Что не любишь?", dislikesPlaceholder: "Например: кинза, печень, баклажаны...", optional: "Необязательно", btn: "Продолжить →" },
    step6: { allSet: "всё готово!", kcal: "ккал в день", personal: "Твоя персональная норма", btn: "🚀 Начать с TYANA", trial: "7 дней Pro бесплатно • Карта не нужна" },
    goals: [
      { id: 'lose', emoji: '🔥', title: 'Похудеть', desc: 'Сбросить лишний вес' },
      { id: 'gain', emoji: '💪', title: 'Набрать мышцы', desc: 'Увеличить мышечную массу' },
      { id: 'balanced', emoji: '⚖️', title: 'Питаться правильно', desc: 'Сбалансированный рацион' },
      { id: 'family', emoji: '👨‍👩‍👧', title: 'Кормить семью', desc: 'Готовить для близких' },
      { id: 'time', emoji: '⏱️', title: 'Экономить время', desc: 'Быстрые и простые рецепты' },
      { id: 'budget', emoji: '💰', title: 'Экономить деньги', desc: 'Меньше выбрасывать еду' },
    ],
    activity: [
      { id: 'low', emoji: '🛋', title: 'Низкая', desc: 'Сижу большую часть дня' },
      { id: 'moderate', emoji: '🚶', title: 'Умеренная', desc: 'Прогулки, лёгкая активность' },
      { id: 'active', emoji: '🏃', title: 'Активная', desc: 'Спорт 3-4 раза в неделю' },
      { id: 'very_active', emoji: '🔥', title: 'Очень активная', desc: 'Спорт каждый день' },
    ],
    diets: [
      { id: 'omnivore', emoji: '🍽', title: 'Всё подряд', desc: 'Без ограничений' },
      { id: 'vegetarian', emoji: '🥗', title: 'Вегетарианец', desc: 'Без мяса' },
      { id: 'vegan', emoji: '🌱', title: 'Веган', desc: 'Только растительное' },
      { id: 'keto', emoji: '🥑', title: 'Кето', desc: 'Мало углеводов' },
      { id: 'gluten-free', emoji: '🌾', title: 'Без глютена', desc: 'Непереносимость глютена' },
    ],
    allergies: [
      { id: 'nuts', emoji: '🥜', label: 'Орехи' },
      { id: 'dairy', emoji: '🥛', label: 'Молочное' },
      { id: 'eggs', emoji: '🥚', label: 'Яйца' },
      { id: 'gluten', emoji: '🌾', label: 'Глютен' },
      { id: 'fish', emoji: '🐟', label: 'Рыба' },
      { id: 'soy', emoji: '🫘', label: 'Соя' },
    ],
    household: [
      { size: 1, emoji: '👤', label: 'Только я' },
      { size: 2, emoji: '👥', label: 'Двое' },
      { size: 3, emoji: '👨‍👩‍👧', label: 'Трое' },
      { size: 4, emoji: '👨‍👩‍👧‍👦', label: 'Четыре+' },
    ],
    goalMessages: {
      lose: "При таком дефиците ты будешь терять ~0.5кг в неделю — безопасно и стабильно",
      gain: "Небольшой профицит поможет набирать мышцы без лишнего жира",
      balanced: "Сбалансированный рацион для твоего образа жизни",
      family: (n: number) => `Рецепты для ${n} человек, подобранные под тебя`,
      time: "Быстрые рецепты до 30 минут из того что есть дома",
      budget: "Поможем тратить меньше и выбрасывать меньше еды",
    },
    stepOf: (c: number, t: number) => `${c} из ${t}`,
    saving: "Сохраняем...",
    errorSaving: "Ошибка сохранения",
    P: "Б", F: "Ж", C: "У",
  },
  uk: {
    step1: { title: "Привіт! Я TYANA", sub: "Давай познайомимось — як тебе звати?", placeholder: "Твоє ім'я", btn: (n: string) => `Привіт, ${n}! →` },
    step2: { title: "Яка головна ціль?", sub: "Вибери одну — потім можна змінити", btn: "Продовжити →",
      loseSpeedTitle: "Як швидко хочеш худнути?",
      loseSpeeds: [
        { id: 'slow', emoji: '🐢', title: 'Повільно', desc: '−0.25 кг/тижд', sub: 'М\'яко, без стресу' },
        { id: 'moderate', emoji: '⚖️', title: 'Помірно', desc: '−0.5 кг/тижд', sub: 'Оптимальний темп', recommended: true },
        { id: 'fast', emoji: '🏃', title: 'Швидко', desc: '−0.75 кг/тижд', sub: 'Помітний результат' },
        { id: 'intense', emoji: '⚡', title: 'Інтенсивно', desc: '−1 кг/тижд', sub: 'Максимальний дефіцит' },
      ],
    },
    step3: { title: "Трохи про себе", sub: "Розрахуємо твою особисту норму калорій", gender: { male: "Чоловік", female: "Жінка" }, age: "Вік", weight: "Вага", height: "Зріст", kg: "кг", lbs: "фунти", cm: "см", ft: "фути", btn: "Продовжити →" },
    step4: { title: "Як ти харчуєшся?", sub: "Підберемо рецепти для тебе", allergiesTitle: "Є алергії?", allergiesSub: "Необов'язково — можна додати пізніше", btn: "Продовжити →" },
    step5: { title: "Для кого готуєш?", sub: "Підберемо розмір порцій", dislikesTitle: "Що не любиш?", dislikesPlaceholder: "Наприклад: кінза, печінка, баклажани...", optional: "Необов'язково", btn: "Продовжити →" },
    step6: { allSet: "все готово!", kcal: "ккал на день", personal: "Твоя персональна норма", btn: "🚀 Почати з TYANA", trial: "7 днів Pro безкоштовно • Картка не потрібна" },
    goals: [
      { id: 'lose', emoji: '🔥', title: 'Схуднути', desc: 'Позбутися зайвої ваги' },
      { id: 'gain', emoji: '💪', title: 'Набрати м\'язи', desc: 'Збільшити м\'язову масу' },
      { id: 'balanced', emoji: '⚖️', title: 'Харчуватись правильно', desc: 'Збалансований раціон' },
      { id: 'family', emoji: '👨‍👩‍👧', title: 'Годувати сім\'ю', desc: 'Готувати для близьких' },
      { id: 'time', emoji: '⏱️', title: 'Економити час', desc: 'Швидкі та прості рецепти' },
      { id: 'budget', emoji: '💰', title: 'Економити гроші', desc: 'Менше викидати їжу' },
    ],
    activity: [
      { id: 'low', emoji: '🛋', title: 'Низька', desc: 'Сиджу більшу частину дня' },
      { id: 'moderate', emoji: '🚶', title: 'Помірна', desc: 'Прогулянки, легка активність' },
      { id: 'active', emoji: '🏃', title: 'Активна', desc: 'Спорт 3-4 рази на тиждень' },
      { id: 'very_active', emoji: '🔥', title: 'Дуже активна', desc: 'Спорт щодня' },
    ],
    diets: [
      { id: 'omnivore', emoji: '🍽', title: 'Все підряд', desc: 'Без обмежень' },
      { id: 'vegetarian', emoji: '🥗', title: 'Вегетаріанець', desc: 'Без м\'яса' },
      { id: 'vegan', emoji: '🌱', title: 'Веган', desc: 'Тільки рослинне' },
      { id: 'keto', emoji: '🥑', title: 'Кето', desc: 'Мало вуглеводів' },
      { id: 'gluten-free', emoji: '🌾', title: 'Без глютену', desc: 'Непереносимість глютену' },
    ],
    allergies: [
      { id: 'nuts', emoji: '🥜', label: 'Горіхи' },
      { id: 'dairy', emoji: '🥛', label: 'Молочне' },
      { id: 'eggs', emoji: '🥚', label: 'Яйця' },
      { id: 'gluten', emoji: '🌾', label: 'Глютен' },
      { id: 'fish', emoji: '🐟', label: 'Риба' },
      { id: 'soy', emoji: '🫘', label: 'Соя' },
    ],
    household: [
      { size: 1, emoji: '👤', label: 'Тільки я' },
      { size: 2, emoji: '👥', label: 'Двоє' },
      { size: 3, emoji: '👨‍👩‍👧', label: 'Троє' },
      { size: 4, emoji: '👨‍👩‍👧‍👦', label: 'Четверо+' },
    ],
    goalMessages: {
      lose: "При такому дефіциті ти втрачатимеш ~0.5кг на тиждень — безпечно та стабільно",
      gain: "Невеликий профіцит допоможе набирати м'язи без зайвого жиру",
      balanced: "Збалансований раціон для твого способу життя",
      family: (n: number) => `Рецепти для ${n} людей, підібрані для тебе`,
      time: "Швидкі рецепти до 30 хвилин з того що є вдома",
      budget: "Допоможемо витрачати менше та викидати менше їжі",
    },
    stepOf: (c: number, t: number) => `${c} з ${t}`,
    saving: "Зберігаємо...",
    errorSaving: "Помилка збереження",
    P: "Б", F: "Ж", C: "В",
  },
  lv: {
    step1: { title: "Sveiki! Es esmu TYANA", sub: "Iepazīsimies — kā tevi sauc?", placeholder: "Tavs vārds", btn: (n: string) => `Sveiki, ${n}! →` },
    step2: { title: "Kāds ir galvenais mērķis?", sub: "Izvēlies vienu — vēlāk var mainīt", btn: "Turpināt →",
      loseSpeedTitle: "Cik ātri vēlies zaudēt svaru?",
      loseSpeeds: [
        { id: 'slow', emoji: '🐢', title: 'Lēni', desc: '−0.25 kg/ned', sub: 'Maigi, bez stresa' },
        { id: 'moderate', emoji: '⚖️', title: 'Mēreni', desc: '−0.5 kg/ned', sub: 'Optimāls temps', recommended: true },
        { id: 'fast', emoji: '🏃', title: 'Ātri', desc: '−0.75 kg/ned', sub: 'Pamanāms rezultāts' },
        { id: 'intense', emoji: '⚡', title: 'Intensīvi', desc: '−1 kg/ned', sub: 'Maksimāls deficīts' },
      ],
    },
    step3: { title: "Nedaudz par sevi", sub: "Aprēķināsim tavu personīgo kaloriju normu", gender: { male: "Vīrietis", female: "Sieviete" }, age: "Vecums", weight: "Svars", height: "Augums", kg: "kg", lbs: "lbs", cm: "cm", ft: "ft", btn: "Turpināt →" },
    step4: { title: "Kā tu ēd?", sub: "Pielāgosim receptes tev", allergiesTitle: "Vai ir alerģijas?", allergiesSub: "Neobligāti — var pievienot vēlāk", btn: "Turpināt →" },
    step5: { title: "Kam tu gatavo?", sub: "Pielāgosim porciju izmērus", dislikesTitle: "Ko tu nemīli?", dislikesPlaceholder: "Piemēram: koriandrs, aknas, baklažāni...", optional: "Neobligāti", btn: "Turpināt →" },
    step6: { allSet: "viss gatavs!", kcal: "kcal dienā", personal: "Tava personīgā norma", btn: "🚀 Sākt ar TYANA", trial: "7 dienas Pro bezmaksas • Karte nav vajadzīga" },
    goals: [
      { id: 'lose', emoji: '🔥', title: 'Zaudēt svaru', desc: 'Atbrīvoties no liekā svara' },
      { id: 'gain', emoji: '💪', title: 'Veidot muskuļus', desc: 'Palielināt muskuļu masu' },
      { id: 'balanced', emoji: '⚖️', title: 'Ēst sabalansēti', desc: 'Sabalansēts uzturs' },
      { id: 'family', emoji: '👨‍👩‍👧', title: 'Barot ģimeni', desc: 'Gatavot mīļajiem' },
      { id: 'time', emoji: '⏱️', title: 'Taupīt laiku', desc: 'Ātras un vienkāršas receptes' },
      { id: 'budget', emoji: '💰', title: 'Taupīt naudu', desc: 'Mazāk izmest pārtiku' },
    ],
    activity: [
      { id: 'low', emoji: '🛋', title: 'Zema', desc: 'Galvenokārt sēdu' },
      { id: 'moderate', emoji: '🚶', title: 'Mērena', desc: 'Pastaigas, viegla aktivitāte' },
      { id: 'active', emoji: '🏃', title: 'Aktīva', desc: 'Sports 3-4 reizes nedēļā' },
      { id: 'very_active', emoji: '🔥', title: 'Ļoti aktīva', desc: 'Sports katru dienu' },
    ],
    diets: [
      { id: 'omnivore', emoji: '🍽', title: 'Viss', desc: 'Bez ierobežojumiem' },
      { id: 'vegetarian', emoji: '🥗', title: 'Veģetārietis', desc: 'Bez gaļas' },
      { id: 'vegan', emoji: '🌱', title: 'Vegāns', desc: 'Tikai augu izcelsmes' },
      { id: 'keto', emoji: '🥑', title: 'Keto', desc: 'Maz ogļhidrātu' },
      { id: 'gluten-free', emoji: '🌾', title: 'Bez glutēna', desc: 'Glutēna nepanesība' },
    ],
    allergies: [
      { id: 'nuts', emoji: '🥜', label: 'Rieksti' },
      { id: 'dairy', emoji: '🥛', label: 'Piens' },
      { id: 'eggs', emoji: '🥚', label: 'Olas' },
      { id: 'gluten', emoji: '🌾', label: 'Glutēns' },
      { id: 'fish', emoji: '🐟', label: 'Zivis' },
      { id: 'soy', emoji: '🫘', label: 'Sojas' },
    ],
    household: [
      { size: 1, emoji: '👤', label: 'Tikai es' },
      { size: 2, emoji: '👥', label: 'Divi' },
      { size: 3, emoji: '👨‍👩‍👧', label: 'Trīs' },
      { size: 4, emoji: '👨‍👩‍👧‍👦', label: 'Četri+' },
    ],
    goalMessages: {
      lose: "Ar šo deficītu tu zaudēsi ~0.5kg nedēļā — droši un stabili",
      gain: "Neliels pārpalikums palīdzēs veidot muskuļus bez liekā tauka",
      balanced: "Sabalansēts uzturs tavam dzīvesveidam",
      family: (n: number) => `Receptes ${n} cilvēkiem, pielāgotas tev`,
      time: "Ātras receptes līdz 30 minūtēm no tā kas ir mājās",
      budget: "Palīdzēsim tērēt mazāk un izmest mazāk pārtikas",
    },
    stepOf: (c: number, t: number) => `${c} no ${t}`,
    saving: "Saglabājam...",
    errorSaving: "Kļūda saglabājot",
    P: "O", F: "T", C: "O",
  },
};

/* ───────── helpers ───────── */
const ACTIVITY_FACTORS: Record<Activity, number> = { low: 1.2, moderate: 1.375, active: 1.55, very_active: 1.725 };

const DEFICIT_MAP: Record<string, number> = { slow: -250, moderate: -500, fast: -750, intense: -1000 };

const calcCalories = (gender: Gender, weightKg: number, heightCm: number, age: number, activity: Activity, goal: Goal, lossSpeed: WeightLossSpeed = 'moderate'): number => {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTORS[activity];
  let target = tdee;
  if (goal === 'lose') target = tdee + (DEFICIT_MAP[lossSpeed] || -500);
  else if (goal === 'gain') target = tdee + 200;
  // Safety minimums
  const minCal = gender === 'male' ? 1500 : 1200;
  return Math.round(Math.max(target, minCal));
};

const calcMacros = (cal: number) => ({
  protein: Math.round((cal * 0.25) / 4),
  fat: Math.round((cal * 0.30) / 9),
  carbs: Math.round((cal * 0.45) / 4),
});

/* ───────── Confetti component ───────── */
const Confetti = () => {
  const particles = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#A855F7', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'][i % 6],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: 1 }}
        />
      ))}
    </div>
  );
};

/* ───────── Number Stepper ───────── */
const NumberStepper = ({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-foreground active:scale-95 transition-transform"
      >−</button>
      <span className="w-16 text-center text-2xl font-bold text-foreground">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-foreground active:scale-95 transition-transform"
      >+</button>
    </div>
  </div>
);

/* ═══════════════════════════════════════ */
/* ═══════════ MAIN COMPONENT ═══════════ */
/* ═══════════════════════════════════════ */
const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const t = T[language] || T.en;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Data
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState(28);
  const [weightVal, setWeightVal] = useState(65);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [heightVal, setHeightVal] = useState(170);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [dietType, setDietType] = useState<Diet | null>(null);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState<number | null>(null);
  const [dislikedFreeText, setDislikedFreeText] = useState('');
  const [weightLossSpeed, setWeightLossSpeed] = useState<WeightLossSpeed>('moderate');

  // Pre-fill name
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
    }
  }, [user]);

  // Derived
  const weightKg = weightUnit === 'kg' ? weightVal : Math.round(weightVal / 2.205);
  const heightCm = heightUnit === 'cm' ? heightVal : Math.round(heightVal * 2.54); // stored as total inches when ft
  const calories = (gender && activity && goal) ? calcCalories(gender, weightKg, heightCm, age, activity, goal, weightLossSpeed) : 2000;
  const macros = calcMacros(calories);

  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(0, s - 1)); };

  const toggleAllergy = (id: string) => setSelectedAllergies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleFinish = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        display_name: name,
        gender,
        onboarding_completed: true,
      } as any).eq('user_id', user.id);

      // Activate trial via secure RPC
      try { await supabase.rpc('activate_trial' as any); } catch {}

      try { await supabase.rpc('assign_user_number', { p_user_id: user.id }); } catch {}

      const dislikedArr = dislikedFreeText.trim() ? dislikedFreeText.split(',').map(s => s.trim()).filter(Boolean) : [];

      await supabase.from('user_goals').upsert({
        user_id: user.id,
        goals: goal ? [goal === 'lose' ? 'lose_weight' : goal === 'gain' ? 'build_muscle' : goal] : [],
        diet_type: dietType || 'omnivore',
        household_size: householdSize || 1,
        allergies: selectedAllergies,
        disliked_foods: dislikedArr,
        daily_calories_target: calories,
        weight_kg: weightKg,
        height_cm: heightCm,
        age,
        activity_level: activity || 'moderate',
        weight_loss_speed: goal === 'lose' ? weightLossSpeed : null,
      } as any, { onConflict: 'user_id' });

      supabase.functions.invoke('send-welcome-email', {
        body: { email: user.email, name: name || user.email?.split('@')[0], language },
      }).catch(() => {});

      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      toast.error(t.errorSaving);
    } finally {
      setSaving(false);
    }
  }, [user, name, gender, goal, dietType, householdSize, selectedAllergies, dislikedFreeText, calories, weightKg, heightCm, age, activity, weightLossSpeed, language, navigate, t]);

  // Can proceed checks
  const canProceed = [
    name.trim().length >= 2,   // step 0
    !!goal,                     // step 1
    !!gender && !!activity,     // step 2
    !!dietType,                 // step 3
    !!householdSize,            // step 4
    true,                       // step 5
  ];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const goalMsg = goal ? t.goalMessages[goal] : '';
  const goalMsgText = typeof goalMsg === 'function' ? goalMsg(householdSize || 1) : goalMsg;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Header ─── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          {step > 0 ? (
            <button onClick={goBack} className="p-2 -ml-2 text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-9" />}
          <span className="text-xs text-muted-foreground">{t.stepOf(step + 1, TOTAL_STEPS)}</span>
          <div className="w-9" />
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full max-w-md mx-auto pt-6"
          >
            {/* ═══ STEP 1: Name ═══ */}
            {step === 0 && (
              <div className="text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }} className="text-6xl block mb-4">👋</motion.span>
                <h1 className="text-2xl font-bold text-foreground">{t.step1.title}</h1>
                <p className="text-muted-foreground mt-2 mb-8">{t.step1.sub}</p>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t.step1.placeholder}
                  className="w-full h-14 rounded-2xl px-5 text-center text-xl bg-muted text-foreground placeholder:text-muted-foreground/50 border-2 border-transparent focus:border-primary outline-none transition-colors"
                  autoFocus
                />
              </div>
            )}

            {/* ═══ STEP 2: Goal ═══ */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-foreground text-center">{t.step2.title}</h1>
                <p className="text-muted-foreground text-center mt-1 mb-6">{t.step2.sub}</p>
                <div className="grid grid-cols-2 gap-3">
                  {t.goals.map((g: any) => {
                    const selected = goal === g.id;
                    return (
                      <motion.button
                        key={g.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setGoal(g.id)}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        {selected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                        <span className="text-2xl">{g.emoji}</span>
                        <p className="font-semibold text-foreground mt-2 text-sm">{g.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Weight loss speed selector */}
                <AnimatePresence>
                  {goal === 'lose' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="font-semibold text-foreground text-sm mt-6 mb-3 text-center">{t.step2.loseSpeedTitle}</p>
                      <div className="space-y-2">
                        {t.step2.loseSpeeds.map((s: any) => {
                          const selected = weightLossSpeed === s.id;
                          return (
                            <motion.button
                              key={s.id}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setWeightLossSpeed(s.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                                selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                              }`}
                            >
                              <span className="text-xl">{s.emoji}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-foreground text-sm">{s.title}</p>
                                  {s.recommended && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">★</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{s.desc} · {s.sub}</p>
                              </div>
                              {selected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                  <span className="text-white text-xs">✓</span>
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ═══ STEP 3: Body ═══ */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-foreground text-center">{t.step3.title}</h1>
                <p className="text-muted-foreground text-center mt-1 mb-6">{t.step3.sub}</p>

                {/* Gender */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {(['male', 'female'] as const).map(g => {
                    const selected = gender === g;
                    return (
                      <motion.button
                        key={g}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setGender(g)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        <span className="text-3xl">{g === 'male' ? '👨' : '👩'}</span>
                        <p className="font-medium text-foreground mt-1 text-sm">{t.step3.gender[g]}</p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Age */}
                <div className="mb-6">
                  <NumberStepper value={age} onChange={setAge} min={14} max={80} label={t.step3.age} />
                </div>

                {/* Weight */}
                <div className="mb-6">
                  <div className="flex justify-center gap-2 mb-2">
                    {(['kg', 'lbs'] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => {
                          if (u !== weightUnit) {
                            setWeightVal(u === 'kg' ? Math.round(weightVal / 2.205) : Math.round(weightVal * 2.205));
                            setWeightUnit(u);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          weightUnit === u ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >{t.step3[u]}</button>
                    ))}
                  </div>
                  <NumberStepper
                    value={weightVal}
                    onChange={setWeightVal}
                    min={weightUnit === 'kg' ? 40 : 88}
                    max={weightUnit === 'kg' ? 200 : 440}
                    label={t.step3.weight}
                  />
                </div>

                {/* Height */}
                <div className="mb-6">
                  <div className="flex justify-center gap-2 mb-2">
                    {(['cm', 'ft'] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => {
                          if (u !== heightUnit) {
                            setHeightVal(u === 'cm' ? Math.round(heightVal * 2.54) : Math.round(heightVal / 2.54));
                            setHeightUnit(u);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          heightUnit === u ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >{t.step3[u]}</button>
                    ))}
                  </div>
                  <NumberStepper
                    value={heightVal}
                    onChange={setHeightVal}
                    min={heightUnit === 'cm' ? 140 : 55}
                    max={heightUnit === 'cm' ? 220 : 87}
                    label={t.step3.height}
                  />
                </div>

                {/* Activity */}
                <div className="grid grid-cols-2 gap-3">
                  {t.activity.map((a: any) => {
                    const selected = activity === a.id;
                    return (
                      <motion.button
                        key={a.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActivity(a.id)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        <span className="text-xl">{a.emoji}</span>
                        <p className="font-medium text-foreground text-sm mt-1">{a.title}</p>
                        <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ STEP 4: Diet ═══ */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-foreground text-center">{t.step4.title}</h1>
                <p className="text-muted-foreground text-center mt-1 mb-6">{t.step4.sub}</p>

                <div className="space-y-3 mb-8">
                  {t.diets.map((d: any) => {
                    const selected = dietType === d.id;
                    return (
                      <motion.button
                        key={d.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDietType(d.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        <span className="text-2xl">{d.emoji}</span>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{d.title}</p>
                          <p className="text-xs text-muted-foreground">{d.desc}</p>
                        </div>
                        {selected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Allergies */}
                <h3 className="font-semibold text-foreground text-sm mb-1">{t.step4.allergiesTitle}</h3>
                <p className="text-xs text-muted-foreground mb-3">{t.step4.allergiesSub}</p>
                <div className="flex flex-wrap gap-2">
                  {t.allergies.map((a: any) => {
                    const selected = selectedAllergies.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAllergy(a.id)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                          selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                        }`}
                      >
                        {a.emoji} {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ STEP 5: Household ═══ */}
            {step === 4 && (
              <div>
                <h1 className="text-2xl font-bold text-foreground text-center">{t.step5.title}</h1>
                <p className="text-muted-foreground text-center mt-1 mb-6">{t.step5.sub}</p>

                <div className="grid grid-cols-4 gap-2 mb-8">
                  {t.household.map((h: any) => {
                    const selected = householdSize === h.size;
                    return (
                      <motion.button
                        key={h.size}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setHouseholdSize(h.size)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        <span className="text-2xl">{h.emoji}</span>
                        <span className="text-[11px] font-medium text-foreground text-center leading-tight">{h.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Dislikes */}
                <h3 className="font-semibold text-foreground text-sm mb-1">{t.step5.dislikesTitle}</h3>
                <p className="text-xs text-muted-foreground mb-3">{t.step5.optional}</p>
                <input
                  value={dislikedFreeText}
                  onChange={e => setDislikedFreeText(e.target.value)}
                  placeholder={t.step5.dislikesPlaceholder}
                  className="w-full h-12 rounded-2xl px-4 bg-muted text-foreground placeholder:text-muted-foreground/50 border-2 border-transparent focus:border-primary outline-none transition-colors text-sm"
                />
              </div>
            )}

            {/* ═══ STEP 6: Result ═══ */}
            {step === 5 && (
              <div className="text-center">
                <Confetti />
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <h1 className="text-2xl font-bold text-foreground">{name},</h1>
                  <p className="text-xl text-muted-foreground">{t.step6.allSet}</p>
                </motion.div>

                {/* Calorie circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                  className="w-44 h-44 rounded-full bg-primary/10 border-4 border-primary flex flex-col items-center justify-center mx-auto mt-8 mb-4"
                >
                  <span className="text-4xl font-bold text-primary">{calories}</span>
                  <span className="text-sm text-muted-foreground">{t.step6.kcal}</span>
                </motion.div>

                <p className="text-sm text-muted-foreground mb-4">{t.step6.personal}</p>

                {/* Macros */}
                <div className="flex justify-center gap-3 mb-6">
                  {[
                    { label: t.P, value: macros.protein, emoji: '💪' },
                    { label: t.F, value: macros.fat, emoji: '🧈' },
                    { label: t.C, value: macros.carbs, emoji: '🍞' },
                  ].map(m => (
                    <div key={m.label} className="bg-muted rounded-xl px-4 py-2 text-center">
                      <span className="text-xs">{m.emoji}</span>
                      <p className="text-sm font-bold text-foreground">{m.label}: {m.value}г</p>
                    </div>
                  ))}
                </div>

                {/* Goal message */}
                {goalMsgText && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-muted-foreground bg-muted rounded-2xl p-4 mx-auto max-w-xs"
                  >
                    {goalMsgText}
                  </motion.p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Bottom button ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
        <div className="max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={step === 5 ? handleFinish : goNext}
            disabled={saving || !canProceed[step]}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 transition-opacity"
          >
            {saving
              ? t.saving
              : step === 0
                ? (name.trim().length >= 2 ? t.step1.btn(name.trim()) : t.step1.btn('...'))
                : step === 5
                  ? t.step6.btn
                  : t[`step${step + 1}`]?.btn}
          </motion.button>
          {step === 5 && (
            <p className="text-xs text-muted-foreground text-center mt-2">{t.step6.trial}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
