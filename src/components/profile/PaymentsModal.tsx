import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';
import { Check, Sparkles, Crown, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentsModal: React.FC<PaymentsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { subscribed, plan, subscriptionEnd, loading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingPortal, setProcessingPortal] = useState(false);

  // Refresh subscription status when modal opens
  useEffect(() => {
    if (open) {
      checkSubscription();
    }
  }, [open, checkSubscription]);

  const features = [
    'unlimitedAIChats',
    'advancedHealthInsights',
    'wearableSync',
    'prioritySupport',
    'customReports',
    'familySharing',
  ];

  const handleSubscribe = async () => {
    setProcessingCheckout(true);
    try {
      await createCheckout(selectedPlan);
      toast.success(t('redirectingToCheckout'));
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('checkoutError'));
    } finally {
      setProcessingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setProcessingPortal(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      toast.error(t('portalError'));
    } finally {
      setProcessingPortal(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            {subscribed ? t('yourSubscription') : t('upgradeToPro')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Subscription Status */}
          {subscribed && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-nasa text-green-500">{t('activeSubscription')}</span>
              </div>
              <p className="text-sm text-muted-foreground font-exo">
                {t('plan')}: {plan === 'monthly' ? SUBSCRIPTION_PLANS.monthly.name : SUBSCRIPTION_PLANS.yearly.name}
              </p>
              <p className="text-sm text-muted-foreground font-exo">
                {t('renewsOn')}: {formatDate(subscriptionEnd)}
              </p>
            </div>
          )}

          {/* Plan Selection - Only show if not subscribed */}
          {!subscribed && (
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
                <p className="text-2xl font-bold text-primary">${SUBSCRIPTION_PLANS.monthly.price}</p>
                <p className="text-sm text-muted-foreground">{t('perMonth')}</p>
              </button>

              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`p-4 rounded-xl border-2 transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary/20 hover:border-primary/50'
                }`}
              >
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-exo">
                  {t('save33')}
                </span>
                <p className="font-nasa text-foreground">{t('yearly')}</p>
                <p className="text-2xl font-bold text-primary">${SUBSCRIPTION_PLANS.yearly.price}</p>
                <p className="text-sm text-muted-foreground">{t('perYear')}</p>
              </button>
            </div>
          )}

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

          {/* Action Buttons */}
          {subscribed ? (
            <Button
              onClick={handleManageSubscription}
              disabled={processingPortal}
              variant="outline"
              className="w-full font-nasa gap-2"
            >
              {processingPortal ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
              {t('manageSubscription')}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSubscribe}
                disabled={processingCheckout || loading}
                className="w-full font-nasa text-lg py-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {processingCheckout ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {t('subscribeTo')} {selectedPlan === 'monthly' ? t('monthly') : t('yearly')}
              </Button>

              <p className="text-center text-sm text-muted-foreground font-exo">
                {t('cancelAnytime')}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentsModal;
