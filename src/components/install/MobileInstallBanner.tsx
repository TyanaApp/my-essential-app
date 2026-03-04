import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { triggerInstallPrompt, canInstall } from '@/components/InstallBanner';
import { useIsStandalone } from '@/hooks/useStandalone';
import IOSInstallSheet from './IOSInstallSheet';
import AndroidInstallSheet from './AndroidInstallSheet';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const MobileInstallBanner = () => {
  const { t } = useTranslation();
  const isStandalone = useIsStandalone();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [showAndroidSheet, setShowAndroidSheet] = useState(false);
  const [promptReady, setPromptReady] = useState(canInstall());

  useEffect(() => {
    const d = localStorage.getItem('tyana_install_dismissed');
    if (d) setDismissed(true);

    // Listen for the prompt to become available
    const handler = () => setPromptReady(true);
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstall = async () => {
    if (promptReady && canInstall()) {
      const accepted = await triggerInstallPrompt();
      if (accepted) setDismissed(true);
    } else if (isIOS()) {
      setShowIOSSheet(true);
    } else {
      // Android without prompt available — show manual instructions
      setShowAndroidSheet(true);
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
          📲 {t.install.bannerText}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors active:scale-95"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {t.install.installBtn}
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
      <AndroidInstallSheet open={showAndroidSheet} onClose={() => setShowAndroidSheet(false)} />
    </>
  );
};

export default MobileInstallBanner;
