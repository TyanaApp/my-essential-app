
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  repeat_type TEXT NOT NULL DEFAULT 'once',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_reminders_select" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_reminders_insert" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_reminders_update" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_reminders_delete" ON public.reminders FOR DELETE USING (auth.uid() = user_id);
