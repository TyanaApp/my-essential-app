import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TimelineCardProps {
  title: string;
  date: string;
  type: 'trigger' | 'goal';
  status: string;
  icon: LucideIcon;
  side: 'left' | 'right';
  index: number;
}

const TimelineCard = ({ title, date, type, status, icon: Icon, side, index }: TimelineCardProps) => {
  return (
    <motion.div
      className={`${side === 'right' ? 'ml-auto' : 'mr-auto'}`}
      initial={{ opacity: 0, x: side === 'left' ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Card - Light/White style matching reference */}
      <div 
        className="relative p-4 rounded-2xl shadow-lg w-[130px]"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F6F4 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex flex-col items-center text-center gap-0.5">
          {/* Icon */}
          <div className="w-8 h-8 flex items-center justify-center mb-1">
            <Icon className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{title}</h3>
          
          {/* Type */}
          <span className="text-xs text-gray-500">{type}</span>
          
          {/* Date - Large */}
          <span className="text-2xl font-bold text-gray-900 mt-1">{date}</span>
          
          {/* Status */}
          <span className="text-xs text-gray-500">{status}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TimelineCard;
