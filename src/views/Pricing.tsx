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
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'enterprise'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleOpenCashfree = (planName: string, amount: number) => {
    setSelectedPlan({ name: planName, amount });
    setIsCashfreeOpen(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const officialPlans = [
    {
      id: 'popular_spot',
      name: 'Popular Tools Spot',
      price: 69,
      duration: '90 Days',
      badge: null,
      category: 'featured',
      description: 'Guaranteed high-visibility placement in the Popular Tools grid on the Homepage.',
      features: [
        'Homepage Popular Tools grid placement',
        '90 Days guaranteed promotion',
        'Direct outbound traffic booster',
        'Click & impression analytics feed',
        'Standard 48-hour review turnaround',
      ],
      planParam: 'popular_spot',
    },
    {
      id: 'featured_spot',
      name: 'Featured Tools Spot',
      price: 99,
      duration: '90 Days',
      badge: null,
      category: 'featured',
      description: 'Guaranteed high-visibility placement in the Featured Tools grid on the Homepage.',
      features: [
        'Homepage Featured Tools grid placement',
        '90 Days guaranteed promo',
        'Priority category positioning',
        'Verified Blue Checkmark badge',
        'Dofollow SEO backlink included',
      ],
      planParam: 'featured_spot',
    },
    {
      id: 'growth_pack',
      name: 'Growth Featured Pack',
      price: 149,
      duration: '90 Days',
      badge: 'RECOMMENDED',
      category: 'featured',
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
      category: 'enterprise',
      description: 'Get your AI tool listed in Featured for 90 days PLUS a dedicated editorial article published on the site.',
      features: [
        'Featured Section placement for 90 days',
        'Dedicated Editorial Article published on site',
        'Permanent blog backlinks & SEO indexing',
        'Verified Blue Checkmark badge',
        'Priority search & analytics feed',
        'Included in weekly newsletter blast',
      ],
      planParam: 'featured_article',
    },
    {
      id: 'annual_pass',
      name: 'Annual Pass',
      price: 299,
      duration: '365 Days',
      badge: 'ENTERPRISE',
      category: 'enterprise',
      description: 'Keep your AI tool continuously promoted in Popular & Featured sections all year with a dedicated editorial article.',
      features: [
        '365 Days continuous promotion',
        'Promoted in Popular & Featured all year',
        'Dedicated Editorial Article published on site',
        'Verified Blue Checkmark badge',
        'Priority support & analytics dashboard',
        'LLM & AI Search Indexing Optimization',
      ],
      planParam: 'annual_pass',
    },
  ];

  const filteredPlans = activeTab === 'all'
    ? officialPlans
    : officialPlans.filter((p) => p.category === activeTab);

  const faqs = [
    {
      q: 'How fast will my AI tool be listed after payment?',
      a: 'All paid listing packages are placed in our express queue and published within 24 hours (48 hours max for standard packages). Once published, your listing begins capturing referral traffic and SEO indexation immediately.',
    },
    {
      q: 'What payment options are available via Cashfree?',
      a: 'Cashfree supports Credit/Debit cards, Net Banking, UPI (Google Pay, PhonePe, Paytm), and major wallets. Payments are processed securely with instant digital confirmation.',
    },
    {
      q: 'Do I get a permanent dofollow SEO backlink?',
      a: 'Yes! All Featured, Growth, and Article packages include a clean, dofollow link directly pointing to your AI tool domain to boost your organic domain authority.',
    },
    {
      q: 'What if my tool is not approved during review?',
      a: 'If your tool does not meet our basic platform compliance guidelines, we will notify you immediately and issue a 100% full refund to your original payment method within 24 hours.',
    },
    {
      q: 'Can I update my AI tool info, logo, or URL after listing?',
      a: 'Absolutely. You can request updates to your tool title, description, category, or links anytime by contacting our team or using your verified dashboard.',
    },
  ];

  return (
    <div className="container section">
      <SEOHead
        title="Official Promotion & Pricing Plans — AIFynest"
        description="Promote your AI tool on AIFynest. Choose between Popular Tools placement, Featured Packs, or Annual Pass for high visibility and dofollow backlinks."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', textAlign: 'center' }}>
        
        {/* Top Header Hero */}
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--accent)',
              marginBottom: '16px',
            }}
          >
            ✨ 24-Hour Express Listing · Dofollow SEO Backlink · LLM Search Indexing
          </div>
          
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', lineHeight: '1.2' }}>
            Official Promotion & Listing Plans
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: '14px 0 0 0', lineHeight: '1.6' }}>
            Accelerate your AI product's traffic, gain high-quality dofollow backlinks, and get featured in front of thousands of active creators and business buyers.
          </p>

          {/* Tab Filters */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--code-bg)',
              border: '1px solid var(--border)',
              borderRadius: '30px',
              padding: '4px',
              marginTop: '28px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'all' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              All Plans (5)
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'featured' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'featured' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Popular & Featured
            </button>
            <button
              onClick={() => setActiveTab('enterprise')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'enterprise' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'enterprise' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Article & Annual Pass
            </button>
          </div>
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
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              style={{
                ...planCardStyle,
                border: plan.badge ? '2px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: plan.badge ? '0 12px 32px -8px var(--accent-bg)' : 'none',
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
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff',
                    padding: '3px 14px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px var(--accent-bg)',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={planTitleStyle}>{plan.name}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0, minHeight: '36px' }}>
                  {plan.description}
                </p>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--text-h)', margin: '16px 0 8px 0' }}>
                  ${plan.price}
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    / {plan.duration}
                  </span>
                </div>
              </div>

              <ul style={featuresListStyle}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={featureItemStyle}>
                    <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => handleOpenCashfree(plan.name, plan.price)}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Pay ${plan.price} via Cashfree
                </button>
                <Link
                  to={`/submit-tool?plan=${plan.planParam}`}
                  className="btn btn-outline"
                  style={{ fontSize: '11px', width: '100%', textAlign: 'center', border: '1px solid var(--border)' }}
                >
                  Submit Listing First
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Package Feature Comparison Matrix */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '20px auto 0 auto',
            width: '100%',
            backgroundColor: 'var(--code-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '32px 24px',
            textAlign: 'left',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px', color: 'var(--text-h)' }}>
            Package Feature Comparison
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-h)' }}>Feature / Benefit</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-h)' }}>Popular ($69)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-h)' }}>Featured ($99)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>Growth ($149)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>Article ($199)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>Annual ($299)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Duration</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>90 Days</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>90 Days</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>90 Days</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>Permanent Article</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold' }}>365 Days</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Homepage Section Placement</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>Popular Grid</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>Featured Grid</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>Dual (Popular + Featured)</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>Featured Grid</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>Dual (Popular + Featured)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Verified Checkmark Badge</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>—</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Dofollow SEO Backlink</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>—</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓ Included</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓ Included</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓ Included</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>✓ Included</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Dedicated Editorial Article</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>—</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>—</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>—</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)', fontWeight: 'bold' }}>✓ Full Article</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)', fontWeight: 'bold' }}>✓ Full Article</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Express Turnaround Time</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>48 Hours</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>24 Hours</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>24 Hours Priority</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>24 Hours Priority</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)' }}>24 Hours Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div style={{ maxWidth: '850px', margin: '10px auto 0 auto', width: '100%', textAlign: 'left' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px', color: 'var(--text-h)' }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--code-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-h)',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: 'bold', marginLeft: '12px' }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 16px 20px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '12px',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Guest Post Notice */}
        <div
          style={{
            maxWidth: '850px',
            margin: '10px auto 0 auto',
            width: '100%',
            backgroundColor: 'var(--code-bg)',
            border: '1px dashed var(--accent)',
            borderRadius: '12px',
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
            <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-h)' }}>
              📝 Looking for Guest Post Articles or Custom Agency Sponsorships?
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              For custom guest post requests, sponsored article publishing, or bulk tool promotion bundles, contact our editorial desk directly:
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
  backgroundColor: 'var(--code-bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
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
  fontWeight: 'bold',
  color: 'var(--text-h)',
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
