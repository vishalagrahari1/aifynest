/* C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\test_monetization_compliance.cjs */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://izjpavrrcbglrdvrqeng.supabase.co';
const anonKey = 'sb_publishable_mwuzxPcr8pPb6-SmURgBoA_NRqL0jna';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || anonKey;

const initClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

async function runTests() {
  console.log('--- START STEP 11 MONETIZATION COMPLIANCE & CONCURRENCY TESTS ---');

  const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const ownerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const normalClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const adminClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  // Log in authenticated clients
  await adminClient.auth.signInWithPassword({ email: 'mevishal1130@gmail.com', password: 'password123' });
  await ownerClient.auth.signInWithPassword({ email: 'owner@synthesia.io', password: 'password123' });
  await normalClient.auth.signInWithPassword({ email: 'john@gmail.com', password: 'password123' });

  // Load test users
  const { data: profiles, error: profErr } = await adminClient.from('profiles').select('id, email, role');
  if (profErr || !profiles) {
    console.error('Failed to load profiles:', profErr?.message);
    process.exit(1);
  }

  const adminUser = profiles.find(p => p.role === 'admin');
  const ownerUser = profiles.find(p => p.role === 'owner');
  const normalUser = profiles.find(p => p.role === 'user');

  if (!adminUser || !ownerUser || !normalUser) {
    console.error('Test profiles missing in database. Make sure you have normal, owner, and admin users.');
    process.exit(1);
  }

  console.log(`Admin User ID: ${adminUser.id} (${adminUser.email})`);
  console.log(`Owner User ID: ${ownerUser.id} (${ownerUser.email})`);
  console.log(`Normal User ID: ${normalUser.id} (${normalUser.email})`);

  // Temporarily assign "Zoice" to ownerUser for testing
  const { data: zoiceTool, error: zoiceErr } = await adminClient
    .from('tools')
    .select('id, owner_id')
    .eq('name', 'Zoice')
    .single();

  if (zoiceErr || !zoiceTool) {
    console.error('Failed to locate Zoice test tool in database:', zoiceErr?.message);
    process.exit(1);
  }

  const originalOwnerId = zoiceTool.owner_id;
  await adminClient.from('tools').update({ owner_id: ownerUser.id }).eq('id', zoiceTool.id);

  const testTool = { id: zoiceTool.id, name: 'Zoice' };
  console.log(`Owner Tool Assigned: "${testTool.name}" (${testTool.id})`);

  // ==========================================
  // TEST 1: Guest Restrictions
  // ==========================================
  console.log('\n[TEST 1] Verifying Guest Restrictions...');
  const { data: gWallet, error: gWalletErr } = await anonClient.from('owner_wallets').select('*');
  const { data: gLedger, error: gLedgerErr } = await anonClient.from('financial_ledger').select('*');
  const { error: gCampErr } = await anonClient.from('campaigns').insert({
    owner_id: ownerUser.id,
    tool_id: testTool.id,
    placement: 'search_sponsored',
    budget: 0.00,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 86400000).toISOString()
  });

  if (gWallet?.length > 0 || gLedger?.length > 0 || !gCampErr) {
    console.error('FAIL: Guest read wallets/ledgers or inserted campaign!');
  } else {
    console.log('SUCCESS: Guest read and inserts blocked.');
  }

  // ==========================================
  // TEST 2: Normal User Restrictions
  // ==========================================
  console.log('\n[TEST 2] Verifying Normal User Restrictions...');
  const { data: nWallet } = await normalClient.from('owner_wallets').select('*');
  const { error: nCampErr } = await normalClient.from('campaigns').insert({
    owner_id: ownerUser.id,
    tool_id: testTool.id,
    placement: 'search_sponsored',
    budget: 0.00,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 86400000).toISOString()
  });

  if (nWallet?.length > 0 || !nCampErr) {
    console.error('FAIL: Normal user read wallets or inserted campaign!');
  } else {
    console.log('SUCCESS: Normal user read and campaign creations blocked.');
  }

  // ==========================================
  // TEST 3: Campaign Creation & Activation Safety (Owner)
  // ==========================================
  console.log('\n[TEST 3] Verifying Owner Campaign creation & status overrides...');
  
  // Clean old campaigns for testTool
  await adminClient.from('campaigns').delete().eq('tool_id', testTool.id);

  // Owners can create campaign, but status must be 'draft'
  const { data: oCamp, error: oCampErr } = await ownerClient
    .from('campaigns')
    .insert({
      owner_id: ownerUser.id,
      tool_id: testTool.id,
      campaign_name: 'Owner Test Campaign',
      placement: 'search_sponsored',
      budget: 0.00,
      cpc_bid: 0.20,
      daily_budget: 10.00,
      total_budget: 0.00,
      remaining_budget: 0.00,
      status: 'draft',
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 86400000).toISOString()
    })
    .select()
    .single();

  if (oCampErr) {
    console.error('FAIL: Owner failed to create campaign:', oCampErr.message);
  } else {
    console.log('SUCCESS: Owner created campaign in DRAFT.');

    // Owner cannot change status to active directly
    const { error: oUpdateErr } = await ownerClient
      .from('campaigns')
      .update({ status: 'active' })
      .eq('id', oCamp.id);

    const { data: verifyCamp } = await adminClient.from('campaigns').select('status').eq('id', oCamp.id).single();
    if (verifyCamp.status === 'active') {
      console.error('FAIL: Owner successfully activated campaign directly!');
    } else {
      console.log('SUCCESS: Direct campaign activation by owner was blocked. Status:', verifyCamp.status);
    }
  }

  // ==========================================
  // TEST 4: Deposit & Verification Flow
  // ==========================================
  console.log('\n[TEST 4] Verifying Deposit and Verification flow...');
  
  // Reset owner wallet
  await adminClient.from('owner_wallets').delete().eq('owner_id', ownerUser.id);
  await adminClient.from('payments').delete().eq('owner_id', ownerUser.id);
  await adminClient.from('financial_ledger').delete().eq('owner_id', ownerUser.id);

  // Simulate pending deposit
  const mockRef = 'mock_tx_' + Math.random().toString(36).substr(2, 9);
  const { error: depErr } = await ownerClient.rpc('simulate_wallet_deposit', {
    p_owner_id: ownerUser.id,
    p_amount: 100.00,
    p_provider: 'manual_simulator',
    p_provider_payment_id: mockRef
  });

  if (depErr) {
    console.error('FAIL: Deposit simulation failed:', depErr.message);
  } else {
    console.log('SUCCESS: Deposit simulation created.');

    const { data: payRow } = await adminClient.from('payments').select('*').eq('provider_payment_id', mockRef).single();
    console.log(`Payment Status: ${payRow.status} | Amount: $${payRow.amount}`);

    // Verify wallet balance is still 0 (not credited yet)
    const { data: walletPre } = await adminClient.from('owner_wallets').select('available_balance').eq('owner_id', ownerUser.id).maybeSingle();
    console.log(`Wallet Balance (Pre-Verification): $${walletPre?.available_balance || 0}`);

    // Verify deposit using Admin client
    const { error: verErr } = await adminClient.rpc('verify_payment', {
      p_payment_id: payRow.id
    });

    if (verErr) {
      console.error('FAIL: Payment verification failed:', verErr.message);
    } else {
      const { data: walletPost } = await adminClient.from('owner_wallets').select('available_balance').eq('owner_id', ownerUser.id).single();
      console.log(`Wallet Balance (Post-Verification): $${walletPost.available_balance}`);
      if (Number(walletPost.available_balance) === 100.00) {
        console.log('SUCCESS: Wallet successfully credited via admin verification.');
      } else {
        console.error('FAIL: Balance mismatch.');
      }
    }
  }

  // ==========================================
  // TEST 5: Fund and Approve Campaign
  // ==========================================
  console.log('\n[TEST 5] Verifying Campaign funding and approval...');
  if (oCamp) {
    // Fund campaign with $50.00
    const { error: fundErr } = await ownerClient.rpc('fund_campaign', {
      p_campaign_id: oCamp.id,
      p_amount: 50.00
    });

    if (fundErr) {
      console.error('FAIL: Campaign funding failed:', fundErr.message);
    } else {
      const { data: walletAfter } = await adminClient.from('owner_wallets').select('available_balance').eq('owner_id', ownerUser.id).single();
      const { data: campAfter } = await adminClient.from('campaigns').select('total_budget, remaining_budget, status').eq('id', oCamp.id).single();
      
      console.log(`Wallet remaining: $${walletAfter.available_balance}`);
      console.log(`Campaign budget funded: $${campAfter.total_budget} | Status: ${campAfter.status}`);

      // Approve campaign
      const { error: appErr } = await adminClient.rpc('approve_campaign', {
        p_campaign_id: oCamp.id
      });

      if (appErr) {
        console.error('FAIL: Campaign approval failed:', appErr.message);
      } else {
        const { data: campActive } = await adminClient.from('campaigns').select('status').eq('id', oCamp.id).single();
        const { data: toolActive } = await adminClient.from('tools').select('is_sponsored').eq('id', testTool.id).single();
        console.log(`Campaign approved status: ${campActive.status} | Tool is_sponsored: ${toolActive.is_sponsored}`);
        if (campActive.status === 'active' && toolActive.is_sponsored) {
          console.log('SUCCESS: Campaign activated and tool status synchronized.');
        } else {
          console.error('FAIL: Status sync failed.');
        }
      }
    }
  }

  // ==========================================
  // TEST 6: Click Charging and Click Fraud Deduplication
  // ==========================================
  console.log('\n[TEST 6] Verifying CPC click charging and deduplication trigger...');
  const sessId = 'test_session_' + Math.random().toString(36).substr(2, 9);
  
  // Click 1 (Clean Click)
  const { data: click1, error: c1Err } = await adminClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: testTool.id,
      session_id: sessId
    })
    .select()
    .single();

  if (c1Err) {
    console.error('FAIL: Clean click insertion failed:', c1Err.message);
  } else {
    await new Promise(r => setTimeout(r, 1000));
    const { data: campChecked1 } = await adminClient.from('campaigns').select('remaining_budget, spent').eq('id', oCamp.id).single();
    const { data: eventChecked1 } = await adminClient.from('analytics_events').select('cpc_charged, is_duplicate').eq('id', click1.id).single();
    
    console.log(`Clean Click Charge: $${eventChecked1.cpc_charged} | Is Duplicate: ${eventChecked1.is_duplicate}`);
    console.log(`Campaign Remaining: $${campChecked1.remaining_budget} | Spent: $${campChecked1.spent}`);
    
    // Click 2 (Duplicate Click in same session)
    const { data: click2, error: c2Err } = await adminClient
      .from('analytics_events')
      .insert({
        event_type: 'website_click',
        tool_id: testTool.id,
        session_id: sessId
      })
      .select()
      .single();

    if (c2Err) {
      console.error('FAIL: Duplicate click insertion failed:', c2Err.message);
    } else {
      await new Promise(r => setTimeout(r, 1000));
      const { data: campChecked2 } = await adminClient.from('campaigns').select('remaining_budget, spent').eq('id', oCamp.id).single();
      const { data: eventChecked2 } = await adminClient.from('analytics_events').select('cpc_charged, is_duplicate').eq('id', click2.id).single();
      
      console.log(`Duplicate Click Charge: $${eventChecked2.cpc_charged} | Is Duplicate: ${eventChecked2.is_duplicate}`);
      console.log(`Campaign Remaining (After Dup): $${campChecked2.remaining_budget} | Spent: $${campChecked2.spent}`);

      if (Number(eventChecked2.cpc_charged) === 0.00 && eventChecked2.is_duplicate) {
        console.log('SUCCESS: Click fraud deduplication correctly ignored duplicate charge.');
      } else {
        console.error('FAIL: Duplicate click charged campaign budget!');
      }
    }
  }

  // ==========================================
  // TEST 7: Concurrency & Budget Cap hard stop
  // ==========================================
  console.log('\n[TEST 7] Running Concurrency & hard budget exhaust tests...');
  
  // Set budget remaining to exactly $0.50 and bid to $0.20
  await adminClient
    .from('campaigns')
    .update({ remaining_budget: 0.50, total_budget: 50.00, spent: 49.50, status: 'active' })
    .eq('id', oCamp.id);

  // Sync tool sponsored status back
  await adminClient.from('tools').update({ is_sponsored: true }).eq('id', testTool.id);

  console.log('Sending 5 simultaneous click inserts with $0.50 remaining budget...');
  
  // Simulate 5 parallel click threads
  const sessions = Array.from({ length: 5 }, (_, i) => `parallel_sess_${i}_` + Math.random().toString(36).substr(2, 9));
  
  const clickPromises = sessions.map(sess => 
    adminClient.from('analytics_events').insert({
      event_type: 'website_click',
      tool_id: testTool.id,
      session_id: sess
    })
  );

  await Promise.all(clickPromises);
  await new Promise(r => setTimeout(r, 2000));

  const { data: campFinal } = await adminClient.from('campaigns').select('remaining_budget, spent, status').eq('id', oCamp.id).single();
  const { data: toolFinal } = await adminClient.from('tools').select('is_sponsored').eq('id', testTool.id).single();

  console.log(`Final Campaign Budget: $${campFinal.remaining_budget} | Spent: $${campFinal.spent} | Status: ${campFinal.status}`);
  console.log(`Final Tool is_sponsored: ${toolFinal.is_sponsored}`);

  if (Number(campFinal.remaining_budget) < 0.00) {
    console.error('FAIL: Overspending occurred! Budget is negative.');
  } else if (Number(campFinal.remaining_budget) === 0.00 && campFinal.status === 'exhausted' && !toolFinal.is_sponsored) {
    console.log('SUCCESS: Parallel click concurrency handled correctly. Hard budget stop active.');
  } else {
    console.error('FAIL: Campaign did not exhaust properly.');
  }

  // ==========================================
  // TEST 8: Compensating adjustment logging
  // ==========================================
  console.log('\n[TEST 8] Verifying Admin Compensating Ledger Adjustments...');
  const { error: adjErr } = await adminClient.rpc('adjust_wallet_balance', {
    p_owner_id: ownerUser.id,
    p_amount: -10.50,
    p_reason: 'Testing refund subtraction adjustment audit'
  });

  if (adjErr) {
    console.error('FAIL: Admin adjustment failed:', adjErr.message);
  } else {
    const { data: logChecked } = await adminClient
      .from('audit_logs')
      .select('action, details')
      .eq('action', 'monetization_adjustment')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const { data: ledgerChecked } = await adminClient
      .from('financial_ledger')
      .select('amount, transaction_type')
      .eq('transaction_type', 'adjustment')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log(`Audit log: ${logChecked?.action} -> ${logChecked?.details}`);
    console.log(`Ledger entry: ${ledgerChecked?.transaction_type} -> $${ledgerChecked?.amount}`);

    if (logChecked && Number(ledgerChecked.amount) === -10.50) {
      console.log('SUCCESS: Adjustment applied and audited.');
    } else {
      console.error('FAIL: Adjustment logging failed.');
    }
  }

  // Restore original owner of Zoice tool
  await adminClient.from('tools').update({ owner_id: originalOwnerId }).eq('id', zoiceTool.id);

  console.log('\n--- COMPLETED STEP 11 MONETIZATION COMPLIANCE & CONCURRENCY TESTS ---');
}

runTests();
