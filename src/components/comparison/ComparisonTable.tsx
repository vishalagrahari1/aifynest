/* src/components/comparison/ComparisonTable.tsx */
import React from 'react';
import type { Tool } from '../../utils/seedData';
import { StarRating } from '../shared/StarRating';
import { Globe, Trash, Check, X, Award, Zap } from '../shared/Icons';
import { Link } from 'react-router-dom';


interface ComparisonTableProps {
  tools: Tool[];
  onRemove: (id: string) => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ tools, onRemove }) => {
  if (tools.length === 0) {
    return (
      <div 
        className="glass" 
        style={{ 
          textAlign: 'center', 
          padding: '60px 24px', 
          borderRadius: 'var(--radius-xl)', 
          border: '1px border-dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--color-primary-light)', 
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}
        >
          ⚖️
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>No AI Tools Selected</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '420px', margin: 0 }}>
            Search and add up to 3 AI tools above or select popular head-to-head showdowns to compare features, pricing, and capabilities.
          </p>
        </div>
      </div>
    );
  }

  // Determine top rated tool
  const highestRatedId = tools.length > 1 
    ? [...tools].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.id 
    : null;

  // Check free plan
  const hasFreePlan = (tool: Tool) => {
    return (
      tool.pricing === 'free' ||
      tool.pricing === 'freemium' ||
      tool.pricing === 'free-trial' ||
      (tool.pricingPlans && tool.pricingPlans.some((p) => p.price === '$0' || p.billingPeriod === 'free'))
    );
  };

  // Check API availability
  const hasAPI = (tool: Tool) => {
    return (
      tool.platforms.includes('API') ||
      tool.tags.includes('api') ||
      tool.features.some((f) => f.toLowerCase().includes('api'))
    );
  };

  return (
    <div 
      className="comparison-wrapper" 
      style={{ 
        margin: '24px 0', 
        borderRadius: 'var(--radius-xl)', 
        overflow: 'hidden', 
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
          <thead>
            <tr>
              <th 
                style={{ 
                  minWidth: '180px', 
                  width: '220px',
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderBottom: '2px solid var(--border-color)', 
                  padding: '24px 20px',
                  textAlign: 'left',
                  verticalAlign: 'bottom'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    HEAD-TO-HEAD MATRIX
                  </span>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Specifications
                  </span>
                </div>
              </th>

              {tools.map((tool) => {
                const isWinner = tool.id === highestRatedId && tools.length > 1;
                return (
                  <th 
                    key={tool.id} 
                    style={{ 
                      minWidth: '260px', 
                      textAlign: 'center', 
                      backgroundColor: isWinner ? 'rgba(124, 58, 237, 0.04)' : 'var(--bg-card)', 
                      borderBottom: '2px solid var(--border-color)', 
                      borderLeft: '1px solid var(--border-color)',
                      padding: '28px 20px 20px 20px',
                      position: 'relative'
                    }}
                  >
                    {isWinner && (
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: '50%', 
                          transform: 'translateX(-50%)',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '3px 12px',
                          borderBottomLeftRadius: 'var(--radius-sm)',
                          borderBottomRightRadius: 'var(--radius-sm)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)'
                        }}
                      >
                        <Award size={12} />
                        Highest Rated
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', position: 'relative' }}>
                      {/* Remove tool button */}
                      <button
                        onClick={() => onRemove(tool.id)}
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '-8px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          cursor: 'pointer',
                          color: 'var(--color-danger)',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-danger-light)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Remove from comparison"
                      >
                        <Trash size={13} />
                      </button>

                      <img
                        src={tool.logoUrl}
                        alt={tool.name}
                        style={{ 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: 'var(--radius-lg)', 
                          objectFit: 'cover', 
                          border: '2px solid var(--border-color)', 
                          boxShadow: 'var(--shadow-md)',
                          backgroundColor: 'var(--bg-secondary)'
                        }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop';
                        }}
                      />

                      <div>
                        <Link 
                          to={`/tool/${tool.slug}`}
                          style={{ 
                            fontWeight: 'var(--font-bold)', 
                            color: 'var(--text-primary)', 
                            fontSize: 'var(--text-lg)',
                            textDecoration: 'none',
                            display: 'block'
                          }}
                        >
                          {tool.name}
                        </Link>
                        <div style={{ marginTop: '6px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <span className="badge badge-pricing" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                            {tool.pricing}
                          </span>
                          <span className="badge badge-category" style={{ fontSize: '10px' }}>
                            {tool.tags?.[0] || 'AI'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Tagline row */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                Overview
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  {tool.tagline}
                </td>
              ))}
            </tr>

            {/* Rating row */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                User Rating
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ textAlign: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StarRating rating={tool.rating} size={15} />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {tool.rating > 0 ? tool.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ({tool.reviewCount || 0} community reviews)
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Free Tier Availability */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                Free Plan / Trial
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ textAlign: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  {hasFreePlan(tool) ? (
                    <span 
                      style={{ 
                        color: 'var(--color-success)', 
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'bold',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      <Check size={14} /> Available
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        color: 'var(--color-danger)', 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'bold',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      <X size={14} /> Paid Only
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* API Access */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                Developer API
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ textAlign: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  {hasAPI(tool) ? (
                    <span 
                      style={{ 
                        color: 'var(--color-primary)', 
                        backgroundColor: 'var(--color-primary-light)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'bold',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      <Zap size={14} /> Supported
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        color: 'var(--text-muted)', 
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      <X size={14} /> No API
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Platforms supported */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                Supported Platforms
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ textAlign: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {tool.platforms && tool.platforms.length > 0 ? (
                      tool.platforms.map((plat) => (
                        <span key={plat} className="badge badge-platform" style={{ padding: '3px 8px', fontSize: '10px' }}>
                          {plat}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Web</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Key features */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                Key Features
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ fontSize: 'var(--text-xs)', verticalAlign: 'top', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tool.features && tool.features.length > 0 ? (
                      tool.features.slice(0, 4).map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          <span style={{ color: 'var(--color-primary)', fontSize: '12px', marginTop: '2px' }}>✦</span>
                          <span>{feat}</span>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: 'var(--text-muted)' }}>Standard feature set</li>
                    )}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Pros */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-success)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                Top Advantages
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ fontSize: 'var(--text-xs)', verticalAlign: 'top', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {tool.pros && tool.pros.length > 0 ? (
                      tool.pros.slice(0, 3).map((pro, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          <Check size={14} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                          <span>{pro}</span>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: 'var(--text-muted)' }}>High user satisfaction</li>
                    )}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Cons */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-danger)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                Drawbacks & Limits
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ fontSize: 'var(--text-xs)', verticalAlign: 'top', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                  <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {tool.cons && tool.cons.length > 0 ? (
                      tool.cons.slice(0, 3).map((con, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <X size={14} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} />
                          <span>{con}</span>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: 'var(--text-muted)' }}>Paid tier needed for advanced power features</li>
                    )}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Action Buttons */}
            <tr>
              <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
                Action Links
              </td>
              {tools.map((tool) => (
                <td key={tool.id} style={{ textAlign: 'center', padding: '20px', borderLeft: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <a
                      href={tool.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        padding: '10px 16px',
                        fontWeight: 'bold',
                        fontSize: 'var(--text-xs)'
                      }}
                    >
                      <Globe size={14} />
                      <span>Visit {tool.name}</span>
                    </a>
                    <Link
                      to={`/tool/${tool.slug}`}
                      className="btn btn-outline btn-sm"
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        padding: '6px 12px',
                        fontSize: '11px' 
                      }}
                    >
                      Read Full Review
                    </Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

