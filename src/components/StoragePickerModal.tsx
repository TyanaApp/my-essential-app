import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useTranslation } from '@/hooks/useTranslation';

interface StoragePickerModalProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  onSelect: (location: string) => void;
}

const FRIDGE_ITEMS = ['молоко', 'milk', 'piens', 'яйца', 'eggs', 'olas', 'мясо', 'meat', 'gaļa', 'рыба', 'fish', 'zivis', 'сыр', 'cheese', 'siers', 'йогурт', 'yogurt', 'jogurts', 'овощи', 'vegetables', 'dārzeņi', 'фрукты', 'fruits', 'augļi', 'масло сливочное', 'butter', 'sviests', 'м\'ясо', 'риба', 'яйця', 'молоко'];
const PANTRY_ITEMS = ['рис', 'rice', 'rīsi', 'макароны', 'pasta', 'makaroni', 'мука', 'flour', 'milti', 'сахар', 'sugar', 'cukurs', 'соль', 'salt', 'sāls', 'консервы', 'canned', 'konservēti', 'крупы', 'grains', 'масло растительное', 'oil', 'eļļa', 'кофе', 'coffee', 'kafija', 'чай', 'tea', 'tēja', 'борошно', 'цукор', 'сіль', 'макарони'];
const FREEZER_ITEMS = ['пельмени', 'dumplings', 'pelmeņi', 'ягоды', 'berries', 'ogas', 'зелень', 'herbs', 'garšaugi', 'хлеб', 'bread', 'maize', 'мороженое', 'ice cream', 'saldējums', 'вареники', 'хліб'];

function suggestStorage(name: string): string {
  const lower = name.toLowerCase();
  if (FREEZER_ITEMS.some(i => lower.includes(i))) return 'freezer';
  if (PANTRY_ITEMS.some(i => lower.includes(i))) return 'pantry';
  if (FRIDGE_ITEMS.some(i => lower.includes(i))) return 'fridge';
  return 'fridge'; // default
}

const StoragePickerModal = ({ open, onClose, itemName, onSelect }: StoragePickerModalProps) => {
  const { t } = useTranslation();
  const suggestion = suggestStorage(itemName);

  const locations = [
    { id: 'fridge', emoji: '🧊', label: (t.inventory as any)?.fridge || 'Fridge' },
    { id: 'pantry', emoji: '🏠', label: (t.inventory as any)?.pantry || 'Pantry' },
    { id: 'freezer', emoji: '❄️', label: (t.inventory as any)?.freezer || 'Freezer' },
  ];

  const suggestionLabel: Record<string, string> = {
    en: `💡 Recommended: ${locations.find(l => l.id === suggestion)?.label}`,
    ru: `💡 Рекомендуем: ${locations.find(l => l.id === suggestion)?.label}`,
    lv: `💡 Ieteicam: ${locations.find(l => l.id === suggestion)?.label}`,
    uk: `💡 Рекомендуємо: ${locations.find(l => l.id === suggestion)?.label}`,
  };

  const titleMap: Record<string, string> = {
    en: `Where to store ${itemName}?`,
    ru: `Куда положить ${itemName}?`,
    lv: `Kur nolikt ${itemName}?`,
    uk: `Куди покласти ${itemName}?`,
  };

  const lang = ((t as any)._lang || 'en') as string;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-foreground">{titleMap[lang] || titleMap.en}</DrawerTitle>
          <DrawerDescription className="text-muted-foreground text-sm mt-1">
            {suggestionLabel[lang] || suggestionLabel.en}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 flex gap-3">
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => { onSelect(loc.id); onClose(); }}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl text-sm font-semibold transition-all border-2"
              style={{
                borderColor: suggestion === loc.id ? '#7C3AED' : '#E5E7EB',
                backgroundColor: suggestion === loc.id ? '#EDE9FE' : 'white',
                color: '#1E1B4B',
              }}
            >
              <span className="text-3xl">{loc.emoji}</span>
              <span>{loc.label}</span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default StoragePickerModal;
