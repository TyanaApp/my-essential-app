import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useProfile, Profile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import GoalChangeModal from '@/components/profile/GoalChangeModal';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setGender(profile.gender || '');
      setBirthDate(profile.birth_date || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      display_name: displayName,
      bio,
      gender: gender || null,
      birth_date: birthDate || null
    });
    setSaving(false);

    if (error) {
      toast.error(t.common.error);
    } else {
      toast.success('✓');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground">{t.profile.editProfile}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="font-exo text-muted-foreground">
              {t.profile.displayName}
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="font-exo text-muted-foreground">
              {t.profile.bio}
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-secondary/50 border-border resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="font-exo text-muted-foreground">
              {t.profile.gender}
            </Label>
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

          <div className="space-y-2">
            <Label htmlFor="birthDate" className="font-exo text-muted-foreground">
              {t.profile.dateOfBirth}
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-secondary/50 border-border"
            />
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
