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

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: tools, error } = await supabase.from('tools').select('id, name, slug, status').order('name');
  
  if (error) {
    console.error('Error fetching tools:', error);
    return;
  }

  console.log('Total tools in database:', tools.length);
  
  // Find all tools with numeric suffixes (e.g., chatgpt-3, cursor-2)
  const suffixed = tools.filter(t => /-[0-9]+$/.test(t.slug));
  console.log('Tools with numeric suffixes:', suffixed.length);
  
  suffixed.forEach(t => {
    console.log(`- ID: ${t.id} | Name: "${t.name}" | Slug: "${t.slug}" | Status: ${t.status}`);
  });

  // Check if clean slugs exist for chatgpt and cursor
  const chatgptTools = tools.filter(t => t.name.toLowerCase().includes('chatgpt') || t.slug.includes('chatgpt'));
  console.log('\nChatGPT matching tools:');
  chatgptTools.forEach(t => console.log(`  Name: "${t.name}" | Slug: "${t.slug}" | Status: ${t.status}`));

  const cursorTools = tools.filter(t => t.name.toLowerCase().includes('cursor') || t.slug.includes('cursor'));
  console.log('\nCursor matching tools:');
  cursorTools.forEach(t => console.log(`  Name: "${t.name}" | Slug: "${t.slug}" | Status: ${t.status}`));
}

run();
