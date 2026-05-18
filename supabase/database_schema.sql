  -- =================================================================================
  -- PHASE 4: SUPABASE DATABASE SCHEMA
  -- =================================================================================
  -- Run this entire script in your Supabase SQL Editor.

  -- 1. `users` table
  -- Links to Supabase's built-in auth.users table for security
  CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    age INTEGER,
    weight DECIMAL,
    height DECIMAL,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Enable RLS for users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Users can only read and update their own data
    CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

  -- ---------------------------------------------------------------------------------

  -- 2. `workouts` table
  CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    workout_name TEXT NOT NULL,
    duration INTEGER, -- duration in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Enable RLS for workouts
  ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

  -- Users can only read/write their own workouts
  CREATE POLICY "Users can manage own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id);

  -- ---------------------------------------------------------------------------------

  -- 3. `exercise_logs` table
  CREATE TABLE IF NOT EXISTS public.exercise_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight DECIMAL NOT NULL
  );

  -- Enable RLS for exercise_logs
  ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

  -- Note: To keep policies simple, we verify that the workout belongs to the user
  CREATE POLICY "Users can manage own exercise logs" ON public.exercise_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
  );

  -- ---------------------------------------------------------------------------------

  -- 4. `food_logs` table
  CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL,
    carbs DECIMAL,
    fats DECIMAL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Enable RLS for food_logs
  ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own food logs" ON public.food_logs FOR ALL USING (auth.uid() = user_id);

  -- ---------------------------------------------------------------------------------

  -- 5. `body_metrics` table
  CREATE TABLE IF NOT EXISTS public.body_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    weight DECIMAL NOT NULL,
    body_fat DECIMAL,
    bmi DECIMAL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Enable RLS for body_metrics
  ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own body metrics" ON public.body_metrics FOR ALL USING (auth.uid() = user_id);

  -- ---------------------------------------------------------------------------------

  -- 6. `ai_recommendations` table
  CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- Enable RLS for ai_recommendations
  ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own AI recommendations" ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id);

  -- ---------------------------------------------------------------------------------

  -- 7. `subscriptions` table
  CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
  );

  -- Enable RLS for subscriptions
  ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

  -- ---------------------------------------------------------------------------------
  -- Optional trigger: Automatically create a public.users row when a new auth.users signs up
  -- ---------------------------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.handle_new_user() 
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Drop trigger if it already exists (useful if you rerun this script)
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
