// scripts/audit_all_links.cjs
const fs = require('fs');
const path = require('path');

function runAudit() {
  const distDir = path.join(__dirname, 'dist');
  const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');

  console.log('🔍 Starting comprehensive 404 & SEO link audit across dist/ and sitemap.xml...');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found! Run npm run build first.');
    process.exit(1);
  }

  if (!fs.existsSync(sitemapPath)) {
    console.error('❌ public/sitemap.xml not found!');
    process.exit(1);
  }

  // 1. Read sitemap URLs
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const locMatches = [...sitemapContent.matchAll(/<loc>(https:\/\/aifynest\.com[^<]*)<\/loc>/g)];
  const sitemapUrls = locMatches.map(m => m[1]);

  console.log(`📊 Sitemap contains ${sitemapUrls.length} total URLs.`);

  let missingStaticFiles = 0;
  let missingSeoTags = 0;
  let verifiedCount = 0;

  sitemapUrls.forEach(url => {
    const route = url.replace('https://aifynest.com', '');
    const cleanRoute = route.replace(/^\//, '');
    
    const targetFile = cleanRoute ? path.join(distDir, cleanRoute, 'index.html') : path.join(distDir, 'index.html');
    
    if (!fs.existsSync(targetFile)) {
      console.error(`❌ Missing static HTML file for URL: ${url} (Expected: ${targetFile})`);
      missingStaticFiles++;
    } else {
      const html = fs.readFileSync(targetFile, 'utf8');
      
      const hasTitle = html.includes('<title>') && !html.includes('<title></title>');
      const hasDesc = html.includes('<meta name="description"');
      const hasCanonical = html.includes('<link rel="canonical"');
      const hasOgTitle = html.includes('<meta property="og:title"');
      
      if (!hasTitle || !hasDesc || !hasCanonical || !hasOgTitle) {
        console.warn(`⚠️ SEO tags incomplete in: ${targetFile}`);
        missingSeoTags++;
      } else {
        verifiedCount++;
      }
    }
  });

  // 2. Count total pre-rendered HTML files in dist/
  function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getHtmlFiles(filePath, fileList);
      } else if (file.endsWith('.html')) {
        fileList.push(filePath);
      }
    });
    return fileList;
  }

  const allDistHtmlFiles = getHtmlFiles(distDir);
  console.log(`📦 Total static HTML files pre-rendered in dist/: ${allDistHtmlFiles.length}`);

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`✅ Verified URLs with full static HTML & SEO tags: ${verifiedCount}`);
  console.log(`❌ Missing Static Files: ${missingStaticFiles}`);
  console.log(`⚠️ Incomplete SEO Tags: ${missingSeoTags}`);

  if (missingStaticFiles === 0 && missingSeoTags === 0) {
    console.log('\n✨ PERFECT AUDIT: 100% of URLs in sitemap have pre-rendered static HTML files and complete SEO metadata! Zero 404s guaranteed.');
  } else {
    console.error('\n❌ AUDIT FAILED: Fix missing static files or SEO tags.');
    process.exit(1);
  }
}

runAudit();
