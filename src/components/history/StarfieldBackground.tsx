import { useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  layer: 'back' | 'mid' | 'front';
}

const StarfieldBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Parallax effect - stars move slower than content
  const backLayerY = useTransform(scrollY, [0, 1000], [0, 100]);
  const midLayerY = useTransform(scrollY, [0, 1000], [0, 200]);
  const frontLayerY = useTransform(scrollY, [0, 1000], [0, 300]);

  const stars = useMemo(() => {
    const generated: Star[] = [];
    const count = 150;
    
    for (let i = 0; i < count; i++) {
      const layer = i < 50 ? 'back' : i < 100 ? 'mid' : 'front';
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 200,
        size: layer === 'back' ? 1 : layer === 'mid' ? 1.5 : 2,
        opacity: layer === 'back' ? 0.3 : layer === 'mid' ? 0.5 : 0.7,
        animationDuration: 3 + Math.random() * 4,
        layer,
      });
    }
    return generated;
  }, []);

  const backStars = stars.filter(s => s.layer === 'back');
  const midStars = stars.filter(s => s.layer === 'mid');
  const frontStars = stars.filter(s => s.layer === 'front');

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        background: 'linear-gradient(180deg, hsl(230 35% 8%) 0%, hsl(240 30% 5%) 50%, hsl(250 35% 10%) 100%)',
      }}
    >
      {/* Nebula glow effects */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, hsl(200 80% 50%) 0%, transparent 70%)',
          top: '10%',
          left: '-10%',
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[80px]"
        style={{
          background: 'radial-gradient(circle, hsl(280 70% 50%) 0%, transparent 70%)',
          bottom: '20%',
          right: '-5%',
        }}
      />

      {/* Back layer stars */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: backLayerY }}
      >
        {backStars.map(star => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
            animate={{
              opacity: [star.opacity, star.opacity * 1.5, star.opacity],
            }}
            transition={{
              duration: star.animationDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Mid layer stars */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: midLayerY }}
      >
        {midStars.map(star => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: 'hsl(200 80% 80%)',
              boxShadow: '0 0 4px hsl(200 80% 60%)',
              opacity: star.opacity,
            }}
            animate={{
              opacity: [star.opacity, star.opacity * 1.8, star.opacity],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.animationDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Front layer stars */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: frontLayerY }}
      >
        {frontStars.map(star => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              background: 'white',
              boxShadow: '0 0 6px hsl(180 70% 70%), 0 0 12px hsl(180 70% 50%)',
              opacity: star.opacity,
            }}
            animate={{
              opacity: [star.opacity, 1, star.opacity],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: star.animationDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default StarfieldBackground;
