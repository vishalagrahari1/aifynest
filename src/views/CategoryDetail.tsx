/* src/views/CategoryDetail.tsx */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { ToolCard } from '../components/shared/ToolCard';
import { SEOHead } from '../components/shared/SEOHead';
import { CategoryIcon } from '../components/shared/Icons';

interface CategoryDetailProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  compareList: string[];
  onCompareToggle: (toolId: string) => void;
}

export const CategoryDetail: React.FC<CategoryDetailProps> = ({
  onToast,
  compareList,
  onCompareToggle,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const { categories, tools, trackEvent } = useDatabase();

  const [activeSub, setActiveSub] = useState('');

  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    setActiveSub('');
    if (category) {
      trackEvent('category_view', undefined, category.slug);
    }
  }, [slug]);

  if (!category) {
    return (
      <div className="container section text-center">
        <h2 style={{ marginBottom: '12px' }}>Category Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The requested AI category slug does not exist in our directory.
        </p>
        <Link to="/categories" className="btn btn-primary">
          View All Categories
        </Link>
      </div>
    );
  }

  // Filter tools for this category (must be approved status)
  const categoryTools = tools.filter((t) => t.categorySlug === category.slug && t.status === 'approved');

  // Filter subcategory tools
  const displayedTools = activeSub
    ? categoryTools.filter((t) => t.subCategory === activeSub)
    : categoryTools;

  // Other categories for sidebar recommendations
  const otherCategories = categories.filter((c) => c.slug !== category.slug).slice(0, 5);

  const seoTitle = `Best AI ${category.name} Tools in 2026 – Reviews & Pricing`;
  const seoDesc = `Discover the top-rated artificial intelligence software and platforms in ${category.name}. Read detailed reviews, view screen captures, compare costs, and choose the right AI tool.`;

  return (
    <div className="container section">
      <SEOHead title={seoTitle} description={seoDesc} />

      {/* Breadcrumbs */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link to="/">Home</Link> &gt; <Link to="/categories">Categories</Link> &gt; <span>{category.name}</span>
      </div>

      {/* Category Hero Block */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '30px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CategoryIcon name={category.iconName} size={48} />
        </div>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: '0 0 8px 0' }}>
            Best AI {category.name} Tools
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5', margin: 0 }}>
            {category.description}
          </p>
        </div>
        <div>
          <Link to={`/ai-tools?category=${category.slug}`} className="btn btn-primary">
            Advanced Filter
          </Link>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }} className="category-detail-layout">
        {/* Main List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Subcategory selectors */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <button
              onClick={() => setActiveSub('')}
              className={`btn btn-sm ${activeSub === '' ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              All {category.name} ({categoryTools.length})
            </button>
            {category.subcategories.map((sub) => {
              const count = categoryTools.filter((t) => t.subCategory === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setActiveSub(sub)}
                  className={`btn btn-sm ${activeSub === sub ? 'btn-primary' : 'btn-outline'}`}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>

          {/* List of Cards */}
          {displayedTools.length > 0 ? (
            <div className="grid grid-cols-2">
              {displayedTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onToast={onToast}
                  isCompareChecked={compareList.includes(tool.id)}
                  onCompareToggle={() => onCompareToggle(tool.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              No tools available in this subcategory yet.
            </div>
          )}

          {/* Bottom Category CTA */}
          <div
            style={{
              marginTop: '40px',
              padding: '30px',
              backgroundColor: 'var(--bg-card)',
              border: '1px dashed var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
              Don't see your AI tool here?
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Add it to AIFynest and get discovered by thousands of active users.
            </p>
            <Link to="/submit-tool" className="btn btn-primary btn-sm" style={{ padding: '8px 16px', display: 'inline-flex' }}>
              Submit Your Tool
            </Link>
          </div>
        </div>

        {/* Sidebar recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Other categories */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Other Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {otherCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categories/${cat.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon name={cat.iconName} size={16} />
                  </span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .category-detail-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
