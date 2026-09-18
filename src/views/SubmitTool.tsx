/* src/views/SubmitTool.tsx */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/shared/SEOHead';
import { CashfreeModal } from '../components/shared/CashfreeModal';

interface SubmitToolProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export interface ListingPlanTier {
  id: string;
  name: string;
  price: number;
  badge?: string;
  description: string;
}

const LISTING_TIERS: ListingPlanTier[] = [
  {
    id: 'free',
    name: 'Standard Free Listing',
    price: 0,
    description: 'Catalog index, community reviews, standard verification queue.',
  },
  {
    id: 'popular_spot',
    name: 'Popular Tools Spot',
    price: 69,
    description: 'Guaranteed high-visibility placement in the Popular Tools grid on the Homepage for 90 days.',
  },
  {
    id: 'featured_spot',
    name: 'Featured Tools Spot',
    price: 99,
    description: 'Guaranteed high-visibility placement in the Featured Tools grid on the Homepage for 90 days.',
  },
  {
    id: 'growth_pack',
    name: 'Growth Featured Pack',
    price: 149,
    badge: 'RECOMMENDED',
    description: 'Promote your tool across Popular Tools and Featured section for 3 months.',
  },
  {
    id: 'featured_article',
    name: 'Featured + Article Package',
    price: 199,
    badge: '🔥 BEST VALUE',
    description: 'Get your AI tool listed in the Featured section for 90 days + dedicated editorial article published on the site.',
  },
  {
    id: 'annual_pass',
    name: 'Annual Pass',
    price: 299,
    badge: 'ENTERPRISE',
    description: 'Keep your AI tool continuously promoted in Popular & Featured sections all year with a dedicated editorial article.',
  },
];

