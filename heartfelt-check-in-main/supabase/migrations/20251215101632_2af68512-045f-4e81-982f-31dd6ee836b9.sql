-- Add trigger_type and polarity columns to factor_entries for context-driven insights
ALTER TABLE public.factor_entries 
ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'activity',
ADD COLUMN IF NOT EXISTS polarity text DEFAULT 'unknown';

-- Add constraint for trigger_type values
ALTER TABLE public.factor_entries
ADD CONSTRAINT factor_entries_trigger_type_check 
CHECK (trigger_type IN ('people', 'activity', 'place', 'external', 'custom'));

-- Add constraint for polarity values  
ALTER TABLE public.factor_entries
ADD CONSTRAINT factor_entries_polarity_check
CHECK (polarity IN ('positive', 'neutral', 'negative', 'unknown'));

-- Create index for efficient querying by trigger type
CREATE INDEX IF NOT EXISTS idx_factor_entries_trigger_type ON public.factor_entries(trigger_type);
CREATE INDEX IF NOT EXISTS idx_factor_entries_polarity ON public.factor_entries(polarity);