/* src/views/Advertise.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles, Check, Info, Lock } from '../components/shared/Icons';
import { paymentProvider } from '../services/payments/paymentProvider';

export const Advertise: React.FC = () => {
  const isPaymentsDisabled = !paymentProvider.isPaymentsEnabled();

  const plans = [
    {
      id: 'plan_popular',
      name: 'Popular Tools Spot',
      duration: '30 Days',
      price: '$39',
      description: 'Guaranteed high-visibility placement in the Popular Tools grid on the Homepage.',
      badge: '🔥 POPULAR CHOICE',
      features: ['Top 8 Popular Tools grid placement', 'Promoted badge tag', 'Direct outbound traffic booster'],
    },
    {
      id: 'plan_starter',
      name: 'Starter Featured',
      duration: '30 Days',
      price: '$25',
      description: 'Give your AI tool featured promotion visibility across category banners.',
      badge: null,
      features: ['Featured Promotions carousel', 'Verified badge tag', 'Category page priority'],
    },
    {
      id: 'plan_growth',
      name: 'Growth Pack',
      duration: '90 Days',
      price: '$69',
      description: 'Promote your tool across Popular Tools and Featured section for 3 months.',
      badge: 'RECOMMENDED',
      features: ['Popular Tools + Featured combo', '90 Days active placement', 'Priority search placement'],
    },
    {
      id: 'plan_annual',
      name: 'Annual Pass',
      duration: '365 Days',
      price: '$129',
      description: 'Keep your AI tool continuously promoted in Popular & Featured sections all year.',
      badge: 'BEST VALUE',
      features: ['365 Days uninterrupted promo', 'All placement zones included', 'Dedicated support & analytics'],
    },
  ];

  return (
    <div className="container section">
      <SEOHead
        title="Sponsor Your AI Tool — AIFynest"
        description="Get premium visibility for your AI tool with a simple fixed-duration sponsorship plan. Choose 30, 90, 180, or 365 days of promotion."
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
            Get more visibility for your AI tool with a simple fixed-duration sponsorship. Choose how long you want your tool promoted. Pay once and enjoy sponsored placement for your selected period.
          </p>
        </div>

        {/* Payments Coming Soon Banner */}
        {isPaymentsDisabled && (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '4px solid var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 24px',
              maxWidth: '840px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <Lock size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
                Sponsorship Payments Coming Soon
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Online sponsorship payments are currently being configured. You can review sponsorship plans now. Purchases will become available once payments are enabled through Stripe.
              </p>
            </div>
          </div>
        )}

        {/* Four Sponsorship Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="plans-grid">
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
                {isPaymentsDisabled ? (
                  <button className="btn btn-outline w-full" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                    Payments Coming Soon
                  </button>
                ) : (
                  <Link to={`/dashboard?tab=sponsorship&plan=${plan.id}`} className="btn btn-primary w-full">
                    Sponsor for {plan.price}
                  </Link>
                )}
              </div>
            </div>
          ))}
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
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Choose your duration, pay securely, and know exactly how long your sponsorship lasts.</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div style={{ maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 20px 0', textAlign: 'center' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="how-grid">
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>STEP 1</div>
              <strong style={{ fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>Choose Your Tool</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Select an AI tool you own.</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>STEP 2</div>
              <strong style={{ fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>Select a Plan</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Choose 1, 3, 6, or 12 months.</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>STEP 3</div>
              <strong style={{ fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>Complete Payment</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>When payments are available, pay via Stripe.</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>STEP 4</div>
              <strong style={{ fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>Get Sponsored</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>After payment verification, your tool receives placement.</span>
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
          .plans-grid, .why-grid, .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
