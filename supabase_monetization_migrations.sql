-- Supabase Database Migration: Step 11 Monetization & Revenue System

-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.owner_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
  available_balance NUMERIC NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0.00),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Alter Existing Campaigns Table to inject Step 11 fields if missing
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'search_sponsored';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS cpc_bid NUMERIC DEFAULT 0.20 CHECK (cpc_bid >= 0.01);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS daily_budget NUMERIC DEFAULT 10.00 CHECK (daily_budget >= 0.00);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS total_budget NUMERIC DEFAULT 0.00 CHECK (total_budget >= 0.00);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS amount_spent NUMERIC DEFAULT 0.00 CHECK (amount_spent >= 0.00);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days');
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Seed owner_id from tools table matching existing records
UPDATE public.campaigns c
SET owner_id = t.owner_id
FROM public.tools t
WHERE c.tool_id = t.id AND c.owner_id IS NULL;

-- Enforce check constraints on campaigns
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS check_end_at_gt_start_at;
ALTER TABLE public.campaigns ADD CONSTRAINT check_end_at_gt_start_at CHECK (end_at > start_at);

ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS check_remaining_budget_lte_total_budget;
ALTER TABLE public.campaigns ADD CONSTRAINT check_remaining_budget_lte_total_budget CHECK (remaining_budget <= total_budget);

-- 3. Alter Existing Payments Table to inject Step 11 fields if missing
ALTER TABLE public.payments ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'manual';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_payment_id TEXT UNIQUE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'refunded'));
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'wallet_topup';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Back-seed owner_id on existing payments from campaigns
UPDATE public.payments p
SET owner_id = c.owner_id
FROM public.campaigns c
WHERE p.campaign_id = c.id AND p.owner_id IS NULL;

-- 4. Create Financial Ledger Table
CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'payment', 'click_charge', 'refund', 'adjustment')),
  amount NUMERIC NOT NULL CHECK (amount != 0.00),
  currency TEXT NOT NULL DEFAULT 'USD',
  reference_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Add custom caching fields to analytics_events if missing
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS cpc_charged NUMERIC DEFAULT 0.00;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;

-- 6. Click Charging Trigger Function: process_sponsored_click_charge
CREATE OR REPLACE FUNCTION public.process_sponsored_click_charge()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign RECORD;
  v_charge NUMERIC;
BEGIN
  IF NEW.event_type = 'website_click' AND NEW.tool_id IS NOT NULL THEN
    
    -- Lock campaign row atomically using FOR UPDATE
    SELECT * INTO v_campaign
    FROM public.campaigns
    WHERE tool_id = NEW.tool_id 
      AND status = 'active'
      AND now() BETWEEN start_at AND end_at
      AND remaining_budget > 0
    FOR UPDATE;

    IF v_campaign.id IS NOT NULL THEN
      -- Fraud Prevention: click deduplication per session on same tool in 24 hours
      IF EXISTS (
        SELECT 1 FROM public.analytics_events
        WHERE session_id = NEW.session_id
          AND tool_id = NEW.tool_id
          AND event_type = 'website_click'
          AND timestamp > now() - INTERVAL '24 hours'
      ) THEN
        NEW.is_duplicate := true;
        NEW.cpc_charged := 0.00;
      ELSE
        v_charge := LEAST(v_campaign.cpc_bid, v_campaign.remaining_budget);
        
        -- Deduct campaign budgets
        UPDATE public.campaigns
        SET spent = COALESCE(spent, 0) + v_charge,
            remaining_budget = remaining_budget - v_charge,
            status = CASE WHEN remaining_budget - v_charge <= 0 THEN 'exhausted' ELSE status END
        WHERE id = v_campaign.id;

        -- Un-sponsor tool if campaign budget is depleted
        IF v_campaign.remaining_budget - v_charge <= 0 THEN
          UPDATE public.tools
          SET is_sponsored = false, is_featured = false
          WHERE id = NEW.tool_id;
        END IF;

        NEW.is_duplicate := false;
        NEW.cpc_charged := v_charge;

        -- Record atomic debit entry in append-only financial ledger
        INSERT INTO public.financial_ledger (
          owner_id,
          campaign_id,
          transaction_type,
          amount,
          currency,
          reference_id
        ) VALUES (
          v_campaign.owner_id,
          v_campaign.id,
          'click_charge',
          -v_charge,
          'USD',
          NEW.id::text
        );
      END IF;
    ELSE
      NEW.cpc_charged := 0.00;
      NEW.is_duplicate := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Bind click charge trigger to analytics_events
