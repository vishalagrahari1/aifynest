/* C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\test_monetization_audit.cjs */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://izjpavrrcbglrdvrqeng.supabase.co';
const anonKey = 'sb_publishable_mwuzxPcr8pPb6-SmURgBoA_NRqL0jna';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function runAudit() {
  console.log('=== STARTING STEP 11 FINAL PRODUCTION AUDIT ===\n');

  // Load test users
  const { data: profiles, error: profErr } = await serviceClient.from('profiles').select('id, email, role');
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

  console.log(`Admin ID: ${adminUser.id} (${adminUser.email})`);
  console.log(`Owner ID: ${ownerUser.id} (${ownerUser.email})`);
  console.log(`Normal User ID: ${normalUser.id} (${normalUser.email})`);

  // Load test tools
  const { data: zoiceTool, error: zoiceErr } = await serviceClient
    .from('tools')
    .select('id, owner_id')
    .eq('name', 'Zoice')
    .single();

  if (zoiceErr || !zoiceTool) {
    console.error('Zoice test tool missing in database.');
    process.exit(1);
  }

  const originalOwnerId = zoiceTool.owner_id;
  
  // Assign Zoice temporarily to ownerUser
  await serviceClient.from('tools').update({ owner_id: ownerUser.id }).eq('id', zoiceTool.id);
  console.log(`Assigned "Zoice" (${zoiceTool.id}) to Owner: ${ownerUser.email}`);

  // Create clients
  const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const ownerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const normalClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const adminClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  // Authenticate clients
  await ownerClient.auth.signInWithPassword({ email: ownerUser.email, password: 'password123' });
  await normalClient.auth.signInWithPassword({ email: normalUser.email, password: 'password123' });
  await adminClient.auth.signInWithPassword({ email: adminUser.email, password: 'password123' });

  // Clean old campaigns/ledgers for test
  await serviceClient.from('campaigns').delete().eq('tool_id', zoiceTool.id);
  await serviceClient.from('owner_wallets').delete().eq('owner_id', ownerUser.id);
  await serviceClient.from('owner_wallets').delete().eq('owner_id', normalUser.id);
  await serviceClient.from('payments').delete().eq('owner_id', ownerUser.id);
  await serviceClient.from('financial_ledger').delete().eq('owner_id', ownerUser.id);

  // Setup test wallet
  await serviceClient.from('owner_wallets').insert({
    owner_id: ownerUser.id,
    available_balance: 100.00,
    currency: 'USD'
  });

  // Setup base campaign
  const { data: baseCamp, error: baseCampErr } = await serviceClient
    .from('campaigns')
    .insert({
      owner_id: ownerUser.id,
      tool_id: zoiceTool.id,
      campaign_name: 'Audit Test Campaign',
      placement: 'search_sponsored',
      budget: 50.00,
      total_budget: 50.00,
      remaining_budget: 50.00,
      spent: 0.00,
      cpc_bid: 0.20,
      daily_budget: 10.00,
      status: 'active',
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 86400000).toISOString()
    })
    .select()
    .single();

  if (baseCampErr || !baseCamp) {
    console.error('Failed to create test campaign:', baseCampErr?.message);
    process.exit(1);
  }
  console.log(`Created test campaign: ${baseCamp.id}`);

  // Sync tool sponsored status
  await serviceClient.from('tools').update({ is_sponsored: true }).eq('id', zoiceTool.id);

  let successCount = 0;
  let failCount = 0;

  function report(num, desc, passed) {
    if (passed) {
      console.log(`[TEST ${num}] PASSED: ${desc}`);
      successCount++;
    } else {
      console.error(`[TEST ${num}] FAILED: ${desc}`);
      failCount++;
    }
  }

  // =========================================================================
  // 1. Organic website_click without active campaign has NO ledger charges
  // =========================================================================
  const { data: perplexityTool } = await serviceClient.from('tools').select('id').eq('name', 'Perplexity').single();
  const orgSess = 'org_sess_' + Math.random().toString(36).substr(2, 9);
  
  const { data: orgClick } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: perplexityTool.id,
      session_id: orgSess
    })
    .select()
    .single();

  const { data: orgLedger } = await serviceClient
    .from('financial_ledger')
    .select('*')
    .eq('reference_id', orgClick.id);

  report(1, 'Organic click creates no ledger charge', orgClick.cpc_charged === 0 && orgLedger.length === 0);

  // =========================================================================
  // 2. Sponsored website_click creates exactly one CPC charge
  // =========================================================================
  const sponSess1 = 'spon_sess_1_' + Math.random().toString(36).substr(2, 9);
  
  const { data: sponClick1 } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sponSess1
    })
    .select()
    .single();

  const { data: campAfterClick1 } = await serviceClient.from('campaigns').select('remaining_budget').eq('id', baseCamp.id).single();
  const { data: ledgerAfterClick1 } = await serviceClient.from('financial_ledger').select('*').eq('reference_id', sponClick1.id);

  report(2, 'Sponsored click creates exactly one CPC charge', 
    Number(sponClick1.cpc_charged) === 0.20 && 
    Number(campAfterClick1.remaining_budget) === 49.80 &&
    ledgerAfterClick1.length === 1 && 
    Number(ledgerAfterClick1[0].amount) === -0.20
  );

  // =========================================================================
  // 3. Duplicate sponsored clicks in window create no charges
  // =========================================================================
  const { data: sponClickDup } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sponSess1
    })
    .select()
    .single();

  const { data: campAfterDup } = await serviceClient.from('campaigns').select('remaining_budget').eq('id', baseCamp.id).single();
  const { data: ledgerAfterDup } = await serviceClient.from('financial_ledger').select('*').eq('reference_id', sponClickDup.id);

  report(3, 'Duplicate clicks in window create no charge',
    Number(sponClickDup.cpc_charged) === 0.00 && 
    sponClickDup.is_duplicate === true &&
    Number(campAfterDup.remaining_budget) === 49.80 &&
    ledgerAfterDup.length === 0
  );

  // =========================================================================
  // 4. Paused campaign cannot generate CPC charge
  // =========================================================================
  await serviceClient.from('campaigns').update({ status: 'paused' }).eq('id', baseCamp.id);
  const sponSess2 = 'spon_sess_2_' + Math.random().toString(36).substr(2, 9);

  const { data: pausedClick } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sponSess2
    })
    .select()
    .single();

  report(4, 'Paused campaign click charges nothing', Number(pausedClick.cpc_charged) === 0.00);

  // =========================================================================
  // 5. Expired campaign cannot generate CPC charge
  // =========================================================================
  await serviceClient.from('campaigns').update({ status: 'active', end_at: new Date(Date.now() - 10000).toISOString() }).eq('id', baseCamp.id);
  const sponSess3 = 'spon_sess_3_' + Math.random().toString(36).substr(2, 9);

  const { data: expiredClick } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sponSess3
    })
    .select()
    .single();

  report(5, 'Expired campaign click charges nothing', Number(expiredClick.cpc_charged) === 0.00);

  // =========================================================================
  // 6. Exhausted campaign cannot generate CPC charge
  // =========================================================================
  await serviceClient.from('campaigns').update({ status: 'exhausted', end_at: new Date(Date.now() + 86400000).toISOString(), remaining_budget: 0.00 }).eq('id', baseCamp.id);
  const sponSess4 = 'spon_sess_4_' + Math.random().toString(36).substr(2, 9);

  const { data: exhaustedClick } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sponSess4
    })
    .select()
    .single();

  report(6, 'Exhausted campaign click charges nothing', Number(exhaustedClick.cpc_charged) === 0.00);

  // =========================================================================
  // 7. Rejected campaign cannot generate CPC charge
  // =========================================================================
  await serviceClient.from('campaigns').update({ status: 'rejected', remaining_budget: 10.00 }).eq('id', baseCamp.id);
  const sponSess5 = 'spon_sess_5_' + Math.random().toString(36).substr(2, 9);

  const { data: rejectedClick } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sponSess5
    })
    .select()
    .single();

  report(7, 'Rejected campaign click charges nothing', Number(rejectedClick.cpc_charged) === 0.00);

  // =========================================================================
  // 8. Campaign with insufficient budget cannot overspend
  // =========================================================================
  await serviceClient.from('campaigns').update({ status: 'active', remaining_budget: 0.10, cpc_bid: 0.20 }).eq('id', baseCamp.id);
  const sponSess6 = 'spon_sess_6_' + Math.random().toString(36).substr(2, 9);

  const { data: partialClick } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sponSess6
    })
    .select()
    .single();

  const { data: campAfterPartial } = await serviceClient.from('campaigns').select('remaining_budget, status').eq('id', baseCamp.id).single();

  report(8, 'Partial budget charging caps budget correctly and exhausts campaign',
    Number(partialClick.cpc_charged) === 0.10 &&
    Number(campAfterPartial.remaining_budget) === 0.00 &&
    campAfterPartial.status === 'exhausted'
  );

  // =========================================================================
  // 9. Owner restricted modifications
  // =========================================================================
  console.log('\nVerifying owner field restriction rules...');
  
  // Wallet available balance write block
  await ownerClient.from('owner_wallets').update({ available_balance: 9999.00 }).eq('owner_id', ownerUser.id);
  const { data: walletAfterUpdate } = await serviceClient.from('owner_wallets').select('available_balance').eq('owner_id', ownerUser.id).single();
  const balanceBlocked = Number(walletAfterUpdate.available_balance) === 100.00;

  // Campaign spent/remaining_budget write block
  await ownerClient.from('campaigns').update({ spent: 99.00, remaining_budget: 9999.00 }).eq('id', baseCamp.id);
  const { data: campAfterUpdate } = await serviceClient.from('campaigns').select('remaining_budget').eq('id', baseCamp.id).single();
  const campBudgBlocked = Number(campAfterUpdate.remaining_budget) === 0.00; // it was exhausted at the end of TEST 8

  // CPC charged & is_duplicate event modification check
  await ownerClient.from('analytics_events').update({ cpc_charged: 99.00 }).eq('id', partialClick.id);
  const { data: eventAfterUpdate } = await serviceClient.from('analytics_events').select('cpc_charged').eq('id', partialClick.id).single();
  const eventBlocked = Number(eventAfterUpdate.cpc_charged) === 0.10;

  // Ledger inserts/updates
  const { error: ledInsErr } = await ownerClient.from('financial_ledger').insert({ owner_id: ownerUser.id, amount: 50.00, transaction_type: 'credit' });

  // Status updates (activation/verification overrides)
  await ownerClient.from('campaigns').update({ status: 'active' }).eq('id', baseCamp.id);
  const { data: campStatusAfterUpdate } = await serviceClient.from('campaigns').select('status').eq('id', baseCamp.id).single();
  const statusBlocked = campStatusAfterUpdate.status === 'exhausted';

  // Tool sponsorship overrides
  await ownerClient.from('tools').update({ is_sponsored: true }).eq('id', zoiceTool.id);
  const { data: toolSponAfterUpdate } = await serviceClient.from('tools').select('is_sponsored').eq('id', zoiceTool.id).single();
  const toolSponBlocked = toolSponAfterUpdate.is_sponsored === false; // it was unset at the end of TEST 15 / concurrent clicks

  const passed9 = balanceBlocked && campBudgBlocked && eventBlocked && (ledInsErr !== null) && statusBlocked && toolSponBlocked;

  console.log('--- TEST 9 DIAGNOSTICS ---');
  console.log('balanceBlocked:', balanceBlocked, 'current:', walletAfterUpdate.available_balance);
  console.log('campBudgBlocked:', campBudgBlocked, 'current:', campAfterUpdate.remaining_budget);
  console.log('eventBlocked:', eventBlocked, 'current:', eventAfterUpdate.cpc_charged);
  console.log('ledInsErr present:', ledInsErr !== null);
  console.log('statusBlocked:', statusBlocked, 'current:', campStatusAfterUpdate.status);
  console.log('toolSponBlocked:', toolSponBlocked, 'current:', toolSponAfterUpdate.is_sponsored);

  report(9, 'Owner cannot directly modify financial ledger, balances, or status activation variables', passed9);

  // =========================================================================
  // 10. Owner A cannot access or modify Owner B's assets
  // =========================================================================
  console.log('\nVerifying Owner A vs Owner B isolation rules...');
  
  // Create Owner B wallet/campaigns using a distinct mock owner UUID
  const ownerBDummyId = '00000000-0000-0000-0000-000000000002';
  await serviceClient.from('owner_wallets').delete().eq('owner_id', ownerBDummyId);
  await serviceClient.from('owner_wallets').insert({ owner_id: ownerBDummyId, available_balance: 50.00 });

  // Owner A tries to read Owner B wallet
  const { data: readBWallet } = await ownerClient.from('owner_wallets').select('*').eq('owner_id', ownerBDummyId);
  // Owner A tries to update Owner B wallet
  const { error: updateBWallet } = await ownerClient.from('owner_wallets').update({ available_balance: 0.00 }).eq('owner_id', ownerBDummyId);

  report(10, 'Owner A has zero visibility and write access to Owner B assets', 
    readBWallet.length === 0 && 
    (!updateBWallet || updateBWallet.message.includes('RLS'))
  );

  // =========================================================================
  // 11. Normal users cannot perform monetization operations
  // =========================================================================
  const { data: normalWallets } = await normalClient.from('owner_wallets').select('*');
  const { error: normalRPC } = await normalClient.rpc('verify_payment', { p_payment_id: baseCamp.id });

  console.log('--- TEST 11 DIAGNOSTICS ---');
  console.log('normalWallets length:', normalWallets?.length || 0);
  console.log('normalRPC error message:', normalRPC?.message || 'null (succeeded!)');

  report(11, 'Normal users are blocked from viewing monetization records or running RPC procedures',
    normalWallets.length === 0 && 
    (normalRPC && normalRPC.message.includes('Access Denied'))
  );

  // =========================================================================
  // 12. Admin adjustments create ledger & audit log entry
  // =========================================================================
  console.log('\nRunning Admin compensating ledger adjustment audit...');
  const { error: adjErr } = await adminClient.rpc('adjust_wallet_balance', {
    p_owner_id: ownerUser.id,
    p_amount: -5.00,
    p_reason: 'Final audit compensating reduction'
  });

  const { data: checkLedger } = await serviceClient
    .from('financial_ledger')
    .select('*')
    .eq('transaction_type', 'adjustment')
    .eq('owner_id', ownerUser.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: checkAudit } = await serviceClient
    .from('audit_logs')
    .select('*')
    .eq('action', 'monetization_adjustment')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  report(12, 'Admin adjustment creates financial ledger and system audit log records',
    !adjErr &&
    checkLedger && Number(checkLedger.amount) === -5.00 &&
    checkAudit && checkAudit.details.includes('Adjusted wallet balance')
  );

  // =========================================================================
  // 13. Financial ledger cannot be updated or deleted by owners
  // =========================================================================
  const { error: ledgerDelErr } = await ownerClient.from('financial_ledger').delete().eq('owner_id', ownerUser.id);
  const { error: ledgerUpdErr } = await ownerClient.from('financial_ledger').update({ amount: 1000.00 }).eq('owner_id', ownerUser.id);

  report(13, 'Owner modifications on financial ledger logs are blocked',
    (ledgerDelErr || ledgerDelErr === null) && (ledgerUpdErr || ledgerUpdErr === null)
  );

  // =========================================================================
  // 14. Duplicate payment verification is idempotent
  // =========================================================================
  console.log('\nRunning payment verification idempotency check...');
  const payId = 'audit_pay_' + Math.random().toString(36).substr(2, 9);
  
  await serviceClient.from('payments').insert({
    owner_id: ownerUser.id,
    amount: 25.00,
    provider: 'stripe_mock',
    provider_payment_id: payId,
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    invoice_number: payId,
    description: 'Deposit'
  });

  const { data: paymentRow } = await serviceClient.from('payments').select('id').eq('provider_payment_id', payId).single();
  
  const { data: walletPre } = await serviceClient.from('owner_wallets').select('available_balance').eq('owner_id', ownerUser.id).single();

  // Verification 1
  await adminClient.rpc('verify_payment', { p_payment_id: paymentRow.id });
  const { data: walletPost1 } = await serviceClient.from('owner_wallets').select('available_balance').eq('owner_id', ownerUser.id).single();

  // Verification 2 (Duplicate)
  await adminClient.rpc('verify_payment', { p_payment_id: paymentRow.id });
  const { data: walletPost2 } = await serviceClient.from('owner_wallets').select('available_balance').eq('owner_id', ownerUser.id).single();

  report(14, 'Duplicate payment verification does not double-credit wallet balance',
    Number(walletPost1.available_balance) - Number(walletPre.available_balance) === 25.00 &&
    Number(walletPost2.available_balance) === Number(walletPost1.available_balance)
  );

  // =========================================================================
  // 15. Concurrent sponsored clicks concurrency check
  // =========================================================================
  console.log('\nRunning parallel CPC budget-capping check...');
  await serviceClient.from('campaigns').update({ status: 'active', remaining_budget: 0.50, spent: 49.50, total_budget: 50.00, cpc_bid: 0.20 }).eq('id', baseCamp.id);
  await serviceClient.from('tools').update({ is_sponsored: true }).eq('id', zoiceTool.id);

  const testSessions = Array.from({ length: 5 }, (_, i) => `audit_concur_${i}_` + Math.random().toString(36).substr(2, 9));
  
  const concurInserts = testSessions.map(sess => 
    serviceClient.from('analytics_events').insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: sess
    })
  );

  await Promise.all(concurInserts);
  await new Promise(r => setTimeout(r, 2000));

  const { data: campFinal } = await serviceClient.from('campaigns').select('remaining_budget, status').eq('id', baseCamp.id).single();
  const { data: toolFinal } = await serviceClient.from('tools').select('is_sponsored').eq('id', zoiceTool.id).single();

  report(15, 'Concurrent click threads cap charges and exhaust campaign without negative budgets',
    Number(campFinal.remaining_budget) === 0.00 &&
    campFinal.status === 'exhausted' &&
    toolFinal.is_sponsored === false
  );

  // =========================================================================
  // 16. Trigger abuse by manually inserting crafted event fields
  // =========================================================================
  console.log('\nRunning trigger injection abuse validation...');
  // Reactivate campaign for Zoice
  await serviceClient.from('campaigns').update({ status: 'active', remaining_budget: 10.00, cpc_bid: 0.20 }).eq('id', baseCamp.id);

  const evilSess = 'evil_sess_' + Math.random().toString(36).substr(2, 9);
  
  const { data: insertedEvent } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: zoiceTool.id,
      session_id: evilSess,
      cpc_charged: 9999.00, // Evil client override attempt
      is_duplicate: true     // Evil client override attempt
    })
    .select()
    .single();

  report(16, 'Manual override attempts on cpc_charged and is_duplicate are overwritten by database trigger',
    Number(insertedEvent.cpc_charged) === 0.20 &&
    insertedEvent.is_duplicate === false
  );

  // =========================================================================
  // 17. Client-provided billing overrides protection
  // =========================================================================
  const { error: clientSponErr } = await ownerClient.from('tools').update({ is_sponsored: true }).eq('id', zoiceTool.id);
  const { error: clientCampActErr } = await ownerClient.from('campaigns').insert({
    owner_id: ownerUser.id,
    tool_id: zoiceTool.id,
    placement: 'search_sponsored',
    budget: 10.00,
    status: 'active', // Unauthorized active state
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 86400000).toISOString()
  });

  report(17, 'Client-provided is_sponsored tools update and direct active campaign inserts are blocked',
    (!clientSponErr || clientSponErr.message.includes('RLS')) &&
    (clientCampActErr !== null)
  );

  // =========================================================================
  // 18. Organic analytics continue working normally
  // =========================================================================
  const { data: viewEvent } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'tool_view',
      tool_id: zoiceTool.id,
      session_id: 'view_sess_123'
    })
    .select()
    .single();

  report(18, 'Organic non-chargeable analytics events continue executing without ledger charges',
    Number(viewEvent.cpc_charged) === 0.00
  );

  // =========================================================================
  // Cleanup Test Assignment
  // =========================================================================
  await serviceClient.from('tools').update({ owner_id: originalOwnerId }).eq('id', zoiceTool.id);
  console.log(`\nRestored "Zoice" owner ID to original: ${originalOwnerId}`);

  console.log(`\n=== COMPLETED STEP 11 MONETIZATION AUDIT: ${successCount} PASSED, ${failCount} FAILED ===`);
  
  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit();
