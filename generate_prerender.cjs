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

function getCategoryDisplayName(slug) {
  const map = {
    'writing': 'AI Writing',
    'image-generation': 'AI Image Generation',
    'video': 'AI Video',
    'audio': 'AI Audio',
    'coding': 'AI Coding',
    'marketing': 'AI Marketing',
    'productivity': 'AI Productivity',
    'design': 'AI Design',
    'research': 'AI Research',
    'education': 'AI Education',
    'business': 'AI Business',
    'finance': 'AI Finance'
  };
  if (map[slug]) return map[slug];
  const cleaned = (slug || 'software').replace(/-/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function buildPageHTML(templateHTML, options) {
  const {
    title,
    description,
    canonicalUrl,
    ogImage = 'https://aifynest.com/logo.png',
    ogType = 'website',
    schemaMarkup,
    bodyHTML
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

  // Inject prerendered semantic body HTML for search crawlers inside <div id="root">
  if (bodyHTML) {
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${bodyHTML}</div>`);
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

  // 1.5 Fetch blog posts dynamically
  let blogPosts = [];
  try {
    const { data: dbPosts } = await supabase.from('blog_posts').select('*');
    if (dbPosts && dbPosts.length > 0) {
      blogPosts = dbPosts.map(p => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || p.description,
        content: p.content || '',
        author: p.author || 'AIFynest Editorial Team',
        date: p.date || '2026-09-16',
        readTime: p.read_time || p.readTime || '8 min read',
        image: p.featured_image || p.image || '/logo.png'
      }));
    }
  } catch (e) {}

  try {
    const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
    if (fs.existsSync(seedPath)) {
      const ts = require('typescript');
      const code = fs.readFileSync(seedPath, 'utf8');
      const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
      const m = { exports: {} };
      const fn = new Function('module', 'exports', 'require', js);
      fn(m, m.exports, require);

      const seedPosts = m.exports.initialBlogPosts || [];
      const existingSlugs = new Set(blogPosts.map(b => b.slug));

      seedPosts.forEach(sp => {
        if (sp.slug && !existingSlugs.has(sp.slug)) {
          blogPosts.push(sp);
          existingSlugs.add(sp.slug);
        }
      });
      console.log(`📦 Loaded ${blogPosts.length} blog posts into prerender queue.`);
    }
  } catch (e) {
    console.warn('Error processing blog seed fallback in prerender:', e);
  }

  // 2. Fetch categories
  let categories = [];
  try {
    const { data: dbCat } = await supabase.from('categories').select('*');
    if (dbCat && dbCat.length > 0) {
      categories = dbCat;
    }
  } catch (e) {}

  console.log(`Loaded ${tools ? tools.length : 0} tools, ${blogPosts ? blogPosts.length : 0} blog posts, and ${categories ? categories.length : 0} categories.`);

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
    }
  ];

  // Dynamically add all blog post routes (/blog/:slug)
  if (blogPosts && blogPosts.length > 0) {
    blogPosts.forEach(post => {
      if (!post.slug) return;
      const title = post.title.includes('AIFynest') ? post.title : `${post.title} — AIFynest Blog`;
      const description = post.excerpt || post.title;
      let ogImage = post.image || 'https://aifynest.com/logo.png';
      if (ogImage.startsWith('/')) {
        ogImage = `${SITE_URL}${ogImage}`;
      }

      staticRoutes.push({
        path: `/blog/${post.slug}`,
        title,
        description,
        ogImage,
        postObj: post
      });
    });
  }

  staticRoutes.push(
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
  );

  // 0. Update Root Homepage (dist/index.html) with Organization, WebSite, and visible FAQPage schemas
  const rootHomeHtml = buildPageHTML(templateHTML, {
    title: 'AIFynest — Discover the Best AI Tools in One Place',
    description: 'Search, filter, compare, save, and review the best artificial intelligence tools. Find the right AI for your workflow on AIFynest.',
    canonicalUrl: `${SITE_URL}/`,
    schemaMarkup: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'AIFynest',
        'url': `${SITE_URL}/`,
        'logo': `${SITE_URL}/logo.png`,
        'description': 'AIFynest is the premier curated directory for discovering, comparing, and reviewing top artificial intelligence tools, LLM applications, and productivity software.',
        'sameAs': [
          'https://x.com/aifynest',
          'https://www.instagram.com/aifynest/',
          'https://in.pinterest.com/aifynest/',
          'https://github.com/aifynest',
          'https://www.facebook.com/aifynes'
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'AIFynest',
        'url': `${SITE_URL}/`,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${SITE_URL}/ai-tools?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'How does AIFynest curate and review submitted AI tools?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Every submission is reviewed by our administration editors. We verify the destination URL, product capabilities, pricing plans accuracy, and ensure it meets our guidelines before publishing it to the public directory.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How can I claim my AI tool listing?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Simply navigate to the tool detail page, click "Claim this listing" link, and fill out the claim form. Our team will verify your ownership email (usually matching the tool domain) within 24-48 hours.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Does AIFynest charge any commission on affiliate referral clicks?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'We do not charge owners for referral clicks. Outbound clicks are tracked to calculate CPC metrics for builder analytics. If you join our sponsor network, we charge flat advertising placements campaign budgets.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can standard users write reviews and rank tools?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, any registered user can write ratings and pros/cons feedback on published tools. All reviews are curated by editors to eliminate fake feedback, keeping AIFynest trustworthy and transparent.'
            }
          }
        ]
      }
    ]
  });
  fs.writeFileSync(distIndexPath, rootHomeHtml, 'utf8');

  // A. Static Pages & Blog Articles
  staticRoutes.forEach(route => {
    let schemaMarkup = null;

    if (route.path.startsWith('/blog/')) {
      const slug = route.path.replace('/blog/', '');
      schemaMarkup = [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': route.title.split(' — ')[0],
          'description': route.description,
          'author': {
            '@type': 'Person',
            'name': 'AIFynest Editorial Team'
          },
          'datePublished': '2026-09-16',
          'dateModified': '2026-09-16',
          'image': route.ogImage || `${SITE_URL}/logo.png`,
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `${SITE_URL}${route.path}`
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'AIFynest',
            'logo': {
              '@type': 'ImageObject',
              'url': `${SITE_URL}/logo.png`
            }
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': `${SITE_URL}/`
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Blog',
              'item': `${SITE_URL}/blog`
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': route.title.split(' — ')[0],
              'item': `${SITE_URL}${route.path}`
            }
          ]
        }
      ];
    } else if (route.path === '/blog') {
      schemaMarkup = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${SITE_URL}/`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Blog',
            'item': `${SITE_URL}/blog`
          }
        ]
      };
    } else if (route.path === '/ai-tools') {
      schemaMarkup = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${SITE_URL}/`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'AI Tools',
            'item': `${SITE_URL}/ai-tools`
          }
        ]
      };
    }

    let bodyHTML = null;
    if (route.postObj) {
      const p = route.postObj;
      const paragraphs = (p.content || '').split('\n\n').map(para => {
        const cleanP = para.trim();
        if (cleanP.startsWith('# ')) return `<h1 style="font-size:1.8rem;margin:24px 0 12px 0;">${escapeAttribute(cleanP.replace(/^#\s+/, ''))}</h1>`;
        if (cleanP.startsWith('## ')) return `<h2 style="font-size:1.5rem;margin:20px 0 10px 0;">${escapeAttribute(cleanP.replace(/^##\s+/, ''))}</h2>`;
        if (cleanP.startsWith('### ')) return `<h3 style="font-size:1.25rem;margin:16px 0 8px 0;">${escapeAttribute(cleanP.replace(/^###\s+/, ''))}</h3>`;
        return `<p style="margin-bottom:16px;line-height:1.7;">${escapeAttribute(cleanP)}</p>`;
      }).join('\n');

      bodyHTML = `<article class="container section" style="max-width:900px;margin:0 auto;padding:32px 16px;">
        <nav style="font-size:12px;margin-bottom:16px;color:#64748b;"><a href="/">Home</a> &gt; <a href="/blog">Blog</a> &gt; <span>${escapeAttribute(p.title)}</span></nav>
        <h1 style="font-size:2rem;font-weight:bold;margin-bottom:16px;">${escapeAttribute(p.title)}</h1>
        <div style="font-size:13px;color:#64748b;margin-bottom:24px;">By ${escapeAttribute(p.author || 'AIFynest Editorial Team')} &bull; ${escapeAttribute(p.date || '2026-09-16')} &bull; ${escapeAttribute(p.readTime || '8 min read')}</div>
        ${p.image ? `<img src="${escapeAttribute(p.image)}" alt="${escapeAttribute(p.title)}" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin-bottom:24px;" />` : ''}
        <p style="font-size:1.1rem;line-height:1.6;font-weight:500;color:#334155;margin-bottom:24px;">${escapeAttribute(p.excerpt || '')}</p>
        <div class="article-body">${paragraphs}</div>
      </article>`;
    }

    const html = buildPageHTML(templateHTML, {
      title: route.title,
      description: route.description,
      canonicalUrl: `${SITE_URL}${route.path}`,
      ogImage: route.ogImage || `${SITE_URL}/logo.png`,
      schemaMarkup,
      bodyHTML
    });
    writeStaticFile(route.path, html);
  });

  // Explicit static redirect page for /home -> https://aifynest.com/
  const homeRedirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=https://aifynest.com/">
  <link rel="canonical" href="https://aifynest.com/">
  <title>Redirecting to AIFynest Homepage...</title>
  <script>window.location.replace("https://aifynest.com/");</script>
</head>
<body>
  <p>Redirecting to <a href="https://aifynest.com/">https://aifynest.com/</a>...</p>
</body>
</html>`;
  writeStaticFile('/home', homeRedirectHtml);

  // B. Category Pages
  if (categories && categories.length > 0) {
    categories.forEach(cat => {
      const catDisplayName = cat.name.startsWith('AI ') ? cat.name : `AI ${cat.name}`;
      const catTitle = `Top ${catDisplayName} Tools & Software in 2026 — AIFynest`;
      const catDesc = `Explore the best ${catDisplayName} tools, software platforms, and utilities. Compare features, pricing, and user reviews on AIFynest.`;
      
      const schemaMarkup = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${SITE_URL}/`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Categories',
            'item': `${SITE_URL}/categories`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': cat.name,
            'item': `${SITE_URL}/categories/${cat.slug}`
          }
        ]
      };

      const catBodyHTML = `<main class="container section" style="max-width:1000px;margin:0 auto;padding:32px 16px;">
        <nav style="font-size:12px;margin-bottom:16px;color:#64748b;"><a href="/">Home</a> &gt; <a href="/ai-tools">Categories</a> &gt; <span>${escapeAttribute(catDisplayName)}</span></nav>
        <h1 style="font-size:2.2rem;font-weight:bold;margin-bottom:12px;">${escapeAttribute(catTitle)}</h1>
        <p style="font-size:1.1rem;color:#475569;margin-bottom:32px;">${escapeAttribute(catDesc)}</p>
      </main>`;

      const html = buildPageHTML(templateHTML, {
        title: catTitle,
        description: catDesc,
        canonicalUrl: `${SITE_URL}/categories/${cat.slug}`,
        schemaMarkup,
        bodyHTML: catBodyHTML
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
          ...(tool.websiteUrl ? { 'sameAs': tool.websiteUrl } : {}),
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
              'item': `${SITE_URL}/`
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
              'name': getCategoryDisplayName(tool.categorySlug),
              'item': `${SITE_URL}/categories/${tool.categorySlug || 'software'}`
            },
            {
              '@type': 'ListItem',
              'position': 4,
              'name': tool.name,
              'item': canonicalUrl
            }
          ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': `Is ${tool.name} free to use?`,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': `${tool.name} is available under a ${tool.pricing || 'free'} model. Check the pricing section on this page to view details of the free, trial, and basic subscription pricing tiers.`
              }
            },
            {
              '@type': 'Question',
              'name': 'Which operating systems and environments are supported?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': `You can access ${tool.name} on the following platforms: ${tool.platforms && tool.platforms.length > 0 ? tool.platforms.join(', ') : 'Web'}.`
              }
            }
          ]
        }
      ];

      const toolBodyHTML = `<main class="container section" style="max-width:1000px;margin:0 auto;padding:32px 16px;">
        <nav style="font-size:12px;margin-bottom:16px;color:#64748b;"><a href="/">Home</a> &gt; <a href="/ai-tools">AI Tools</a> &gt; <a href="/categories/${escapeAttribute(tool.categorySlug)}">${escapeAttribute(getCategoryDisplayName(tool.categorySlug))}</a> &gt; <span>${escapeAttribute(tool.name)}</span></nav>
        <header style="display:flex;gap:20px;align-items:center;margin-bottom:24px;">
          <img src="${escapeAttribute(tool.logoUrl)}" alt="${escapeAttribute(tool.name)}" style="width:72px;height:72px;border-radius:12px;object-fit:cover;" />
          <div>
            <h1 style="font-size:2rem;font-weight:bold;margin:0 0 8px 0;">${escapeAttribute(tool.name)}</h1>
            <p style="font-size:1.1rem;color:#475569;margin:0;">${escapeAttribute(tool.tagline)}</p>
          </div>
        </header>
        <section style="margin-bottom:32px;background:#f8fafc;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
          <h2 style="font-size:1.3rem;margin-top:0;">About ${escapeAttribute(tool.name)}</h2>
          <p style="line-height:1.7;color:#334155;">${escapeAttribute(tool.description)}</p>
        </section>
        ${tool.features && tool.features.length > 0 ? `
          <section style="margin-bottom:32px;">
            <h2 style="font-size:1.3rem;">Key Features</h2>
            <ul style="line-height:1.8;color:#334155;">
              ${tool.features.map(f => `<li>${escapeAttribute(f)}</li>`).join('')}
            </ul>
          </section>
        ` : ''}
      </main>`;

      const html = buildPageHTML(templateHTML, {
        title: toolSeoTitle,
        description: toolMetaDescription,
        canonicalUrl,
        ogImage,
        ogType: 'product',
        schemaMarkup,
        bodyHTML: toolBodyHTML
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
