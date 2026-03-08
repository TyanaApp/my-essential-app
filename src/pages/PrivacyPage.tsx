import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import TyanaLogo from '@/components/TyanaLogo';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2
      style={{ borderLeft: '4px solid #7C3AED' }}
      className="text-lg font-bold mb-4 pl-4 text-foreground"
    >
      {title}
    </h2>
    <div className="text-base leading-[1.8] space-y-3 text-foreground/80">
      {children}
    </div>
  </div>
);

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const titles: Record<string, string> = {
    en: 'Privacy Policy',
    ru: 'Политика конфиденциальности',
    uk: 'Політика конфіденційності',
    lv: 'Privātuma politika',
  };

  const content: Record<string, any> = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: March 2026',
      s1Title: '1. Who we are',
      s1: 'TYANA is an AI-powered kitchen and nutrition assistant. tyana.lovable.app. EU jurisdiction, Latvia.',
      s2Title: '2. What data we collect',
      s2Items: [
        'Account: name, email, profile photo (Google OAuth)',
        'Health metrics: weight, height, age, gender, activity level',
        'Nutrition goals, diet type, allergies, disliked foods',
        'Food diary: meals, calories, macros',
        'Inventory: fridge/pantry/freezer items with expiry dates',
        'Recipes: generated and saved',
        'Shopping: lists, budget, purchases',
        'Photos: fridge and meal photos sent to OpenAI for AI analysis — NOT stored on our servers',
        'Technical: browser language, timezone, browser type',
        'We do NOT use tracking or advertising cookies',
      ],
      s3Title: '3. How we use your data',
      s3Items: [
        'Personalize recipes and nutrition advice',
        'Calculate calorie and macro targets',
        'Track food expiry and send notifications (with consent)',
        'Improve AI recommendations',
        'We NEVER sell your data to third parties',
      ],
      s4Title: '4. Third parties',
      s4Items: [
        'Supabase: EU servers, SOC2 certified, encrypted database',
        'OpenAI: receives fridge/meal photos and recipe requests only. Does NOT receive name, email, or payment data. Policy: openai.com/privacy',
        'Stripe: payment processing. We never see or store card data. PCI DSS Level 1 certified.',
        'Google: OAuth login only. We receive name and email only.',
      ],
      s5Title: '5. Your GDPR rights',
      s5Items: [
        '✅ Access — request copy of all your data',
        '✅ Deletion — delete account and all data',
        '✅ Correction — fix inaccurate data',
        '✅ Export — download all data as JSON',
        '✅ Objection — opt out of processing',
        '✅ Complaint — contact EU supervisory authority',
      ],
      s5Note: 'Response within 30 days.',
      s6Title: '6. Data retention',
      s6Items: [
        'Account data: until account deletion',
        'Fridge/meal photos: processed in real-time, NEVER stored',
        'Food diary: until account deletion',
        'After deletion: all data removed within 30 days',
      ],
      s7Title: '7. Security',
      s7Items: [
        'HTTPS encryption in transit',
        'AES-256 encryption at rest',
        'Passwords never stored (managed by auth provider)',
        'Regular security reviews',
      ],
      s8Title: '8. Children',
      s8: 'Service not intended for users under 16. We do not knowingly collect children\'s data.',
      s9Title: '9. Policy changes',
      s9: 'Material changes notified by email. Continued use constitutes acceptance of the new policy.',
    },
    ru: {
      title: 'Политика конфиденциальности',
      lastUpdated: 'Последнее обновление: март 2026',
      s1Title: '1. Кто мы',
      s1: 'TYANA — ИИ-помощник для кухни и питания. tyana.lovable.app. Юрисдикция ЕС, Латвия.',
      s2Title: '2. Какие данные мы собираем',
      s2Items: [
        'Аккаунт: имя, email, фото профиля (Google OAuth)',
        'Метрики здоровья: вес, рост, возраст, пол, уровень активности',
        'Цели питания, тип диеты, аллергии, нелюбимые продукты',
        'Дневник питания: приёмы пищи, калории, макронутриенты',
        'Инвентарь: продукты в холодильнике/кладовой/морозилке со сроками годности',
        'Рецепты: сгенерированные и сохранённые',
        'Покупки: списки, бюджет, покупки',
        'Фотографии: фото холодильника и еды отправляются в OpenAI для анализа — НЕ хранятся на наших серверах',
        'Технические: язык браузера, часовой пояс, тип браузера',
        'Мы НЕ используем рекламные или отслеживающие cookie',
      ],
      s3Title: '3. Как мы используем ваши данные',
      s3Items: [
        'Персонализация рецептов и советов по питанию',
        'Расчёт калорий и макронутриентов',
        'Отслеживание сроков годности и уведомления (с согласия)',
        'Улучшение ИИ-рекомендаций',
        'Мы НИКОГДА не продаём ваши данные третьим лицам',
      ],
      s4Title: '4. Третьи стороны',
      s4Items: [
        'Supabase: серверы в ЕС, сертификация SOC2, шифрованная база данных',
        'OpenAI: получает только фото и запросы рецептов. НЕ получает имя, email или платёжные данные',
        'Stripe: обработка платежей. Мы не видим и не храним данные карт. PCI DSS Level 1',
        'Google: только OAuth-вход. Мы получаем только имя и email',
      ],
      s5Title: '5. Ваши права по GDPR',
      s5Items: [
        '✅ Доступ — запросить копию всех данных',
        '✅ Удаление — удалить аккаунт и все данные',
        '✅ Исправление — исправить неточные данные',
        '✅ Экспорт — скачать все данные в JSON',
        '✅ Возражение — отказаться от обработки',
        '✅ Жалоба — обратиться в надзорный орган ЕС',
      ],
      s5Note: 'Ответ в течение 30 дней.',
      s6Title: '6. Хранение данных',
      s6Items: [
        'Данные аккаунта: до удаления аккаунта',
        'Фото холодильника/еды: обрабатываются в реальном времени, НИКОГДА не хранятся',
        'Дневник питания: до удаления аккаунта',
        'После удаления: все данные удаляются в течение 30 дней',
      ],
      s7Title: '7. Безопасность',
      s7Items: [
        'HTTPS шифрование при передаче',
        'AES-256 шифрование в покое',
        'Пароли не хранятся (управляются провайдером авторизации)',
        'Регулярные проверки безопасности',
      ],
      s8Title: '8. Дети',
      s8: 'Сервис не предназначен для пользователей младше 16 лет. Мы не собираем данные детей.',
      s9Title: '9. Изменения политики',
      s9: 'О существенных изменениях уведомляем по email. Продолжение использования означает принятие новой политики.',
    },
    uk: {
      title: 'Політика конфіденційності',
      lastUpdated: 'Останнє оновлення: березень 2026',
      s1Title: '1. Хто ми',
      s1: 'TYANA — ШІ-помічник для кухні та харчування. tyana.lovable.app. Юрисдикція ЄС, Латвія.',
      s2Title: '2. Які дані ми збираємо',
      s2Items: [
        'Акаунт: ім\'я, email, фото профілю (Google OAuth)',
        'Метрики здоров\'я: вага, зріст, вік, стать, рівень активності',
        'Цілі харчування, тип дієти, алергії, нелюбимі продукти',
        'Щоденник харчування: прийоми їжі, калорії, макронутрієнти',
        'Інвентар: продукти в холодильнику/коморі/морозилці з термінами придатності',
        'Рецепти: згенеровані та збережені',
        'Покупки: списки, бюджет, покупки',
        'Фотографії: фото холодильника та їжі надсилаються в OpenAI для аналізу — НЕ зберігаються на наших серверах',
        'Технічні: мова браузера, часовий пояс, тип браузера',
        'Ми НЕ використовуємо рекламні або відстежувальні cookie',
      ],
      s3Title: '3. Як ми використовуємо ваші дані',
      s3Items: [
        'Персоналізація рецептів та порад щодо харчування',
        'Розрахунок калорій та макронутрієнтів',
        'Відстеження термінів придатності та сповіщення (за згодою)',
        'Покращення ШІ-рекомендацій',
        'Ми НІКОЛИ не продаємо ваші дані третім особам',
      ],
      s4Title: '4. Треті сторони',
      s4Items: [
        'Supabase: сервери в ЄС, сертифікація SOC2, зашифрована база даних',
        'OpenAI: отримує лише фото та запити рецептів. НЕ отримує ім\'я, email чи платіжні дані',
        'Stripe: обробка платежів. Ми не бачимо і не зберігаємо дані карт. PCI DSS Level 1',
        'Google: лише OAuth-вхід. Ми отримуємо лише ім\'я та email',
      ],
      s5Title: '5. Ваші права за GDPR',
      s5Items: [
        '✅ Доступ — запросити копію всіх даних',
        '✅ Видалення — видалити акаунт і всі дані',
        '✅ Виправлення — виправити неточні дані',
        '✅ Експорт — завантажити всі дані у JSON',
        '✅ Заперечення — відмовитися від обробки',
        '✅ Скарга — звернутися до наглядового органу ЄС',
      ],
      s5Note: 'Відповідь протягом 30 днів.',
      s6Title: '6. Зберігання даних',
      s6Items: [
        'Дані акаунту: до видалення акаунту',
        'Фото холодильника/їжі: обробляються в реальному часі, НІКОЛИ не зберігаються',
        'Щоденник харчування: до видалення акаунту',
        'Після видалення: всі дані видаляються протягом 30 днів',
      ],
      s7Title: '7. Безпека',
      s7Items: [
        'HTTPS шифрування при передачі',
        'AES-256 шифрування в стані спокою',
        'Паролі не зберігаються (керуються провайдером авторизації)',
        'Регулярні перевірки безпеки',
      ],
      s8Title: '8. Діти',
      s8: 'Сервіс не призначений для користувачів молодше 16 років. Ми не збираємо дані дітей.',
      s9Title: '9. Зміни політики',
      s9: 'Про суттєві зміни повідомляємо по email. Продовження використання означає прийняття нової політики.',
    },
    lv: {
      title: 'Privātuma politika',
      lastUpdated: 'Pēdējoreiz atjaunināts: 2026. gada marts',
      s1Title: '1. Kas mēs esam',
      s1: 'TYANA ir AI virtuves un uztura palīgs. Kontakts: supporttyana@gmail.com | tyana.lovable.app. ES jurisdikcija, Latvija.',
      s2Title: '2. Kādus datus mēs vācam',
      s2Items: [
        'Konts: vārds, e-pasts, profila foto (Google OAuth)',
        'Veselības metrika: svars, augums, vecums, dzimums, aktivitātes līmenis',
        'Uztura mērķi, diētas tips, alerģijas, nepatīkamie produkti',
        'Uztura dienasgrāmata: maltītes, kalorijas, makronutrienti',
        'Inventārs: produkti ledusskapī/pieliekamajā/saldētavā ar derīguma termiņiem',
        'Receptes: ģenerētas un saglabātas',
        'Pirkumi: saraksti, budžets, pirkumi',
        'Fotoattēli: ledusskapja un ēdiena fotoattēli tiek nosūtīti OpenAI analīzei — NETIEK glabāti mūsu serveros',
        'Tehniskie: pārlūka valoda, laika josla, pārlūka tips',
        'Mēs NEIZMANTOJAM reklāmas vai izsekošanas sīkdatnes',
      ],
      s3Title: '3. Kā mēs izmantojam jūsu datus',
      s3Items: [
        'Recepšu un uztura padomu personalizēšana',
        'Kaloriju un makronutrientu aprēķins',
        'Derīguma termiņu izsekošana un paziņojumi (ar piekrišanu)',
        'AI ieteikumu uzlabošana',
        'Mēs NEKAD nepārdodam jūsu datus trešajām pusēm',
      ],
      s4Title: '4. Trešās puses',
      s4Items: [
        'Supabase: ES serveri, SOC2 sertifikāts, šifrēta datubāze',
        'OpenAI: saņem tikai fotoattēlus un recepšu pieprasījumus. NESAŅEM vārdu, e-pastu vai maksājumu datus',
        'Stripe: maksājumu apstrāde. Mēs neredzam un neglabājam kartes datus. PCI DSS Level 1',
        'Google: tikai OAuth pieteikšanās. Mēs saņemam tikai vārdu un e-pastu',
      ],
      s5Title: '5. Jūsu GDPR tiesības',
      s5Items: [
        '✅ Piekļuve — pieprasīt visu datu kopiju',
        '✅ Dzēšana — dzēst kontu un visus datus',
        '✅ Labošana — labot neprecīzus datus',
        '✅ Eksports — lejupielādēt visus datus JSON formātā',
        '✅ Iebildums — atteikties no apstrādes',
        '✅ Sūdzība — sazināties ar ES uzraudzības iestādi',
      ],
      s5Note: 'Visi pieprasījumi: supporttyana@gmail.com | Atbilde 30 dienu laikā.',
      s6Title: '6. Datu glabāšana',
      s6Items: [
        'Konta dati: līdz konta dzēšanai',
        'Ledusskapja/ēdiena fotoattēli: apstrādāti reāllaikā, NEKAD netiek glabāti',
        'Uztura dienasgrāmata: līdz konta dzēšanai',
        'Pēc dzēšanas: visi dati tiek noņemti 30 dienu laikā',
      ],
      s7Title: '7. Drošība',
      s7Items: [
        'HTTPS šifrēšana pārsūtīšanas laikā',
        'AES-256 šifrēšana miera stāvoklī',
        'Paroles netiek glabātas (pārvalda autorizācijas pakalpojums)',
        'Regulāras drošības pārbaudes',
      ],
      s8Title: '8. Bērni',
      s8: 'Pakalpojums nav paredzēts lietotājiem, kas jaunāki par 16 gadiem. Mēs apzināti nevācam bērnu datus.',
      s9Title: '9. Politikas izmaiņas',
      s9: 'Par būtiskām izmaiņām paziņojam pa e-pastu. Turpināta lietošana nozīmē jauno noteikumu pieņemšanu.',
    },
  };

  const c = content[language] || content.en;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
          style={{ color: '#6B7280' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </button>

        <div className="text-center mb-12">
          <TyanaLogo size="lg" className="mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-foreground">{c.title}</h2>
          <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>{c.lastUpdated}</p>
        </div>

        <Section title={c.s1Title}><p>{c.s1}</p></Section>

        <Section title={c.s2Title}>
          <ul className="list-disc pl-5 space-y-1">{c.s2Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s3Title}>
          <ul className="list-disc pl-5 space-y-1">{c.s3Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s4Title}>
          <ul className="list-disc pl-5 space-y-1">{c.s4Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s5Title}>
          <ul className="space-y-1">{c.s5Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
          <p className="mt-3 font-medium">{c.s5Note}</p>
        </Section>

        <Section title={c.s6Title}>
          <ul className="list-disc pl-5 space-y-1">{c.s6Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s7Title}>
          <ul className="list-disc pl-5 space-y-1">{c.s7Items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={c.s8Title}><p>{c.s8}</p></Section>
        <Section title={c.s9Title}><p>{c.s9}</p></Section>
      </div>
    </div>
  );
};

export default PrivacyPage;
