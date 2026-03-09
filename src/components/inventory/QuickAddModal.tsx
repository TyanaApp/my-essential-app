import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getCategoriesForLocation,
  getAllProducts,
  LOCATION_LABELS,
  LOCATION_EMOJIS,
  SMART_SUGGESTION_TEXTS,
  type QuickProduct,
  type QuickCategory,
} from './quickAddData';
import liverIcon from '@/assets/liver-icon.png';

const IMAGE_EMOJI_MAP: Record<string, string> = {
  'img:liver': liverIcon,
};

const renderEmoji = (emoji: string, size = 'text-base') => {
  const imgSrc = IMAGE_EMOJI_MAP[emoji];
  if (imgSrc) {
    return <img src={imgSrc} alt="" className="w-5 h-5 inline-block object-contain" />;
  }
  return <span className={size}>{emoji}</span>;
};

interface SelectedItem {
  product: QuickProduct;
  qty: number;
  unit: string;
  storageOverride?: string; // if user accepted smart suggestion
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  activeTab?: string;
}

const UNIT_LABELS: Record<string, Record<string, string>> = {
  en: { pcs: 'pcs', kg: 'kg', g: 'g', l: 'L', ml: 'ml', pack: 'pack' },
  ru: { pcs: 'шт', kg: 'кг', g: 'г', l: 'л', ml: 'мл', pack: 'упак' },
  uk: { pcs: 'шт', kg: 'кг', g: 'г', l: 'л', ml: 'мл', pack: 'упак' },
  lv: { pcs: 'gab', kg: 'kg', g: 'g', l: 'L', ml: 'ml', pack: 'iepak' },
};

const BOTTOM_LABELS: Record<string, { add: string; cancel: string; addCount: string; saving: string }> = {
  en: { add: 'Add', cancel: 'Cancel', addCount: 'Add — {count} products', saving: 'Saving...' },
  ru: { add: 'Добавить', cancel: 'Отменить', addCount: 'Добавить — {count} продуктов', saving: 'Сохраняем...' },
  uk: { add: 'Додати', cancel: 'Скасувати', addCount: 'Додати — {count} продуктів', saving: 'Зберігаємо...' },
  lv: { add: 'Pievienot', cancel: 'Atcelt', addCount: 'Pievienot — {count} produktus', saving: 'Saglabā...' },
};

const HEADER_LABELS: Record<string, { title: string; subtitle: string }> = {
  en: { title: '⚡ Quick Add', subtitle: 'Tap items to add them' },
  ru: { title: '⚡ Быстрое добавление', subtitle: 'Нажмите на продукты чтобы добавить' },
  uk: { title: '⚡ Швидке додавання', subtitle: 'Натисніть на продукти щоб додати' },
  lv: { title: '⚡ Ātrā pievienošana', subtitle: 'Nospiediet produktus lai pievienotu' },
};

const SEARCH_PLACEHOLDER: Record<string, string> = {
  en: 'Search products...',
  ru: 'Поиск продуктов...',
  uk: 'Пошук продуктів...',
  lv: 'Meklēt produktus...',
};

const NO_RESULTS: Record<string, string> = {
  en: 'Nothing found',
  ru: 'Ничего не найдено',
  uk: 'Нічого не знайдено',
  lv: 'Nekas nav atrasts',
};

const ADDED_SUCCESS: Record<string, string> = {
  en: '{count} items added',
  ru: '{count} продуктов добавлено',
  uk: '{count} продуктів додано',
  lv: '{count} produkti pievienoti',
};

