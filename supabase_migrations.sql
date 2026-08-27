-- Supabase Database Migration: Step 10 Caching Counters & Index Optimizations

-- 1. Add analytics caching columns to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;

-- 2. Create the auto-increment trigger function for analytics events
CREATE OR REPLACE FUNCTION public.increment_tool_analytics_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tool_id IS NOT NULL THEN
    IF NEW.event_type = 'tool_view' THEN
      UPDATE public.tools
      SET views_count = COALESCE(views_count, 0) + 1
      WHERE id = NEW.tool_id;
    ELSIF NEW.event_type = 'website_click' THEN
      UPDATE public.tools
      SET clicks_count = COALESCE(clicks_count, 0) + 1
      WHERE id = NEW.tool_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Bind auto-increment trigger to analytics_events
DROP TRIGGER IF EXISTS trigger_increment_tool_analytics ON public.analytics_events;
CREATE TRIGGER trigger_increment_tool_analytics
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.increment_tool_analytics_counters();

-- 3. Create security check function to block direct updates of views/clicks by normal users
CREATE OR REPLACE FUNCTION public.protect_tool_analytics_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.views_count IS DISTINCT FROM NEW.views_count OR OLD.clicks_count IS DISTINCT FROM NEW.clicks_count) THEN
    -- If trigger depth is <= 1, it means the update is called directly by a client update (not from our increment function)
    IF pg_trigger_depth() <= 1 THEN
      NEW.views_count := OLD.views_count;
      NEW.clicks_count := OLD.clicks_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Bind safety trigger to tools table
DROP TRIGGER IF EXISTS trigger_protect_tool_counters ON public.tools;
CREATE TRIGGER trigger_protect_tool_counters
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.protect_tool_analytics_counters();

-- 4. Create missing indexes for fast search, filter, and sorting
CREATE INDEX IF NOT EXISTS idx_tools_pricing ON public.tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_approved_at ON public.tools(approved_at);
CREATE INDEX IF NOT EXISTS idx_tools_rating ON public.tools(rating);
CREATE INDEX IF NOT EXISTS idx_tools_review_count ON public.tools(review_count);
CREATE INDEX IF NOT EXISTS idx_tools_views_count ON public.tools(views_count);
CREATE INDEX IF NOT EXISTS idx_tools_clicks_count ON public.tools(clicks_count);
