import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const T = {
  en: {
    title: 'Your Pro trial ended',
    desc: 'We hope TYANA helped you these 7 days! Your data is safe. Choose a plan to continue at full power.',
    free: 'Free — €0',
    lite: 'Lite — €5.99/mo',
    proLabel: 'Pro',
    perMonth: '/mo',
    continueWithFree: 'Continue with Free',
  },
  ru: {
    title: 'Твой Pro доступ завершился',
    desc: 'Надеемся TYANA помогла тебе эти 7 дней! Твои данные в безопасности. Выбери план чтобы продолжить в полную силу.',
    free: 'Free — €0',
    lite: 'Lite — €5.99/мес',
    proLabel: 'Pro',
    perMonth: '/мес',
    continueWithFree: 'Продолжить с Free',
  },
  lv: {
    title: 'Jūsu Pro izmēģinājums beidzies',
    desc: 'Ceram, ka TYANA jums palīdzēja šajās 7 dienās! Jūsu dati ir drošībā. Izvēlieties plānu, lai turpinātu pilnā apjomā.',
    free: 'Free — €0',
    lite: 'Lite — €5.99/mēn',
    proLabel: 'Pro',
    perMonth: '/mēn',
    continueWithFree: 'Turpināt ar Free',
  },
  uk: {
    title: 'Твій Pro доступ завершився',
    desc: 'Сподіваємось TYANA допомогла тобі ці 7 днів! Твої дані в безпеці. Обери план щоб продовжити на повну.',
    free: 'Free — €0',
    lite: 'Lite — €5.99/міс',
    proLabel: 'Pro',
    perMonth: '/міс',
    continueWithFree: 'Продовжити з Free',
  },
};

interface TrialExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFoundingMember: boolean;
  onUpgrade: () => void;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  open, onOpenChange, isFoundingMember, onUpgrade,
}) => {
  const { language } = useLanguage();
  const { createCheckout } = useSubscription();
  const [processing, setProcessing] = useState<string | null>(null);
  const t = T[language as keyof typeof T] || T.en;

  const handleCheckout = async (plan: 'lite' | 'pro_founding' | 'pro_regular') => {
    setProcessing(plan);
    try {
      await createCheckout(plan);
      onOpenChange(false);
    } catch {
      onUpgrade();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm text-center">
        <DialogHeader>
          <div className="text-5xl mb-2">🌟</div>
          <DialogTitle className="text-xl font-bold">{t.title}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm py-2">{t.desc}</p>
        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={() => handleCheckout(isFoundingMember ? 'pro_founding' : 'pro_regular')}
            className="w-full font-semibold text-white"
            style={{ backgroundColor: '#7C3AED' }}
            disabled={!!processing}
           >
             {(processing === 'pro_founding' || processing === 'pro_regular') && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
             🚀 {t.proLabel} — {isFoundingMember ? '€6.49' : '€12.99'}{t.perMonth}
          </Button>
          <Button
            onClick={() => handleCheckout('lite')}
            variant="outline"
            className="w-full font-semibold"
            disabled={!!processing}
          >
            {processing === 'lite' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            ⭐️ {t.lite}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground text-xs"
          >
            {t.continueWithFree}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredModal;
