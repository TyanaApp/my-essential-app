import React from 'react';
import { motion } from 'framer-motion';

interface SegmentedControlProps {
  segments: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  activeIndex,
  onChange,
}) => {
  return (
    <div className="relative flex p-1 rounded-[24px] bg-surface/50 backdrop-blur-xl border border-bio-cyan/20">
      {/* Glowing background indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-[20px] bg-gradient-to-r from-bio-cyan/30 to-bio-magenta/30 backdrop-blur-sm border border-bio-cyan/40 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
        initial={false}
        animate={{
          left: `calc(${(activeIndex / segments.length) * 100}% + 4px)`,
          width: `calc(${100 / segments.length}% - 8px)`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      
      {segments.map((segment, index) => (
        <button
          key={segment}
          onClick={() => onChange(index)}
          className={`relative z-10 flex-1 py-2 px-3 text-sm font-orbitron font-medium transition-colors duration-200 ${
            activeIndex === index
              ? 'text-bio-cyan'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {segment}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
