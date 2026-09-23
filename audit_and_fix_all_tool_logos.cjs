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

function extractDomain(url, fallbackSlug) {
  if (!url || typeof url !== 'string') return `${fallbackSlug}.com`;
  let cleaned = url.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
  if (cleaned.length < 3 || !cleaned.includes('.')) {
    return `${fallbackSlug.replace(/-[0-9]+$/, '')}.com`;
  }
  return cleaned;
}

async function fixAllLogosWithAdminAuth() {
  console.log('🚀 Authenticating Admin Session...');
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mevishal1130@gmail.com',
    password: 'password123'
  });

  if (authErr) {
    console.warn('Admin auth note:', authErr.message);
  } else {
    console.log('✅ Admin session authenticated successfully!');
  }

  // 1. Process seedData.ts first
  const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
  const code = fs.readFileSync(seedPath, 'utf8');

  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', js);
  fn(m, m.exports, require);
  const seedTools = m.exports.initialTools || [];

  let seedUpdated = 0;
  seedTools.forEach(tool => {
    const logo = (tool.logoUrl || '').toLowerCase();
    if (logo.includes('unsplash.com') || !logo || logo === 'undefined' || logo === 'null') {
      const domain = extractDomain(tool.websiteUrl, tool.slug);
      tool.logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      seedUpdated++;
    }
  });

  const serializedTools = JSON.stringify(seedTools, null, 2);
  const startMarker = 'export const initialTools: Tool[] = [';
  const startIndex = code.indexOf(startMarker);
  const nextExportIndex = code.indexOf('export const initialReviews', startIndex);

  const prefix = code.slice(0, startIndex + startMarker.length);
  const suffix = code.slice(nextExportIndex);

  const newCode = `${prefix}\n${serializedTools.slice(1, -1)}\n;\n\n${suffix}`;
  fs.writeFileSync(seedPath, newCode, 'utf8');
  console.log(`✅ Updated logoUrl for ${seedUpdated} seed tools in seedData.ts!`);

  // 2. Process Supabase DB
  const { data: dbTools, error: dbErr } = await supabase.from('tools').select('id, name, slug, website_url, logo_url');
  if (dbErr) {
    console.error('❌ Supabase fetch error:', dbErr.message);
    return;
  }

  console.log(`\n🔍 Auditing ${dbTools.length} tools in Supabase DB...`);
  let dbUpdated = 0;

  for (const t of dbTools) {
    const logo = (t.logo_url || '').toLowerCase();
    if (logo.includes('unsplash.com') || !logo || logo === 'undefined' || logo === 'null') {
      const domain = extractDomain(t.website_url, t.slug);
      const properLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      const { error: upErr } = await supabase
        .from('tools')
        .update({ logo_url: properLogo })
        .eq('id', t.id);

      if (upErr) {
        console.warn(`⚠️ Warning updating logo for [${t.slug}]:`, upErr.message);
      } else {
        console.log(`✅ Replaced unsplash logo for DB tool [${t.slug}] (${t.name}) -> ${properLogo}`);
        dbUpdated++;
      }
    }
  }

  console.log(`🎉 Successfully updated logos for ${dbUpdated} database tools in Supabase DB!`);
}

fixAllLogosWithAdminAuth();
