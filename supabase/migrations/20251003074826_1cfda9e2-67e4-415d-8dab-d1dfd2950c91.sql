-- Create mentions table for sentiment tracking
CREATE TABLE IF NOT EXISTS public.mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score NUMERIC(3, 2) NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  user_name TEXT NOT NULL,
  platform_user_id TEXT,
  suggested_response TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON public.mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment ON public.mentions(sentiment);
CREATE INDEX IF NOT EXISTS idx_mentions_timestamp ON public.mentions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_source ON public.mentions(source);

-- Enable Row Level Security
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own mentions"
  ON public.mentions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mentions"
  ON public.mentions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mentions"
  ON public.mentions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mentions"
  ON public.mentions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentions;