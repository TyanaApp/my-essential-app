import React from 'react';
import { motion } from 'framer-motion';
import { Watch, Link } from 'lucide-react';

interface EmptyWearableProps {
  onConnect: () => void;
}

const EmptyWearable: React.FC<EmptyWearableProps> = ({ onConnect }) => {
  return (
    <motion.div
      className="mx-3 mb-2 py-2 px-3 rounded-xl bg-card border border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2">
        <Watch className="w-4 h-4 text-info" />
        <p className="text-xs text-muted-foreground flex-1">
          Подключи Apple Health / Google Fit
        </p>
        <button
          onClick={onConnect}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"
        >
          <Link className="w-3 h-3" />
          Связать
        </button>
      </div>
    </motion.div>
  );
};

export default EmptyWearable;
