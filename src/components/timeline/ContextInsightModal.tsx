import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Target, Calendar, MessageCircle, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContextInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id?: string;
    title: string;
    date: string;
    type: 'trigger' | 'goal';
    status: string;
  } | null;
  onAITwinSync: (message: string) => void;
  onDelete?: (eventId: string) => void;
}

// Mock data for stress vs sleep chart
const stressVsSleepData = [
  { day: 'Week 1', stress: 65, sleep: 6.5 },
  { day: 'Week 2', stress: 72, sleep: 6.0 },
  { day: 'Week 3', stress: 80, sleep: 5.5 },
  { day: 'Week 4', stress: 75, sleep: 6.2 },
];

const ContextInsightModal: React.FC<ContextInsightModalProps> = ({
  isOpen,
  onClose,
  event,
  onAITwinSync,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  if (!event) return null;

  const isTrigger = event.type === 'trigger';
  const progressValue = Math.floor(Math.random() * 40) + 50;
  const canDelete = !!event.id && !!onDelete;

  const handleAITwinSync = () => {
    const message = isTrigger
      ? `I see you experienced "${event.title}" in ${event.date}. This was marked as a ${event.status}. Would you like me to analyze how this affected your overall wellbeing patterns?`
      : `I see you're aiming for "${event.title}" in ${event.date}. Should we adjust your current energy plan to help you reach this goal?`;
    onAITwinSync(message);
    onClose();
  };

  const handleDelete = () => {
    if (event.id && onDelete) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    }
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: isTrigger
                        ? 'linear-gradient(135deg, hsl(var(--bio-purple)), hsl(var(--bio-cyan)))'
                        : 'linear-gradient(135deg, hsl(var(--bio-cyan)), hsl(var(--bio-purple)))',
                    }}
                  >
                    {isTrigger ? (
                      <TrendingUp className="w-5 h-5 text-white" />
                    ) : (
                      <Target className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{event.date}</span>
                      <span className="px-2 py-0.5 rounded-full bg-bio-cyan/20 text-bio-cyan text-xs">
                        {event.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {isTrigger ? (
                  /* Stress vs Sleep Chart for Triggers */
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Stress vs. Sleep during {event.date}
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stressVsSleepData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          />
                          <YAxis
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#1e1e2f',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="stress"
                            stroke="hsl(var(--bio-purple))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--bio-purple))' }}
                            name="Stress %"
                          />
                          <Line
                            type="monotone"
                            dataKey="sleep"
                            stroke="hsl(var(--bio-cyan))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--bio-cyan))' }}
                            name="Sleep hrs"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  /* Progress Bar for Goals */
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Progress to Date</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Completion</span>
                        <span className="text-bio-cyan font-medium">{progressValue}%</span>
                      </div>
                      <Progress value={progressValue} className="h-3" />
                      <p className="text-xs text-gray-500 mt-2">
                        Based on your activity patterns and milestones achieved
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                  <span className="text-sm text-gray-400">Event Status</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                    {event.status}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAITwinSync}
                    className="flex-1 bg-gradient-to-r from-bio-purple to-bio-cyan hover:opacity-90 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ask AI Twin
                  </Button>
                  
                  {canDelete && (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="outline"
                      className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent className="bg-[#1e1e2f] border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Delete Event
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Are you sure you want to delete "{event.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContextInsightModal;
