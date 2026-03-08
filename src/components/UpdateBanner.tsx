import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const UpdateBanner = () => {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();

  const labels = (t as any).update || {
    title: '✨ New TYANA version ready!',
    now: '✨ Update',
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const check = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      await reg.update().catch(() => {});

      const handleWorker = (worker: ServiceWorker) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      };

      if (reg.waiting && navigator.serviceWorker.controller) {
        setShow(true);
      }

      reg.addEventListener('updatefound', () => {
        if (reg.installing) handleWorker(reg.installing);
      });
    };

    check();
  }, []);

  const handleUpdate = useCallback(() => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .then(() => caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))))
      .then(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('v', String(Date.now()));
        window.location.href = url.toString();
      });
  }, []);

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
