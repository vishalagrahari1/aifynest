/* src/views/Advertise.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles } from '../components/shared/Icons';

export const Advertise: React.FC = () => {
  return (
    <div className="container section">
      <SEOHead
        title="Advertise & Promoted Listings Campaign Options"
        description="Launch targeted advertising campaigns. Reach active buyers researching AI tools using category sponsorships, homepage featured cards, and sponsored search ads."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Title Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-gold-light)',
              color: 'var(--color-gold-hover)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={14} />
            <span>Advertising Kit</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
            Advertise on AI Hub Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '8px 0 0 0' }}>
            Scale views, click-through rates, and acquire active enterprise accounts by promoting your product in relevant search keywords and category slots.
          </p>
        </div>

        {/* Promo product options list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="ad-grid">
          {/* Ad Option 1: Featured Listing */}
          <div style={adCardStyle}>
            <h3 style={adTitleStyle}>Category Featured</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '8px 0 16px 0', lineHeight: '1.4' }}>
              Pin your tool at the top of your target category pages. Drives highly relevant traffic from users actively comparing options.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)', marginTop: 'auto', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Views:</span>
                <strong>10,000+ / mo</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Placement Slot:</span>
                <strong>Top Curation Grid</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pricing Model:</span>
                <strong>CPC ($1.00 per click)</strong>
              </div>
            </div>
            <Link to="/dashboard" className="btn btn-primary w-full">
              Sponsor Category
            </Link>
          </div>

          {/* Ad Option 2: Search Ads */}
          <div style={adCardStyle}>
            <h3 style={adTitleStyle}>Sponsored Search</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '8px 0 16px 0', lineHeight: '1.4' }}>
              Clearly labeled Promoted cards placed directly inside search results. Target specific keyphrases or developer search results.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)', marginTop: 'auto', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Views:</span>
                <strong>25,000+ / mo</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Placement Slot:</span>
                <strong>Direct Results Feed</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pricing Model:</span>
                <strong>CPC ($1.50 per click)</strong>
              </div>
            </div>
            <Link to="/dashboard" className="btn btn-primary w-full">
              Launch Search Ad
            </Link>
          </div>

          {/* Ad Option 3: Homepage Promo */}
          <div style={adCardStyle}>
            <h3 style={adTitleStyle}>Homepage Banner</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '8px 0 16px 0', lineHeight: '1.4' }}>
              Prominent placements in a dedicated sponsored grid on our homepage. Maximize impressions for newly launched tools.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)', marginTop: 'auto', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Views:</span>
                <strong>50,000+ / mo</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Placement Slot:</span>
                <strong>Hero Grid Section</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pricing Model:</span>
                <strong>CPM ($12.00 flat rate)</strong>
              </div>
            </div>
            <Link to="/dashboard" className="btn btn-primary w-full">
              Promote on Home
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ad-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const adCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  boxSizing: 'border-box',
};

const adTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--text-primary)',
};
