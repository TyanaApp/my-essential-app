import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

interface RewardModalProps {
  open: boolean;
  onClose: () => void;
  badge: string;
  streakDays: number;
  bonusScans?: number;
  grantLite?: boolean;
  grantPro?: boolean;
}

const RewardModal: React.FC<RewardModalProps> = ({ open, onClose, badge, streakDays, bonusScans, grantLite, grantPro }) => {
  const { t, language } = useTranslation();
  const [confetti, setConfetti] = useState<{ x: number; y: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    if (open) {
      const particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 0.5,
      }));
      setConfetti(particles);
    }
  }, [open]);

  const getRewardText = () => {
    if (bonusScans) {
      return language === 'ru' ? `+${bonusScans} бонусных сканирований!` :
             language === 'lv' ? `+${bonusScans} bonusa skenēšanas!` :
             `+${bonusScans} bonus scans added!`;
    }
    if (grantLite) {
      return language === 'ru' ? 'Месяц Lite бесплатно!' :
             language === 'lv' ? 'Mēnesis Lite bez maksas!' :
             '1 month Lite free!';
    }
    if (grantPro) {
      return language === 'ru' ? 'Месяц Pro в подарок!' :
             language === 'lv' ? 'Mēnesis Pro dāvanā!' :
             '1 month Pro free!';
    }
    return '';
  };

  const streakLabel = language === 'ru' ? 'дней подряд!' :
                      language === 'lv' ? 'dienas pēc kārtas!' :
                      'days in a row!';

  const congratsLabel = language === 'ru' ? 'Поздравляем!' :
                        language === 'lv' ? 'Apsveicam!' :
                        'Congratulations!';

  const claimLabel = (t as any).streak?.claimReward ||
                     (language === 'ru' ? 'Забрать награду ✓' :
                      language === 'lv' ? 'Saņemt balvu ✓' :
                      'Claim reward ✓');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #C084FC 0%, #A855F7 40%, #7C3AED 70%, #EC4899 100%)' }}
        >
          {/* Confetti */}
          {confetti.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color, left: `${p.x}%`, top: `${p.y}%` }}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0.5], y: [0, -60, -30, 80] }}
              transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="flex flex-col items-center text-center px-8"
          >
            <motion.span
              style={{ fontSize: 80 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {badge}
            </motion.span>

            <h1 className="text-white text-2xl font-bold mt-4">{congratsLabel}</h1>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-3xl">🔥</span>
              <span className="text-white text-4xl font-bold">{streakDays}</span>
              <span className="text-white text-lg opacity-90">{streakLabel}</span>
            </div>

            {getRewardText() && (
              <p className="text-white text-lg mt-3 opacity-90">{getRewardText()}</p>
            )}

            <motion.button
              onClick={onClose}
              className="mt-8 px-8 py-3 rounded-2xl bg-white text-[#7C3AED] font-bold text-base"
              whileTap={{ scale: 0.95 }}
            >
              {claimLabel}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardModal;
