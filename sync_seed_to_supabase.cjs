// scripts/sync_seed_to_supabase.cjs
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

// 1. Load environment variables
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    envLines.forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn('Failed to parse .env file:', e);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mwuzxPcr8pPb6-SmURgBoA_NRqL0jna';

console.log('Connecting to Supabase at:', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncSeedDataToSupabase() {
  // 2. Read and transpile seedData.ts
  const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ seedData.ts not found!');
    process.exit(1);
  }

  const code = fs.readFileSync(seedPath, 'utf8');
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', js);
  fn(m, m.exports, require);

  const seedTools = m.exports.initialTools || [];
  console.log(`📦 Loaded ${seedTools.length} tools from seedData.ts...`);

  // Fetch existing tools from Supabase to check duplicates
  const { data: existingDbTools, error: fetchErr } = await supabase.from('tools').select('id, slug, name');
  if (fetchErr) {
    console.error('❌ Error fetching existing tools from Supabase:', fetchErr.message);
  }

  const existingSlugMap = new Map((existingDbTools || []).map(t => [(t.slug || '').replace(/-[0-9]+$/, ''), t.id]));
  console.log(`🔍 Found ${existingSlugMap.size} existing tools in Supabase DB.`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const tool of seedTools) {
    const cleanSlug = (tool.slug || '').replace(/-[0-9]+$/, '');
    if (!cleanSlug) continue;

    const row = {
      name: tool.name,
      slug: cleanSlug,
      tagline: tool.tagline || '',
      description: tool.description || '',
      category_slug: tool.categorySlug || 'software',
      sub_category: tool.subCategory || 'General',
      pricing: tool.pricing || 'free',
      pricing_url: tool.pricingUrl || '',
      platforms: tool.platforms || ['Web'],
      pricing_plans: tool.pricingPlans || [],
      features: tool.features || [],
      use_cases: tool.useCases || [],
      pros: tool.pros || [],
      cons: tool.cons || [],
      logo_url: tool.logoUrl || 'https://aifynest.com/logo.png',
      screenshot_urls: tool.screenshotUrls || [],
      video_url: tool.videoUrl || null,
      website_url: tool.websiteUrl || `https://${cleanSlug}.com`,
      rating: tool.rating || 4.5,
      review_count: tool.reviewCount || 10,
      is_verified: tool.isVerified !== undefined ? tool.isVerified : true,
      is_featured: tool.isFeatured || false,
      is_sponsored: tool.isSponsored || false,
      status: 'approved',
      owner_id: tool.ownerId || null,
      claim_status: tool.claimStatus || 'unclaimed',
      last_updated: tool.lastUpdated || new Date().toISOString().split('T')[0],
      tags: tool.tags || []
    };

    if (existingSlugMap.has(cleanSlug)) {
      // Update existing record
      const existingId = existingSlugMap.get(cleanSlug);
      const { error: updateErr } = await supabase
        .from('tools')
        .update(row)
        .eq('id', existingId);

      if (updateErr) {
        console.error(`⚠️ Failed to update tool "${tool.name}" (${cleanSlug}):`, updateErr.message);
      } else {
        updatedCount++;
      }
    } else {
      // Insert missing tool
      const { error: insertErr } = await supabase
        .from('tools')
        .insert({
          id: tool.id.startsWith('tool-') ? tool.id : undefined,
          ...row
        });

      if (insertErr) {
        // Retry without explicit ID if UUID error
        const { error: retryErr } = await supabase
          .from('tools')
          .insert(row);
        if (retryErr) {
          console.error(`❌ Failed to insert tool "${tool.name}" (${cleanSlug}):`, retryErr.message);
        } else {
          console.log(`✅ Inserted missing tool: "${tool.name}" (${cleanSlug})`);
          insertedCount++;
        }
      } else {
        console.log(`✅ Inserted missing tool: "${tool.name}" (${cleanSlug})`);
        insertedCount++;
      }
    }
  }

  console.log(`\n🎉 Sync complete! Inserted: ${insertedCount}, Updated: ${updatedCount}.`);
}

syncSeedDataToSupabase().catch(err => {
  console.error('❌ Sync script failed:', err);
  process.exit(1);
});
