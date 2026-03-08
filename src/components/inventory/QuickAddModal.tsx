import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickItem {
  emoji: string;
  nameKey: string;
  name: string;
}

interface Category {
  emoji: string;
  labelKey: string;
  label: string;
  items: QuickItem[];
}

interface SelectedItem {
  name: string;
  emoji: string;
  qty: number;
  unit: string;
  displayQty: string;
}

interface QtyPreset {
  label: string;
  qty: number;
  unit: string;
}

// Items that can be sold by weight
const WEIGHABLE_ITEMS = new Set([
  'cheese', 'butter', 'cottageCheese', 'beef', 'chicken', 'pork', 'fish', 'mince',
  'potato', 'onion', 'carrot', 'tomato', 'cucumber', 'pepper', 'broccoli',
  'apple', 'banana', 'orange', 'lemon', 'grapes', 'strawberry', 'mango', 'pear',
  'nuts', 'rice', 'pasta', 'buckwheat', 'oatmeal', 'barley', 'lentils',
]);

const BY_WEIGHT_LABEL: Record<string, string> = {
  en: '⚖️ By weight',
  ru: '⚖️ На развес',
  uk: '⚖️ На вагу',
  lv: '⚖️ Pēc svara',
};

// Smart quantity presets per product type
const getPresetsForItem = (nameKey: string, lang: string): { presets: QtyPreset[]; defaultIdx: number } => {
  const u = UNIT_LABELS[lang] || UNIT_LABELS.en;

  const map: Record<string, { presets: QtyPreset[]; defaultIdx: number }> = {
    eggs: { presets: [{ label: '6', qty: 6, unit: 'pcs' }, { label: '10', qty: 10, unit: 'pcs' }, { label: '12', qty: 12, unit: 'pcs' }], defaultIdx: 1 },
    milk: { presets: [{ label: `1${u.l}`, qty: 1, unit: 'l' }, { label: `2${u.l}`, qty: 2, unit: 'l' }, { label: `3${u.l}`, qty: 3, unit: 'l' }], defaultIdx: 0 },
    cheese: { presets: [{ label: `100${u.g}`, qty: 100, unit: 'g' }, { label: `200${u.g}`, qty: 200, unit: 'g' }, { label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }], defaultIdx: 1 },
    butter: { presets: [{ label: `100${u.g}`, qty: 100, unit: 'g' }, { label: `200${u.g}`, qty: 200, unit: 'g' }, { label: `400${u.g}`, qty: 400, unit: 'g' }], defaultIdx: 1 },
    sourCream: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }, { label: `3 ${u.pack}`, qty: 3, unit: 'pack' }], defaultIdx: 0 },
    yogurt: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }, { label: `3 ${u.pack}`, qty: 3, unit: 'pack' }], defaultIdx: 0 },
    kefir: { presets: [{ label: `0.5${u.l}`, qty: 0.5, unit: 'l' }, { label: `1${u.l}`, qty: 1, unit: 'l' }, { label: `2${u.l}`, qty: 2, unit: 'l' }], defaultIdx: 1 },
    cottageCheese: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }], defaultIdx: 0 },
    beef: { presets: [{ label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    chicken: { presets: [{ label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    pork: { presets: [{ label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    fish: { presets: [{ label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    mince: { presets: [{ label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    sausage: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }], defaultIdx: 0 },
    potato: { presets: [{ label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }, { label: `2${u.kg}`, qty: 2, unit: 'kg' }, { label: `3${u.kg}`, qty: 3, unit: 'kg' }], defaultIdx: 1 },
    onion: { presets: [{ label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }, { label: `2${u.kg}`, qty: 2, unit: 'kg' }], defaultIdx: 1 },
    garlic: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }], defaultIdx: 0 },
    carrot: { presets: [{ label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }, { label: `2${u.kg}`, qty: 2, unit: 'kg' }], defaultIdx: 1 },
    tomato: { presets: [{ label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }, { label: `5 ${u.pcs}`, qty: 5, unit: 'pcs' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    cucumber: { presets: [{ label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }, { label: `5 ${u.pcs}`, qty: 5, unit: 'pcs' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    pepper: { presets: [{ label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }, { label: `5 ${u.pcs}`, qty: 5, unit: 'pcs' }], defaultIdx: 1 },
    broccoli: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `500${u.g}`, qty: 500, unit: 'g' }], defaultIdx: 0 },
    apple: { presets: [{ label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }, { label: `5 ${u.pcs}`, qty: 5, unit: 'pcs' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    banana: { presets: [{ label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }, { label: `5 ${u.pcs}`, qty: 5, unit: 'pcs' }, { label: `7 ${u.pcs}`, qty: 7, unit: 'pcs' }], defaultIdx: 1 },
    orange: { presets: [{ label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }, { label: `5 ${u.pcs}`, qty: 5, unit: 'pcs' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    lemon: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }], defaultIdx: 0 },
    grapes: { presets: [{ label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    strawberry: { presets: [{ label: `200${u.g}`, qty: 200, unit: 'g' }, { label: `300${u.g}`, qty: 300, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }], defaultIdx: 1 },
    mango: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }], defaultIdx: 0 },
    pear: { presets: [{ label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }, { label: `5 ${u.pcs}`, qty: 5, unit: 'pcs' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    breadLoaf: { presets: [{ label: `1 ${u.loaf}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.loaf}`, qty: 2, unit: 'pcs' }], defaultIdx: 0 },
    baguette: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }], defaultIdx: 0 },
    lavash: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }], defaultIdx: 0 },
    croissant: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }], defaultIdx: 0 },
    rice: { presets: [{ label: `400${u.g}`, qty: 400, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }, { label: `2${u.kg}`, qty: 2, unit: 'kg' }], defaultIdx: 1 },
    pasta: { presets: [{ label: `400${u.g}`, qty: 400, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    buckwheat: { presets: [{ label: `400${u.g}`, qty: 400, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    beans: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }], defaultIdx: 0 },
    corn: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }], defaultIdx: 0 },
    oatmeal: { presets: [{ label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 0 },
    barley: { presets: [{ label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 0 },
    lentils: { presets: [{ label: `400${u.g}`, qty: 400, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }, { label: `1${u.kg}`, qty: 1, unit: 'kg' }], defaultIdx: 1 },
    salt: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }], defaultIdx: 0 },
    pepperSpice: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }], defaultIdx: 0 },
    oliveOil: { presets: [{ label: `500${u.ml}`, qty: 500, unit: 'ml' }, { label: `1${u.l}`, qty: 1, unit: 'l' }], defaultIdx: 1 },
    ketchup: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }], defaultIdx: 0 },
    honey: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `250${u.g}`, qty: 250, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }], defaultIdx: 0 },
    mayo: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }], defaultIdx: 0 },
    chocolate: { presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }], defaultIdx: 0 },
    cookies: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }], defaultIdx: 0 },
    nuts: { presets: [{ label: `100${u.g}`, qty: 100, unit: 'g' }, { label: `200${u.g}`, qty: 200, unit: 'g' }, { label: `500${u.g}`, qty: 500, unit: 'g' }], defaultIdx: 1 },
    juice: { presets: [{ label: `1${u.l}`, qty: 1, unit: 'l' }, { label: `1.5${u.l}`, qty: 1.5, unit: 'l' }, { label: `2${u.l}`, qty: 2, unit: 'l' }], defaultIdx: 0 },
    chips: { presets: [{ label: `1 ${u.pack}`, qty: 1, unit: 'pack' }, { label: `2 ${u.pack}`, qty: 2, unit: 'pack' }], defaultIdx: 0 },
  };

  return map[nameKey] || {
    presets: [{ label: `1 ${u.pcs}`, qty: 1, unit: 'pcs' }, { label: `2 ${u.pcs}`, qty: 2, unit: 'pcs' }, { label: `3 ${u.pcs}`, qty: 3, unit: 'pcs' }],
    defaultIdx: 0,
  };
};

