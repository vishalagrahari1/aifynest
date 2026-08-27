-- Supabase Database Migration: Step 12 UX, Trust, SEO & Growth System

-- 1. Alter Tools table to inject verification_status
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified'));

-- 2. Create Tool Verification Requests Table
CREATE TABLE IF NOT EXISTS public.tool_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL UNIQUE REFERENCES public.tools(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Anti-Spam Trigger on Reports
CREATE OR REPLACE FUNCTION public.check_report_anti_spam()
RETURNS TRIGGER AS $$
DECLARE
  v_report_count INT;
BEGIN
  -- Duplicate prevention: Cannot report same tool if a report is already pending
  IF EXISTS (
    SELECT 1 FROM public.reports
    WHERE tool_id = NEW.tool_id
      AND status = 'pending'
      AND (
        (NEW.reporter_user_id IS NOT NULL AND reporter_user_id = NEW.reporter_user_id)
        OR (NEW.reporter_user_id IS NULL AND session_id = NEW.session_id)
      )
  ) THEN
    RAISE EXCEPTION 'Duplicate Report: A pending report for this tool has already been filed by you.';
  END IF;

  -- Rate limiting: max 3 per hour per session/user
  SELECT count(*) INTO v_report_count
  FROM public.reports
  WHERE (
    (NEW.reporter_user_id IS NOT NULL AND reporter_user_id = NEW.reporter_user_id)
    OR (NEW.reporter_user_id IS NULL AND session_id = NEW.session_id)
  ) AND created_at > now() - INTERVAL '1 hour';

  IF v_report_count >= 3 THEN
    RAISE EXCEPTION 'Rate Limit Exceeded: You can submit at most 3 reports per hour.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_report_anti_spam ON public.reports;
CREATE TRIGGER trigger_report_anti_spam
  BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.check_report_anti_spam();

-- 5. Tool Verification Status Protection Trigger
CREATE OR REPLACE FUNCTION public.check_tool_verification_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.verification_status IS DISTINCT FROM NEW.verification_status OR OLD.is_verified IS DISTINCT FROM NEW.is_verified) THEN
    IF pg_trigger_depth() <= 1 AND NOT (public.is_admin(auth.uid()) OR auth.role() = 'service_role') THEN
      NEW.verification_status := OLD.verification_status;
      NEW.is_verified := OLD.is_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_check_tool_verification ON public.tools;
CREATE TRIGGER trigger_check_tool_verification
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.check_tool_verification_update();

-- 6. Admin Verification RPC functions
CREATE OR REPLACE FUNCTION public.approve_tool_verification(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
  v_request RECORD;
  v_admin_name TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required.';
  END IF;

  SELECT name INTO v_admin_name FROM public.profiles WHERE id = auth.uid();

  SELECT * INTO v_request FROM public.tool_verification_requests WHERE id = p_request_id FOR UPDATE;
  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Not Found: Verification request does not exist.';
  END IF;

  -- Update request status
  UPDATE public.tool_verification_requests
  SET status = 'approved', updated_at = now()
  WHERE id = p_request_id;

  -- Update tool status
  UPDATE public.tools
  SET verification_status = 'verified', is_verified = true
  WHERE id = v_request.tool_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (user_id, user_name, action, details)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_name, 'Admin'),
    'approve_verification',
    'Approved tool verification request ' || p_request_id::text || ' for tool ' || v_request.tool_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.revoke_tool_verification(p_tool_id UUID, p_reason TEXT)
RETURNS VOID AS $$
DECLARE
  v_admin_name TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required.';
  END IF;

  SELECT name INTO v_admin_name FROM public.profiles WHERE id = auth.uid();

  -- Update tool status
  UPDATE public.tools
  SET verification_status = 'unverified', is_verified = false
  WHERE id = p_tool_id;

  -- Delete verification requests
  DELETE FROM public.tool_verification_requests
  WHERE tool_id = p_tool_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (user_id, user_name, action, details)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_name, 'Admin'),
    'revoke_verification',
    'Revoked verification for tool ' || p_tool_id::text || '. Reason: ' || p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 7. Row Level Security (RLS) Configurations
ALTER TABLE public.tool_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Verification Requests RLS Policies
DROP POLICY IF EXISTS "Users view own verification requests" ON public.tool_verification_requests;
CREATE POLICY "Users view own verification requests" ON public.tool_verification_requests
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owner insert verification request" ON public.tool_verification_requests;
CREATE POLICY "Owner insert verification request" ON public.tool_verification_requests
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (SELECT 1 FROM public.tools WHERE id = tool_id AND owner_id = auth.uid())
  );

-- Reports RLS Policies
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
CREATE POLICY "Anyone can insert reports" ON public.reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view and modify reports" ON public.reports;
CREATE POLICY "Admins view and modify reports" ON public.reports
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
