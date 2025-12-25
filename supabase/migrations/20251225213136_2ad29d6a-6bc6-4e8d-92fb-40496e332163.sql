-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for life events timeline
CREATE TABLE public.life_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trigger', 'goal')),
  status TEXT NOT NULL DEFAULT 'stress peak',
  icon_name TEXT NOT NULL DEFAULT 'Target',
  side TEXT NOT NULL DEFAULT 'left' CHECK (side IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users can view their own life events"
ON public.life_events
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert their own life events"
ON public.life_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update their own life events"
ON public.life_events
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete their own life events"
ON public.life_events
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_life_events_updated_at
BEFORE UPDATE ON public.life_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();