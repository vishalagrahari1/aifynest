/* src/views/Pricing.tsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Check } from '../components/shared/Icons';
import { CashfreeModal } from '../components/shared/CashfreeModal';
import { useAuth } from '../context/AuthContext';

export const Pricing: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number } | null>(null);
  const [isCashfreeOpen, setIsCashfreeOpen] = useState(false);

  const handleOpenCashfree = (planName: string, amount: number) => {
    setSelectedPlan({ name: planName, amount });
    setIsCashfreeOpen(true);
  };

  const officialPlans = [
    {
      id: 'popular_spot',
      name: 'Popular Tools Spot',
      price: 69,
      duration: '90 Days',
      badge: null,
      description: 'Guaranteed high-visibility placement in the Popular Tools grid on the Homepage.',
      features: [
        'Homepage Popular Tools grid placement',
        '90 Days guaranteed promotion',
        'Direct outbound traffic booster',
        'Click & impression analytics',
      ],
      planParam: 'popular_spot',
    },
    {
      id: 'featured_spot',
      name: 'Featured Tools Spot',
      price: 99,
      duration: '90 Days',
      badge: null,
      description: 'Guaranteed high-visibility placement in the Featured Tools grid on the Homepage.',
      features: [
        'Homepage Featured Tools grid placement',
        '90 Days guaranteed promo',
        'Priority category positioning',
        'Verified Blue Checkmark badge',
      ],
      planParam: 'featured_spot',
    },
    {
      id: 'growth_pack',
      name: 'Growth Featured Pack',
      price: 149,
      duration: '90 Days',
      badge: 'RECOMMENDED',
      description: 'Promote your tool across Popular Tools and Featured section for 3 months.',
      features: [
        'Popular Tools + Featured Hero combo',
        '90 Days active placement',
        'Dual section Homepage exposure',
        'Verified Blue Checkmark badge',
        'Express 24-hr editor verification',
      ],
      planParam: 'growth_pack',
    },
    {
      id: 'featured_article',
      name: 'Featured + Article Package',
      price: 199,
      duration: 'Lifetime Article',
      badge: '🔥 BEST VALUE',
      description: 'Get your AI tool listed in the Featured section for 90 days and get a dedicated editorial article published on the site.',
      features: [
        'Featured Section placement for 90 days',
        'Dedicated Editorial Article published on site',
        'Permanent blog backlinks & SEO indexing',
        'Verified Blue Checkmark badge',
        'Priority search & analytics feed',
      ],
      planParam: 'featured_article',
    },
    {
      id: 'annual_pass',
      name: 'Annual Pass',
      price: 299,
      duration: '365 Days',
      badge: 'ENTERPRISE',
      description: 'Keep your AI tool continuously promoted in Popular & Featured sections all year with a dedicated editorial article published on the site.',
      features: [
        '365 Days continuous promotion',
        'Promoted in Popular & Featured all year',
        'Dedicated Editorial Article published on site',
        'Verified Blue Checkmark badge',
        'Priority support & analytics dashboard',
      ],
      planParam: 'annual_pass',
    },
  ];

  return (
    <div className="container section">
      <SEOHead
        title="Official Promotion & Pricing Plans — AIFynest"
        description="Promote your AI tool on AIFynest. Choose between Popular Tools placement, Featured Packs, or Annual Pass for high visibility."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', textAlign: 'center' }}>
        {/* Title Header */}
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
            Official Promotion & Listing Plans
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: '10px 0 0 0', lineHeight: '1.6' }}>
            Boost your AI tool's traffic, brand visibility, and user conversions with our official promo packages.
          </p>
        </div>

        {/* 5 Official Pricing Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}
          className="pricing-grid"
        >
          {officialPlans.map((plan) => (
            <div
              key={plan.id}
              style={{
                ...planCardStyle,
                border: plan.badge ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                boxShadow: plan.badge ? '0 10px 30px -10px rgba(99, 102, 241, 0.3)' : 'none',
                position: 'relative',
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    padding: '3px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={planTitleStyle}>{plan.name}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0, minHeight: '36px' }}>
                  {plan.description}
                </p>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '16px 0 8px 0' }}>
                  ${plan.price}
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    / {plan.duration}
                  </span>
                </div>
              </div>

              <ul style={featuresListStyle}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={featureItemStyle}>
                    <Check size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => handleOpenCashfree(plan.name, plan.price)}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', width: '100%', fontWeight: 'bold' }}
                >
                  Pay ${plan.price} with Cashfree
                </button>
                <Link
                  to={`/submit-tool?plan=${plan.planParam}`}
                  className="btn btn-outline"
                  style={{ fontSize: '11px', width: '100%', textAlign: 'center' }}
                >
                  Submit Listing First
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Guest Post Notice */}
        <div
          style={{
            maxWidth: '800px',
            margin: '20px auto 0 auto',
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
      </div>

      {/* Cashfree Payment Modal */}
      {selectedPlan && (
        <CashfreeModal
          isOpen={isCashfreeOpen}
          onClose={() => setIsCashfreeOpen(false)}
          planName={selectedPlan.name}
          amount={selectedPlan.amount}
          userEmail={user?.email || ''}
          onPaymentSuccess={(paymentId) => {
            console.log('Cashfree payment completed successfully:', paymentId);
          }}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .pricing-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
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

