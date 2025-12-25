import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'essential' | 'optional';
}

interface SectionPathProps {
  initialTasks?: Task[];
}

const SectionPath: React.FC<SectionPathProps> = ({ initialTasks }) => {
  const { t } = useLanguage();
  
  const defaultTasks: Task[] = [
    { id: '1', title: t('morningWorkout'), completed: false, type: 'essential' },
    { id: '2', title: t('meditation'), completed: true, type: 'essential' },
    { id: '3', title: t('drinkWater'), completed: false, type: 'essential' },
    { id: '4', title: t('walk20min'), completed: false, type: 'optional' },
    { id: '5', title: t('limitCaffeine'), completed: false, type: 'optional' },
  ];

  const [tasks, setTasks] = useState<Task[]>(initialTasks || defaultTasks);
  const [isLightMode, setIsLightMode] = useState(false);

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleMakeLighter = () => {
    setIsLightMode(true);
    toast({
      title: t('taskCleared'),
      description: t('makeTodayLighter'),
    });
  };

  const essentialTasks = tasks.filter(t => t.type === 'essential');
  const optionalTasks = tasks.filter(t => t.type === 'optional');

  const visibleEssential = isLightMode ? essentialTasks.slice(0, 2) : essentialTasks;
  const visibleOptional = isLightMode ? [] : optionalTasks;

  return (
    <div className="space-y-4">
      {/* Essential tasks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-bio-cyan" />
          <span className="text-sm font-nasa font-semibold text-foreground">{t('essential')}</span>
          <span className="text-xs font-numbers text-muted-foreground neon-number">({visibleEssential.length})</span>
        </div>
        
        <div className="space-y-2">
          <AnimatePresence>
            {visibleEssential.map((task, index) => (
              <motion.button
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`w-full rounded-[20px] backdrop-blur-xl border p-3.5 flex items-center gap-3 transition-all ${
                  task.completed 
                    ? 'bg-bio-cyan/10 border-bio-cyan/30' 
                    : 'bg-surface/50 border-border/50 hover:border-bio-cyan/30'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                {task.completed ? (
                  <CheckCircle className="w-5 h-5 text-bio-cyan flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`flex-1 text-left font-exo text-sm ${
                  task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}>
                  {task.title}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Optional tasks */}
      <AnimatePresence>
        {visibleOptional.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-golden" />
              <span className="text-sm font-nasa font-semibold text-foreground">{t('optional')}</span>
              <span className="text-xs font-numbers text-muted-foreground neon-number-golden">({visibleOptional.length})</span>
            </div>
            
            <div className="space-y-2">
              {visibleOptional.map((task, index) => (
                <motion.button
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`w-full rounded-[20px] backdrop-blur-xl border p-3.5 flex items-center gap-3 transition-all ${
                    task.completed 
                      ? 'bg-golden/10 border-golden/30' 
                      : 'bg-surface/30 border-border/30 hover:border-golden/30'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-golden flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                  )}
                  <span className={`flex-1 text-left font-exo text-sm ${
                    task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                  }`}>
                    {task.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Make today lighter button */}
      {!isLightMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleMakeLighter}
            variant="outline"
            className="w-full rounded-[20px] h-12 border-bio-magenta/30 text-bio-magenta hover:bg-bio-magenta/10 font-nasa font-semibold transition-all"
          >
            {t('makeTodayLighter')}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SectionPath;