const UNIT_LABELS: Record<string, Record<string, string>> = {
  en: { pcs: 'pcs', kg: 'kg', g: 'g', l: 'L', ml: 'ml', pack: 'pack', loaf: 'loaf' },
  ru: { pcs: 'шт', kg: 'кг', g: 'г', l: 'л', ml: 'мл', pack: 'упак', loaf: 'буханка' },
  uk: { pcs: 'шт', kg: 'кг', g: 'г', l: 'л', ml: 'мл', pack: 'упак', loaf: 'буханка' },
  lv: { pcs: 'gab', kg: 'kg', g: 'g', l: 'L', ml: 'ml', pack: 'iepak', loaf: 'kukuļmaize' },
};

const buildCategories = (t: any): Category[] => {
  const qa = t.inventory?.quickAddCategories || {};
  return [
    {
      emoji: '🥚', labelKey: 'dairy', label: qa.dairy || 'Eggs & Dairy',
      items: [
        { emoji: '🥚', nameKey: 'eggs', name: qa.eggs || 'Eggs' },
        { emoji: '🥛', nameKey: 'milk', name: qa.milk || 'Milk' },
        { emoji: '🧀', nameKey: 'cheese', name: qa.cheese || 'Cheese' },
        { emoji: '🧈', nameKey: 'butter', name: qa.butter || 'Butter' },
        { emoji: '🥗', nameKey: 'sourCream', name: qa.sourCream || 'Sour cream' },
        { emoji: '🫙', nameKey: 'yogurt', name: qa.yogurt || 'Yogurt' },
        { emoji: '🥛', nameKey: 'kefir', name: qa.kefir || 'Kefir' },
        { emoji: '🧀', nameKey: 'cottageCheese', name: qa.cottageCheese || 'Cottage cheese' },
      ],
    },
    {
      emoji: '🥩', labelKey: 'meat', label: qa.meat || 'Meat & Fish',
      items: [
        { emoji: '🥩', nameKey: 'beef', name: qa.beef || 'Beef' },
        { emoji: '🍗', nameKey: 'chicken', name: qa.chicken || 'Chicken' },
        { emoji: '🥓', nameKey: 'pork', name: qa.pork || 'Pork' },
        { emoji: '🐟', nameKey: 'fish', name: qa.fish || 'Fish' },
        { emoji: '🍖', nameKey: 'mince', name: qa.mince || 'Minced meat' },
        { emoji: '🌭', nameKey: 'sausage', name: qa.sausage || 'Sausage' },
      ],
    },
    {
      emoji: '🥬', labelKey: 'vegetables', label: qa.vegetables || 'Vegetables',
      items: [
        { emoji: '🥔', nameKey: 'potato', name: qa.potato || 'Potatoes' },
        { emoji: '🧅', nameKey: 'onion', name: qa.onion || 'Onion' },
        { emoji: '🧄', nameKey: 'garlic', name: qa.garlic || 'Garlic' },
        { emoji: '🥕', nameKey: 'carrot', name: qa.carrot || 'Carrots' },
        { emoji: '🍅', nameKey: 'tomato', name: qa.tomato || 'Tomatoes' },
        { emoji: '🥒', nameKey: 'cucumber', name: qa.cucumber || 'Cucumbers' },
        { emoji: '🫑', nameKey: 'pepper', name: qa.pepper || 'Bell pepper' },
        { emoji: '🥦', nameKey: 'broccoli', name: qa.broccoli || 'Broccoli' },
      ],
    },
    {
      emoji: '🍎', labelKey: 'fruits', label: qa.fruits || 'Fruits',
      items: [
        { emoji: '🍎', nameKey: 'apple', name: qa.apple || 'Apples' },
        { emoji: '🍌', nameKey: 'banana', name: qa.banana || 'Bananas' },
        { emoji: '🍊', nameKey: 'orange', name: qa.orange || 'Oranges' },
        { emoji: '🍋', nameKey: 'lemon', name: qa.lemon || 'Lemon' },
        { emoji: '🍇', nameKey: 'grapes', name: qa.grapes || 'Grapes' },
        { emoji: '🍓', nameKey: 'strawberry', name: qa.strawberry || 'Strawberries' },
        { emoji: '🥭', nameKey: 'mango', name: qa.mango || 'Mango' },
        { emoji: '🍐', nameKey: 'pear', name: qa.pear || 'Pears' },
      ],
    },
    {
      emoji: '🍞', labelKey: 'bread', label: qa.bread || 'Bread & Bakery',
      items: [
        { emoji: '🍞', nameKey: 'breadLoaf', name: qa.breadLoaf || 'Bread' },
        { emoji: '🥖', nameKey: 'baguette', name: qa.baguette || 'Baguette' },
        { emoji: '🫓', nameKey: 'lavash', name: qa.lavash || 'Lavash' },
        { emoji: '🥐', nameKey: 'croissant', name: qa.croissant || 'Croissant' },
      ],
    },
    {
      emoji: '🫙', labelKey: 'grains', label: qa.grains || 'Grains & Canned',
      items: [
        { emoji: '🍚', nameKey: 'rice', name: qa.rice || 'Rice' },
        { emoji: '🍝', nameKey: 'pasta', name: qa.pasta || 'Pasta' },
        { emoji: '🌾', nameKey: 'buckwheat', name: qa.buckwheat || 'Buckwheat' },
        { emoji: '🫘', nameKey: 'beans', name: qa.beans || 'Beans' },
        { emoji: '🌽', nameKey: 'corn', name: qa.corn || 'Corn' },
        { emoji: '🥣', nameKey: 'oatmeal', name: qa.oatmeal || 'Oatmeal' },
        { emoji: '🍙', nameKey: 'barley', name: qa.barley || 'Barley' },
        { emoji: '🫘', nameKey: 'lentils', name: qa.lentils || 'Lentils' },
      ],
    },
    {
      emoji: '🧂', labelKey: 'spices', label: qa.spices || 'Spices & Sauces',
      items: [
        { emoji: '🧂', nameKey: 'salt', name: qa.salt || 'Salt' },
        { emoji: '🌶', nameKey: 'pepperSpice', name: qa.pepperSpice || 'Pepper' },
        { emoji: '🫒', nameKey: 'oliveOil', name: qa.oliveOil || 'Olive oil' },
        { emoji: '🧴', nameKey: 'ketchup', name: qa.ketchup || 'Ketchup' },
        { emoji: '🍯', nameKey: 'honey', name: qa.honey || 'Honey' },
        { emoji: '🫙', nameKey: 'mayo', name: qa.mayo || 'Mayonnaise' },
      ],
    },
    {
      emoji: '🍫', labelKey: 'snacks', label: qa.snacks || 'Snacks & Sweets',
      items: [
        { emoji: '🍫', nameKey: 'chocolate', name: qa.chocolate || 'Chocolate' },
        { emoji: '🍪', nameKey: 'cookies', name: qa.cookies || 'Cookies' },
        { emoji: '🥜', nameKey: 'nuts', name: qa.nuts || 'Nuts' },
        { emoji: '🧃', nameKey: 'juice', name: qa.juice || 'Juice' },
        { emoji: '🍿', nameKey: 'chips', name: qa.chips || 'Chips' },
      ],
    },
  ];
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const STORAGE_TABS: Record<string, { id: string; emoji: string; labels: Record<string, string> }[]> = {
  default: [
    { id: 'fridge', emoji: '🧊', labels: { en: 'Fridge', ru: 'Холодильник', uk: 'Холодильник', lv: 'Ledusskapis' } },
    { id: 'freezer', emoji: '❄️', labels: { en: 'Freezer', ru: 'Морозилка', uk: 'Морозилка', lv: 'Saldētava' } },
    { id: 'pantry', emoji: '🏠', labels: { en: 'Pantry', ru: 'Кладовая', uk: 'Комора', lv: 'Pieliekamais' } },
  ],
};

const BOTTOM_LABELS: Record<string, { add: string; cancel: string; addCount: string }> = {
  en: { add: 'Add', cancel: 'Cancel', addCount: 'Add — {count} products' },
  ru: { add: 'Добавить', cancel: 'Отменить', addCount: 'Добавить — {count} продуктов' },
  uk: { add: 'Додати', cancel: 'Скасувати', addCount: 'Додати — {count} продуктів' },
  lv: { add: 'Pievienot', cancel: 'Atcelt', addCount: 'Pievienot — {count} produktus' },
};

const QuickAddModal = ({ open, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const qa = (t.inventory as any)?.quickAddFlow || {};

  const categories = useMemo(() => buildCategories(t), [t]);

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [storageTab, setStorageTab] = useState('fridge');

  // Quantity popup state
  const [qtyPopupItem, setQtyPopupItem] = useState<QuickItem | null>(null);
  const [qtyPopupSelected, setQtyPopupSelected] = useState<number>(-1);
  const [customQty, setCustomQty] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [byWeight, setByWeight] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'g' | 'kg'>('g');
  const [weightValue, setWeightValue] = useState('');

  if (!open) return null;

  const uLabels = UNIT_LABELS[language] || UNIT_LABELS.en;
  const byWeightLabel = BY_WEIGHT_LABEL[language] || BY_WEIGHT_LABEL.en;

  const allItems = categories.flatMap(c => c.items);
  const filteredItems = search.trim()
    ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const openQtyPopup = (item: QuickItem) => {
    if (selected.has(item.nameKey)) {
      setSelected(prev => {
        const next = new Map(prev);
        next.delete(item.nameKey);
        return next;
      });
      return;
    }
    const { defaultIdx } = getPresetsForItem(item.nameKey, language);
    setQtyPopupItem(item);
    setQtyPopupSelected(defaultIdx);
    setCustomQty('');
    setShowCustom(false);
    setByWeight(false);
    setWeightValue('');
    setWeightUnit('g');
  };

  const confirmQtyPopup = () => {
    if (!qtyPopupItem) return;
    const { presets } = getPresetsForItem(qtyPopupItem.nameKey, language);

    let qty: number;
    let unit: string;
    let displayQty: string;

    if (byWeight && weightValue.trim()) {
      const val = parseFloat(weightValue) || 0;
      qty = val;
      unit = weightUnit;
      displayQty = `${val}${uLabels[weightUnit]}`;
    } else if (showCustom && customQty.trim()) {
      qty = parseFloat(customQty) || 1;
      unit = 'pcs';
      displayQty = `${qty} ${uLabels.pcs}`;
    } else if (qtyPopupSelected >= 0 && qtyPopupSelected < presets.length) {
      const p = presets[qtyPopupSelected];
      qty = p.qty;
      unit = p.unit;
      displayQty = p.label;
    } else {
      const p = presets[0];
      qty = p.qty;
      unit = p.unit;
      displayQty = p.label;
    }

    setSelected(prev => {
      const next = new Map(prev);
      next.set(qtyPopupItem.nameKey, {
        name: qtyPopupItem.name,
        emoji: qtyPopupItem.emoji,
        qty, unit, displayQty,
      });
      return next;
    });
    setQtyPopupItem(null);
  };

  const handleSaveAll = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);
    try {
      const items = Array.from(selected.entries()).map(([, val]) => ({
        user_id: user.id,
        name: val.name,
        quantity: val.qty,
        unit: val.unit,
        storage_location: 'pantry',
        tracking_mode: 'date_only',
      }));
      const { error } = await supabase.from('inventory_items').insert(items as any);
      if (error) throw error;
      toast.success((qa.addedSuccess || '{count} items added').replace('{count}', String(selected.size)));
      onSaved();
      handleClose();
    } catch {
      toast.error(t.inventory.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelected(new Map());
    setSearch('');
    setExpandedCat(null);
    setQtyPopupItem(null);
    onClose();
  };

  const renderItemButton = (item: QuickItem) => {
    const sel = selected.get(item.nameKey);
    const isSelected = !!sel;
    return (
      <button
        key={item.nameKey}
        onClick={() => openQtyPopup(item)}
        className="flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border"
        style={{
          backgroundColor: isSelected ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
          borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        }}
      >
        <div className="flex items-center gap-1.5">
          {isSelected && <Check className="w-3.5 h-3.5" />}
          <span>{item.emoji}</span>
          <span className="truncate">{item.name}</span>
        </div>
        {isSelected && sel && (
          <span className="text-[10px] font-normal text-muted-foreground ml-5">{sel.displayQty}</span>
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
        <motion.div
          className="relative bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col"
          style={{ boxShadow: '0 -4px 40px rgba(124,58,237,0.12)' }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">{qa.title || 'What do you have at home?'}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {qa.subtitle || "Just check items — storage location doesn't matter"}
              </p>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted/50">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={qa.searchPlaceholder || 'Start typing or pick from list...'}
                className="w-full h-11 pl-9 pr-3 rounded-xl border text-sm outline-none bg-secondary/50 border-border focus:border-primary"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-36" style={{ maxHeight: 'calc(92vh - 200px)' }}>
            {filteredItems ? (
              <div className="flex flex-wrap gap-2 py-2">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 w-full text-center">
                    {qa.noResults || 'Nothing found'}
                  </p>
                ) : (
                  filteredItems.map(item => renderItemButton(item))
                )}
              </div>
            ) : (
              <div className="space-y-2 py-1">
                {categories.map(cat => (
                  <div key={cat.labelKey}>
                    <button
                      onClick={() => setExpandedCat(expandedCat === cat.labelKey ? null : cat.labelKey)}
                      className="w-full flex items-center gap-2.5 p-3 rounded-xl transition-colors hover:bg-muted/40 active:scale-[0.99]"
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-sm font-semibold text-foreground flex-1 text-left">{cat.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {cat.items.filter(i => selected.has(i.nameKey)).length > 0 &&
                          `${cat.items.filter(i => selected.has(i.nameKey)).length} ✓`}
                      </span>
                      <motion.span
                        animate={{ rotate: expandedCat === cat.labelKey ? 90 : 0 }}
                        className="text-muted-foreground text-sm"
                      >
                        ›
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {expandedCat === cat.labelKey && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2 px-2 pb-3 pt-1">
                            {cat.items.map(item => renderItemButton(item))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bottom-action-bar"
          >
            <button
              onClick={handleSaveAll}
              disabled={saving || selected.size === 0}
              className="w-full rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground disabled:opacity-50"
              style={{ minHeight: '52px' }}
            >
              {saving
                ? t.inventory.saving
                : selected.size === 0
                  ? (language === 'ru'
                      ? 'Выбери продукты выше'
                      : language === 'uk'
                        ? 'Оберіть продукти вище'
                        : language === 'lv'
                          ? 'Izvēlies produktus augstāk'
                          : 'Select products above')
                  : (language === 'ru'
                      ? `Сохранить — ${selected.size} продуктов`
                      : language === 'uk'
                        ? `Зберегти — ${selected.size} продуктів`
                        : language === 'lv'
                          ? `Saglabāt — ${selected.size} produktus`
                          : `Save — ${selected.size} products`)}
            </button>
          </motion.div>
        </motion.div>

        {/* Quantity Popup */}
        <AnimatePresence>
          {qtyPopupItem && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/20" onClick={() => setQtyPopupItem(null)} />
              <motion.div
                className="relative bg-card w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5 space-y-4"
                style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                exit={{ y: 80 }}
              >
                {/* Item header */}
                <div className="text-center">
                  <span className="text-4xl">{qtyPopupItem.emoji}</span>
                  <p className="text-base font-bold text-foreground mt-1">{qtyPopupItem.name}</p>
                  <p className="text-xs text-muted-foreground">{qa.howMuch || 'How much?'}</p>
                </div>

                {/* Preset chips or by-weight input */}
                {byWeight ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground text-center">{qa.howMuch || 'How much?'}</p>
                    <div className="flex items-center gap-2 justify-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={weightValue}
                        onChange={e => setWeightValue(e.target.value)}
                        placeholder="0"
                        className="w-28 h-12 px-4 rounded-xl border text-lg text-center font-bold outline-none bg-secondary/50 border-border focus:border-primary"
                        autoFocus
                      />
                      <div className="flex rounded-xl border-2 border-border overflow-hidden">
                        <button
                          onClick={() => setWeightUnit('g')}
                          className="px-4 py-2.5 text-sm font-semibold transition-all"
                          style={{
                            backgroundColor: weightUnit === 'g' ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                            color: weightUnit === 'g' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                          }}
                        >
                          {uLabels.g}
                        </button>
                        <button
                          onClick={() => setWeightUnit('kg')}
                          className="px-4 py-2.5 text-sm font-semibold transition-all border-l-2 border-border"
                          style={{
                            backgroundColor: weightUnit === 'kg' ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                            color: weightUnit === 'kg' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                          }}
                        >
                          {uLabels.kg}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => { setByWeight(false); setWeightValue(''); }}
                      className="text-xs text-muted-foreground underline mx-auto block"
                    >
                      ← {qa.backToPresets || 'Back to presets'}
                    </button>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const { presets } = getPresetsForItem(qtyPopupItem.nameKey, language);
                      const isWeighable = WEIGHABLE_ITEMS.has(qtyPopupItem.nameKey);
                      return (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {presets.map((p, i) => (
                            <button
                              key={i}
                              onClick={() => { setQtyPopupSelected(i); setShowCustom(false); }}
                              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                              style={{
                                borderColor: !showCustom && qtyPopupSelected === i ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                backgroundColor: !showCustom && qtyPopupSelected === i ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                                color: !showCustom && qtyPopupSelected === i ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                              }}
                            >
                              {p.label}
                            </button>
                          ))}
                          {/* By weight chip */}
                          {isWeighable && (
                            <button
                              onClick={() => { setByWeight(true); setShowCustom(false); setQtyPopupSelected(-1); }}
                              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            >
                              {byWeightLabel}
                            </button>
                          )}
                          {/* Custom chip */}
                          <button
                            onClick={() => { setShowCustom(true); setQtyPopupSelected(-1); }}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                            style={{
                              borderColor: showCustom ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                              backgroundColor: showCustom ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                              color: showCustom ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                            }}
                          >
                            ✏️ {qa.custom || 'Custom'}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Custom input */}
                    {showCustom && (
                      <input
                        type="number"
                        value={customQty}
                        onChange={e => setCustomQty(e.target.value)}
                        placeholder={qa.enterQty || 'Enter quantity'}
                        className="w-full h-11 px-4 rounded-xl border text-sm text-center font-semibold outline-none bg-secondary/50 border-border focus:border-primary"
                        autoFocus
                      />
                    )}
                  </>
                )}

                {/* Buttons */}
                <button
                  onClick={confirmQtyPopup}
                  className="w-full py-3 rounded-xl text-primary-foreground font-bold text-sm bg-primary active:scale-[0.98] transition-transform"
                >
                  ✓ {qa.addItem || 'Add'}
                </button>
                <button
                  onClick={() => setQtyPopupItem(null)}
                  className="w-full text-center text-sm text-muted-foreground py-1"
                >
                  {qa.cancelBtn || 'Cancel'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickAddModal;
