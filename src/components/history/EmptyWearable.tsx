import React from 'react';
import { motion } from 'framer-motion';
import { Watch, Link } from 'lucide-react';

interface EmptyWearableProps {
  onConnect: () => void;
}

const EmptyWearable: React.FC<EmptyWearableProps> = ({ onConnect }) => {
  return (
    <motion.div
      className="mx-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
          <Watch className="w-5 h-5 text-indigo-400" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-300">
            Подключи Apple Health / Google Fit, чтобы видеть влияние событий на сон и пульс
          </p>
        </div>
        
        <button
          onClick={onConnect}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bio-cyan/20 text-bio-cyan text-sm font-medium hover:bg-bio-cyan/30 transition-colors"
        >
          <Link className="w-3 h-3" />
          Подключить
        </button>
      </div>
    </motion.div>
  );
};

export default EmptyWearable;
