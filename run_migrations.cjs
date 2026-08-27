/* C:\Users\Admin\.gemini\antigravity\scratch\ai-tools-directory\run_migrations.cjs */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://izjpavrrcbglrdvrqeng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

async function main() {
  console.log('Reading supabase_migrations.sql...');
  const sql = fs.readFileSync('supabase_migrations.sql', 'utf8');

  console.log('Executing DDL migrations in Supabase remote database...');
  const { data, error } = await serviceClient.rpc('execute_sql_query', {
    sql_text: sql
  });

  if (error) {
    console.error('Migration failed:', error.message);
  } else {
    console.log('Migration executed successfully. Result:', data);
  }
}

main();
