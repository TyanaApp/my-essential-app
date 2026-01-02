import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile, Profile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { profile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);

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
      toast.error(t('errorSavingProfile'));
    } else {
      toast.success(t('profileUpdated'));
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground">{t('editProfile')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="font-exo text-muted-foreground">
              {t('displayName')}
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary/50 border-border"
              placeholder={t('enterName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="font-exo text-muted-foreground">
              {t('bio')}
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-secondary/50 border-border resize-none"
              placeholder={t('tellAboutYourself')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="font-exo text-muted-foreground">
              {t('gender')}
            </Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue placeholder={t('selectGender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t('male')}</SelectItem>
                <SelectItem value="female">{t('female')}</SelectItem>
                <SelectItem value="other">{t('other')}</SelectItem>
                <SelectItem value="prefer_not_to_say">{t('preferNotToSay')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate" className="font-exo text-muted-foreground">
              {t('birthDate')}
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 font-exo"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 font-nasa"
          >
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
