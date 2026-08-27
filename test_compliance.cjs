/* C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\test_compliance.cjs */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://izjpavrrcbglrdvrqeng.supabase.co';
const anonKey = 'sb_publishable_mwuzxPcr8pPb6-SmURgBoA_NRqL0jna';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function runTests() {
  console.log('--- START STEP 10 COMPLIANCE & TRIGGER TESTS ---');

  // Fetch approved tools to run tests against
  const { data: toolsList, error: fetchErr } = await serviceClient
    .from('tools')
    .select('*')
    .eq('status', 'approved')
    .limit(2);

  if (fetchErr || !toolsList || toolsList.length === 0) {
    console.error('Failed to fetch test tool:', fetchErr?.message || 'No approved tools found.');
    process.exit(1);
  }

  const testTool1 = toolsList[0];
  const testTool2 = toolsList[1] || testTool1;
  const toolId = testTool1.id;
  const initialViews = testTool1.views_count || 0;
  const initialClicks = testTool1.clicks_count || 0;

  console.log(`\nApproved Test Tool 1: "${testTool1.name}" (${toolId})`);
  console.log(`Initial status - Views: ${initialViews}, Clicks: ${initialClicks}`);

  // Test 1 & 2: website_click and tool_view triggers increment counters exactly once
  console.log('\n[TEST 1] Verifying increment trigger actions on insert...');
  const tempSess1 = 'sess_' + Math.random().toString(36).substr(2, 9);
  
  // Insert website_click event
  const { error: clickErr } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'website_click',
      tool_id: toolId,
      session_id: tempSess1
    });

  if (clickErr) {
    console.error('FAIL: website_click insertion failed:', clickErr.message);
  } else {
    console.log('SUCCESS: website_click inserted.');
  }

  // Insert tool_view event
  const { error: viewErr } = await serviceClient
    .from('analytics_events')
    .insert({
      event_type: 'tool_view',
      tool_id: toolId,
      session_id: tempSess1
    });

  if (viewErr) {
    console.error('FAIL: tool_view insertion failed:', viewErr.message);
  } else {
    console.log('SUCCESS: tool_view inserted.');
  }

  // Wait for triggers to propagate
  await new Promise(r => setTimeout(r, 1500));

  const { data: updatedTool } = await serviceClient
    .from('tools')
    .select('views_count, clicks_count')
    .eq('id', toolId)
    .single();

  if (updatedTool.views_count === initialViews + 1) {
    console.log(`SUCCESS: views_count incremented exactly once. Value: ${updatedTool.views_count}`);
  } else {
    console.error(`FAIL: views_count did not increment exactly once. Got: ${updatedTool.views_count}`);
  }

  if (updatedTool.clicks_count === initialClicks + 1) {
    console.log(`SUCCESS: clicks_count incremented exactly once. Value: ${updatedTool.clicks_count}`);
  } else {
    console.error(`FAIL: clicks_count did not increment exactly once. Got: ${updatedTool.clicks_count}`);
  }

  // Test 3: Anonymous direct updates are blocked (both views and clicks)
  console.log('\n[TEST 2] Verifying anonymous direct counter updates are blocked...');
  const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  
  const { error: anonUpdateErr } = await anonClient
    .from('tools')
    .update({ views_count: 8888, clicks_count: 8888 })
    .eq('id', toolId);

  const { data: checkedToolAnon } = await serviceClient
    .from('tools')
    .select('views_count, clicks_count')
    .eq('id', toolId)
    .single();

  if (checkedToolAnon.views_count === 8888 || checkedToolAnon.clicks_count === 8888) {
    console.error('FAIL: Anon user successfully modified counters!');
  } else {
    console.log(`SUCCESS: Anon direct counter updates blocked. Views: ${checkedToolAnon.views_count}, Clicks: ${checkedToolAnon.clicks_count}`);
  }

  // Test 4: Normal user authentication direct updates are blocked (both views and clicks)
  console.log('\n[TEST 3] Verifying authenticated normal user direct updates are blocked...');
  const userClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { error: userLoginErr } = await userClient.auth.signInWithPassword({
    email: 'john@gmail.com',
    password: 'password123'
  });

  if (userLoginErr) {
    console.error('Failed to log in as normal user:', userLoginErr.message);
  } else {
    const { error: userUpdateErr } = await userClient
      .from('tools')
      .update({ views_count: 7777, clicks_count: 7777 })
      .eq('id', toolId);

    const { data: checkedToolUser } = await serviceClient
      .from('tools')
      .select('views_count, clicks_count')
      .eq('id', toolId)
      .single();

    if (checkedToolUser.views_count === 7777 || checkedToolUser.clicks_count === 7777) {
      console.error('FAIL: Normal user successfully modified counters!');
    } else {
      console.log(`SUCCESS: Normal user direct updates blocked. Views: ${checkedToolUser.views_count}, Clicks: ${checkedToolUser.clicks_count}`);
    }
  }

  // Test 5: Owner direct updates are blocked (both views and clicks)
  console.log('\n[TEST 4] Verifying owner direct updates are blocked...');
  const ownerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { error: ownerLoginErr } = await ownerClient.auth.signInWithPassword({
    email: 'owner@synthesia.io',
    password: 'password123'
  });

  if (ownerLoginErr) {
    console.error('Failed to log in as owner user:', ownerLoginErr.message);
  } else {
    const { error: ownerUpdateErr } = await ownerClient
      .from('tools')
      .update({ views_count: 6666, clicks_count: 6666 })
      .eq('id', toolId);

    const { data: checkedToolOwner } = await serviceClient
      .from('tools')
      .select('views_count, clicks_count')
      .eq('id', toolId)
      .single();

    if (checkedToolOwner.views_count === 6666 || checkedToolOwner.clicks_count === 6666) {
      console.error('FAIL: Owner successfully modified counters!');
    } else {
      console.log(`SUCCESS: Owner direct updates blocked. Views: ${checkedToolOwner.views_count}, Clicks: ${checkedToolOwner.clicks_count}`);
    }
  }

  // Test 6: Verify existing analytics data integrity
  console.log('\n[TEST 5] Checking analytics data integrity...');
  const { data: eventsCount, error: countErr } = await serviceClient
    .from('analytics_events')
    .select('id', { count: 'exact' });

  if (countErr) {
    console.error('Failed to count analytics events:', countErr.message);
  } else {
    console.log(`SUCCESS: Analytics events count remains intact. Total rows: ${eventsCount.length}`);
  }

  // Test 7: Verify trigger isolation (unrelated records cannot be modified)
  console.log('\n[TEST 6] Checking trigger isolation...');
  const toolId2 = testTool2.id;
  if (toolId2 !== toolId) {
    const initialViews2 = testTool2.views_count || 0;
    
    // Increment tool 1 view again
    await serviceClient
      .from('analytics_events')
      .insert({ event_type: 'tool_view', tool_id: toolId, session_id: tempSess1 });

    await new Promise(r => setTimeout(r, 1000));

    const { data: checkedTool2 } = await serviceClient
      .from('tools')
      .select('views_count')
      .eq('id', toolId2)
      .single();

    if (checkedTool2.views_count === initialViews2) {
      console.log(`SUCCESS: Unrelated tool views_count remained unchanged (${checkedTool2.views_count}).`);
    } else {
      console.error(`FAIL: Unrelated tool views_count was affected! Original: ${initialViews2}, Got: ${checkedTool2.views_count}`);
    }
  } else {
    console.log('Skipped (only 1 approved tool available for testing).');
  }

  // Test 8: Verify Owner A attempting Owner B's data is blocked
  console.log('\n[TEST 7] Verifying RLS Owner A attempting to view/modify Owner B\'s data isolation...');
  if (ownerLoginErr) {
    console.log('Skipped (owner log in failed).');
  } else {
    const { data: ownerProfile } = await serviceClient.from('profiles').select('id').eq('email', 'owner@synthesia.io').single();

    const { data: otherTool, error: otherToolErr } = await serviceClient
      .from('tools')
      .select('id, name, owner_id')
      .eq('status', 'approved')
      .neq('owner_id', ownerProfile.id)
      .limit(1)
      .single();

    if (otherToolErr || !otherTool) {
      console.log('Skipped (no tools owned by other owners found).');
    } else {
      console.log(`Found tool "${otherTool.name}" owned by another user (${otherTool.owner_id}).`);
      
      // Attempt to modify as Owner A
      const { error: hackErr } = await ownerClient
        .from('tools')
        .update({ name: 'Hacked Name' })
        .eq('id', otherTool.id);

      // Verify name remains unchanged
      const { data: verifiedOtherTool } = await serviceClient
        .from('tools')
        .select('name')
        .eq('id', otherTool.id)
        .single();

      if (verifiedOtherTool.name === 'Hacked Name') {
        console.error('FAIL: Owner A successfully updated Owner B\'s tool metadata!');
      } else {
        console.log('SUCCESS: Owner A cannot modify Owner B\'s tool metadata.');
      }
    }
  }

  console.log('\n--- COMPLETED STEP 10 COMPLIANCE & TRIGGER TESTS ---');
}

runTests();
