import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const FRIENDLY_MSGS: Record<string, string> = {
  en: "😄 That doesn't look like food! Please add only food items.",
  ru: '😄 Это не похоже на еду! Добавляй только продукты питания.',
  lv: '😄 Tas neizskatās pēc ēdiena! Pievienojiet tikai pārtikas produktus.',
  uk: '😄 Це не схоже на їжу! Додавай лише продукти харчування.',
};

export const useFoodValidation = () => {
  const { language } = useLanguage();

  const validateFood = async (itemName: string): Promise<boolean> => {
    if (!itemName || itemName.trim().length === 0) return false;

    try {
      const { data, error } = await supabase.functions.invoke('validate-food-item', {
        body: { itemName: itemName.trim(), language },
      });

      if (error || !data) return true; // Allow on error

      if (!data.isFood) {
        toast.error(FRIENDLY_MSGS[language] || FRIENDLY_MSGS.en);
        return false;
      }

      return true;
    } catch {
      return true; // Allow on error
    }
  };

  return { validateFood };
};
