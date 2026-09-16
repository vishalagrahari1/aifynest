import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/shared/SEOHead';
import { CashfreeModal } from '../components/shared/CashfreeModal';

interface SubmitToolProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SubmitTool: React.FC<SubmitToolProps> = ({ onToast }) => {
  const { categories, addTool } = useDatabase();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [isCashfreeOpen, setIsCashfreeOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [pricing, setPricing] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [packageAmount, setPackageAmount] = useState<number>(0);

  useEffect(() => {
    if (planParam === 'popular' || planParam === 'plan_starter') {
      setSelectedPackage('Popular Tools Spot');
      setPackageAmount(39);
    } else if (planParam === 'featured' || planParam === 'plan_growth') {
      setSelectedPackage('Growth Featured Pack');
      setPackageAmount(69);
    } else if (planParam === 'featured_article' || planParam === 'plan_featured_article') {
      setSelectedPackage('Featured & Article Package');
      setPackageAmount(129);
    } else if (planParam === 'premium') {
      setSelectedPackage('Verified Premium Plan');
      setPackageAmount(29);
    }
  }, [planParam]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    const activeCategory = categories.find((c) => c.slug === categorySlug);
    const generatedId = 'sub_' + Math.random().toString(36).substring(2, 9);
    setSubmissionId(generatedId);

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
      adminNotes: selectedPackage
        ? `[Selected Package: ${selectedPackage}]\nContact Email: ${email.trim()}\nNotes: ${additionalNotes.trim()}`
        : additionalNotes ? `Contact Email: ${email.trim()}\nNotes: ${additionalNotes.trim()}` : `Contact Email: ${email.trim()}`,
      status: 'pending' as const,
    };

    addTool(toolPayload);
    setIsSubmitting(false);
    setIsSubmitted(true);
    onToast('Your AI tool has been submitted successfully for review!', 'success');
  };

  const handleReset = () => {
    setName('');
    setWebsiteUrl('');
    setDescription('');
    setCategorySlug('');
    setPricing('');
    setEmail(user?.email || '');
    setAdditionalNotes('');
    setIsSubmitted(false);
  };

  return (
    <div className="container section" style={{ maxWidth: '680px', padding: '40px 20px' }}>
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
            Your AI Tool Has Been Submitted!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Thank you for submitting <strong>{name}</strong>. Our editorial team will review your tool and list it within <strong>48 hours</strong>.
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              maxWidth: '380px',
              margin: '0 auto 32px auto',
              textAlign: 'left',
              fontSize: 'var(--text-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Submission Reference:</span>
              <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--color-primary)' }}>{submissionId}</span>
            </div>
            {selectedPackage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Selected Plan:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{selectedPackage}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-gold)' }}>Pending Review</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Confirmation Sent To:</span>
              <span style={{ fontWeight: 'bold' }}>{email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {packageAmount > 0 && (
              <button
                onClick={() => setIsCashfreeOpen(true)}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-primary)', fontWeight: 'bold' }}
              >
                💳 Pay ${packageAmount} with Cashfree (UPI / Card)
              </button>
            )}
            <button onClick={handleReset} className="btn btn-outline">
              Submit Another Tool
            </button>
            <Link to="/pricing" className="btn btn-outline">
              Explore Paid Plans
            </Link>
          </div>

          {/* Cashfree Modal for Submission Payment */}
          {packageAmount > 0 && (
            <CashfreeModal
              isOpen={isCashfreeOpen}
              onClose={() => setIsCashfreeOpen(false)}
              planName={selectedPackage || 'AI Tool Listing Plan'}
              amount={packageAmount}
              userEmail={email}
              toolName={name}
              onPaymentSuccess={(payId) => {
                console.log('Cashfree payment completed for submission:', payId);
              }}
            />
          )}
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

          {/* Selected Plan Banner if passed from pricing */}
          {selectedPackage && (
            <div
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                <strong>Requested Plan:</strong> {selectedPackage}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Selected
              </span>
            </div>
          )}

          {/* Visibility Banner Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 28px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Want more visibility?
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Get featured placement, a dedicated review, and reach thousands more users with our pricing plans starting at $99.
              </p>
            </div>
            <Link
              to="/pricing"
              className="btn btn-primary"
              style={{
                whiteSpace: 'nowrap',
                padding: '10px 20px',
                fontWeight: 'var(--font-semibold)',
                flexShrink: 0,
              }}
            >
              See Plans
            </Link>
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

            {/* Submit Button */}
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
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Tool'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubmitTool;
