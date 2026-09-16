/* src/utils/toolHelpers.ts */
import type { Tool } from './seedData';

/**
 * Generate a clean, high-resolution SVG data URI badge with the tool's initial letter.
 * Serves as a 100% reliable fallback when image files fail to load or are missing.
 */
export const getLogoFallback = (name: string = 'Tool'): string => {
  const cleanName = (name || 'Tool').trim();
  const initial = (cleanName.charAt(0) || 'A').toUpperCase();
  
  // Palette of curated modern colors based on initial character code
  const bgColors = [
    '#E2603A', // Primary Brand Coral
    '#2563EB', // Royal Blue
    '#7C3AED', // Vivid Violet
    '#059669', // Emerald
    '#DB2777', // Pink
    '#D97706', // Amber
    '#4F46E5', // Indigo
    '#0891B2', // Cyan
    '#C026D3', // Fuchsia
    '#0D9488', // Teal
  ];

  let charCode = 0;
  for (let i = 0; i < cleanName.length; i++) {
    charCode += cleanName.charCodeAt(i);
  }
  const bgColor = bgColors[charCode % bgColors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="${bgColor}"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Validates and retrieves the tool's logo URL or provides a safe SVG fallback.
 */
export const getToolLogoUrl = (tool: any): string => {
  if (!tool) return getLogoFallback('Tool');
  const logo = tool.logoUrl || tool.logo_url;
  if (
    typeof logo === 'string' &&
    logo.trim().length > 0 &&
    logo !== 'undefined' &&
    logo !== 'null' &&
    (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:') || logo.startsWith('/'))
  ) {
    return logo.trim();
  }
  return getLogoFallback(tool.name || 'Tool');
};

/**
 * Handle image onError events to dynamically substitute a broken URL with an SVG fallback badge.
 */
export const handleLogoError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  name: string = 'Tool'
) => {
  const target = e.currentTarget;
  const fallback = getLogoFallback(name);
  if (target.src !== fallback) {
    target.src = fallback;
  }
};

/**
 * Map raw database rows or JSON objects into clean, fully-formed Tool instances.
 * Normalizes snake_case properties from Supabase Postgres into camelCase properties.
 */
export const mapToolRow = (t: any): Tool => {
  if (!t) return {} as Tool;

  const toolName = t.name || 'Untitled Tool';

  return {
    id: String(t.id || ''),
    name: toolName,
    slug: t.slug || toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    tagline: t.tagline || '',
    description: t.description || '',
    categorySlug: t.categorySlug || t.category_slug || '',
    subCategory: t.subCategory || t.sub_category || '',
    pricing: t.pricing || 'free',
    pricingUrl: t.pricingUrl || t.pricing_url || '',
    platforms: Array.isArray(t.platforms) ? t.platforms : [],
    pricingPlans: Array.isArray(t.pricingPlans || t.pricing_plans) ? (t.pricingPlans || t.pricing_plans) : [],
    features: Array.isArray(t.features) ? t.features : [],
    useCases: Array.isArray(t.useCases || t.use_cases) ? (t.useCases || t.use_cases) : [],
    pros: Array.isArray(t.pros) ? t.pros : [],
    cons: Array.isArray(t.cons) ? t.cons : [],
    logoUrl: getToolLogoUrl(t),
    screenshotUrls: Array.isArray(t.screenshotUrls || t.screenshot_urls) ? (t.screenshotUrls || t.screenshot_urls) : [],
    videoUrl: t.videoUrl || t.video_url || '',
    websiteUrl: t.websiteUrl || t.website_url || '',
    rating: Number(t.rating || 0.0),
    reviewCount: Number(t.reviewCount || t.review_count || 0),
    isVerified: Boolean(t.isVerified ?? t.is_verified),
    isFeatured: Boolean(t.isFeatured ?? t.is_featured),
    isSponsored: Boolean(t.isSponsored ?? t.is_sponsored),
    status: t.status || 'approved',
    ownerId: t.ownerId || t.owner_id || null,
    claimStatus: t.claimStatus || t.claim_status || 'unclaimed',
    lastUpdated: t.lastUpdated || t.last_updated || '',
    tags: Array.isArray(t.tags) ? t.tags : [],
    approvedAt: t.approvedAt || t.approved_at || null,
    approvedBy: t.approvedBy || t.approved_by || null,
    adminNotes: t.adminNotes || t.admin_notes || '',
    rejectionReason: t.rejectionReason || t.rejection_reason || '',
    verification_status: t.verification_status || 'unverified',
  };
};
