-- PatternLab Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends Auth Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'python',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. User Settings (To store API keys globally if user chooses to sync)
-- Note: The original spec said API keys should only be in localStorage. 
-- This table allows syncing if explicitly requested.
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  model_preference TEXT DEFAULT 'gemini-1.5-flash',
  theme TEXT DEFAULT 'dark',
  api_keys JSONB DEFAULT '{}'::jsonb, -- Store keys like {"gemini": "...", "openai": "..."}
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings." ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- 3. Progress Tracking Table
CREATE TABLE public.progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  level1_solved INTEGER DEFAULT 0,
  level1_total INTEGER DEFAULT 3,
  level2_solved INTEGER DEFAULT 0,
  level2_total INTEGER DEFAULT 3,
  level3_solved INTEGER DEFAULT 0,
  level3_total INTEGER DEFAULT 3,
  fully_completed BOOLEAN DEFAULT false,
  last_attempted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_slug)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own progress." ON public.progress FOR ALL USING (auth.uid() = user_id);

-- 4. Activity Heatmap Table
CREATE TABLE public.heatmap (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- YYYY-MM-DD
  count INTEGER DEFAULT 1,
  UNIQUE(user_id, date)
);

ALTER TABLE public.heatmap ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own heatmap." ON public.heatmap FOR ALL USING (auth.uid() = user_id);

-- 5. Chat Sessions
CREATE TABLE public.chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat sessions." ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);

-- 6. Chat Messages
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage messages in their sessions." 
  ON public.chat_messages FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid()
    )
  );
