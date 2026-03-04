import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface QRInstallModalProps {
  open: boolean;
  onClose: () => void;
}

const QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://tyana.lovable.app';
const SHARE_LINK = 'tyana.lovable.app';

const QRInstallModal = ({ open, onClose }: QRInstallModalProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText('https://tyana.lovable.app');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full relative"
        style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-center mb-6" style={{ color: '#1E1B4B' }}>
          {t.install?.modalTitle || 'Install TYANA on your phone'}
        </h2>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <img
            src={QR_URL}
            alt="QR code to install TYANA"
            className="w-[200px] h-[200px] rounded-xl"
          />
        </div>
        <p className="text-center text-sm mb-6" style={{ color: '#6B7280' }}>
          {t.install?.scanWithCamera || 'Scan with your phone camera'}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: '#EDE9FE' }} />
          <span className="text-xs text-muted-foreground">{t.common.or}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#EDE9FE' }} />
        </div>

        {/* Share link */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}
          >
            {SHARE_LINK}
          </div>
          <button
            onClick={handleCopy}
            className="p-3 rounded-xl transition-colors"
            style={{ backgroundColor: '#F5F3FF' }}
          >
            {copied ? <Check className="w-4 h-4" style={{ color: '#059669' }} /> : <Copy className="w-4 h-4" style={{ color: '#7C3AED' }} />}
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F3FF' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#1E1B4B' }}>🍎 iPhone</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {t.install?.iosInstructions || 'Open in Safari → Share → Add to Home Screen'}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F3FF' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#1E1B4B' }}>🤖 Android</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {t.install?.androidInstructions || 'Open in Chrome → Menu ⋮ → Add to Home Screen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRInstallModal;
