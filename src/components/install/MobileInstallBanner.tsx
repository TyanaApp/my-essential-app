import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { triggerInstallPrompt, canInstall } from '@/components/InstallBanner';
import { useIsStandalone } from '@/hooks/useStandalone';
import { toast } from 'sonner';

const getDeviceType = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua) && !/Chrome/.test(ua);
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
  return { isIOS, isAndroid, isSafari, isChrome };
};

const MobileInstallBanner = () => {
  const { t } = useTranslation();
  const isStandalone = useIsStandalone();
  const [dismissed, setDismissed] = useState(false);
  const [promptReady, setPromptReady] = useState(canInstall());
  const [showTooltip, setShowTooltip] = useState(false);

  const { isIOS, isAndroid, isSafari, isChrome } = getDeviceType();
  const isDesktop = !isIOS && !isAndroid;

  useEffect(() => {
    if (localStorage.getItem('tyana_install_dismissed')) setDismissed(true);
    const handler = () => setPromptReady(true);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setDismissed(true);
      toast.success((t.install as any)?.installed || 'TYANA installed! 🎉');
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Never show if standalone, dismissed, or desktop
  if (isStandalone || dismissed || isDesktop) return null;

  const handleInstall = async () => {
    // Android with native prompt
    if (promptReady && canInstall()) {
      const accepted = await triggerInstallPrompt();
      if (accepted) {
        setDismissed(true);
        return;
      }
    }
    
    // iOS Safari → show tooltip
    if (isIOS && isSafari) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 6000);
      return;
    }

    // iOS other browser → copy link hint
    if (isIOS && !isSafari) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 6000);
      return;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tyana_install_dismissed', '1');
  };

  // Choose tooltip text based on device
  const getTooltipText = () => {
    if (isIOS && !isSafari) {
      return {
        line1: (t.install as any)?.openInSafari || 'Open this page in Safari to install',
        line2: (t.install as any)?.safariRequired || 'Safari → Share → Add to Home Screen',
      };
    }
    return {
      line1: t.install.iosTooltipLine1,
      line2: t.install.iosTooltipLine2,
    };
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

      {showTooltip && (
        <div
          className="absolute left-4 right-4 top-full mt-2 z-50 rounded-xl px-4 py-3 shadow-lg"
          style={{ backgroundColor: '#1E1B4B' }}
        >
          <p className="text-sm text-white font-medium">
            {getTooltipText().line1}
          </p>
          <p className="text-xs mt-1" style={{ color: '#C4B5FD' }}>
            {getTooltipText().line2}
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
