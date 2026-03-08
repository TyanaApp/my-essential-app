import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const UpdateBanner = () => {
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);
  const { t } = useTranslation();

  const labels = (t as any).update || {
    title: '✨ New TYANA version ready!',
    now: 'Update — 2 sec',
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const check = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      // Check for updates on every app load
      await reg.update().catch(() => {});

      const handleWorker = (worker: ServiceWorker) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setNewWorker(worker);
            setShow(true);
          }
        });
      };

      if (reg.waiting && navigator.serviceWorker.controller) {
        setNewWorker(reg.waiting);
        setShow(true);
      }

      reg.addEventListener('updatefound', () => {
        if (reg.installing) handleWorker(reg.installing);
      });
    };

    check();
  }, []);

  const handleUpdate = useCallback(() => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, [newWorker]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
      <span className="text-sm font-medium flex-1">{labels.title}</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-primary font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors shrink-0"
      >
        {labels.now}
      </button>
    </div>
  );
};

export default UpdateBanner;
