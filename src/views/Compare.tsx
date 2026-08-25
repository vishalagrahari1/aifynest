/* src/views/Compare.tsx */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { ComparisonTable } from '../components/comparison/ComparisonTable';
import { SEOHead } from '../components/shared/SEOHead';


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

  // Search input state to add new tools to compare
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof tools>([]);
  const [showDropdown, setShowDropdown] = useState(false);

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
  }, [slugs]);

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
  const seoTitle = comparisonNames ? `Compare ${comparisonNames}` : 'Compare AI Tools';
  const seoDesc = comparisonNames
    ? `Compare features, pricing, pros and cons, ratings and platforms of ${comparisonNames}. Choose the right AI assistant.`
    : 'Compare pricing, platforms, features, and reviews of multiple artificial intelligence software side-by-side.';

  return (
    <div className="container section">
      <SEOHead title={seoTitle} description={seoDesc} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
              Compare AI Tools
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0 0' }}>
              Compare pricing, platform access, ratings, pros, and cons of up to 3 tools side-by-side.
            </p>
          </div>
          {compareList.length > 0 && (
            <button onClick={onCompareClear} className="btn btn-outline">
              Clear Comparison List
            </button>
          )}
        </div>

        {/* Search add input bar */}
        {compareList.length < 3 && (
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search AI tool to add to comparison..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="form-input"
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
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 2000,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  padding: '6px',
                }}
              >
                {searchResults.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => handleAddTool(tool.id)}
                    style={{
                      padding: '10px 14px',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background var(--transition-fast)',
                      color: 'var(--text-primary)',
                    }}
                    className="dropdown-link-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={tool.logoUrl} 
                        alt={tool.name} 
                        style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop';
                        }}
                      />
                      <strong>{tool.name}</strong>
                    </div>
                    <span className="badge badge-pricing" style={{ fontSize: '9px' }}>{tool.pricing}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison grid view table */}
        <ComparisonTable tools={comparedTools} onRemove={onCompareToggle} />
      </div>
      <style>{`
        .dropdown-link-hover:hover {
          background-color: var(--bg-tertiary) !important;
        }
      `}</style>
    </div>
  );
};
