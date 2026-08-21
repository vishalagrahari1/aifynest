/* src/views/Pricing.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Check } from '../components/shared/Icons';

export const Pricing: React.FC = () => {
  return (
    <div className="container section">
      <SEOHead
        title="Directory Submission & Premium Pricing Plans"
        description="Verify and update your AI tool listings. Choose between free directory submissions, premium owner profiles, or custom sponsorship campaigns."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'center' }}>
        {/* Title Header */}
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
            Simple Pricing for Tool Owners
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '8px 0 0 0' }}>
            List your artificial intelligence product, claim listing ownership, and unlock premium analytics to increase CTR conversions.
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            maxWidth: '960px',
            margin: '0 auto',
            width: '100%',
          }}
          className="pricing-grid"
        >
          {/* Free plan */}
          <div style={planCardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={planTitleStyle}>Standard Listing</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Get listed in our directory catalog.</p>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', margin: '16px 0' }}>
                $0
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}> / lifetime</span>
              </div>
            </div>
            <ul style={featuresListStyle}>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Basic Listing Details</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>1 Primary Category</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Community Review Collection</span></li>
            </ul>
            <Link to="/submit-tool" className="btn btn-outline" style={{ marginTop: 'auto' }}>
              Submit For Free
            </Link>
          </div>

          {/* Premium Plan */}
          <div style={{ ...planCardStyle, border: '2px solid var(--color-primary)', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '2px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '9px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Most Popular
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={planTitleStyle}>Verified Premium</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Optimize conversion and edit custom content.</p>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--color-primary)', margin: '16px 0' }}>
                $29
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}> / month</span>
              </div>
            </div>
            <ul style={featuresListStyle}>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Verified Blue Check Badge</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Add Pricing Plans & Screenshots</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Claim Owner Dashboard Analytics</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Expedited 6-Hour Review Safety</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Respond to Customer Reviews</span></li>
            </ul>
            <Link to="/submit-tool" className="btn btn-primary" style={{ marginTop: 'auto' }}>
              List Premium
            </Link>
          </div>

          {/* Sponsoring Plan */}
          <div style={planCardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={planTitleStyle}>Sponsored Growth</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Maximize traffic on search results.</p>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', margin: '16px 0' }}>
                $99
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}> / month</span>
              </div>
            </div>
            <ul style={featuresListStyle}>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>All Verified Premium Features</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Featured Listing in Target Category</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Sponsored Banners in Search Results</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>$100 Ad Campaigns Seed Credits</span></li>
              <li style={featureItemStyle}><Check size={14} style={{ color: 'var(--color-success)' }} /> <span>Enterprise API Analytics Feeds</span></li>
            </ul>
            <Link to="/advertise" className="btn btn-outline" style={{ marginTop: 'auto' }}>
              Learn Sponsoring
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const planCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '30px 24px',
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  height: '100%',
  boxSizing: 'border-box',
};

const planTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
};

const featuresListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '24px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const featureItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
};
