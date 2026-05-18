-- =================================================================================
-- REUSABLE CODE ACTIVATION & PAYWALL SYSTEM SCHEMA
-- =================================================================================
-- Run this in your Supabase SQL Editor.

-- 1. Create the activation codes lookup table
CREATE TABLE IF NOT EXISTS public.activation_codes (
  code TEXT PRIMARY KEY,
  duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 6, 12))
);

-- Enable RLS (Restrict direct client select of codes)
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of codes for verification" ON public.activation_codes FOR SELECT USING (true);

-- Seed the 3 custom reusable codes
INSERT INTO public.activation_codes (code, duration_months) VALUES
('Mirrorofgym1month@123', 1),
('Mirrorofgym6month@123', 6),
('Mirrorofgym12month@123', 12)
ON CONFLICT (code) DO UPDATE SET duration_months = EXCLUDED.duration_months;

-- 2. Track which user has used which code (to prevent infinite reuse of the same code)
CREATE TABLE IF NOT EXISTS public.user_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT REFERENCES public.activation_codes(code) NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, code) -- Extremely Important: Ensures a user can only use a specific code ONCE!
);

-- Enable RLS for activations
ALTER TABLE public.user_activations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own activations" ON public.user_activations FOR ALL USING (auth.uid() = user_id);
