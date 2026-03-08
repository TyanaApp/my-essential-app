import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStreak, BADGE_DEFINITIONS } from '@/hooks/useStreak';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';

const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStreakData } = useStreak();
  const { t, language } = useTranslation();
  const streakT = (t as any).streak || {};
  usePageTitle(streakT.achievements || 'Achievements');

  const [data, setData] = useState<{
    streak_current: number;
    streak_longest: number;
    streak_badges: string[];
    bonus_scans: number;
  } | null>(null);

  useEffect(() => {
    getStreakData().then(d => d && setData(d));
  }, [user]);

  const badgeNames: Record<string, Record<string, string>> = {
    '🌱': { en: 'First Steps', ru: 'Первые шаги', lv: 'Pirmie soļi', uk: 'Перші кроки' },
    '🔥': { en: 'Week Unstoppable', ru: 'Неделя без остановок', lv: 'Nedēļa bez apstāšanās', uk: 'Тиждень без зупинок' },
    '⚡️': { en: 'Two Weeks', ru: 'Две недели', lv: 'Divas nedēļas', uk: 'Два тижні' },
    '👑': { en: 'Kitchen Master', ru: 'Мастер кухни', lv: 'Virtuves meistars', uk: 'Майстер кухні' },
    '🏆': { en: 'TYANA Legend', ru: 'Легенда TYANA', lv: 'TYANA leģenda', uk: 'Легенда TYANA' },
    '♻️': { en: 'Zero Waste', ru: 'Без отходов', lv: 'Nulles atkritumi', uk: 'Без відходів' },
    '🍽': { en: 'Home Chef', ru: 'Домашний шеф', lv: 'Mājas šefpavārs', uk: 'Домашній шеф' },
    '💰': { en: 'Economist', ru: 'Экономист', lv: 'Ekonomists', uk: 'Економіст' },
  };

  const badgeDescs: Record<string, Record<string, string>> = {
    '🌱': { en: '3 days streak', ru: '3 дня подряд', lv: '3 dienas pēc kārtas', uk: '3 дні поспіль' },
    '🔥': { en: '7 days streak', ru: '7 дней подряд', lv: '7 dienas pēc kārtas', uk: '7 днів поспіль' },
    '⚡️': { en: '14 days streak', ru: '14 дней подряд', lv: '14 dienas pēc kārtas', uk: '14 днів поспіль' },
    '👑': { en: '30 days streak', ru: '30 дней подряд', lv: '30 dienas pēc kārtas', uk: '30 днів поспіль' },
    '🏆': { en: '100 days streak', ru: '100 дней подряд', lv: '100 dienas pēc kārtas', uk: '100 днів поспіль' },
    '♻️': { en: '10 items used before expiry', ru: '10 продуктов использовано до срока', lv: '10 produkti izlietoti pirms termiņa', uk: '10 продуктів використано до терміну' },
    '🍽': { en: '50 meals logged', ru: '50 приёмов пищи записано', lv: '50 ēdienreizes ierakstītas', uk: '50 прийомів їжі записано' },
    '💰': { en: '€50 saved total', ru: '€50 сэкономлено всего', lv: '€50 ietaupīts kopā', uk: '€50 зекономлено загалом' },
  };

  const currentLabel = streakT.current || (language === 'ru' ? 'Текущая серия' : language === 'lv' ? 'Pašreizējā sērija' : language === 'uk' ? 'Поточна серія' : 'Current streak');
  const longestLabel = streakT.longest || (language === 'ru' ? 'Лучшая серия' : language === 'lv' ? 'Garākā sērija' : language === 'uk' ? 'Найдовша серія' : 'Longest streak');
  const bonusLabel = language === 'ru' ? 'У тебя' : language === 'lv' ? 'Tev ir' : language === 'uk' ? 'У тебе' : 'You have';
  const bonusSuffix = language === 'ru' ? 'бонусных сканирований' : language === 'lv' ? 'bonusa skenēšanas' : language === 'uk' ? 'бонусних сканувань' : 'bonus scans';
  const badgesTitle = language === 'ru' ? 'Значки' : language === 'lv' ? 'Nozīmītes' : language === 'uk' ? 'Значки' : 'Badges';

  const cardClass = "bg-card rounded-[20px] shadow-[0_2px_16px_rgba(124,58,237,0.08)]";

  if (!data) return (
    <div className="min-h-screen p-6 flex justify-center items-center">
      <div className="w-7 h-7 border-[3px] rounded-full animate-spin border-accent border-t-primary" />
    </div>
  );

  return (
    <div className="min-h-screen p-6 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium mb-5 text-primary">
        <ArrowLeft className="w-4 h-4" /> {(t.common as any).back || 'Back'}
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6 text-foreground">
          {streakT.achievements || 'Achievements'}
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`${cardClass} p-4 text-center`}>
            <span className="text-3xl">🔥</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{data.streak_current}</p>
            <p className="text-xs text-muted-foreground">{currentLabel}</p>
          </div>
          <div className={`${cardClass} p-4 text-center`}>
            <span className="text-3xl">⚡️</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{data.streak_longest}</p>
            <p className="text-xs text-muted-foreground">{longestLabel}</p>
          </div>
        </div>

        {/* Bonus scans */}
        {data.bonus_scans > 0 && (
          <div className={`${cardClass} p-4 mb-6 flex items-center gap-3`}>
            <span className="text-2xl">🎁</span>
            <p className="text-sm font-medium text-foreground">
              {bonusLabel} <span className="font-bold text-primary">{data.bonus_scans}</span> {bonusSuffix}
            </p>
          </div>
        )}

        {/* Badges grid */}
        <div className={`${cardClass} p-5`}>
          <h3 className="text-sm font-bold mb-4 text-foreground">
            {badgesTitle}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {BADGE_DEFINITIONS.map(b => {
              const earned = data.streak_badges.includes(b.emoji);
              return (
                <div
                  key={b.key}
                  className={`flex items-center gap-3 p-3 rounded-xl ${earned ? 'bg-secondary' : 'bg-muted/50'}`}
                  style={{ opacity: earned ? 1 : 0.5 }}
                >
                  <span style={{ fontSize: 28, filter: earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {badgeNames[b.emoji]?.[language] || badgeNames[b.emoji]?.en || b.key}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {badgeDescs[b.emoji]?.[language] || badgeDescs[b.emoji]?.en || ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Achievements;
