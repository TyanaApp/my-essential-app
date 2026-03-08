import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// In-memory cache for generated image URLs (persists across re-renders)
const imageCache = new Map<string, string>();
// Track in-flight requests to avoid duplicates
const pendingRequests = new Map<string, Promise<string | null>>();

const FOOD_EMOJI_MAP: [RegExp, string][] = [
  [/рис|rice/i, '🍚'],
  [/паст|pasta|макарон|spaghetti|спагетти|карбонара|болоньезе/i, '🍝'],
  [/суп|soup|борщ|borscht|щи|солянк|окрошк|уха|харчо|крем-суп/i, '🍲'],
  [/салат|salad/i, '🥗'],
  [/курин|куриц|chicken|курка|курятин/i, '🍗'],
  [/рыб|fish|риба|лосос|salmon|тунец|tuna/i, '🐟'],
  [/яйц|egg|омлет|omelette/i, '🍳'],
  [/мяс|meat|говядин|свинин|beef|pork|баранин|lamb/i, '🥩'],
  [/стейк|steak/i, '🥩'],
  [/десерт|cake|торт|pie|пирог|кекс/i, '🍰'],
  [/пицц|pizza|піц/i, '🍕'],
  [/бургер|burger/i, '🍔'],
  [/сэндвич|sandwich|тост|toast/i, '🥪'],
  [/смузи|smoothie|смузі/i, '🥤'],
  [/блин|pancake|оладь|млинц|драник/i, '🥞'],
  [/креветк|shrimp/i, '🦐'],
  [/хлеб|bread|хліб/i, '🍞'],
  [/суші|sushi|ролл|roll/i, '🍱'],
  [/овсян|oat|каша|porridge|гречк/i, '🥣'],
  [/творог|сырник|cottage/i, '🧀'],
  [/плов|pilaf/i, '🍛'],
  [/пельмен|вареник|dumpling|манты/i, '🥟'],
  [/шашлык|шашлик|kebab|bbq|гриль/i, '🍢'],
  [/овощ|овоч|vegetable/i, '🥦'],
  [/фрукт|fruit/i, '🍎'],
  [/картош|картофел|potato|пюре/i, '🥔'],
  [/грибн|гриб|mushroom/i, '🍄'],
  [/мороженое|ice cream/i, '🍦'],
  [/печенье|cookie/i, '🍪'],
  [/индейк|індичк|turkey/i, '🦃'],
  [/шаурм|shawarma/i, '🌯'],
  [/хачапур/i, '🫓'],
];

const GRADIENT_COLORS: Record<string, string> = {
  'А': '#7C3AED', 'Б': '#2563EB', 'В': '#059669', 'Г': '#D97706',
  'Д': '#DC2626', 'Е': '#7C3AED', 'Ж': '#2563EB', 'З': '#059669',
  'И': '#D97706', 'К': '#DC2626', 'Л': '#7C3AED', 'М': '#2563EB',
  'Н': '#059669', 'О': '#D97706', 'П': '#7C3AED', 'Р': '#2563EB',
  'С': '#059669', 'Т': '#D97706', 'У': '#DC2626', 'Ф': '#7C3AED',
  'Х': '#2563EB', 'Ц': '#059669', 'Ч': '#D97706', 'Ш': '#DC2626',
  'A': '#7C3AED', 'B': '#2563EB', 'C': '#059669', 'D': '#D97706',
  'E': '#DC2626', 'F': '#7C3AED', 'G': '#2563EB', 'H': '#059669',
  'I': '#D97706', 'J': '#DC2626', 'K': '#7C3AED', 'L': '#2563EB',
  'M': '#059669', 'N': '#D97706', 'O': '#7C3AED', 'P': '#2563EB',
  'Q': '#059669', 'R': '#D97706', 'S': '#DC2626', 'T': '#7C3AED',
  'U': '#2563EB', 'V': '#059669', 'W': '#D97706', 'X': '#DC2626',
  'Y': '#7C3AED', 'Z': '#2563EB',
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
  return `linear-gradient(135deg, ${base}22 0%, ${base}44 100%)`;
}

function getCacheKey(title: string, imageQuery?: string): string {
  return (imageQuery || title).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 60);
}

async function fetchAIImage(title: string, imageQuery?: string): Promise<string | null> {
  const key = getCacheKey(title, imageQuery);

  // Check memory cache
  if (imageCache.has(key)) return imageCache.get(key)!;

  // Check localStorage cache
  try {
    const cached = localStorage.getItem(`rimg_${key}`);
    if (cached) {
      imageCache.set(key, cached);
      return cached;
    }
  } catch {}

  // Deduplicate in-flight requests
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipe-image', {
        body: { title, imageQuery: imageQuery || title },
      });

      if (error || !data?.imageUrl) return null;

      const url = data.imageUrl;
      imageCache.set(key, url);
      // Cache URL in localStorage (not base64, just the URL string)
      try {
        localStorage.setItem(`rimg_${key}`, url);
      } catch {}
      return url;
    } catch (e) {
      console.error('Recipe image fetch error:', e);
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
}

interface RecipePhotoProps {
  title: string;
  imageQuery?: string;
  imageUrl?: string;
  className?: string;
  size?: 'sm' | 'lg';
}

const RecipePhoto = ({ title, imageQuery, imageUrl, className = '', size = 'sm' }: RecipePhotoProps) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imgSrc, setImgSrc] = useState<string | null>(imageUrl || null);
  const mountedRef = useRef(true);

  const emoji = getFoodEmoji(title);
  const gradient = getGradient(title);
  const height = size === 'lg' ? 'h-44' : 'h-40';

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // If we already have a direct URL (from DB), use it
    if (imageUrl) {
      setImgSrc(imageUrl);
      setStatus('loading');
      return;
    }

    // Check memory cache first
    const key = getCacheKey(title, imageQuery);
    const cached = imageCache.get(key);
    if (cached) {
      setImgSrc(cached);
      setStatus('loading');
      return;
    }

    // Check localStorage
    try {
      const lsCached = localStorage.getItem(`rimg_${key}`);
      if (lsCached) {
        imageCache.set(key, lsCached);
        setImgSrc(lsCached);
        setStatus('loading');
        return;
      }
    } catch {}

    // Generate AI image
    setStatus('loading');
    setImgSrc(null);

    fetchAIImage(title, imageQuery).then(url => {
      if (mountedRef.current) {
        if (url) {
          setImgSrc(url);
        } else {
          setStatus('error');
        }
      }
    });
  }, [title, imageQuery, imageUrl]);

  return (
    <div className={`${height} w-full relative overflow-hidden rounded-t-xl ${className}`} style={{ background: gradient }}>
      {/* Emoji placeholder always behind */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={size === 'lg' ? 'text-7xl' : 'text-5xl'} style={{ opacity: 0.85 }}>{emoji}</span>
      </div>

      {/* Loading shimmer */}
      {status === 'loading' && !imgSrc && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}

      {imgSrc && status !== 'error' && (
        <img
          src={imgSrc}
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => { if (mountedRef.current) setStatus('loaded'); }}
          onError={() => { if (mountedRef.current) setStatus('error'); }}
          loading="lazy"
          crossOrigin="anonymous"
        />
      )}

      {status === 'loaded' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      )}
    </div>
  );
};

export default RecipePhoto;
