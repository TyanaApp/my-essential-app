import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const DISMISS_KEY = 'tyana_update_dismissed_at';

const UpdateBanner = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);
  const { t } = useTranslation();

  const labels = (t as any).update || {
    title: '✨ TYANA update available!',
    now: 'Update now',
    later: 'Later',
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      const onNewWorker = (worker: ServiceWorker) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            const dismissed = localStorage.getItem(DISMISS_KEY);
            if (dismissed && Date.now() - Number(dismissed) < 3600000) return;
            setWaitingWorker(worker);
            setShow(true);
          }
        });
      };

      if (reg.waiting && navigator.serviceWorker.controller) {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (!dismissed || Date.now() - Number(dismissed) >= 3600000) {
          setWaitingWorker(reg.waiting);
          setShow(true);
        }
      }

      reg.addEventListener('updatefound', () => {
        if (reg.installing) onNewWorker(reg.installing);
      });
    };

    register();
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [waitingWorker]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
      <span className="text-sm font-medium flex-1">{labels.title}</span>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleUpdate}
          className="bg-white text-primary font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
        >
          {labels.now}
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/80 text-xs underline hover:text-white transition-colors"
        >
          {labels.later}
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