export const SubmitTool: React.FC<SubmitToolProps> = ({ onToast }) => {
  const { categories, addTool } = useDatabase();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [paymentTxId, setPaymentTxId] = useState('');
  const [isCashfreeOpen, setIsCashfreeOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [pricing, setPricing] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedTierId, setSelectedTierId] = useState<string>('free');

  useEffect(() => {
    if (planParam === 'popular_spot' || planParam === 'popular' || planParam === 'plan_starter') {
      setSelectedTierId('popular_spot');
    } else if (planParam === 'featured_spot') {
      setSelectedTierId('featured_spot');
    } else if (planParam === 'growth_pack' || planParam === 'featured' || planParam === 'plan_growth') {
      setSelectedTierId('growth_pack');
    } else if (planParam === 'featured_article' || planParam === 'plan_featured_article') {
      setSelectedTierId('featured_article');
    } else if (planParam === 'annual_pass' || planParam === 'annual' || planParam === 'plan_annual') {
      setSelectedTierId('annual_pass');
    }
  }, [planParam]);

  const activeTier = LISTING_TIERS.find((t) => t.id === selectedTierId) || LISTING_TIERS[0];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeToolSubmission = (cashfreeTxId?: string) => {
    setIsSubmitting(true);
    const activeCategory = categories.find((c) => c.slug === categorySlug);
    const generatedId = 'sub_' + Math.random().toString(36).substring(2, 9);
    setSubmissionId(generatedId);
    if (cashfreeTxId) setPaymentTxId(cashfreeTxId);

    const isPaid = activeTier.price > 0 && !!cashfreeTxId;

    const durationDays = activeTier.id === 'annual_pass' ? 365 : 90;
    const sponsorshipEndDate = isPaid ? new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0] : null;

    const toolPayload = {
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      tagline: description.length > 120 ? description.substring(0, 117) + '...' : description.trim(),
      description: description.trim(),
      categorySlug,
      subCategory: activeCategory?.subcategories[0] || '',
      pricing: pricing as any,
      pricingUrl: websiteUrl.trim(),
      platforms: ['Web'] as any[],
      pricingPlans: [],
      features: [],
      useCases: [],
      pros: [],
      cons: [],
      logoUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop',
      screenshotUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop'],
      websiteUrl: websiteUrl.trim(),
      ownerId: user?.id || 'guest',
      tags: [categorySlug],
      isVerified: isPaid,
      isFeatured: isPaid && activeTier.price >= 99,
      isSponsored: isPaid,
      sponsorshipEndDate: sponsorshipEndDate,
      adminNotes: isPaid
        ? `[VERIFIED CASHFREE PAYMENT - Tx: ${cashfreeTxId}]\nSelected Tier: ${activeTier.name} ($${activeTier.price}) - Valid until ${sponsorshipEndDate}\nContact Email: ${email.trim()}\nNotes: ${additionalNotes.trim()}`
        : activeTier.price > 0
        ? `[SELECTED PLAN: ${activeTier.name} ($${activeTier.price})]\nContact Email: ${email.trim()}\nNotes: ${additionalNotes.trim()}`
        : additionalNotes ? `Contact Email: ${email.trim()}\nNotes: ${additionalNotes.trim()}` : `Contact Email: ${email.trim()}`,
      status: 'pending' as const,
    };

    addTool(toolPayload);
    setIsSubmitting(false);
    setIsSubmitted(true);
    if (isPaid) {
      onToast(`Payment of $${activeTier.price} verified! Your AI tool has been submitted.`, 'success');
    } else {
      onToast('Your AI tool has been submitted successfully for review!', 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onToast('Please enter the tool name.', 'error');
      return;
    }
    if (!websiteUrl.trim()) {
      onToast('Please enter the website URL.', 'error');
      return;
    }
    if (!description.trim()) {
      onToast('Please enter a brief description.', 'error');
      return;
    }
    if (!categorySlug) {
      onToast('Please select a category.', 'error');
      return;
    }
    if (!pricing) {
      onToast('Please select a pricing model.', 'error');
      return;
    }
    if (!email.trim()) {
      onToast('Please enter your email address.', 'error');
      return;
    }

    // If paid tier is selected, OPEN CASHFREE PAYMENT MODAL FIRST!
    if (activeTier.price > 0) {
      setIsCashfreeOpen(true);
    } else {
      // Free plan: execute submission directly
      executeToolSubmission();
    }
  };

  const handleReset = () => {
    setName('');
    setWebsiteUrl('');
    setDescription('');
    setCategorySlug('');
    setPricing('');
    setEmail(user?.email || '');
    setAdditionalNotes('');
    setSelectedTierId('free');
    setIsSubmitted(false);
    setPaymentTxId('');
  };

  return (
    <div className="container section" style={{ maxWidth: '720px', padding: '40px 20px' }}>
      <SEOHead
        title="Submit an AI Tool — AIFynest"
        description="Know a great AI tool that should be listed? Submit it here and we'll review it within 48 hours."
      />

      {/* Confirmation State */}
      {isSubmitted ? (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontSize: '54px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: '0 0 12px 0', fontFamily: 'var(--font-display)' }}>
            {paymentTxId ? 'Tool & Payment Submitted Successfully!' : 'Your AI Tool Has Been Submitted!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Thank you for submitting <strong>{name}</strong>. Our editorial team will review your tool and process your listing within <strong>{activeTier.price > 0 ? '24 hours' : '48 hours'}</strong>.
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              maxWidth: '420px',
              margin: '0 auto 32px auto',
              textAlign: 'left',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Submission Reference:</span>
              <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--color-primary)' }}>{submissionId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Selected Plan:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{activeTier.name} (${activeTier.price})</span>
            </div>
            {paymentTxId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cashfree Payment ID:</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--color-success)' }}>{paymentTxId}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{ fontWeight: 'bold', color: paymentTxId ? 'var(--color-success)' : 'var(--color-gold)' }}>
                {paymentTxId ? 'Payment Verified (Priority Queue)' : 'Pending Review'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Confirmation Email:</span>
              <span style={{ fontWeight: 'bold' }}>{email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleReset} className="btn btn-outline">
              Submit Another Tool
            </button>
            <Link to="/ai-tools" className="btn btn-primary">
              Browse Directory
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 'var(--font-bold)',
                margin: '0 0 8px 0',
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              Submit an AI Tool
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: 0, lineHeight: '1.5' }}>
              Know a great AI tool that should be listed? Submit it here and we'll review it within 48 hours.
            </p>
          </div>

          {/* Listing Plan Tiers Selection Box */}
          <div style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block', fontSize: 'var(--text-sm)' }}>
              Select Your Listing & Promotion Plan <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LISTING_TIERS.map((tier) => {
                const isSelected = selectedTierId === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id)}
                    style={{
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      position: 'relative',
                    }}
                  >
                    {tier.badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '16px',
                          backgroundColor: '#E2603A',
                          color: '#fff',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {tier.badge}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="radio"
                        name="listingTier"
                        checked={isSelected}
                        onChange={() => setSelectedTierId(tier.id)}
                        style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {tier.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {tier.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                        {tier.price === 0 ? 'FREE' : `$${tier.price}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'bold' }}>Tool Details</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Fill out the information for your AI product listing.
              </p>
            </div>

            {/* Tool Name */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'var(--font-semibold)', marginBottom: '6px' }}>
                Tool Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ChatGPT"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                style={{ fontSize: 'var(--text-sm)', padding: '12px 14px' }}
              />
            </div>

            {/* Website URL */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'var(--font-semibold)', marginBottom: '6px' }}>
                Website URL <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="form-input"
                style={{ fontSize: 'var(--text-sm)', padding: '12px 14px' }}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'var(--font-semibold)', marginBottom: '6px' }}>
                Description <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Briefly describe what the tool does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                style={{ fontSize: 'var(--text-sm)', padding: '12px 14px', lineHeight: '1.5' }}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'var(--font-semibold)', marginBottom: '6px' }}>
                Category <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                required
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="form-select"
                style={{ fontSize: 'var(--text-sm)', padding: '12px 14px' }}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Model */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'var(--font-semibold)', marginBottom: '6px' }}>
                Pricing Model <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                required
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                className="form-select"
                style={{ fontSize: 'var(--text-sm)', padding: '12px 14px' }}
              >
                <option value="">Select pricing</option>
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="free-trial">Free Trial</option>
                <option value="contact-sales">Contact Sales</option>
              </select>
            </div>

            {/* Your Email */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'var(--font-semibold)', marginBottom: '6px' }}>
                Your Email <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ fontSize: 'var(--text-sm)', padding: '12px 14px' }}
              />
            </div>

            {/* Additional Notes */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'var(--font-semibold)', marginBottom: '6px' }}>
                Additional Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any additional information..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="form-textarea"
                style={{ fontSize: 'var(--text-sm)', padding: '12px 14px', lineHeight: '1.5' }}
              />
            </div>

            {/* Dynamic Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '14px',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-bold)',
                backgroundColor: activeTier.price > 0 ? 'var(--color-primary)' : undefined,
              }}
            >
              {isSubmitting
                ? 'Processing...'
                : activeTier.price > 0
                ? `Proceed to Pay $${activeTier.price} with Cashfree`
                : 'Submit Tool for Free'}
            </button>
          </form>

          {/* Cashfree Modal Popup */}
          {activeTier.price > 0 && (
            <CashfreeModal
              isOpen={isCashfreeOpen}
              onClose={() => setIsCashfreeOpen(false)}
              planName={activeTier.name}
              amount={activeTier.price}
              userEmail={email}
              toolName={name || 'AI Tool Listing'}
              onPaymentSuccess={(payId) => {
                setIsCashfreeOpen(false);
                executeToolSubmission(payId);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SubmitTool;
