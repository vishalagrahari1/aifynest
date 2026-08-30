/* src/views/Home.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../utils/supabase';

import { ToolCard } from '../components/shared/ToolCard';
import { CategoryCard } from '../components/shared/CategoryCard';
import { SEOHead } from '../components/shared/SEOHead';
import { Search, Sparkles, ArrowRight, Award, DollarSign, MousePointer } from '../components/shared/Icons';

interface HomeProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Home: React.FC<HomeProps> = ({ onToast }) => {
  const { tools, categories, collections, blogPosts, trackEvent } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // FAQ Accordion toggles
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sponsoredContainerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

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
      <div className="hero-glow" style={{ top: '150px', right: '5%', background: 'radial-gradient(circle, rgba(160, 68, 244, 0.08) 0%, rgba(99, 102, 241, 0.02) 60%, rgba(0, 0, 0, 0) 100%)' }}></div>

      {/* Hero Search Section - Redesigned to ToolboxAI Premium style */}
      <section
        style={{
          background: 'var(--gradient-hero)',
          padding: '100px 0 80px 0',
          borderBottom: '1px solid var(--border-color)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="container" style={{ maxWidth: '850px' }}>
          {/* Dynamic Pill above H1 */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: '24px',
            }}
          >
            <Sparkles size={14} />
            <span>🔥 {(() => {
              if (!tools) return 5;
              const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
              const now = Date.now();
              const count = tools.filter(t => {
                if (!t.lastUpdated) return false;
                const tDate = new Date(t.lastUpdated).getTime();
                return (now - tDate) <= SEVEN_DAYS_MS;
              }).length;
              return count > 0 ? count : 5; // Fallback to 5 for demo display
            })()} tools added this week</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 3.8rem)',
              lineHeight: '1.1',
              fontWeight: 'var(--font-bold)',
              letterSpacing: '-0.03em',
              marginBottom: '20px',
              color: 'var(--text-primary)',
            }}
          >
            Discover the Best <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Tools</span> For Every Job
          </h1>

          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '650px',
              margin: '0 auto 16px auto',
              lineHeight: '1.6',
            }}
          >
            Your daily-updated hub for AI tools: <strong>{tools ? tools.filter(t => t.status === 'approved').length : 0} entries</strong> in <strong>{categories ? categories.length : 0} categories</strong>, including models, coding assistants, and voice generators.
          </p>

          {/* Trust-Signal Row */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px', 
              fontSize: 'var(--text-xs)', 
              color: 'var(--text-muted)', 
              marginBottom: '32px',
              flexWrap: 'wrap',
              fontWeight: '500'
            }}
            className="hero-trust-signals"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Verified Reviews</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🔄 Updated Daily</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚡ <strong>{(() => {
                if (!tools) return 0;
                const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
                const now = Date.now();
                const count = tools.filter(t => {
                  if (t.status !== 'approved' || !t.lastUpdated) return false;
                  const tDate = new Date(t.lastUpdated).getTime();
                  return (now - tDate) <= THIRTY_DAYS_MS;
                }).length;
                return count > 0 ? count : tools.filter(t => t.status === 'approved').length;
              })()}</strong> Tools Active This Month
            </span>
          </div>

          {/* Interactive Search Bar wrapper */}
          <div ref={suggestionsRef} style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder={`Search over ${tools ? tools.filter(t => t.status === 'approved').length : 0}+ AI tools, categories, or use cases...`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  style={{
                    padding: '18px 18px 18px 52px',
                    fontSize: 'var(--text-base)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-xl)',
                    width: '100%',
                    outline: 'none',
                    transition: 'all var(--transition-normal)',
                    boxSizing: 'border-box',
                  }}
                  className="search-input-glow"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ borderRadius: 'var(--radius-lg)' }}>
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
                      padding: '12px 16px',
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

          {/* Quick links tag helpers */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>Popular:</span>
            {['chatgpt', 'cursor', 'elevenlabs', 'midjourney'].map((tag) => (
              <Link
                key={tag}
                to={`/tools/${tag}`}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '500',
                  border: '1px solid var(--border-color)',
                }}
              >
                {tag.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sponsored Tools Carousel */}
      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', position: 'relative', zIndex: 1, padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-sponsored" style={{ margin: 0, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}>Ad Campaign</span>
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                  Sponsored Featured Tools
                </h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Handpicked innovations running sponsored campaigns.
              </p>
            </div>
            <Link to="/advertise" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>Advertise Here</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Sliding Carousel wrapper */}
          <div 
            ref={sponsoredContainerRef}
            onMouseEnter={() => { isHoveredRef.current = true; }}
            onMouseLeave={() => { isHoveredRef.current = false; }}
            style={{ 
              display: 'flex', 
              gap: '24px', 
              overflowX: 'auto', 
              scrollBehavior: 'smooth', 
              padding: '8px 4px',
              WebkitOverflowScrolling: 'touch',
            }}
            className="sponsored-scroll-container"
          >
            {tools
              .filter(t => t.isSponsored && t.status === 'approved')
              .concat(tools.filter(t => !t.isSponsored && t.status === 'approved'))
              .slice(0, 8)
              .map((tool) => (
                <div key={tool.id} style={{ flex: '0 0 calc(25% - 18px)', minWidth: '280px' }} className="sponsored-carousel-card">
                  <ToolCard tool={{ ...tool, isSponsored: true }} onToast={onToast} />
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section id="categories" className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Browse by Category
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Explore specialized AI tools mapped across industrial use cases.
              </p>
            </div>
            <Link to="/categories" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>All Categories</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4">
            {categories.slice(0, 8).map((cat) => (
              <CategoryCard key={cat.slug} category={cat} toolCount={getToolCount(cat.slug)} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools Section Grid */}
      <section id="popular-tools" className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Popular Tools
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Browse the highest rated AI tools vetted by community builders and reviewers.
              </p>
            </div>
            <Link to="/trending" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>View All Popular Tools</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4">
            {tools
              .filter(t => t.status === 'approved')
              .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
              .slice(0, 8)
              .map((tool) => (
                <ToolCard key={tool.id} tool={tool} onToast={onToast} />
              ))}
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

      {/* Key Platform Features / Benefits Deck */}
      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '12px' }}>
              The Ultimate Hub for AI Finders
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '500px', margin: '0 auto' }}>
              Designed to help builders list innovations and let users search, compare, and bookmark tools seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-3">
            {/* Benefit 1 */}
            <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MousePointer size={28} />
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0 }}>One-Click Access</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                Instantly redirect to official AI tools dashboards. Our links are vetted continuously to prevent broken pathways.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={28} />
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0 }}>Trusted Vetted Reviews</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                Every single rating, review commentary, and pros/cons report is manually validated by directory admins to rule out spam.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="card" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={28} />
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0 }}>Tailored Tool Finder</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                Easily filter systems by Gold Vetted tags, Pricing plans tiers, or direct compatibility platforms with zero delay.
              </p>
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
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>45,000+</div>
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
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Comparison Showdowns
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Compare head-to-head parameters of leading artificial intelligence engines side-by-side.
              </p>
            </div>
            <Link to="/compare" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>Start Comparison</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="showdowns-grid">
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>AI CHATBOTS</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Side-by-Side</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '10px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1678787150117-cdca2776c5b0?w=100&h=100&fit=crop" style={{ width: '48px', height: '48px', borderRadius: '8px', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>ChatGPT</div>
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--text-muted)' }}>VS</div>
                <div style={{ textAlign: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop" style={{ width: '48px', height: '48px', borderRadius: '8px', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Claude AI</div>
                </div>
              </div>
              <Link to="/compare/chatgpt-vs-claude" className="btn btn-outline btn-sm" style={{ alignSelf: 'stretch', justifyContent: 'center' }}>
                Compare ChatGPT vs Claude
              </Link>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>CODE ASSISTANTS</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Side-by-Side</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '10px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=100&h=100&fit=crop" style={{ width: '48px', height: '48px', borderRadius: '8px', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Cursor IDE</div>
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--text-muted)' }}>VS</div>
                <div style={{ textAlign: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop" style={{ width: '48px', height: '48px', borderRadius: '8px', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Phind</div>
                </div>
              </div>
              <Link to="/compare/cursor-vs-phind" className="btn btn-outline btn-sm" style={{ alignSelf: 'stretch', justifyContent: 'center' }}>
                Compare Cursor vs Phind
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
      box-shadow: 0 0 20px rgba(124, 58, 237, 0.2) !important;
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
