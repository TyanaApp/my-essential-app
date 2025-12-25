import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, ChevronRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/LanguageSelector';

const Profile = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <motion.h1 
        className="text-2xl font-nasa font-bold text-foreground mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {t('profile')}
      </motion.h1>

      {/* Avatar */}
      <motion.div 
        className="flex flex-col items-center mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <User className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-xl font-nasa font-bold text-foreground">
          {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
        </h2>
        <p className="text-sm text-muted-foreground font-exo">{user?.email}</p>
      </motion.div>

      {/* Language */}
      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-exo">Language / Язык / Valoda</p>
          </div>
          <LanguageSelector variant="pills" />
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-card border-border mb-4">
        <CardContent className="p-0">
          <button className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="font-exo text-foreground">{t('settings')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full font-nasa"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        {t('logout')}
      </Button>
    </div>
  );
};

export default Profile;
