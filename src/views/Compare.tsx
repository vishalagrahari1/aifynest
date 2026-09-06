/* src/views/Compare.tsx */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { ComparisonTable } from '../components/comparison/ComparisonTable';
import { SEOHead } from '../components/shared/SEOHead';
import { Search, Sparkles } from '../components/shared/Icons';

interface CompareProps {
  compareList: string[];
  onCompareToggle: (toolId: string) => void;
  onCompareClear: () => void;
}

export const Compare: React.FC<CompareProps> = ({
  compareList,
  onCompareToggle,
  onCompareClear,
}) => {
  const { tools } = useDatabase();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slugs } = useParams<{ slugs?: string }>();
  const navigate = useNavigate();

  // Search input state to add new tools to compare
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof tools>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Popular quick preset showdowns
  const popularPresets = [
    { label: 'ChatGPT vs Claude', path: '/compare/chatgpt-vs-claude', badge: 'Popular' },
    { label: 'Cursor vs Phind', path: '/compare/cursor-vs-phind', badge: 'Code AI' },
    { label: 'Midjourney vs DALL-E 3', path: '/compare/midjourney-vs-dall-e-3', badge: 'Visual AI' },
    { label: 'ElevenLabs vs Murf', path: '/compare/elevenlabs-vs-murf-ai', badge: 'Voice AI' },
  ];

  // Sync compare list from URL slugs (e.g., /compare/chatgpt-vs-claude) or query parameters (e.g., ?ids=1,2)
  useEffect(() => {
    if (slugs) {
      const parsedSlugs = slugs.toLowerCase().split('-vs-');
      const matchedIds = tools
        .filter((t) => parsedSlugs.includes(t.slug) && t.status === 'approved')
        .map((t) => t.id);

      onCompareClear();
      matchedIds.forEach((id) => {
        onCompareToggle(id);
      });
    } else {
      const idsParam = searchParams.get('ids');
      if (idsParam) {
        onCompareClear();
        idsParam.split(',').forEach((id) => {
          if (tools.some((t) => t.id === id)) {
            onCompareToggle(id);
          }
        });
      }
    }
  }, [slugs, tools]);

  // Update URL query parameters only if NOT using SEO-friendly path slugs
  useEffect(() => {
    if (!slugs) {
      if (compareList.length > 0) {
        setSearchParams({ ids: compareList.join(',') });
      } else {
        setSearchParams({});
      }
    }
  }, [compareList, slugs]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const results = tools.filter(
        (t) =>
          t.status === 'approved' &&
          t.name.toLowerCase().includes(query.toLowerCase()) &&
          !compareList.includes(t.id)
      );
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleAddTool = (toolId: string) => {
    if (compareList.length >= 3) {
      alert('You can compare a maximum of 3 tools simultaneously.');
      return;
    }
    onCompareToggle(toolId);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const comparedTools = tools.filter((t) => compareList.includes(t.id));

  // Dynamic SEO description
  const comparisonNames = comparedTools.map((t) => t.name).join(' vs ');
  const seoTitle = comparisonNames ? `Compare ${comparisonNames}` : 'Compare AI Tools Head-to-Head';
  const seoDesc = comparisonNames
    ? `Compare features, pricing, pros and cons, ratings and platforms of ${comparisonNames}. Choose the best AI solution for your workflow.`
    : 'Compare pricing, platforms, features, and reviews of multiple artificial intelligence software side-by-side.';

  return (
    <div className="container section">
      <SEOHead title={seoTitle} description={seoDesc} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Banner Hero */}
        <div 
          className="glass card"
          style={{ 
            padding: '36px 32px', 
            borderRadius: 'var(--radius-xl)', 
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: 'var(--radius-full)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Sparkles size={12} />
                Side-by-Side Analysis Engine
              </div>
              <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', lineHeight: '1.2' }}>
                {comparisonNames ? `Head-to-Head: ${comparisonNames}` : 'Compare AI Tools & Technologies'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: '8px 0 0 0', maxWidth: '640px', lineHeight: '1.5' }}>
                Evaluate pricing tiers, feature capabilities, user ratings, pros, and cons of up to 3 AI platforms side-by-side to make the right software choice.
              </p>
            </div>

            {compareList.length > 0 && (
              <button onClick={onCompareClear} className="btn btn-outline btn-sm" style={{ padding: '8px 16px', fontWeight: 'semibold' }}>
                Clear Comparison ({compareList.length})
              </button>
            )}
          </div>

          {/* Quick Preset Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Trending Showdowns:
            </span>
            {popularPresets.map((preset) => (
              <button
                key={preset.path}
                onClick={() => navigate(preset.path)}
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all var(--transition-fast)'
                }}
                className="preset-btn-hover"
              >
                <span>{preset.label}</span>
                <span style={{ fontSize: '9px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search input bar to add new tool */}
        {compareList.length < 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Add Tool to Compare ({compareList.length} of 3 selected)
              </span>
            </div>

            <div style={{ position: 'relative', maxWidth: '520px' }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={16} 
                  style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
                <input
                  type="text"
                  placeholder="Type AI tool name (e.g. Midjourney, Cursor, Jasper)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="form-input search-input-glow"
                  style={{ paddingLeft: '44px', height: '48px', borderRadius: 'var(--radius-lg)' }}
                />
              </div>

              {/* Dropdown results */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  className="glass"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 2000,
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '8px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {searchResults.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => handleAddTool(tool.id)}
                      style={{
                        padding: '12px 16px',
                        fontSize: 'var(--text-xs)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background var(--transition-fast)',
                        color: 'var(--text-primary)',
                      }}
                      className="dropdown-link-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={tool.logoUrl} 
                          alt={tool.name} 
                          style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop';
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{tool.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tool.tagline}</div>
                        </div>
                      </div>
                      <span className="badge badge-pricing" style={{ fontSize: '9px', textTransform: 'capitalize' }}>{tool.pricing}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <ComparisonTable tools={comparedTools} onRemove={onCompareToggle} />
      </div>

      <style>{`
        .preset-btn-hover:hover {
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
          transform: translateY(-1px);
        }
        .dropdown-link-hover:hover {
          background-color: var(--bg-tertiary) !important;
        }
      `}</style>
    </div>
  );
};

