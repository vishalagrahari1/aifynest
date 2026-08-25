/* src/components/comparison/ComparisonTable.tsx */
import React from 'react';
import type { Tool } from '../../utils/seedData';
import { StarRating } from '../shared/StarRating';
import { Globe, Trash, Check, X } from '../shared/Icons';

interface ComparisonTableProps {
  tools: Tool[];
  onRemove: (id: string) => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ tools, onRemove }) => {
  if (tools.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        No tools selected. Add tools from the directory to start comparing.
      </div>
    );
  }

  // Check if a tool has a free plan
  const hasFreePlan = (tool: Tool) => {
    return (
      tool.pricing === 'free' ||
      tool.pricing === 'freemium' ||
      tool.pricing === 'free-trial' ||
      tool.pricingPlans.some((p) => p.price === '$0' || p.billingPeriod === 'free')
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
    <div className="table-container" style={{ margin: '20px 0', border: '1px solid var(--border-color)' }}>
      <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ minWidth: '150px', backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)', padding: '16px' }}>Feature / Tool</th>
            {tools.map((tool) => (
              <th key={tool.id} style={{ minWidth: '220px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)', padding: '24px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative' }}>
                  {/* Remove tool from compare */}
                  <button
                    onClick={() => onRemove(tool.id)}
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '-4px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      color: 'var(--color-danger)',
                      width: '26px',
                      height: '26px',
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
                    <Trash size={12} />
                  </button>
                  <img
                    src={tool.logoUrl}
                    alt={tool.name}
                    style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop';
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>{tool.name}</div>
                    <span className="badge badge-pricing" style={{ fontSize: '10px', marginTop: '6px' }}>{tool.pricing}</span>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Tagline row */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)' }}>Tagline</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
                {tool.tagline}
              </td>
            ))}
          </tr>

          {/* Rating row */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)' }}>Rating</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <StarRating rating={tool.rating} size={14} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                    {tool.rating > 0 ? `${tool.rating} / 5` : 'No reviews'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    ({tool.reviewCount} reviews)
                  </span>
                </div>
              </td>
            ))}
          </tr>

          {/* Free Tier Availability */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)' }}>Free Plan / Trial</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ textAlign: 'center' }}>
                {hasFreePlan(tool) ? (
                  <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={16} /> Yes
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <X size={16} /> No
                  </span>
                )}
              </td>
            ))}
          </tr>

          {/* API Access */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)' }}>API Available</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ textAlign: 'center' }}>
                {hasAPI(tool) ? (
                  <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={16} /> Yes
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <X size={16} /> No
                  </span>
                )}
              </td>
            ))}
          </tr>

          {/* Platforms supported */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)' }}>Platforms</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {tool.platforms.map((plat) => (
                    <span key={plat} className="badge badge-platform" style={{ padding: '1px 5px' }}>
                      {plat}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </tr>

          {/* Key features */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)' }}>Features</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ fontSize: 'var(--text-xs)', verticalAlign: 'top' }}>
                <ul style={{ paddingLeft: '16px', margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {tool.features.slice(0, 4).map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>

          {/* Pros */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-success)' }}>Pros</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ fontSize: 'var(--text-xs)', verticalAlign: 'top', color: 'var(--color-success)' }}>
                <ul style={{ paddingLeft: '16px', margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {tool.pros.slice(0, 3).map((pro, idx) => (
                    <li key={idx}>{pro}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>

          {/* Cons */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-danger)' }}>Cons</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ fontSize: 'var(--text-xs)', verticalAlign: 'top', color: 'var(--color-danger)' }}>
                <ul style={{ paddingLeft: '16px', margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {tool.cons.slice(0, 3).map((con, idx) => (
                    <li key={idx}>{con}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>

          {/* CTA visit website */}
          <tr>
            <td style={{ fontWeight: 'var(--font-semibold)' }}>Website Link</td>
            {tools.map((tool) => (
              <td key={tool.id} style={{ textAlign: 'center' }}>
                <a
                  href={tool.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', padding: '6px 12px' }}
                >
                  <Globe size={12} />
                  <span>Visit {tool.name}</span>
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
