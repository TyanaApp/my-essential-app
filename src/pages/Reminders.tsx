import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Mic, Trash2, Check, Calendar, Clock, Repeat } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useReminders } from '@/hooks/useReminders';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Reminders = () => {
  const { t, language } = useTranslation();
  const rm = (t as any).reminders || {};
  usePageTitle(rm.title || 'My Reminders');
  const { reminders, loading, addReminder, completeReminder, deleteReminder } = useReminders();

  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('18:00');
  const [repeat, setRepeat] = useState('once');
  const [saving, setSaving] = useState(false);

  // Voice parsed result
  const [voiceParsed, setVoiceParsed] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);

  const handleVoiceResult = async (transcript: string) => {
    setVoiceProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-reminder', {
        body: { transcript, language },
      });
      if (error) throw error;
      setVoiceParsed({ ...data, originalText: transcript });
      // Pre-fill form
      if (data.text) setText(data.text);
      if (data.date) setDate(data.date);
      if (data.time) setTime(data.time || '18:00');
      if (data.repeat) setRepeat(data.repeat);
      setShowConfirm(true);
    } catch {
      toast.error(rm.voiceFailed || 'Could not parse voice');
    } finally {
      setVoiceProcessing(false);
    }
  };

  const { isRecording, isProcessing, toggleRecording } = useVoiceInput(handleVoiceResult);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const remindAt = new Date(`${date}T${time}:00`).toISOString();
    const result = await addReminder(text.trim(), remindAt, repeat);
    setSaving(false);
    if (result?.error) {
      toast.error(rm.saveFailed || 'Failed to save');
    } else {
      toast.success(rm.saved || 'Reminder saved ✓');
      setText('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime('18:00');
      setRepeat('once');
      setShowAdd(false);
      setShowConfirm(false);
      setVoiceParsed(null);
    }
  };

  // Group reminders
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const tomorrowStr = format(new Date(now.getTime() + 86400000), 'yyyy-MM-dd');

  const todayReminders = reminders.filter(r => {
    const d = format(new Date(r.remind_at), 'yyyy-MM-dd');
    return d === todayStr && r.repeat_type === 'once' && !r.is_completed;
  });
  const tomorrowReminders = reminders.filter(r => {
    const d = format(new Date(r.remind_at), 'yyyy-MM-dd');
    return d === tomorrowStr && r.repeat_type === 'once' && !r.is_completed;
  });
  const recurringReminders = reminders.filter(r => r.repeat_type !== 'once' && !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  const repeatLabels: Record<string, string> = {
    once: rm.once || 'Once',
    daily: rm.daily || 'Daily',
    weekdays: rm.weekdays || 'Weekdays',
    weekends: rm.weekends || 'Weekends',
  };

  const ReminderItem = ({ r }: { r: any }) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${r.is_completed ? 'opacity-50' : 'bg-secondary/30'}`}>
      <span className="text-lg">🔔</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-foreground ${r.is_completed ? 'line-through' : ''}`}>{r.text}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(r.remind_at), 'HH:mm')}
          {r.repeat_type !== 'once' && ` · ${repeatLabels[r.repeat_type]}`}
        </p>
      </div>
      <div className="flex gap-1">
        {!r.is_completed && (
          <button
            onClick={() => completeReminder(r.id)}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Check className="w-4 h-4 text-primary" />
          </button>
        )}
        <button
          onClick={() => deleteReminder(r.id)}
          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );

  const Section = ({ title, items }: { title: string; items: any[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
        {items.map(r => <ReminderItem key={r.id} r={r} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 pb-mobile-safe">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-nasa font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            {rm.title || 'My Reminders'}
          </h1>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-3 mb-6">
        <Button onClick={() => setShowAdd(true)} className="flex-1 gap-2">
          <Plus className="w-4 h-4" />
          {rm.addReminder || 'Add reminder'}
        </Button>
        <Button
          variant="outline"
          onClick={toggleRecording}
          disabled={isProcessing || voiceProcessing}
          className={`gap-2 ${isRecording ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}
        >
          <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
          {isRecording ? '⏹' : '🎤'}
        </Button>
      </motion.div>

      {(isProcessing || voiceProcessing) && (
        <Card className="mb-4">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            {rm.processing || 'Processing voice...'}
          </CardContent>
        </Card>
      )}

      {/* Reminders list */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-8">{t.common.loading}</p>
        ) : reminders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{rm.empty || 'No reminders yet'}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Section title={rm.today || 'Today'} items={todayReminders} />
            <Section title={rm.tomorrow || 'Tomorrow'} items={tomorrowReminders} />
            <Section title={rm.recurring || 'Recurring'} items={recurringReminders} />
            {completedReminders.length > 0 && (
              <Section title={rm.completed || 'Completed'} items={completedReminders} />
            )}
          </>
        )}
      </motion.div>

      {/* Add Reminder Dialog */}
      <Dialog open={showAdd || showConfirm} onOpenChange={(o) => { setShowAdd(o); setShowConfirm(o); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nasa text-foreground">
              {showConfirm ? (rm.confirmReminder || 'Confirm reminder') : (rm.addReminder || 'Add reminder')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {showConfirm && voiceParsed && (
              <div className="p-3 bg-primary/5 rounded-xl text-sm space-y-1">
                <p className="font-medium">🔔 {rm.willRemind || 'Will remind'}: {voiceParsed.text || text}</p>
                <p className="text-muted-foreground">📅 {voiceParsed.date || date} · {voiceParsed.time || time}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{rm.whatToRemind || 'What to remind?'}</label>
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={rm.placeholder || 'Go to the store for milk'}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {rm.dateLabel || 'Date'}
                </label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {rm.timeLabel || 'Time'}
                </label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" /> {rm.repeatLabel || 'Repeat'}
              </label>
              <Select value={repeat} onValueChange={setRepeat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">{rm.once || 'Once'}</SelectItem>
                  <SelectItem value="daily">{rm.daily || 'Daily'}</SelectItem>
                  <SelectItem value="weekdays">{rm.weekdays || 'Weekdays'}</SelectItem>
                  <SelectItem value="weekends">{rm.weekends || 'Weekends'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving || !text.trim()} className="w-full">
              {saving ? t.common.loading : (t.common.save)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reminders;
