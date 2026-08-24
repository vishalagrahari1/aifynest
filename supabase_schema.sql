-- Supabase PostgreSQL Schema Migration Script
-- Target: AI Tools Directory

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------
-- 1. TABLES DEFINITIONS
-- ----------------------------------------------------

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
  company TEXT,
  avatar TEXT,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  description TEXT NOT NULL,
  subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- tools
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  sub_category TEXT NOT NULL,
  pricing TEXT NOT NULL DEFAULT 'free',
  pricing_url TEXT,
  platforms JSONB NOT NULL DEFAULT '["Web"]'::jsonb,
  pricing_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  use_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  pros JSONB NOT NULL DEFAULT '[]'::jsonb,
  cons JSONB NOT NULL DEFAULT '[]'::jsonb,
  logo_url TEXT NOT NULL,
  screenshot_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  website_url TEXT NOT NULL,
  rating NUMERIC DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_sponsored BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claim_status TEXT NOT NULL DEFAULT 'unclaimed',
  last_updated DATE DEFAULT current_date,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  seo_title TEXT,
  meta_description TEXT,
  h1_title TEXT,
  canonical_url TEXT,
  social_image TEXT,
  affiliate_url TEXT,
  affiliate_status TEXT DEFAULT 'inactive',
  affiliate_network TEXT,
  affiliate_program_name TEXT
);

-- tool_submissions
CREATE TABLE IF NOT EXISTS public.tool_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  submitter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  sub_category TEXT NOT NULL,
  pricing TEXT NOT NULL,
  pricing_url TEXT,
  platforms JSONB NOT NULL DEFAULT '["Web"]'::jsonb,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  use_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  logo_url TEXT NOT NULL,
  screenshot_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  website_url TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_changes', 'draft')),
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tool_claims
CREATE TABLE IF NOT EXISTS public.tool_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  verification_info TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

-- reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating NUMERIC NOT NULL,
  ease_of_use NUMERIC,
  value_for_money NUMERIC,
  features NUMERIC,
  performance NUMERIC,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_favorite UNIQUE (user_id, tool_id)
);

-- analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  session_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referrer TEXT,
  device TEXT,
  browser TEXT,
  path TEXT
);

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  placement TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  spent NUMERIC DEFAULT 0.0,
  remaining_budget NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  invoice_number TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  type TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------
-- 2. TRIGGERS & RECURSION HELPER FUNCTIONS
-- ----------------------------------------------------

-- Profile creation synchronization function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, interests)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    '[]'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile role escalation prevention trigger
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent role updates by non-admin callers
  IF NEW.role <> OLD.role AND NOT public.is_admin(auth.uid()) THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE TRIGGER trigger_profile_role_check
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_update();

-- Automatic Unique Slug generator function
CREATE OR REPLACE FUNCTION generate_unique_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 2;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    IF base_slug = '' THEN
      base_slug := 'tool';
    END IF;
  ELSE
    base_slug := NEW.slug;
  END IF;

  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.tools WHERE slug = new_slug AND id != NEW.id) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_slug_generation
  BEFORE INSERT OR UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION generate_unique_slug();

-- Admin validation helper (prevents recursive RLS loops)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = user_id),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Analytics insertion security check trigger (prevents spoofing, invalid types and timestamps)
CREATE OR REPLACE FUNCTION public.check_analytics_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Validate event type limits
  IF NEW.event_type NOT IN (
    'tool_view', 'website_click', 'favorite', 'review_submitted', 
    'search_impression', 'tool_share', 'sponsored_impression', 
    'sponsored_click', 'tool_click', 'affiliate_click',
    'category_view', 'search'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Invalid event type.';
  END IF;

  -- 2. Validate tool ID format references (ensure tool_id exists if specified)
  IF NEW.tool_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.tools WHERE id = NEW.tool_id) THEN
    RAISE EXCEPTION 'Access Denied: Referenced tool does not exist.';
  END IF;

  -- 3. Force session user authentication identity (prevents impersonation)
  NEW.user_id := auth.uid();

  -- 4. Enforce server-authoritative timestamp limits (prevents temporal spoofing)
  NEW.timestamp := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE TRIGGER trigger_analytics_insert_check
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.check_analytics_insert();

