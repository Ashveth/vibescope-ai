-- Add new columns to mentions table for enhanced features
ALTER TABLE public.mentions
ADD COLUMN IF NOT EXISTS emotions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitor TEXT,
ADD COLUMN IF NOT EXISTS response_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS team_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Create competitors table
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable RLS on competitors
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own competitors"
  ON public.competitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitors"
  ON public.competitors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitors"
  ON public.competitors FOR DELETE
  USING (auth.uid() = user_id);

-- Create alert_settings table
CREATE TABLE IF NOT EXISTS public.alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  auto_alerts_enabled BOOLEAN DEFAULT true,
  alert_threshold TEXT DEFAULT 'medium' CHECK (alert_threshold IN ('low', 'medium', 'high')),
  notification_methods JSONB DEFAULT '{"email": true, "slack": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on alert_settings
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert settings"
  ON public.alert_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert settings"
  ON public.alert_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert settings"
  ON public.alert_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create feedback_loop table for AI learning
CREATE TABLE IF NOT EXISTS public.feedback_loop (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mention_id UUID REFERENCES public.mentions(id) ON DELETE CASCADE,
  original_response TEXT NOT NULL,
  edited_response TEXT NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('approved', 'edited', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on feedback_loop
ALTER TABLE public.feedback_loop ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.feedback_loop FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.feedback_loop FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_loop;

-- Update dummy data with emotions, tags, and severity
UPDATE public.mentions
SET 
  emotions = CASE 
    WHEN sentiment = 'negative' THEN '{"anger": 0.7, "frustration": 0.8, "sadness": 0.5}'::jsonb
    WHEN sentiment = 'neutral' THEN '{"neutral": 0.6, "curiosity": 0.4}'::jsonb
    ELSE '{"joy": 0.8, "satisfaction": 0.9}'::jsonb
  END,
  tags = CASE 
    WHEN content LIKE '%crash%' OR content LIKE '%bug%' THEN ARRAY['technical', 'quality']
    WHEN content LIKE '%support%' OR content LIKE '%response%' THEN ARRAY['customer_service', 'communication']
    WHEN content LIKE '%price%' OR content LIKE '%value%' THEN ARRAY['pricing', 'value']
    ELSE ARRAY['general', 'product']
  END,
  severity = CASE 
    WHEN sentiment = 'negative' AND sentiment_score < 0.2 THEN 'critical'
    WHEN sentiment = 'negative' AND sentiment_score < 0.3 THEN 'high'
    WHEN sentiment = 'negative' THEN 'medium'
    ELSE 'low'
  END
WHERE user_id IS NULL;