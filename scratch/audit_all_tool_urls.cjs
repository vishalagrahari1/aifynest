const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

function formatExternalUrl(url) {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed === 'undefined' || trimmed === 'null') {
    return '#';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

async function auditUrls() {
  console.log('=== AUDITING ALL TOOL EXTERNAL URLs ===\n');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data: tools, error } = await supabase.from('tools').select('id, name, slug, website_url, affiliate_url, status').eq('status', 'approved').order('name');
  
  if (error) {
    console.error('Error querying Supabase:', error);
    return;
  }

  console.log(`Total approved tools in DB: ${tools.length}`);

  let missingUrlCount = 0;
  let missingProtocolCount = 0;
  let placeholderDomainCount = 0;

  tools.forEach(t => {
    const raw = t.website_url;
    const formatted = formatExternalUrl(raw);

    if (!raw || formatted === '#') {
      console.log(`❌ [MISSING URL] Tool "${t.name}" (${t.slug}) has no website_url!`);
      missingUrlCount++;
    } else if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      console.log(`⚠️ [MISSING PROTOCOL] Tool "${t.name}" (${t.slug}) raw URL is "${raw}" -> Formatted to "${formatted}"`);
      missingProtocolCount++;
    } else if (raw.includes('aitoptools.com/tool/') || raw.includes('example.com')) {
      console.log(`ℹ️ [DIR URL] Tool "${t.name}" (${t.slug}) has directory/placeholder URL: "${raw}"`);
      placeholderDomainCount++;
    }
  });

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total tools checked: ${tools.length}`);
  console.log(`Missing URLs (#): ${missingUrlCount}`);
  console.log(`Missing http/https protocol: ${missingProtocolCount}`);
  console.log(`Directory / placeholder domain URLs: ${placeholderDomainCount}`);
}

auditUrls();
