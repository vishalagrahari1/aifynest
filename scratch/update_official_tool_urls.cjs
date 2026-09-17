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

const officialUrlMap = {
  'audioalter': 'https://audioalter.com',
  'ezdubs': 'https://ezdubs.ai',
  'songtell': 'https://www.songtell.com',
  'whatgpt': 'https://whatgpt.ai',
  'chatorg': 'https://chatorg.com',
  'talkai': 'https://talkai.info',
  'gen-z-translator': 'https://genztranslator.com',
  'shuttle': 'https://shuttle.dev',
  'alphazria': 'https://alphazria.com',
  'creatok-ai': 'https://creatok.ai',
  'crano-ai': 'https://crano.ai',
  'mgai': 'https://mgai.ai',
  'lynote': 'https://lynote.com',
  'xotic-ai': 'https://xotic.ai',
  'hotgens': 'https://hotgens.com',
  'nudiva-io': 'https://nudiva.io',
  'flirtify': 'https://flirtify.ai',
  'ai-undress-video': 'https://undress.ai'
};

async function updateUrls() {
  console.log('=== UPDATING ALL DIRECTORY URLs TO OFFICIAL DOMAINS ===\n');

  // 1. Update src/utils/seedData.ts
  const seedPath = path.join(__dirname, '..', 'src', 'utils', 'seedData.ts');
  let seedText = fs.readFileSync(seedPath, 'utf8');

  let seedCount = 0;
  Object.keys(officialUrlMap).forEach(slug => {
    const officialUrl = officialUrlMap[slug];
    const regex = new RegExp(`"websiteUrl":\\s*"https://aitoptools\\.com/tool/[^"]+"`, 'g');
    // Replace specifically for each tool block
  });

  // Global replacement of aitoptools.com URLs in seedData.ts
  Object.entries(officialUrlMap).forEach(([slug, officialUrl]) => {
    // Find pattern: "slug": "slug", ... "websiteUrl": "https://aitoptools..."
    const targetUrlRegex = new RegExp(`("slug":\\s*"${slug}"[\\s\\S]*?"websiteUrl":\\s*")https://aitoptools\\.com/tool/[^"]+(")`, 'g');
    if (targetUrlRegex.test(seedText)) {
      seedText = seedText.replace(targetUrlRegex, `$1${officialUrl}$2`);
      seedCount++;
      console.log(`✅ Updated seedData.ts for tool [${slug}] -> ${officialUrl}`);
    }

    // Also replace pricingUrl if it has aitoptools.com
    const targetPricingRegex = new RegExp(`("slug":\\s*"${slug}"[\\s\\S]*?"pricingUrl":\\s*")https://aitoptools\\.com/tool/[^"]+(")`, 'g');
    if (targetPricingRegex.test(seedText)) {
      seedText = seedText.replace(targetPricingRegex, `$1${officialUrl}$2`);
    }
  });

  fs.writeFileSync(seedPath, seedText, 'utf8');
  console.log(`\nUpdated ${seedCount} tool URLs in seedData.ts!`);

  // 2. Update Supabase database
  if (SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    for (const [slug, officialUrl] of Object.entries(officialUrlMap)) {
      const { data, error } = await supabase
        .from('tools')
        .update({
          website_url: officialUrl,
          pricing_url: officialUrl
        })
        .eq('slug', slug)
        .select();

      if (error) {
        console.error(`❌ DB error updating [${slug}]:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Updated Supabase DB tool [${slug}] -> ${officialUrl}`);
      }
    }
  }

  console.log('\nURL update script complete!');
}

updateUrls();
