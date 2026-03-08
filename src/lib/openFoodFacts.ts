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

// ─── BARCODE LOOKUP ─────────────────────────
export const getProductByBarcode = async (barcode: string): Promise<OFFProduct | null> => {
  const cacheKey = BARCODE_CACHE_PREFIX + barcode;
  const cached = getCached<OFFProduct>(cacheKey, BARCODE_CACHE_EXPIRY);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};

    const product: OFFProduct = {
      name: p.product_name || p.product_name_ru || p.product_name_en || '',
      brand: p.brands || '',
      calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)),
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

    if (product.name.length > 0) {
      setCache(cacheKey, product);
    }

    return product.name.length > 0 ? product : null;
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
      `page_size=5&` +
      `lc=${langCode}&` +
      `fields=product_name,product_name_ru,product_name_${langCode},brands,nutriments,image_front_small_url,code`
    );

    const data = await response.json();
    if (!data.products?.length) return [];

    const results: OFFProduct[] = data.products
      .filter((p: any) => p.nutriments?.['energy-kcal_100g'] > 0)
      .map((p: any) => ({
        name: p[`product_name_${langCode}`] || p.product_name_ru || p.product_name || '',
        brand: p.brands || '',
        calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
        protein: Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10,
        fat: Math.round((p.nutriments['fat_100g'] || 0) * 10) / 10,
        carbs: Math.round((p.nutriments['carbohydrates_100g'] || 0) * 10) / 10,
        fiber: Math.round((p.nutriments['fiber_100g'] || 0) * 10) / 10,
        sugar: Math.round((p.nutriments['sugars_100g'] || 0) * 10) / 10,
        sodium: 0,
        per100g: true,
        imageUrl: p.image_front_small_url || null,
        barcode: p.code || '',
        source: 'Open Food Facts' as const,
      }))
      .filter((p: OFFProduct) => p.name.length > 0);

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
