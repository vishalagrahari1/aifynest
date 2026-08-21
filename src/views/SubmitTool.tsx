/* src/views/SubmitTool.tsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/shared/SEOHead';

interface SubmitToolProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SubmitTool: React.FC<SubmitToolProps> = ({ onToast }) => {
  const { categories, addTool } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Phase tracker: 'landing' | 'wizard' | 'confirmation'
  const [phase, setPhase] = useState<'landing' | 'wizard' | 'confirmation'>('landing');
  const [wizardStep, setWizardStep] = useState(1);
  const [submissionId, setSubmissionId] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'draft'>('pending');

  // Form Fields
  // Step 1: Basic Information
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Categorization
  const [categorySlug, setCategorySlug] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [useCases, setUseCases] = useState('');
  const [industries, setIndustries] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Web']);

  // Step 3: Features & Specs
  const [mainFeatures, setMainFeatures] = useState('');
  const [integrations, setIntegrations] = useState('');
  const [apiAvailable, setApiAvailable] = useState(false);
  const [isOpenSource, setIsOpenSource] = useState(false);

  // Step 4: Pricing Options
  const [pricing, setPricing] = useState<'free' | 'freemium' | 'paid' | 'free-trial' | 'contact-sales'>('free');
  const [plans, setPlans] = useState<{ name: string; price: string; period: string }[]>([
    { name: 'Free Plan', price: '$0', period: 'forever' }
  ]);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanPeriod, setNewPlanPeriod] = useState('monthly');

  // Step 5: Media & Socials
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Step 6: Company Details
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [founderBio, setFounderBio] = useState('');

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  const handlePlatformChange = (plat: string) => {
    if (platforms.includes(plat)) {
      setPlatforms(platforms.filter((p) => p !== plat));
    } else {
      setPlatforms([...platforms, plat]);
    }
  };

  const handleAddPlan = () => {
    if (!newPlanName || !newPlanPrice) {
      onToast('Plan name and price are required.', 'error');
      return;
    }
    setPlans([...plans, { name: newPlanName, price: newPlanPrice, period: newPlanPeriod }]);
    setNewPlanName('');
    setNewPlanPrice('');
    onToast('Pricing plan added to build structure!', 'success');
  };

  const handleRemovePlan = (idx: number) => {
    setPlans(plans.filter((_, i) => i !== idx));
  };

  const cleanList = (str: string) =>
    str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const executeSubmission = (status: 'pending' | 'draft') => {
    if (!user) {
      onToast('You must be logged in to submit an AI tool.', 'error');
      navigate('/login');
      return;
    }

    const randomId = 'sub_' + Math.random().toString(36).substr(2, 9);
    setSubmissionId(randomId);
    setSubmissionStatus(status);

    const toolPayload = {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      tagline,
      description,
      categorySlug,
      subCategory: subCategory || (activeCategory ? activeCategory.subcategories[0] : ''),
      pricing,
      pricingUrl: websiteUrl + '/pricing',
      platforms: platforms as any[],
      pricingPlans: plans.map(p => ({
        name: p.name,
        price: p.price,
        billingPeriod: p.period as any,
        features: ['Access basic dashboard operations']
      })),
      features: cleanList(mainFeatures),
      useCases: cleanList(useCases),
      pros: ['Saves time', 'Developer friendly interface'],
      cons: ['Requires internet connectivity'],
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop',
      screenshotUrls: screenshotUrl ? [screenshotUrl] : [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop'
      ],
      websiteUrl,
      ownerId: user.id,
      tags: [...cleanList(mainFeatures).map((f) => f.toLowerCase()), ...cleanList(useCases).map((u) => u.toLowerCase())],
      isVerified: false,
      isFeatured: false,
      isSponsored: false,
      // If draft status, we flag it appropriately
      claimStatus: 'claimed' as const,
      status: status as any,
    };

    // Store in Local DB
    addTool(toolPayload);

    onToast(
      status === 'pending'
        ? 'AI Tool submitted for verification review!'
        : 'Draft saved. You can manage this listing under dashboard listings.',
      'success'
    );
    setPhase('confirmation');
  };

  return (
    <div className="container section" style={{ maxWidth: '800px' }}>
      <SEOHead title="Submit Your AI Tool — AIFynest" description="Submit your AI tool on AIFynest to reach thousands of active developers, startups, and founders." />

      {/* PHASE 1: LANDING HERO */}
      {phase === 'landing' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '40px' }} className="hero-landing">
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', margin: '0 0 12px 0', fontFamily: 'var(--font-display)' }}>
              Get Your AI Tool Discovered on AIFynest
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', maxWidth: '600px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
              List your AI product in front of people actively searching for AI solutions.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setPhase('wizard')} className="btn btn-primary btn-lg" style={{ padding: '14px 28px' }}>
                Start Your Free Listing
              </button>
              <a href="#benefits" className="btn btn-outline btn-lg" style={{ padding: '14px 28px' }}>
                Learn Benefits
              </a>
            </div>
          </div>

          {/* Benefits Grid */}
          <div id="benefits" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            <div style={benefitCardStyle}>
              <div style={iconCircleStyle}>🚀</div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: '8px 0' }}>Get Discovered</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                Expose your app to over 100k+ active developers and creators searching for products daily.
              </p>
            </div>
            <div style={benefitCardStyle}>
              <div style={iconCircleStyle}>⭐</div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: '8px 0' }}>Collect Reviews</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                Build high-converting social proof with user feedback and stars system directly.
              </p>
            </div>
            <div style={benefitCardStyle}>
              <div style={iconCircleStyle}>📈</div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: '8px 0' }}>Track Analytics</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                Trace website outbound click triggers and details view statistics in real time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: MULTI-STEP WIZARD */}
      {phase === 'wizard' && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '40px' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Step {wizardStep} of 7: {
                wizardStep === 1 ? 'Basic Info' :
                wizardStep === 2 ? 'Categorization' :
                wizardStep === 3 ? 'Features & Specs' :
                wizardStep === 4 ? 'Pricing Structure' :
                wizardStep === 5 ? 'Screenshots & Media' :
                wizardStep === 6 ? 'Company Context' : 'Listing Live Preview'
              }
            </span>
            <div style={{ width: '150px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(wizardStep / 7) * 100}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 200ms ease-out' }} />
            </div>
          </div>

          {/* STEP 1: BASIC INFORMATION */}
          {wizardStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={wizardHeaderStyle}>Core Information</h2>
              <div className="form-group">
                <label className="form-label">Tool Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WriterAI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Website URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://writerai.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Logo Link URL (HTTPS)</label>
                <input
                  type="url"
                  placeholder="https://writerai.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Short Description (Tagline) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-powered writing assistant for blogs and newsletters"
                  maxLength={120}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Full Product Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide a comprehensive product summary. Describe the features, benefits, and how it helps creators."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORIZATION */}
          {wizardStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={wizardHeaderStyle}>Categories & Deployment Channels</h2>
              <div style={gridStyle}>
                <div className="form-group">
                  <label className="form-label">Primary Category *</label>
                  <select
                    required
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subcategory *</label>
                  <select
                    required
                    disabled={!categorySlug}
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Subcategory</option>
                    {activeCategory?.subcategories.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Use Cases (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. copywriting, blog generation, content marketing"
                  value={useCases}
                  onChange={(e) => setUseCases(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Industries (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Marketing, SaaS, E-commerce"
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Supported Platforms</label>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {['Web', 'Windows', 'Mac', 'iOS', 'Android', 'Chrome Extension', 'API'].map((plat) => (
                    <label key={plat} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={platforms.includes(plat)}
                        onChange={() => handlePlatformChange(plat)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span>{plat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FEATURES & SPECS */}
          {wizardStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={wizardHeaderStyle}>Features & Technology Integrations</h2>
              <div className="form-group">
                <label className="form-label">Key Features (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. SEO analyzer, tone control, real-time collaboration"
                  value={mainFeatures}
                  onChange={(e) => setMainFeatures(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Integrations (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. WordPress, Chrome, Google Docs, Slack"
                  value={integrations}
                  onChange={(e) => setIntegrations(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={apiAvailable}
                    onChange={(e) => setApiAvailable(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>Developer API Available</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isOpenSource}
                    onChange={(e) => setIsOpenSource(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>Open Source Platform</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: PRICING PLANS */}
          {wizardStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={wizardHeaderStyle}>Pricing Plans</h2>
              <div className="form-group">
                <label className="form-label">Core Pricing Model</label>
                <select
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value as any)}
                  className="form-select"
                >
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                  <option value="free-trial">Free Trial</option>
                  <option value="contact-sales">Contact Sales</option>
                </select>
              </div>

              {/* Build pricing plans */}
              <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create Pricing Tiers</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', alignItems: 'flex-end', marginBottom: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>Plan Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Pro Suite"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>Price ($)</label>
                    <input
                      type="text"
                      placeholder="e.g. $29"
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>Period</label>
                    <select
                      value={newPlanPeriod}
                      onChange={(e) => setNewPlanPeriod(e.target.value)}
                      className="form-select"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Yearly</option>
                      <option value="one-time">One-time</option>
                      <option value="free">Free</option>
                    </select>
                  </div>
                  <button type="button" onClick={handleAddPlan} className="btn btn-primary btn-sm" style={{ padding: '10px' }}>
                    Add Plan
                  </button>
                </div>

                {/* Listing added plans */}
                {plans.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {plans.map((p, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{p.name} - {p.price} / {p.period}</span>
                        <button type="button" onClick={() => handleRemovePlan(index)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '11px', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: MEDIA & SOCIALS */}
          {wizardStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={wizardHeaderStyle}>Media Upload & Project Demos</h2>
              <div className="form-group">
                <label className="form-label">Screenshot Link URL (HTTPS)</label>
                <input
                  type="url"
                  placeholder="https://writerai.com/screenshot.png"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Demo Link URL</label>
                <input
                  type="url"
                  placeholder="https://writerai.com/demo"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">YouTube Video Embed Link URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/embed/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="socials-grid">
                <div className="form-group">
                  <label className="form-label">Twitter Profile Link</label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/..."
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">LinkedIn Profile Link</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub Project Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: COMPANY & FOUNDER */}
          {wizardStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={wizardHeaderStyle}>Builder Profile Details</h2>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Labs Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Website URL</label>
                <input
                  type="url"
                  placeholder="https://ailabscorp.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Verification Email *</label>
                <input
                  type="email"
                  required
                  placeholder="builder@ailabscorp.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Founder Biography / Company Context</label>
                <textarea
                  rows={3}
                  placeholder="Tell our review editors about your team background, founding objectives..."
                  value={founderBio}
                  onChange={(e) => setFounderBio(e.target.value)}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {/* STEP 7: LISTING PREVIEW */}
          {wizardStep === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={wizardHeaderStyle}>Listing Public Card & Page Preview</h2>

              <div style={{ border: '2px dashed var(--color-primary)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Live Preview Mode
                </span>
                
                {/* Visual Tool Card Mockup */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                    <img src={logoUrl || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop'} alt={name} style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{name || 'My AI Tool'}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subCategory || 'Select Subcategory'}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>{tagline || 'Short tagline description here.'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-pricing">{pricing}</span>
                    <button className="btn btn-primary btn-sm" disabled style={{ padding: '4px 10px', fontSize: '11px' }}>Visit Website</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            {wizardStep > 1 ? (
              <button onClick={() => setWizardStep(wizardStep - 1)} className="btn btn-outline">
                Back Step
              </button>
            ) : (
              <button onClick={() => setPhase('landing')} className="btn btn-outline">
                Exit Wizard
              </button>
            )}

            {wizardStep < 7 ? (
              <button
                onClick={() => {
                  // Validate basic fields
                  if (wizardStep === 1 && (!name || !websiteUrl || !tagline || !description)) {
                    onToast('Please fill out all required fields.', 'error');
                    return;
                  }
                  if (wizardStep === 2 && (!categorySlug || !subCategory)) {
                    onToast('Please select category and subcategory.', 'error');
                    return;
                  }
                  setWizardStep(wizardStep + 1);
                }}
                className="btn btn-primary"
              >
                Continue
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => executeSubmission('draft')} className="btn btn-outline">
                  Save Draft
                </button>
                <button onClick={() => executeSubmission('pending')} className="btn btn-primary">
                  Submit for Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 3: SUBMISSION CONFIRMATION */}
      {phase === 'confirmation' && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 10px 0' }}>
            Your AI tool has been submitted!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            Thanks for submitting your tool to AIFynest. Our team will review your listing before it goes live.
          </p>

          <div style={{ maxWidth: '340px', margin: '0 auto 28px auto', textAlign: 'left', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Submission ID:</span>
              <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{submissionId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-gold)', textTransform: 'capitalize' }}>{submissionStatus} review</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Expected review:</span>
              <span style={{ fontWeight: 'bold' }}>24 - 48 Hours</span>
            </div>
          </div>

          <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg" style={{ padding: '12px 24px' }}>
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

const benefitCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  textAlign: 'center',
  boxShadow: 'var(--shadow-sm)',
};

const iconCircleStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 12px auto',
  fontSize: '20px',
};

const wizardHeaderStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
  margin: '0 0 10px 0',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--border-color)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};
