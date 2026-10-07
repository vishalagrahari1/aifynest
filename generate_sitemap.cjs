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

function writeSitemap(categories, tools, blogPosts = []) {
  const staticUrls = [
    '',
    '/ai-tools',
    '/blog',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/pricing',
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

  if (blogPosts && blogPosts.length > 0) {
    blogPosts.forEach((post) => {
      if (post.slug) {
        staticUrls.push(`/blog/${post.slug}`);
      }
    });
  }

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
      xml += `    <loc>${SITE_URL}/categories/${cat.slug}</loc>\n`;
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
  console.log(`Sitemap successfully written to ${outputPath} (${tools ? tools.length : 0} approved tools, ${blogPosts ? blogPosts.length : 0} blog posts indexed).`);
}

async function generate() {
  console.log('Generating sitemap for site domain:', SITE_URL);
  
  let allTools = [];
  let categories = [];
  let blogPosts = [];

  if (SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      const { data: dbTools } = await supabase.from('tools').select('slug, status').eq('status', 'approved');
      if (dbTools) allTools = [...dbTools];

      const { data: dbCat } = await supabase.from('categories').select('slug');
      if (dbCat) categories = dbCat;

      const { data: dbPosts } = await supabase.from('blog_posts').select('slug');
      if (dbPosts) blogPosts = dbPosts;
    } catch (err) {
      console.warn('Error fetching data from Supabase for sitemap:', err.message);
    }
  }

  // Fallback: Transpile seedData.ts for seed tools and blog posts
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
      const existingToolSlugs = new Set(allTools.map(t => (t.slug || '').replace(/-[0-9]+$/, '')));
      seedTools.forEach(st => {
        const cleanSlug = (st.slug || '').replace(/-[0-9]+$/, '');
        if (cleanSlug && !existingToolSlugs.has(cleanSlug)) {
          allTools.push({ slug: cleanSlug, status: 'approved' });
          existingToolSlugs.add(cleanSlug);
        }
      });

      const seedPosts = m.exports.initialBlogPosts || [];
      const existingPostSlugs = new Set(blogPosts.map(b => b.slug));
      seedPosts.forEach(sp => {
        if (sp.slug && !existingPostSlugs.has(sp.slug)) {
          blogPosts.push({ slug: sp.slug });
          existingPostSlugs.add(sp.slug);
        }
      });
    }
  } catch (e) {
    console.warn('Error merging seed fallback in sitemap:', e);
  }

  writeSitemap(categories, allTools, blogPosts);
}

generate();
