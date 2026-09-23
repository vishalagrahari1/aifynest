const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

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
} catch (e) {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mwuzxPcr8pPb6-SmURgBoA_NRqL0jna';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectLogos() {
  const { data: dbTools, error } = await supabase.from('tools').select('id, name, slug, website_url, logo_url');
  if (error) {
    console.error('DB Error:', error.message);
    return;
  }

  console.log(`Total tools in Supabase DB: ${dbTools.length}`);

  let unsplashCount = 0;
  let logoApiCount = 0;
  let genericCount = 0;

  dbTools.forEach(t => {
    const logo = (t.logo_url || '').toLowerCase();
    if (logo.includes('unsplash.com')) {
      unsplashCount++;
    } else if (logo.includes('clearbit') || logo.includes('google.com/s2/favicons') || logo.includes('unavatar') || logo.includes('icon.horse')) {
      logoApiCount++;
    } else {
      genericCount++;
    }
  });

  console.log(`Logos from Unsplash placeholders: ${unsplashCount}`);
  console.log(`Logos from real domain icon/logo APIs: ${logoApiCount}`);
  console.log(`Other logos: ${genericCount}`);

  console.log('\nSample tools with logo URLs:');
  dbTools.slice(0, 15).forEach(t => {
    console.log(`- [${t.slug}] ${t.name} (${t.website_url}): ${t.logo_url}`);
  });
}

inspectLogos();
