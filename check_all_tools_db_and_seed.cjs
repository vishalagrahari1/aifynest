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

async function runCheck() {
  // 1. Check seedData.ts
  const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
  const code = fs.readFileSync(seedPath, 'utf8');
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', js);
  fn(m, m.exports, require);
  const seedTools = m.exports.initialTools || [];

  console.log(`=== SEED DATA TOOLS (${seedTools.length} total) ===`);
  let seedShort = 0;
  seedTools.forEach((t, i) => {
    const words = (t.description || '').trim().split(/\s+/).filter(Boolean).length;
    if (words < 200) {
      seedShort++;
    }
  });
  console.log(`Seed tools with < 200 words: ${seedShort} / ${seedTools.length}`);

  // 2. Check Supabase DB
  const { data: dbTools, error } = await supabase.from('tools').select('id, name, slug, description');
  if (error) {
    console.error('Error fetching from Supabase:', error.message);
    return;
  }
  console.log(`\n=== SUPABASE DB TOOLS (${dbTools.length} total) ===`);
  let dbShort = 0;
  const shortDbTools = [];
  dbTools.forEach((t, i) => {
    const words = (t.description || '').trim().split(/\s+/).filter(Boolean).length;
    if (words < 200) {
      dbShort++;
      shortDbTools.push({ id: t.id, slug: t.slug, name: t.name, words });
    }
  });
  console.log(`Supabase tools with < 200 words: ${dbShort} / ${dbTools.length}`);
}

runCheck();
