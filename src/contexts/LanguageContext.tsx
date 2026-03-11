import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'lv' | 'uk';

interface Translations {
  [key: string]: {
    en: string;
    ru: string;
    lv: string;
    uk?: string;
  };
}

const translations: Translations = {
  // Landing Page
  appName: { en: 'TYANA', ru: 'TYANA', lv: 'TYANA', uk: 'TYANA' },
  tagline: { en: 'Knows you better than you know yourself.', ru: 'Знает тебя лучше, чем ты сама.', lv: 'Pazīst tevi labāk nekā tu pati.', uk: 'Знає тебе краще ніж ти сама.' },
  subtitle: { en: 'Your personal AI nutritionist', ru: 'Твой персональный ИИ-нутрициолог', lv: 'Tavs personīgais AI uztura speciālists', uk: 'Твій персональний ШІ-нутриціолог' },
  signIn: { en: 'Sign In', ru: 'Войти', lv: 'Ieiet', uk: 'Увійти' },
  signUp: { en: 'Sign Up', ru: 'Регистрация', lv: 'Reģistrēties', uk: 'Реєстрація' },
  continueWithGoogle: { en: 'Continue with Google', ru: 'Продолжить с Google', lv: 'Turpināt ar Google', uk: 'Продовжити з Google' },
  continueWithApple: { en: 'Continue with Apple', ru: 'Продолжить с Apple', lv: 'Turpināt ar Apple', uk: 'Продовжити з Apple' },
  appleSoon: { en: 'Apple (soon)', ru: 'Apple (скоро)', lv: 'Apple (drīz)', uk: 'Apple (скоро)' },
  or: { en: 'or', ru: 'или', lv: 'vai', uk: 'або' },
  loading: { en: 'Loading...', ru: 'Загрузка...', lv: 'Ielādē...', uk: 'Завантаження...' },
  back: { en: 'Back', ru: 'Назад', lv: 'Atpakaļ', uk: 'Назад' },
  
  // Auth Form
  email: { en: 'Email', ru: 'Электронная почта', lv: 'E-pasts', uk: 'Електронна пошта' },
  password: { en: 'Password', ru: 'Пароль', lv: 'Parole', uk: 'Пароль' },
  displayName: { en: 'Display Name', ru: 'Отображаемое имя', lv: 'Vārds', uk: "Ім'я" },
  yourName: { en: 'Your name', ru: 'Ваше имя', lv: 'Jūsu vārds', uk: "Ваше ім'я" },
  createAccount: { en: 'Create Account', ru: 'Создать аккаунт', lv: 'Izveidot kontu', uk: 'Створити акаунт' },
  alreadyHaveAccount: { en: 'Already have an account?', ru: 'Уже есть аккаунт?', lv: 'Jau ir konts?', uk: 'Вже є акаунт?' },
  noAccount: { en: "Don't have an account?", ru: 'Нет аккаунта?', lv: 'Nav konta?', uk: 'Немає акаунту?' },
  invalidEmail: { en: 'Invalid email address', ru: 'Некорректный email адрес', lv: 'Nederīga e-pasta adrese', uk: 'Невірна email адреса' },
  passwordMinLength: { en: 'Password must be at least 6 characters', ru: 'Пароль должен содержать минимум 6 символов', lv: 'Parolei jābūt vismaz 6 simbolus garai', uk: 'Пароль повинен містити мінімум 6 символів' },
  invalidCredentials: { en: 'Invalid email or password', ru: 'Неверный email или пароль', lv: 'Nepareizs e-pasts vai parole', uk: 'Невірний email або пароль' },
  userAlreadyRegistered: { en: 'User already registered', ru: 'Пользователь уже зарегистрирован', lv: 'Lietotājs jau reģistrēts', uk: 'Користувач вже зареєстрований' },
  emailNotConfirmed: { en: 'Email not confirmed', ru: 'Email не подтверждён', lv: 'E-pasts nav apstiprināts', uk: 'Email не підтверджено' },
  tooManyAttempts: { en: 'Too many attempts. Please try again later', ru: 'Слишком много попыток. Попробуйте позже', lv: 'Pārāk daudz mēģinājumu. Mēģiniet vēlāk', uk: 'Забагато спроб. Спробуйте пізніше' },
  errorOccurred: { en: 'An error occurred. Please try again', ru: 'Произошла ошибка. Попробуйте снова', lv: 'Radās kļūda. Mēģiniet vēlreiz', uk: 'Сталася помилка. Спробуйте знову' },
  googleSignInFailed: { en: 'Google sign in failed', ru: 'Ошибка входа через Google', lv: 'Google pierakstīšanās neizdevās', uk: 'Помилка входу через Google' },
  accountCreated: { en: 'Account created! Welcome!', ru: 'Аккаунт создан! Добро пожаловать!', lv: 'Konts izveidots! Laipni lūgti!', uk: 'Акаунт створено! Ласкаво просимо!' },
  welcomeBack: { en: 'Welcome back!', ru: 'С возвращением!', lv: 'Laipni lūgti atpakaļ!', uk: 'З поверненням!' },
  unexpectedError: { en: 'An unexpected error occurred', ru: 'Неожиданная ошибка', lv: 'Radās neparedzēta kļūda', uk: 'Неочікувана помилка' },
  
  // Legal
  legalTitle: { en: 'Legal & Compliance', ru: 'Правовая информация', lv: 'Juridiskā informācija', uk: 'Правова інформація' },
  acceptContinue: { en: 'Accept & Continue', ru: 'Принять и продолжить', lv: 'Pieņemt un turpināt', uk: 'Прийняти і продовжити' },
  decline: { en: 'Decline', ru: 'Отклонить', lv: 'Noraidīt', uk: 'Відхилити' },
  
  // Permissions
  permissionCamera: { en: 'Camera & Gallery Access', ru: 'Доступ к камере и галерее', lv: 'Piekļuve kamerai un galerijai', uk: 'Доступ до камери та галереї' },
  permissionMicrophone: { en: 'Microphone Access', ru: 'Доступ к микрофону', lv: 'Piekļuve mikrofonam', uk: 'Доступ до мікрофону' },
  permissionHealth: { en: 'Health Data Sync', ru: 'Синхронизация данных здоровья', lv: 'Veselības datu sinhronizācija', uk: "Синхронізація даних здоров'я" },
  allow: { en: 'Allow', ru: 'Разрешить', lv: 'Atļaut', uk: 'Дозволити' },
  deny: { en: 'Deny', ru: 'Запретить', lv: 'Liegt', uk: 'Заборонити' },
  skip: { en: 'Skip for now', ru: 'Пропустить', lv: 'Pagaidām izlaist', uk: 'Пропустити' },
  
  // Dashboard
  energy: { en: 'Energy', ru: 'Энергия', lv: 'Enerģija', uk: 'Енергія' },
  energyLevel: { en: 'Your Energy Level', ru: 'Ваш уровень энергии', lv: 'Jūsu enerģijas līmenis', uk: 'Ваш рівень енергії' },
  now: { en: 'Now', ru: 'Сейчас', lv: 'Tagad', uk: 'Зараз' },
  soon: { en: 'Soon', ru: 'Скоро', lv: 'Drīz', uk: 'Скоро' },
  path: { en: 'Path', ru: 'Путь', lv: 'Ceļš', uk: 'Шлях' },
  whatIf: { en: 'What If', ru: 'Что если', lv: 'Kas ja', uk: 'Що якщо' },
  currentStatus: { en: 'Current Status', ru: 'Текущий статус', lv: 'Pašreizējais statuss', uk: 'Поточний статус' },
  
  // Health Metrics
  sleep: { en: 'Sleep', ru: 'Сон', lv: 'Miegs', uk: 'Сон' },
  sleepDuration: { en: 'Sleep Duration', ru: 'Продолжительность сна', lv: 'Miega ilgums', uk: 'Тривалість сну' },
  sleepQuality: { en: 'Sleep Quality', ru: 'Качество сна', lv: 'Miega kvalitāte', uk: 'Якість сну' },
  stress: { en: 'Stress', ru: 'Стресс', lv: 'Stress', uk: 'Стрес' },
  stressLevel: { en: 'Stress Level', ru: 'Уровень стресса', lv: 'Stresa līmenis', uk: 'Рівень стресу' },
  mood: { en: 'Mood', ru: 'Настроение', lv: 'Garastāvoklis', uk: 'Настрій' },
  heartRate: { en: 'Heart Rate', ru: 'Пульс', lv: 'Sirdsdarbība', uk: 'Пульс' },
  bpm: { en: 'BPM', ru: 'уд/мин', lv: 'sitieni/min', uk: 'уд/хв' },
  recovery: { en: 'Recovery', ru: 'Восстановление', lv: 'Atjaunošanās', uk: 'Відновлення' },
  hours: { en: 'hours', ru: 'часов', lv: 'stundas', uk: 'годин' },
  low: { en: 'Low', ru: 'Низкий', lv: 'Zems', uk: 'Низький' },
  moderate: { en: 'Moderate', ru: 'Умеренный', lv: 'Mērens', uk: 'Помірний' },
  high: { en: 'High', ru: 'Высокий', lv: 'Augsts', uk: 'Високий' },
  good: { en: 'Good', ru: 'Хорошее', lv: 'Labs', uk: 'Добре' },
  excellent: { en: 'Excellent', ru: 'Отлично', lv: 'Izcils', uk: 'Відмінно' },
  
  // What-If Engine
  whatIfTitle: { en: 'What if I change my habits?', ru: 'Что если изменить привычки?', lv: 'Kas notiks, ja mainīšu ieradumus?', uk: 'Що якщо змінити звички?' },
  whatIfPlaceholder: { en: 'Ask AI: What if I...', ru: 'Спросите ИИ: Что если я...', lv: 'Jautājiet AI: Kas notiks, ja es...', uk: 'Запитайте ШІ: Що якщо я...' },
  whatIfExplore: { en: 'Explore possibilities', ru: 'Исследуйте возможности', lv: 'Izpētiet iespējas', uk: 'Дослідіть можливості' },
  moreSleep: { en: '+1 hour sleep', ru: '+1 час сна', lv: '+1 stunda miega', uk: '+1 година сну' },
  lessCaffeine: { en: 'Less caffeine', ru: 'Меньше кофеина', lv: 'Mazāk kofeīna', uk: 'Менше кофеїну' },
  morningWorkout: { en: 'Morning workouts', ru: 'Утренние тренировки', lv: 'Rīta treniņi', uk: 'Ранкові тренування' },
  meditation: { en: '10 min meditation', ru: '10 мин медитации', lv: '10 min meditācija', uk: '10 хв медитації' },
  skipWorkout: { en: 'Skip workout', ru: 'Пропустить тренировку', lv: 'Izlaist treniņu', uk: 'Пропустити тренування' },
  betterFocus: { en: 'Better focus tomorrow', ru: 'Лучший фокус завтра', lv: 'Labāka koncentrēšanās rīt', uk: 'Кращий фокус завтра' },
  stableEnergy: { en: 'More stable energy', ru: 'Более стабильная энергия', lv: 'Stabilāka enerģija', uk: 'Стабільніша енергія' },
  lessRecovery: { en: 'Slower recovery', ru: 'Медленное восстановление', lv: 'Lēnāka atjaunošanās', uk: 'Повільніше відновлення' },
  
  // Today sections
  nextHours: { en: 'Next hours', ru: 'Ближайшие часы', lv: 'Nākamās stundas', uk: 'Найближчі години' },
  todaysPath: { en: "Today's path", ru: 'Путь на сегодня', lv: 'Šodienas ceļš', uk: 'Шлях на сьогодні' },
  postLunchDip: { en: 'Post-lunch dip expected', ru: 'Ожидается спад после обеда', lv: 'Gaidāms kritums pēc pusdienām', uk: 'Очікується спад після обіду' },
  afternoonRecovery: { en: 'Afternoon recovery', ru: 'Дневное восстановление', lv: 'Pēcpusdienas atjaunošanās', uk: 'Денне відновлення' },
  eveningWind: { en: 'Evening wind down', ru: 'Вечерний отдых', lv: 'Vakara atslābināšanās', uk: 'Вечірній відпочинок' },
  drinkWater: { en: 'Drink 2L water', ru: 'Выпить 2л воды', lv: 'Izdzert 2L ūdens', uk: 'Випити 2л води' },
  
  // Quick check-in
  howIsYourEnergy: { en: 'How is your energy?', ru: 'Как ваша энергия?', lv: 'Kāda ir jūsu enerģija?', uk: 'Як ваша енергія?' },
  howIsYourMood: { en: 'How is your mood?', ru: 'Как ваше настроение?', lv: 'Kāds ir jūsu garastāvoklis?', uk: 'Який ваш настрій?' },
  tapToSelect: { en: 'Tap to select (1-10)', ru: 'Нажмите для выбора (1-10)', lv: 'Pieskarieties, lai izvēlētos (1-10)', uk: 'Натисніть для вибору (1-10)' },
  almostDone: { en: 'Almost done!', ru: 'Почти готово!', lv: 'Gandrīz pabeigts!', uk: 'Майже готово!' },
  tenSecCheckIn: { en: '10-sec check-in', ru: '10-сек проверка', lv: '10 sek pārbaude', uk: '10-сек перевірка' },
  
  // Connect health
  connectHealth: { en: 'Connect Health', ru: 'Подключить здоровье', lv: 'Savienot veselību', uk: "Підключити здоров'я" },
  syncWearableData: { en: 'Sync data from your wearable', ru: 'Синхронизировать данные с часов', lv: 'Sinhronizēt datus no ierīces', uk: 'Синхронізувати дані з годинника' },
  
  // Now section
  why: { en: 'Why?', ru: 'Почему?', lv: 'Kāpēc?', uk: 'Чому?' },
  energyExplanation: { en: 'Energy explanation', ru: 'Объяснение энергии', lv: 'Enerģijas skaidrojums', uk: 'Пояснення енергії' },
  sleepImpact: { en: 'Sleep: 7.5h (+12%)', ru: 'Сон: 7.5ч (+12%)', lv: 'Miegs: 7.5h (+12%)', uk: 'Сон: 7.5г (+12%)' },
  stressImpact: { en: 'Stress: Low (+8%)', ru: 'Стресс: Низкий (+8%)', lv: 'Stress: Zems (+8%)', uk: 'Стрес: Низький (+8%)' },
  cycleImpact: { en: 'Cycle: Follicular (+5%)', ru: 'Цикл: Фолликулярная (+5%)', lv: 'Cikls: Folikulāra (+5%)', uk: 'Цикл: Фолікулярна (+5%)' },
  trend: { en: 'trend', ru: 'тренд', lv: 'tendence', uk: 'тренд' },
  todaysFocus: { en: "Today's Focus", ru: 'Фокус дня', lv: 'Šodienas fokuss', uk: 'Фокус дня' },
  mainAdvice: { en: 'Prioritize recovery today', ru: 'Приоритет — восстановление', lv: 'Prioritāte — atjaunošanās', uk: 'Пріоритет — відновлення' },
  goToBedEarly: { en: 'Go to bed before 11pm', ru: 'Лечь до 23:00', lv: 'Gulēt pirms 23:00', uk: 'Лягти до 23:00' },
  walk20min: { en: '20 min walk after lunch', ru: 'Прогулка 20 мин после обеда', lv: '20 min pastaiga pēc pusdienām', uk: 'Прогулянка 20 хв після обіду' },
  limitCaffeine: { en: 'Limit caffeine after 2pm', ru: 'Ограничить кофеин после 14:00', lv: 'Ierobežot kofeīnu pēc 14:00', uk: 'Обмежити кофеїн після 14:00' },
  
  // Soon section
  cycleTimeline: { en: 'Cycle Timeline', ru: 'Таймлайн цикла', lv: 'Cikla laika skala', uk: 'Таймлайн циклу' },
  nextKeyMoments: { en: 'Next Key Moments', ru: 'Ключевые моменты', lv: 'Galvenie momenti', uk: 'Ключові моменти' },
  pmsIn: { en: 'PMS in', ru: 'ПМС через', lv: 'PMS pēc', uk: 'ПМС через' },
  ovulationIn: { en: 'Ovulation in', ru: 'Овуляция через', lv: 'Ovulācija pēc', uk: 'Овуляція через' },
  periodIn: { en: 'Period in', ru: 'Менструация через', lv: 'Menstruācija pēc', uk: 'Менструація через' },
  days: { en: 'days', ru: 'дней', lv: 'dienas', uk: 'днів' },
  preparePlan: { en: 'Prepare plan', ru: 'Подготовить план', lv: 'Sagatavot plānu', uk: 'Підготувати план' },
  follicular: { en: 'Follicular', ru: 'Фолликулярная', lv: 'Folikulāra', uk: 'Фолікулярна' },
  ovulation: { en: 'Ovulation', ru: 'Овуляция', lv: 'Ovulācija', uk: 'Овуляція' },
  luteal: { en: 'Luteal', ru: 'Лютеиновая', lv: 'Luteāla', uk: 'Лютеїнова' },
  menstrual: { en: 'Menstrual', ru: 'Менструация', lv: 'Menstruācija', uk: 'Менструація' },
  riskWindow: { en: 'Risk window', ru: 'Окно риска', lv: 'Riska logs', uk: 'Вікно ризику' },
  
  // Path section
  essential: { en: 'Essential', ru: 'Важно', lv: 'Būtiski', uk: 'Важливо' },
  optional: { en: 'Optional', ru: 'По желанию', lv: 'Pēc izvēles', uk: 'За бажанням' },
  makeTodayLighter: { en: 'Make today lighter', ru: 'Облегчить день', lv: 'Atvieglot dienu', uk: 'Полегшити день' },
  taskCleared: { en: 'Non-essential tasks cleared', ru: 'Неважные задачи убраны', lv: 'Nebūtiski uzdevumi noņemti', uk: 'Неважливі задачі прибрано' },
  
  // What If section
  habitSimulator: { en: 'Habit Simulator', ru: 'Симулятор привычек', lv: 'Ieradumu simulators', uk: 'Симулятор звичок' },
  whatIfAsk: { en: 'What if I...', ru: 'Что будет, если...', lv: 'Kas notiks, ja es...', uk: 'Що буде, якщо...' },
  plusHourSleep: { en: '+1 hour sleep', ru: '+1 час сна', lv: '+1 stunda miega', uk: '+1 година сну' },
  noCoffee: { en: 'No coffee', ru: 'Без кофе', lv: 'Bez kafijas', uk: 'Без кави' },
  noAlcohol: { en: 'No alcohol', ru: 'Без алкоголя', lv: 'Bez alkohola', uk: 'Без алкоголю' },
  energyChange: { en: 'energy', ru: 'энергии', lv: 'enerģijas', uk: 'енергії' },
  stressChange: { en: 'stress', ru: 'стресса', lv: 'stresa', uk: 'стресу' },
  beforeAfter: { en: 'Before vs After', ru: 'Было vs Станет', lv: 'Pirms vs Pēc', uk: 'Було vs Стане' },
  turnIntoExperiment: { en: 'Turn into experiment', ru: 'Превратить в эксперимент', lv: 'Pārvērst eksperimentā', uk: 'Перетворити на експеримент' },
  experimentDays: { en: 'days experiment', ru: 'дней эксперимент', lv: 'dienu eksperiments', uk: 'днів експеримент' },
  
  // AI
  dailyAdvice: { en: 'Daily Advice', ru: 'Совет дня', lv: 'Dienas padoms', uk: 'Порада дня' },
  aiTwinSays: { en: 'AI Twin says', ru: 'AI Twin говорит', lv: 'AI Twin saka', uk: 'AI Twin каже' },
  askAI: { en: 'Ask AI', ru: 'Спросить ИИ', lv: 'Jautāt AI', uk: 'Запитати ШІ' },
  healthAssistant: { en: 'Health Assistant', ru: 'Ассистент здоровья', lv: 'Veselības asistents', uk: "Асистент здоров'я" },
  speaking: { en: 'Speaking...', ru: 'Говорю...', lv: 'Runāju...', uk: 'Говорю...' },
  listen: { en: 'Listen', ru: 'Озвучить', lv: 'Klausīties', uk: 'Озвучити' },
  stop: { en: 'Stop', ru: 'Стоп', lv: 'Apturēt', uk: 'Стоп' },
  
  // Map
  map: { en: 'Map', ru: 'Карта', lv: 'Karte', uk: 'Карта' },
  nearbyUsers: { en: 'Nearby Users', ru: 'Пользователи рядом', lv: 'Lietotāji tuvumā', uk: 'Користувачі поруч' },
  safePlaces: { en: 'Safe Places', ru: 'Безопасные места', lv: 'Drošas vietas', uk: 'Безпечні місця' },
  
  // Profile
  profile: { en: 'Profile', ru: 'Профиль', lv: 'Profils', uk: 'Профіль' },
  settings: { en: 'Settings', ru: 'Настройки', lv: 'Iestatījumi', uk: 'Налаштування' },
  logout: { en: 'Log Out', ru: 'Выйти', lv: 'Iziet', uk: 'Вийти' },
  language: { en: 'Language', ru: 'Язык', lv: 'Valoda', uk: 'Мова' },
  
  // Navigation
  today: { en: 'Today', ru: 'Сегодня', lv: 'Šodien', uk: 'Сьогодні' },
  twin: { en: 'Twin', ru: 'Близнец', lv: 'Dvīnis', uk: 'Близнюк' },
  history: { en: 'History', ru: 'История', lv: 'Vēsture', uk: 'Історія' },

  // Manual Input
  addData: { en: 'Add Health Data', ru: 'Добавить данные', lv: 'Pievienot datus', uk: 'Додати дані' },
  save: { en: 'Save', ru: 'Сохранить', lv: 'Saglabāt', uk: 'Зберегти' },
  cancel: { en: 'Cancel', ru: 'Отмена', lv: 'Atcelt', uk: 'Скасувати' },
  sleepHours: { en: 'Sleep (hours)', ru: 'Сон (часы)', lv: 'Miegs (stundas)', uk: 'Сон (години)' },
  moodLevel: { en: 'Mood Level', ru: 'Уровень настроения', lv: 'Garastāvokļa līmenis', uk: 'Рівень настрою' },
  dataSaved: { en: 'Data saved successfully', ru: 'Данные сохранены', lv: 'Dati saglabāti', uk: 'Дані збережено' },
  
  // History Page
  lifeHistory: { en: 'Life History', ru: 'История жизни', lv: 'Dzīves vēsture', uk: 'Історія життя' },
  past: { en: 'Past', ru: 'Прошлое', lv: 'Pagātne', uk: 'Минуле' },
  future: { en: 'Future', ru: 'Будущее', lv: 'Nākotne', uk: 'Майбутнє' },
  triggersAndEvents: { en: 'Triggers & Events', ru: 'Триггеры и события', lv: 'Izraisītāji un notikumi', uk: 'Тригери та події' },
  goalsAndPlans: { en: 'Goals & Plans', ru: 'Цели и планы', lv: 'Mērķi un plāni', uk: 'Цілі та плани' },
  startYourStory: { en: 'Start Your Story', ru: 'Начни свою историю', lv: 'Sāciet savu stāstu', uk: 'Почни свою історію' },
  addFirstEvent: { en: 'Add your first event by tapping the + button below', ru: 'Добавь первое событие, нажав на кнопку + внизу экрана', lv: 'Pievienojiet pirmo notikumu, nospiežot pogu + zemāk', uk: 'Додай першу подію, натиснувши кнопку + знизу' },
  syncingWithAI: { en: 'Syncing with AI Twin...', ru: 'Синхронизация с AI Twin...', lv: 'Sinhronizēja ar AI Twin...', uk: 'Синхронізація з AI Twin...' },
  detailedReportSoon: { en: 'Detailed report coming soon', ru: 'Детальный отчет скоро будет доступен', lv: 'Detalizēts pārskats drīzumā', uk: 'Детальний звіт скоро буде доступний' },
  eventAdded: { en: 'added!', ru: 'добавлено!', lv: 'pievienots!', uk: 'додано!' },
  
  // Event Types
  trigger: { en: 'Trigger', ru: 'Триггер', lv: 'Izraisītājs', uk: 'Тригер' },
  goal: { en: 'Goal', ru: 'Цель', lv: 'Mērķis', uk: 'Ціль' },
  stressPeak: { en: 'Stress Peak', ru: 'Пик стресса', lv: 'Stresa pīķis', uk: 'Пік стресу' },
  triggerDescription: { en: 'Job change, illness, stress', ru: 'Смена работы, болезнь, стресс', lv: 'Darba maiņa, slimība, stress', uk: 'Зміна роботи, хвороба, стрес' },
  goalDescription: { en: 'Marathon, pregnancy, project', ru: 'Марафон, беременность, проект', lv: 'Maratons, grūtniecība, projekts', uk: 'Марафон, вагітність, проєкт' },
  stressPeakDescription: { en: 'AI detected stress peak', ru: 'ИИ обнаружил пик стресса', lv: 'AI atklāja stresa pīķi', uk: 'ШІ виявив пік стресу' },
  
  // Add Event Form
  selectType: { en: 'Select Type', ru: 'Выберите тип', lv: 'Izvēlieties veidu', uk: 'Оберіть тип' },
  addEvent: { en: 'Add Event', ru: 'Добавить событие', lv: 'Pievienot notikumu', uk: 'Додати подію' },
  title: { en: 'Title', ru: 'Название', lv: 'Nosaukums', uk: 'Назва' },
  titlePlaceholder: { en: 'e.g. Job Change', ru: 'Например: Смена работы', lv: 'Piemēram: Darba maiņa', uk: 'Наприклад: Зміна роботи' },
  date: { en: 'Date', ru: 'Дата', lv: 'Datums', uk: 'Дата' },
  add: { en: 'Add', ru: 'Добавить', lv: 'Pievienot', uk: 'Додати' },
  
  // Event Insights Modal
  stressVsSleep: { en: 'Stress vs Sleep Quality', ru: 'Стресс vs Качество сна', lv: 'Stress pret miega kvalitāti', uk: 'Стрес vs Якість сну' },
  progressAndEnergy: { en: 'Progress & Energy', ru: 'Прогресс и энергия', lv: 'Progress un enerģija', uk: 'Прогрес та енергія' },
  stressPercent: { en: 'Stress %', ru: 'Стресс %', lv: 'Stress %', uk: 'Стрес %' },
  sleepHoursChart: { en: 'Sleep (h)', ru: 'Сон (ч)', lv: 'Miegs (st)', uk: 'Сон (г)' },
  progressPercent: { en: 'Progress %', ru: 'Прогресс %', lv: 'Progress %', uk: 'Прогрес %' },
  energyPercent: { en: 'Energy %', ru: 'Энергия %', lv: 'Enerģija %', uk: 'Енергія %' },
  aiTwinAnalysis: { en: 'AI Twin Analysis', ru: 'AI Twin анализ', lv: 'AI Twin analīze', uk: 'AI Twin аналіз' },
  askAITwin: { en: 'Ask AI Twin', ru: 'Спросить AI Twin', lv: 'Jautāt AI Twin', uk: 'Запитати AI Twin' },
  viewDetailedReport: { en: 'View Detailed Report', ru: 'Просмотреть детальный отчет', lv: 'Skatīt detalizētu pārskatu', uk: 'Переглянути детальний звіт' },
  tellMeMoreAbout: { en: 'Tell me more about', ru: 'Расскажи подробнее про', lv: 'Pastāsti vairāk par', uk: 'Розкажи детальніше про' },
  
  // AI Insights
  triggerInsightRu: { en: 'Analysis shows that during this period, your stress level increased by 30% and deep sleep quality dropped by 25%. We\'ll consider this for future projects.', ru: 'Анализ показал, что в этот период твой уровень стресса вырос на 30%, а качество глубокого сна упало на 25%. Учтем это для будущих проектов и подготовим план восстановления.', lv: 'Analīze parāda, ka šajā periodā jūsu stresa līmenis pieauga par 30% un dziļā miega kvalitāte samazinājās par 25%. Ņemsim to vērā nākotnes projektos.', uk: 'Аналіз показав, що в цей період рівень стресу зріс на 30%, а якість глибокого сну впала на 25%. Врахуємо це для майбутніх проєктів.' },
  goalInsightRu: { en: 'Your preparation is going well! Energy levels are stable, but I recommend increasing recovery time for optimal results.', ru: 'Твоя подготовка идет хорошо! Уровень энергии стабилен, но рекомендую увеличить время восстановления между тренировками для оптимального результата.', lv: 'Jūsu sagatavošanās norit labi! Enerģijas līmenis ir stabils, bet es iesaku palielināt atjaunošanās laiku optimālam rezultātam.', uk: 'Підготовка йде добре! Рівень енергії стабільний, але рекомендую збільшити час відновлення між тренуваннями.' },
  stressPeakInsightRu: { en: 'Stress peak detected. HRV decreased by 15%, resting heart rate increased. I recommend 4-7-8 breathing technique and early sleep for the next 3 days.', ru: 'Обнаружен пик стресса. HRV снизился на 15%, пульс покоя вырос. Рекомендую технику дыхания 4-7-8 и ранний отход ко сну следующие 3 дня.', lv: 'Stresa pīķis atklāts. HRV samazinājās par 15%, miera pulss pieauga. Es iesaku 4-7-8 elpošanas tehniku un agrīnu miegu nākamās 3 dienas.', uk: 'Виявлено пік стресу. HRV знизився на 15%, пульс спокою зріс. Рекомендую техніку дихання 4-7-8 і ранній сон наступні 3 дні.' },
  
  // Chart period labels
  before: { en: 'Before', ru: 'До', lv: 'Pirms', uk: 'До' },
  start: { en: 'Start', ru: 'Начало', lv: 'Sākums', uk: 'Початок' },
  peak: { en: 'Peak', ru: 'Пик', lv: 'Pīķis', uk: 'Пік' },
  after: { en: 'After', ru: 'После', lv: 'Pēc', uk: 'Після' },
  nowPeriod: { en: 'Now', ru: 'Сейчас', lv: 'Tagad', uk: 'Зараз' },
  week: { en: 'Week', ru: 'Неделя', lv: 'Nedēļa', uk: 'Тиждень' },

  // Profile Page
  editProfile: { en: 'Edit Profile', ru: 'Редактировать профиль', lv: 'Rediģēt profilu', uk: 'Редагувати профіль' },
  accountSettings: { en: 'Account', ru: 'Аккаунт', lv: 'Konts', uk: 'Акаунт' },
  systemSettings: { en: 'System', ru: 'Система', lv: 'Sistēma', uk: 'Система' },
  payments: { en: 'Payments', ru: 'Оплата', lv: 'Maksājumi', uk: 'Платежі' },
  deviceSync: { en: 'Device Sync', ru: 'Синхронизация устройств', lv: 'Ierīces sinhronizācija', uk: 'Синхронізація пристроїв' },
  deleteAccount: { en: 'Delete Account', ru: 'Удалить аккаунт', lv: 'Dzēst kontu', uk: 'Видалити акаунт' },
  
  // Edit Profile Modal
  bio: { en: 'Bio', ru: 'О себе', lv: 'Par sevi', uk: 'Про себе' },
  gender: { en: 'Gender', ru: 'Пол', lv: 'Dzimums', uk: 'Стать' },
  birthDate: { en: 'Date of Birth', ru: 'Дата рождения', lv: 'Dzimšanas datums', uk: 'Дата народження' },
  enterName: { en: 'Enter your name', ru: 'Введите имя', lv: 'Ievadiet vārdu', uk: "Введіть ім'я" },
  tellAboutYourself: { en: 'Tell about yourself...', ru: 'Расскажите о себе...', lv: 'Pastāstiet par sevi...', uk: 'Розкажіть про себе...' },
  selectGender: { en: 'Select gender', ru: 'Выберите пол', lv: 'Izvēlieties dzimumu', uk: 'Оберіть стать' },
  male: { en: 'Male', ru: 'Мужской', lv: 'Vīrietis', uk: 'Чоловіча' },
  female: { en: 'Female', ru: 'Женский', lv: 'Sieviete', uk: 'Жіноча' },
  other: { en: 'Other', ru: 'Другой', lv: 'Cits', uk: 'Інша' },
  preferNotToSay: { en: 'Prefer not to say', ru: 'Предпочитаю не указывать', lv: 'Nevēlos norādīt', uk: 'Не вказувати' },
  saving: { en: 'Saving...', ru: 'Сохранение...', lv: 'Saglabā...', uk: 'Збереження...' },
  profileUpdated: { en: 'Profile updated', ru: 'Профиль обновлён', lv: 'Profils atjaunināts', uk: 'Профіль оновлено' },
  errorSavingProfile: { en: 'Error saving profile', ru: 'Ошибка сохранения профиля', lv: 'Kļūda saglabājot profilu', uk: 'Помилка збереження профілю' },

  // Account Settings Modal
  currentEmail: { en: 'Current Email', ru: 'Текущий email', lv: 'Pašreizējais e-pasts', uk: 'Поточний email' },
  changePassword: { en: 'Change Password', ru: 'Сменить пароль', lv: 'Mainīt paroli', uk: 'Змінити пароль' },
  changeEmail: { en: 'Change Email', ru: 'Сменить email', lv: 'Mainīt e-pastu', uk: 'Змінити email' },
  newPassword: { en: 'New Password', ru: 'Новый пароль', lv: 'Jauna parole', uk: 'Новий пароль' },
  confirmPassword: { en: 'Confirm Password', ru: 'Подтвердите пароль', lv: 'Apstipriniet paroli', uk: 'Підтвердіть пароль' },
  newEmail: { en: 'New Email', ru: 'Новый email', lv: 'Jauns e-pasts', uk: 'Новий email' },
  passwordsDoNotMatch: { en: 'Passwords do not match', ru: 'Пароли не совпадают', lv: 'Paroles nesakrīt', uk: 'Паролі не збігаються' },
  passwordTooShort: { en: 'Password must be at least 6 characters', ru: 'Пароль должен быть минимум 6 символов', lv: 'Parolei jābūt vismaz 6 simboliem', uk: 'Пароль повинен містити мінімум 6 символів' },
  passwordChanged: { en: 'Password changed successfully', ru: 'Пароль успешно изменён', lv: 'Parole veiksmīgi nomainīta', uk: 'Пароль успішно змінено' },
  emailChangeRequested: { en: 'Confirmation email sent', ru: 'Письмо подтверждения отправлено', lv: 'Apstiprinājuma e-pasts nosūtīts', uk: 'Лист підтвердження надіслано' },
  updatePassword: { en: 'Update Password', ru: 'Обновить пароль', lv: 'Atjaunināt paroli', uk: 'Оновити пароль' },
  updateEmail: { en: 'Update Email', ru: 'Обновить email', lv: 'Atjaunināt e-pastu', uk: 'Оновити email' },

  // System Settings Modal
  theme: { en: 'Theme', ru: 'Тема', lv: 'Tēma', uk: 'Тема' },
  lightTheme: { en: 'Light', ru: 'Светлая', lv: 'Gaišs', uk: 'Світла' },
  darkTheme: { en: 'Dark', ru: 'Тёмная', lv: 'Tumšs', uk: 'Темна' },
  help: { en: 'Help', ru: 'Помощь', lv: 'Palīdzība', uk: 'Допомога' },
  faq: { en: 'FAQ', ru: 'Вопросы и ответы', lv: 'Bieži uzdotie jautājumi', uk: 'Часті запитання' },
  contactSupport: { en: 'Contact Support', ru: 'Связаться с поддержкой', lv: 'Sazināties ar atbalstu', uk: "Зв'язатися з підтримкою" },
  legal: { en: 'Legal', ru: 'Правовая информация', lv: 'Juridiskā informācija', uk: 'Правова інформація' },
  privacyPolicy: { en: 'Privacy Policy', ru: 'Политика конфиденциальности', lv: 'Privātuma politika', uk: 'Політика конфіденційності' },
  termsOfService: { en: 'Terms of Service', ru: 'Условия использования', lv: 'Lietošanas noteikumi', uk: 'Умови використання' },
  cookiePolicy: { en: 'Cookie Policy', ru: 'Политика Cookie', lv: 'Sīkdatņu politika', uk: 'Політика Cookie' },
  faqQuestion1: { en: 'How does AI Twin work?', ru: 'Как работает AI Twin?', lv: 'Kā darbojas AI Twin?', uk: 'Як працює AI Twin?' },
  faqAnswer1: { en: 'AI Twin analyzes your health data to provide personalized insights and recommendations.', ru: 'AI Twin анализирует данные о здоровье и даёт персональные рекомендации.', lv: 'AI Twin analizē jūsu veselības datus, lai sniegtu personalizētus ieteikumus.', uk: 'AI Twin аналізує дані про здоров\'я та надає персональні рекомендації.' },
  faqQuestion2: { en: 'How to sync my wearable?', ru: 'Как синхронизировать устройство?', lv: 'Kā sinhronizēt ierīci?', uk: 'Як синхронізувати пристрій?' },
  faqAnswer2: { en: 'Go to Device Sync in Profile and select your device to connect.', ru: 'Перейдите в Синхронизацию устройств в Профиле и выберите устройство.', lv: 'Dodieties uz Ierīces sinhronizāciju Profilā un izvēlieties ierīci.', uk: 'Перейдіть до Синхронізації пристроїв у Профілі та оберіть пристрій.' },
  faqQuestion3: { en: 'Is my data secure?', ru: 'Мои данные в безопасности?', lv: 'Vai mani dati ir droši?', uk: 'Мої дані в безпеці?' },
  faqAnswer3: { en: 'Yes, all data is encrypted and stored securely. We never share your personal information.', ru: 'Да, все данные зашифрованы и хранятся безопасно. Мы не передаём личную информацию.', lv: 'Jā, visi dati tiek šifrēti un droši uzglabāti. Mēs nekad neizpaužam jūsu personīgo informāciju.', uk: 'Так, всі дані зашифровані та зберігаються безпечно. Ми ніколи не передаємо особисту інформацію.' },

  // Payments Modal
  upgradeToPro: { en: 'Upgrade to Pro', ru: 'Перейти на Pro', lv: 'Uzlabot uz Pro', uk: 'Перейти на Pro' },
  monthly: { en: 'Monthly', ru: 'Ежемесячно', lv: 'Mēnesī', uk: 'Щомісячно' },
  yearly: { en: 'Yearly', ru: 'Ежегодно', lv: 'Gadā', uk: 'Щорічно' },
  perMonth: { en: '/month', ru: '/месяц', lv: '/mēnesī', uk: '/місяць' },
  perYear: { en: '/year', ru: '/год', lv: '/gadā', uk: '/рік' },
  save33: { en: 'Save 33%', ru: 'Экономия 33%', lv: 'Ietaupiet 33%', uk: 'Економія 33%' },
  proFeatures: { en: 'Pro Features', ru: 'Pro функции', lv: 'Pro funkcijas', uk: 'Pro функції' },
  unlimitedAIChats: { en: 'Unlimited AI chats', ru: 'Безлимитный AI чат', lv: 'Neierobežotas AI sarunas', uk: 'Безлімітний ШІ чат' },
  advancedHealthInsights: { en: 'Advanced health insights', ru: 'Продвинутый анализ здоровья', lv: 'Uzlabota veselības analīze', uk: "Розширений аналіз здоров'я" },
  wearableSync: { en: 'Wearable device sync', ru: 'Синхронизация с устройствами', lv: 'Valkājamo ierīču sinhronizācija', uk: 'Синхронізація з пристроями' },
  prioritySupport: { en: 'Priority support', ru: 'Приоритетная поддержка', lv: 'Prioritāra atbalsts', uk: 'Пріоритетна підтримка' },
  customReports: { en: 'Custom health reports', ru: 'Персональные отчёты', lv: 'Pielāgoti veselības pārskati', uk: 'Персональні звіти' },
  familySharing: { en: 'Family sharing (up to 5)', ru: 'Семейный доступ (до 5)', lv: 'Ģimenes koplietošana (līdz 5)', uk: 'Сімейний доступ (до 5)' },
  subscribeTo: { en: 'Subscribe', ru: 'Подписаться', lv: 'Abonēt', uk: 'Підписатися' },
  cancelAnytime: { en: 'Cancel anytime. No questions asked.', ru: 'Отмена в любое время без вопросов.', lv: 'Atceliet jebkurā laikā. Bez jautājumiem.', uk: 'Скасування в будь-який час без питань.' },
  paymentComingSoon: { en: 'Payment integration coming soon!', ru: 'Оплата скоро будет доступна!', lv: 'Maksājumu integrācija drīzumā!', uk: 'Оплата скоро буде доступна!' },

  // Device Sync Modal
  deviceSyncDescription: { en: 'Connect your smart devices to sync health data automatically.', ru: 'Подключите умные устройства для автоматической синхронизации данных.', lv: 'Savienojiet savas viedierīces, lai automātiski sinhronizētu veselības datus.', uk: 'Підключіть розумні пристрої для автоматичної синхронізації даних.' },
  tapToConnect: { en: 'Tap to connect', ru: 'Нажмите для подключения', lv: 'Pieskarieties, lai savienotu', uk: 'Натисніть для підключення' },
  deviceConnected: { en: 'Device connected!', ru: 'Устройство подключено!', lv: 'Ierīce savienota!', uk: 'Пристрій підключено!' },
  deviceDisconnected: { en: 'Device disconnected', ru: 'Устройство отключено', lv: 'Ierīce atvienota', uk: 'Пристрій відключено' },
  allDevicesDisconnected: { en: 'All devices disconnected', ru: 'Все устройства отключены', lv: 'Visas ierīces atvienotas', uk: 'Всі пристрої відключено' },
  disconnectAll: { en: 'Disconnect All', ru: 'Отключить все', lv: 'Atvienot visas', uk: 'Відключити все' },

  // Delete Account Modal
  deleteAccountWarning: { en: 'This action cannot be undone.', ru: 'Это действие нельзя отменить.', lv: 'Šo darbību nevar atsaukt.', uk: 'Цю дію не можна скасувати.' },
  deleteAccountConsequences: { en: 'Deleting your account will permanently remove:', ru: 'Удаление аккаунта навсегда удалит:', lv: 'Konta dzēšana neatgriezeniski noņems:', uk: 'Видалення акаунту назавжди видалить:' },
  allDataWillBeDeleted: { en: 'All your health data and history', ru: 'Все ваши данные о здоровье и историю', lv: 'Visus jūsu veselības datus un vēsturi', uk: "Всі ваші дані про здоров'я та історію" },
  cannotBeUndone: { en: 'This action cannot be reversed', ru: 'Это действие невозможно отменить', lv: 'Šo darbību nevar atcelt', uk: 'Цю дію неможливо скасувати' },
  subscriptionWillBeCanceled: { en: 'Your subscription will be canceled', ru: 'Ваша подписка будет отменена', lv: 'Jūsu abonements tiks atcelts', uk: 'Вашу підписку буде скасовано' },
  typeDeleteToConfirm: { en: 'Type DELETE to confirm:', ru: 'Введите DELETE для подтверждения:', lv: 'Ierakstiet DELETE, lai apstiprinātu:', uk: 'Введіть DELETE для підтвердження:' },
  pleaseTypeDelete: { en: 'Please type DELETE to confirm', ru: 'Введите DELETE для подтверждения', lv: 'Lūdzu, ierakstiet DELETE, lai apstiprinātu', uk: 'Введіть DELETE для підтвердження' },
  deleting: { en: 'Deleting...', ru: 'Удаление...', lv: 'Dzēš...', uk: 'Видалення...' },
  deleteForever: { en: 'Delete Forever', ru: 'Удалить навсегда', lv: 'Dzēst uz visiem laikiem', uk: 'Видалити назавжди' },
  accountDeleted: { en: 'Account deleted', ru: 'Аккаунт удалён', lv: 'Konts dzēsts', uk: 'Акаунт видалено' },
  errorDeletingAccount: { en: 'Error deleting account', ru: 'Ошибка удаления аккаунта', lv: 'Kļūda dzēšot kontu', uk: 'Помилка видалення акаунту' },

  // Avatar Upload
  pleaseSelectImage: { en: 'Please select an image file', ru: 'Выберите файл изображения', lv: 'Lūdzu, izvēlieties attēla failu', uk: 'Оберіть файл зображення' },
  imageTooLarge: { en: 'Image must be less than 5MB', ru: 'Изображение должно быть меньше 5МБ', lv: 'Attēlam jābūt mazākam par 5MB', uk: 'Зображення повинно бути менше 5МБ' },
  uploadingAvatar: { en: 'Uploading avatar...', ru: 'Загрузка аватара...', lv: 'Augšupielādē avatāru...', uk: 'Завантаження аватару...' },
  avatarUpdated: { en: 'Avatar updated!', ru: 'Аватар обновлён!', lv: 'Avatārs atjaunināts!', uk: 'Аватар оновлено!' },
  errorUploadingAvatar: { en: 'Error uploading avatar', ru: 'Ошибка загрузки аватара', lv: 'Kļūda augšupielādējot avatāru', uk: 'Помилка завантаження аватару' },

  // Stripe Payments
  yourSubscription: { en: 'Your Subscription', ru: 'Ваша подписка', lv: 'Jūsu abonements', uk: 'Ваша підписка' },
  activeSubscription: { en: 'Active Subscription', ru: 'Активная подписка', lv: 'Aktīvs abonements', uk: 'Активна підписка' },
  plan: { en: 'Plan', ru: 'План', lv: 'Plāns', uk: 'План' },
  renewsOn: { en: 'Renews on', ru: 'Продлевается', lv: 'Atjaunojas', uk: 'Продовжується' },
  manageSubscription: { en: 'Manage Subscription', ru: 'Управление подпиской', lv: 'Pārvaldīt abonementu', uk: 'Керувати підпискою' },
  redirectingToCheckout: { en: 'Redirecting to checkout...', ru: 'Переход к оплате...', lv: 'Pārvirzīšana uz norēķinu...', uk: 'Перехід до оплати...' },
  checkoutError: { en: 'Error creating checkout session', ru: 'Ошибка создания сессии оплаты', lv: 'Kļūda veidojot norēķinu sesiju', uk: 'Помилка створення сесії оплати' },
  portalError: { en: 'Error opening subscription portal', ru: 'Ошибка открытия портала подписки', lv: 'Kļūda atverot abonementa portālu', uk: 'Помилка відкриття порталу підписки' },

  // Check-in
  howAreYou: { en: 'How are you?', ru: 'Как ты?', lv: 'Kā tev klājas?', uk: 'Як ти?' },
  pain: { en: 'Pain', ru: 'Боль', lv: 'Sāpes', uk: 'Біль' },
  checkInSaved: { en: 'Check-in saved!', ru: 'Чек-ин сохранён!', lv: 'Pārbaude saglabāta!', uk: 'Чек-ін збережено!' },
  
  // Life Events
  pleaseLoginToSave: { en: 'Please login to save events', ru: 'Войдите, чтобы сохранить события', lv: 'Lūdzu, pierakstieties, lai saglabātu notikumus', uk: 'Увійдіть, щоб зберегти події' },
  addedToTimeline: { en: 'added to timeline!', ru: 'добавлено в таймлайн!', lv: 'pievienots laika skalai!', uk: 'додано до таймлайну!' },
  failedToLoadEvents: { en: 'Failed to load events', ru: 'Не удалось загрузить события', lv: 'Neizdevās ielādēt notikumus', uk: 'Не вдалося завантажити події' },
  failedToSaveEvent: { en: 'Failed to save event', ru: 'Не удалось сохранить событие', lv: 'Neizdevās saglabāt notikumu', uk: 'Не вдалося зберегти подію' },
  failedToDeleteEvent: { en: 'Failed to delete event', ru: 'Не удалось удалить событие', lv: 'Neizdevās dzēst notikumu', uk: 'Не вдалося видалити подію' },
  eventRemoved: { en: 'Event removed from timeline', ru: 'Событие удалено из таймлайна', lv: 'Notikums noņemts no laika skalas', uk: 'Подію видалено з таймлайну' },
  
  // Twin/Voice
  voiceMode: { en: 'Voice', ru: 'Голос', lv: 'Balss', uk: 'Голос' },
  textMode: { en: 'Text', ru: 'Текст', lv: 'Teksts', uk: 'Текст' },
  connecting: { en: 'Connecting...', ru: 'Подключение...', lv: 'Savienojas...', uk: 'Підключення...' },
  connected: { en: 'Connected', ru: 'Подключено', lv: 'Savienots', uk: 'Підключено' },
  disconnect: { en: 'Disconnect', ru: 'Отключить', lv: 'Atvienot', uk: 'Відключити' },
  connect: { en: 'Connect', ru: 'Подключить', lv: 'Savienot', uk: 'Підключити' },
  listening: { en: 'Listening...', ru: 'Слушаю...', lv: 'Klausos...', uk: 'Слухаю...' },
  tapToSpeak: { en: 'Tap to speak', ru: 'Нажми, чтобы говорить', lv: 'Pieskarieties, lai runātu', uk: 'Натисни, щоб говорити' },
  processing: { en: 'Processing...', ru: 'Обработка...', lv: 'Apstrādā...', uk: 'Обробка...' },
  typeMessage: { en: 'Type a message...', ru: 'Введите сообщение...', lv: 'Rakstiet ziņojumu...', uk: 'Введіть повідомлення...' },
  send: { en: 'Send', ru: 'Отправить', lv: 'Sūtīt', uk: 'Надіслати' },
  clearChat: { en: 'Clear chat', ru: 'Очистить чат', lv: 'Notīrīt čatu', uk: 'Очистити чат' },
  stopSpeaking: { en: 'Stop speaking', ru: 'Остановить', lv: 'Apturēt runāšanu', uk: 'Зупинити' },
  connectToStart: { en: 'Connect to start voice conversation', ru: 'Подключитесь для голосового разговора', lv: 'Savienojieties, lai sāktu balss sarunu', uk: 'Підключіться для голосової розмови' },
  
  // Pagination
  previous: { en: 'Previous', ru: 'Назад', lv: 'Iepriekšējais', uk: 'Назад' },
  next: { en: 'Next', ru: 'Далее', lv: 'Nākamais', uk: 'Далі' },
  
  // Sidebar
  toggleSidebar: { en: 'Toggle Sidebar', ru: 'Переключить боковую панель', lv: 'Pārslēgt sānjoslu', uk: 'Перемкнути бічну панель' },
  
  // Google OAuth errors
  googleNotEnabled: { en: 'Google sign-in is not enabled for this project', ru: 'Вход через Google не включён для этого проекта', lv: 'Google pierakstīšanās nav iespējota šim projektam', uk: 'Вхід через Google не увімкнено для цього проєкту' },
  invalidRedirectUrl: { en: 'Invalid Google OAuth redirect URL', ru: 'Неверный redirect URL для Google OAuth', lv: 'Nederīgs Google OAuth novirzīšanas URL', uk: 'Невірний redirect URL для Google OAuth' },
  
  // Magic Link
  magicLinkSent: { en: 'Magic link sent to your email', ru: 'Ссылка для входа отправлена на email', lv: 'Burvju saite nosūtīta uz jūsu e-pastu', uk: 'Посилання для входу надіслано на email' },
  signInWithEmail: { en: 'Sign in with Email link', ru: 'Войти по ссылке на email', lv: 'Pierakstīties ar e-pasta saiti', uk: 'Увійти за посиланням на email' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-language');
      if (saved && ['en', 'ru', 'lv', 'uk'].includes(saved)) {
        return saved as Language;
      }
      const browserLang = navigator.language || '';
      if (browserLang.startsWith('uk')) return 'uk';
      if (browserLang.startsWith('ru')) return 'ru';
      if (browserLang.startsWith('lv')) return 'lv';
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

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
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
};