DROP TRIGGER IF EXISTS trigger_sponsored_click_charge ON public.analytics_events;
CREATE TRIGGER trigger_sponsored_click_charge
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.process_sponsored_click_charge();

-- 7. Payment Simulation RPC: simulate_wallet_deposit
CREATE OR REPLACE FUNCTION public.simulate_wallet_deposit(
  p_owner_id UUID,
  p_amount NUMERIC,
  p_provider TEXT,
  p_provider_payment_id TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.payments (
    owner_id,
    provider,
    provider_payment_id,
    amount,
    currency,
    status,
    payment_type,
    date,
    invoice_number,
    description
  ) VALUES (
    p_owner_id,
    p_provider,
    p_provider_payment_id,
    p_amount,
    'USD',
    'pending',
    'wallet_topup',
    current_date,
    COALESCE(p_provider_payment_id, 'INV-' || floor(random()*90000 + 10000)::text),
    'Simulated wallet deposit top-up via ' || p_provider
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 8. Payment Verification RPC: verify_payment
CREATE OR REPLACE FUNCTION public.verify_payment(
  p_payment_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_payment RECORD;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required.';
  END IF;

  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF v_payment.id IS NOT NULL AND v_payment.status = 'pending' THEN
    UPDATE public.payments
    SET status = 'verified',
        verified_at = now()
    WHERE id = p_payment_id;

    INSERT INTO public.owner_wallets (owner_id, available_balance, currency)
    VALUES (v_payment.owner_id, v_payment.amount, 'USD')
    ON CONFLICT (owner_id)
    DO UPDATE SET available_balance = public.owner_wallets.available_balance + EXCLUDED.available_balance,
                  updated_at = now();

    INSERT INTO public.financial_ledger (
      owner_id,
      payment_id,
      transaction_type,
      amount,
      currency,
      reference_id
    ) VALUES (
      v_payment.owner_id,
      p_payment_id,
      'credit',
      v_payment.amount,
      'USD',
      v_payment.provider_payment_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 9. Campaign Allocation RPC: fund_campaign
CREATE OR REPLACE FUNCTION public.fund_campaign(
  p_campaign_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_campaign RECORD;
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF v_campaign.owner_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Owner authorization required.';
  END IF;

  SELECT * INTO v_wallet
  FROM public.owner_wallets
  WHERE owner_id = v_campaign.owner_id
  FOR UPDATE;

  IF v_wallet.available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient Funds: Wallet balance is low.';
  END IF;

  UPDATE public.owner_wallets
  SET available_balance = available_balance - p_amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  UPDATE public.campaigns
  SET total_budget = COALESCE(total_budget, 0) + p_amount,
      remaining_budget = COALESCE(remaining_budget, 0) + p_amount,
      status = 'pending'
  WHERE id = p_campaign_id;

  INSERT INTO public.financial_ledger (
    owner_id,
    campaign_id,
    transaction_type,
    amount,
    currency
  ) VALUES (
    v_campaign.owner_id,
    p_campaign_id,
    'debit',
    -p_amount,
    'USD'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 10. Campaign Approval RPC: approve_campaign
CREATE OR REPLACE FUNCTION public.approve_campaign(
  p_campaign_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_campaign RECORD;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required.';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF v_campaign.id IS NOT NULL THEN
    UPDATE public.campaigns
    SET status = 'active',
        updated_at = now()
    WHERE id = p_campaign_id;

    UPDATE public.tools
    SET is_sponsored = true
    WHERE id = v_campaign.tool_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 10.5 Sync tool sponsorship status trigger
CREATE OR REPLACE FUNCTION public.sync_tool_sponsorship_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.tools
    SET is_sponsored = true
    WHERE id = NEW.tool_id;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE tool_id = NEW.tool_id AND status = 'active' AND id != NEW.id
    ) THEN
      UPDATE public.tools
      SET is_sponsored = false, is_featured = false
      WHERE id = NEW.tool_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_sync_tool_sponsorship ON public.campaigns;
CREATE TRIGGER trigger_sync_tool_sponsorship
  AFTER INSERT OR UPDATE OF status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.sync_tool_sponsorship_status();

-- 11. Row Level Security (RLS) Policy Configurations
ALTER TABLE public.owner_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;

-- Owner Wallets
DROP POLICY IF EXISTS "Owner view wallet" ON public.owner_wallets;
CREATE POLICY "Owner view wallet" ON public.owner_wallets
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Campaigns
DROP POLICY IF EXISTS "Owner view campaigns" ON public.campaigns;
CREATE POLICY "Owner view campaigns" ON public.campaigns
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owner insert campaigns" ON public.campaigns;
CREATE POLICY "Owner insert campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() 
    AND status = 'draft'
    AND EXISTS (SELECT 1 FROM public.tools WHERE id = tool_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owner update campaigns" ON public.campaigns;
CREATE POLICY "Owner update campaigns" ON public.campaigns
  FOR UPDATE USING (
    owner_id = auth.uid() OR public.is_admin(auth.uid())
  ) WITH CHECK (
    status IN ('draft', 'paused')
  );

-- Payments
DROP POLICY IF EXISTS "Owner view payments" ON public.payments;
CREATE POLICY "Owner view payments" ON public.payments
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owner insert payments" ON public.payments;
CREATE POLICY "Owner insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() 
    AND status = 'pending'
  );

-- Financial Ledger
DROP POLICY IF EXISTS "Owner view ledger" ON public.financial_ledger;
CREATE POLICY "Owner view ledger" ON public.financial_ledger
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- 12. Admin Balance Adjustment RPC
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_owner_id UUID,
  p_amount NUMERIC,
  p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
  v_admin_name TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Admin authorization required.';
  END IF;

  SELECT name INTO v_admin_name FROM public.profiles WHERE id = auth.uid();

  -- Lock wallet
  PERFORM 1 FROM public.owner_wallets WHERE owner_id = p_owner_id FOR UPDATE;

  IF FOUND THEN
    UPDATE public.owner_wallets
    SET available_balance = available_balance + p_amount,
        updated_at = now()
    WHERE owner_id = p_owner_id;
  ELSE
    -- If wallet doesn't exist, try to insert it (amount must be >= 0 or constraint will reject)
    INSERT INTO public.owner_wallets (owner_id, available_balance, currency)
    VALUES (p_owner_id, p_amount, 'USD');
  END IF;

  -- Append ledger adjustment record
  INSERT INTO public.financial_ledger (
    owner_id,
    transaction_type,
    amount,
    currency,
    reference_id,
    metadata
  ) VALUES (
    p_owner_id,
    'adjustment',
    p_amount,
    'USD',
    'admin_adj',
    json_build_object('reason', p_reason, 'admin_id', auth.uid())
  );

  -- Log action in audit logs
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    details
  ) VALUES (
    auth.uid(),
    COALESCE(v_admin_name, 'Admin'),
    'monetization_adjustment',
    'Adjusted wallet balance for owner ' || p_owner_id::text || ' by amount ' || p_amount::text || '. Reason: ' || p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 13. Campaign Financials Protection Trigger
CREATE OR REPLACE FUNCTION public.check_campaign_financials_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.remaining_budget IS DISTINCT FROM NEW.remaining_budget OR
      OLD.spent IS DISTINCT FROM NEW.spent OR
      OLD.total_budget IS DISTINCT FROM NEW.total_budget OR
      OLD.amount_spent IS DISTINCT FROM NEW.amount_spent) THEN
    
    IF pg_trigger_depth() <= 1 AND NOT (public.is_admin(auth.uid()) OR auth.role() = 'service_role') THEN
      NEW.remaining_budget := OLD.remaining_budget;
      NEW.spent := OLD.spent;
      NEW.total_budget := OLD.total_budget;
      NEW.amount_spent := OLD.amount_spent;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_check_campaign_financials ON public.campaigns;
CREATE TRIGGER trigger_check_campaign_financials
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.check_campaign_financials_update();

-- 14. Tool Sponsorship Flags Protection Trigger
CREATE OR REPLACE FUNCTION public.check_tool_sponsorship_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.is_sponsored IS DISTINCT FROM NEW.is_sponsored OR OLD.is_featured IS DISTINCT FROM NEW.is_featured) THEN
    IF pg_trigger_depth() <= 1 AND NOT (public.is_admin(auth.uid()) OR auth.role() = 'service_role') THEN
      NEW.is_sponsored := OLD.is_sponsored;
      NEW.is_featured := OLD.is_featured;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_check_tool_sponsorship ON public.tools;
CREATE TRIGGER trigger_check_tool_sponsorship
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.check_tool_sponsorship_update();

