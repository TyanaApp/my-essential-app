import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Settings, LogOut, ChevronRight, Camera, 
  Edit, CreditCard, Trash2, Shield, Bell, Watch, Smartphone, Activity,
  MessageCircle, Lightbulb, Star, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import EditProfileModal from '@/components/profile/EditProfileModal';
import AccountSettingsModal from '@/components/profile/AccountSettingsModal';
import SystemSettingsModal from '@/components/profile/SystemSettingsModal';
import PaymentsModal from '@/components/profile/PaymentsModal';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import { SupportModal, IdeasModal, RatingModal } from '@/components/profile/SupportFeedbackModals';
import FamilySettingsModal from '@/components/profile/FamilySettingsModal';
import { useNotifications } from '@/hooks/useNotifications';
import { Switch } from '@/components/ui/switch';
import LegalFooterPill from '@/components/LegalFooterPill';
import StoreDealsCard from '@/components/shopping/StoreDealsCard';

const DeviceRow = ({ emoji, name, badge }: { emoji: string; name: string; badge: string }) => {
  const [notify, setNotify] = useState(() => localStorage.getItem(`notify_device_${name}`) === '1');
  const handleNotify = (checked: boolean) => {
    setNotify(checked);
    localStorage.setItem(`notify_device_${name}`, checked ? '1' : '0');
    if (checked) toast.success("We'll notify you when ready!");
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-medium text-muted-foreground">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-purple-100 text-purple-600 border-purple-200 text-[10px] px-2 py-0.5">
          {badge}
        </Badge>
        <Switch checked={notify} onCheckedChange={handleNotify} />
      </div>
    </div>
  );
};

const WeeklyReportToggle = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('weekly_report_enabled').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setEnabled(data?.weekly_report_enabled !== false);
      setLoaded(true);
    });
  }, [user]);

  const toggle = async (checked: boolean) => {
    setEnabled(checked);
    if (user) {
      await supabase.from('profiles').update({ weekly_report_enabled: checked } as any).eq('user_id', user.id);
    }
  };

  if (!loaded) return null;

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{(t.notifications as any).weeklyReport || '📊 Weekly email report'}</p>
        <p className="text-xs text-muted-foreground">{(t.notifications as any).weeklyReportDesc || 'Every Sunday by email'}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} />
    </div>
  );
};

const Profile = () => {
  const { t } = useTranslation();
  usePageTitle(t.profile.title);
  const { user, signOut } = useAuth();
  const { profile, loading, uploadAvatar } = useProfile();
  const { settings: notifSettings, updateSettings: updateNotifSettings } = useNotifications();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [systemSettingsOpen, setSystemSettingsOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);

  // Listen for open-payments event
  useEffect(() => {
    const handler = () => setPaymentsOpen(true);
    window.addEventListener('open-payments', handler);
    return () => window.removeEventListener('open-payments', handler);
  }, []);

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
      toast.error(t.common.error);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.common.error);
      return;
    }

    toast.loading(t.common.loading);
    const { error } = await uploadAvatar(file);
    toast.dismiss();

    if (error) {
      toast.error(t.common.error);
    } else {
      toast.success('✓');
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const menuItems = [
    {
      icon: Edit,
      label: t.profile.editProfile,
      onClick: () => setEditProfileOpen(true),
    },
    {
      icon: Users,
      label: (t as any).family?.title || 'Family',
      onClick: () => setFamilyOpen(true),
    },
    {
      icon: Activity,
      label: (t as any).streak?.achievements || 'Achievements',
      onClick: () => navigate('/achievements'),
    },
    {
      icon: Shield,
      label: t.profile.accountSettings,
      onClick: () => setAccountSettingsOpen(true),
    },
    {
      icon: Settings,
      label: t.profile.systemSettings,
      onClick: () => setSystemSettingsOpen(true),
    },
    {
      icon: CreditCard,
      label: t.profile.payments,
      onClick: () => setPaymentsOpen(true),
    },
  ];

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      <motion.h1 
        className="text-2xl font-nasa font-bold text-foreground mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {t.profile.title}
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

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t.notifications.title}</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'expiryAlerts' as const, label: t.notifications.expiryAlerts, desc: t.notifications.expiryAlertsDesc },
                { key: 'weeklySummary' as const, label: t.notifications.weeklySummary, desc: t.notifications.weeklySummaryDesc },
                { key: 'recipeSuggestions' as const, label: t.notifications.recipeSuggestions, desc: t.notifications.recipeSuggestionsDesc },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifSettings[item.key]}
                    onCheckedChange={(checked) => updateNotifSettings({ ...notifSettings, [item.key]: checked })}
                  />
                </div>
              ))}
              {/* Weekly email report toggle */}
              <WeeklyReportToggle />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Support & Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-0">
            {[
              { icon: MessageCircle, label: (t as any).support?.writeSupport || '💬 Write to support', onClick: () => setSupportOpen(true) },
              { icon: Lightbulb, label: (t as any).support?.ideas || '💡 Ideas & Suggestions', onClick: () => setIdeasOpen(true) },
              { icon: Star, label: (t as any).support?.rateApp || '⭐️ Rate the app', onClick: () => setRatingOpen(true) },
            ].map((item, index) => (
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

      {/* Connect Devices - Smart Devices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Watch className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{(t as any).trial?.smartDevices || (t.profile as any).connectDevices || 'Smart Devices'}</h3>
            </div>
            <div className="space-y-3">
              <DeviceRow emoji="⌚️" name="Apple Watch" badge={(t.profile as any).soon || 'Soon'} />
              <DeviceRow emoji="📱" name="Google Fit" badge={(t.profile as any).soon || 'Soon'} />
              <DeviceRow emoji="💪" name="Fitbit" badge={(t.profile as any).soon || 'Soon'} />
              <DeviceRow emoji="⌚" name="Garmin" badge={(t.profile as any).soon || 'Soon'} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coming Soon - Store Integration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <StoreDealsProfileRow />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <Button
          variant="destructive"
          className="w-full font-nasa"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t.profile.logout}
        </Button>

        <Button
          variant="outline"
          className="w-full font-exo text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
          onClick={() => setDeleteAccountOpen(true)}
        >
          <Trash2 className="w-5 h-5 mr-2" />
          {t.profile.deleteAccount}
        </Button>
      </motion.div>

      {/* Legal footer */}
      <div className="mt-6 mb-4">
        <LegalFooterPill />
      </div>

      {/* Modals */}
      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <FamilySettingsModal open={familyOpen} onOpenChange={setFamilyOpen} />
      <AccountSettingsModal open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen} />
      <SystemSettingsModal open={systemSettingsOpen} onOpenChange={setSystemSettingsOpen} />
      <PaymentsModal open={paymentsOpen} onOpenChange={setPaymentsOpen} />
      <DeleteAccountModal open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
      <IdeasModal open={ideasOpen} onOpenChange={setIdeasOpen} />
      <RatingModal open={ratingOpen} onOpenChange={setRatingOpen} />
    </div>
  );
};

export default Profile;
