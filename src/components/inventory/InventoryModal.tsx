import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { InventoryItem } from '@/pages/Inventory';
import { useTranslation } from '@/hooks/useTranslation';
import { useFoodValidation } from '@/hooks/useFoodValidation';
import { getUnits } from '@/lib/units';

const AUTOCOMPLETE = [
  'Milk', 'Eggs', 'Bread', 'Chicken', 'Rice', 'Pasta', 'Tomatoes', 'Onion',
  'Garlic', 'Butter', 'Cheese', 'Yogurt', 'Apples', 'Potatoes', 'Carrots', 'Olive oil',
];

interface Props {
  open: boolean;
  onClose: () => void;
  editItem: InventoryItem | null;
  onSaved: () => void;
  defaultLocation?: string;
}

const InventoryModal = ({ open, onClose, editItem, onSaved, defaultLocation = 'fridge' }: Props) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [location, setLocation] = useState('fridge');
  const [expiresAt, setExpiresAt] = useState('');
  const [price, setPrice] = useState('');
  const [consumptionRate, setConsumptionRate] = useState('normal');
  const [trackingMode, setTrackingMode] = useState('tracked');
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const LOCATIONS = [
    { id: 'fridge', emoji: '🧊', label: t.inventory.fridge },
    { id: 'pantry', emoji: '🏠', label: t.inventory.pantry },
    { id: 'freezer', emoji: '❄️', label: t.inventory.freezer },
  ];

  const CONSUMPTION_RATES = [
    { id: 'slow', emoji: '🐌', label: t.inventory.slowly, desc: t.inventory.weeks },
    { id: 'normal', emoji: '🚶', label: t.inventory.normally, desc: t.inventory.days },
    { id: 'fast', emoji: '⚡️', label: t.inventory.quickly, desc: t.inventory.daily },
  ];

  const TRACKING_MODES = [
    { id: 'tracked', emoji: '📊', label: t.inventory.tracked },
    { id: 'date_only', emoji: '📅', label: t.inventory.dateOnly },
  ];

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setQuantity(String(editItem.quantity));
      setUnit(editItem.unit);
      setLocation(editItem.storage_location);
      setExpiresAt(editItem.expires_at || '');
      setPrice(editItem.price_per_unit ? String(editItem.price_per_unit) : '');
      setConsumptionRate(editItem.consumption_rate || 'normal');
      setTrackingMode(editItem.tracking_mode || 'tracked');
    } else {
      setName(''); setQuantity('1'); setUnit('pcs'); setLocation(defaultLocation);
      setExpiresAt(''); setPrice(''); setConsumptionRate('normal'); setTrackingMode('tracked');
    }
  }, [editItem, open]);

  useEffect(() => {
    if (name.length > 0 && !editItem) {
      const q = name.toLowerCase();
      setSuggestions(AUTOCOMPLETE.filter((a) => a.toLowerCase().includes(q) && a.toLowerCase() !== q));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name, editItem]);

  const { validateFood } = useFoodValidation();

  const handleSave = async () => {
    if (!user || !name.trim()) { toast.error(t.inventory.nameRequired); return; }
    setSaving(true);

    // Validate food item
    const isFood = await validateFood(name.trim());
    if (!isFood) {
      setSaving(false);
      setName('');
      return;
    }

    const payload: any = {
      user_id: user.id,
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      storage_location: location,
      expires_at: expiresAt || null,
      price_per_unit: price ? parseFloat(price) : null,
      consumption_rate: consumptionRate,
      tracking_mode: trackingMode,
    };

    try {
      if (editItem) {
        await supabase.from('inventory_items').update(payload).eq('id', editItem.id);
        toast.success(t.inventory.updated);
      } else {
        // Check for duplicate (case-insensitive, same storage location)
        const { data: existing } = await supabase
          .from('inventory_items')
          .select('id, name, quantity, unit')
          .eq('user_id', user.id)
          .eq('storage_location', location)
          .ilike('name', name.trim());

        if (existing && existing.length > 0) {
          const match = existing[0];
          const newQty = Number(match.quantity || 0) + (parseFloat(quantity) || 1);
          await supabase.from('inventory_items').update({ quantity: newQty } as any).eq('id', match.id);
          toast.success(`${(t.inventory as any).addedToExisting || 'Added to existing'} ${match.name} (${newQty}${match.unit || unit})`);
        } else {
          await supabase.from('inventory_items').insert(payload);
          toast.success(t.inventory.added);
        }
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(t.inventory.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />

        <motion.div
          className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 -4px 40px rgba(124,58,237,0.12)' }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold" style={{ color: '#1E1B4B' }}>
              {editItem ? t.inventory.editItem : t.inventory.addItem}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name with autocomplete */}
            <div className="space-y-1.5 relative">
              <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.productName}</label>
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => name && setSuggestions((s) => s)}
                placeholder={t.inventory.productPlaceholder}
                className="w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[76px] bg-white border rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto" style={{ borderColor: '#DDD6FE' }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F5F3FF] transition-colors"
                      style={{ color: '#1E1B4B' }}
                      onClick={() => { setName(s); setShowSuggestions(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.quantity}</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                  style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.unit}</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#7C3AED] appearance-none"
                  style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Storage location */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.storageLocation}</label>
              <div className="flex gap-2">
                {LOCATIONS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLocation(l.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-[1.5px] text-sm font-medium transition-all"
                    style={{
                      borderColor: location === l.id ? '#7C3AED' : '#DDD6FE',
                      backgroundColor: location === l.id ? '#EDE9FE' : 'white',
                      color: location === l.id ? '#7C3AED' : '#6B7280',
                    }}
                  >
                    {l.emoji} {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consumption rate */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.consumptionRate}</label>
              <div className="flex gap-2">
                {CONSUMPTION_RATES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setConsumptionRate(r.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl border-[1.5px] text-xs font-medium transition-all"
                    style={{
                      borderColor: consumptionRate === r.id ? '#7C3AED' : '#DDD6FE',
                      backgroundColor: consumptionRate === r.id ? '#EDE9FE' : 'white',
                      color: consumptionRate === r.id ? '#7C3AED' : '#6B7280',
                    }}
                  >
                    <span className="text-base">{r.emoji}</span>
                    <span>{r.label}</span>
                    <span className="text-[10px] opacity-70">({r.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tracking mode */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.trackingMode}</label>
              <div className="flex gap-2">
                {TRACKING_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setTrackingMode(m.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-[1.5px] text-sm font-medium transition-all"
                    style={{
                      borderColor: trackingMode === m.id ? '#7C3AED' : '#DDD6FE',
                      backgroundColor: trackingMode === m.id ? '#EDE9FE' : 'white',
                      color: trackingMode === m.id ? '#7C3AED' : '#6B7280',
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.expiryDate}</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{t.inventory.pricePerUnit}</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#7C3AED]"
                style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }}
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#7C3AED' }}
            >
              {saving ? t.inventory.saving : editItem ? t.inventory.updateItem : t.inventory.addItem}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InventoryModal;
