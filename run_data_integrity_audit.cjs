/* run_data_integrity_audit.cjs */
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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const runDataAudit = async () => {
  console.log('=== AIFynest Data Integrity Audit ===');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Tools audit
  const { data: tools, error: tErr } = await supabase.from('tools').select('*');
  if (tErr) throw tErr;

  const totalTools = tools.length;
  const approvedTools = tools.filter(t => t.status === 'approved').length;
  const pendingTools = tools.filter(t => t.status === 'pending').length;
  const draftTools = tools.filter(t => t.status === 'draft').length;
  const rejectedTools = tools.filter(t => t.status === 'rejected').length;

  // Check duplicate slugs and names
  const slugCounts = {};
  const nameCounts = {};
  const duplicateSlugs = [];
  const duplicateNames = [];

  tools.forEach(t => {
    slugCounts[t.slug] = (slugCounts[t.slug] || 0) + 1;
    nameCounts[t.name.toLowerCase()] = (nameCounts[t.name.toLowerCase()] || 0) + 1;
  });

  Object.keys(slugCounts).forEach(s => {
    if (slugCounts[s] > 1) duplicateSlugs.push(`${s} (${slugCounts[s]}x)`);
  });
  Object.keys(nameCounts).forEach(n => {
    if (nameCounts[n] > 1) duplicateNames.push(`${n} (${nameCounts[n]}x)`);
  });

  // Check invalid URLs
  const invalidUrls = tools.filter(t => !t.website_url || (!t.website_url.startsWith('http://') && !t.website_url.startsWith('https://'))).map(t => t.slug);

  // 2. Categories check
  const { data: categories } = await supabase.from('categories').select('slug');
  const categorySlugs = new Set((categories || []).map(c => c.slug));
  const invalidCategories = tools.filter(t => !categorySlugs.has(t.category_slug)).map(t => `${t.slug} -> ${t.category_slug}`);

  // 3. Profiles / Owners check
  const { data: profiles } = await supabase.from('profiles').select('id');
  const profileIds = new Set((profiles || []).map(p => p.id));
  const orphanedOwners = tools.filter(t => t.owner_id && !profileIds.has(t.owner_id)).map(t => `${t.slug} (owner: ${t.owner_id})`);

  // 4. Reviews check
  const { data: reviews } = await supabase.from('reviews').select('*');
  const toolIds = new Set(tools.map(t => t.id));
  const orphanedReviews = (reviews || []).filter(r => !toolIds.has(r.tool_id)).map(r => r.id);

  // 5. Campaigns check
  const { data: campaigns } = await supabase.from('campaigns').select('*');
  const negativeBudgets = (campaigns || []).filter(c => c.remaining_budget < 0 || c.spent < 0).map(c => c.id);
  const inconsistentSponsorship = (campaigns || []).filter(c => c.status === 'active' && c.remaining_budget <= 0).map(c => c.id);

  console.log('\n--- DATA INTEGRITY REPORT ---');
  console.log(`Total Tools: ${totalTools}`);
  console.log(`Approved Tools: ${approvedTools}`);
  console.log(`Pending Tools: ${pendingTools}`);
  console.log(`Draft Tools: ${draftTools}`);
  console.log(`Rejected Tools: ${rejectedTools}`);
  console.log(`Duplicate Slugs (${duplicateSlugs.length}):`, duplicateSlugs.length > 0 ? duplicateSlugs.join(', ') : 'None');
  console.log(`Duplicate Names (${duplicateNames.length}):`, duplicateNames.length > 0 ? duplicateNames.join(', ') : 'None');
  console.log(`Invalid Website URLs (${invalidUrls.length}):`, invalidUrls.length > 0 ? invalidUrls.join(', ') : 'None');
  console.log(`Invalid Categories (${invalidCategories.length}):`, invalidCategories.length > 0 ? invalidCategories.join(', ') : 'None');
  console.log(`Orphaned Owners (${orphanedOwners.length}):`, orphanedOwners.length > 0 ? orphanedOwners.join(', ') : 'None');
  console.log(`Orphaned Reviews (${orphanedReviews.length}):`, orphanedReviews.length > 0 ? orphanedReviews.join(', ') : 'None');
  console.log(`Negative Campaign Budgets (${negativeBudgets.length}):`, negativeBudgets.length > 0 ? negativeBudgets.join(', ') : 'None');
  console.log(`Inconsistent Sponsorship States (${inconsistentSponsorship.length}):`, inconsistentSponsorship.length > 0 ? inconsistentSponsorship.join(', ') : 'None');
};

runDataAudit().catch(err => {
  console.error('Data integrity audit failed:', err);
});
