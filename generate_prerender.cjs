// scripts/generate_prerender.cjs
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
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
  console.warn('Failed to parse .env file:', e);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6anBhdnJyY2JnbHJkdnJxZW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTgzNTYsImV4cCI6MjA3MTk3NDM1Nn0.7B8S9Mskf-h81i89S_H3nU_0qQyD_6n8kF7hF9N0kF8';
const SITE_URL = process.env.VITE_SITE_URL || 'https://aifynest.com';

function escapeAttribute(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cleanMetaDescription(str) {
  if (!str) return '';
  const cleanStr = String(str).replace(/\s+/g, ' ').trim();
  if (cleanStr.length <= 155) return cleanStr;
  const cut = cleanStr.slice(0, 155);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + '...';
}

function buildPageHTML(templateHTML, options) {
  const {
    title,
    description,
    canonicalUrl,
    ogImage = 'https://aifynest.com/logo.png',
    ogType = 'website',
    schemaMarkup
  } = options;

  const formattedTitle = title.includes('AIFynest') ? title : `${title} | AIFynest`;
  const formattedDesc = cleanMetaDescription(description);

  let html = templateHTML;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeAttribute(formattedTitle)}</title>`);

  // Replace Meta Description
  html = html.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${escapeAttribute(formattedDesc)}" />`);

  // Replace Canonical Link
  if (canonicalUrl) {
    html = html.replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />`);
  }

  // Replace Open Graph Tags
  html = html.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${escapeAttribute(formattedTitle)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${escapeAttribute(formattedDesc)}" />`);
  if (canonicalUrl) {
    html = html.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />`);
  }
  if (ogImage) {
    html = html.replace(/<meta property="og:image" content=".*?" \/>/s, `<meta property="og:image" content="${escapeAttribute(ogImage)}" />`);
  }
  if (ogType) {
    html = html.replace(/<meta property="og:type" content=".*?" \/>/s, `<meta property="og:type" content="${escapeAttribute(ogType)}" />`);
  }

  // Replace Twitter Tags
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${escapeAttribute(formattedTitle)}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${escapeAttribute(formattedDesc)}" />`);
  if (ogImage) {
    html = html.replace(/<meta name="twitter:image" content=".*?" \/>/s, `<meta name="twitter:image" content="${escapeAttribute(ogImage)}" />`);
  }

  // Inject JSON-LD Schema
  if (schemaMarkup) {
    const jsonLdScript = `<script id="seo-json-ld" type="application/ld+json">\n${JSON.stringify(schemaMarkup, null, 2)}\n</script>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${jsonLdScript}\n</head>`);
    }
  }

  return html;
}

