import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface IOSInstallSheetProps {
  open: boolean;
  onClose: () => void;
}

const IOSInstallSheet = ({ open, onClose }: IOSInstallSheetProps) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: '#1E1B4B' }}>
            {t.install?.modalTitle || 'Install TYANA on your phone'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: '#F5F3FF' }}>
              1️⃣
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>
                {t.install?.iosStep1 || 'Tap the Share button'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                {t.install?.iosStep1Hint || 'at the bottom of Safari'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: '#F5F3FF' }}>
              2️⃣
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>
                {t.install?.iosStep2 || 'Scroll down and tap "Add to Home Screen"'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: '#F5F3FF' }}>
              3️⃣
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>
                {t.install?.iosStep3 || 'Tap "Add" in the top right corner'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-4xl">🧭 → 📤 → ➕</p>
          <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Safari → Share → Add</p>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallSheet;
