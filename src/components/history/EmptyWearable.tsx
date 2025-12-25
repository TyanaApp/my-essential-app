import React from 'react';
import { motion } from 'framer-motion';
import { Watch, Link } from 'lucide-react';

interface EmptyWearableProps {
  onConnect: () => void;
}

const EmptyWearable: React.FC<EmptyWearableProps> = ({ onConnect }) => {
  return (
    <motion.div
      className="mx-4 mb-4 p-4 rounded-2xl bg-card border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
          <Watch className="w-5 h-5 text-info" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Подключи Apple Health / Google Fit, чтобы видеть влияние событий на сон и пульс
          </p>
        </div>
        
        <button
          onClick={onConnect}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/80 transition-colors"
        >
          <Link className="w-3 h-3" />
          Подключить
        </button>
      </div>
    </motion.div>
  );
};

export default EmptyWearable;
