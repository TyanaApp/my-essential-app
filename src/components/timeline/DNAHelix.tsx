import React from 'react';
import { motion } from 'framer-motion';
import dnaHelixImage from '@/assets/dna-helix.png';

const DNAHelix = () => {
  // Node positions matching card rows
  const nodePositions = [17, 38, 59, 80];

  return (
    <div className="absolute left-1/2 -translate-x-1/2 h-full w-32 flex flex-col items-center">
      {/* DNA Helix Image */}
      <motion.img
        src={dnaHelixImage}
        alt="DNA Helix"
        className="absolute inset-0 w-full h-full object-contain opacity-95"
        style={{
          mixBlendMode: 'screen',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.95 }}
        transition={{ duration: 1 }}
      />
      
      {/* Center glowing line with nodes */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[15%] bottom-[15%] w-0.5 bg-gradient-to-b from-bio-cyan via-bio-cyan to-bio-cyan opacity-80" />
      
      {/* Glowing nodes */}
      {nodePositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-bio-cyan"
          style={{ 
            top: `${pos}%`,
            boxShadow: '0 0 8px hsl(var(--bio-cyan)), 0 0 16px hsl(var(--bio-cyan))',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default DNAHelix;
