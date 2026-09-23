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
    '/blog',
    '/blog/best-image-generation-tools',
    '/best-image-generation-tools',
    '/blog/best-ai-writing-tools-2026',
    '/best-ai-writing-tools-2026',
    '/blog/best-ai-video-editing-tools-2026',
    '/best-ai-video-editing-tools-2026',
    '/blog/best-ai-tools-dropshipping-2026',
    '/best-ai-tools-dropshipping-2026',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/pricing',
    '/new',
    '/new-tools',
    '/collections',
    '/trending',
    '/compare',
    '/editorial',
    '/reviews',
    '/disclosure',
    '/submit-tool',
    '/claim',
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
      const cleanSlug = (tool.slug || '').replace(/-[0-9]+$/, '');
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/tools/${cleanSlug}</loc>\n`;
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
    const { data: dbTools, error: tErr } = await supabase
      .from('tools')
      .select('slug, status')
      .eq('status', 'approved');
    
    if (tErr) throw tErr;

    let allTools = dbTools ? [...dbTools] : [];

    // Fallback: Transpile seedData.ts to ensure ALL seed tools are indexed in sitemap
    try {
      const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
      if (fs.existsSync(seedPath)) {
        const ts = require('typescript');
        const code = fs.readFileSync(seedPath, 'utf8');
        const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
        const m = { exports: {} };
        const fn = new Function('module', 'exports', 'require', js);
        fn(m, m.exports, require);

        const seedTools = m.exports.initialTools || [];
        const existingSlugs = new Set(allTools.map(t => (t.slug || '').replace(/-[0-9]+$/, '')));

        seedTools.forEach(st => {
          const cleanSlug = (st.slug || '').replace(/-[0-9]+$/, '');
          if (cleanSlug && !existingSlugs.has(cleanSlug)) {
            allTools.push({ slug: cleanSlug, status: 'approved' });
            existingSlugs.add(cleanSlug);
          }
        });
      }
    } catch (e) {
      console.warn('Error merging seed fallback in sitemap:', e);
    }

    // 2. Fetch categories
    const { data: categories, error: cErr } = await supabase
      .from('categories')
      .select('slug');
    
    if (cErr) throw cErr;

    writeSitemap(categories, allTools);
  } catch (err) {
    console.error('Error fetching data from Supabase for sitemap:', err.message);
    console.warn('Falling back to static-only sitemap generation.');
    writeSitemap([], []);
  }
}

generate();
