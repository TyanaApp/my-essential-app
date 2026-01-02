import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error(t('pleaseTypeDelete'));
      return;
    }

    setDeleting(true);

    try {
      // Delete profile first (will cascade to other user data)
      if (user) {
        await supabase.from('profiles').delete().eq('user_id', user.id);
        await supabase.from('life_events').delete().eq('user_id', user.id);
        await supabase.from('chat_messages').delete().eq('user_id', user.id);
      }

      // Sign out
      await signOut();
      
      toast.success(t('accountDeleted'));
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('errorDeletingAccount'));
    } finally {
      setDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-nasa text-destructive flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            {t('deleteAccount')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('deleteAccountWarning')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
            <p className="text-sm text-foreground font-exo">
              {t('deleteAccountConsequences')}
            </p>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1 font-exo">
              <li>• {t('allDataWillBeDeleted')}</li>
              <li>• {t('cannotBeUndone')}</li>
              <li>• {t('subscriptionWillBeCanceled')}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-exo">
              {t('typeDeleteToConfirm')}
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="bg-secondary/50 border-border"
              placeholder="DELETE"
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
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || confirmText !== 'DELETE'}
            className="flex-1 font-nasa"
          >
            {deleting ? t('deleting') : t('deleteForever')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountModal;
