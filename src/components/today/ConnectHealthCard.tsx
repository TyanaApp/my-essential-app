import React from 'react';
import { motion } from 'framer-motion';
import { Watch, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConnectHealthCardProps {
  onConnect: () => void;
}

const ConnectHealthCard: React.FC<ConnectHealthCardProps> = ({ onConnect }) => {
  const { t } = useLanguage();

  return (
    <motion.button
      onClick={onConnect}
      className="w-full rounded-[24px] bg-surface/50 backdrop-blur-xl border border-bio-magenta/30 p-4 flex items-center gap-4 hover:border-bio-magenta/60 transition-all group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-12 h-12 rounded-full bg-bio-magenta/20 flex items-center justify-center">
        <Watch className="w-6 h-6 text-bio-magenta" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-nasa font-semibold text-foreground text-sm">
          {t('connectHealth')}
        </p>
        <p className="text-xs text-muted-foreground font-exo">
          {t('syncWearableData')}
        </p>
      </div>
      <ArrowRight className="w-5 h-5 text-bio-magenta group-hover:translate-x-1 transition-transform" />
    </motion.button>
  );
};

export default ConnectHealthCard;
