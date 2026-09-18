/* src/views/Advertise.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles, Check, Info } from '../components/shared/Icons';

export const Advertise: React.FC = () => {

  const plans = [
    {
      id: 'popular_spot',
      name: 'Popular Tools Spot',
      duration: '90 Days',
      price: '$69',
      description: 'Guaranteed high-visibility placement in the Popular Tools grid on the Homepage.',
      badge: null,
      features: ['Homepage Popular Tools grid placement', '90 Days guaranteed promotion', 'Direct outbound traffic booster'],
    },
    {
      id: 'featured_spot',
      name: 'Featured Tools Spot',
      duration: '90 Days',
      price: '$99',
      description: 'Guaranteed high-visibility placement in the Featured Tools grid on the Homepage.',
      badge: null,
      features: ['Homepage Featured Tools grid placement', '90 Days guaranteed promo', 'Priority category positioning'],
    },
    {
      id: 'growth_pack',
      name: 'Growth Featured Pack',
      duration: '90 Days',
      price: '$149',
      description: 'Promote your tool across Popular Tools and Featured section for 3 months.',
      badge: 'RECOMMENDED',
      features: ['Popular Tools + Featured Hero combo', '90 Days active placement', 'Verified Blue Checkmark badge'],
    },
    {
      id: 'featured_article',
      name: 'Featured + Article Package',
      duration: 'Lifetime Article',
      price: '$199',
      description: 'Get your AI tool listed in the Featured section for 90 days and get a dedicated editorial article published on the site.',
      badge: '🔥 BEST VALUE',
      features: ['Featured Section placement for 90 days', 'Dedicated Editorial Article published on site', 'Permanent blog backlinks & SEO indexing'],
    },
    {
      id: 'annual_pass',
      name: 'Annual Pass',
      duration: '365 Days',
      price: '$299',
      description: 'Keep your AI tool continuously promoted in Popular & Featured sections all year with a dedicated editorial article published on the site.',
      badge: 'ENTERPRISE',
      features: ['365 Days continuous promotion', 'Promoted in Popular & Featured all year', 'Dedicated Editorial Article published on site'],
    },
  ];

  return (
    <div className="container section">
      <SEOHead
        title="Sponsor Your AI Tool — AIFynest"
        description="Get premium visibility for your AI tool with a simple fixed-duration sponsorship plan. Choose 90 Days or 365 Days of promotion."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
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
            <span>Sponsorship Program</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
            Sponsor Your AI Tool
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '12px 0 0 0', lineHeight: '1.6' }}>
            Get maximum traffic and visibility for your AI tool with our official sponsorship packages.
          </p>
        </div>

        {/* 5 Official Sponsorship Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }} className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: plan.badge ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              {plan.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {plan.badge}
                </span>
              )}
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'bold' }}>{plan.name}</h3>
              <div style={{ margin: '12px 0 6px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>/ {plan.duration}</span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '8px 0 20px 0', minHeight: '36px', lineHeight: '1.4' }}>
                {plan.description}
              </p>

              <div style={{ marginTop: 'auto' }}>
                <Link to={`/pricing`} className="btn btn-primary w-full" style={{ fontSize: '13px', textAlign: 'center' }}>
                  Select Plan ({plan.price})
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Guest Post Banner */}
        <div
          style={{
            maxWidth: '840px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            textAlign: 'left',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              📝 Looking for Guest Post Articles?
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              For custom guest post requests, sponsored article publishing, or editorial guidelines, contact our official team:
            </p>
          </div>
          <a
            href="mailto:aifynestofficial@gmail.com"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none', fontWeight: 'bold', padding: '10px 20px', whiteSpace: 'nowrap' }}
          >
            Contact aifynestofficial@gmail.com
          </a>
        </div>

        {/* Why Sponsor Your Tool */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 20px 0', textAlign: 'center' }}>
            Why Sponsor Your Tool?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="why-grid">
            <div style={{ display: 'flex', gap: '12px' }}>
              <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '2px' }}>Fixed Pricing</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Pay once for your selected sponsorship period.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '2px' }}>Premium Visibility</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Give your AI tool additional promotional visibility across AIFynest.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '2px' }}>No Per-Click Fees</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>You are not charged every time someone clicks your tool.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '2px' }}>Simple & Transparent</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Choose your plan, pay securely via Cashfree, and start gaining traffic immediately.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclosure */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Sponsored listings are clearly labeled “SPONSORED.” Sponsorship provides additional promotional visibility but does not guarantee a specific number of impressions, clicks, leads, or conversions.
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .plans-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 576px) {
          .plans-grid, .why-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
