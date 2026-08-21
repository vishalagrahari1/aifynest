/* src/views/Home.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';

import { ToolCard } from '../components/shared/ToolCard';
import { CategoryCard } from '../components/shared/CategoryCard';
import { SEOHead } from '../components/shared/SEOHead';
import { Search, Sparkles, ArrowRight } from '../components/shared/Icons';

interface HomeProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Home: React.FC<HomeProps> = ({ onToast }) => {
  const { tools, categories, collections, getTrendingTools, trackEvent } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load trending and new tools
  const trendingTools = getTrendingTools(4);
  const newTools = tools
    .filter((t) => t.status === 'approved')
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 4);

  // Suggested keywords to match
  const keywordSuggestions = [
    'ChatGPT',
    'Claude',
    'AI video generators',
    'AI writing tools',
    'AI coding assistants',
    'AI image generators',
    'Voice cloning',
    'Data science'
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

  // Update autocomplete recommendations
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      // Find matching keywords or tool names
      const matchedKeywords = keywordSuggestions.filter((kw) =>
        kw.toLowerCase().includes(query.toLowerCase())
      );
      const matchedTools = tools
        .filter((t) => t.status === 'approved' && t.name.toLowerCase().includes(query.toLowerCase()))
        .map((t) => t.name);

      const combined = Array.from(new Set([...matchedTools, ...matchedKeywords])).slice(0, 5);
      setSuggestions(combined);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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
      <div className="hero-glow" style={{ top: '150px', right: '5%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.02) 60%, rgba(0, 0, 0, 0) 100%)' }}></div>

      {/* Hero Search Section */}
      <section
        style={{
          background: 'var(--gradient-hero)',
          padding: '80px 0 60px 0',
          borderBottom: '1px solid var(--border-color)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="container" style={{ maxWidth: '800px' }}>
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
              marginBottom: '20px',
            }}
          >
            <Sparkles size={14} />
            <span>Discover the AI Revolution</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              lineHeight: '1.15',
              fontWeight: 'var(--font-bold)',
              letterSpacing: '-0.02em',
              marginBottom: '20px',
              color: 'var(--text-primary)',
            }}
          >
            Discover the Best <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Tools</span> for Every Job
          </h1>

          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 40px auto',
              lineHeight: '1.6',
            }}
          >
            Search, compare, and discover over 1,000+ vetted AI tools to optimize your creative writing, coding, marketing, audio design, and SaaS productivity.
          </p>

          {/* Interactive Search Bar wrapper */}
          <div ref={suggestionsRef} style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={20}
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
                  placeholder="Search AI tools, categories, features, or use cases..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  style={{
                    padding: '16px 16px 16px 48px',
                    fontSize: 'var(--text-base)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-lg)',
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>Popular:</span>
            {['chatgpt', 'cursor', 'elevenlabs', 'midjourney'].map((tag) => (
              <Link
                key={tag}
                to={`/tools/${tag}`}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {tag.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
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

      {/* Trending Tools list */}
      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Trending AI Tools
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Ranked organically based on recent views, reviews growth, and click activity.
              </p>
            </div>
            <Link to="/trending" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>View Trending</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4">
            {trendingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onToast={onToast} />
            ))}
          </div>
        </div>
      </section>

      {/* New Tools section */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Newest Listings
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Recently reviewed and approved submissions from our curation editors.
              </p>
            </div>
            <Link to="/new" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>View All New</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4">
            {newTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onToast={onToast} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Collections Grid */}
      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                Popular Curated Collections
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Explore handpicked AI toolsets configured for student, dev, and content stack operations.
              </p>
            </div>
            <Link to="/collections" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              <span>View All Collections</span>
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

      {/* 5. Homepage Submit Tool CTA Section */}
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
  `}</style>
);
