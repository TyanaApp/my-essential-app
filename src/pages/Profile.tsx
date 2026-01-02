import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Settings, LogOut, ChevronRight, Camera, 
  Edit, CreditCard, Watch, Trash2, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import EditProfileModal from '@/components/profile/EditProfileModal';
import AccountSettingsModal from '@/components/profile/AccountSettingsModal';
import SystemSettingsModal from '@/components/profile/SystemSettingsModal';
import PaymentsModal from '@/components/profile/PaymentsModal';
import DeviceSyncModal from '@/components/profile/DeviceSyncModal';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';

const Profile = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { profile, loading, uploadAvatar } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [systemSettingsOpen, setSystemSettingsOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [deviceSyncOpen, setDeviceSyncOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('pleaseSelectImage'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageTooLarge'));
      return;
    }

    toast.loading(t('uploadingAvatar'));
    const { error } = await uploadAvatar(file);
    toast.dismiss();

    if (error) {
      toast.error(t('errorUploadingAvatar'));
    } else {
      toast.success(t('avatarUpdated'));
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const menuItems = [
    {
      icon: Edit,
      label: t('editProfile'),
      onClick: () => setEditProfileOpen(true),
    },
    {
      icon: Shield,
      label: t('accountSettings'),
      onClick: () => setAccountSettingsOpen(true),
    },
    {
      icon: Settings,
      label: t('systemSettings'),
      onClick: () => setSystemSettingsOpen(true),
    },
    {
      icon: CreditCard,
      label: t('payments'),
      onClick: () => setPaymentsOpen(true),
    },
    {
      icon: Watch,
      label: t('deviceSync'),
      onClick: () => setDeviceSyncOpen(true),
    },
  ];

  return (
    <div className="min-h-screen p-6 pb-24">
      <motion.h1 
        className="text-2xl font-nasa font-bold text-foreground mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {t('profile')}
      </motion.h1>

      {/* Avatar & Name */}
      <motion.div 
        className="flex flex-col items-center mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="relative mb-4">
          <Avatar className="w-28 h-28 border-4 border-primary/30">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/20 text-primary text-3xl font-nasa">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Camera className="w-5 h-5 text-primary-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <h2 className="text-xl font-nasa font-bold text-foreground">
          {displayName}
        </h2>
        <p className="text-sm text-muted-foreground font-exo">{user?.email}</p>
        {profile?.bio && (
          <p className="mt-2 text-sm text-muted-foreground font-exo text-center max-w-xs">
            {profile.bio}
          </p>
        )}
      </motion.div>

      {/* Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="font-exo text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <Button
          variant="destructive"
          className="w-full font-nasa"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t('logout')}
        </Button>

        <Button
          variant="outline"
          className="w-full font-exo text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
          onClick={() => setDeleteAccountOpen(true)}
        >
          <Trash2 className="w-5 h-5 mr-2" />
          {t('deleteAccount')}
        </Button>
      </motion.div>

      {/* Modals */}
      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <AccountSettingsModal open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen} />
      <SystemSettingsModal open={systemSettingsOpen} onOpenChange={setSystemSettingsOpen} />
      <PaymentsModal open={paymentsOpen} onOpenChange={setPaymentsOpen} />
      <DeviceSyncModal open={deviceSyncOpen} onOpenChange={setDeviceSyncOpen} />
      <DeleteAccountModal open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
    </div>
  );
};

export default Profile;
