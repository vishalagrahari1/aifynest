/* src/views/ToolDetail.tsx */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/shared/StarRating';
import { SEOHead } from '../components/shared/SEOHead';
import { Heart, Share2, Plus, Check, Award } from '../components/shared/Icons';
import { Modal } from '../components/shared/Modal';

interface ToolDetailProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  compareList: string[];
  onCompareToggle: (toolId: string) => void;
}

export const ToolDetail: React.FC<ToolDetailProps> = ({
  onToast,
  compareList,
  onCompareToggle,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const { tools, reviews, addReview, collections, toggleFavoriteTool, trackEvent, submitReport } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'pricing'>('overview');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Report modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPros, setReviewPros] = useState('');
  const [reviewCons, setReviewCons] = useState('');
  const [easeOfUse, setEaseOfUse] = useState(5);
  const [valueForMoney, setValueForMoney] = useState(5);
  const [featuresVal, setFeaturesVal] = useState(5);
  const [performance, setPerformance] = useState(5);

  const tool = tools.find((t) => t.slug === slug);

  // Track page view event
  useEffect(() => {
    if (tool) {
      const viewedKey = `viewed_${tool.id}`;
      if (!(window as any)[viewedKey]) {
        (window as any)[viewedKey] = true;
        trackEvent('tool_view', tool.id);
        
        // If sponsored tool, track sponsored impression
        if (tool.isSponsored) {
          trackEvent('sponsored_impression', tool.id);
        }
      }
    }
  }, [slug, tool]);

  // Verify access privileges for drafts/moderation queues
  const canAccess =
    tool &&
    (tool.status === 'approved' ||
      (user && (user.role === 'admin' || user.id === tool.ownerId)));

  if (!tool || !canAccess) {
    return (
      <div className="container section text-center" style={{ maxWidth: '540px' }}>
        <SEOHead 
          title="Listing Under Moderation" 
          description="This AI tool listing is currently pending review, needs revisions, or is not published yet." 
          robots="noindex, nofollow" 
        />
        <h2>Listing Under Moderation</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
          This AI tool listing is currently pending review, needs revisions, or is not published yet.
          Only administrators and the verified owner can view the draft profile.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Homepage
        </Link>
      </div>
    );
  }

  // Get reviews of this tool (only approved status)
  const toolReviews = reviews.filter((r) => r.toolId === tool.id && r.status === 'approved');

  // Verify if the user already submitted a review
  const hasReviewed = user ? reviews.some((r) => r.toolId === tool.id && r.userId === user.id) : false;

  // Determine if this tool is currently favorited
  const userFavorites = collections.find((c) => c.userId === user?.id && c.name === 'My Favorites');
  const isFavorited = userFavorites ? userFavorites.tools.includes(tool.id) : false;

  const handleFavoriteClick = () => {
    if (!user) {
      onToast('Please log in to save tools to your favorites.', 'error');
      navigate('/login');
      return;
    }
    toggleFavoriteTool(user.id, tool.id);
    onToast(isFavorited ? 'Removed from favorites' : 'Saved to favorites!', 'success');
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    trackEvent('tool_share', tool.id);
    onToast('URL copied to clipboard! Share it with your friends.', 'success');
  };

  const handleVisitToolClick = () => {
    window.open(`/go/${tool.slug}`, '_blank', 'noopener,noreferrer');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool) return;
    try {
      await submitReport(tool.id, reportReason, reportDetails);
      setIsReportModalOpen(false);
      setReportDetails('');
      onToast('Thank you! Listing report filed successfully and sent to moderators.', 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Failed to submit report. Please try again.', 'error');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onToast('Please log in to submit a review.', 'error');
      navigate('/login');
      return;
    }
    if (hasReviewed) {
      onToast('You have already submitted a review for this tool.', 'error');
      return;
    }

    addReview(tool.id, user.id, user.name, {
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      pros: reviewPros,
      cons: reviewCons,
      ratingDimensions: { easeOfUse, valueForMoney, features: featuresVal, performance },
    });

    onToast('Success! Your review has been submitted and is pending moderator approval.', 'success');
    
    // Clear form inputs
    setReviewTitle('');
    setReviewComment('');
    setReviewPros('');
    setReviewCons('');
  };

  // Find related tools using deterministic similarity scoring
  const similarTools = tools
    .filter((t) => t.id !== tool.id && t.status === 'approved')
    .map((t) => {
      let score = 0;
      
      // 1. Category (30%)
      if (t.categorySlug === tool.categorySlug) {
        score += 30;
      }
      
      // 2. Tags (20%)
      const commonTags = tool.tags.filter((tag) => t.tags.includes(tag));
      if (tool.tags.length > 0) {
        score += (commonTags.length / tool.tags.length) * 20;
      }
      
      // 3. Features (20%)
      const commonFeatures = tool.features.filter((f1) => 
        t.features.some((f2) => f2.toLowerCase().includes(f1.toLowerCase()) || f1.toLowerCase().includes(f2.toLowerCase()))
      );
      if (tool.features.length > 0) {
        score += (commonFeatures.length / tool.features.length) * 20;
      }
      
      // 4. Use Cases (15%)
      const commonUseCases = tool.useCases.filter((uc1) => 
        t.useCases.some((uc2) => uc2.toLowerCase().includes(uc1.toLowerCase()) || uc1.toLowerCase().includes(uc2.toLowerCase()))
      );
      if (tool.useCases.length > 0) {
        score += (commonUseCases.length / tool.useCases.length) * 15;
      }
      
      // 5. Pricing (10%)
      if (t.pricing === tool.pricing) {
        score += 10;
      }
      
      // 6. Platform (5%)
      const commonPlatforms = tool.platforms.filter((p) => t.platforms.includes(p));
      if (tool.platforms.length > 0) {
        score += (commonPlatforms.length / tool.platforms.length) * 5;
      }
      
      return { tool: t, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.tool);

  // Find alternatives (budget-friendly options in same category)
  const alternatives = tools
    .filter((t) => t.categorySlug === tool.categorySlug && t.id !== tool.id && t.status === 'approved')
    .map((t) => {
      const pricingWeight = { 'free': 4, 'freemium': 3, 'free-trial': 2, 'paid': 1 };
      const currentWeight = pricingWeight[tool.pricing as keyof typeof pricingWeight] || 1;
      const tWeight = pricingWeight[t.pricing as keyof typeof pricingWeight] || 1;
      
      const score = (tWeight > currentWeight ? 50 : 0) + t.rating * 5;
      return { tool: t, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.tool);

  // Find more popular tools in this category
  const moreInCategory = tools
    .filter((t) => t.categorySlug === tool.categorySlug && t.id !== tool.id && t.status === 'approved')
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 3);

  // Dynamic SEO schema markup details
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://aifynest.com';
  const schemaMarkup = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': tool.name,
      'description': tool.description,
      'applicationCategory': tool.categorySlug,
      'operatingSystem': tool.platforms.join(', '),
      'offers': {
        '@type': 'Offer',
        'price': tool.pricingPlans.length > 0 && tool.pricingPlans[0].price !== 'Custom' ? tool.pricingPlans[0].price.replace('$', '') : '0',
        'priceCurrency': 'USD',
      },
      ...(tool.rating > 0 && tool.reviewCount > 0
        ? {
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': tool.rating,
              'reviewCount': tool.reviewCount,
            },
          }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': siteUrl,
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'AI Tools',
          'item': `${siteUrl}/ai-tools`,
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': tool.categorySlug.toUpperCase(),
          'item': `${siteUrl}/ai-tools/${tool.categorySlug}`,
        },
        {
          '@type': 'ListItem',
          'position': 4,
          'name': tool.name,
          'item': `${siteUrl}/tools/${tool.slug}`,
        }
      ]
    }
  ];

  return (
    <div className="container section">
      <SEOHead
        title={`${tool.name} – Features, Pricing, Reviews & Alternatives`}
        description={`Read verified reviews, compare pricing tiers, find platform integrations, and explore alternatives for ${tool.name}. ${tool.tagline}.`}
        schemaMarkup={schemaMarkup}
        robots={tool.status === 'approved' ? 'index, follow' : 'noindex, nofollow'}
      />

      {/* Breadcrumbs */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '16px' }}>
        <Link to="/">Home</Link> &gt; <Link to="/ai-tools">AI Tools</Link> &gt;{' '}
        <Link to={`/categories/${tool.categorySlug}`}>{tool.categorySlug.toUpperCase()}</Link> &gt;{' '}
        <span>{tool.name}</span>
      </div>

      {/* Header Info Banner above the fold */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '32px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '30px',
          marginBottom: '32px',
        }}
        className="tool-header-grid"
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={tool.logoUrl}
            alt={tool.name}
            style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop';
            }}
          />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>{tool.name}</h1>
              {tool.isSponsored && <span className="badge badge-sponsored">Sponsored</span>}
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
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
              {tool.tagline}
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StarRating rating={tool.rating} size={16} />
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                  {tool.rating > 0 ? tool.rating : 'No reviews'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  ({tool.reviewCount} reviews)
                </span>
              </div>
              <span className="badge badge-pricing">{tool.pricing}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Last updated: {tool.lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          <button onClick={handleVisitToolClick} className="btn btn-primary btn-lg w-full">
            <span>Visit Tool ↗</span>
          </button>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.3' }}>
            AIFynest may earn a commission when you purchase through certain links.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
            <button onClick={handleFavoriteClick} className={`btn btn-outline ${isFavorited ? 'btn-save-active' : ''}`} title="Save tool">
              <Heart size={16} fill={isFavorited ? 'var(--color-danger)' : 'none'} />
            </button>
            <button onClick={() => onCompareToggle(tool.id)} className="btn btn-outline" title="Compare tool">
              {compareList.includes(tool.id) ? <Check size={16} /> : <Plus size={16} />}
            </button>
            <button onClick={handleShareClick} className="btn btn-outline" title="Share listing">
              <Share2 size={16} />
            </button>
          </div>
          <button 
            onClick={() => setIsReportModalOpen(true)} 
            className="btn btn-outline btn-xs w-full"
            style={{ marginTop: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <span>🚩 Report / Flag Listing</span>
          </button>
        </div>
      </div>

      {/* Owner Claim Listing Banner */}
      {!tool.ownerId && (
        <div
          style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '20px',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)' }}>
            Are you the owner of this tool? Claim this listing to manage details, track referral clicks, and sponsor ad campaigns.
          </span>
          <Link to="/claim" className="btn btn-primary btn-sm">
            Claim this listing
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        {['overview', 'pricing', 'reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '12px 6px',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }} className="tool-body-grid">
        {/* Left Column Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {activeTab === 'overview' && (
            <>
              {/* Detailed description */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '12px' }}>
                  What is {tool.name}?
                </h2>
                <p style={{ lineHeight: '1.6', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {tool.description}
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '12px' }}>
                  Key Features
                </h2>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {tool.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>

              {/* Use Cases */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '12px' }}>
                  Use Cases
                </h2>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {tool.useCases.map((use, idx) => (
                    <li key={idx}>{use}</li>
                  ))}
                </ul>
              </div>

              {/* Pros & Cons */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '12px' }}>
                  Pros & Cons
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="pros-cons-grid">
                  <div style={{ backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '10px' }}>Pros</h3>
                    <ul style={{ paddingLeft: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {tool.pros.map((pro, idx) => (
                        <li key={idx}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-danger)', marginBottom: '10px' }}>Cons</h3>
                    <ul style={{ paddingLeft: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {tool.cons.map((con, idx) => (
                        <li key={idx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Screenshot gallery */}
              {tool.screenshotUrls.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '12px' }}>
                    Screenshots
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {tool.screenshotUrls.map((scr, idx) => (
                      <img
                        key={idx}
                        src={scr}
                        alt={`${tool.name} screenshot ${idx + 1}`}
                        onClick={() => setSelectedScreenshot(scr)}
                        style={{
                          height: '140px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          objectFit: 'cover',
                          transition: 'opacity var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '12px' }}>
                  Frequently Asked Questions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <details style={faqDetailsStyle}>
                    <summary style={faqSummaryStyle}>Is {tool.name} free to use?</summary>
                    <p style={faqBodyStyle}>
                      {tool.name} is available under a {tool.pricing} model. Check the pricing section on this page to view details of the free, trial, and basic subscription pricing tiers.
                    </p>
                  </details>
                  <details style={faqDetailsStyle}>
                    <summary style={faqSummaryStyle}>Which operating systems and environments are supported?</summary>
                    <p style={faqBodyStyle}>
                      You can access {tool.name} on the following platforms: {tool.platforms.join(', ')}.
                    </p>
                  </details>
                </div>
              </div>
            </>
          )}

          {activeTab === 'pricing' && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '16px' }}>
                Pricing Plans
              </h2>
              {tool.pricingPlans.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {tool.pricingPlans.map((plan, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)' }}>{plan.name}</h4>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-primary)', margin: '12px 0' }}>
                          {plan.price}
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                            {' '}
                            / {plan.billingPeriod}
                          </span>
                        </div>
                        <ul style={{ paddingLeft: '16px', fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                          {plan.features.map((feat, fIdx) => (
                            <li key={fIdx}>{feat}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No plans declared. Please visit their pricing URL at: <a href={tool.pricingUrl} target="_blank" rel="noopener noreferrer">{tool.pricingUrl}</a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Detailed reviews summaries */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '12px' }}>
                  User Reviews & Ratings
                </h2>
                {toolReviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {toolReviews.map((rev) => (
                      <div
                        key={rev.id}
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>
                              {rev.title}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <StarRating rating={rev.rating} size={12} />
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{rev.rating} / 5</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                by {rev.userName} on {rev.date}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px' }}>
                          {rev.comment}
                        </p>
                        {rev.pros && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginBottom: '4px' }}>
                            <strong>Pros:</strong> {rev.pros}
                          </div>
                        )}
                        {rev.cons && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
                            <strong>Cons:</strong> {rev.cons}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No reviews approved for this tool yet. Be the first to share your experience!
                  </div>
                )}
              </div>

              {/* Review submit forms */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', marginBottom: '16px' }}>
                  Write a Review
                </h3>
                {hasReviewed ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    You have already submitted a review for this listing. To update, please contact our directory administrators.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="review-inputs-grid">
                      <div className="form-group">
                        <label className="form-label">Overall Star Rating</label>
                        <div style={{ padding: '8px 0' }}>
                          <StarRating rating={reviewRating} size={24} interactive onChange={setReviewRating} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Review Headline</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Indispensable for my coding workflow"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* Detailed subdimensions */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        backgroundColor: 'var(--bg-primary)',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                      }}
                      className="dimensions-grid"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Ease of Use</span>
                        <StarRating rating={easeOfUse} size={14} interactive onChange={setEaseOfUse} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Value</span>
                        <StarRating rating={valueForMoney} size={14} interactive onChange={setValueForMoney} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Features</span>
                        <StarRating rating={featuresVal} size={14} interactive onChange={setFeaturesVal} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Performance</span>
                        <StarRating rating={performance} size={14} interactive onChange={setPerformance} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Write your comment</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Detail your experience with this tool, features utilized, and suggestions..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="form-textarea"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="review-inputs-grid">
                      <div className="form-group">
                        <label className="form-label">What are the Pros?</label>
                        <input
                          type="text"
                          placeholder="e.g. Fast autocomplete speeds"
                          value={reviewPros}
                          onChange={(e) => setReviewPros(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">What are the Cons?</label>
                        <input
                          type="text"
                          placeholder="e.g. Expensive subscription rates"
                          value={reviewCons}
                          onChange={(e) => setReviewCons(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                      Submit Review
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Similar Tools, Alternatives & Category Suggestions Grid blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '28px', marginTop: '24px' }}>
            
            {/* Similar Tools */}
            {similarTools.length > 0 && (
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '16px' }}>
                  Similar AI Tools
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {similarTools.map((relTool) => (
                    <div
                      key={relTool.id}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img src={relTool.logoUrl} alt={relTool.name} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                        <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{relTool.name}</div>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                        {relTool.tagline}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span className="badge badge-pricing" style={{ fontSize: '10px' }}>{relTool.pricing}</span>
                        <Link to={`/tools/${relTool.slug}`} style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '16px' }}>
                  Alternatives
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {alternatives.map((relTool) => (
                    <div
                      key={relTool.id}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img src={relTool.logoUrl} alt={relTool.name} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                        <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{relTool.name}</div>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                        {relTool.tagline}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span className="badge badge-pricing" style={{ fontSize: '10px' }}>{relTool.pricing}</span>
                        <Link to={`/tools/${relTool.slug}`} style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* More tools in category */}
            {moreInCategory.length > 0 && (
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: '16px' }}>
                  More tools in this category
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {moreInCategory.map((relTool) => (
                    <div
                      key={relTool.id}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img src={relTool.logoUrl} alt={relTool.name} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                        <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{relTool.name}</div>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                        {relTool.tagline}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span className="badge badge-pricing" style={{ fontSize: '10px' }}>{relTool.pricing}</span>
                        <Link to={`/tools/${relTool.slug}`} style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column Specs Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Claim Banner if unclaimed */}
          {tool.claimStatus === 'unclaimed' && (
            <div
              style={{
                background: 'var(--gradient-brand)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <Award size={32} style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ color: 'white', fontSize: 'var(--text-base)', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                Own this AI Tool?
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', lineHeight: '1.4', opacity: 0.9, marginBottom: '16px' }}>
                Claim this listing to update descriptions, manage pricing, upload screenshots, respond to reviews, and sponsor campaigns.
              </p>
              <Link
                to={`/claim?toolId=${tool.id}`}
                className="btn btn-gold w-full"
                style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}
              >
                Claim This Listing
              </Link>
            </div>
          )}

          {/* Core specifications */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              Specifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: 'var(--text-xs)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Pricing Model</strong>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', textTransform: 'capitalize' }}>
                  {tool.pricing}
                </span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Category</strong>
                <Link to={`/categories/${tool.categorySlug}`} style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                  {tool.categorySlug.toUpperCase()}
                </Link>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Subcategory</strong>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                  {tool.subCategory}
                </span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Platforms Supported</strong>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {tool.platforms.map((p) => (
                    <span key={p} className="badge badge-platform">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Alternatives & Comparisons box */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              Alternatives & Compare
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Link
                to={`/alternatives/${tool.slug}`}
                className="btn btn-outline btn-sm"
                style={{ justifyContent: 'center', width: '100%', fontWeight: 'bold' }}
              >
                👥 View {tool.name} Alternatives
              </Link>
              
              {similarTools.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Side-by-Side Comparisons:</span>
                  {similarTools.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/compare/${tool.slug}-vs-${rel.slug}`}
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: '600'
                      }}
                    >
                      <span>{tool.name} vs {rel.name}</span>
                      <span>&gt;</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Screen Shot Modal Preview */}
      {selectedScreenshot && (
        <div
          onClick={() => setSelectedScreenshot(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fade-in-overlay 200ms ease-out',
          }}
        >
          <img
            src={selectedScreenshot}
            alt="Preview screenshot large"
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xl)',
            }}
          />
        </div>
      )}

      {/* REPORT MODAL */}
      <Modal isOpen={isReportModalOpen} title={`Report Listing – ${tool.name}`} onClose={() => setIsReportModalOpen(false)}>
        <form onSubmit={handleReportSubmit} style={{ padding: '12px', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>
            Is there something wrong with this tool page? Let us know so our moderation team can review it.
          </p>
          
          <div className="form-group">
            <label className="form-label">Reason for Flagging</label>
            <select className="form-input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
              <option value="spam">Spam / Copycat Listing</option>
              <option value="broken-link">Broken / Malicious Links</option>
              <option value="wrong-category">Incorrect Category or Tags</option>
              <option value="out-of-business">Defunct / Out of Business</option>
              <option value="other">Other Violation (Describe below)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Explanation Details</label>
            <textarea 
              className="form-input" 
              rows={4} 
              placeholder="Provide context for why you are flagging this listing..." 
              value={reportDetails} 
              onChange={(e) => setReportDetails(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsReportModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">
              Submit Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Style overrides for details and summaries */}
      <style>{`
        @media (max-width: 768px) {
          .tool-header-grid, .tool-body-grid {
            grid-template-columns: 1fr !important;
          }
          .pros-cons-grid, .review-inputs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const faqDetailsStyle: React.CSSProperties = {
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-secondary)',
  padding: '12px 16px',
};

const faqSummaryStyle: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  outline: 'none',
};

const faqBodyStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  marginTop: '8px',
  lineHeight: '1.5',
};
