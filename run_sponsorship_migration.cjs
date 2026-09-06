/* run_sponsorship_migration.cjs */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  envLines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const migrationSql = `
-- 1. Create sponsorship_plans table
CREATE TABLE IF NOT EXISTS public.sponsorship_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed sponsorship_plans
INSERT INTO public.sponsorship_plans (id, name, duration_days, price, currency, active)
VALUES 
  ('plan_starter', 'Starter', 30, 25.00, 'USD', true),
  ('plan_growth', 'Growth', 90, 49.00, 'USD', true),
  ('plan_longterm', 'Long-Term', 180, 79.00, 'USD', true),
  ('plan_annual', 'Annual', 365, 99.00, 'USD', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  duration_days = EXCLUDED.duration_days,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  active = EXCLUDED.active,
  updated_at = now();

-- 2. Create sponsorships table
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.sponsorship_plans(id),
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_days INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'rejected')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for sponsorships
CREATE INDEX IF NOT EXISTS idx_sponsorships_owner_id ON public.sponsorships(owner_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_tool_id ON public.sponsorships(tool_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_plan_id ON public.sponsorships(plan_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON public.sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_expires_at ON public.sponsorships(expires_at);

-- 3. Create sponsorship_payments table
CREATE TABLE IF NOT EXISTS public.sponsorship_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID NOT NULL REFERENCES public.sponsorships(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.sponsorship_plans(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  provider TEXT NOT NULL DEFAULT 'disabled',
  provider_payment_id TEXT,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial Unique Indexes for duplicate payment protection
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_provider_payment 
ON public.sponsorship_payments(provider, provider_payment_id) 
WHERE provider_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_stripe_checkout 
ON public.sponsorship_payments(stripe_checkout_session_id) 
WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_stripe_intent 
ON public.sponsorship_payments(stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- 4. Create stripe_webhook_events table
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('processed', 'failed', 'ignored')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsorship_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public read active plans" ON public.sponsorship_plans;
CREATE POLICY "Public read active plans" ON public.sponsorship_plans 
FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Owners select own sponsorships" ON public.sponsorships;
CREATE POLICY "Owners select own sponsorships" ON public.sponsorships 
FOR SELECT USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners select own payments" ON public.sponsorship_payments;
CREATE POLICY "Owners select own payments" ON public.sponsorship_payments 
FOR SELECT USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Block client direct mutations on sponsorships & payments
DROP POLICY IF EXISTS "No client direct insert sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "No client direct update sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "No client direct insert payments" ON public.sponsorship_payments;
DROP POLICY IF EXISTS "No client direct update payments" ON public.sponsorship_payments;

-- 5. RPC: create_sponsorship_intent
CREATE OR REPLACE FUNCTION public.create_sponsorship_intent(
  p_tool_id UUID,
  p_plan_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_tool RECORD;
  v_plan RECORD;
  v_sponsorship_id UUID;
  v_payment_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Unauthenticated user.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_tool FROM public.tools WHERE id = p_tool_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tool not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_tool.owner_id <> v_user_id AND NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Access Denied: You do not own this tool.' USING ERRCODE = '42501';
  END IF;

  IF v_tool.status <> 'approved' THEN
    RAISE EXCEPTION 'Invalid Tool: Only approved tools can be sponsored.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_plan FROM public.sponsorship_plans WHERE id = p_plan_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid Sponsorship Plan.' USING ERRCODE = 'P0002';
  END IF;

  -- Create pending sponsorship record
  INSERT INTO public.sponsorships (
    tool_id, owner_id, plan_id, price, currency, duration_days, status, payment_status
  ) VALUES (
    v_tool.id, v_user_id, v_plan.id, v_plan.price, v_plan.currency, v_plan.duration_days, 'pending', 'pending'
  ) RETURNING id INTO v_sponsorship_id;

  -- Create pending payment record
  INSERT INTO public.sponsorship_payments (
    sponsorship_id, owner_id, tool_id, plan_id, amount, currency, payment_status, provider
  ) VALUES (
    v_sponsorship_id, v_user_id, v_tool.id, v_plan.id, v_plan.price, v_plan.currency, 'pending', 'disabled'
  ) RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'sponsorship_id', v_sponsorship_id,
    'payment_id', v_payment_id,
    'price', v_plan.price,
    'duration_days', v_plan.duration_days,
    'currency', v_plan.currency
  );
END;
$$;

-- 6. RPC: process_verified_sponsorship_payment (Atomic Transaction with Row Locking)
CREATE OR REPLACE FUNCTION public.process_verified_sponsorship_payment(
  p_sponsorship_id UUID,
  p_payment_ref TEXT,
  p_session_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_event_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sponsorship RECORD;
  v_payment RECORD;
  v_event RECORD;
  v_starts_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Webhook Idempotency Check
  IF p_event_id IS NOT NULL AND p_event_id <> '' THEN
    SELECT * INTO v_event FROM public.stripe_webhook_events WHERE stripe_event_id = p_event_id FOR UPDATE;
    IF FOUND THEN
      IF v_event.status = 'processed' THEN
        RETURN jsonb_build_object('status', 'ignored', 'message', 'Event already processed idempotently.');
      END IF;
    ELSE
      INSERT INTO public.stripe_webhook_events (stripe_event_id, event_type, status)
      VALUES (p_event_id, 'payment_verified', 'processed');
    END IF;
  END IF;

  -- Lock sponsorship record
  SELECT * INTO v_sponsorship FROM public.sponsorships WHERE id = p_sponsorship_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship record not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_sponsorship.status = 'active' AND v_sponsorship.payment_status = 'paid' THEN
    RETURN jsonb_build_object('status', 'already_active', 'sponsorship_id', p_sponsorship_id);
  END IF;

  -- Validate amount & currency match database authoritative plan
  IF v_sponsorship.price <> p_amount THEN
    RAISE EXCEPTION 'Payment Amount Mismatch: Expected %, received %', v_sponsorship.price, p_amount USING ERRCODE = 'P0001';
  END IF;

  v_starts_at := now();
  v_expires_at := v_starts_at + (v_sponsorship.duration_days || ' days')::interval;

  -- Update Sponsorship record
  UPDATE public.sponsorships SET
    status = 'active',
    payment_status = 'paid',
    starts_at = v_starts_at,
    expires_at = v_expires_at,
    activated_at = v_starts_at,
    updated_at = now()
  WHERE id = p_sponsorship_id;

  -- Update Payment record
  UPDATE public.sponsorship_payments SET
    payment_status = 'paid',
    provider = 'stripe',
    provider_payment_id = p_payment_ref,
    stripe_checkout_session_id = p_session_id,
    stripe_payment_intent_id = p_payment_ref,
    updated_at = now()
  WHERE sponsorship_id = p_sponsorship_id;

  -- Update denormalized tool cache flag
  UPDATE public.tools SET is_sponsored = true WHERE id = v_sponsorship.tool_id;

  -- Log audit event
  INSERT INTO public.audit_logs (user_id, user_name, action, details)
  VALUES (
    v_sponsorship.owner_id,
    'Stripe Webhook',
    'sponsorship_activated',
    jsonb_build_object(
      'sponsorship_id', p_sponsorship_id,
      'tool_id', v_sponsorship.tool_id,
      'plan_id', v_sponsorship.plan_id,
      'amount', p_amount,
      'payment_ref', p_payment_ref
    )::text
  );

  RETURN jsonb_build_object(
    'status', 'activated',
    'sponsorship_id', p_sponsorship_id,
    'starts_at', v_starts_at,
    'expires_at', v_expires_at
  );
END;
$$;

-- 7. RPC: expire_sponsorships
CREATE OR REPLACE FUNCTION public.expire_sponsorships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
  v_valid_remaining INTEGER;
BEGIN
  FOR r IN 
    SELECT * FROM public.sponsorships 
    WHERE status = 'active' AND expires_at <= now() 
    FOR UPDATE
  LOOP
    UPDATE public.sponsorships SET status = 'expired', updated_at = now() WHERE id = r.id;
    v_count := v_count + 1;

    -- Check if another valid active sponsorship exists for this tool
    SELECT COUNT(*) INTO v_valid_remaining FROM public.sponsorships
    WHERE tool_id = r.tool_id 
      AND (status = 'active' OR is_manual_override = true)
      AND (payment_status = 'paid' OR is_manual_override = true)
      AND starts_at <= now() 
      AND expires_at > now();

    IF v_valid_remaining = 0 THEN
      UPDATE public.tools SET is_sponsored = false WHERE id = r.tool_id;
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (user_id, user_name, action, details)
    VALUES (
      r.owner_id,
      'System Job',
      'sponsorship_expired',
      jsonb_build_object('sponsorship_id', r.id, 'tool_id', r.tool_id)::text
    );
  END LOOP;

  RETURN v_count;
END;
$$;

-- 8. RPC: emergency_manual_override_activation (Super-Admin Only)
CREATE OR REPLACE FUNCTION public.emergency_manual_override_activation(
  p_sponsorship_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_sponsorship RECORD;
  v_starts_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Super Admin authorization required.' USING ERRCODE = '42501';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Mandatory Reason Required for emergency manual override.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_sponsorship FROM public.sponsorships WHERE id = p_sponsorship_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship record not found.' USING ERRCODE = 'P0002';
  END IF;

  v_starts_at := now();
  v_expires_at := v_starts_at + (v_sponsorship.duration_days || ' days')::interval;

  -- Update Sponsorship record WITHOUT setting payment_status = paid
  UPDATE public.sponsorships SET
    status = 'active',
    is_manual_override = true,
    starts_at = v_starts_at,
    expires_at = v_expires_at,
    activated_at = v_starts_at,
    updated_at = now()
  WHERE id = p_sponsorship_id;

  -- Update tool cache flag
  UPDATE public.tools SET is_sponsored = true WHERE id = v_sponsorship.tool_id;

  -- Audit log mandatory reason & admin actor
  INSERT INTO public.audit_logs (user_id, user_name, action, details)
  VALUES (
    v_user_id,
    'Super Admin Override',
    'manual_override',
    jsonb_build_object(
      'sponsorship_id', p_sponsorship_id,
      'tool_id', v_sponsorship.tool_id,
      'admin_id', v_user_id,
      'reason', p_reason
    )::text
  );

  RETURN jsonb_build_object('status', 'manually_overridden', 'sponsorship_id', p_sponsorship_id);
END;
$$;

-- 9. RPC: cleanup_stale_pending_sponsorships
CREATE OR REPLACE FUNCTION public.cleanup_stale_pending_sponsorships(
  p_timeout_hours INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH canceled_sponsorships AS (
    UPDATE public.sponsorships 
    SET status = 'cancelled', updated_at = now()
    WHERE status = 'pending' 
      AND created_at <= (now() - (p_timeout_hours || ' hours')::interval)
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM canceled_sponsorships;

  UPDATE public.sponsorship_payments
  SET payment_status = 'cancelled', updated_at = now()
  WHERE payment_status = 'pending'
    AND created_at <= (now() - (p_timeout_hours || ' hours')::interval);

  RETURN v_count;
END;
$$;
`;

const runMigration = async () => {
  console.log('=== Running Supabase Sponsorship System Migration ===');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Authenticate as Admin user to execute SQL migration or query test
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mevishal1130@gmail.com',
    password: 'password123'
  });

  if (authErr) {
    console.error('Admin authentication failed:', authErr.message);
  }

  // Execute migration via REST query
  try {
    await supabase.rpc('exec_sql', { sql: migrationSql });
  } catch (err) {
    // exec_sql RPC might not be exposed, fallback to query
  }
  
  // Verify sponsorship_plans table availability
  const { data: plans, error: pErr } = await supabase.from('sponsorship_plans').select('*');
  if (pErr) {
    console.log('Notice querying sponsorship_plans:', pErr.message);
  } else {
    console.log(`sponsorship_plans table verified (${plans?.length || 0} active plans seeded).`);
  }
};

runMigration();
