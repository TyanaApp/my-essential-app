import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Watch, Smartphone, Activity, Unplug, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  const devices = [
    { id: 'apple_watch', name: 'Apple Watch', icon: Watch },
    { id: 'fitbit', name: 'Fitbit', icon: Activity },
    { id: 'samsung_health', name: 'Samsung Health', icon: Smartphone },
    { id: 'google_fit', name: 'Google Fit', icon: Activity },
    { id: 'garmin', name: 'Garmin', icon: Watch },
  ];

  const handleToggleDevice = (deviceId: string) => {
    if (connectedDevices.includes(deviceId)) {
      setConnectedDevices(prev => prev.filter(id => id !== deviceId));
      toast.success(t('deviceDisconnected'));
    } else {
      setConnectedDevices(prev => [...prev, deviceId]);
      toast.success(t('deviceConnected'));
    }
  };

  const handleDisconnectAll = () => {
    setConnectedDevices([]);
    toast.success(t('allDevicesDisconnected'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground flex items-center gap-2">
            <Watch className="w-6 h-6 text-primary" />
            {t('deviceSync')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground font-exo text-sm">
            {t('deviceSyncDescription')}
          </p>

          {/* Device List */}
          <div className="space-y-2">
            {devices.map((device) => {
              const isConnected = connectedDevices.includes(device.id);
              const Icon = device.icon;

              return (
                <button
                  key={device.id}
                  onClick={() => handleToggleDevice(device.id)}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    isConnected
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border bg-secondary/20 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="font-exo text-foreground">{device.name}</span>
                  </div>
                  {isConnected ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <span className="text-sm text-muted-foreground font-exo">{t('tapToConnect')}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Disconnect All */}
          {connectedDevices.length > 0 && (
            <Button
              variant="outline"
              onClick={handleDisconnectAll}
              className="w-full gap-2 font-exo text-destructive hover:text-destructive"
            >
              <Unplug className="w-4 h-4" />
              {t('disconnectAll')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceSyncModal;
