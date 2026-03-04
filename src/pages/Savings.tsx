import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/hooks/useTranslation';

const Savings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t.savings.title);

  return (
    <div className="min-h-screen p-6 pb-24">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm font-medium mb-5"
        style={{ color: '#7C3AED' }}
      >
        <ArrowLeft className="w-4 h-4" /> {t.savings.backToDashboard}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>{t.savings.title}</h1>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>{t.savings.subtitle}</p>

        <div
          className="text-center py-16 rounded-2xl"
          style={{ backgroundColor: '#F5F3FF', border: '1px dashed #DDD6FE' }}
        >
          <div className="text-5xl mb-4">💰</div>
          <p className="text-base font-medium mb-1" style={{ color: '#1E1B4B' }}>{t.savings.comingSoon}</p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            {t.savings.comingSoonDesc}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Savings;
