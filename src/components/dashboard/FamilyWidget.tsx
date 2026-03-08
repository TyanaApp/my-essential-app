import React, { useState, useEffect } from 'react';
import { useFamily, type FamilySubMember } from '@/hooks/useFamily';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FamilyWidget: React.FC = () => {
  const { family, subMembers, familyMode } = useFamily();
  const { user } = useAuth();
  const { t } = useTranslation();
  const f = (t as any).family || {};
  const fm = (t as any).familyMembers || {};

  const [memberCalories, setMemberCalories] = useState<Record<string, number>>({});
  const [selectedMember, setSelectedMember] = useState<FamilySubMember | null>(null);
  const [memberMeals, setMemberMeals] = useState<any[]>([]);

  // Fetch today's calories for all members
  useEffect(() => {
    if (!user || !familyMode || subMembers.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    const fetchCalories = async () => {
      const cals: Record<string, number> = {};
      // Fetch for app users
      const appUserIds = subMembers.filter(m => m.user_id).map(m => m.user_id!);
      if (appUserIds.length > 0) {
        const { data } = await supabase
          .from('meal_entries')
          .select('user_id, total_calories')
          .in('user_id', appUserIds)
          .eq('date', today);

        if (data) {
          data.forEach((e: any) => {
            cals[e.user_id] = (cals[e.user_id] || 0) + (e.total_calories || 0);
          });
        }
      }
      setMemberCalories(cals);
    };
    fetchCalories();
  }, [user, subMembers]);

  const getMemberCalories = (m: FamilySubMember) => {
    if (m.user_id) return memberCalories[m.user_id] || 0;
    return 0;
  };

  const getProgressColor = (consumed: number, target: number) => {
    if (target === 0) return 'hsl(var(--muted))';
    const ratio = consumed / target;
    if (ratio > 1.1) return '#DC2626'; // red
    if (ratio < 0.5 && consumed > 0) return '#EA580C'; // orange
    return '#059669'; // green
  };

  const handleMemberClick = async (m: FamilySubMember) => {
    setSelectedMember(m);
    if (m.user_id) {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('meal_entries')
        .select('*')
        .eq('user_id', m.user_id)
        .eq('date', today);
      setMemberMeals(data || []);
    } else {
      setMemberMeals([]);
    }
  };

  return (
    <>
      <div className="p-4 rounded-2xl bg-card" style={{ boxShadow: '0 2px 16px rgba(124,58,237,0.08)' }}>
        <p className="text-sm font-bold text-foreground mb-3">
          👨‍👩‍👧‍👦 {f.familyLabel || 'Family'} {family.name}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {subMembers.map((m) => {
            const consumed = getMemberCalories(m);
            const target = m.daily_calories_target || 2000;
            const progress = Math.min(consumed / target, 1);
            const color = getProgressColor(consumed, target);

            return (
              <button
                key={m.id}
                onClick={() => handleMemberClick(m)}
                className="flex flex-col items-center gap-1 min-w-[56px] transition-transform hover:scale-105"
              >
                <div className="relative">
                  {/* Progress ring */}
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="21" fill="none" className="stroke-accent" strokeWidth="3" />
                    <circle
                      cx="24" cy="24" r="21"
                      fill="none"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 132} 132`}
                      transform="rotate(-90 24 24)"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg">
                    {m.avatar_emoji}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-foreground truncate max-w-[56px]">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Member detail dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-nasa text-foreground">
              <span className="text-2xl">{selectedMember?.avatar_emoji}</span>
              {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                {selectedMember.age && (
                  <div className="p-3 bg-secondary/20 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground">{fm.age || 'Age'}</p>
                    <p className="text-lg font-bold text-foreground">{selectedMember.age}</p>
                  </div>
                )}
                <div className="p-3 bg-secondary/20 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground">{fm.calorieTarget || 'Calorie target'}</p>
                  <p className="text-lg font-bold text-primary">{selectedMember.daily_calories_target || 2000}</p>
                </div>
              </div>

              {selectedMember.user_id && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{fm.todayMeals || "Today's meals"}</h4>
                  {memberMeals.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{fm.noMealsYet || 'No meals logged yet'}</p>
                  ) : (
                    memberMeals.map((meal: any) => (
                      <div key={meal.id} className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg">
                        <span className="text-sm text-foreground">{meal.custom_name || meal.meal_type}</span>
                        <span className="text-xs font-medium text-primary">{meal.total_calories || 0} kcal</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedMember.allergies && selectedMember.allergies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{fm.allergies || 'Allergies'}</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedMember.allergies.map(a => (
                      <span key={a} className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedMember.goals && selectedMember.goals.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{fm.goals || 'Goals'}</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedMember.goals.map(g => (
                      <span key={g} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{g}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FamilyWidget;
