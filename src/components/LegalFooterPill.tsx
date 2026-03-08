import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const legalLabels: Record<string, { privacy: string; terms: string; cookie: string }> = {
  en: { privacy: 'Privacy', terms: 'Terms', cookie: 'Cookie' },
  ru: { privacy: 'Конфиденциальность', terms: 'Условия', cookie: 'Cookie' },
  uk: { privacy: 'Конфіденційність', terms: 'Умови', cookie: 'Cookie' },
  lv: { privacy: 'Privātums', terms: 'Noteikumi', cookie: 'Sīkdatnes' },
};

const LegalFooterPill = () => {
  const { language } = useTranslation();
  const labels = legalLabels[language] || legalLabels.en;

  return (
    <div className="flex justify-center">
      <div
        className="inline-flex items-center gap-1 rounded-full px-4 sm:px-5 py-2 flex-wrap justify-center"
        style={{ background: 'rgba(124, 58, 237, 0.08)' }}
      >
        <Link to="/privacy" className="text-[11px] sm:text-xs font-medium text-muted-foreground hover:underline whitespace-nowrap">
          {labels.privacy}
        </Link>
        <span className="text-[11px] sm:text-xs text-muted-foreground/50">·</span>
        <Link to="/terms" className="text-[11px] sm:text-xs font-medium text-muted-foreground hover:underline whitespace-nowrap">
          {labels.terms}
        </Link>
        <span className="text-[11px] sm:text-xs text-muted-foreground/50">·</span>
        <Link to="/cookies" className="text-[11px] sm:text-xs font-medium text-muted-foreground hover:underline whitespace-nowrap">
          {labels.cookie}
        </Link>
      </div>
    </div>
  );
};

export default LegalFooterPill;
