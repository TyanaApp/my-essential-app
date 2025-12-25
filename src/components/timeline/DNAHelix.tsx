import React from 'react';
import { motion } from 'framer-motion';

const DNAHelix = () => {
  const helixPoints = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="absolute left-1/2 -translate-x-1/2 h-full w-16 flex flex-col items-center justify-start pt-8 pb-32">
      {/* Main helix glow line */}
      <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-bio-cyan/20 via-bio-purple/40 to-bio-cyan/20 blur-sm" />
      
      {/* DNA strand animation */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 64 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="helixGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--bio-cyan))" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(var(--bio-purple))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--bio-cyan))" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="helixGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--bio-purple))" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(var(--bio-cyan))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--bio-purple))" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Animated helix strands */}
        <motion.path
          d="M32,0 Q48,40 32,80 Q16,120 32,160 Q48,200 32,240 Q16,280 32,320 Q48,360 32,400 Q16,440 32,480 Q48,520 32,560 Q16,600 32,640 Q48,680 32,720 Q16,760 32,800"
          fill="none"
          stroke="url(#helixGradient1)"
          strokeWidth="2"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <motion.path
          d="M32,0 Q16,40 32,80 Q48,120 32,160 Q16,200 32,240 Q48,280 32,320 Q16,360 32,400 Q48,440 32,480 Q16,520 32,560 Q48,600 32,640 Q16,680 32,720 Q48,760 32,800"
          fill="none"
          stroke="url(#helixGradient2)"
          strokeWidth="2"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
        />
        
        {/* Cross bars */}
        {helixPoints.map((i) => (
          <motion.line
            key={i}
            x1="20"
            y1={i * 40 + 20}
            x2="44"
            y2={i * 40 + 20}
            stroke="hsl(var(--bio-cyan))"
            strokeWidth="1.5"
            opacity="0.4"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          />
        ))}
      </svg>

      {/* Glowing nodes at connection points */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-bio-cyan shadow-[0_0_10px_hsl(var(--bio-cyan)),0_0_20px_hsl(var(--bio-cyan))]"
          style={{ top: `${15 + i * 14}%` }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default DNAHelix;
