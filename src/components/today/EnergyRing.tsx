import React from 'react';
import { motion } from 'framer-motion';

interface EnergyRingProps {
  value: number; // 0-10
  maxValue?: number;
  size?: number;
  label?: string;
}

const EnergyRing: React.FC<EnergyRingProps> = ({
  value,
  maxValue = 10,
  size = 180,
  label = 'Energy',
}) => {
  const percentage = (value / maxValue) * 100;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  // Color based on value
  const getGradientColors = () => {
    if (value <= 3) return { start: '#ff006a', end: '#ff4d94' }; // Magenta - low
    if (value <= 6) return { start: '#ffd700', end: '#ffed4a' }; // Golden - medium
    return { start: '#00ffff', end: '#00ff9f' }; // Cyan - high
  };

  const colors = getGradientColors();

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow */}
      <div 
        className="absolute rounded-full opacity-30 blur-xl"
        style={{
          width: size + 40,
          height: size + 40,
          background: `radial-gradient(circle, ${colors.start}40, transparent 70%)`,
        }}
      />
      
      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface"
          opacity={0.3}
        />
        
        {/* Animated progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#energyGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          filter="url(#glow)"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-5xl font-orbitron font-bold"
          style={{ 
            background: `linear-gradient(135deg, ${colors.start}, ${colors.end})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 30px ${colors.start}60`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {value}
        </motion.span>
        <span className="text-xs font-exo text-muted-foreground mt-1 tracking-widest uppercase">
          {label}
        </span>
      </div>
    </div>
  );
};

export default EnergyRing;
