import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Export for use in Profile page
export const triggerInstallPrompt = async () => {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
};

export const canInstall = () => !!deferredPrompt;

const InstallBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('tyana_install_dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show) return null;

  const handleInstall = async () => {
    const accepted = await triggerInstallPrompt();
    setShow(false);
    if (!accepted) {
      localStorage.setItem('tyana_install_dismissed', '1');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('tyana_install_dismissed', '1');
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 md:hidden"
      style={{ backgroundColor: 'hsl(263, 84%, 58%)', color: 'white' }}
    >
      <span className="text-sm font-medium">📲 Add TYANA to your home screen</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 hover:bg-white/30 transition-colors min-h-[36px]"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
