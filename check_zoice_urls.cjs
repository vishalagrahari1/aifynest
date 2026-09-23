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

async function checkZoiceUrls() {
  console.log('=== Checking Zoice URLs across Supabase DB ===');
  const { data: dbTools, error } = await supabase
    .from('tools')
    .select('id, name, slug, website_url, pricing_url, logo_url')
    .ilike('name', '%zoice%');

  if (error) {
    console.error('Fetch error:', error.message);
    return;
  }

  console.log(`Found ${dbTools.length} Zoice tool rows in Supabase DB:`);
  dbTools.forEach(t => {
    console.log(`ID: ${t.id} | Slug: ${t.slug} | Name: ${t.name}`);
    console.log(`  website_url: ${t.website_url}`);
    console.log(`  pricing_url: ${t.pricing_url}`);
    console.log(`  logo_url: ${t.logo_url}`);
  });
}

checkZoiceUrls();
