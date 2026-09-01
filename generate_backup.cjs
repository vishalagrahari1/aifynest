/* generate_backup.cjs */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env file if available
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const runBackup = async () => {
  console.log('=== AIFynest Database & Local Storage Backup Tool ===');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup_snapshot_${timestamp}.json`;
  const backupPath = path.join(__dirname, backupFilename);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'Production Launch Audit Backup',
      supabaseUrl
    },
    tables: {}
  };

  if (supabaseUrl && supabaseKey) {
    console.log(`Connecting to Supabase instance at ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const tablesToBackup = [
      'profiles',
      'categories',
      'tools',
      'reviews',
      'tool_claims',
      'campaigns',
      'payments',
      'analytics_events',
      'affiliate_links',
      'audit_logs',
      'notifications'
    ];

    for (const tbl of tablesToBackup) {
      try {
        const { data, error } = await supabase.from(tbl).select('*');
        if (error) {
          console.warn(`Warning reading table ${tbl}:`, error.message);
          backupData.tables[tbl] = [];
        } else {
          backupData.tables[tbl] = data || [];
          console.log(`Fetched ${data?.length || 0} rows from table "${tbl}"`);
        }
      } catch (err) {
        console.warn(`Exception reading table ${tbl}:`, err.message);
        backupData.tables[tbl] = [];
      }
    }
  }

  // Backup localStorage fallback file if present
  const localBackup = path.join(__dirname, 'localstorage_backup.json');
  if (fs.existsSync(localBackup)) {
    try {
      backupData.localstorage_backup = JSON.parse(fs.readFileSync(localBackup, 'utf8'));
      console.log('Included localstorage_backup.json snapshot into backup.');
    } catch (e) {
      console.warn('Could not parse localstorage_backup.json:', e.message);
    }
  }

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`\nBackup successfully created: ${backupFilename}`);
  console.log(`File location: ${backupPath}`);
  console.log(`Size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
};

runBackup().catch(err => {
  console.error('Backup execution failed:', err);
  process.exit(1);
});
