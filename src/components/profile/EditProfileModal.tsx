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

const DISLIKE_CHIPS = [
  { id: 'fish', emoji: '🐟' },
  { id: 'broccoli', emoji: '🥦' },
  { id: 'onion', emoji: '🧅' },
  { id: 'mushrooms', emoji: '🍄' },
  { id: 'bell_pepper', emoji: '🫑' },
  { id: 'eggplant', emoji: '🍆' },
  { id: 'spinach', emoji: '🥬' },
  { id: 'legumes', emoji: '🫘' },
  { id: 'offal', emoji: '🥩' },
  { id: 'spicy', emoji: '🌶' },
  { id: 'dairy', emoji: '🥛' },
  { id: 'garlic', emoji: '🧄' },
];

const WEIGHT_LOSS_SPEEDS = [
  { id: 'slow', emoji: '🐢' },
  { id: 'moderate', emoji: '⚖️' },
  { id: 'fast', emoji: '🏃' },
  { id: 'intense', emoji: '⚡' },
] as const;

const MUSCLE_GAIN_SPEEDS = [
  { id: 'slow', emoji: '🐢' },
  { id: 'moderate', emoji: '⚖️' },
  { id: 'active', emoji: '🏋️' },
] as const;

const SURPLUS_MAP: Record<string, number> = { slow: 150, moderate: 200, active: 300 };
const DEFICIT_MAP: Record<string, number> = { slow: -250, moderate: -500, fast: -750, intense: -1000 };

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
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [dislikedFreeText, setDislikedFreeText] = useState('');
  const [weightLossSpeed, setWeightLossSpeed] = useState('moderate');
  const [muscleGainSpeed, setMuscleGainSpeed] = useState('moderate');
  const [currentGoals, setCurrentGoals] = useState<string[]>([]);

  const ep = (t as any).editProfile || {};
  const dl = (t as any).dislikes || {};
  const wls = (t as any).weightLossSpeed || {};

  const getSpeedLabel = (id: string) => {
    const labels: Record<string, Record<string, string>> = {
      slow: { ru: 'Медленно', en: 'Slowly', uk: 'Повільно', lv: 'Lēni' },
      moderate: { ru: 'Умеренно', en: 'Moderate', uk: 'Помірно', lv: 'Mēreni' },
      fast: { ru: 'Быстро', en: 'Fast', uk: 'Швидко', lv: 'Ātri' },
      intense: { ru: 'Интенсивно', en: 'Intense', uk: 'Інтенсивно', lv: 'Intensīvi' },
    };
    const lang = (t as any)._lang || 'ru';
    return wls[id] || labels[id]?.[lang] || labels[id]?.en || id;
  };
  const getSpeedDesc = (id: string) => {
    const descs: Record<string, string> = { slow: '−250', moderate: '−500', fast: '−750', intense: '−1000' };
    return `${descs[id] || '−500'} kcal`;
  };

  const hasLoseGoal = currentGoals.some(g => g === 'lose_weight' || g === 'lose');
  const hasGainGoal = currentGoals.some(g => g === 'build_muscle' || g === 'gain');

  const getGainSpeedLabel = (id: string) => {
    const labels: Record<string, Record<string, string>> = {
      slow: { ru: 'Медленно', en: 'Slowly', uk: 'Повільно', lv: 'Lēni' },
      moderate: { ru: 'Умеренно', en: 'Moderate', uk: 'Помірно', lv: 'Mēreni' },
      active: { ru: 'Активно', en: 'Active', uk: 'Активно', lv: 'Aktīvi' },
    };
    const lang = (t as any)._lang || 'ru';
    return labels[id]?.[lang] || labels[id]?.en || id;
  };
  const getGainSpeedDesc = (id: string) => {
    const descs: Record<string, string> = { slow: '+150', moderate: '+200', active: '+300' };
    return `${descs[id] || '+200'} kcal`;
  };

  const getDislikeLabel = (id: string) => dl[id] || id;

  // Map chip IDs to known dislike labels for matching
  const knownDislikeLabels = DISLIKE_CHIPS.map(c => ({ id: c.id, label: getDislikeLabel(c.id) }));

  useEffect(() => {
    if (!open || !user) return;
    if (profile) {
      setDisplayName(profile.display_name || '');
      setGender(profile.gender || '');
      setBirthDate(profile.birth_date || '');
    }
    const loadGoals = async () => {
      const { data } = await supabase
        .from('user_goals')
        .select('weight_kg, height_cm, age, activity_level, disliked_foods, weight_loss_speed, muscle_gain_speed, goals')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        if (data.weight_kg) setWeightInput(String(data.weight_kg));
        if (data.height_cm) setHeightInput(String(data.height_cm));
        setActivityLevel(data.activity_level || 'moderate');
        setWeightLossSpeed((data as any).weight_loss_speed || 'moderate');
        setMuscleGainSpeed((data as any).muscle_gain_speed || 'moderate');
        setCurrentGoals((data as any).goals || []);
        // Parse existing dislikes back into chips + free text
        const existing: string[] = (data as any).disliked_foods || [];
        const chipIds: string[] = [];
        const freeItems: string[] = [];
        for (const item of existing) {
          const match = knownDislikeLabels.find(k => k.label.toLowerCase() === item.toLowerCase());
          if (match) chipIds.push(match.id);
          else freeItems.push(item);
        }
        setDislikedFoods(chipIds);
        setDislikedFreeText(freeItems.join(', '));
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

  const toggleDislike = (id: string) => setDislikedFoods(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const buildDislikeArray = (): string[] => {
    const items = [...dislikedFoods.map(id => getDislikeLabel(id))];
    if (dislikedFreeText.trim()) {
      items.push(...dislikedFreeText.split(',').map(s => s.trim()).filter(Boolean));
    }
    return items;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

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

    const weightKg = toKg(Number(weightInput) || 0, weightUnit);
    const heightCm = toCm(Number(heightInput) || 0, heightUnit);
    const age = calculateAge(birthDate);

    const goalsUpdate: Record<string, any> = {
      weight_kg: weightKg || null,
      height_cm: heightCm || null,
      age: age || null,
      activity_level: activityLevel,
      disliked_foods: buildDislikeArray(),
      weight_loss_speed: weightLossSpeed,
      muscle_gain_speed: muscleGainSpeed,
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

    if (weightKg && heightCm && age) {
      const activityMultiplier: Record<string, number> = {
        low: 1.2, normal: 1.375, moderate: 1.375, active: 1.55, very_active: 1.725,
      };
      const mult = activityMultiplier[activityLevel] || 1.375;
      const BMR = gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      let TDEE = BMR * mult;

      const userGoals: string[] = existingGoals?.goals || currentGoals;
      let target = TDEE;
      if (userGoals.includes('lose_weight') || userGoals.includes('lose')) {
        target = TDEE + (DEFICIT_MAP[weightLossSpeed] || -500);
      }
      if (userGoals.includes('build_muscle') || userGoals.includes('gain')) {
        let surplus = SURPLUS_MAP[muscleGainSpeed] || 200;
        if (activityLevel === 'very_active') surplus = Math.min(surplus, 400);
        surplus = Math.min(surplus, 500);
        target = TDEE + surplus;
      }

      // Safety minimum
      const minCal = gender === 'male' ? 1500 : 1200;
      target = Math.round(Math.max(target, minCal));
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

          {/* Food Preferences / Dislikes */}
          <div className="space-y-2">
            <Label className="font-exo text-muted-foreground">{dl.sectionTitle || 'Food preferences'}</Label>
            <p className="text-xs text-muted-foreground">{dl.subtitle || "TYANA will never suggest these"}</p>
            <div className="flex flex-wrap gap-1.5">
              {DISLIKE_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleDislike(chip.id)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    dislikedFoods.includes(chip.id)
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  {dislikedFoods.includes(chip.id) && '✕ '}{chip.emoji} {getDislikeLabel(chip.id)}
                </button>
              ))}
            </div>
            <Input
              value={dislikedFreeText}
              onChange={(e) => setDislikedFreeText(e.target.value)}
              placeholder={dl.placeholder || "Add anything else... (e.g. cilantro, avocado)"}
              className="bg-secondary/50 border-border"
            />
          </div>

          {/* Weight loss speed selector (only for lose_weight goal) */}
          {hasLoseGoal && (
            <div className="space-y-2">
              <Label className="font-exo text-muted-foreground">
                {wls.title || (ep.loseSpeedTitle || 'Weight loss pace')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {WEIGHT_LOSS_SPEEDS.map(({ id, emoji }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setWeightLossSpeed(id)}
                    className={`p-2.5 rounded-xl text-sm font-exo text-left transition-all border ${
                      weightLossSpeed === id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {emoji} {getSpeedLabel(id)}
                    <span className="block text-[10px] text-muted-foreground">{getSpeedDesc(id)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Muscle gain speed selector (only for build_muscle goal) */}
          {hasGainGoal && (
            <div className="space-y-2">
              <Label className="font-exo text-muted-foreground">
                {ep.gainSpeedTitle || 'Muscle gain pace'}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {MUSCLE_GAIN_SPEEDS.map(({ id, emoji }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMuscleGainSpeed(id)}
                    className={`p-2.5 rounded-xl text-sm font-exo text-left transition-all border ${
                      muscleGainSpeed === id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {emoji} {getGainSpeedLabel(id)}
                    <span className="block text-[10px] text-muted-foreground">{getGainSpeedDesc(id)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
