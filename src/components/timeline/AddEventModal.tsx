import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Briefcase, Heart, Plane, Trophy, Baby, Target, Globe, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LucideIcon } from 'lucide-react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: {
    title: string;
    date: string;
    type: 'trigger' | 'goal';
    status: string;
    icon: LucideIcon;
  }) => void;
}

const iconOptions: { icon: LucideIcon; name: string }[] = [
  { icon: Briefcase, name: 'Work' },
  { icon: Heart, name: 'Health' },
  { icon: Plane, name: 'Travel' },
  { icon: Trophy, name: 'Achievement' },
  { icon: Baby, name: 'Family' },
  { icon: Target, name: 'Goal' },
  { icon: Globe, name: 'Adventure' },
  { icon: ShieldPlus, name: 'Medical' },
];

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'trigger' | 'goal'>('trigger');
  const [status, setStatus] = useState('stress peak');
  const [selectedIcon, setSelectedIcon] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    onAdd({
      title,
      date,
      type,
      status,
      icon: iconOptions[selectedIcon].icon,
    });

    // Reset form
    setTitle('');
    setDate('');
    setType('trigger');
    setStatus('stress peak');
    setSelectedIcon(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9, y: '-40%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-40%' }}
          >
            <div
              className="rounded-2xl p-5 shadow-2xl"
              style={{
                background: 'linear-gradient(180deg, #1e1e2f 0%, #151521 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white text-lg">Add Life Event</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">
                    Event Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., New Job, Wedding, Move..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-300">
                    Date (MM/YY)
                  </Label>
                  <Input
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g., 03/25"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Event Type</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setType('trigger')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        type === 'trigger'
                          ? 'bg-bio-purple text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      Trigger
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('goal')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        type === 'goal'
                          ? 'bg-bio-cyan text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      Goal
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Status</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['stress peak', 'goal', 'milestone'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
                          status === s
                            ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Icon</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {iconOptions.map((opt, idx) => {
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedIcon(idx)}
                          className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                            selectedIcon === idx
                              ? 'bg-bio-cyan/20 border border-bio-cyan/50'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <IconComponent
                            className={`w-5 h-5 ${
                              selectedIcon === idx ? 'text-bio-cyan' : 'text-gray-400'
                            }`}
                          />
                          <span className="text-[10px] text-gray-500">{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!title || !date}
                  className="w-full bg-gradient-to-r from-bio-purple to-bio-cyan hover:opacity-90 text-white disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Timeline
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddEventModal;
