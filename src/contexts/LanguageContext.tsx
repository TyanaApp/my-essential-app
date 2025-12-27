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
  appleSoon: { en: 'Apple (soon)', ru: 'Apple (скоро)', lv: 'Apple (drīz)' },
  or: { en: 'or', ru: 'или', lv: 'vai' },
  loading: { en: 'Loading...', ru: 'Загрузка...', lv: 'Ielādē...' },
  back: { en: 'Back', ru: 'Назад', lv: 'Atpakaļ' },
  
  // Auth Form
  email: { en: 'Email', ru: 'Электронная почта', lv: 'E-pasts' },
  password: { en: 'Password', ru: 'Пароль', lv: 'Parole' },
  displayName: { en: 'Display Name', ru: 'Отображаемое имя', lv: 'Vārds' },
  yourName: { en: 'Your name', ru: 'Ваше имя', lv: 'Jūsu vārds' },
  createAccount: { en: 'Create Account', ru: 'Создать аккаунт', lv: 'Izveidot kontu' },
  alreadyHaveAccount: { en: 'Already have an account?', ru: 'Уже есть аккаунт?', lv: 'Jau ir konts?' },
  noAccount: { en: "Don't have an account?", ru: 'Нет аккаунта?', lv: 'Nav konta?' },
  invalidEmail: { en: 'Invalid email address', ru: 'Некорректный email адрес', lv: 'Nederīga e-pasta adrese' },
  passwordMinLength: { en: 'Password must be at least 6 characters', ru: 'Пароль должен содержать минимум 6 символов', lv: 'Parolei jābūt vismaz 6 simbolus garai' },
  invalidCredentials: { en: 'Invalid email or password', ru: 'Неверный email или пароль', lv: 'Nepareizs e-pasts vai parole' },
  userAlreadyRegistered: { en: 'User already registered', ru: 'Пользователь уже зарегистрирован', lv: 'Lietotājs jau reģistrēts' },
  emailNotConfirmed: { en: 'Email not confirmed', ru: 'Email не подтверждён', lv: 'E-pasts nav apstiprināts' },
  tooManyAttempts: { en: 'Too many attempts. Please try again later', ru: 'Слишком много попыток. Попробуйте позже', lv: 'Pārāk daudz mēģinājumu. Mēģiniet vēlāk' },
  errorOccurred: { en: 'An error occurred. Please try again', ru: 'Произошла ошибка. Попробуйте снова', lv: 'Radās kļūda. Mēģiniet vēlreiz' },
  googleSignInFailed: { en: 'Google sign in failed', ru: 'Ошибка входа через Google', lv: 'Google pierakstīšanās neizdevās' },
  accountCreated: { en: 'Account created! Welcome!', ru: 'Аккаунт создан! Добро пожаловать!', lv: 'Konts izveidots! Laipni lūgti!' },
  welcomeBack: { en: 'Welcome back!', ru: 'С возвращением!', lv: 'Laipni lūgti atpakaļ!' },
  unexpectedError: { en: 'An unexpected error occurred', ru: 'Неожиданная ошибка', lv: 'Radās neparedzēta kļūda' },
  
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
  whatIf: { en: 'What If', ru: 'Что если', lv: 'Kas ja' },
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
  
  // Now section
  why: { en: 'Why?', ru: 'Почему?', lv: 'Kāpēc?' },
  energyExplanation: { en: 'Energy explanation', ru: 'Объяснение энергии', lv: 'Enerģijas skaidrojums' },
  sleepImpact: { en: 'Sleep: 7.5h (+12%)', ru: 'Сон: 7.5ч (+12%)', lv: 'Miegs: 7.5h (+12%)' },
  stressImpact: { en: 'Stress: Low (+8%)', ru: 'Стресс: Низкий (+8%)', lv: 'Stress: Zems (+8%)' },
  cycleImpact: { en: 'Cycle: Follicular (+5%)', ru: 'Цикл: Фолликулярная (+5%)', lv: 'Cikls: Folikulāra (+5%)' },
  trend: { en: 'trend', ru: 'тренд', lv: 'tendence' },
  todaysFocus: { en: "Today's Focus", ru: 'Фокус дня', lv: 'Šodienas fokuss' },
  mainAdvice: { en: 'Prioritize recovery today', ru: 'Приоритет — восстановление', lv: 'Prioritāte — atjaunošanās' },
  goToBedEarly: { en: 'Go to bed before 11pm', ru: 'Лечь до 23:00', lv: 'Gulēt pirms 23:00' },
  walk20min: { en: '20 min walk after lunch', ru: 'Прогулка 20 мин после обеда', lv: '20 min pastaiga pēc pusdienām' },
  limitCaffeine: { en: 'Limit caffeine after 2pm', ru: 'Ограничить кофеин после 14:00', lv: 'Ierobežot kofeīnu pēc 14:00' },
  
  // Soon section
  cycleTimeline: { en: 'Cycle Timeline', ru: 'Таймлайн цикла', lv: 'Cikla laika skala' },
  nextKeyMoments: { en: 'Next Key Moments', ru: 'Ключевые моменты', lv: 'Galvenie momenti' },
  pmsIn: { en: 'PMS in', ru: 'ПМС через', lv: 'PMS pēc' },
  ovulationIn: { en: 'Ovulation in', ru: 'Овуляция через', lv: 'Ovulācija pēc' },
  periodIn: { en: 'Period in', ru: 'Менструация через', lv: 'Menstruācija pēc' },
  days: { en: 'days', ru: 'дней', lv: 'dienas' },
  preparePlan: { en: 'Prepare plan', ru: 'Подготовить план', lv: 'Sagatavot plānu' },
  follicular: { en: 'Follicular', ru: 'Фолликулярная', lv: 'Folikulāra' },
  ovulation: { en: 'Ovulation', ru: 'Овуляция', lv: 'Ovulācija' },
  luteal: { en: 'Luteal', ru: 'Лютеиновая', lv: 'Luteāla' },
  menstrual: { en: 'Menstrual', ru: 'Менструация', lv: 'Menstruācija' },
  riskWindow: { en: 'Risk window', ru: 'Окно риска', lv: 'Riska logs' },
  
  // Path section
  essential: { en: 'Essential', ru: 'Важно', lv: 'Būtiski' },
  optional: { en: 'Optional', ru: 'По желанию', lv: 'Pēc izvēles' },
  makeTodayLighter: { en: 'Make today lighter', ru: 'Облегчить день', lv: 'Atvieglot dienu' },
  taskCleared: { en: 'Non-essential tasks cleared', ru: 'Неважные задачи убраны', lv: 'Nebūtiski uzdevumi noņemti' },
  
  // What If section
  habitSimulator: { en: 'Habit Simulator', ru: 'Симулятор привычек', lv: 'Ieradumu simulators' },
  whatIfAsk: { en: 'What if I...', ru: 'Что будет, если...', lv: 'Kas notiks, ja es...' },
  plusHourSleep: { en: '+1 hour sleep', ru: '+1 час сна', lv: '+1 stunda miega' },
  noCoffee: { en: 'No coffee', ru: 'Без кофе', lv: 'Bez kafijas' },
  noAlcohol: { en: 'No alcohol', ru: 'Без алкоголя', lv: 'Bez alkohola' },
  energyChange: { en: 'energy', ru: 'энергии', lv: 'enerģijas' },
  stressChange: { en: 'stress', ru: 'стресса', lv: 'stresa' },
  beforeAfter: { en: 'Before vs After', ru: 'Было vs Станет', lv: 'Pirms vs Pēc' },
  turnIntoExperiment: { en: 'Turn into experiment', ru: 'Превратить в эксперимент', lv: 'Pārvērst eksperimentā' },
  experimentDays: { en: 'days experiment', ru: 'дней эксперимент', lv: 'dienu eksperiments' },
  
  // AI
  dailyAdvice: { en: 'Daily Advice', ru: 'Совет дня', lv: 'Dienas padoms' },
  aiTwinSays: { en: 'AI Twin says', ru: 'AI Twin говорит', lv: 'AI Twin saka' },
  askAI: { en: 'Ask AI', ru: 'Спросить ИИ', lv: 'Jautāt AI' },
  healthAssistant: { en: 'Health Assistant', ru: 'Ассистент здоровья', lv: 'Veselības asistents' },
  speaking: { en: 'Speaking...', ru: 'Говорю...', lv: 'Runāju...' },
  listen: { en: 'Listen', ru: 'Озвучить', lv: 'Klausīties' },
  stop: { en: 'Stop', ru: 'Стоп', lv: 'Apturēt' },
  
  // Map
  map: { en: 'Map', ru: 'Карта', lv: 'Karte' },
  nearbyUsers: { en: 'Nearby Users', ru: 'Пользователи рядом', lv: 'Lietotāji tuvumā' },
  safePlaces: { en: 'Safe Places', ru: 'Безопасные места', lv: 'Drošas vietas' },
  
  // Profile
  profile: { en: 'Profile', ru: 'Профиль', lv: 'Profils' },
  settings: { en: 'Settings', ru: 'Настройки', lv: 'Iestatījumi' },
  logout: { en: 'Log Out', ru: 'Выйти', lv: 'Iziet' },
  language: { en: 'Language', ru: 'Язык', lv: 'Valoda' },
  
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
  
  // History Page
  lifeHistory: { en: 'Life History', ru: 'История жизни', lv: 'Dzīves vēsture' },
  past: { en: 'Past', ru: 'Прошлое', lv: 'Pagātne' },
  future: { en: 'Future', ru: 'Будущее', lv: 'Nākotne' },
  triggersAndEvents: { en: 'Triggers & Events', ru: 'Триггеры и события', lv: 'Izraisītāji un notikumi' },
  goalsAndPlans: { en: 'Goals & Plans', ru: 'Цели и планы', lv: 'Mērķi un plāni' },
  startYourStory: { en: 'Start Your Story', ru: 'Начни свою историю', lv: 'Sāciet savu stāstu' },
  addFirstEvent: { en: 'Add your first event by tapping the + button below', ru: 'Добавь первое событие, нажав на кнопку + внизу экрана', lv: 'Pievienojiet pirmo notikumu, nospiežot pogu + zemāk' },
  syncingWithAI: { en: 'Syncing with AI Twin...', ru: 'Синхронизация с AI Twin...', lv: 'Sinhronizēja ar AI Twin...' },
  detailedReportSoon: { en: 'Detailed report coming soon', ru: 'Детальный отчет скоро будет доступен', lv: 'Detalizēts pārskats drīzumā' },
  eventAdded: { en: 'added!', ru: 'добавлено!', lv: 'pievienots!' },
  
  // Event Types
  trigger: { en: 'Trigger', ru: 'Триггер', lv: 'Izraisītājs' },
  goal: { en: 'Goal', ru: 'Цель', lv: 'Mērķis' },
  stressPeak: { en: 'Stress Peak', ru: 'Пик стресса', lv: 'Stresa pīķis' },
  triggerDescription: { en: 'Job change, illness, stress', ru: 'Смена работы, болезнь, стресс', lv: 'Darba maiņa, slimība, stress' },
  goalDescription: { en: 'Marathon, pregnancy, project', ru: 'Марафон, беременность, проект', lv: 'Maratons, grūtniecība, projekts' },
  stressPeakDescription: { en: 'AI detected stress peak', ru: 'ИИ обнаружил пик стресса', lv: 'AI atklāja stresa pīķi' },
  
  // Add Event Form
  selectType: { en: 'Select Type', ru: 'Выберите тип', lv: 'Izvēlieties veidu' },
  addEvent: { en: 'Add Event', ru: 'Добавить событие', lv: 'Pievienot notikumu' },
  title: { en: 'Title', ru: 'Название', lv: 'Nosaukums' },
  titlePlaceholder: { en: 'e.g. Job Change', ru: 'Например: Смена работы', lv: 'Piemēram: Darba maiņa' },
  date: { en: 'Date', ru: 'Дата', lv: 'Datums' },
  add: { en: 'Add', ru: 'Добавить', lv: 'Pievienot' },
  
  // Event Insights Modal
  stressVsSleep: { en: 'Stress vs Sleep Quality', ru: 'Стресс vs Качество сна', lv: 'Stress pret miega kvalitāti' },
  progressAndEnergy: { en: 'Progress & Energy', ru: 'Прогресс и энергия', lv: 'Progress un enerģija' },
  stressPercent: { en: 'Stress %', ru: 'Стресс %', lv: 'Stress %' },
  sleepHoursChart: { en: 'Sleep (h)', ru: 'Сон (ч)', lv: 'Miegs (st)' },
  progressPercent: { en: 'Progress %', ru: 'Прогресс %', lv: 'Progress %' },
  energyPercent: { en: 'Energy %', ru: 'Энергия %', lv: 'Enerģija %' },
  aiTwinAnalysis: { en: 'AI Twin Analysis', ru: 'AI Twin анализ', lv: 'AI Twin analīze' },
  askAITwin: { en: 'Ask AI Twin', ru: 'Спросить AI Twin', lv: 'Jautāt AI Twin' },
  viewDetailedReport: { en: 'View Detailed Report', ru: 'Просмотреть детальный отчет', lv: 'Skatīt detalizētu pārskatu' },
  tellMeMoreAbout: { en: 'Tell me more about', ru: 'Расскажи подробнее про', lv: 'Pastāsti vairāk par' },
  
  // AI Insights
  triggerInsightRu: { en: 'Analysis shows that during this period, your stress level increased by 30% and deep sleep quality dropped by 25%. We\'ll consider this for future projects.', ru: 'Анализ показал, что в этот период твой уровень стресса вырос на 30%, а качество глубокого сна упало на 25%. Учтем это для будущих проектов и подготовим план восстановления.', lv: 'Analīze parāda, ka šajā periodā jūsu stresa līmenis pieauga par 30% un dziļā miega kvalitāte samazinājās par 25%. Ņemsim to vērā nākotnes projektos.' },
  goalInsightRu: { en: 'Your preparation is going well! Energy levels are stable, but I recommend increasing recovery time for optimal results.', ru: 'Твоя подготовка идет хорошо! Уровень энергии стабилен, но рекомендую увеличить время восстановления между тренировками для оптимального результата.', lv: 'Jūsu sagatavošanās norit labi! Enerģijas līmenis ir stabils, bet es iesaku palielināt atjaunošanās laiku optimālam rezultātam.' },
  stressPeakInsightRu: { en: 'Stress peak detected. HRV decreased by 15%, resting heart rate increased. I recommend 4-7-8 breathing technique and early sleep for the next 3 days.', ru: 'Обнаружен пик стресса. HRV снизился на 15%, пульс покоя вырос. Рекомендую технику дыхания 4-7-8 и ранний отход ко сну следующие 3 дня.', lv: 'Stresa pīķis atklāts. HRV samazinājās par 15%, miera pulss pieauga. Es iesaku 4-7-8 elpošanas tehniku un agrīnu miegu nākamās 3 dienas.' },
  
  // Chart period labels
  before: { en: 'Before', ru: 'До', lv: 'Pirms' },
  start: { en: 'Start', ru: 'Начало', lv: 'Sākums' },
  peak: { en: 'Peak', ru: 'Пик', lv: 'Pīķis' },
  after: { en: 'After', ru: 'После', lv: 'Pēc' },
  nowPeriod: { en: 'Now', ru: 'Сейчас', lv: 'Tagad' },
  week: { en: 'Week', ru: 'Неделя', lv: 'Nedēļa' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Load language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-language');
      if (saved && ['en', 'ru', 'lv'].includes(saved)) {
        return saved as Language;
      }
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
