-- ============================================
-- Phase 2 Database Setup: Session & Category Management
-- ============================================

-- 1. categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. session_types table
CREATE TABLE IF NOT EXISTS public.session_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. availability table
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE, -- null means global availability
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    recurrence_rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Row Level Security (RLS) Enablement
-- ============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- RLS Policies for `categories`
-- Public can read
CREATE POLICY "Categories are viewable by everyone." 
ON public.categories FOR SELECT USING (true);
-- Only admins can write
CREATE POLICY "Admins can manage categories." 
ON public.categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for `session_types`
-- Public can read
CREATE POLICY "Session types are viewable by everyone." 
ON public.session_types FOR SELECT USING (true);
-- Only admins can write
CREATE POLICY "Admins can manage session types." 
ON public.session_types FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for `availability`
-- Public can read
CREATE POLICY "Availability is viewable by everyone." 
ON public.availability FOR SELECT USING (true);
-- Only admins can write
CREATE POLICY "Admins can manage availability." 
ON public.availability FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for `sessions`
-- Users can read their own, Admins can read all
CREATE POLICY "Users can view their own sessions or admins can view all."
ON public.sessions FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
-- Users can create for themselves
CREATE POLICY "Users can create their own sessions."
ON public.sessions FOR INSERT WITH CHECK (
    user_id = auth.uid()
);
-- Users can update their own (or admins)
CREATE POLICY "Users can update their own sessions or admins can update all."
ON public.sessions FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
-- Only Admins can delete
CREATE POLICY "Only admins can delete sessions."
ON public.sessions FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
