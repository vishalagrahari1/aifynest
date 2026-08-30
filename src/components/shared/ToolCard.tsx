/* src/components/shared/ToolCard.tsx */
import React, { useState } from 'react';
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
  const [showShare, setShowShare] = useState(false);

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShare(!showShare);
  };

  const handleShareX = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = encodeURIComponent(`${window.location.origin}/tools/${tool.slug}`);
    const text = encodeURIComponent(`Check out ${tool.name} — ${tool.tagline} on AIFynest!`);
    window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank');
    setShowShare(false);
  };

  const handleShareLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = encodeURIComponent(`${window.location.origin}/tools/${tool.slug}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank');
    setShowShare(false);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/tools/${tool.slug}`;
    navigator.clipboard.writeText(link);
    onToast('Link copied to clipboard!', 'success');
    setShowShare(false);
  };

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
      onMouseLeave={() => setShowShare(false)}
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
          {(() => {
            if (!tool.lastUpdated || !tool.isVerified) return null;
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const isRecent = (Date.now() - new Date(tool.lastUpdated).getTime()) <= THIRTY_DAYS_MS;
            return isRecent ? <span className="badge badge-verified">✓ Verified</span> : null;
          })()}
          {(() => {
            if (!tool.lastUpdated) return null;
            const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
            const isNew = (Date.now() - new Date(tool.lastUpdated).getTime()) <= FOURTEEN_DAYS_MS;
            return isNew ? <span className="badge badge-new" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>🆕 New</span> : null;
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          {/* Share Trigger */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={handleShareClick}
              className="btn-icon"
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)'
              }}
              title="Share this AI Tool"
            >
              <ShareIcon size={16} />
            </button>
            {showShare && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  width: '160px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <button onClick={handleShareX} className="dropdown-link" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', padding: '6px 8px' }}>
                  <span>🐦 Share on X</span>
                </button>
                <button onClick={handleShareLinkedIn} className="dropdown-link" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', padding: '6px 8px' }}>
                  <span>💼 Share on LinkedIn</span>
                </button>
                <button onClick={handleCopyLink} className="dropdown-link" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', padding: '6px 8px' }}>
                  <span>🔗 Copy Link</span>
                </button>
              </div>
            )}
          </div>

          {/* Bookmark Trigger */}
          <button
            onClick={handleFavoriteClick}
            className={`btn-icon ${isFavorited ? 'btn-save-active' : ''}`}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-full)',
              padding: '6px',
            }}
            title={isFavorited ? 'Remove from Saved' : 'Save to Favorites'}
          >
            <Heart size={18} fill={isFavorited ? 'var(--color-danger)' : 'none'} />
          </button>
        </div>
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

const ShareIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

