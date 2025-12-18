-- Create mood_entries table for tracking mood check-ins
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mood_score INTEGER NOT NULL CHECK (mood_score >= -3 AND mood_score <= 3),
  mood_label TEXT NOT NULL,
  sub_emotions TEXT[] DEFAULT '{}',
  notes TEXT,
  time_of_day_bucket TEXT CHECK (time_of_day_bucket IN ('morning', 'afternoon', 'evening', 'night'))
);

-- Create factor_entries table for tracking lifestyle factors
CREATE TABLE public.factor_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  factor_type TEXT NOT NULL,
  factor_emoji TEXT,
  intensity INTEGER DEFAULT 1 CHECK (intensity >= 0 AND intensity <= 5),
  mood_entry_id UUID REFERENCES public.mood_entries(id) ON DELETE SET NULL
);

-- Enable RLS on both tables
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factor_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for mood_entries (users can only access their own data)
CREATE POLICY "Users can view their own mood entries"
ON public.mood_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood entries"
ON public.mood_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
ON public.mood_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
ON public.mood_entries FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for factor_entries
CREATE POLICY "Users can view their own factor entries"
ON public.factor_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own factor entries"
ON public.factor_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own factor entries"
ON public.factor_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own factor entries"
ON public.factor_entries FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_mood_entries_user_created ON public.mood_entries(user_id, created_at DESC);
CREATE INDEX idx_mood_entries_mood_label ON public.mood_entries(mood_label);
CREATE INDEX idx_factor_entries_user_created ON public.factor_entries(user_id, created_at DESC);
CREATE INDEX idx_factor_entries_factor_type ON public.factor_entries(factor_type);