import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Eye, 
  EyeOff, 
  Heart, 
  Baby,
  Lock,
  Fingerprint,
  ChevronRight,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export interface PrivacySettingsState {
  cycleTracking: boolean;
  intimateTopics: boolean;
  pregnancyMode: boolean;
  privateEventsEnabled: boolean;
  biometricLock: boolean;
  hideFromShared: boolean;
}

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrivacySettingsState;
  onSave: (settings: PrivacySettingsState) => void;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<PrivacySettingsState>(settings);

  const toggleSetting = (key: keyof PrivacySettingsState) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  const settingItems = [
    {
      key: 'cycleTracking' as keyof PrivacySettingsState,
      icon: Heart,
      title: 'Трекинг цикла',
      description: 'Отслеживание менструального цикла и связанных симптомов',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
    },
    {
      key: 'intimateTopics' as keyof PrivacySettingsState,
      icon: EyeOff,
      title: 'Интимные темы',
      description: 'Секс, либидо, интимное здоровье',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
    },
    {
      key: 'pregnancyMode' as keyof PrivacySettingsState,
      icon: Baby,
      title: 'Режим беременности',
      description: 'Специальный трекинг для беременности',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      key: 'privateEventsEnabled' as keyof PrivacySettingsState,
      icon: Lock,
      title: 'Приватные события',
      description: 'Возможность скрывать события из общего списка',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
    },
    {
      key: 'biometricLock' as keyof PrivacySettingsState,
      icon: Fingerprint,
      title: 'Биометрическая защита',
      description: 'Face ID / Touch ID для приватных данных',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    {
      key: 'hideFromShared' as keyof PrivacySettingsState,
      icon: Eye,
      title: 'Скрыть при показе',
      description: 'Скрывать личные данные при демонстрации экрана',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1e1e3f 0%, #16213e 100%)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Приватность</h2>
              <p className="text-xs text-gray-400">Настройки конфиденциальности</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mx-5 mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <p className="text-violet-300 text-xs leading-relaxed">
            Твои данные принадлежат только тебе. Мы не передаём их третьим лицам и не используем для рекламы.
          </p>
        </div>

        {/* Settings List */}
        <div className="px-5 pb-4 overflow-y-auto max-h-[50vh] space-y-3">
          {settingItems.map(item => {
            const Icon = item.icon;
            const isEnabled = localSettings[item.key];
            
            return (
              <button
                key={item.key}
                onClick={() => toggleSetting(item.key)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                </div>
                
                {isEnabled ? (
                  <ToggleRight className="w-8 h-8 text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="p-5 border-t border-white/10">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
          >
            Сохранить настройки
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivacySettings;
