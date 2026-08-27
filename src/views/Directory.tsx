import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate, useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SidebarFilter } from '../components/layout/SidebarFilter';
import type { FilterState } from '../components/layout/SidebarFilter';
import { ToolCard } from '../components/shared/ToolCard';
import { SEOHead } from '../components/shared/SEOHead';
import { X, Search } from '../components/shared/Icons';
import { supabase } from '../utils/supabase';

interface DirectoryProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  compareList: string[];
  onCompareToggle: (toolId: string) => void;
  onCompareClear: () => void;
}

export const Directory: React.FC<DirectoryProps> = ({
  onToast,
  compareList,
  onCompareToggle,
  onCompareClear,
}) => {
  const { categories, trackEvent } = useDatabase();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { seoSlug } = useParams<{ seoSlug?: string }>();

  // Determine active category or use-case from SEO URLs (e.g. /ai-tools/for-marketing, /ai-tools/coding)
  let urlCategory = '';
  let urlUseCase = '';
  let seoTitleOverride = '';
  let seoDescOverride = '';

  if (seoSlug) {
    if (seoSlug.startsWith('for-')) {
      const ucName = seoSlug.replace('for-', '').replace(/-/g, ' ');
      urlUseCase = ucName;
      seoTitleOverride = `Best AI Tools for ${ucName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
      seoDescOverride = `Discover and compare the best artificial intelligence tools tailored for ${ucName.toLowerCase()}. Read reviews and check pricing plans.`;
    } else {
      const categoryMappings: Record<string, string> = {
        'ai-writing': 'writing',
        'ai-image-generators': 'image-generation',
        'ai-video-generators': 'video',
        'ai-coding-tools': 'coding',
        'ai-marketing-tools': 'marketing',
        'ai-audio-voice': 'audio',
        'writing': 'writing',
        'image-generation': 'image-generation',
        'video': 'video',
        'coding': 'coding',
        'design': 'design',
        'productivity': 'productivity',
        'marketing': 'marketing',
        'audio': 'audio',
        'chatbots': 'chatbots'
      };
      const mappedSlug = categoryMappings[seoSlug.toLowerCase()];
      if (mappedSlug) {
        urlCategory = mappedSlug;
      }
    }
  }

  // 1. Parse filter parameters from search queries
  const qParam = searchParams.get('q') || '';
  const cParam = urlCategory || searchParams.get('category') || '';
  const subParam = searchParams.get('subcategory') || '';
  const pricingParam = searchParams.get('pricing') ? searchParams.get('pricing')!.split(',') : [];
  const platformsParam = searchParams.get('platforms') ? searchParams.get('platforms')!.split(',') : [];
  const ratingParam = Number(searchParams.get('rating') || '0');
  const verifiedParam = searchParams.get('verified') === 'true';
  const openSourceParam = searchParams.get('opensource') === 'true';
  const featuredParam = searchParams.get('featured') === 'true';
  const sortParam = searchParams.get('sort') || 'trending';
  const pageParam = Number(searchParams.get('page') || '1');

  // Load items per page setting
  const itemsPerPage = 9;

  // Active search input state (client-side override before submission)
  const [searchInput, setSearchInput] = useState(qParam);

  // Synchronize local search input with URL search string when URL updates
  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  // Track page view event
  useEffect(() => {
    trackEvent('category_view', undefined, cParam || 'directory');
  }, [cParam]);

  // Build filter state
  const filters: FilterState = {
    category: cParam,
    subCategory: subParam,
    pricing: pricingParam,
    platforms: platformsParam,
    rating: ratingParam,
    verifiedOnly: verifiedParam,
    openSourceOnly: openSourceParam,
    featuredOnly: featuredParam,
  };

  // Load category or use case FAQs
  const activeFaqs = categoryFaqs[seoSlug || cParam || ''] || [];

  // Sync state changes back to search queries (maintains shareable URLs)
  const handleFilterChange = (newFilters: FilterState) => {
    const params: Record<string, string> = {};
    if (qParam) params.q = qParam;
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.subCategory) params.subcategory = newFilters.subCategory;
    if (newFilters.pricing.length > 0) params.pricing = newFilters.pricing.join(',');
    if (newFilters.platforms.length > 0) params.platforms = newFilters.platforms.join(',');
    if (newFilters.rating > 0) params.rating = String(newFilters.rating);
    if (newFilters.verifiedOnly) params.verified = 'true';
    if (newFilters.openSourceOnly) params.opensource = 'true';
    if (newFilters.featuredOnly) params.featured = 'true';
    if (sortParam) params.sort = sortParam;
    params.page = '1'; // Reset to page 1 on filter edits
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = Object.fromEntries(searchParams.entries());
    if (searchInput.trim()) {
      params.q = searchInput.trim();
      trackEvent('search', undefined, undefined, searchInput.trim());
    } else {
      delete params.q;
    }
    params.page = '1';
    setSearchParams(params);
  };

  // Debounce search input typing to update searchParams
  useEffect(() => {
    if (searchInput === qParam) return;

    const timer = setTimeout(() => {
      const params = Object.fromEntries(searchParams.entries());
      if (searchInput.trim()) {
        params.q = searchInput.trim();
        trackEvent('search', undefined, undefined, searchInput.trim());
      } else {
        delete params.q;
      }
      params.page = '1';
      setSearchParams(params);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSortChange = (newSort: string) => {
    const params = Object.fromEntries(searchParams.entries());
    params.sort = newSort;
    params.page = '1';
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. Server-side Query state parameters
  const [paginatedTools, setPaginatedTools] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchTools = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('tools')
          .select('*', { count: 'exact' })
          .eq('status', 'approved');

        // Apply Search Filter across Name, Tagline, Description, category_slug, sub_category, tags
        if (qParam) {
          const q = `%${qParam.trim()}%`;
          query = query.or(
            `name.ilike.${q},tagline.ilike.${q},description.ilike.${q},category_slug.ilike.${q},sub_category.ilike.${q},tags.cs.["${qParam.trim().toLowerCase()}"]`
          );
        }

        // Apply Category
        if (cParam) {
          query = query.eq('category_slug', cParam);
        }

        // Apply Subcategory
        if (subParam) {
          query = query.eq('sub_category', subParam);
        }

        // Apply Pricing
        if (pricingParam.length > 0) {
          query = query.in('pricing', pricingParam);
        }

        // Apply Use Case Filter from SEO slugs
        if (urlUseCase) {
          query = query.filter('use_cases', 'cs', `["${urlUseCase}"]`);
        }

        // Apply Platform
        if (platformsParam.length > 0) {
          platformsParam.forEach((plat) => {
            query = query.filter('platforms', 'cs', `["${plat}"]`);
          });
        }

        // Apply Rating Threshold
        if (ratingParam > 0) {
          query = query.gte('rating', ratingParam);
        }

        // Apply Verified Filter
        if (verifiedParam) {
          query = query.eq('is_verified', true);
        }

        // Apply Open Source Filter
        if (openSourceParam) {
          query = query.or('tags.cs.["open-source"],description.ilike.%open source%,description.ilike.%open-source%');
        }

        // Apply Gold Vetted Filter
        if (featuredParam) {
          query = query.or('is_featured.eq.true,is_sponsored.eq.true');
        }

        // Priority sorting (sponsored first, then sort criteria)
        query = query.order('is_sponsored', { ascending: false });

        if (sortParam === 'most-popular') {
          query = query.order('review_count', { ascending: false });
        } else if (sortParam === 'highest-rated') {
          query = query.order('rating', { ascending: false });
        } else if (sortParam === 'newest') {
          query = query.order('approved_at', { ascending: false, nullsFirst: false });
        } else if (sortParam === 'recently-updated') {
          query = query.order('last_updated', { ascending: false });
        } else if (sortParam === 'a-z') {
          query = query.order('name', { ascending: true });
        } else if (sortParam === 'free') {
          query = query.order('pricing', { ascending: true });
        } else if (sortParam === 'most-viewed') {
          query = query.order('views_count', { ascending: false, nullsFirst: false });
        } else if (sortParam === 'most-clicked') {
          query = query.order('clicks_count', { ascending: false, nullsFirst: false });
        } else {
          // Default trending matches rating first, then review count
          query = query.order('rating', { ascending: false }).order('review_count', { ascending: false });
        }

        // Apply Server-Side Range limits
        const from = (pageParam - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        if (active) {
          setPaginatedTools(data || []);
          setTotalItems(count || 0);
        }
      } catch (err: any) {
        console.error('Error fetching Supabase tools:', err.message);

        // Fallback retry block if views_count/clicks_count do not exist in schema yet
        if (
          err.message.includes('views_count') ||
          err.message.includes('clicks_count') ||
          err.message.includes('column') ||
          err.message.includes('does not exist')
        ) {
          try {
            let fbQuery = supabase
              .from('tools')
              .select('*', { count: 'exact' })
              .eq('status', 'approved');

            if (qParam) {
              const q = `%${qParam.trim()}%`;
              fbQuery = fbQuery.or(
                `name.ilike.${q},tagline.ilike.${q},description.ilike.${q},category_slug.ilike.${q},sub_category.ilike.${q},tags.cs.["${qParam.trim().toLowerCase()}"]`
              );
            }
            if (cParam) fbQuery = fbQuery.eq('category_slug', cParam);
            if (subParam) fbQuery = fbQuery.eq('sub_category', subParam);
            
            if (urlUseCase) {
              fbQuery = fbQuery.filter('use_cases', 'cs', `["${urlUseCase}"]`);
            }

            if (pricingParam.length > 0) fbQuery = fbQuery.in('pricing', pricingParam);
            if (platformsParam.length > 0) {
              platformsParam.forEach((p) => {
                fbQuery = fbQuery.filter('platforms', 'cs', `["${p}"]`);
              });
            }
            if (ratingParam > 0) fbQuery = fbQuery.gte('rating', ratingParam);
            if (verifiedParam) fbQuery = fbQuery.eq('is_verified', true);
            if (openSourceParam) fbQuery = fbQuery.or('tags.cs.["open-source"],description.ilike.%open source%,description.ilike.%open-source%');
            if (featuredParam) fbQuery = fbQuery.or('is_featured.eq.true,is_sponsored.eq.true');

            fbQuery = fbQuery.order('is_sponsored', { ascending: false }).order('review_count', { ascending: false });

            const from = (pageParam - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;
            fbQuery = fbQuery.range(from, to);

            const { data: fbData, count: fbCount } = await fbQuery;
            if (active) {
              setPaginatedTools(fbData || []);
              setTotalItems(fbCount || 0);
            }
          } catch (_) {}
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchTools();

    return () => {
      active = false;
    };
  }, [
    qParam,
    cParam,
    subParam,
    pricingParam.join(','),
    platformsParam.join(','),
    ratingParam,
    verifiedParam,
    openSourceParam,
    featuredParam,
    sortParam,
    pageParam,
    seoSlug,
    urlUseCase,
  ]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Track search impressions on current page view
  useEffect(() => {
    if (paginatedTools.length > 0) {
      paginatedTools.forEach((tool) => {
        const impressionKey = `imp_${tool.id}_${qParam || 'organic'}`;
        if (!(window as any)[impressionKey]) {
          (window as any)[impressionKey] = true;
          trackEvent('search_impression', tool.id);
        }
      });
    }
  }, [paginatedTools.map((t) => t.id).join(','), qParam]);

  // Dynamic Page Title descriptions
  const currentCategory = categories.find((c) => c.slug === filters.category);
  const pageTitle = seoTitleOverride ? seoTitleOverride : currentCategory ? `Best AI ${currentCategory.name} Tools` : 'AI Tools Directory';
  const pageDescription = seoDescOverride
    ? seoDescOverride
    : currentCategory
      ? `Discover the best artificial intelligence tools for ${currentCategory.name.toLowerCase()}. Review features, compare pricing plans, and choose the right AI tool.`
      : 'Browse, filter, and search the largest index of AI tools. Compare features, pricing, platforms, reviews, and start using them.';
  
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://aifynest.com';
  const canonicalUrl = seoSlug ? `${siteUrl}/ai-tools/${seoSlug}` : `${siteUrl}/ai-tools`;

  const handleRemoveFilterChip = (key: keyof FilterState, value?: string) => {
    const updated = { ...filters };
    if (key === 'category') {
      updated.category = '';
      updated.subCategory = '';
    } else if (key === 'subCategory') {
      updated.subCategory = '';
    } else if (key === 'pricing') {
      updated.pricing = updated.pricing.filter((p) => p !== value);
    } else if (key === 'platforms') {
      updated.platforms = updated.platforms.filter((p) => p !== value);
    } else if (key === 'rating') {
      updated.rating = 0;
    } else if (key === 'verifiedOnly') {
      updated.verifiedOnly = false;
    } else if (key === 'openSourceOnly') {
      updated.openSourceOnly = false;
    } else if (key === 'featuredOnly') {
      updated.featuredOnly = false;
    }
    handleFilterChange(updated);
  };

  const hasActiveFilters =
    filters.category ||
    filters.subCategory ||
    filters.pricing.length > 0 ||
    filters.platforms.length > 0 ||
    filters.rating > 0 ||
    filters.verifiedOnly ||
    filters.openSourceOnly ||
    filters.featuredOnly;

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (pageParam > 3) pageNumbers.push('...');
      const start = Math.max(2, pageParam - 1);
      const end = Math.min(totalPages - 1, pageParam + 1);
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      if (pageParam < totalPages - 2) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const activeSlug = filters.category || seoSlug;

  const directorySchemaMarkup = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': pageTitle,
      'description': pageDescription,
      'numberOfItems': paginatedTools.length,
      'itemListElement': paginatedTools.slice(0, 10).map((t, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'url': `${siteUrl}/tools/${t.slug}`,
        'name': t.name
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': siteUrl
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'AI Tools',
          'item': `${siteUrl}/ai-tools`
        },
        ...(activeSlug ? [{
          '@type': 'ListItem',
          'position': 3,
          'name': activeSlug.toUpperCase(),
          'item': `${siteUrl}/ai-tools/${activeSlug}`
        }] : [])
      ]
    },
    ...(activeFaqs && activeFaqs.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': activeFaqs.map(faq => ({
        '@type': 'Question',
        'name': faq.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.a
        }
      }))
    }] : [])
  ];

  return (
    <div style={{ position: 'relative', backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '32px 0 80px 0' }}>
      <SEOHead title={pageTitle} description={pageDescription} canonicalUrl={canonicalUrl} schemaMarkup={directorySchemaMarkup as any} />

      <div className="directory-container-box">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Breadcrumbs */}
          <div 
            style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em', 
              display: 'flex', 
              gap: '6px',
              alignItems: 'center'
            }}
          >
            <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', transition: 'color 0.2s' }}>Home</Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-muted)' }}>Discover</span>
            {currentCategory && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text-secondary)' }}>{currentCategory.name}</span>
              </>
            )}
          </div>

          {/* Clean Header Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 
                style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '2.2rem', 
                  fontWeight: 800, 
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)'
                }}
              >
                {pageTitle}
              </h1>
              <p 
                style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: 'var(--text-sm)', 
                  margin: 0, 
                  maxWidth: '750px', 
                  lineHeight: '1.5' 
                }}
              >
                {pageDescription}
              </p>
            </div>

            {/* Simple Boxed Info Badge */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-primary)',
                padding: '12px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                minWidth: '180px'
              }}
            >
              <span>📊 <strong>{categories.length}</strong> Categories</span>
              <span>⚡ Updated <strong>Daily</strong></span>
              <span>🛡️ <strong>100%</strong> Verified Listings</span>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

          {/* Directory Navigation Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '14px 20px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Toolbar Search Box */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px', width: '100%', maxWidth: '340px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search matching tools..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  padding: '10px 16px 10px 42px',
                  fontSize: 'var(--text-xs)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  width: '100%',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                className="search-input-glow"
              />
              <Search size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </form>

            {/* Toolbar Sort Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--text-sm)', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: '500' }}>
                Found <strong>{totalItems}</strong> matching tools
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Sort by:</span>
                <select
                  value={sortParam}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  className="sort-select-premium"
                >
                  <option value="trending">🔥 Trending Weight</option>
                  <option value="most-popular">💬 Most Popular Reviews</option>
                  <option value="highest-rated">⭐ Highest Ratings</option>
                  <option value="newest">📅 Newest Launch</option>
                  <option value="free">🆓 Free Tiers First</option>
                  <option value="a-z">🔤 Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Filter Chips Bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginRight: '4px', fontWeight: 'bold' }}>Quick Filters:</span>
            
            <button
              onClick={() => handleFilterChange({ ...filters, featuredOnly: !filters.featuredOnly })}
              className="chip-filter-premium"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: filters.featuredOnly ? 'var(--color-gold-light)' : 'var(--bg-card)',
                color: filters.featuredOnly ? 'var(--color-gold)' : 'var(--text-secondary)',
                borderColor: filters.featuredOnly ? 'var(--color-gold)' : 'var(--border-color)',
                transition: 'all 0.2s',
              }}
            >
              <span>★ Gold Vetted</span>
            </button>

            <button
              onClick={() => handleFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
              className="chip-filter-premium"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: filters.verifiedOnly ? 'var(--color-success-light)' : 'var(--bg-card)',
                color: filters.verifiedOnly ? 'var(--color-success)' : 'var(--text-secondary)',
                borderColor: filters.verifiedOnly ? 'var(--color-success)' : 'var(--border-color)',
                transition: 'all 0.2s',
              }}
            >
              <span>✓ Verified</span>
            </button>

            {(['free', 'freemium', 'free-trial', 'paid'] as const).map((model) => {
              const isActive = filters.pricing.includes(model);
              const label = model === 'free' ? '🆓 100% Free' : model === 'freemium' ? '🎁 Freemium' : model === 'free-trial' ? '⏳ Free Trial' : '💰 Paid';
              
              const handleToggleModel = () => {
                let updatedPricing = [...filters.pricing];
                if (isActive) {
                  updatedPricing = updatedPricing.filter((p) => p !== model);
                } else {
                  updatedPricing.push(model);
                }
                handleFilterChange({ ...filters, pricing: updatedPricing });
              };

              return (
                <button
                  key={model}
                  onClick={handleToggleModel}
                  className="chip-filter-premium"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--bg-card)',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active filter chips listing */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '-12px' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Active filters:</span>
              {filters.category && (
                <span className="badge badge-pricing" style={chipStyle}>
                  Category: {categories.find((c) => c.slug === filters.category)?.name}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('category')} />
                </span>
              )}
              {filters.subCategory && (
                <span className="badge badge-pricing" style={chipStyle}>
                  Subcategory: {filters.subCategory}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('subCategory')} />
                </span>
              )}
              {filters.pricing.map((p) => (
                <span key={p} className="badge badge-pricing" style={chipStyle}>
                  Pricing: {p}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('pricing', p)} />
                </span>
              ))}
              {filters.platforms.map((plat) => (
                <span key={plat} className="badge badge-pricing" style={chipStyle}>
                  Platform: {plat}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('platforms', plat)} />
                </span>
              ))}
              {filters.rating > 0 && (
                <span className="badge badge-pricing" style={chipStyle}>
                  Rating: ★{filters.rating}+
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('rating')} />
                </span>
              )}
              {filters.verifiedOnly && (
                <span className="badge badge-pricing" style={chipStyle}>
                  Verified Only
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('verifiedOnly')} />
                </span>
              )}
              {filters.openSourceOnly && (
                <span className="badge badge-pricing" style={chipStyle}>
                  Open Source
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('openSourceOnly')} />
                </span>
              )}
              {filters.featuredOnly && (
                <span className="badge badge-pricing" style={chipStyle}>
                  Gold Vetted
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveFilterChip('featuredOnly')} />
                </span>
              )}
            </div>
          )}

          {/* Content Layout Grid (Sidebar + List) */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px' }} className="directory-layout">
            {/* Left Filter Sidebar */}
            <div className="directory-sidebar">
              <SidebarFilter categories={categories} filters={filters} onChange={handleFilterChange} />
            </div>

            {/* Right Tools Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '80px 0', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Querying AI database...</span>
                </div>
              ) : paginatedTools.length > 0 ? (
                <>
                  <div className="directory-tools-grid">
                    {paginatedTools.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onToast={onToast}
                        isCompareChecked={compareList.includes(tool.id)}
                        onCompareToggle={() => onCompareToggle(tool.id)}
                      />
                    ))}
                  </div>

                  {/* Navigation Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifySelf: 'center', gap: '8px', marginTop: '24px' }}>
                      <button
                        onClick={() => handlePageChange(pageParam - 1)}
                        disabled={pageParam === 1}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)' }}
                      >
                        &lt; Previous
                      </button>
                      {getPageNumbers().map((pageVal, idx) => {
                        if (pageVal === '...') {
                          return (
                            <span 
                              key={`dots-${idx}`} 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                minWidth: '36px', 
                                color: 'var(--text-muted)',
                                fontSize: 'var(--text-sm)' 
                              }}
                            >
                              ...
                            </span>
                          );
                        }
                        const pageIdx = pageVal as number;
                        return (
                          <button
                            key={pageIdx}
                            onClick={() => handlePageChange(pageIdx)}
                            className={`btn btn-sm ${pageParam === pageIdx ? 'btn-primary' : 'btn-outline'}`}
                            style={{ minWidth: '36px', padding: '8px', borderRadius: 'var(--radius-md)' }}
                          >
                            {pageIdx}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(pageParam + 1)}
                        disabled={pageParam === totalPages}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)' }}
                      >
                        Next &gt;
                      </button>
                    </div>
                  )}

                  {/* Category/Use-case FAQs Accordion */}
                  {activeFaqs && activeFaqs.length > 0 && (
                    <div style={{ marginTop: '48px', borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
                      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '16px', color: 'var(--text-primary)' }}>
                        Frequently Asked Questions
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activeFaqs.map((faq, idx) => (
                          <details key={idx} className="faq-details-premium">
                            <summary className="faq-summary-premium">{faq.q}</summary>
                            <p className="faq-body-premium">{faq.a}</p>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '80px 40px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '8px' }}>
                    No matching tools found
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                    We couldn't find any approved AI tools matching your specific search query or active filter criteria.
                  </p>
                  <button
                    onClick={() => handleFilterChange({
                      category: '',
                      subCategory: '',
                      pricing: [],
                      platforms: [],
                      rating: 0,
                      verifiedOnly: false,
                      openSourceOnly: false,
                      featuredOnly: false,
                    })}
                    className="btn btn-primary"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Compare Notification Bar */}
      {compareList.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-card)',
            border: '2px solid var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-xl)',
            padding: '8px 24px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            whiteSpace: 'nowrap',
            animation: 'slide-up-compare 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>
            Selected to Compare: {compareList.length} / 3 tools
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCompareClear}
              className="btn btn-outline btn-sm"
              style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px' }}
            >
              Clear
            </button>
            <button
              onClick={() => navigate('/compare')}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 'var(--radius-full)', padding: '4px 16px' }}
            >
              Compare Now
            </button>
          </div>
        </div>
      )}

      {/* CSS Styles injection for interactive scaling and glows */}
      <style>{`
        .directory-container-box {
          max-width: 1240px;
          width: calc(100% - 32px);
          margin: 0 auto;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 40px;
          box-shadow: var(--shadow-sm);
          box-sizing: border-box;
        }

        .directory-tools-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
        }

        @media (max-width: 600px) {
          .directory-tools-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 1200px) {
          .directory-container-box {
            padding: 24px !important;
          }
        }

        @media (max-width: 900px) {
          .directory-layout {
            grid-template-columns: 1fr !important;
          }
          .directory-sidebar {
            display: none !important;
          }
        }

        .search-input-glow:focus {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.15) !important;
        }

        .sort-select-premium:hover {
          border-color: var(--color-primary) !important;
        }

        .chip-filter-premium {
          transition: all 0.2s ease-in-out;
        }

        .chip-filter-premium:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-color: var(--color-primary) !important;
        }

        .faq-details-premium {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
          padding: 12px 16px;
        }
        .faq-summary-premium {
          font-weight: var(--font-semibold);
          font-size: var(--text-sm);
          color: var(--text-primary);
          cursor: pointer;
          outline: none;
        }
        .faq-body-premium {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          margin-top: 8px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  fontSize: '11px',
  cursor: 'default',
};

