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
      <div className="inline-flex items-center gap-1.5">
        <Link to="/privacy" className="text-[11px] font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors">
          {labels.privacy}
        </Link>
        <span className="text-[11px] text-muted-foreground/30">·</span>
        <Link to="/terms" className="text-[11px] font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors">
          {labels.terms}
        </Link>
        <span className="text-[11px] text-muted-foreground/30">·</span>
        <Link to="/cookies" className="text-[11px] font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors">
          {labels.cookie}
        </Link>
      </div>
    </div>
  );
};

export default LegalFooterPill;
