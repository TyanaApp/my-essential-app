import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { LucideIcon, Trash2 } from 'lucide-react';

interface TimelineCardProps {
  id?: string;
  title: string;
  date: string;
  type: 'trigger' | 'goal';
  status: string;
  icon: LucideIcon;
  side: 'left' | 'right';
  index: number;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

const TimelineCard = ({ id, title, date, type, status, icon: Icon, side, index, onClick, onDelete }: TimelineCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, side === 'left' ? [-100, -50] : [50, 100], [0, 1]);
  const cardOpacity = useTransform(x, side === 'left' ? [-150, 0] : [0, 150], side === 'left' ? [0.5, 1] : [1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    const offset = info.offset.x;

    // Left cards swipe left to delete, right cards swipe right to delete
    if ((side === 'left' && offset < -threshold) || (side === 'right' && offset > threshold)) {
      if (id && onDelete) {
        onDelete(id);
      }
    }
  };

  const canSwipeDelete = !!id && !!onDelete;

  return (
    <div className={`relative ${side === 'right' ? 'ml-auto' : 'mr-auto'}`}>
      {/* Delete indicator behind the card */}
      {canSwipeDelete && (
        <motion.div
          className={`absolute inset-0 flex items-center ${side === 'left' ? 'justify-start pl-2' : 'justify-end pr-2'}`}
          style={{ opacity: deleteOpacity }}
        >
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
        </motion.div>
      )}

      <motion.div
        className="cursor-pointer relative"
        initial={{ opacity: 0, x: side === 'left' ? -30 : 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        style={{ x, opacity: cardOpacity }}
        drag={canSwipeDelete ? 'x' : false}
        dragConstraints={{ left: side === 'left' ? -150 : 0, right: side === 'left' ? 0 : 150 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={() => !isDragging && onClick?.()}
        whileHover={!isDragging ? { scale: 1.05 } : {}}
        whileTap={!isDragging ? { scale: 0.98 } : {}}
      >
        {/* Card - Light/White style matching reference */}
        <div 
          className="relative p-4 rounded-2xl shadow-lg w-[130px] transition-shadow hover:shadow-xl"
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
    </div>
  );
};

export default TimelineCard;
