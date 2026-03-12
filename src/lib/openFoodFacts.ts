// Open Food Facts API integration
// Free API, no key required

export interface OFFProduct {
  name: string;
  brand: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  sodium: number;
  per100g: boolean;
  imageUrl: string | null;
  barcode: string;
  source: 'Open Food Facts';
}

// ─── CACHE HELPERS ──────────────────────────
const SEARCH_CACHE_PREFIX = 'off_search_';
const BARCODE_CACHE_PREFIX = 'off_barcode_';
const SEARCH_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const BARCODE_CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

const getCached = <T>(key: string, expiry: number): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch { return null; }
};

const setCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* storage full */ }
};

// Extract best product name from all available language fields
const extractName = (p: any): string => {
  // Try common name fields in priority order
  const candidates = [
    p.product_name,
    p.product_name_ru,
    p.product_name_en,
    p.product_name_uk,
    p.product_name_lv,
    p.product_name_de,
    p.product_name_fr,
    p.product_name_pl,
    p.product_name_lt,
    p.product_name_et,
    p.abbreviated_product_name,
    p.generic_name,
    p.generic_name_ru,
    p.generic_name_en,
  ];
  
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim().length > 0) return c.trim();
  }
  
  // Last resort: use brands as name
  if (p.brands && typeof p.brands === 'string' && p.brands.trim().length > 0) {
    return p.brands.trim();
  }
  
  return '';
};

// Extract calories handling different nutriment field names
const extractCalories = (n: any): number => {
  if (!n) return 0;
  const kcal = n['energy-kcal_100g'] || n['energy-kcal'] || 0;
  if (kcal > 0) return Math.round(kcal);
  // Some products only have energy in kJ
  const kj = n['energy_100g'] || n['energy-kj_100g'] || 0;
  if (kj > 0) return Math.round(kj / 4.184);
  return 0;
};

// ─── BARCODE LOOKUP ─────────────────────────
export const getProductByBarcode = async (barcode: string): Promise<OFFProduct | null> => {
  const cacheKey = BARCODE_CACHE_PREFIX + barcode;
  const cached = getCached<OFFProduct>(cacheKey, BARCODE_CACHE_EXPIRY);
  if (cached) return cached;

  try {
    // Use API v2 for better results
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,product_name_ru,product_name_en,product_name_uk,product_name_lv,product_name_de,product_name_fr,product_name_pl,product_name_lt,product_name_et,abbreviated_product_name,generic_name,generic_name_ru,generic_name_en,brands,nutriments,image_front_small_url,image_url,code`,
      {
        headers: {
          'User-Agent': 'TYANA App/1.0 (contact@tyana.app)',
        },
      }
    );
    const data = await response.json();

    if (data.status !== 'success' && data.status !== 1) {
      // Fallback: try v0 API
      const v0Response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const v0Data = await v0Response.json();
      if (v0Data.status !== 1 || !v0Data.product) return null;
      data.product = v0Data.product;
    }

    const p = data.product;
    if (!p) return null;

    const n = p.nutriments || {};
    const name = extractName(p);

    // Accept product even with zero nutrition if name exists
    if (!name) return null;

    const product: OFFProduct = {
      name,
      brand: p.brands || '',
      calories: extractCalories(n),
      protein: Math.round((n['proteins_100g'] || 0) * 10) / 10,
      fat: Math.round((n['fat_100g'] || 0) * 10) / 10,
      carbs: Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
      fiber: Math.round((n['fiber_100g'] || 0) * 10) / 10,
      sugar: Math.round((n['sugars_100g'] || 0) * 10) / 10,
      sodium: Math.round((n['sodium_100g'] || 0) * 1000),
      per100g: true,
      imageUrl: p.image_front_small_url || p.image_url || null,
      barcode,
      source: 'Open Food Facts',
    };

    setCache(cacheKey, product);
    return product;
  } catch (e) {
    console.error('OpenFoodFacts barcode error:', e);
    return null;
  }
};

// ─── PRODUCT SEARCH ─────────────────────────
export const searchProducts = async (
  query: string,
  language: string = 'en'
): Promise<OFFProduct[]> => {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];

  const cacheKey = SEARCH_CACHE_PREFIX + normalizedQuery + '_' + language;
  const cached = getCached<OFFProduct[]>(cacheKey, SEARCH_CACHE_EXPIRY);
  if (cached) return cached;

  try {
    const langCode = ({ ru: 'ru', uk: 'uk', lv: 'lv', en: 'en' } as Record<string, string>)[language] || 'en';

    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?` +
      `search_terms=${encodeURIComponent(query)}&` +
      `search_simple=1&` +
      `action=process&` +
      `json=true&` +
      `page_size=8&` +
      `lc=${langCode}&` +
      `fields=product_name,product_name_ru,product_name_en,product_name_${langCode},brands,nutriments,image_front_small_url,code,generic_name,generic_name_ru,abbreviated_product_name`
    );

    const data = await response.json();
    if (!data.products?.length) return [];

    const results: OFFProduct[] = data.products
      .map((p: any) => {
        const name = extractName(p);
        if (!name) return null;
        const n = p.nutriments || {};
        return {
          name,
          brand: p.brands || '',
          calories: extractCalories(n),
          protein: Math.round((n['proteins_100g'] || 0) * 10) / 10,
          fat: Math.round((n['fat_100g'] || 0) * 10) / 10,
          carbs: Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
          fiber: Math.round((n['fiber_100g'] || 0) * 10) / 10,
          sugar: Math.round((n['sugars_100g'] || 0) * 10) / 10,
          sodium: 0,
          per100g: true,
          imageUrl: p.image_front_small_url || null,
          barcode: p.code || '',
          source: 'Open Food Facts' as const,
        };
      })
      .filter((p: OFFProduct | null): p is OFFProduct => p !== null);

    if (results.length > 0) {
      setCache(cacheKey, results);
    }

    return results;
  } catch (e) {
    console.error('OpenFoodFacts search error:', e);
    return [];
  }
};

// ─── HELPER: Scale nutrition to amount ──────
export const scaleNutrition = (product: OFFProduct, amountGrams: number) => {
  const m = amountGrams / 100;
  return {
    calories: Math.round(product.calories * m),
    protein: Math.round(product.protein * m * 10) / 10,
    fat: Math.round(product.fat * m * 10) / 10,
    carbs: Math.round(product.carbs * m * 10) / 10,
    fiber: Math.round(product.fiber * m * 10) / 10,
    sugar: Math.round(product.sugar * m * 10) / 10,
  };
};
