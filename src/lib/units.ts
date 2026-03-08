export interface UnitOption {
  value: string;
  label: string;
}

const UNITS: Record<string, UnitOption[]> = {
  en: [
    { value: 'pcs', label: 'pcs' },
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'l', label: 'L' },
    { value: 'ml', label: 'ml' },
    { value: 'pack', label: 'pack' },
    { value: 'packs', label: 'packs' },
    { value: 'bottle', label: 'bottle' },
    { value: 'box', label: 'box' },
    { value: 'bunch', label: 'bunch' },
    { value: 'slice', label: 'slice' },
    { value: 'can', label: 'can' },
    { value: 'loaf', label: 'loaf' },
    { value: 'tbsp', label: 'tbsp' },
    { value: 'tsp', label: 'tsp' },
    { value: 'cup', label: 'cup' },
    { value: 'serving', label: 'serving' },
    { value: 'portion', label: 'portion' },
    { value: 'handful', label: 'handful' },
  ],
  ru: [
    { value: 'pcs', label: 'шт' },
    { value: 'kg', label: 'кг' },
    { value: 'g', label: 'г' },
    { value: 'l', label: 'л' },
    { value: 'ml', label: 'мл' },
    { value: 'pack', label: 'упак' },
    { value: 'packs', label: 'упак' },
    { value: 'bottle', label: 'бутылка' },
    { value: 'box', label: 'коробка' },
    { value: 'bunch', label: 'пучок' },
    { value: 'slice', label: 'кусок' },
    { value: 'can', label: 'банка' },
    { value: 'loaf', label: 'буханка' },
    { value: 'tbsp', label: 'ст.л' },
    { value: 'tsp', label: 'ч.л' },
    { value: 'cup', label: 'стакан' },
    { value: 'serving', label: 'порция' },
    { value: 'portion', label: 'порция' },
    { value: 'handful', label: 'горсть' },
  ],
  uk: [
    { value: 'pcs', label: 'шт' },
    { value: 'kg', label: 'кг' },
    { value: 'g', label: 'г' },
    { value: 'l', label: 'л' },
    { value: 'ml', label: 'мл' },
    { value: 'pack', label: 'упак' },
    { value: 'packs', label: 'упак' },
    { value: 'bottle', label: 'пляшка' },
    { value: 'box', label: 'коробка' },
    { value: 'bunch', label: 'пучок' },
    { value: 'slice', label: 'шматок' },
    { value: 'can', label: 'банка' },
    { value: 'loaf', label: 'буханка' },
    { value: 'tbsp', label: 'ст.л' },
    { value: 'tsp', label: 'ч.л' },
    { value: 'cup', label: 'склянка' },
    { value: 'serving', label: 'порція' },
    { value: 'portion', label: 'порція' },
    { value: 'handful', label: 'жменька' },
  ],
  lv: [
    { value: 'pcs', label: 'gab' },
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'l', label: 'L' },
    { value: 'ml', label: 'ml' },
    { value: 'pack', label: 'iepak' },
    { value: 'packs', label: 'iepak' },
    { value: 'bottle', label: 'pudele' },
    { value: 'box', label: 'kārba' },
    { value: 'bunch', label: 'ķekars' },
    { value: 'slice', label: 'šķēle' },
    { value: 'can', label: 'kārba' },
    { value: 'loaf', label: 'kukuļmaize' },
    { value: 'tbsp', label: 'ēd.k' },
    { value: 'tsp', label: 'tēj.k' },
    { value: 'cup', label: 'glāze' },
    { value: 'serving', label: 'porcija' },
    { value: 'portion', label: 'porcija' },
    { value: 'handful', label: 'sauja' },
  ],
};

export const getUnits = (language: string): UnitOption[] => {
  return UNITS[language] || UNITS.en;
};

export const getUnitLabel = (language: string, value: string): string => {
  const units = getUnits(language);
  const found = units.find(u => u.value === value);
  if (found) return found.label;
  // Try reverse lookup — if value is already a translated label, return as-is
  const anyLang = Object.values(UNITS).flat();
  if (anyLang.some(u => u.label === value)) return value;
  return value;
};

/** Translate a unit string to the target language */
export const translateUnit = (unit: string, language: string): string => {
  // First try direct value lookup
  const label = getUnitLabel(language, unit);
  if (label !== unit) return label;

  // Reverse map: if unit is a label from another language, find its value then translate
  for (const [, unitList] of Object.entries(UNITS)) {
    const match = unitList.find(u => u.label.toLowerCase() === unit.toLowerCase());
    if (match) {
      return getUnitLabel(language, match.value);
    }
  }
  return unit;
};
