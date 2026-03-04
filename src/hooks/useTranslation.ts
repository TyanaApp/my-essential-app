import { useLanguage } from '@/contexts/LanguageContext';
import { translations, TranslationKeys } from '@/i18n/translations';

export const useTranslation = () => {
  const { language } = useLanguage();
  const t = (translations[language as keyof typeof translations] || translations.en) as TranslationKeys;
  return { t, language };
};
