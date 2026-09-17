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

async function removeSpicyGen() {
  console.log('Connecting to Supabase to remove SpicyGen...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Check if SpicyGen exists
  const { data: existing, error: selectErr } = await supabase
    .from('tools')
    .select('id, name, slug')
    .ilike('name', '%spicygen%');

  console.log('SpicyGen matching records in DB:', existing);

  if (existing && existing.length > 0) {
    const ids = existing.map(t => t.id);
    const { data: delData, error: delErr } = await supabase
      .from('tools')
      .delete()
      .in('id', ids);

    if (delErr) {
      console.error('❌ Error deleting SpicyGen from DB:', delErr.message);
    } else {
      console.log('✅ Successfully deleted SpicyGen from Supabase database!');
    }
  } else {
    console.log('No SpicyGen records found in DB.');
  }
}

removeSpicyGen();
