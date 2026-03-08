import { useState } from 'react';

const FOOD_EMOJI_MAP: [RegExp, string][] = [
  [/pasta|паста|макарон|spaghetti|penne|noodle/i, '🍝'],
  [/soup|суп|zupa|борщ|borscht/i, '🍲'],
  [/salad|салат|salāt/i, '🥗'],
  [/chicken|курица|курк|vistas|куряч/i, '🍗'],
  [/fish|рыба|риба|zivs|salmon|tuna|лосось|тунец/i, '🐟'],
  [/egg|яйц|яйц|ola/i, '🍳'],
  [/rice|рис|rīs/i, '🍚'],
  [/meat|мясо|м'ясо|gaļa|beef|говядин|свинин|pork/i, '🥩'],
  [/dessert|десерт|cake|торт|pie|пирог|кекс/i, '🍰'],
  [/pizza|піца|пицца/i, '🍕'],
  [/sandwich|бутерброд|сендвіч/i, '🥪'],
  [/smoothie|смузі|смузи/i, '🥤'],
];

const GRADIENT_COLORS: Record<string, string> = {
  'A': '#7C3AED', 'B': '#7C3AED', 'C': '#7C3AED', 'D': '#7C3AED', 'E': '#7C3AED',
  'F': '#0D9488', 'G': '#0D9488', 'H': '#0D9488', 'I': '#0D9488', 'J': '#0D9488',
  'K': '#EA580C', 'L': '#EA580C', 'M': '#EA580C', 'N': '#EA580C', 'O': '#EA580C',
  'P': '#DB2777', 'Q': '#DB2777', 'R': '#DB2777', 'S': '#DB2777', 'T': '#DB2777',
  'U': '#4F46E5', 'V': '#4F46E5', 'W': '#4F46E5', 'X': '#4F46E5', 'Y': '#4F46E5', 'Z': '#4F46E5',
};

function getFoodEmoji(title: string): string {
  for (const [pattern, emoji] of FOOD_EMOJI_MAP) {
    if (pattern.test(title)) return emoji;
  }
  return '🍽';
}

function getGradient(title: string): string {
  const letter = (title[0] || 'A').toUpperCase();
  const base = GRADIENT_COLORS[letter] || '#7C3AED';
  return `linear-gradient(135deg, ${base} 0%, ${base}99 50%, ${base}55 100%)`;
}

function getPhotoUrl(title: string): string {
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(title + ' food dish')}`;
}

interface RecipePhotoProps {
  title: string;
  className?: string;
  size?: 'sm' | 'lg';
}

const RecipePhoto = ({ title, className = '', size = 'sm' }: RecipePhotoProps) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const emoji = getFoodEmoji(title);
  const gradient = getGradient(title);
  const height = size === 'lg' ? 'h-44' : 'h-40';

  return (
    <div className={`${height} w-full relative overflow-hidden ${className}`} style={{ background: gradient }}>
      {/* Placeholder always visible behind */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl opacity-80">{emoji}</span>
      </div>
      {status !== 'error' && (
        <img
          src={getPhotoUrl(title)}
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default RecipePhoto;
