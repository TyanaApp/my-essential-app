import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import LanguageSelector from '@/components/LanguageSelector';
import { Globe, Moon, Sun, HelpCircle, ChevronRight, Scale } from 'lucide-react';

interface SystemSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground text-base sm:text-lg truncate">{t('systemSettings')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Language */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary shrink-0" />
              <span className="font-exo text-foreground text-sm">{t('language')}</span>
            </div>
            <LanguageSelector variant="pills" />
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Sun className="w-5 h-5 text-primary shrink-0" />
              )}
              <span className="font-exo text-foreground text-sm">{t('theme')}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1 gap-2 font-exo text-xs sm:text-sm min-w-0"
              >
                <Sun className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('lightTheme')}</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1 gap-2 font-exo text-xs sm:text-sm min-w-0"
              >
                <Moon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('darkTheme')}</span>
              </Button>
            </div>
          </div>


          {/* Legal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary shrink-0" />
              <span className="font-exo text-foreground text-sm">{t('legal')}</span>
            </div>
            <div className="space-y-2">
              <Link to="/privacy" onClick={() => onOpenChange(false)} className="block text-sm font-exo text-primary hover:underline break-words">
                {t('privacyPolicy')}
              </Link>
              <Link to="/terms" onClick={() => onOpenChange(false)} className="block text-sm font-exo text-primary hover:underline break-words">
                {t('termsOfService')}
              </Link>
              <Link to="/cookies" onClick={() => onOpenChange(false)} className="block text-sm font-exo text-primary hover:underline break-words">
                {t('cookiePolicy')}
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemSettingsModal;
