import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

export const useFoodValidation = () => {
  const { language } = useLanguage();
  const { t } = useTranslation();

  const validateFood = async (itemName: string): Promise<boolean> => {
    if (!itemName || itemName.trim().length === 0) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-food-item', {
        body: { itemName: itemName.trim(), language },
      });

      if (error || !data) return true; // Allow on error

      if (!data.isFood) {
        const msgs: Record<string, string> = {
          en: `"${itemName}" doesn't look like a food item`,
          ru: `«${itemName}» не похоже на продукт питания`,
          lv: `"${itemName}" neizskatās pēc pārtikas produkta`,
          uk: `«${itemName}» не схоже на продукт харчування`,
        };
        toast.error(data.reason || msgs[language] || msgs.en);
        return false;
      }

      return true;
    } catch {
      return true; // Allow on error
    }
  };

  return { validateFood };
};
