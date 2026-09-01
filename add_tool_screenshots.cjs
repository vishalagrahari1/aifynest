/* add_tool_screenshots.cjs */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  envLines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const screenshotPools = {
  writing: [
    'https://images.unsplash.com/photo-1542435503-956c469947f6?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'
  ],
  'image-generation': [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=500&fit=crop'
  ],
  video: [
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=500&fit=crop'
  ],
  audio: [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=500&fit=crop'
  ],
  coding: [
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=500&fit=crop'
  ],
  marketing: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=500&fit=crop'
  ],
  productivity: [
    'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=500&fit=crop'
  ],
  design: [
    'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop'
  ],
  default: [
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=500&fit=crop'
  ]
};

const populateScreenshots = async () => {
  console.log('=== AIFynest Tool Screenshot Generator (2-3 Screenshots per Tool) ===');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Authenticate Admin session to bypass RLS UPDATE locks
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mevishal1130@gmail.com',
    password: 'password123'
  });

  if (authErr) {
    console.error('Admin authentication failed:', authErr.message);
    process.exit(1);
  }
  console.log('Admin session authenticated.');

  const { data: tools, error } = await supabase.from('tools').select('id, slug, category_slug, screenshot_urls');
  if (error) {
    console.error('Failed to query tools:', error.message);
    process.exit(1);
  }

  console.log(`Auditing screenshot counts for ${tools.length} database tools...`);
  let updatedCount = 0;

  for (let idx = 0; idx < tools.length; idx++) {
    const tool = tools[idx];
    const existing = tool.screenshot_urls || [];
    
    // If fewer than 2 screenshots, populate 2-3 tailored screenshots
    if (existing.length < 2) {
      const catSlug = tool.category_slug || 'default';
      const pool = screenshotPools[catSlug] || screenshotPools['default'];
      
      // Rotate pool images so tools in the same category get varied order/selection
      const img1 = pool[idx % pool.length];
      const img2 = pool[(idx + 1) % pool.length];
      const img3 = pool[(idx + 2) % pool.length];

      const newScreenshots = Array.from(new Set([...existing, img1, img2, img3])).slice(0, 3);

      const { error: upErr } = await supabase
        .from('tools')
        .update({ screenshot_urls: newScreenshots })
        .eq('id', tool.id);

      if (upErr) {
        console.warn(`Failed to update screenshots for ${tool.slug}:`, upErr.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\nSuccessfully populated screenshots for ${updatedCount} tools!`);

  // Verify screenshot counts
  const { data: verifyData } = await supabase.from('tools').select('name, screenshot_urls');
  let under2 = 0;
  let totalScreenshots = 0;

  (verifyData || []).forEach(t => {
    const c = (t.screenshot_urls || []).length;
    totalScreenshots += c;
    if (c < 2) under2++;
  });

  console.log('\n--- VERIFICATION REPORT ---');
  console.log(`Total Database Tools: ${verifyData.length}`);
  console.log(`Tools with < 2 screenshots: ${under2}`);
  console.log(`Total Screenshots Indexed: ${totalScreenshots}`);
  console.log(`Average Screenshots per Tool: ${(totalScreenshots / verifyData.length).toFixed(2)}`);
};

populateScreenshots().catch(err => {
  console.error('Screenshot assignment failed:', err);
  process.exit(1);
});