const QuickAddModal = ({ open, onClose, onSaved, activeTab = 'fridge' }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const storageLocation = activeTab === 'expiring' ? 'fridge' : activeTab;

  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ product: QuickProduct; suggestedLoc: string } | null>(null);

  const categories = useMemo(() => getCategoriesForLocation(storageLocation), [storageLocation]);
  const allProducts = useMemo(() => getAllProducts(), []);

  const getName = (p: QuickProduct) => {
    const lang = language as keyof typeof p.names;
    return p.names[lang] || p.names.en;
  };

  // Search across ALL products
  const filteredItems = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allProducts.filter(p => {
      const name = (p.names[language as keyof typeof p.names] || p.names.en).toLowerCase();
      return name.includes(q);
    });
  }, [search, allProducts, language]);

  if (!open) return null;

  const uLabels = UNIT_LABELS[language] || UNIT_LABELS.en;
  const bLabels = BOTTOM_LABELS[language] || BOTTOM_LABELS.en;
  const hLabels = HEADER_LABELS[language] || HEADER_LABELS.en;
  const locLabels = LOCATION_LABELS[storageLocation] || LOCATION_LABELS.fridge;
  const locEmoji = LOCATION_EMOJIS[storageLocation] || '🧊';
  const smartTexts = SMART_SUGGESTION_TEXTS[language] || SMART_SUGGESTION_TEXTS.en;
  const getUnitLabel = (unit: string) => uLabels[unit] || unit;

  const toggleItem = (product: QuickProduct) => {
    if (selected.has(product.key)) {
      setSelected(prev => { const n = new Map(prev); n.delete(product.key); return n; });
      return;
    }
    // Check if product's natural location differs from current tab
    if (product.naturalLocation !== storageLocation) {
      setSuggestion({ product, suggestedLoc: product.naturalLocation });
      return;
    }
    addItem(product);
  };

  const addItem = (product: QuickProduct, overrideLocation?: string) => {
    setSelected(prev => {
      const n = new Map(prev);
      n.set(product.key, {
        product,
        qty: product.defaultQty,
        unit: product.defaultUnit,
        storageOverride: overrideLocation,
      });
      return n;
    });
  };

  const handleSuggestionAccept = () => {
    if (!suggestion) return;
    addItem(suggestion.product, suggestion.suggestedLoc);
    setSuggestion(null);
  };

  const handleSuggestionReject = () => {
    if (!suggestion) return;
    addItem(suggestion.product); // keep in current location
    setSuggestion(null);
  };

  const handleSaveAll = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);
    try {
      const items = Array.from(selected.values()).map(val => ({
        user_id: user.id,
        name: getName(val.product),
        quantity: val.qty,
        unit: val.unit,
        storage_location: val.storageOverride || storageLocation,
        tracking_mode: 'date_only',
      }));
      const { error } = await supabase.from('inventory_items').insert(items as any);
      if (error) throw error;
      toast.success((ADDED_SUCCESS[language] || ADDED_SUCCESS.en).replace('{count}', String(selected.size)));
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
    setSuggestion(null);
    onClose();
  };

  const renderProductButton = (product: QuickProduct, showLocationTag = false) => {
    const sel = selected.get(product.key);
    const isSelected = !!sel;
    const name = getName(product);
    return (
      <button
        key={product.key}
        onClick={() => toggleItem(product)}
        className="flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border"
        style={{
          backgroundColor: isSelected ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
          borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        }}
      >
        <div className="flex items-center gap-1.5">
          {isSelected && <Check className="w-3.5 h-3.5" />}
          <span>{product.emoji}</span>
          <span className="truncate">{name}</span>
        </div>
        {isSelected && sel && (
          <span className="text-[10px] font-normal text-muted-foreground ml-5">
            {sel.qty} {getUnitLabel(sel.unit)}
            {sel.storageOverride && ` → ${LOCATION_EMOJIS[sel.storageOverride]}`}
          </span>
        )}
        {showLocationTag && !isSelected && product.naturalLocation !== storageLocation && (
          <span className="text-[10px] text-muted-foreground ml-5">
            {LOCATION_EMOJIS[product.naturalLocation]} {(LOCATION_LABELS[product.naturalLocation]?.[language]) || product.naturalLocation}
          </span>
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
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
          {/* Header with location */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {hLabels.title} → {locEmoji} {locLabels[language] || locLabels.en}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{hLabels.subtitle}</p>
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
                placeholder={SEARCH_PLACEHOLDER[language] || SEARCH_PLACEHOLDER.en}
                className="w-full h-11 pl-9 pr-3 rounded-xl border text-sm outline-none bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-36" style={{ maxHeight: 'calc(92vh - 220px)' }}>
            {filteredItems ? (
              <div className="flex flex-wrap gap-2 py-2">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 w-full text-center">
                    {NO_RESULTS[language] || NO_RESULTS.en}
                  </p>
                ) : (
                  filteredItems.map(item => renderProductButton(item, true))
                )}
              </div>
            ) : (
              <div className="space-y-2 py-1">
                {categories.map(cat => {
                  const catLabel = cat.labels[language as keyof typeof cat.labels] || cat.labels.en;
                  const selectedInCat = cat.items.filter(i => selected.has(i.key)).length;
                  return (
                    <div key={cat.key}>
                      <button
                        onClick={() => setExpandedCat(expandedCat === cat.key ? null : cat.key)}
                        className="w-full flex items-center gap-2.5 p-3 rounded-xl transition-colors hover:bg-muted/40 active:scale-[0.99]"
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <span className="text-sm font-semibold text-foreground flex-1 text-left">{catLabel}</span>
                        {selectedInCat > 0 && (
                          <span className="text-xs text-muted-foreground">{selectedInCat} ✓</span>
                        )}
                        <motion.span
                          animate={{ rotate: expandedCat === cat.key ? 90 : 0 }}
                          className="text-muted-foreground text-sm"
                        >
                          ›
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {expandedCat === cat.key && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-wrap gap-2 px-2 pb-3 pt-1">
                              {cat.items.map(item => renderProductButton(item))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="sticky bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 space-y-2" style={{ boxShadow: '0 -4px 20px rgba(124,58,237,0.12)' }}>
            <button
              onClick={handleSaveAll}
              disabled={saving || selected.size === 0}
              className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-primary-foreground disabled:opacity-40 active:scale-[0.98] transition-transform"
              style={{ minHeight: '52px' }}
            >
              {saving
                ? bLabels.saving
                : selected.size > 0
                  ? bLabels.addCount.replace('{count}', String(selected.size))
                  : bLabels.add}
            </button>
            <button
              onClick={handleClose}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              {bLabels.cancel}
            </button>
          </div>
        </motion.div>

        {/* Smart Suggestion Popup */}
        <AnimatePresence>
          {suggestion && (
            <motion.div
              className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/20" onClick={() => setSuggestion(null)} />
              <motion.div
                className="relative bg-card w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5 space-y-4"
                style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                exit={{ y: 80 }}
              >
                <div className="text-center">
                  <span className="text-4xl">{suggestion.product.emoji}</span>
                  <p className="text-sm text-foreground mt-2">
                    {smartTexts.message(
                      getName(suggestion.product),
                      (LOCATION_LABELS[suggestion.suggestedLoc]?.[language]) || suggestion.suggestedLoc
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSuggestionAccept}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary active:scale-[0.98] transition-transform"
                  >
                    {smartTexts.yes}
                  </button>
                  <button
                    onClick={handleSuggestionReject}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {smartTexts.no}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickAddModal;
