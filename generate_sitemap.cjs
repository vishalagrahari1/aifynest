// scripts/generate_sitemap.cjs
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env variables manually to avoid external dependency issues
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
} catch (e) {
  console.warn('Failed to parse .env file manually:', e);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SITE_URL = process.env.VITE_SITE_URL || 'https://aifynest.com';

function writeSitemap(categories, tools) {
  const staticUrls = [
    '',
    '/ai-tools',
    '/claim',
    '/submit-tool',
    '/login'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Write static routes
  staticUrls.forEach((route) => {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}${route}</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Write category routes
  if (categories && categories.length > 0) {
    categories.forEach((cat) => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/ai-tools/${cat.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
  }

  // Write approved tool detail routes
  if (tools && tools.length > 0) {
    tools.forEach((tool) => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/tools/${tool.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });
  }

  xml += `</urlset>\n`;

  const outputPath = path.join(__dirname, 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Sitemap successfully written to ${outputPath} (${tools ? tools.length : 0} approved tools indexed).`);
}

async function generate() {
  console.log('Generating sitemap for site domain:', SITE_URL);
  
  if (!SUPABASE_SERVICE_KEY) {
    console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing from environment. Static sitemap generated without database listings.');
    writeSitemap([], []);
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // 1. Fetch approved tools
    const { data: tools, error: tErr } = await supabase
      .from('tools')
      .select('slug, status')
      .eq('status', 'approved');
    
    if (tErr) throw tErr;

    // 2. Fetch categories
    const { data: categories, error: cErr } = await supabase
      .from('categories')
      .select('slug');
    
    if (cErr) throw cErr;

    writeSitemap(categories, tools);
  } catch (err) {
    console.error('Error fetching data from Supabase for sitemap:', err.message);
    console.warn('Falling back to static-only sitemap generation.');
    writeSitemap([], []);
  }
}

generate();
