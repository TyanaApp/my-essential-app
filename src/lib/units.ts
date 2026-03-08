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
    { value: 'bottle', label: 'bottle' },
    { value: 'box', label: 'box' },
    { value: 'bunch', label: 'bunch' },
    { value: 'slice', label: 'slice' },
  ],
  ru: [
    { value: 'pcs', label: 'шт' },
    { value: 'kg', label: 'кг' },
    { value: 'g', label: 'г' },
    { value: 'l', label: 'л' },
    { value: 'ml', label: 'мл' },
    { value: 'pack', label: 'упак' },
    { value: 'bottle', label: 'бутылка' },
    { value: 'box', label: 'коробка' },
    { value: 'bunch', label: 'пучок' },
    { value: 'slice', label: 'кусок' },
  ],
  uk: [
    { value: 'pcs', label: 'шт' },
    { value: 'kg', label: 'кг' },
    { value: 'g', label: 'г' },
    { value: 'l', label: 'л' },
    { value: 'ml', label: 'мл' },
    { value: 'pack', label: 'упак' },
    { value: 'bottle', label: 'пляшка' },
    { value: 'box', label: 'коробка' },
    { value: 'bunch', label: 'пучок' },
    { value: 'slice', label: 'шматок' },
  ],
  lv: [
    { value: 'pcs', label: 'gab' },
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'l', label: 'L' },
    { value: 'ml', label: 'ml' },
    { value: 'pack', label: 'iepak' },
    { value: 'bottle', label: 'pudele' },
    { value: 'box', label: 'kārba' },
    { value: 'bunch', label: 'ķekars' },
    { value: 'slice', label: 'šķēle' },
  ],
};

export const getUnits = (language: string): UnitOption[] => {
  return UNITS[language] || UNITS.en;
};

export const getUnitLabel = (language: string, value: string): string => {
  const units = getUnits(language);
  const found = units.find(u => u.value === value);
  return found?.label || value;
};
