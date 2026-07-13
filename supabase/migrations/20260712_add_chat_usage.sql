-- Chat Usage Tracking Table
-- Tracks API usage for rate limiting and cost monitoring

CREATE TABLE chat_usage (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT 'gemini-3-flash-preview',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage
CREATE POLICY "own usage" ON chat_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage (API route)
CREATE POLICY "insert own usage" ON chat_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for fast rate limit queries
CREATE INDEX idx_chat_usage_user_date ON chat_usage (user_id, created_at DESC);
