import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface InsightRecalculatingProps {
  isVisible: boolean;
  message?: string;
}

const InsightRecalculating: React.FC<InsightRecalculatingProps> = ({
  isVisible,
  message = 'Обновляем инсайты...',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-28 left-4 right-4 z-30"
        >
          <div className="flex items-center justify-center gap-3 py-3 px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mx-auto w-fit">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-4 h-4 text-violet-400" />
            </motion.div>
            <span className="text-white text-sm">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InsightRecalculating;
