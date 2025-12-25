import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, EyeOff, Target, Star, Trash2 } from 'lucide-react';

interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  onEdit: () => void;
  onHide: () => void;
  onConvertToPlan: () => void;
  onMarkImportant: () => void;
  onDelete: () => void;
}

const QuickActionsSheet: React.FC<QuickActionsSheetProps> = ({
  isOpen,
  onClose,
  eventTitle,
  onEdit,
  onHide,
  onConvertToPlan,
  onMarkImportant,
  onDelete,
}) => {
  const actions = [
    { icon: Edit3, label: 'Редактировать', onClick: onEdit, color: 'text-blue-400' },
    { icon: EyeOff, label: 'Скрыть', onClick: onHide, color: 'text-gray-400' },
    { icon: Target, label: 'Превратить в план', onClick: onConvertToPlan, color: 'text-purple-400' },
    { icon: Star, label: 'Отметить как важное', onClick: onMarkImportant, color: 'text-yellow-400' },
    { icon: Trash2, label: 'Удалить', onClick: onDelete, color: 'text-red-400' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div
              className="rounded-t-3xl p-5"
              style={{
                background: 'linear-gradient(180deg, #1e1e2f 0%, #151521 100%)',
              }}
            >
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-lg line-clamp-1">{eventTitle}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-1">
                {actions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        action.onClick();
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <Icon className={`w-5 h-5 ${action.color}`} />
                      <span className="text-white">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickActionsSheet;
