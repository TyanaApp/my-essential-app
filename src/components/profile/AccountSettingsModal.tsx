import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, Phone } from 'lucide-react';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'password' | 'email' | null>(null);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('passwordChanged'));
      setNewPassword('');
      setConfirmPassword('');
      setActiveSection(null);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error(t('invalidEmail'));
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('emailChangeRequested'));
      setNewEmail('');
      setActiveSection(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground">{t('accountSettings')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Email */}
          <div className="p-4 bg-secondary/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground font-exo">{t('currentEmail')}</p>
                <p className="text-foreground font-exo">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 font-exo"
              onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
            >
              <Lock className="w-5 h-5" />
              {t('changePassword')}
            </Button>

            {activeSection === 'password' && (
              <div className="space-y-3 p-4 bg-secondary/20 rounded-xl">
                <div className="space-y-2">
                  <Label className="font-exo text-muted-foreground">{t('newPassword')}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-secondary/50 border-border"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-exo text-muted-foreground">{t('confirmPassword')}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary/50 border-border"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full font-nasa"
                >
                  {saving ? t('saving') : t('updatePassword')}
                </Button>
              </div>
            )}
          </div>

          {/* Change Email Section */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 font-exo"
              onClick={() => setActiveSection(activeSection === 'email' ? null : 'email')}
            >
              <Mail className="w-5 h-5" />
              {t('changeEmail')}
            </Button>

            {activeSection === 'email' && (
              <div className="space-y-3 p-4 bg-secondary/20 rounded-xl">
                <div className="space-y-2">
                  <Label className="font-exo text-muted-foreground">{t('newEmail')}</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-secondary/50 border-border"
                    placeholder="email@example.com"
                  />
                </div>
                <Button
                  onClick={handleChangeEmail}
                  disabled={saving}
                  className="w-full font-nasa"
                >
                  {saving ? t('saving') : t('updateEmail')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSettingsModal;
