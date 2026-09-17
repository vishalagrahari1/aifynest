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

const slugUpdates = [
  { id: '75023c28-7f08-4beb-a719-07a36bd63050', name: 'ChatGPT', oldSlug: 'chatgpt-3', newSlug: 'chatgpt' },
  { id: '26627817-1204-44ac-ac01-04f445069d2a', name: 'Cursor', oldSlug: 'cursor-2', newSlug: 'cursor' },
  { id: '56860535-efe6-4a41-9283-e6d05ab644df', name: 'Jasper', oldSlug: 'jasper-4', newSlug: 'jasper' },
  { id: '266e83ce-24a3-4cc0-a14c-ee16bc8b5f31', name: 'Julius AI', oldSlug: 'julius-ai-4', newSlug: 'julius-ai' },
  { id: '4f0f91fa-c673-435d-8936-6eb395a2533f', name: 'Midjourney', oldSlug: 'midjourney-4', newSlug: 'midjourney' },
  { id: '35bf1b39-78eb-4f67-bbec-695e2ddb6587', name: 'Phind', oldSlug: 'phind-2', newSlug: 'phind' },
  { id: '3b786775-ad07-4d9f-9eea-864a5e477f8a', name: 'Synthesia', oldSlug: 'synthesia-3', newSlug: 'synthesia' },
];

async function cleanSlugs() {
  console.log('Connecting to Supabase to clean tool slugs...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  for (const item of slugUpdates) {
    const { data, error } = await supabase
      .from('tools')
      .update({ slug: item.newSlug })
      .eq('id', item.id)
      .select();

    if (error) {
      console.error(`❌ Error updating ${item.name} (${item.oldSlug} -> ${item.newSlug}):`, error.message);
    } else {
      console.log(`✅ Successfully updated ${item.name}: ${item.oldSlug} -> ${item.newSlug}`);
    }
  }

  console.log('Slug cleanup completed!');
}

cleanSlugs();
