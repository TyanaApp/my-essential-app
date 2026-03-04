import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

const Savings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 pb-24">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm font-medium mb-5"
        style={{ color: '#7C3AED' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>Savings</h1>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>Track your monthly food savings</p>

        <div
          className="text-center py-16 rounded-2xl"
          style={{ backgroundColor: '#F5F3FF', border: '1px dashed #DDD6FE' }}
        >
          <div className="text-5xl mb-4">💰</div>
          <p className="text-base font-medium mb-1" style={{ color: '#1E1B4B' }}>Coming soon</p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Detailed savings reports and insights are on the way!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Savings;
