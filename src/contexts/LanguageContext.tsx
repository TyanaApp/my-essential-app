import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'lv';

interface Translations {
  [key: string]: {
    en: string;
    ru: string;
    lv: string;
  };
}

const translations: Translations = {
  // Landing Page
  appName: { en: 'TYANA', ru: 'TYANA', lv: 'TYANA' },
  tagline: { en: 'TIME-BASED HEALTH', ru: 'ЗДОРОВЬЕ ВО ВРЕМЕНИ', lv: 'LAIKA VESELĪBA' },
  subtitle: { en: 'Design Your Future Biology', ru: 'Создайте свою биологию будущего', lv: 'Veidojiet savu nākotnes bioloģiju' },
  signIn: { en: 'Sign In', ru: 'Войти', lv: 'Ieiet' },
  signUp: { en: 'Sign Up', ru: 'Регистрация', lv: 'Reģistrēties' },
  continueWithGoogle: { en: 'Continue with Google', ru: 'Продолжить с Google', lv: 'Turpināt ar Google' },
  continueWithApple: { en: 'Continue with Apple', ru: 'Продолжить с Apple', lv: 'Turpināt ar Apple' },
  or: { en: 'or', ru: 'или', lv: 'vai' },
  
  // Auth Form
  email: { en: 'Email', ru: 'Электронная почта', lv: 'E-pasts' },
  password: { en: 'Password', ru: 'Пароль', lv: 'Parole' },
  displayName: { en: 'Display Name', ru: 'Отображаемое имя', lv: 'Vārds' },
  createAccount: { en: 'Create Account', ru: 'Создать аккаунт', lv: 'Izveidot kontu' },
  alreadyHaveAccount: { en: 'Already have an account?', ru: 'Уже есть аккаунт?', lv: 'Jau ir konts?' },
  noAccount: { en: "Don't have an account?", ru: 'Нет аккаунта?', lv: 'Nav konta?' },
  
  // Legal
  legalTitle: { en: 'Legal & Compliance', ru: 'Правовая информация', lv: 'Juridiskā informācija' },
  acceptContinue: { en: 'Accept & Continue', ru: 'Принять и продолжить', lv: 'Pieņemt un turpināt' },
  decline: { en: 'Decline', ru: 'Отклонить', lv: 'Noraidīt' },
  
  // Permissions
  permissionCamera: { en: 'Camera & Gallery Access', ru: 'Доступ к камере и галерее', lv: 'Piekļuve kamerai un galerijai' },
  permissionMicrophone: { en: 'Microphone Access', ru: 'Доступ к микрофону', lv: 'Piekļuve mikrofonam' },
  permissionHealth: { en: 'Health Data Sync', ru: 'Синхронизация данных здоровья', lv: 'Veselības datu sinhronizācija' },
  allow: { en: 'Allow', ru: 'Разрешить', lv: 'Atļaut' },
  deny: { en: 'Deny', ru: 'Запретить', lv: 'Liegt' },
  skip: { en: 'Skip for now', ru: 'Пропустить', lv: 'Pagaidām izlaist' },
  
  // Dashboard
  energy: { en: 'Energy', ru: 'Энергия', lv: 'Enerģija' },
  energyLevel: { en: 'Your Energy Level', ru: 'Ваш уровень энергии', lv: 'Jūsu enerģijas līmenis' },
  now: { en: 'Now', ru: 'Сейчас', lv: 'Tagad' },
  soon: { en: 'Soon', ru: 'Скоро', lv: 'Drīz' },
  path: { en: 'Path', ru: 'Путь', lv: 'Ceļš' },
  currentStatus: { en: 'Current Status', ru: 'Текущий статус', lv: 'Pašreizējais statuss' },
  
  // Health Metrics
  sleep: { en: 'Sleep', ru: 'Сон', lv: 'Miegs' },
  sleepDuration: { en: 'Sleep Duration', ru: 'Продолжительность сна', lv: 'Miega ilgums' },
  sleepQuality: { en: 'Sleep Quality', ru: 'Качество сна', lv: 'Miega kvalitāte' },
  stress: { en: 'Stress', ru: 'Стресс', lv: 'Stress' },
  stressLevel: { en: 'Stress Level', ru: 'Уровень стресса', lv: 'Stresa līmenis' },
  mood: { en: 'Mood', ru: 'Настроение', lv: 'Garastāvoklis' },
  heartRate: { en: 'Heart Rate', ru: 'Пульс', lv: 'Sirdsdarbība' },
  bpm: { en: 'BPM', ru: 'уд/мин', lv: 'sitieni/min' },
  recovery: { en: 'Recovery', ru: 'Восстановление', lv: 'Atjaunošanās' },
  hours: { en: 'hours', ru: 'часов', lv: 'stundas' },
  low: { en: 'Low', ru: 'Низкий', lv: 'Zems' },
  moderate: { en: 'Moderate', ru: 'Умеренный', lv: 'Mērens' },
  high: { en: 'High', ru: 'Высокий', lv: 'Augsts' },
  good: { en: 'Good', ru: 'Хорошее', lv: 'Labs' },
  excellent: { en: 'Excellent', ru: 'Отлично', lv: 'Izcils' },
  
  // What-If Engine
  whatIfTitle: { en: 'What if I change my habits?', ru: 'Что если изменить привычки?', lv: 'Kas notiks, ja mainīšu ieradumus?' },
  whatIfPlaceholder: { en: 'Ask AI: What if I...', ru: 'Спросите ИИ: Что если я...', lv: 'Jautājiet AI: Kas notiks, ja es...' },
  whatIfExplore: { en: 'Explore possibilities', ru: 'Исследуйте возможности', lv: 'Izpētiet iespējas' },
  moreSleep: { en: '+1 hour sleep', ru: '+1 час сна', lv: '+1 stunda miega' },
  lessCaffeine: { en: 'Less caffeine', ru: 'Меньше кофеина', lv: 'Mazāk kofeīna' },
  morningWorkout: { en: 'Morning workouts', ru: 'Утренние тренировки', lv: 'Rīta treniņi' },
  meditation: { en: '10 min meditation', ru: '10 мин медитации', lv: '10 min meditācija' },
  skipWorkout: { en: 'Skip workout', ru: 'Пропустить тренировку', lv: 'Izlaist treniņu' },
  betterFocus: { en: 'Better focus tomorrow', ru: 'Лучший фокус завтра', lv: 'Labāka koncentrēšanās rīt' },
  stableEnergy: { en: 'More stable energy', ru: 'Более стабильная энергия', lv: 'Stabilāka enerģija' },
  lessRecovery: { en: 'Slower recovery', ru: 'Медленное восстановление', lv: 'Lēnāka atjaunošanās' },
  
  // Today sections
  nextHours: { en: 'Next hours', ru: 'Ближайшие часы', lv: 'Nākamās stundas' },
  todaysPath: { en: "Today's path", ru: 'Путь на сегодня', lv: 'Šodienas ceļš' },
  postLunchDip: { en: 'Post-lunch dip expected', ru: 'Ожидается спад после обеда', lv: 'Gaidāms kritums pēc pusdienām' },
  afternoonRecovery: { en: 'Afternoon recovery', ru: 'Дневное восстановление', lv: 'Pēcpusdienas atjaunošanās' },
  eveningWind: { en: 'Evening wind down', ru: 'Вечерний отдых', lv: 'Vakara atslābināšanās' },
  drinkWater: { en: 'Drink 2L water', ru: 'Выпить 2л воды', lv: 'Izdzert 2L ūdens' },
  
  // Quick check-in
  howIsYourEnergy: { en: 'How is your energy?', ru: 'Как ваша энергия?', lv: 'Kāda ir jūsu enerģija?' },
  howIsYourMood: { en: 'How is your mood?', ru: 'Как ваше настроение?', lv: 'Kāds ir jūsu garastāvoklis?' },
  tapToSelect: { en: 'Tap to select (1-10)', ru: 'Нажмите для выбора (1-10)', lv: 'Pieskarieties, lai izvēlētos (1-10)' },
  almostDone: { en: 'Almost done!', ru: 'Почти готово!', lv: 'Gandrīz pabeigts!' },
  tenSecCheckIn: { en: '10-sec check-in', ru: '10-сек проверка', lv: '10 sek pārbaude' },
  
  // Connect health
  connectHealth: { en: 'Connect Health', ru: 'Подключить здоровье', lv: 'Savienot veselību' },
  syncWearableData: { en: 'Sync data from your wearable', ru: 'Синхронизировать данные с часов', lv: 'Sinhronizēt datus no ierīces' },
  
  // AI
  dailyAdvice: { en: 'Daily Advice', ru: 'Совет дня', lv: 'Dienas padoms' },
  aiTwinSays: { en: 'AI Twin says', ru: 'AI Twin говорит', lv: 'AI Twin saka' },
  askAI: { en: 'Ask AI', ru: 'Спросить ИИ', lv: 'Jautāt AI' },
  
  // Map
  map: { en: 'Map', ru: 'Карта', lv: 'Karte' },
  nearbyUsers: { en: 'Nearby Users', ru: 'Пользователи рядом', lv: 'Lietotāji tuvumā' },
  safePlaces: { en: 'Safe Places', ru: 'Безопасные места', lv: 'Drošas vietas' },
  
  // Profile
  profile: { en: 'Profile', ru: 'Профиль', lv: 'Profils' },
  settings: { en: 'Settings', ru: 'Настройки', lv: 'Iestatījumi' },
  logout: { en: 'Log Out', ru: 'Выйти', lv: 'Iziet' },
  
  // Navigation
  today: { en: 'Today', ru: 'Сегодня', lv: 'Šodien' },
  twin: { en: 'Twin', ru: 'Близнец', lv: 'Dvīnis' },
  history: { en: 'History', ru: 'История', lv: 'Vēsture' },

  // Manual Input
  addData: { en: 'Add Health Data', ru: 'Добавить данные', lv: 'Pievienot datus' },
  save: { en: 'Save', ru: 'Сохранить', lv: 'Saglabāt' },
  cancel: { en: 'Cancel', ru: 'Отмена', lv: 'Atcelt' },
  sleepHours: { en: 'Sleep (hours)', ru: 'Сон (часы)', lv: 'Miegs (stundas)' },
  moodLevel: { en: 'Mood Level', ru: 'Уровень настроения', lv: 'Garastāvokļa līmenis' },
  dataSaved: { en: 'Data saved successfully', ru: 'Данные сохранены', lv: 'Dati saglabāti' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Default to Russian
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    console.warn('useLanguage was called outside of LanguageProvider, using defaults');
    return {
      language: 'ru' as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
};
