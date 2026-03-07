import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Goal = 'lose' | 'gain' | 'balanced' | 'family' | 'time' | 'budget';

interface GoalChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GoalChangeModal: React.FC<GoalChangeModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [saving, setSaving] = useState(false);

  const GOALS: { id: Goal; emoji: string; labelKey: keyof typeof t.onboarding }[] = [
    { id: 'lose', emoji: '🏃', labelKey: 'goalLose' },
    { id: 'gain', emoji: '💪', labelKey: 'goalGain' },
    { id: 'balanced', emoji: '🥗', labelKey: 'goalBalanced' },
    { id: 'family', emoji: '👨‍👩‍👧', labelKey: 'goalFamily' },
    { id: 'time', emoji: '⚡️', labelKey: 'goalTime' },
    { id: 'budget', emoji: '💰', labelKey: 'goalBudget' },
  ];

  useEffect(() => {
    if (!open || !user) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_goals')
        .select('goals')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.goals) setGoals(data.goals as Goal[]);
    };
    load();
  }, [open, user]);

  const toggleGoal = (g: Goal) => {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleSave = async () => {
    if (!user || goals.length === 0) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_goals')
      .update({ goals } as any)
      .eq('user_id', user.id);
    setSaving(false);

    if (error) {
      toast.error(t.common.error);
    } else {
      toast.success((t as any).trial?.goalUpdated || 'Goal updated! Recipes will adapt.');
      onOpenChange(false);
    }
  };

  const chipStyle = (selected: boolean) => ({
    background: selected ? 'rgba(124,58,237,0.15)' : 'transparent',
    border: selected ? '2px solid #7C3AED' : '2px solid hsl(var(--border))',
    borderRadius: 16,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground">
            🎯 {(t as any).trial?.changeGoal || 'Change my goal'}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">
          {t.onboarding.step2Sub}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              className="flex items-center gap-3 px-4 py-3 text-left transition-all text-foreground"
              style={chipStyle(goals.includes(g.id))}
            >
              <span style={{ fontSize: 20 }}>{g.emoji}</span>
              <span className="text-sm font-medium">{t.onboarding[g.labelKey]}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || goals.length === 0}
            className="flex-1"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalChangeModal;
