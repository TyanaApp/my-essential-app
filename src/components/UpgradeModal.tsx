import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, Sparkles, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  suggestedPlan?: 'lite' | 'pro_founding' | 'pro_regular';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open, onOpenChange, title, description, suggestedPlan = 'lite',
}) => {
  const { createCheckout } = useSubscription();
  const [processing, setProcessing] = useState(false);

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      await createCheckout(suggestedPlan);
      toast.success('Redirecting to checkout...');
    } catch {
      toast.error('Failed to start checkout');
    } finally {
      setProcessing(false);
    }
  };

  const planLabels = {
    lite: 'Lite (€5.99/mo)',
    pro_founding: 'Pro Founder (€6.49/mo)',
    pro_regular: 'Pro (€12.99/mo)',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Lock className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-exo">{description}</p>
        <Button
          className="w-full mt-2 gap-2 bg-gradient-to-r from-primary to-purple-600"
          onClick={handleUpgrade}
          disabled={processing}
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Upgrade to {planLabels[suggestedPlan]}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
          Maybe later
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
