import { useState, useEffect } from 'react';

// Extensive Russian/Ukrainian → English keyword map for accurate food image search
const SEARCH_TERMS: Record<string, string> = {
  'рис с курицей': 'rice with chicken',
  'куриная грудка': 'chicken breast',
  'борщ': 'borscht soup',
  'паста': 'pasta dish',
  'омлет': 'omelette eggs',
  'гречка': 'buckwheat porridge',
  'овсянка': 'oatmeal breakfast',
  'лазанья': 'lasagna',
  'салат цезарь': 'caesar salad',
  'плов': 'pilaf rice',
  'котлеты': 'meat cutlets',
  'пельмени': 'dumplings',
  'блины': 'pancakes crepes',
  'творог': 'cottage cheese',
  'щи': 'cabbage soup',
  'солянка': 'solyanka soup',
  'окрошка': 'okroshka cold soup',
  'вареники': 'varenyky dumplings',
  'сырники': 'cottage cheese pancakes',
  'запеканка': 'casserole baked',
  'лосось': 'salmon dish',
  'тунец': 'tuna dish',
  'говядина': 'beef dish',
  'свинина': 'pork dish',
  'баранина': 'lamb dish',
  'греческий салат': 'greek salad',
  'оливье': 'olivier russian salad',
  'винегрет': 'vinegret beet salad',
  'роллы': 'sushi rolls',
  'пицца': 'pizza',
  'бургер': 'burger',
  'стейк': 'steak',
  'шашлык': 'shashlik kebab skewers',
  'индейка': 'turkey dish',
  'тост': 'toast breakfast',
  'сэндвич': 'sandwich',
  'суши': 'sushi',
  'рататуй': 'ratatouille',
  'ризотто': 'risotto',
  'голубцы': 'cabbage rolls',
  'фрикадельки': 'meatballs',
  'тефтели': 'meatballs sauce',
  'каша': 'porridge bowl',
  'макароны': 'pasta noodles',
  'спагетти': 'spaghetti',
  'карбонара': 'carbonara pasta',
  'болоньезе': 'bolognese pasta',
  'жаркое': 'roast stew',
  'гуляш': 'goulash stew',
  'рагу': 'vegetable stew',
  'крем-суп': 'cream soup',
  'уха': 'fish soup',
  'харчо': 'kharcho soup',
  'лагман': 'lagman noodle soup',
  'чахохбили': 'chicken stew',
  'шаурма': 'shawarma wrap',
  'хачапури': 'khachapuri cheese bread',
  'манты': 'manti steamed dumplings',
  'самса': 'samosa pastry',
  'чебурек': 'cheburek fried pastry',
  'оладьи': 'fluffy pancakes',
  'драники': 'potato pancakes',
  'деруни': 'potato pancakes',
  'зразы': 'stuffed cutlets',
  'биточки': 'patties',
  'отбивная': 'schnitzel cutlet',
  'шницель': 'schnitzel',
  'бефстроганов': 'beef stroganoff',
  'пирожки': 'pirozhki baked buns',
  'ватрушка': 'vatrushka cheese pastry',
  'сырная': 'cheese',
  'грибной': 'mushroom',
  'грибы': 'mushrooms',
  'картофель': 'potato',
  'картошка': 'potato dish',
  'пюре': 'mashed potatoes',
  'жареная картошка': 'fried potatoes',
  'печень': 'liver dish',
  'фаршированный': 'stuffed',
  'тушеная': 'braised stew',
  'жареная': 'fried',
  'запеченная': 'baked roasted',
  'вареная': 'boiled',
  'на пару': 'steamed',
  'гриль': 'grilled',
  'смузи': 'smoothie',
  'десерт': 'dessert',
  'торт': 'cake',
  'пирог': 'pie',
  'кекс': 'cupcake muffin',
  'печенье': 'cookies',
  'мороженое': 'ice cream',
};

