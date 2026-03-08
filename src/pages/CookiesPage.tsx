import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-lg font-bold mb-4 pl-4 text-foreground" style={{ borderLeft: '4px solid #7C3AED' }}>{title}</h2>
    <div className="text-base leading-[1.8] space-y-3 text-foreground/80">{children}</div>
  </div>
);

const CookiesPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const content: Record<string, any> = {
    en: {
      title: 'Cookie Policy',
      lastUpdated: 'Last updated: March 2026',
      s1Title: '1. What are cookies',
      s1: 'Cookies are small files saved in your browser to remember preferences and keep you logged in.',
      s2Title: '2. Cookies we use',
      essential: 'ESSENTIAL (required, cannot disable):',
      essentialItems: [
        'Auth session — keeps you logged in',
        'Language preference — remembers your language',
        'Notification settings',
      ],
      essentialNote: 'Without these cookies the app cannot function.',
      analytics: 'ANALYTICS: We do NOT use analytics cookies.',
      advertising: 'ADVERTISING: We do NOT use advertising cookies. We show NO ads.',
      thirdParty: 'THIRD PARTY: Stripe saves cookies for secure payment processing only.',
      s3Title: '3. Managing cookies',
      s3: 'You can delete cookies in your browser settings. Disabling essential cookies will break the app functionality.',
    },
    ru: {
      title: 'Политика Cookie',
      lastUpdated: 'Последнее обновление: март 2026',
      s1Title: '1. Что такое cookie',
      s1: 'Cookie — это небольшие файлы, сохраняемые в вашем браузере для запоминания настроек и поддержания авторизации.',
      s2Title: '2. Какие cookie мы используем',
      essential: 'НЕОБХОДИМЫЕ (обязательные, нельзя отключить):',
      essentialItems: [
        'Сессия авторизации — поддерживает вход в систему',
        'Языковые предпочтения — запоминает ваш язык',
        'Настройки уведомлений',
      ],
      essentialNote: 'Без этих cookie приложение не может работать.',
      analytics: 'АНАЛИТИКА: Мы НЕ используем аналитические cookie.',
      advertising: 'РЕКЛАМА: Мы НЕ используем рекламные cookie. Мы НЕ показываем рекламу.',
      thirdParty: 'ТРЕТЬИ СТОРОНЫ: Stripe сохраняет cookie только для безопасной обработки платежей.',
      s3Title: '3. Управление cookie',
      s3: 'Вы можете удалить cookie в настройках браузера. Отключение обязательных cookie нарушит работу приложения.',
    },
    uk: {
      title: 'Політика Cookie',
      lastUpdated: 'Останнє оновлення: березень 2026',
      s1Title: '1. Що таке cookie',
      s1: 'Cookie — це невеликі файли, що зберігаються у вашому браузері для запам\'ятовування налаштувань та підтримки авторизації.',
      s2Title: '2. Які cookie ми використовуємо',
      essential: 'НЕОБХІДНІ (обов\'язкові, не можна вимкнути):',
      essentialItems: [
        'Сесія авторизації — підтримує вхід у систему',
        'Мовні налаштування — запам\'ятовує вашу мову',
        'Налаштування сповіщень',
      ],
      essentialNote: 'Без цих cookie додаток не може працювати.',
      analytics: 'АНАЛІТИКА: Ми НЕ використовуємо аналітичні cookie.',
      advertising: 'РЕКЛАМА: Ми НЕ використовуємо рекламні cookie. Ми НЕ показуємо рекламу.',
      thirdParty: 'ТРЕТІ СТОРОНИ: Stripe зберігає cookie лише для безпечної обробки платежів.',
      s3Title: '3. Управління cookie',
      s3: 'Ви можете видалити cookie в налаштуваннях браузера. Вимкнення обов\'язкових cookie порушить роботу додатку.',
    },
    lv: {
      title: 'Sīkdatņu politika',
      lastUpdated: 'Pēdējoreiz atjaunināts: 2026. gada marts',
      s1Title: '1. Kas ir sīkdatnes',
      s1: 'Sīkdatnes ir nelieli faili, kas tiek saglabāti jūsu pārlūkā, lai atcerētos iestatījumus un uzturētu pieteikšanos.',
      s2Title: '2. Kādas sīkdatnes mēs izmantojam',
      essential: 'BŪTISKĀS (obligātas, nevar atspējot):',
      essentialItems: [
        'Autorizācijas sesija — uztur pieteikšanos',
        'Valodas izvēle — atceras jūsu valodu',
        'Paziņojumu iestatījumi',
      ],
      essentialNote: 'Bez šīm sīkdatnēm lietotne nevar darboties.',
      analytics: 'ANALĪTIKA: Mēs NEIZMANTOJAM analītiskās sīkdatnes.',
      advertising: 'REKLĀMA: Mēs NEIZMANTOJAM reklāmas sīkdatnes. Mēs NERĀDĀM reklāmas.',
      thirdParty: 'TREŠĀS PUSES: Stripe saglabā sīkdatnes tikai drošai maksājumu apstrādei.',
      s3Title: '3. Sīkdatņu pārvaldība',
      s3: 'Jūs varat dzēst sīkdatnes pārlūka iestatījumos. Būtisko sīkdatņu atspējošana traucēs lietotnes darbību.',
    },
  };

  const c = content[language] || content.en;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>
          <ArrowLeft className="w-4 h-4" />{t.common.back}
        </button>

        <div className="text-center mb-12">
          <h1 className="font-tyana text-2xl mb-2" style={{ color: '#7C3AED' }}>TYANA</h1>
          <h2 className="text-2xl font-bold text-foreground">{c.title}</h2>
          <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>{c.lastUpdated}</p>
        </div>

        <Section title={c.s1Title}><p>{c.s1}</p></Section>

        <Section title={c.s2Title}>
          <p className="font-semibold">{c.essential}</p>
          <ul className="list-disc pl-5 space-y-1">{c.essentialItems.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
          <p className="italic">{c.essentialNote}</p>
          <p className="mt-3">{c.analytics}</p>
          <p>{c.advertising}</p>
          <p>{c.thirdParty}</p>
        </Section>

        <Section title={c.s3Title}><p>{c.s3}</p></Section>
      </div>
    </div>
  );
};

export default CookiesPage;
