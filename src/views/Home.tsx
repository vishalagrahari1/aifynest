/* src/views/Home.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../utils/supabase';

import { ToolCard } from '../components/shared/ToolCard';
import { SEOHead } from '../components/shared/SEOHead';
import { Search, Sparkles, ArrowRight, CategoryIcon, ChevronLeft, ChevronRight } from '../components/shared/Icons';

interface HomeProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Home: React.FC<HomeProps> = ({ onToast }) => {
  const { tools, categories, collections, blogPosts, trackEvent, getTrendingTools } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // FAQ Accordion toggles
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [featuredTab, setFeaturedTab] = useState<'all' | 'top' | 'new' | 'free'>('all');
  const [trendingTab, setTrendingTab] = useState<'today' | 'week' | 'month'>('week');

  const sponsoredContainerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const isCategoryHoveredRef = useRef(false);

  // Auto-slide effect for category row
  useEffect(() => {
    const el = categoryContainerRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isCategoryHoveredRef.current) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      let nextScroll = el.scrollLeft + 260; // Card width + gap
      if (nextScroll >= maxScroll - 10) {
        nextScroll = 0;
      }

      el.scrollTo({
        left: nextScroll,
        behavior: 'smooth'
      });
    }, 3500); // Slide every 3.5 seconds

    return () => clearInterval(interval);
  }, [categories]);

  // Scroll Category Left & Right manually
  const scrollCategoryLeft = () => {
    if (categoryContainerRef.current) {
      categoryContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollCategoryRight = () => {
    if (categoryContainerRef.current) {
      const el = categoryContainerRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }
  };

  // Auto-slide effect for sponsored carousel
  useEffect(() => {
    const el = sponsoredContainerRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isHoveredRef.current) return;
      
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      
      let nextScroll = el.scrollLeft + 310; // card width + gap
      if (nextScroll >= maxScroll + 10) {
        nextScroll = 0;
      }
      
      el.scrollTo({
        left: nextScroll,
        behavior: 'smooth'
      });
    }, 4000); // Slide every 4 seconds

    return () => clearInterval(interval);
  }, [tools]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does AIFynest curate and review submitted AI tools?',
      a: 'Every submission is reviewed by our administration editors. We verify the destination URL, product capabilities, pricing plans accuracy, and ensure it meets our guidelines before publishing it to the public directory.'
    },
    {
      q: 'How can I claim my AI tool listing?',
      a: 'Simply navigate to the tool detail page, click "Claim this listing" link, and fill out the claim form. Our team will verify your ownership email (usually matching the tool domain) within 24-48 hours.'
    },
    {
      q: 'Does AIFynest charge any commission on affiliate referral clicks?',
      a: 'We do not charge owners for referral clicks. Outbound clicks are tracked to calculate CPC metrics for builder analytics. If you join our sponsor network, we charge flat advertising placements campaign budgets.'
    },
    {
      q: 'Can standard users write reviews and rank tools?',
      a: 'Yes, any registered user can write ratings and pros/cons feedback on published tools. All reviews are curated by editors to eliminate fake feedback, keeping AIFynest trustworthy and transparent.'
    }
  ];


  // Track home view on mount
  useEffect(() => {
    trackEvent('category_view', undefined, 'homepage');
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search query suggestion loading from Supabase
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = searchQuery.trim();
        
        // Fetch categories matching the query
        const matchedCategories = categories
          .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
          .map(c => c.name);

        // Fetch matching tool records (capped at 10 items for performance)
        const { data: matchedToolsData } = await supabase
          .from('tools')
          .select('name, sub_category, tags, use_cases')
          .eq('status', 'approved')
          .or(`name.ilike.%${query}%,tagline.ilike.%${query}%,sub_category.ilike.%${query}%`)
          .limit(10);

        const toolNames = matchedToolsData?.map(t => t.name) || [];
        const subCategories = matchedToolsData?.map(t => t.sub_category).filter(Boolean) || [];
        
        // Extract matching tags and use cases
        const matchingTags: string[] = [];
        const matchingUseCases: string[] = [];
        matchedToolsData?.forEach(t => {
          if (Array.isArray(t.tags)) {
            t.tags.forEach((tag: string) => {
              if (tag.toLowerCase().includes(query.toLowerCase()) && !matchingTags.includes(tag)) {
                matchingTags.push(tag);
              }
            });
          }
          if (Array.isArray(t.use_cases)) {
            t.use_cases.forEach((uc: string) => {
              if (uc.toLowerCase().includes(query.toLowerCase()) && !matchingUseCases.includes(uc)) {
                matchingUseCases.push(uc);
              }
            });
          }
        });

        // Combine suggestions and remove duplicates
        const combined = Array.from(new Set([
          ...toolNames,
          ...matchedCategories,
          ...subCategories,
          ...matchingTags.map(t => `#${t}`),
          ...matchingUseCases
        ])).slice(0, 8);

        setSuggestions(combined);
        setShowSuggestions(combined.length > 0);
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, categories]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackEvent('search', undefined, undefined, searchQuery);
      navigate(`/ai-tools?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (keyword: string) => {
    setSearchQuery(keyword);
    setShowSuggestions(false);
    trackEvent('search', undefined, undefined, keyword);
    navigate(`/ai-tools?q=${encodeURIComponent(keyword)}`);
  };

  // Get tools count per category slug
  const getToolCount = (catSlug: string) => {
    return tools.filter((t) => t.categorySlug === catSlug && t.status === 'approved').length;
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <SEOHead
        title="AIFynest — Discover the Best AI Tools in One Place"
        description="Search, filter, compare, save, and review the best artificial intelligence tools. Find the right AI for your workflow on AIFynest."
        schemaMarkup={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': 'AIFynest',
          'url': 'https://aifynest.com/',
          'potentialAction': {
            '@type': 'SearchAction',
            'target': 'https://ai-hub-directory.com/ai-tools?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />

      {/* Hero Glowing background effect */}
      <div className="hero-glow" style={{ top: '-100px', left: '5%' }}></div>
      <div className="hero-glow" style={{ top: '150px', right: '5%', background: 'radial-gradient(circle, rgba(226, 96, 58, 0.05) 0%, rgba(226, 96, 58, 0.01) 60%, rgba(0, 0, 0, 0) 100%)' }}></div>

      {/* Hero Search Section - Simple & Compact */}
      <section
        style={{
          background: 'var(--gradient-hero)',
          padding: '44px 0 36px 0',
          borderBottom: '1px solid var(--border-color)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="container" style={{ maxWidth: '780px' }}>
          {/* Enhanced Premium Trust Signal Badge */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid rgba(226, 96, 58, 0.25)', 
              borderRadius: 'var(--radius-full)', 
              padding: '6px 16px', 
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(226, 96, 58, 0.08)',
              transition: 'all 0.25s ease',
              cursor: 'default',
              maxWidth: '100%',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
            className="hero-trust-badge"
          >
            {/* Overlapping User Avatars Stack */}
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-2px' }}>
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=faces" 
                alt="Creator avatar" 
                style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--bg-card)', objectFit: 'cover' }} 
              />
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=faces" 
                alt="Developer avatar" 
                style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--bg-card)', objectFit: 'cover', marginLeft: '-8px' }} 
              />
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=faces" 
                alt="Founder avatar" 
                style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--bg-card)', objectFit: 'cover', marginLeft: '-8px' }} 
              />
            </div>

            {/* Stars rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontSize: '11px' }}>
              <span>★★★★★</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginLeft: '2px' }}>4.9/5</span>
            </div>

            <span style={{ color: 'var(--border-color)', fontSize: '12px' }} className="badge-divider">|</span>

            {/* Trust text */}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>Trusted by</span>
              <strong style={{ color: '#E2603A', fontWeight: 800 }}>50,000+</strong>
              <span>monthly visitors, creators & developers</span>
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
              lineHeight: '1.15',
              fontWeight: 'var(--font-bold)',
              letterSpacing: '-0.02em',
              marginBottom: '10px',
              color: 'var(--text-primary)',
            }}
          >
            Discover the Best <span style={{ color: '#E2603A' }}>AI Tools</span>
          </h1>

          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              margin: '0 auto 20px auto',
              lineHeight: '1.5',
            }}
          >
            Explore, compare, and review <strong>{tools ? tools.filter(t => t.status === 'approved').length : 0}+ AI tools</strong> across <strong>{categories ? categories.length : 0} categories</strong>.
          </p>

          {/* Interactive Search Bar wrapper */}
          <div ref={suggestionsRef} style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder={`Search ${tools ? tools.filter(t => t.status === 'approved').length : 0}+ AI tools, categories, or tags...`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  style={{
                    padding: '14px 16px 14px 44px',
                    fontSize: 'var(--text-base)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    width: '100%',
                    outline: 'none',
                    transition: 'all var(--transition-normal)',
                    boxSizing: 'border-box',
                  }}
                  className="search-input-glow"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-lg)', padding: '12px 24px', fontWeight: 'bold' }}>
                Search
              </button>
            </form>

            {/* Auto Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 10,
                  textAlign: 'left',
                  overflow: 'hidden',
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      padding: '10px 14px',
                      fontSize: 'var(--text-sm)',
                      cursor: 'pointer',
                      borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      color: 'var(--text-primary)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Trending weekly chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🔥</span> Trending:
            </span>
            {(() => {
              const trending = getTrendingTools ? getTrendingTools(5) : [];
              const chips = (trending && trending.length > 0) ? trending.map(t => ({
                label: t.name,
                slug: t.slug
              })) : [
                { label: 'ChatGPT', slug: 'chatgpt' },
                { label: 'Cursor', slug: 'cursor' },
                { label: 'ElevenLabs', slug: 'elevenlabs' },
                { label: 'Midjourney', slug: 'midjourney' }
              ];
              return chips.map((chip) => (
                <Link
                  key={chip.slug}
                  to={`/tools/${chip.slug}`}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-card)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: '500',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    transition: 'all 150ms ease'
                  }}
                  className="trending-chip"
                >
                  {chip.label}
                </Link>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Category Row Section (Middle) */}
      <section id="categories" className="section" style={{ position: 'relative', zIndex: 1, padding: '36px 0 28px 0', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '10px', fontWeight: 'bold', padding: '3px 10px', borderRadius: 'var(--radius-full)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span>📂</span> EXPLORE CATEGORIES
              </div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Browse AI Tools by Category
              </h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Arrow navigation buttons (< and >) */}
              <button
                onClick={scrollCategoryLeft}
                aria-label="Scroll Categories Left"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
                className="category-nav-btn"
                title="Slide Left (<)"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={scrollCategoryRight}
                aria-label="Scroll Categories Right"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
                className="category-nav-btn"
                title="Slide Right (>)"
              >
                <ChevronRight size={18} />
              </button>

              <Link to="/categories" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', borderRadius: 'var(--radius-full)', marginLeft: '6px' }}>
                <span>View All ({categories.length})</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Presentable Horizontal scrollable row of Category Cards with Refs & Hover Handlers */}
          <div style={{ position: 'relative' }}>
            <div 
              ref={categoryContainerRef}
              onMouseEnter={() => { isCategoryHoveredRef.current = true; }}
              onMouseLeave={() => { isCategoryHoveredRef.current = false; }}
              style={{ 
                display: 'flex', 
                gap: '14px', 
                overflowX: 'auto', 
                padding: '6px 4px 12px 4px',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
              className="category-scroll-bar"
            >
              {categories.map((cat) => {
                const count = getToolCount(cat.slug);
                return (
                  <Link
                    key={cat.slug}
                    to={`/categories/${cat.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: 'var(--text-sm)',
                      whiteSpace: 'nowrap',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      flexShrink: 0
                    }}
                    className="category-pill-box"
                  >
                    <div className="category-icon-box">
                      <CategoryIcon name={cat.name} size={18} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: 'var(--text-xs)' }}>
                        {cat.name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {count} {count === 1 ? 'tool' : 'tools'}
                      </span>
                    </div>

                    <span 
                      style={{ 
                        fontSize: '10px', 
                        backgroundColor: 'var(--color-primary-light)', 
                        color: 'var(--color-primary)', 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'bold',
                        marginLeft: '4px'
                      }}
                    >
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Sponsored Section Container */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          {/* Outer Card Container matching site section boxes */}
          <div 
            className="card" 
            style={{ 
              padding: '32px 28px', 
              borderRadius: 'var(--radius-xl)', 
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
              backgroundColor: 'var(--bg-secondary)',
              position: 'relative'
            }}
          >
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className="badge badge-featured">
                    <Sparkles size={11} /> Featured
                  </span>
                  <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                    Featured Promotions
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                  Handpicked AI solutions curated by our community and partners.
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/advertise" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <span>Promote Your Tool</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Filter Tabs Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '14px 0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFeaturedTab('all')}
                  className={`featured-tab-btn ${featuredTab === 'all' ? 'featured-tab-btn-active' : ''}`}
                >
                  All Featured
                </button>
                <button
                  onClick={() => setFeaturedTab('top')}
                  className={`featured-tab-btn ${featuredTab === 'top' ? 'featured-tab-btn-active' : ''}`}
                >
                  🔥 Top Rated
                </button>
                <button
                  onClick={() => setFeaturedTab('new')}
                  className={`featured-tab-btn ${featuredTab === 'new' ? 'featured-tab-btn-active' : ''}`}
                >
                  ⚡ New Additions
                </button>
                <button
                  onClick={() => setFeaturedTab('free')}
                  className={`featured-tab-btn ${featuredTab === 'free' ? 'featured-tab-btn-active' : ''}`}
                >
                  💎 Free & Freemium
                </button>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
                Showing 12 Featured Tools
              </span>
            </div>

            {/* 4 Columns x 2 Rows Grid = 8 Cards Total (matching exact Popular/Featured wireframe image) */}
            <div className="grid grid-cols-4" style={{ gap: '20px' }}>
              {(() => {
                const approvedTools = tools.filter(t => t.status === 'approved');
                let filtered = [...approvedTools];

                if (featuredTab === 'top') {
                  filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                } else if (featuredTab === 'new') {
                  filtered.sort((a, b) => new Date(b.approvedAt || b.lastUpdated || 0).getTime() - new Date(a.approvedAt || a.lastUpdated || 0).getTime());
                } else if (featuredTab === 'free') {
                  filtered = filtered.filter(t => t.pricing === 'free' || t.pricing === 'freemium');
                } else {
                  const sponsored = filtered.filter(t => t.isSponsored || t.isFeatured);
                  const organic = filtered.filter(t => !t.isSponsored && !t.isFeatured);
                  filtered = [...sponsored, ...organic];
                }

                const displayList = filtered.slice(0, 8);
                
                if (displayList.length === 0) {
                  return (
                    <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                      No tools found in this featured view.
                    </div>
                  );
                }

                return displayList.map((tool, idx) => (
                  <div key={tool.id} style={{ display: 'flex' }}>
                    <ToolCard tool={{ ...tool, isFeatured: idx < 2 || tool.isFeatured, isVerified: true }} onToast={onToast} />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* 3-Column Dashboard Grid Section (Trending AI Tools | Use Cases | Recently Added) */}
      <section className="section" style={{ position: 'relative', zIndex: 1, padding: '24px 0 32px 0' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '24px', alignItems: 'stretch' }}>
            
            {/* Column 1: 🔥 Trending AI Tools */}
            <div 
              className="card" 
              style={{ 
                padding: '24px 20px', 
                borderRadius: '24px', 
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.04)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                height: '100%' 
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '32px', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🔥</span> Trending AI Tools
                  </h3>
                </div>

                {/* Timeframe Segment Tabs */}
                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-full)', marginBottom: '14px' }}>
                  {(['today', 'week', 'month'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTrendingTab(tab)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: trendingTab === tab ? 700 : 500,
                        borderRadius: 'var(--radius-full)',
                        border: trendingTab === tab ? '1px solid rgba(226, 96, 58, 0.25)' : '1px solid transparent',
                        backgroundColor: trendingTab === tab ? 'var(--bg-card)' : 'transparent',
                        color: trendingTab === tab ? '#E2603A' : 'var(--text-muted)',
                        boxShadow: trendingTab === tab ? '0 2px 8px rgba(226, 96, 58, 0.12)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'capitalize'
                      }}
                    >
                      {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'This Month'}
                    </button>
                  ))}
                </div>

                {/* Numbered Ranked Items (01 - 05) with balanced padding & pricing badge */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const approved = tools.filter(t => t.status === 'approved');
                    let sorted = [...approved];

                    if (trendingTab === 'today') {
                      sorted.sort((a, b) => b.reviewCount - a.reviewCount);
                    } else if (trendingTab === 'week') {
                      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
                    } else {
                      sorted.sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount));
                    }

                    const top5 = sorted.slice(0, 5);

                    return top5.map((tool, idx) => (
                      <div
                        key={tool.id}
                        onClick={() => navigate(`/tools/${tool.slug}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '14px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color-hover)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}>
                          0{idx + 1}
                        </span>
                        <img
                          src={tool.logoUrl}
                          alt={tool.name}
                          style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }}
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop'; }}
                        />
                        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: '700', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tool.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>
                            {tool.tagline}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span className="badge badge-pricing" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: 'var(--radius-full)', textTransform: 'capitalize' }}>
                              {tool.pricing}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            ★ {tool.rating > 0 ? tool.rating : '4.8'}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Bottom Link */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link to="/trending" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#E2603A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>View All Trending →</span>
                </Link>
              </div>
            </div>

            {/* Column 2: What do you want to accomplish? */}
            <div 
              className="card" 
              style={{ 
                padding: '24px 20px', 
                borderRadius: '24px', 
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.04)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                height: '100%' 
              }}
            >
              <div>
                {/* Header */}
                <div style={{ minHeight: '32px', marginBottom: '14px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0, marginBottom: '2px' }}>
                    What do you want to accomplish?
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                    Choose a use case and find the perfect AI tools.
                  </p>
                </div>

                {/* Grid of 10 Use Case Tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { icon: '✍️', label: 'Write an article', q: 'article' },
                    { icon: '🎨', label: 'Create a logo', q: 'logo' },
                    { icon: '🖼️', label: 'Generate an image', q: 'image' },
                    { icon: '🎥', label: 'Make a video', q: 'video' },
                    { icon: '🌐', label: 'Build a website', q: 'website' },
                    { icon: '💻', label: 'Write code', q: 'code' },
                    { icon: '🔍', label: 'Improve SEO', q: 'seo' },
                    { icon: '📱', label: 'Social media posts', q: 'social' },
                    { icon: '📊', label: 'Create presentations', q: 'presentations' },
                    { icon: '🎙️', label: 'Generate voice', q: 'voice' },
                  ].map((useCase) => (
                    <div
                      key={useCase.label}
                      onClick={() => navigate(`/ai-tools?q=${encodeURIComponent(useCase.q)}`)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 8px',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-card)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        gap: '6px',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color-hover)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.02)';
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        {useCase.icon}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.2' }}>
                        {useCase.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Link Centered */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link to="/collections" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#E2603A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>View All Use Cases →</span>
                </Link>
              </div>
            </div>

            {/* Column 3: Recently Added */}
            <div 
              className="card" 
              style={{ 
                padding: '24px 20px', 
                borderRadius: '24px', 
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.04)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                height: '100%' 
              }}
            >
              <div>
                {/* Header with View All New Tools link matching reference image */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '32px', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                    Recently Added
                  </h3>
                  <Link to="/ai-tools?q=new" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#E2603A', textDecoration: 'none' }}>
                    View All New Tools →
                  </Link>
                </div>

                {/* Recent tools list - 5 items normalized */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const recent = tools
                      .filter(t => t.status === 'approved')
                      .sort((a, b) => new Date(b.approvedAt || b.lastUpdated || 0).getTime() - new Date(a.approvedAt || a.lastUpdated || 0).getTime())
                      .slice(0, 5);

                    const timesAgo = ['2 days ago', '3 days ago', '3 days ago', '4 days ago', '5 days ago'];

                    return recent.map((tool, idx) => (
                      <div
                        key={tool.id}
                        onClick={() => navigate(`/tools/${tool.slug}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '14px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color-hover)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.02)';
                        }}
                      >
                        <img
                          src={tool.logoUrl}
                          alt={tool.name}
                          style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }}
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop'; }}
                        />
                        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: '700', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tool.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>
                            {tool.tagline}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span className="badge badge-pricing" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: 'var(--radius-full)', textTransform: 'capitalize' }}>
                              {tool.pricing}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'flex-start', fontWeight: 500 }}>
                          {timesAgo[idx] || 'recently'}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Bottom alignment spacer matching Column 1 and Column 2 */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link to="/ai-tools?q=new" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#E2603A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>View All New Additions →</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Banner to Add Tools ("Built an AI Tool? Get Discovered.") */}
      <section className="section" style={{ position: 'relative', zIndex: 1, padding: '24px 0 36px 0' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, #0b0f19 0%, #151e30 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px 40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              border: '1px solid rgba(226, 96, 58, 0.3)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Background Glow */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(circle at 100% 50%, rgba(226, 96, 58, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1, maxWidth: '600px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(226, 96, 58, 0.15)',
                  border: '1px solid rgba(226, 96, 58, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  flexShrink: 0,
                }}
              >
                🚀
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: '#ffffff', margin: 0, marginBottom: '6px' }}>
                  Built an AI Tool? Get Discovered.
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                  List your product in front of thousands of creators, developers, and founders actively searching for AI solutions.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <Link
                to="/submit-tool"
                className="btn btn-primary"
                style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)', fontWeight: 'bold' }}
              >
                <span>Submit Your Tool</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/advertise"
                className="btn btn-outline"
                style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)', padding: '12px 20px', borderRadius: 'var(--radius-lg)' }}
              >
                View Listing Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Tools Section Grid */}
      <section id="popular-tools" className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                  Popular Tools
                </h2>
                <Link
                  to="/advertise?plan=popular"
                  className="badge"
                  style={{
                    backgroundColor: 'rgba(226, 96, 58, 0.1)',
                    color: '#E2603A',
                    border: '1px solid rgba(226, 96, 58, 0.3)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Feature your AI tool in Popular Tools"
                >
                  <span>⚡ Paid Popular Spot Available</span>
                </Link>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Browse the highest rated AI tools vetted by community builders and reviewers.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/submit-tool?plan=popular"
                className="btn btn-outline btn-sm"
                style={{
                  color: '#E2603A',
                  borderColor: 'rgba(226, 96, 58, 0.3)',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px'
                }}
              >
                <span>+ Get Featured in Popular Tools ($39)</span>
              </Link>
              <Link to="/trending" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                <span>View All ({tools.filter(t => t.status === 'approved').length})</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-4" style={{ gap: '20px' }}>
            {(() => {
              const approved = tools.filter(t => t.status === 'approved');
              // Sort such that paid popular placement / sponsored tools appear first, then sorted by rating & review count
              const sorted = [...approved].sort((a, b) => {
                const aPromoted = a.isPopularPlacement || a.isSponsored || a.isFeatured ? 1 : 0;
                const bPromoted = b.isPopularPlacement || b.isSponsored || b.isFeatured ? 1 : 0;
                if (bPromoted !== aPromoted) return bPromoted - aPromoted;
                return (b.rating * b.reviewCount) - (a.rating * a.reviewCount) || b.rating - a.rating;
              });

              return sorted.slice(0, 8).map((tool) => (
                <ToolCard key={tool.id} tool={tool} onToast={onToast} />
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Tools Sorted by Categories Grid Blocks */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
          
          {/* Block 1: AI Video & Image Generators */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🎥</span> AI Video & Image Generators
              </h3>
              <Link to="/categories/image-generation" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                View All &gt;
              </Link>
            </div>
            <div className="grid grid-cols-4">
              {tools
                .filter(t => (t.categorySlug === 'image-generation' || t.categorySlug === 'video') && t.status === 'approved')
                .slice(0, 4)
                .map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onToast={onToast} />
                ))}
            </div>
          </div>

          {/* Block 2: Coding & Development Tools */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>💻</span> Coding & Tech Assistants
              </h3>
              <Link to="/categories/coding" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                View All &gt;
              </Link>
            </div>
            <div className="grid grid-cols-4">
              {tools
                .filter(t => t.categorySlug === 'coding' && t.status === 'approved')
                .slice(0, 4)
                .map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onToast={onToast} />
                ))}
            </div>
          </div>

          {/* Block 3: Design & Video Generators */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🎨</span> Design, Art & Image Editors
              </h3>
              <Link to="/categories/design" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                View All &gt;
              </Link>
            </div>
            <div className="grid grid-cols-4">
              {tools
                .filter(t => t.categorySlug === 'design' && t.status === 'approved')
                .slice(0, 4)
                .map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onToast={onToast} />
                ))}
            </div>
          </div>

        </div>
      </section>

      {/* Curated Stacks */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Curated AI Stacks
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Discover handpicked combinations optimized for dev, student, and creator tasks.
              </p>
            </div>
            <Link to="/collections" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>All Collections</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2">
            {collections.slice(0, 2).map((coll) => (
              <div
                key={coll.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'bold',
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    Curated Collection
                  </div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                    {coll.name}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {coll.description}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Contains {coll.tools.length} AI tools
                  </span>
                  <Link
                    to={`/collections/${coll.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '6px 12px' }}
                  >
                    <span>View Stacks</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Dashboard Deck */}
      <section className="section" style={{ position: 'relative', zIndex: 1, padding: '40px 0' }}>
        <div className="container">
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '24px', 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }} 
            className="stats-grid"
          >
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>12+</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--font-medium)' }}>Curated AI Categories</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>1,200+</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--font-medium)' }}>Indexed AI Tools</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: '#E2603A', marginBottom: '4px' }}>50,000+</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--font-medium)' }}>Monthly Discoveries</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>24 Hours</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--font-medium)' }}>Average Reviews Vetting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Showdowns */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: 'var(--radius-full)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Sparkles size={12} />
                Side-by-Side Analysis
              </div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                Popular Head-to-Head Showdowns
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '6px 0 0 0' }}>
                Compare head-to-head parameters, ratings, pricing, and pros of industry-leading AI models.
              </p>
            </div>
            <Link to="/compare" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 'bold' }}>
              <span>Open Comparison Studio</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {/* Showdown 1: AI Chatbots */}
            <div className="card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  AI CHATBOTS
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>4.8 ★ vs 4.9 ★</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', position: 'relative' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1678787150117-cdca2776c5b0?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="ChatGPT" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>ChatGPT</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>OpenAI</span>
                </div>
                
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2603A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(226, 96, 58, 0.25)', flexShrink: 0, zIndex: 2 }}>
                  VS
                </div>
                
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="Claude" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>Claude AI</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Anthropic</span>
                </div>
              </div>

              <Link to="/compare/chatgpt-vs-claude" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontWeight: 'bold' }}>
                Compare ChatGPT vs Claude
              </Link>
            </div>

            {/* Showdown 2: Code AI */}
            <div className="card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  DEVELOPER TOOLS
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>IDE vs Engine</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', position: 'relative' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="Cursor" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>Cursor IDE</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Anysphere</span>
                </div>
                
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2603A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(226, 96, 58, 0.25)', flexShrink: 0, zIndex: 2 }}>
                  VS
                </div>
                
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="Phind" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>Phind</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Phind Inc</span>
                </div>
              </div>

              <Link to="/compare/cursor-vs-phind" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontWeight: 'bold' }}>
                Compare Cursor vs Phind
              </Link>
            </div>

            {/* Showdown 3: Image Generation */}
            <div className="card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  IMAGE & VISUAL AI
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Photorealism</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', position: 'relative' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="Midjourney" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>Midjourney</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>v6 Engine</span>
                </div>
                
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2603A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(226, 96, 58, 0.25)', flexShrink: 0, zIndex: 2 }}>
                  VS
                </div>
                
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="DALL-E 3" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>DALL-E 3</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>OpenAI</span>
                </div>
              </div>

              <Link to="/compare/midjourney-vs-dall-e-3" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontWeight: 'bold' }}>
                Compare Midjourney vs DALL-E 3
              </Link>
            </div>

            {/* Showdown 4: Voice & Audio AI */}
            <div className="card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  VOICE & AUDIO AI
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>TTS Synthesis</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', position: 'relative' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="ElevenLabs" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>ElevenLabs</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Cloning</span>
                </div>
                
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2603A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(226, 96, 58, 0.25)', flexShrink: 0, zIndex: 2 }}>
                  VS
                </div>
                
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <img src="https://images.unsplash.com/photo-1589254065878-42c9da997008?w=100&h=100&fit=crop" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} alt="Murf AI" />
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>Murf AI</div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Studio</span>
                </div>
              </div>

              <Link to="/compare/elevenlabs-vs-murf-ai" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontWeight: 'bold' }}>
                Compare ElevenLabs vs Murf
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section: 1 Row, 4 Articles */}
      <section className="section" style={{ position: 'relative', zIndex: 1, backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Latest AI Insights & Tutorials
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Explore developer guides, model tutorials, and comparison breakdowns written by experts.
              </p>
            </div>
            <Link to="/blog" className="btn btn-outline btn-sm" style={{ padding: '8px 16px', fontWeight: 'bold' }}>
              <span>See All Articles</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4">
            {blogPosts.slice(0, 4).map((post) => (
              <div 
                key={post.slug} 
                className="card"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  padding: 0,
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  />
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      left: '12px', 
                      backgroundColor: 'var(--color-primary)', 
                      color: 'white', 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {post.category}
                  </span>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: '0 0 8px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <span>{post.date}</span>
                    <span>{post.readTime} read</span>
                  </div>

                  <Link 
                    to={`/blog/${post.slug}`} 
                    className="btn btn-outline btn-sm" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                  >
                    Read Article
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="section" style={{ position: 'relative', zIndex: 1, backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center', marginBottom: '32px' }}>
            Everything you need to know about submissions, claims, sponsorships, and user curations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    fontWeight: 'var(--font-semibold)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary)', transform: openFaq === idx ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ＋
                  </span>
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 20px 16px 20px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Building an AI Tool CTA Section */}
      <section className="section bg-secondary" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '60px 0', marginTop: '40px' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '700px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', margin: '0 0 12px 0' }}>
            Building an AI Tool? Get Discovered on AIFynest.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: '24px' }}>
            Create your listing, showcase your product, collect reviews, understand your audience, and reach users searching for AI tools.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/submit-tool" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              + Submit Your AI Tool
            </Link>
            <Link to="/advertise" className="btn btn-outline" style={{ padding: '12px 24px' }}>
              Explore Promotion Options
            </Link>
          </div>
        </div>
      </section>

      {styleInjection}
    </div>
  );
};

const styleInjection = (
  <style>{`
    .search-input-glow:focus {
      border-color: var(--color-primary) !important;
      box-shadow: 0 0 20px rgba(226, 96, 58, 0.2) !important;
    }
    .sponsored-scroll-container::-webkit-scrollbar {
      display: none;
    }
    .sponsored-scroll-container {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);
