import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import LanguageSelector from '@/components/LanguageSelector';
import { Globe, Moon, Sun, HelpCircle, MessageCircle, ChevronRight, Scale } from 'lucide-react';

interface SystemSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showHelp, setShowHelp] = useState(false);

  const faqs = [
    { q: 'faqQuestion1', a: 'faqAnswer1' },
    { q: 'faqQuestion2', a: 'faqAnswer2' },
    { q: 'faqQuestion3', a: 'faqAnswer3' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground">{t('systemSettings')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="font-exo text-foreground">{t('language')}</span>
            </div>
            <LanguageSelector variant="pills" />
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <span className="font-exo text-foreground">{t('theme')}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1 gap-2 font-exo"
              >
                <Sun className="w-4 h-4" />
                {t('lightTheme')}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1 gap-2 font-exo"
              >
                <Moon className="w-4 h-4" />
                {t('darkTheme')}
              </Button>
            </div>
          </div>

          {/* Help */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between font-exo"
              onClick={() => setShowHelp(!showHelp)}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {t('help')}
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${showHelp ? 'rotate-90' : ''}`} />
            </Button>

            {showHelp && (
              <div className="space-y-4 p-4 bg-secondary/20 rounded-xl">
                <h4 className="font-nasa text-foreground">{t('faq')}</h4>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={index} className="space-y-1">
                      <p className="font-exo text-foreground text-sm">{t(faq.q)}</p>
                      <p className="text-muted-foreground text-sm">{t(faq.a)}</p>
                    </div>
                  ))}
                </div>

                {/* Contact support link removed - use in-app form instead */}
              </div>
            )}
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-primary" />
              <span className="font-exo text-foreground">{t('legal') || 'Legal'}</span>
            </div>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-sm font-exo text-primary hover:underline">{t('privacyPolicy') || 'Privacy Policy'}</Link>
              <Link to="/terms" className="block text-sm font-exo text-primary hover:underline">{t('termsOfService') || 'Terms of Service'}</Link>
              <Link to="/cookies" className="block text-sm font-exo text-primary hover:underline">{t('cookiePolicy') || 'Cookie Policy'}</Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemSettingsModal;
