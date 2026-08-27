// test_step12_audit.cjs
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://izjpavrrcbglrdvrqeng.supabase.co';
const ANON_KEY = 'sb_publishable_mwuzxPcr8pPb6-SmURgBoA_NRqL0jna';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminCreds = { email: 'mevishal1130@gmail.com', password: 'password123' };
const ownerCreds = { email: 'owner@synthesia.io', password: 'password123' };
const normalCreds = { email: 'john@gmail.com', password: 'password123' };

async function runAudit() {
  console.log('=== STARTING STEP 12 PRODUCTION & TRUST AUDIT ===\n');

  // Initialize clients
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const guestClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  
  const ownerClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const normalClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const adminClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  // Sign in contexts
  const { data: ownerUser } = await ownerClient.auth.signInWithPassword(ownerCreds);
  const { data: normalUser } = await normalClient.auth.signInWithPassword(normalCreds);
  const { data: adminUser } = await adminClient.auth.signInWithPassword(adminCreds);

  // Fetch a base tool for testing
  const { data: baseTools } = await serviceClient.from('tools').select('*').limit(1);
  const testTool = baseTools[0];
  if (!testTool) {
    console.error('No tools found in the database to run tests against.');
    process.exit(1);
  }
  console.log(`Using tool "${testTool.name}" (${testTool.id}) for verification tests.`);

  // Cleanup old reports & requests
  await serviceClient.from('reports').delete().eq('tool_id', testTool.id);
  await serviceClient.from('tool_verification_requests').delete().eq('tool_id', testTool.id);
  // Restore verification status & assign owner_id to ownerUser
  await serviceClient.from('tools').update({ 
    owner_id: ownerUser.user.id,
    verification_status: 'unverified', 
    is_verified: false 
  }).eq('id', testTool.id);

  const reportResults = {};

  const report = (num, desc, passed) => {
    console.log(`[TEST ${num}] ${passed ? 'PASSED' : 'FAILED'}: ${desc}`);
    reportResults[num] = passed;
  };

  // =========================================================================
  // 1. Guest can report a listing but cannot read reports
  // =========================================================================
  const guestSess = 'guest_sess_' + Math.random().toString(36).substr(2, 9);
  const { error: guestInsErr } = await guestClient.from('reports').insert({
    tool_id: testTool.id,
    session_id: guestSess,
    reason: 'broken-link',
    details: 'The pricing URL leads to a 404.'
  });
  const { data: guestReadReports, error: guestReadErr } = await guestClient.from('reports').select('*');
  
  report(1, 'Guest can insert reports but is blocked from reading reports list',
    !guestInsErr && (guestReadReports === null || guestReadReports.length === 0)
  );

  // =========================================================================
  // 2. Owner can report a listing but cannot read another user's reports
  // =========================================================================
  const ownerSess = 'owner_sess_' + Math.random().toString(36).substr(2, 9);
  const { error: ownerInsErr } = await ownerClient.from('reports').insert({
    tool_id: testTool.id,
    reporter_user_id: ownerUser.user.id,
    session_id: ownerSess,
    reason: 'spam',
    details: 'This tool is a clone of another listing.'
  });
  const { data: ownerReadReports } = await ownerClient.from('reports').select('*');

  report(2, 'Owner can insert reports but is blocked from reading reports list',
    !ownerInsErr && (ownerReadReports === null || ownerReadReports.length === 0)
  );

  // =========================================================================
  // 3. Normal user cannot access reports
  // =========================================================================
  const { data: normalReadReports } = await normalClient.from('reports').select('*');
  report(3, 'Normal user is blocked from reading reports list',
    (normalReadReports === null || normalReadReports.length === 0)
  );

  // =========================================================================
  // 4. Rate Limiting and Duplicate Prevention for reports
  // =========================================================================
  // Try duplicate report
  const { error: dupErr } = await guestClient.from('reports').insert({
    tool_id: testTool.id,
    session_id: guestSess,
    reason: 'broken-link',
    details: 'Second attempt.'
  });
  console.log('--- TEST 4 DIAGNOSTICS ---');
  console.log('dupErr:', dupErr?.message || 'null (succeeded!)');

  // Rate limiting test: insert 4 reports on different tools to bypass duplicate check
  const { data: limitTools } = await serviceClient.from('tools').select('id').limit(5);
  const limitSess = 'limit_sess_' + Math.random().toString(36).substr(2, 9);
  let rateLimitCaught = false;
  let finalRateLimitErr = null;
  
  if (limitTools) {
    // Delete any old reports for these tools by this session
    const limitToolIds = limitTools.map(t => t.id);
    await serviceClient.from('reports').delete().in('tool_id', limitToolIds);

    for (let i = 0; i < limitTools.length; i++) {
      const { error: err } = await guestClient.from('reports').insert({
        tool_id: limitTools[i].id,
        session_id: limitSess,
        reason: 'other',
        details: 'Spam run ' + i
      });
      if (err && err.message.includes('Rate Limit')) {
        rateLimitCaught = true;
        finalRateLimitErr = err;
        break;
      }
    }
  }
  console.log('rateLimitCaught:', rateLimitCaught, 'rateLimitErr:', finalRateLimitErr?.message || 'null');

  const isDuplicateBlocked = dupErr && dupErr.message.includes('Duplicate');
  report(4, 'Anti-spam protection blocks duplicate pending reports and enforces hourly rate limits',
    isDuplicateBlocked && rateLimitCaught
  );

  // =========================================================================
  // 5. Owner cannot approve/revoke verification requests
  // =========================================================================
  // Insert a test verification request via owner
  const { error: ownerReqErr } = await ownerClient.from('tool_verification_requests').insert({
    tool_id: testTool.id,
    owner_id: ownerUser.user.id,
    notes: 'Please verify Synthesia.'
  });
  
  const { data: reqRows } = await serviceClient.from('tool_verification_requests').select('*').eq('tool_id', testTool.id);
  const testRequest = reqRows[0];

  let ownerApproveCaught = false;
  let ownerApproveErr = null;
  if (testRequest) {
    const { error: err } = await ownerClient.rpc('approve_tool_verification', { p_request_id: testRequest.id });
    ownerApproveCaught = err && err.message.includes('Access Denied');
    ownerApproveErr = err;
  }
  console.log('--- TEST 5 DIAGNOSTICS ---');
  console.log('ownerReqErr:', ownerReqErr?.message || 'null (succeeded!)');
  console.log('testRequest id:', testRequest?.id || 'none');
  console.log('ownerApproveCaught:', ownerApproveCaught, 'ownerApproveErr:', ownerApproveErr?.message || 'null');

  report(5, 'Owner can submit verification request but is blocked from executing approval RPCs',
    !ownerReqErr && ownerApproveCaught
  );

  // =========================================================================
  // 6. Owner cannot directly set verification_status = verified
  // =========================================================================
  await ownerClient.from('tools').update({ verification_status: 'verified', is_verified: true }).eq('id', testTool.id);
  const { data: toolAfterDirectUpdate } = await serviceClient.from('tools').select('verification_status, is_verified').eq('id', testTool.id).single();
  
  report(6, 'Owner cannot directly bypass verification checks to self-verify listings',
    toolAfterDirectUpdate.verification_status === 'unverified' && !toolAfterDirectUpdate.is_verified
  );

  // =========================================================================
  // 7. Admin can approve and revoke verification requests
  // =========================================================================
  let adminApproveSuccess = false;
  let adminRevokeSuccess = false;
  let appErr = null;
  let revErr = null;
  if (testRequest) {
    const { error: errA } = await adminClient.rpc('approve_tool_verification', { p_request_id: testRequest.id });
    appErr = errA;
    const { data: toolAfterApproval } = await serviceClient.from('tools').select('verification_status, is_verified').eq('id', testTool.id).single();
    
    adminApproveSuccess = !errA && toolAfterApproval.verification_status === 'verified' && toolAfterApproval.is_verified;

    const { error: errR } = await adminClient.rpc('revoke_tool_verification', { p_tool_id: testTool.id, p_reason: 'Audit cleanup' });
    revErr = errR;
    const { data: toolAfterRevoke } = await serviceClient.from('tools').select('verification_status, is_verified').eq('id', testTool.id).single();

    adminRevokeSuccess = !errR && toolAfterRevoke.verification_status === 'unverified' && !toolAfterRevoke.is_verified;
  }
  console.log('--- TEST 7 DIAGNOSTICS ---');
  console.log('appErr:', appErr?.message || 'null (succeeded!)');
  console.log('revErr:', revErr?.message || 'null (succeeded!)');
  console.log('adminApproveSuccess:', adminApproveSuccess, 'adminRevokeSuccess:', adminRevokeSuccess);

  report(7, 'Admin can successfully approve and revoke verification request badges',
    adminApproveSuccess && adminRevokeSuccess
  );

  // =========================================================================
  // 8. Admin can resolve/dismiss reports
  // =========================================================================
  const { data: pendingReports } = await adminClient.from('reports').select('*').eq('tool_id', testTool.id).eq('status', 'pending');
  let reportsResolved = false;
  if (pendingReports && pendingReports.length > 0) {
    const targetRep = pendingReports[0];
    const { error: resErr } = await adminClient.from('reports').update({ status: 'resolved' }).eq('id', targetRep.id);
    const { data: checkedRep } = await serviceClient.from('reports').select('status').eq('id', targetRep.id).single();
    reportsResolved = !resErr && checkedRep.status === 'resolved';
  }

  report(8, 'Admin can read, resolve, and dismiss listing reports successfully',
    reportsResolved
  );

  // =========================================================================
  // 9. SEO Canonical & config checks
  // =========================================================================
  // Read useSEO.ts to check import.meta.env config
  const useSEOCode = fs.readFileSync(path.join(__dirname, 'src', 'hooks', 'useSEO.ts'), 'utf8');
  const isEnvConfigured = useSEOCode.includes('import.meta.env.VITE_SITE_URL') && useSEOCode.includes('computedCanonical');
  
  report(9, 'SEO hook resolves canonical and OG URLs using configurable site domain variable',
    isEnvConfigured
  );

  // =========================================================================
  // 10. Sitemap generation check
  // =========================================================================
  // Run sitemap generator
  const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) fs.unlinkSync(sitemapPath);
  
  try {
    const { execSync } = require('child_process');
    execSync('node generate_sitemap.cjs', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to run generate_sitemap.cjs:', e);
  }

  const sitemapExists = fs.existsSync(sitemapPath);
  let onlyApproved = true;
  let nonApprovedFound = [];
  if (sitemapExists) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    // Check that draft tools are NOT included
    const { data: draftTools } = await serviceClient.from('tools').select('slug, status').neq('status', 'approved');
    if (draftTools) {
      for (const t of draftTools) {
        if (sitemapContent.includes(`/tools/${t.slug}</loc>`)) {
          onlyApproved = false;
          nonApprovedFound.push(`${t.slug} (${t.status})`);
        }
      }
    }
  }
  console.log('--- TEST 10 DIAGNOSTICS ---');
  console.log('sitemapExists:', sitemapExists);
  console.log('onlyApproved:', onlyApproved, 'nonApprovedFound:', nonApprovedFound);

  report(10, 'Sitemap generation generates XML file containing only approved indexable tools',
    sitemapExists && onlyApproved
  );

  // =========================================================================
  // Cleanup test database changes
  // =========================================================================
  await serviceClient.from('reports').delete().eq('tool_id', testTool.id);
  await serviceClient.from('tool_verification_requests').delete().eq('tool_id', testTool.id);
  console.log('\n=== COMPLETED STEP 12 AUDIT TESTS ===');

  const allPassed = Object.values(reportResults).every(v => v === true);
  process.exit(allPassed ? 0 : 1);
}

runAudit().catch(err => {
  console.error('Audit run failed with exception:', err);
  process.exit(1);
});
