import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GoalChangeModal from '@/components/profile/GoalChangeModal';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const activityLevels = [
  { value: 'low', emoji: '🛋' },
  { value: 'normal', emoji: '🚶' },
  { value: 'active', emoji: '🏃' },
  { value: 'very_active', emoji: '🔥' },
] as const;

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightInput, setHeightInput] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [activityLevel, setActivityLevel] = useState('normal');
  const [saving, setSaving] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const ep = (t as any).editProfile || {};

  useEffect(() => {
    if (!open || !user) return;
    // Load profile data
    if (profile) {
      setDisplayName(profile.display_name || '');
      setGender(profile.gender || '');
      setBirthDate(profile.birth_date || '');
    }
    // Load goals data (weight, height, age, activity)
    const loadGoals = async () => {
      const { data } = await supabase
        .from('user_goals')
        .select('weight_kg, height_cm, age, activity_level')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        if (data.weight_kg) setWeightInput(String(data.weight_kg));
        if (data.height_cm) setHeightInput(String(data.height_cm));
        setActivityLevel(data.activity_level || 'normal');
      }
    };
    loadGoals();
  }, [open, profile, user]);

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const toKg = (val: number, unit: string) => unit === 'lbs' ? Math.round(val * 0.453592) : val;
  const toCm = (val: number, unit: string) => unit === 'ft' ? Math.round(val * 30.48) : val;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Save profile fields
    const { error: profileError } = await updateProfile({
      display_name: displayName,
      gender: gender || null,
      birth_date: birthDate || null,
    });

    if (profileError) {
      toast.error(t.common.error);
      setSaving(false);
      return;
    }

    // Compute values in kg/cm
    const weightKg = toKg(Number(weightInput) || 0, weightUnit);
    const heightCm = toCm(Number(heightInput) || 0, heightUnit);
    const age = calculateAge(birthDate);

    // Upsert user_goals with body data
    const goalsUpdate: Record<string, any> = {
      weight_kg: weightKg || null,
      height_cm: heightCm || null,
      age: age || null,
      activity_level: activityLevel,
    };

    const { data: existingGoals } = await supabase
      .from('user_goals')
      .select('id, goals')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingGoals) {
      await supabase.from('user_goals').update(goalsUpdate).eq('user_id', user.id);
    } else {
      await supabase.from('user_goals').insert({ user_id: user.id, ...goalsUpdate });
    }

    // Recalculate calories if we have all data
    if (weightKg && heightCm && age) {
      const activityMultiplier: Record<string, number> = {
        low: 1.2, normal: 1.375, moderate: 1.375, active: 1.55, very_active: 1.725,
      };
      const mult = activityMultiplier[activityLevel] || 1.375;
      const BMR = gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      let TDEE = BMR * mult;

      const userGoals: string[] = existingGoals?.goals || [];
      if (userGoals.includes('lose_weight')) TDEE -= 400;
      if (userGoals.includes('gain_muscle')) TDEE += 300;

      const target = Math.round(TDEE);
      await supabase.from('user_goals').update({ daily_calories_target: target } as any).eq('user_id', user.id);

      const kcalUnit = (t as any).diary?.kcalUnit || 'kcal';
      toast.success(`${ep.caloriesRecalculated || 'Calories recalculated'}: ${target} ${kcalUnit}/${ep.dayShort || 'day'} ✓`);
    } else {
      toast.success('✓');
    }

    setSaving(false);
    onOpenChange(false);
  };

  const activityLabels: Record<string, string> = {
    low: ep.actLow || t.onboarding?.sedentary || '🛋 Low',
    normal: ep.actNormal || t.onboarding?.lightlyActive || '🚶 Normal',
    active: ep.actActive || t.onboarding?.moderatelyActive || '🏃 Active',
    very_active: ep.actVeryActive || t.onboarding?.veryActive || '🔥 Very active',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground">{t.profile.editProfile}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label className="font-exo text-muted-foreground">{t.profile.displayName}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="font-exo text-muted-foreground">{t.profile.gender}</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t.profile.male}</SelectItem>
                <SelectItem value="female">{t.profile.female}</SelectItem>
                <SelectItem value="other">{t.profile.other}</SelectItem>
                <SelectItem value="prefer_not_to_say">{t.profile.preferNotToSay}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label className="font-exo text-muted-foreground">{ep.weight || 'Weight'}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="70"
                className="bg-secondary/50 border-border flex-1"
              />
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['kg', 'lbs'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setWeightUnit(u)}
                    className={`px-3 py-2 text-sm font-exo transition-colors ${
                      weightUnit === u
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Height */}
          <div className="space-y-2">
            <Label className="font-exo text-muted-foreground">{ep.height || 'Height'}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                placeholder="170"
                className="bg-secondary/50 border-border flex-1"
              />
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['cm', 'ft'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setHeightUnit(u)}
                    className={`px-3 py-2 text-sm font-exo transition-colors ${
                      heightUnit === u
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {u === 'cm' ? (ep.cm || 'cm') : (ep.ft || 'ft')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label className="font-exo text-muted-foreground">{t.profile.dateOfBirth}</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            {birthDate && (
              <p className="text-xs text-muted-foreground font-exo">
                {ep.age || 'Age'}: {calculateAge(birthDate)} {ep.years || 'years'}
              </p>
            )}
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <Label className="font-exo text-muted-foreground">{ep.activityLevel || 'Activity level'}</Label>
            <div className="grid grid-cols-2 gap-2">
              {activityLevels.map(({ value, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActivityLevel(value)}
                  className={`p-3 rounded-xl text-sm font-exo text-left transition-all border ${
                    activityLevel === value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  {activityLabels[value]}
                </button>
              ))}
            </div>
          </div>

          {/* Change Goal button */}
          <Button
            variant="outline"
            onClick={() => setGoalModalOpen(true)}
            className="w-full font-exo text-sm"
            style={{ borderColor: '#DDD6FE', color: '#7C3AED' }}
          >
            🎯 {(t as any).trial?.changeGoal || 'Change my goal'}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 font-exo"
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 font-nasa"
          >
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>
      </DialogContent>
      <GoalChangeModal open={goalModalOpen} onOpenChange={setGoalModalOpen} />
    </Dialog>
  );
};

export default EditProfileModal;
