import { motion } from 'framer-motion';

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

const SkeletonCard = ({ lines = 3, className = '' }: SkeletonCardProps) => {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 2px 16px rgba(124,58,237,0.08)',
      }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full mb-3 last:mb-0"
          style={{
            height: i === 0 ? 20 : 14,
            width: i === 0 ? '60%' : `${80 - i * 10}%`,
            background: 'linear-gradient(90deg, #EDE9FE 25%, #F5F3FF 50%, #EDE9FE 75%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

export default SkeletonCard;
