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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('tools').select('id, name, slug').ilike('name', '%chatgpt%');
  console.log('Anon key query output:', data, error);
}

run();
