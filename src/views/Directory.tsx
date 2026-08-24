/* src/views/Directory.tsx */
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SidebarFilter } from '../components/layout/SidebarFilter';
import type { FilterState } from '../components/layout/SidebarFilter';
import { ToolCard } from '../components/shared/ToolCard';
import { SEOHead } from '../components/shared/SEOHead';
import { calculateTrendingScores } from '../utils/trendingAlgorithm';
import { X, Search } from '../components/shared/Icons';

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
  const { tools, categories, reviews, analyticsEvents, trackEvent } = useDatabase();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Parse filter parameters from search queries
  const qParam = searchParams.get('q') || '';
  const cParam = searchParams.get('category') || '';
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

  // 2. Filter listings logic
  let filteredTools = tools.filter((tool) => {
    // Only show approved tools organically
    if (tool.status !== 'approved') return false;

    // Search query matches
    if (qParam) {
      const q = qParam.toLowerCase();
      const matchesName = tool.name.toLowerCase().includes(q);
      const matchesTagline = tool.tagline.toLowerCase().includes(q);
      const matchesDesc = tool.description.toLowerCase().includes(q);
      const matchesCategory = tool.categorySlug.toLowerCase().includes(q);
      const matchesSubcat = tool.subCategory.toLowerCase().includes(q);
      const matchesTags = tool.tags.some((t) => t.toLowerCase().includes(q));
      const matchesFeatures = tool.features.some((f) => f.toLowerCase().includes(q));
      
      if (!matchesName && !matchesTagline && !matchesDesc && !matchesCategory && !matchesSubcat && !matchesTags && !matchesFeatures) {
        return false;
      }
    }

    // Category matches
    if (filters.category && tool.categorySlug !== filters.category) return false;

    // Subcategory matches
    if (filters.subCategory && tool.subCategory !== filters.subCategory) return false;

    // Pricing models matches
    if (filters.pricing.length > 0 && !filters.pricing.includes(tool.pricing)) return false;

    // Platforms matches
    if (filters.platforms.length > 0 && !filters.platforms.some((p) => tool.platforms.includes(p as any))) return false;

    // Ratings threshold matches
    if (filters.rating > 0 && tool.rating < filters.rating) return false;

    // Verified matches
    if (filters.verifiedOnly && !tool.isVerified) return false;

    // Featured matches
    if (filters.featuredOnly && !tool.isFeatured && !tool.isSponsored) return false;

    // Open Source matches (checked via tags/description in mock)
    if (filters.openSourceOnly && !tool.tags.includes('open-source') && !tool.description.toLowerCase().includes('open source') && !tool.description.toLowerCase().includes('open-source')) {
      return false;
    }

    return true;
  });

  // Track zero-results search clicks
  useEffect(() => {
    if (qParam && filteredTools.length === 0) {
      trackEvent('search', undefined, undefined, `ZERO_RESULTS:${qParam}`);
    }
  }, [qParam, filteredTools.length]);

  // 3. Sorting listings logic
  const trendingScores = calculateTrendingScores(tools, analyticsEvents, reviews);

  filteredTools.sort((a, b) => {
    // Sponsored listings always prioritize on top of organic (but strictly marked)
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;

    switch (sortParam) {
      case 'most-popular':
        return b.reviewCount - a.reviewCount;
      case 'highest-rated':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'a-z':
        return a.name.localeCompare(b.name);
      case 'free':
        const isFreeA = a.pricing === 'free' ? 1 : 0;
        const isFreeB = b.pricing === 'free' ? 1 : 0;
        return isFreeB - isFreeA;
      case 'trending':
      default:
        const scoreA = trendingScores.find((s) => s.toolId === a.id)?.score || 0;
        const scoreB = trendingScores.find((s) => s.toolId === b.id)?.score || 0;
        return scoreB - scoreA;
    }
  });

  // 4. Pagination slices
  const totalItems = filteredTools.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (pageParam - 1) * itemsPerPage;
  const paginatedTools = filteredTools.slice(startIdx, startIdx + itemsPerPage);

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
  const pageTitle = currentCategory ? `Best AI ${currentCategory.name} Tools` : 'AI Tools Directory';
  const pageDescription = currentCategory
    ? `Discover the best artificial intelligence tools for ${currentCategory.name.toLowerCase()}. Review features, compare pricing plans, and choose the right AI tool.`
    : 'Browse, filter, and search the largest index of AI tools. Compare features, pricing, platforms, reviews, and start using them.';

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
    } else if (key === 'verifiedOnly' || key === 'openSourceOnly' || key === 'featuredOnly') {
      updated[key] = false;
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

  return (
    <div style={{ position: 'relative', backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '32px 0 80px 0' }}>
      <SEOHead title={pageTitle} description={pageDescription} />

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
              {paginatedTools.length > 0 ? (
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
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageIdx = idx + 1;
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
