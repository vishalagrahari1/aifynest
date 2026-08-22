/* src/components/shared/ToolCard.tsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tool } from '../../utils/seedData';
import { StarRating } from './StarRating';
import { Heart, Globe, Plus, Check } from './Icons';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';

interface ToolCardProps {
  tool: Tool;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isCompareChecked?: boolean;
  onCompareToggle?: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onToast,
  isCompareChecked = false,
  onCompareToggle,
}) => {
  const { toggleFavoriteTool, collections, trackEvent } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine if this tool is currently favorited
  const userFavorites = collections.find((c) => c.userId === user?.id && c.name === 'My Favorites');
  const isFavorited = userFavorites ? userFavorites.tools.includes(tool.id) : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onToast('Please log in to save tools to your favorites.', 'error');
      navigate('/login');
      return;
    }
    toggleFavoriteTool(user.id, tool.id);
    onToast(isFavorited ? 'Removed from favorites' : 'Added to favorites!', 'success');
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompareToggle) {
      onCompareToggle();
    }
  };

  const handleVisitToolClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Track outbound click event
    trackEvent('tool_click', tool.id);
    window.open(tool.websiteUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    // Track view event
    trackEvent('tool_view', tool.id);
    navigate(`/tools/${tool.slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`card ${tool.isSponsored ? 'glass' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        border: tool.isSponsored
          ? '2px solid var(--color-primary)'
          : tool.isFeatured
          ? '1px solid var(--color-gold)'
          : '1px solid var(--border-color)',
        backgroundColor: tool.isSponsored ? 'var(--color-primary-light)' : 'var(--bg-card)',
      }}
    >
      {/* Badges bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {tool.isSponsored && <span className="badge badge-sponsored">Sponsored</span>}
          {tool.isFeatured && <span className="badge badge-featured">Featured</span>}
          {tool.isVerified && <span className="badge badge-verified">Verified</span>}
        </div>
        <button
          onClick={handleFavoriteClick}
          className={`btn-icon ${isFavorited ? 'btn-save-active' : ''}`}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-full)',
          }}
          title={isFavorited ? 'Remove from Saved' : 'Save to Favorites'}
        >
          <Heart size={18} fill={isFavorited ? 'var(--color-danger)' : 'none'} />
        </button>
      </div>

      {/* Tool Header info */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
        <img
          src={tool.logoUrl}
          alt={`${tool.name} logo`}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            objectFit: 'cover',
            border: '1px solid var(--border-color)',
          }}
          onError={(e) => {
            // Fallback placeholder image
            e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop';
          }}
        />
        <div style={{ overflow: 'hidden' }}>
          <h3
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semibold)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tool.name}
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {tool.subCategory}
          </span>
        </div>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          marginBottom: '16px',
          flexGrow: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {tool.tagline}
      </p>

      {/* Rating & Pricing Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StarRating rating={tool.rating} size={14} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
            {tool.rating > 0 ? tool.rating : 'N/A'}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            ({tool.reviewCount})
          </span>
        </div>

        <span className="badge badge-pricing" style={{ fontSize: '11px', padding: '3px 8px' }}>
          {(() => {
            const plans = tool.pricingPlans || [];
            const paidPlans = plans.filter(p => p.price && p.price !== '$0');
            let priceLabel = '';
            if (paidPlans.length > 0) {
              const sortedPlans = [...paidPlans].sort((a, b) => {
                const valA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
                const valB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
                return valA - valB;
              });
              if (sortedPlans[0]) {
                priceLabel = `• ${sortedPlans[0].price}`;
                if (sortedPlans[0].billingPeriod === 'monthly') priceLabel += '/mo';
                else if (sortedPlans[0].billingPeriod === 'yearly') priceLabel += '/yr';
              }
            }
            const typeLabel = tool.pricing.charAt(0).toUpperCase() + tool.pricing.slice(1).replace('-', ' ');
            return priceLabel ? `${typeLabel} ${priceLabel}` : typeLabel;
          })()}
        </span>
      </div>

      {/* Platforms and CTA actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        {/* Platforms display */}
        <div style={{ display: 'flex', gap: '4px', overflow: 'hidden' }}>
          {tool.platforms.slice(0, 3).map((platform) => (
            <span key={platform} className="badge badge-platform" style={{ padding: '1px 5px' }}>
              {platform}
            </span>
          ))}
          {tool.platforms.length > 3 && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{tool.platforms.length - 3}
            </span>
          )}
        </div>

        {/* CTA Stack */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {onCompareToggle && (
            <button
              onClick={handleCompareClick}
              className={`btn btn-sm ${isCompareChecked ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
              title="Compare with other tools"
            >
              {isCompareChecked ? <Check size={14} /> : <Plus size={14} />}
            </button>
          )}

          <button
            onClick={handleVisitToolClick}
            className="btn btn-primary btn-sm"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <Globe size={12} />
            <span>Visit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