const categoryFaqs: Record<string, { q: string; a: string }[]> = {
  'coding': [
    { q: 'What are AI coding assistants?', a: 'AI coding assistants are tools powered by machine learning models that help developers write, debug, document, and test software code faster.' },
    { q: 'Are AI code generators safe to use for commercial projects?', a: 'Most AI code generators are safe, but it is recommended to review their licensing policies and run security scans on generated code before shipping to production.' }
  ],
  'ai-coding-tools': [
    { q: 'What are AI coding assistants?', a: 'AI coding assistants are tools powered by machine learning models that help developers write, debug, document, and test software code faster.' },
    { q: 'Are AI code generators safe to use for commercial projects?', a: 'Most AI code generators are safe, but it is recommended to review their licensing policies and run security scans on generated code before shipping to production.' }
  ],
  'image-generation': [
    { q: 'How do AI image generators work?', a: 'AI image generators use diffusion models trained on vast image datasets to synthesize novel graphics, art, and photorealistic images from textual prompts.' },
    { q: 'Can I use AI-generated images commercially?', a: 'This depends on the tool. Popular systems like Midjourney and DALL-E allow commercial usage, but you should verify their terms of service.' }
  ],
  'ai-image-generators': [
    { q: 'How do AI image generators work?', a: 'AI image generators use diffusion models trained on vast image datasets to synthesize novel graphics, art, and photorealistic images from textual prompts.' },
    { q: 'Can I use AI-generated images commercially?', a: 'This depends on the tool. Popular systems like Midjourney and DALL-E allow commercial usage, but you should verify their terms of service.' }
  ],
  'video': [
    { q: 'Can I generate a full video with AI?', a: 'Yes! Modern AI text-to-video generators can synthesize short cinematic clips, avatars, and animations. You can combine multiple clips to construct longer video narratives.' }
  ],
  'ai-video-generators': [
    { q: 'Can I generate a full video with AI?', a: 'Yes! Modern AI text-to-video generators can synthesize short cinematic clips, avatars, and animations. You can combine multiple clips to construct longer video narratives.' }
  ],
  'for-marketing': [
    { q: 'How does AI help in digital marketing?', a: 'AI assists digital marketers with copywriting, ad generation, customer segmentation, SEO content analysis, and predictive marketing metrics.' }
  ],
  'for-developers': [
    { q: 'What AI tools are best for developers?', a: 'Developers benefit most from AI coding assistants, automated code review tools, documentation generators, and API integrations.' }
  ],
  'for-students': [
    { q: 'How can students use AI ethically?', a: 'Students can use AI tools to outline research, tutor complex topics, brainstorm essay ideas, and debug code, while ensuring they do not copy-paste generated solutions directly as final coursework submissions.' }
  ],
  'for-content-creators': [
    { q: 'What tools are recommended for content creators?', a: 'Content creators benefit from voice cloning tools, automated video editors, image generation art engines, and social media post copywriters.' }
  ],
  'for-small-business': [
    { q: 'How can small businesses adopt AI?', a: 'Small businesses use AI chatbots for 24/7 customer service, automated invoice calculators, copywriting generators for email outreach, and graphic generators for advertisements.' }
  ]
};
