import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-lg font-bold mb-4 pl-4" style={{ borderLeft: '4px solid #7C3AED', color: '#1E1B4B' }}>{title}</h2>
    <div className="text-base leading-[1.8] space-y-3" style={{ color: '#374151' }}>{children}</div>
  </div>
);

const TermsPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const content: Record<string, any> = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: March 2026',
      s1Title: '1. Acceptance',
      s1: 'By using TYANA you agree to these terms. If you do not agree, please do not use the service.',
      s2Title: '2. Service description',
      s2: 'TYANA is a personal AI assistant for:',
      s2Items: ['Kitchen inventory management', 'AI recipe generation from available ingredients', 'Nutrition and calorie tracking', 'Shopping list and budget planning'],
      s3Title: '3. ⚠️ Important Health Disclaimer',
      s3: 'TYANA provides nutritional information for EDUCATIONAL PURPOSES ONLY. This is NOT: medical advice, dietitian prescription, or a substitute for professional consultation. Calorie and nutrient estimates are approximate. AI may make errors. Always consult a doctor or certified dietitian before making significant dietary changes, especially if you have health conditions. TYANA is not liable for health outcomes from following app recommendations.',
      s4Title: '4. Subscriptions and payment',
      s4Items: [
        'Free plan: basic features, no time limit',
        'Lite €5.99/month: 15 scans/month, AI recipes, basic tracking',
        'Pro Founder €6.49/month: first 1000 users only, price locked forever, unlimited',
        'Pro €12.99/month: users after first 1000, unlimited',
        '7-day trial: free for all new users, no card required, auto-switches to Free after',
        'Refunds: contact supporttyana@gmail.com within 7 days of payment',
      ],
      s5Title: '5. Prohibited use',
      s5Items: ['Automated data scraping', 'Sharing account credentials', 'Commercial use without permission', 'Attempting to breach security'],
      s6Title: '6. Limitation of liability',
      s6Items: ['Inaccurate AI calorie estimates', 'Food safety decisions based on app data', 'Data loss due to technical issues', 'Health consequences from following recommendations'],
      s6Prefix: 'TYANA is not liable for:',
      s7Title: '7. Account deletion',
      s7: 'User can delete account anytime in Profile → Settings. All data deleted within 30 days.',
      s8Title: '8. Governing law',
      s8: 'European Union law and Republic of Latvia.',
    },
    ru: {
      title: 'Условия использования',
      lastUpdated: 'Последнее обновление: март 2026',
      s1Title: '1. Принятие условий',
      s1: 'Используя TYANA, вы соглашаетесь с данными условиями. Если не согласны — пожалуйста, не пользуйтесь сервисом.',
      s2Title: '2. Описание сервиса',
      s2: 'TYANA — персональный ИИ-помощник для:',
      s2Items: ['Управления инвентарём на кухне', 'Генерации ИИ-рецептов из доступных ингредиентов', 'Отслеживания питания и калорий', 'Планирования списка покупок и бюджета'],
      s3Title: '3. ⚠️ Важный медицинский отказ от ответственности',
      s3: 'TYANA предоставляет информацию о питании ТОЛЬКО в образовательных целях. Это НЕ является: медицинской рекомендацией, назначением диетолога или заменой профессиональной консультации. Оценки калорий и нутриентов являются приблизительными. ИИ может допускать ошибки. Всегда консультируйтесь с врачом или сертифицированным диетологом перед значительными изменениями в питании. TYANA не несёт ответственности за последствия для здоровья.',
      s4Title: '4. Подписки и оплата',
      s4Items: [
        'Бесплатный план: базовые функции, без ограничения по времени',
        'Lite €5.99/мес: 15 сканирований/мес, ИИ-рецепты, базовый трекинг',
        'Pro Founder €6.49/мес: только первые 1000 пользователей, цена заблокирована навсегда',
        'Pro €12.99/мес: для пользователей после первой 1000, безлимит',
        '7-дневный пробный период: бесплатно, без карты, автоматически переключается на Free',
        'Возврат: свяжитесь с supporttyana@gmail.com в течение 7 дней после оплаты',
      ],
      s5Title: '5. Запрещённое использование',
      s5Items: ['Автоматический сбор данных', 'Передача учётных данных', 'Коммерческое использование без разрешения', 'Попытки нарушения безопасности'],
      s6Title: '6. Ограничение ответственности',
      s6Items: ['Неточные ИИ-оценки калорий', 'Решения по безопасности пищи на основе данных приложения', 'Потеря данных из-за технических проблем', 'Последствия для здоровья от следования рекомендациям'],
      s6Prefix: 'TYANA не несёт ответственности за:',
      s7Title: '7. Удаление аккаунта',
      s7: 'Пользователь может удалить аккаунт в любое время в Профиль → Настройки. Все данные удаляются в течение 30 дней.',
      s8Title: '8. Применимое право',
      s8: 'Законодательство Европейского Союза и Латвийской Республики.',
    },
    uk: {
      title: 'Умови використання',
      lastUpdated: 'Останнє оновлення: березень 2026',
      s1Title: '1. Прийняття умов',
      s1: 'Використовуючи TYANA, ви погоджуєтесь з цими умовами. Якщо не згодні — будь ласка, не користуйтесь сервісом.',
      s2Title: '2. Опис сервісу',
      s2: 'TYANA — персональний ШІ-помічник для:',
      s2Items: ['Управління інвентарем на кухні', 'Генерації ШІ-рецептів з наявних інгредієнтів', 'Відстеження харчування та калорій', 'Планування списку покупок та бюджету'],
      s3Title: '3. ⚠️ Важлива медична відмова від відповідальності',
      s3: 'TYANA надає інформацію про харчування ЛИШЕ в освітніх цілях. Це НЕ є: медичною рекомендацією, призначенням дієтолога або заміною професійної консультації. Оцінки калорій та нутрієнтів є приблизними. ШІ може допускати помилки. Завжди консультуйтесь з лікарем перед значними змінами в харчуванні. TYANA не несе відповідальності за наслідки для здоров\'я.',
      s4Title: '4. Підписки та оплата',
      s4Items: [
        'Безкоштовний план: базові функції, без обмеження за часом',
        'Lite €5.99/міс: 15 сканувань/міс, ШІ-рецепти, базовий трекінг',
        'Pro Founder €6.49/міс: лише перші 1000 користувачів, ціна заблокована назавжди',
        'Pro €12.99/міс: для користувачів після перших 1000, безліміт',
        '7-денний пробний період: безкоштовно, без карти, автоматично переключається на Free',
        'Повернення: зв\'яжіться з supporttyana@gmail.com протягом 7 днів після оплати',
      ],
      s5Title: '5. Заборонене використання',
      s5Items: ['Автоматичний збір даних', 'Передача облікових даних', 'Комерційне використання без дозволу', 'Спроби порушення безпеки'],
      s6Title: '6. Обмеження відповідальності',
      s6Items: ['Неточні ШІ-оцінки калорій', 'Рішення щодо безпеки їжі на основі даних додатку', 'Втрата даних через технічні проблеми', 'Наслідки для здоров\'я від дотримання рекомендацій'],
      s6Prefix: 'TYANA не несе відповідальності за:',
      s7Title: '7. Видалення акаунту',
      s7: 'Користувач може видалити акаунт у будь-який час у Профіль → Налаштування. Всі дані видаляються протягом 30 днів.',
      s8Title: '8. Застосовне право',
      s8: 'Законодавство Європейського Союзу та Латвійської Республіки.',
    },
    lv: {
      title: 'Lietošanas noteikumi',
      lastUpdated: 'Pēdējoreiz atjaunināts: 2026. gada marts',
      s1Title: '1. Pieņemšana',
      s1: 'Izmantojot TYANA, jūs piekrītat šiem noteikumiem. Ja nepiekrītat — lūdzu, neizmantojiet pakalpojumu.',
      s2Title: '2. Pakalpojuma apraksts',
      s2: 'TYANA ir personīgs AI palīgs:',
      s2Items: ['Virtuves inventāra pārvaldība', 'AI recepšu ģenerēšana no pieejamajiem produktiem', 'Uztura un kaloriju izsekošana', 'Pirkumu saraksta un budžeta plānošana'],
      s3Title: '3. ⚠️ Svarīgs veselības atruna',
      s3: 'TYANA sniedz uztura informāciju TIKAI izglītības nolūkos. Tas NAV: medicīnisks padoms, dietologa nozīmējums vai profesionālas konsultācijas aizstājējs. Kaloriju un uzturvielu novērtējumi ir aptuveni. AI var kļūdīties. Vienmēr konsultējieties ar ārstu pirms būtiskām uztura izmaiņām. TYANA nav atbildīga par veselības sekām.',
      s4Title: '4. Abonementi un maksājumi',
      s4Items: [
        'Bezmaksas plāns: pamata funkcijas, bez laika ierobežojuma',
        'Lite €5.99/mēn: 15 skenēšanas/mēn, AI receptes, pamata izsekošana',
        'Pro Founder €6.49/mēn: tikai pirmie 1000 lietotāji, cena fiksēta uz visiem laikiem',
        'Pro €12.99/mēn: lietotāji pēc pirmajiem 1000, neierobežoti',
        '7 dienu izmēģinājums: bezmaksas, bez kartes, automātiski pārslēdzas uz Free',
        'Atmaksa: sazinieties ar supporttyana@gmail.com 7 dienu laikā pēc maksājuma',
      ],
      s5Title: '5. Aizliegtā izmantošana',
      s5Items: ['Automatizēta datu vākšana', 'Konta datu kopīgošana', 'Komerciāla izmantošana bez atļaujas', 'Drošības pārkāpumu mēģinājumi'],
      s6Title: '6. Atbildības ierobežojumi',
      s6Items: ['Neprecīzi AI kaloriju novērtējumi', 'Pārtikas drošības lēmumi, balstoties uz lietotnes datiem', 'Datu zudums tehnisku problēmu dēļ', 'Veselības sekas no ieteikumu ievērošanas'],
      s6Prefix: 'TYANA nav atbildīga par:',
      s7Title: '7. Konta dzēšana',
      s7: 'Lietotājs var dzēst kontu jebkurā laikā Profils → Iestatījumi. Visi dati tiek dzēsti 30 dienu laikā.',
      s8Title: '8. Piemērojamie tiesību akti',
      s8: 'Eiropas Savienības un Latvijas Republikas tiesību akti.',
    },
  };

  const c = content[language] || content.en;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>
          <ArrowLeft className="w-4 h-4" />{t.common.back}
        </button>

        <div className="text-center mb-12">
          <h1 className="font-tyana text-2xl mb-2" style={{ color: '#7C3AED' }}>TYANA</h1>
          <h2 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>{c.title}</h2>
          <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>{c.lastUpdated}</p>
        </div>

        <Section title={c.s1Title}><p>{c.s1}</p></Section>

        <Section title={c.s2Title}>
          <p>{c.s2}</p>
          <ul className="list-disc pl-5 space-y-1">{c.s2Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s3Title}>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
            <p className="font-medium">{c.s3}</p>
          </div>
        </Section>

        <Section title={c.s4Title}>
          <ul className="list-disc pl-5 space-y-1">{c.s4Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s5Title}>
          <ul className="list-disc pl-5 space-y-1">{c.s5Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s6Title}>
          <p>{c.s6Prefix}</p>
          <ul className="list-disc pl-5 space-y-1">{c.s6Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s7Title}><p>{c.s7}</p></Section>
        <Section title={c.s8Title}><p>{c.s8}</p></Section>
      </div>
    </div>
  );
};

export default TermsPage;