-- ----------------------------------------------------
-- 3. SERVER-SIDE ATOMIC TRANSACTION FUNCTIONS (RPCs)
-- ----------------------------------------------------

-- approve_submission RPC (spoof-proof: reads auth.uid() directly)
CREATE OR REPLACE FUNCTION public.approve_submission(sub_id UUID, notes TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  reviewer_id UUID := auth.uid();
  sub_row public.tool_submissions%ROWTYPE;
  target_tool_id UUID;
BEGIN
  -- 1. Authorization
  IF NOT public.is_admin(reviewer_id) THEN
    RAISE EXCEPTION 'Access Denied: Admin privileges required.';
  END IF;

  -- 2. Fetch submission metadata
  SELECT * INTO sub_row FROM public.tool_submissions WHERE id = sub_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or not in pending state.';
  END IF;

  -- 3. Apply changes to tools
  IF sub_row.tool_id IS NULL THEN
    -- New Tool submission
    INSERT INTO public.tools (
      name, tagline, description, category_slug, sub_category, pricing, pricing_url,
      platforms, logo_url, screenshot_urls, video_url, website_url, tags, status, owner_id, approved_at, approved_by
    ) VALUES (
      sub_row.name, sub_row.tagline, sub_row.description, sub_row.category_slug, sub_row.sub_category,
      sub_row.pricing, sub_row.pricing_url, sub_row.platforms, sub_row.logo_url, sub_row.screenshot_urls,
      sub_row.video_url, sub_row.website_url, sub_row.tags, 'approved', sub_row.submitter_id, now(), reviewer_id
    ) RETURNING id INTO target_tool_id;
  ELSE
    -- Edit Submission
    target_tool_id := sub_row.tool_id;
    UPDATE public.tools SET
      name = sub_row.name,
      tagline = sub_row.tagline,
      description = sub_row.description,
      category_slug = sub_row.category_slug,
      sub_category = sub_row.sub_category,
      pricing = sub_row.pricing,
      pricing_url = sub_row.pricing_url,
      platforms = sub_row.platforms,
      logo_url = sub_row.logo_url,
      screenshot_urls = sub_row.screenshot_urls,
      video_url = sub_row.video_url,
      website_url = sub_row.website_url,
      tags = sub_row.tags,
      last_updated = current_date,
      status = 'approved',
      approved_at = now(),
      approved_by = reviewer_id
    WHERE id = target_tool_id;
  END IF;

  -- 4. Close submission
  UPDATE public.tool_submissions SET
    status = 'approved',
    admin_notes = notes,
    updated_at = now()
  WHERE id = sub_id;

  -- 5. Record Log
  INSERT INTO public.audit_logs (user_id, user_name, action, details)
  VALUES (reviewer_id, 'Admin', 'Approve Submission', 'Approved submission ID ' || sub_id || ' to tools ID ' || target_tool_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- approve_claim RPC (spoof-proof: reads auth.uid() directly)
CREATE OR REPLACE FUNCTION public.approve_claim(claim_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  reviewer_id UUID := auth.uid();
  target_tool_id UUID;
  new_owner_id UUID;
BEGIN
  IF NOT public.is_admin(reviewer_id) THEN
    RAISE EXCEPTION 'Access Denied: Admin privileges required.';
  END IF;

  SELECT tool_id, claimant_id INTO target_tool_id, new_owner_id FROM public.tool_claims WHERE id = claim_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found or not in pending state.';
  END IF;

  -- 1. Update claims status
  UPDATE public.tool_claims SET status = 'approved', reviewed_at = now(), reviewed_by = reviewer_id WHERE id = claim_id;

  -- 2. Update tool owner
  UPDATE public.tools SET owner_id = new_owner_id, claim_status = 'claimed' WHERE id = target_tool_id;

  -- 3. Log details
  INSERT INTO public.audit_logs (user_id, user_name, action, details)
  VALUES (reviewer_id, 'Admin', 'Approve Claim', 'Assigned owner ' || new_owner_id || ' to tool ' || target_tool_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- get_owner_tool_stats RPC (spoof-proof: reads auth.uid() directly)
CREATE OR REPLACE FUNCTION public.get_owner_tool_stats(target_tool_uuid UUID, range_days INTEGER)
RETURNS TABLE (
  views_count BIGINT,
  clicks_count BIGINT,
  ctr_value NUMERIC,
  saves_count BIGINT,
  reviews_count BIGINT
) AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tools WHERE id = target_tool_uuid AND owner_id = caller_id) THEN
    RAISE EXCEPTION 'Access Denied: Unowned tool reference.';
  END IF;

  RETURN QUERY
  WITH event_counts AS (
    SELECT
      COUNT(1) FILTER (WHERE event_type = 'tool_view') AS views,
      COUNT(1) FILTER (WHERE event_type = 'website_click') AS clicks,
      COUNT(1) FILTER (WHERE event_type = 'favorite') AS saves
    FROM public.analytics_events
    WHERE tool_id = target_tool_uuid
      AND (range_days = 0 OR timestamp >= now() - (range_days || ' days')::INTERVAL)
  )
  SELECT
    views::BIGINT,
    clicks::BIGINT,
    CASE WHEN views > 0 THEN ROUND((clicks::numeric / views::numeric) * 100, 2) ELSE 0.0 END,
    saves::BIGINT,
    (SELECT COUNT(1) FROM public.reviews WHERE tool_id = target_tool_uuid AND status = 'approved')::BIGINT
  FROM event_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ----------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users edit self profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.is_admin(auth.uid()));

-- Tools Policies
CREATE POLICY "Public Read Approved Tools" ON public.tools FOR SELECT USING (status = 'approved');
CREATE POLICY "Admin full tools access" ON public.tools FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Owner read own tools" ON public.tools FOR SELECT USING (owner_id = auth.uid());

-- Submissions Policies
CREATE POLICY "Submitter manage own" ON public.tool_submissions FOR ALL USING (submitter_id = auth.uid());
CREATE POLICY "Admin submissions access" ON public.tool_submissions FOR ALL USING (public.is_admin(auth.uid()));

-- Claims Policies
CREATE POLICY "Claimant manage own" ON public.tool_claims FOR ALL USING (claimant_id = auth.uid());
CREATE POLICY "Admin claims access" ON public.tool_claims FOR ALL USING (public.is_admin(auth.uid()));

-- Reviews Policies
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "User write own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin reviews access" ON public.reviews FOR ALL USING (public.is_admin(auth.uid()));

-- Favorites Policies
CREATE POLICY "User manage own favorites" ON public.favorites FOR ALL USING (user_id = auth.uid());

-- Analytics Policies
CREATE POLICY "Public write events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin view analytics" ON public.analytics_events FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Owner view analytics" ON public.analytics_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.tools WHERE id = analytics_events.tool_id AND owner_id = auth.uid()));

-- Campaigns & Payments Policies
CREATE POLICY "Owner view campaigns" ON public.campaigns FOR SELECT USING (EXISTS (SELECT 1 FROM public.tools WHERE id = campaigns.tool_id AND owner_id = auth.uid()));
CREATE POLICY "Admin manage campaigns" ON public.campaigns FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Owner view payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.campaigns c JOIN public.tools t ON c.tool_id = t.id WHERE c.id = payments.campaign_id AND t.owner_id = auth.uid()));
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL USING (public.is_admin(auth.uid()));

-- Audit Logs Policies
CREATE POLICY "Admin view logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin create logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Notifications Policies
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------
-- 5. INDEXES OPTIMIZATIONS
-- ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools(category_slug);
CREATE INDEX IF NOT EXISTS idx_tools_owner ON public.tools(owner_id);
CREATE INDEX IF NOT EXISTS idx_tools_status ON public.tools(status);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.tool_submissions(status);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.tool_claims(status);
CREATE INDEX IF NOT EXISTS idx_reviews_tool ON public.reviews(tool_id);
CREATE INDEX IF NOT EXISTS idx_analytics_tool_type ON public.analytics_events(tool_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON public.analytics_events(timestamp);
