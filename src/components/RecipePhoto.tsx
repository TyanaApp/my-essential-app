import { useState, useEffect } from 'react';

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
  [/pancake|блин|оладь|pankūk/i, '🥞'],
  [/steak|стейк/i, '🥩'],
  [/shrimp|креветк|garnele/i, '🦐'],
  [/bread|хлеб|хліб|maize/i, '🍞'],
];

const GRADIENT_COLORS: Record<string, string> = {
  'A': '#7C3AED', 'B': '#7C3AED', 'C': '#7C3AED', 'D': '#7C3AED', 'E': '#7C3AED',
  'F': '#0D9488', 'G': '#0D9488', 'H': '#0D9488', 'I': '#0D9488', 'J': '#0D9488',
  'K': '#EA580C', 'L': '#EA580C', 'M': '#EA580C', 'N': '#EA580C', 'O': '#EA580C',
  'P': '#DB2777', 'Q': '#DB2777', 'R': '#DB2777', 'S': '#DB2777', 'T': '#DB2777',
  'U': '#4F46E5', 'V': '#4F46E5', 'W': '#4F46E5', 'X': '#4F46E5', 'Y': '#4F46E5', 'Z': '#4F46E5',
};

// Map non-Latin titles to English food keywords for image search
const FOOD_KEYWORD_MAP: [RegExp, string][] = [
  [/паста|макарон/i, 'pasta'],
  [/суп|борщ/i, 'soup'],
  [/салат/i, 'salad'],
  [/курица|куриц|курин|куряч/i, 'chicken'],
  [/рыба|риба|лосось|тунец/i, 'fish'],
  [/яйц|омлет/i, 'eggs omelette'],
  [/рис|плов/i, 'rice'],
  [/мясо|говядин|свинин|котлет/i, 'meat'],
  [/торт|пирог|кекс|десерт/i, 'dessert cake'],
  [/пицца|піца/i, 'pizza'],
  [/бутерброд|сендвіч/i, 'sandwich'],
  [/смузи|смузі/i, 'smoothie'],
  [/блин|оладь|панкейк/i, 'pancakes'],
  [/стейк/i, 'steak'],
  [/креветк/i, 'shrimp'],
  [/хлеб|хліб/i, 'bread'],
  [/каша|овсян/i, 'porridge oatmeal'],
  [/запеканк/i, 'casserole'],
  [/тефтел|фрикадельк/i, 'meatballs'],
  [/гриль/i, 'grill bbq'],
  [/жарен/i, 'fried'],
  [/тушен/i, 'stew'],
  [/печен/i, 'baked'],
  [/овощ|овочі/i, 'vegetables'],
  [/фрукт/i, 'fruit'],
  [/сырник/i, 'cottage cheese pancakes'],
  [/вареник|пельмен/i, 'dumplings'],
  [/борщ/i, 'borscht soup'],
  [/голубц/i, 'cabbage rolls'],
];

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

function getSearchKeywords(title: string): string {
  // Try to map Cyrillic/non-Latin food names to English keywords
  for (const [pattern, keyword] of FOOD_KEYWORD_MAP) {
    if (pattern.test(title)) return keyword;
  }
  // If already Latin, use the title directly
  if (/^[a-zA-Z\s]+$/.test(title)) return title;
  // Fallback: generic food
  return 'delicious food dish';
}

function getPhotoUrl(title: string): string {
  const keywords = getSearchKeywords(title);
  // Use loremflickr — free, no API key, returns relevant food images
  return `https://loremflickr.com/400/300/food,${encodeURIComponent(keywords)}?lock=${hashCode(title)}`;
}

// Simple hash to get consistent images for the same title
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) % 10000;
}

interface RecipePhotoProps {
  title: string;
  className?: string;
  size?: 'sm' | 'lg';
}

const RecipePhoto = ({ title, className = '', size = 'sm' }: RecipePhotoProps) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imgSrc, setImgSrc] = useState('');

  const emoji = getFoodEmoji(title);
  const gradient = getGradient(title);
  const height = size === 'lg' ? 'h-44' : 'h-40';

  useEffect(() => {
    setStatus('loading');
    setImgSrc(getPhotoUrl(title));
  }, [title]);

  return (
    <div className={`${height} w-full relative overflow-hidden ${className}`} style={{ background: gradient }}>
      {/* Emoji placeholder always visible behind */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl opacity-80">{emoji}</span>
      </div>
      {status !== 'error' && imgSrc && (
        <img
          src={imgSrc}
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          loading="lazy"
          crossOrigin="anonymous"
        />
      )}
      {/* Subtle gradient overlay for text readability */}
      {status === 'loaded' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      )}
    </div>
  );
};

export default RecipePhoto;
