import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { triggerInstallPrompt, canInstall } from '@/components/InstallBanner';
import { useIsStandalone } from '@/hooks/useStandalone';
import IOSInstallSheet from './IOSInstallSheet';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const MobileInstallBanner = () => {
  const { t } = useTranslation();
  const isStandalone = useIsStandalone();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem('tyana_install_dismissed');
    if (d) setDismissed(true);
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstall = async () => {
    if (canInstall()) {
      const accepted = await triggerInstallPrompt();
      if (accepted) setDismissed(true);
    } else if (isIOS()) {
      setShowIOSSheet(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tyana_install_dismissed', '1');
  };

  return (
    <>
      <div
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
      >
        <span className="text-sm font-medium" style={{ color: '#7C3AED' }}>
          📲 {t.install?.bannerText || 'Install TYANA for the best experience'}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {t.install?.installBtn || 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg transition-colors"
            style={{ color: '#7C3AED' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <IOSInstallSheet open={showIOSSheet} onClose={() => setShowIOSSheet(false)} />
    </>
  );
};

export default MobileInstallBanner;
