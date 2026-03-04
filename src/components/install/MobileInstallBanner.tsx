import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { triggerInstallPrompt, canInstall } from '@/components/InstallBanner';
import { useIsStandalone } from '@/hooks/useStandalone';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const MobileInstallBanner = () => {
  const { t } = useTranslation();
  const isStandalone = useIsStandalone();
  const [dismissed, setDismissed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [promptReady, setPromptReady] = useState(canInstall());
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const d = localStorage.getItem('tyana_install_dismissed');
    if (d) setDismissed(true);

    const handler = () => setPromptReady(true);
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    return () => { if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current); };
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstall = async () => {
    if (promptReady && canInstall()) {
      const accepted = await triggerInstallPrompt();
      if (accepted) setDismissed(true);
    } else if (isIOS()) {
      setShowTooltip(true);
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 6000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tyana_install_dismissed', '1');
  };

  return (
    <div className="relative">
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

      {/* Simple iOS tooltip */}
      {showTooltip && (
        <div
          className="absolute left-4 right-4 top-full mt-2 z-50 rounded-xl px-4 py-3 shadow-lg"
          style={{ backgroundColor: '#1E1B4B' }}
        >
          <p className="text-sm text-white font-medium">
            {t.install.iosTooltipLine1}
          </p>
          <p className="text-xs mt-1" style={{ color: '#C4B5FD' }}>
            {t.install.iosTooltipLine2}
          </p>
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2"
            style={{ color: '#C4B5FD' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileInstallBanner;
