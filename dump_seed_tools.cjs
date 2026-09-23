const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
const code = fs.readFileSync(seedPath, 'utf8');
const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const m = { exports: {} };
const fn = new Function('module', 'exports', 'require', js);
fn(m, m.exports, require);
const seedTools = m.exports.initialTools || [];

console.log(JSON.stringify(seedTools.map(t => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
  categorySlug: t.categorySlug,
  subCategory: t.subCategory,
  tagline: t.tagline,
  pricing: t.pricing,
  features: t.features,
  useCases: t.useCases,
  words: (t.description || '').trim().split(/\s+/).filter(Boolean).length
})), null, 2));
