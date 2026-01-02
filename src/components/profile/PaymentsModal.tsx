import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, Sparkles, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentsModal: React.FC<PaymentsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    monthly: {
      price: '$9.99',
      period: t('perMonth'),
      savings: null,
    },
    yearly: {
      price: '$79.99',
      period: t('perYear'),
      savings: t('save33'),
    },
  };

  const features = [
    'unlimitedAIChats',
    'advancedHealthInsights',
    'wearableSync',
    'prioritySupport',
    'customReports',
    'familySharing',
  ];

  const handleSubscribe = () => {
    toast.info(t('paymentComingSoon'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            {t('upgradeToPro')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/20 hover:border-primary/50'
              }`}
            >
              <p className="font-nasa text-foreground">{t('monthly')}</p>
              <p className="text-2xl font-bold text-primary">{plans.monthly.price}</p>
              <p className="text-sm text-muted-foreground">{plans.monthly.period}</p>
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`p-4 rounded-xl border-2 transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/20 hover:border-primary/50'
              }`}
            >
              {plans.yearly.savings && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-exo">
                  {plans.yearly.savings}
                </span>
              )}
              <p className="font-nasa text-foreground">{t('yearly')}</p>
              <p className="text-2xl font-bold text-primary">{plans.yearly.price}</p>
              <p className="text-sm text-muted-foreground">{plans.yearly.period}</p>
            </button>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-nasa text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('proFeatures')}
            </h4>
            <div className="space-y-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="font-exo text-foreground">{t(feature)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            className="w-full font-nasa text-lg py-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            {t('subscribeTo')} {selectedPlan === 'monthly' ? t('monthly') : t('yearly')}
          </Button>

          <p className="text-center text-sm text-muted-foreground font-exo">
            {t('cancelAnytime')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentsModal;
