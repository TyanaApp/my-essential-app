import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MultifactorBadgeProps {
  overlappingEvents: string[];
}

const MultifactorBadge: React.FC<MultifactorBadgeProps> = ({
  overlappingEvents,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 cursor-help"
          >
            <Layers className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium">
              {overlappingEvents.length} факторов
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-gray-900 border border-white/10 p-3 max-w-[200px]"
        >
          <p className="text-white text-xs font-medium mb-2">Совпадающие события:</p>
          <ul className="space-y-1">
            {overlappingEvents.map((event, index) => (
              <li key={index} className="text-gray-400 text-xs flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {event}
              </li>
            ))}
          </ul>
          <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-white/10">
            Несколько факторов могут влиять одновременно
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MultifactorBadge;