// Single-word fallback patterns for partial matches
const WORD_PATTERNS: [RegExp, string][] = [
  [/рис/i, 'rice dish'],
  [/курин|куриц|курка|курятин/i, 'chicken dish'],
  [/рыб|риба/i, 'fish dish'],
  [/мяс|м'яс/i, 'meat dish'],
  [/яйц|яєц/i, 'eggs dish'],
  [/салат/i, 'fresh salad'],
  [/суп/i, 'soup bowl'],
  [/паст|макарон/i, 'pasta dish'],
  [/блин|млинц/i, 'pancakes'],
  [/пицц|піц/i, 'pizza'],
  [/бургер/i, 'burger'],
  [/стейк/i, 'steak'],
  [/овощ|овоч/i, 'vegetables dish'],
  [/фрукт/i, 'fruit bowl'],
  [/каш[аеу]/i, 'porridge'],
  [/творо[гж]/i, 'cottage cheese'],
  [/сыр(?!ник)/i, 'cheese'],
  [/хлеб|хліб/i, 'bread'],
  [/грибн|гриб/i, 'mushroom dish'],
  [/картош|картофел/i, 'potato dish'],
  [/свинин/i, 'pork'],
  [/говядин/i, 'beef'],
  [/лосос/i, 'salmon'],
  [/тунец|тунц/i, 'tuna'],
  [/креветк/i, 'shrimp'],
  [/десерт|торт|пирог|кекс/i, 'dessert cake'],
  [/смузи|смузі/i, 'smoothie'],
  [/запечен|запікан/i, 'baked casserole'],
  [/тушен/i, 'stew braised'],
  [/жарен/i, 'fried dish'],
  [/печен/i, 'baked'],
  [/гриль/i, 'grilled food'],
  [/шашлык|шашлик/i, 'kebab skewers'],
  [/пельмен/i, 'dumplings'],
  [/вареник/i, 'dumplings'],
  [/голубц/i, 'cabbage rolls'],
  [/котлет/i, 'cutlets patties'],
  [/тефтел|фрикадельк/i, 'meatballs'],
  [/плов/i, 'pilaf rice'],
  [/борщ/i, 'borscht'],
  [/суші|ролл/i, 'sushi rolls'],
  [/індичк|индейк/i, 'turkey'],
];

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

function getSearchQuery(title: string): string {
  const nameLower = title.toLowerCase().trim();

  // 1. Try exact/substring match in full phrase map (longest match first)
  const sortedKeys = Object.keys(SEARCH_TERMS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (nameLower.includes(key)) {
      return SEARCH_TERMS[key];
    }
  }

  // 2. Try regex word patterns
  for (const [pattern, keyword] of WORD_PATTERNS) {
    if (pattern.test(nameLower)) {
      return keyword;
    }
  }

  // 3. If Latin characters, use title directly
  if (/^[a-zA-Z\s\-,]+$/.test(title.trim())) {
    return title.trim();
  }

  // 4. Fallback
  return 'delicious food dish';
}

function getFoodEmoji(title: string): string {
  for (const [pattern, emoji] of FOOD_EMOJI_MAP) {
    if (pattern.test(title)) return emoji;
  }
  return '🍽';
}

// Deterministic hash for consistent images per recipe
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10000;
}

function getPhotoUrl(title: string, attempt: number = 0): string {
  const query = getSearchQuery(title);
  const lock = hashCode(title) + attempt;
  return `https://loremflickr.com/400/300/food,${encodeURIComponent(query)}?lock=${lock}`;
}

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

function getGradient(title: string): string {
  const letter = (title[0] || 'A').toUpperCase();
  const base = GRADIENT_COLORS[letter] || '#7C3AED';
  return `linear-gradient(135deg, ${base}22 0%, ${base}44 100%)`;
}

interface RecipePhotoProps {
  title: string;
  className?: string;
  size?: 'sm' | 'lg';
}

const RecipePhoto = ({ title, className = '', size = 'sm' }: RecipePhotoProps) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imgSrc, setImgSrc] = useState('');
  const [attempts, setAttempts] = useState(0);

  const emoji = getFoodEmoji(title);
  const gradient = getGradient(title);
  const height = size === 'lg' ? 'h-44' : 'h-40';

  useEffect(() => {
    setStatus('loading');
    setAttempts(0);
    setImgSrc(getPhotoUrl(title, 0));
  }, [title]);

  const handleError = () => {
    if (attempts < 2) {
      const next = attempts + 1;
      setAttempts(next);
      setStatus('loading');
      if (next === 1) {
        // Retry with simpler query (first word + food)
        const simpleWord = title.split(/\s+/)[0];
        const simple = /^[a-zA-Z]/.test(simpleWord) ? simpleWord : 'food';
        setImgSrc(`https://loremflickr.com/400/300/food,${encodeURIComponent(simple + ' dish')}?lock=${hashCode(title) + 100}`);
      } else {
        // Give up, show emoji
        setStatus('error');
      }
    } else {
      setStatus('error');
    }
  };

  return (
    <div className={`${height} w-full relative overflow-hidden rounded-t-xl ${className}`} style={{ background: gradient }}>
      {/* Emoji placeholder always behind */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={size === 'lg' ? 'text-7xl' : 'text-5xl'} style={{ opacity: 0.85 }}>{emoji}</span>
      </div>
      {status !== 'error' && imgSrc && (
        <img
          src={imgSrc}
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setStatus('loaded')}
          onError={handleError}
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
