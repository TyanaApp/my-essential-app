import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription, SUBSCRIPTION_PLANS, PlanType } from '@/hooks/useSubscription';
import { Check, Sparkles, Crown, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface PaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  lite: 'Lite',
  pro_founding: 'Pro (Early Bird)',
  pro_regular: 'Pro',
};

const PLAN_COLORS: Record<PlanType, string> = {
  free: 'bg-muted text-muted-foreground',
  lite: 'bg-blue-100 text-blue-700',
  pro_founding: 'bg-amber-100 text-amber-700',
  pro_regular: 'bg-primary/10 text-primary',
};

const FEATURE_KEYS: Record<string, 'lite' | 'proFounder' | 'proRegular'> = {
  lite: 'lite',
  pro_founding: 'proFounder',
  pro_regular: 'proRegular',
};

const PaymentsModal: React.FC<PaymentsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { subscribed, plan, subscriptionEnd, loading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [processingPortal, setProcessingPortal] = useState(false);

  const plans: { key: 'lite' | 'pro_founding' | 'pro_regular' }[] = [
    { key: 'lite' },
    { key: 'pro_founding' },
    { key: 'pro_regular' },
  ];

  useEffect(() => {
    if (open) checkSubscription();
  }, [open, checkSubscription]);

  const handleSubscribe = async (planKey: 'lite' | 'pro_founding' | 'pro_regular') => {
    setProcessingPlan(planKey);
    try {
      await createCheckout(planKey);
      toast.success(t.payments.redirecting);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t.payments.failedCheckout);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setProcessingPortal(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error(t.payments.failedPortal);
    } finally {
      setProcessingPortal(false);
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            {t.payments.subscriptionPlans}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current plan badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-exo">{t.payments.currentPlan}</span>
            <Badge className={PLAN_COLORS[plan]}>{PLAN_LABELS[plan]}</Badge>
            {subscribed && subscriptionEnd && (
              <span className="text-xs text-muted-foreground">
                · {t.payments.renews} {formatDate(subscriptionEnd)}
              </span>
            )}
          </div>

          {/* Plan cards */}
          {plans.map(({ key }) => {
            const p = SUBSCRIPTION_PLANS[key];
            const isActive = plan === key;
            const featureKey = FEATURE_KEYS[key];
            const features = t.payments.features[featureKey];

            return (
              <div
                key={key}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-nasa text-foreground text-sm">{p.name}</h3>
                    <p className="text-xl font-bold text-primary">
                      {p.currency}{p.price}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                  </div>
                  {isActive && (
                    <Badge className="bg-green-100 text-green-700">{t.payments.active}</Badge>
                  )}
                </div>

                <div className="space-y-1.5 mb-3">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-exo text-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                {isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleManageSubscription}
                    disabled={processingPortal}
                  >
                    {processingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    {t.payments.manageSubscription}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                    onClick={() => handleSubscribe(key)}
                    disabled={!!processingPlan || loading}
                  >
                    {processingPlan === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {plan === 'free' ? t.payments.subscribe : t.payments.switchPlan}
                  </Button>
                )}
              </div>
            );
          })}

          <p className="text-center text-xs text-muted-foreground font-exo">
            {t.payments.cancelAnytime}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentsModal;
