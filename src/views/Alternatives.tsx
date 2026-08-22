/* src/views/Alternatives.tsx */
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SEOHead } from '../components/shared/SEOHead';
import { Shield, MessageSquare } from '../components/shared/Icons';

export const Alternatives: React.FC = () => {
  const { tools, categories, trackEvent } = useDatabase();
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const navigate = useNavigate();

  // Find the target tool
  const currentTool = tools.find((t) => t.slug === toolSlug && t.status === 'approved');

  useEffect(() => {
    if (currentTool) {
      trackEvent('tool_view', currentTool.id, undefined, `Alternatives lookup for ${currentTool.slug}`);
    }
  }, [toolSlug, currentTool]);

  if (!currentTool) {
    return (
      <div className="container section text-center" style={{ maxWidth: '480px' }}>
        <Shield size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px auto' }} />
        <h2>Tool Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The tool you are seeking alternatives for could not be located in our directory.
        </p>
        <Link to="/ai-tools" className="btn btn-primary">
          Browse Directory
        </Link>
      </div>
    );
  }

  // Get other tools in the same category
  const alternativeTools = tools
    .filter((t) => t.categorySlug === currentTool.categorySlug && t.id !== currentTool.id && t.status === 'approved')
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 5);

  const currentCategory = categories.find((c) => c.slug === currentTool.categorySlug);
  const categoryName = currentCategory ? currentCategory.name : 'AI Tools';

  const seoTitle = `Best ${currentTool.name} Alternatives & Competitors (${new Date().getFullYear()})`;
  const seoDesc = `Compare the best alternatives to ${currentTool.name} in the ${categoryName.toLowerCase()} category. Find free, freemium, and paid competitors with verified reviews.`;

  return (
    <div className="container section">
      <SEOHead title={seoTitle} description={seoDesc} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Breadcrumbs */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <Link to="/">Home</Link> &gt; <Link to="/ai-tools">AI Tools</Link> &gt;{' '}
          <Link to={`/tools/${currentTool.slug}`}>{currentTool.name}</Link> &gt; <span>Alternatives</span>
        </div>

        {/* Header Hero */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <img
            src={currentTool.logoUrl}
            alt={currentTool.name}
            style={{ width: '64px', height: '64px', borderRadius: '12px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
              Best {currentTool.name} Alternatives & Competitors
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Discover top-rated replacements and alternative options for {currentTool.name} in {categoryName} sector.
            </p>
          </div>
        </div>

        {/* Editorial introduction */}
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            lineHeight: '1.6',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
            Why Look for Alternatives to {currentTool.name}?
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {currentTool.name} is a highly popular tool for {currentTool.subCategory.toLowerCase()}. However, depending on your workflow complexity, budget constraints, or feature requirements, other options might offer better value. Common drivers for finding replacements include needing offline access channels, localized data hosting, open-source compliance, or flexible pricing tiers like {alternativeTools.map(t => t.name).slice(0, 3).join(', ')}.
          </p>
        </div>

        {/* Alternatives List */}
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Top {alternativeTools.length || 'AI'} Competitors Vetted
          </h2>

          {alternativeTools.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              {alternativeTools.map((alt, idx) => (
                <div
                  key={alt.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 200px',
                    gap: '24px',
                    padding: '20px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    alignItems: 'center',
                  }}
                  className="alternative-row-card"
                >
                  {/* Rank indicator & logo */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', color: 'var(--color-primary)' }}>#{idx + 1}</span>
                    <img
                      src={alt.logoUrl}
                      alt={alt.name}
                      style={{ width: '48px', height: '48px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Body description */}
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-md)', fontWeight: 'bold' }}>
                      <Link to={`/tools/${alt.slug}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {alt.name}
                      </Link>
                      {alt.isVerified && (
                        <span
                          style={{
                            fontSize: '9px',
                            backgroundColor: 'var(--color-success-light)',
                            color: 'var(--color-success)',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            marginLeft: '8px',
                            verticalAlign: 'middle',
                          }}
                        >
                          Vetted
                        </span>
                      )}
                    </h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{alt.tagline}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>⭐ {alt.rating} ({alt.reviewCount} reviews)</span>
                      <span>💰 {alt.pricing.toUpperCase()}</span>
                      <span>🖥️ {alt.platforms.join(', ')}</span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to={`/tools/${alt.slug}`} className="btn btn-primary btn-sm" style={{ textAlign: 'center', width: '100%' }}>
                      View Details
                    </Link>
                    <button
                      onClick={() => {
                        navigate(`/compare/${currentTool.slug}-vs-${alt.slug}`);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Compare Matrix
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              No alternative listings found in the {categoryName} category yet.
            </div>
          )}
        </div>

        {/* Comparison Showdown Table */}
        {alternativeTools.length > 0 && (
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Side-by-Side Showdown Matrix
            </h2>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>AI Tool Specification</th>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{currentTool.name} (Source)</th>
                    {alternativeTools.slice(0, 3).map((alt) => (
                      <th key={alt.id} style={{ padding: '12px 16px', fontWeight: 'bold' }}>{alt.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>Rating Score</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-gold)' }}>★ {currentTool.rating} / 5</td>
                    {alternativeTools.slice(0, 3).map((alt) => (
                      <td key={alt.id} style={{ padding: '12px 16px' }}>★ {alt.rating} / 5</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>Pricing Tier</td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{currentTool.pricing}</td>
                    {alternativeTools.slice(0, 3).map((alt) => (
                      <td key={alt.id} style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{alt.pricing}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>Platforms Supported</td>
                    <td style={{ padding: '12px 16px' }}>{currentTool.platforms.slice(0, 2).join(', ')}</td>
                    {alternativeTools.slice(0, 3).map((alt) => (
                      <td key={alt.id} style={{ padding: '12px 16px' }}>{alt.platforms.slice(0, 2).join(', ')}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>Core Focus Area</td>
                    <td style={{ padding: '12px 16px' }}>{currentTool.subCategory}</td>
                    {alternativeTools.slice(0, 3).map((alt) => (
                      <td key={alt.id} style={{ padding: '12px 16px' }}>{alt.subCategory}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>Compare Details</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>-</td>
                    {alternativeTools.slice(0, 3).map((alt) => (
                      <td key={alt.id} style={{ padding: '12px 16px' }}>
                        <Link to={`/compare/${currentTool.slug}-vs-${alt.slug}`} style={{ color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                          Compare {currentTool.name} vs {alt.name} &gt;
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQs */}
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 16px 0' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />
                <span>What is the best alternative tool to {currentTool.name}?</span>
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                The best alternative depends on your needs. If ratings are your top priority,{' '}
                {alternativeTools[0] ? alternativeTools[0].name : 'other listed tools'}{' '}
                is highly popular with a rating of {alternativeTools[0] ? alternativeTools[0].rating : '4.5'}/5.
              </p>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />
                <span>Are there any free alternatives to {currentTool.name}?</span>
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Yes! You can filter listings in the directory using the "Free" pricing model. Competitors like{' '}
                {alternativeTools.find((t) => t.pricing === 'free')?.name || 'some alternatives'}{' '}
                are listed as completely free options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
