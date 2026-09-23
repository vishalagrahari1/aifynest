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

async function fixZoiceDomain() {
  console.log('🚀 Authenticating Admin Session to update Zoice URLs to zoice.ai...');
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mevishal1130@gmail.com',
    password: 'password123'
  });

  if (authErr) {
    console.warn('Admin auth note:', authErr.message);
  } else {
    console.log('✅ Admin session authenticated successfully!');
  }

  const zoiceUpdate = {
    website_url: 'https://zoice.ai',
    pricing_url: 'https://zoice.ai',
    affiliate_url: 'https://zoice.ai',
    logo_url: 'https://www.google.com/s2/favicons?domain=zoice.ai&sz=128'
  };

  // 1. Update Supabase DB
  const { error: dbErr } = await supabase
    .from('tools')
    .update(zoiceUpdate)
    .eq('slug', 'zoice');

  if (dbErr) {
    console.error('❌ Error updating Zoice in Supabase DB:', dbErr.message);
  } else {
    console.log('✅ Updated Zoice tool in Supabase DB to https://zoice.ai and official logo!');
  }

  // 2. Update seedData.ts
  const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
  const code = fs.readFileSync(seedPath, 'utf8');

  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', js);
  fn(m, m.exports, require);
  const seedTools = m.exports.initialTools || [];

  const zoiceTool = seedTools.find(t => t.slug === 'zoice');
  if (zoiceTool) {
    zoiceTool.websiteUrl = 'https://zoice.ai';
    zoiceTool.pricingUrl = 'https://zoice.ai';
    zoiceTool.affiliateUrl = 'https://zoice.ai';
    zoiceTool.logoUrl = 'https://www.google.com/s2/favicons?domain=zoice.ai&sz=128';

    const serializedTools = JSON.stringify(seedTools, null, 2);
    const startMarker = 'export const initialTools: Tool[] = [';
    const startIndex = code.indexOf(startMarker);
    const nextExportIndex = code.indexOf('export const initialReviews', startIndex);

    const prefix = code.slice(0, startIndex + startMarker.length);
    const suffix = code.slice(nextExportIndex);

    const newCode = `${prefix}\n${serializedTools.slice(1, -1)}\n;\n\n${suffix}`;
    fs.writeFileSync(seedPath, newCode, 'utf8');
    console.log('✅ Updated Zoice in seedData.ts to https://zoice.ai!');
  }
}

fixZoiceDomain();