function writeStaticFile(routePath, htmlContent) {
  const distDir = path.join(__dirname, 'dist');
  const cleanPath = routePath.replace(/^\//, '');
  
  // E.g. routePath = "/tools/zoice" -> dist/tools/zoice/index.html
  const targetDir = cleanPath ? path.join(distDir, cleanPath) : distDir;
  fs.mkdirSync(targetDir, { recursive: true });
  
  const filePath = path.join(targetDir, 'index.html');
  fs.writeFileSync(filePath, htmlContent, 'utf8');
}

function normalizeTool(raw) {
  return {
    name: raw.name || '',
    slug: (raw.slug || '').replace(/-[0-9]+$/, ''),
    tagline: raw.tagline || '',
    description: raw.description || '',
    categorySlug: raw.category_slug || raw.categorySlug || 'software',
    pricing: raw.pricing || 'free',
    logoUrl: raw.logo_url || raw.logoUrl || 'https://aifynest.com/logo.png',
    screenshotUrls: raw.screenshot_urls || raw.screenshotUrls || [],
    rating: raw.rating || 4.5,
    reviewCount: raw.review_count || raw.reviewCount || 0,
    seoTitle: raw.seo_title || raw.seoTitle || '',
    metaDescription: raw.meta_description || raw.metaDescription || '',
    canonicalUrl: raw.canonical_url || raw.canonicalUrl || '',
    socialImage: raw.social_image || raw.socialImage || ''
  };
}

async function runPrerender() {
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    console.error('❌ dist/index.html not found! Run vite build first.');
    process.exit(1);
  }

  const templateHTML = fs.readFileSync(distIndexPath, 'utf8');
  console.log('⚡ Starting SSG Prerender for static routes, categories, and tool pages...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Fetch tools from Supabase
  let tools = [];
  try {
    const { data: dbTools } = await supabase.from('tools').select('*');
    if (dbTools && dbTools.length > 0) {
      tools = dbTools.map(normalizeTool);
    }
  } catch (e) {
    console.warn('Failed to fetch tools from Supabase:', e);
  }

  // Fallback: Transpile seedData.ts to ensure ALL seed tools (trustmrr, lynote, pixaryai, etc.) are included
  try {
    const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
    if (fs.existsSync(seedPath)) {
      const ts = require('typescript');
      const code = fs.readFileSync(seedPath, 'utf8');
      const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
      const m = { exports: {} };
      const fn = new Function('module', 'exports', 'require', js);
      fn(m, m.exports, require);

      const seedTools = (m.exports.initialTools || []).map(normalizeTool);
      const existingSlugs = new Set(tools.map(t => (t.slug || '').replace(/-[0-9]+$/, '')));

      let seedAddedCount = 0;
      seedTools.forEach(st => {
        const cleanSlug = (st.slug || '').replace(/-[0-9]+$/, '');
        if (cleanSlug && !existingSlugs.has(cleanSlug)) {
          tools.push(st);
          existingSlugs.add(cleanSlug);
          seedAddedCount++;
        }
      });
      console.log(`📦 Merged ${seedAddedCount} additional seed tools from seedData.ts into prerender queue.`);
    }
  } catch (e) {
    console.warn('Error processing seed fallback in prerender:', e);
  }

  // 2. Fetch categories
  let categories = [];
  try {
    const { data: dbCat } = await supabase.from('categories').select('*');
    if (dbCat && dbCat.length > 0) {
      categories = dbCat;
    }
  } catch (e) {}

  console.log(`Loaded ${tools ? tools.length : 0} tools and ${categories ? categories.length : 0} categories.`);

  // A. Static Pages
  const staticRoutes = [
    {
      path: '/ai-tools',
      title: 'Discover Best AI Tools & Productivity Apps — AIFynest',
      description: 'Browse the ultimate directory of AI tools, platforms, and software across writing, marketing, coding, design, audio, and video categories.'
    },
    {
      path: '/blog',
      title: 'AI Insights & Guides Blog — AIFynest',
      description: 'Explore in-depth articles, AI tool roundups, tutorials, and technology insights on AIFynest.'
    },
    {
      path: '/best-image-generation-tools',
      title: 'Best AI Image Generation Tools in 2026 — AIFynest',
      description: 'Discover and compare top AI image generation tools like Midjourney, DALL-E 3, Stable Diffusion, and Leonardo AI.'
    },
    {
      path: '/blog/best-image-generation-tools',
      title: 'Best AI Image Generation Tools in 2026 — AIFynest Blog',
      description: 'Discover and compare top AI image generation tools like Midjourney, DALL-E 3, Stable Diffusion, and Leonardo AI.'
    },
    {
      path: '/best-ai-writing-tools-2026',
      title: 'Best AI Writing Tools & Assistants in 2026 — AIFynest',
      description: 'Compare the top AI writing assistants, copywriting tools, and content generators including ChatGPT, Jasper, and Copy.ai.'
    },
    {
      path: '/blog/best-ai-writing-tools-2026',
      title: 'Best AI Writing Tools & Assistants in 2026 — AIFynest Blog',
      description: 'Compare the top AI writing assistants, copywriting tools, and content generators including ChatGPT, Jasper, and Copy.ai.'
    },
    {
      path: '/best-ai-video-editing-tools-2026',
      title: 'Best AI Video Editing Tools in 2026 — AIFynest',
      description: 'Looking for the best AI video editing tools in 2026? Compare 8 top AI video editors for YouTube, Shorts, social media, podcasts, and professional video production.',
      ogImage: 'https://aifynest.com/images/best-ai-video-editing-tools-2026.jpg'
    },
    {
      path: '/blog/best-ai-video-editing-tools-2026',
      title: 'Best AI Video Editing Tools in 2026 — AIFynest Blog',
      description: 'Looking for the best AI video editing tools in 2026? Compare 8 top AI video editors for YouTube, Shorts, social media, podcasts, and professional video production.',
      ogImage: 'https://aifynest.com/images/best-ai-video-editing-tools-2026.jpg'
    },
    {
      path: '/about',
      title: 'About Us — AIFynest',
      description: 'Learn about AIFynest, our mission to curate the best artificial intelligence tools, and our review evaluation standards.'
    },
    {
      path: '/contact',
      title: 'Contact Us — AIFynest',
      description: 'Get in touch with the AIFynest team for listing inquiries, partnerships, and support.'
    },
    {
      path: '/terms',
      title: 'Terms of Service — AIFynest',
      description: 'Read the official Terms of Service and usage policies for AIFynest.'
    },
    {
      path: '/privacy',
      title: 'Privacy Policy — AIFynest',
      description: 'Read the official Privacy Policy for AIFynest.'
    },
    {
      path: '/refund-policy',
      title: 'Refund Policy — AIFynest',
      description: 'Review AIFynest refund policies for sponsorship and listing verification packages.'
    },
    {
      path: '/advertise',
      title: 'Sponsor Your AI Tool — AIFynest',
      description: 'Boost your AI tool\'s visibility. Choose between Popular Tools placement, Featured Packs, or Annual Pass on AIFynest.'
    },
    {
      path: '/submit-tool',
      title: 'Submit an AI Tool — AIFynest',
      description: 'Submit your AI tool or software application to be reviewed and listed on AIFynest.'
    },
    {
      path: '/claim',
      title: 'Claim Your AI Tool Listing — AIFynest',
      description: 'Verify ownership of your AI tool listing to edit details, respond to reviews, and run promotional campaigns.'
    },
    {
      path: '/pricing',
      title: 'Official Promotion & Pricing Plans — AIFynest',
      description: 'Explore advertising tiers and sponsorship packages to feature your AI tool on AIFynest.'
    },
    {
      path: '/collections',
      title: 'Curated AI Tool Collections & Stacks — AIFynest',
      description: 'Hand-curated collections of the best AI tools organized by workflow, role, and industry use case.'
    },
    {
      path: '/trending',
      title: 'Trending & Viral AI Tools — AIFynest',
      description: 'Explore the fastest-growing and most popular AI tools trending this week on AIFynest.'
    },
    {
      path: '/new-tools',
      title: 'New & Recently Added AI Tools — AIFynest',
      description: 'Check out the latest AI tools and emerging software added to AIFynest today.'
    },
    {
      path: '/new',
      title: 'New & Recently Added AI Tools — AIFynest',
      description: 'Check out the latest AI tools and emerging software added to AIFynest today.'
    },
    {
      path: '/compare',
      title: 'Compare AI Tools Side-by-Side — AIFynest',
      description: 'Compare features, pricing, pros & cons, and ratings of top AI tools side-by-side on AIFynest.'
    },
    {
      path: '/editorial',
      title: 'Editorial Policy & Standards — AIFynest',
      description: 'Read about AIFynest editorial standards, verification processes, and content guidelines.'
    },
    {
      path: '/reviews',
      title: 'Review Guidelines & Integrity — AIFynest',
      description: 'Learn how AIFynest collects, moderates, and verifies user reviews for AI tools.'
    },
    {
      path: '/disclosure',
      title: 'Advertising & Affiliate Disclosure — AIFynest',
      description: 'Read the official advertising and affiliate disclosure policy for AIFynest.'
    },
    {
      path: '/login',
      title: 'Log In — AIFynest',
      description: 'Log in to your AIFynest account to manage listings, save favorite tools, and access dashboard analytics.'
    },
    {
      path: '/signup',
      title: 'Sign Up — AIFynest Account',
      description: 'Create an account on AIFynest to review AI software, submit applications, and bookmark favorites.'
    }
  ];

  staticRoutes.forEach(route => {
    const html = buildPageHTML(templateHTML, {
      title: route.title,
      description: route.description,
      canonicalUrl: `${SITE_URL}${route.path}`
    });
    writeStaticFile(route.path, html);
  });

  // B. Category Pages
  if (categories && categories.length > 0) {
    categories.forEach(cat => {
      const catTitle = `Top ${cat.name} AI Tools & Software in 2026 — AIFynest`;
      const catDesc = `Explore the best ${cat.name} AI tools, software platforms, and utilities. Compare features, pricing, and user reviews on AIFynest.`;
      
      const html = buildPageHTML(templateHTML, {
        title: catTitle,
        description: catDesc,
        canonicalUrl: `${SITE_URL}/ai-tools/${cat.slug}`
      });

      writeStaticFile(`/ai-tools/${cat.slug}`, html);
      writeStaticFile(`/categories/${cat.slug}`, html);
    });
  }

  // C. Tool Detail Pages (ALL 196+ TOOLS)
  if (tools && tools.length > 0) {
    let prerenderedToolsCount = 0;
    tools.forEach(tool => {
      const cleanSlug = (tool.slug || '').replace(/-[0-9]+$/, '');
      if (!cleanSlug) return;

      const toolSeoTitle = tool.seoTitle || `${tool.name} — Features, Pricing, Reviews & Alternatives`;
      
      const defaultMeta = tool.description && tool.description.length > 30
        ? `${tool.name}: ${tool.tagline}. Read verified user reviews, compare ${tool.pricing || 'free'} pricing plans, key features, and top alternatives on AIFynest.`
        : `Discover ${tool.name}: ${tool.tagline || 'AI tool'}. Read ratings, compare pricing, key features, and alternatives on AIFynest.`;

      const toolMetaDescription = (tool.metaDescription || defaultMeta).slice(0, 160);
      const canonicalUrl = tool.canonicalUrl || `${SITE_URL}/tools/${cleanSlug}`;
      const ogImage = tool.socialImage || tool.logoUrl || 'https://aifynest.com/logo.png';

      const schemaMarkup = [
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': tool.name,
          'description': tool.description || tool.tagline,
          'url': canonicalUrl,
          'image': tool.logoUrl || ogImage,
          'applicationCategory': tool.categorySlug || 'AI Tools',
          'operatingSystem': tool.platforms && tool.platforms.length > 0 ? tool.platforms.join(', ') : 'Web',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
          },
          ...(tool.rating > 0 && tool.reviewCount > 0
            ? {
                'aggregateRating': {
                  '@type': 'AggregateRating',
                  'ratingValue': tool.rating,
                  'reviewCount': tool.reviewCount,
                  'bestRating': '5',
                  'worstRating': '1'
                }
              }
            : {})
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': SITE_URL
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'AI Tools',
              'item': `${SITE_URL}/ai-tools`
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': (tool.categorySlug || 'software').toUpperCase(),
              'item': `${SITE_URL}/ai-tools/${tool.categorySlug || 'software'}`
            },
            {
              '@type': 'ListItem',
              'position': 4,
              'name': tool.name,
              'item': canonicalUrl
            }
          ]
        }
      ];

      const html = buildPageHTML(templateHTML, {
        title: toolSeoTitle,
        description: toolMetaDescription,
        canonicalUrl,
        ogImage,
        ogType: 'product',
        schemaMarkup
      });

      writeStaticFile(`/tools/${cleanSlug}`, html);
      prerenderedToolsCount++;
    });

    console.log(`✅ Successfully prerendered ${prerenderedToolsCount} tool pages to dist/tools/*/index.html!`);
  }

  console.log('✨ SSG Prerender process finished successfully.');
}

runPrerender().catch(err => {
  console.error('❌ Prerender script error:', err);
  process.exit(1);
});
