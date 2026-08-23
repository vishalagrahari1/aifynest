/* src/views/dashboard/ManageTool.tsx */
import React, { useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Shield } from '../../components/shared/Icons';

export const ManageTool: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOwnedTool, updateTool, categories } = useDatabase();

  // Authentication check
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Retrieve tool & verify ownership
  const tool = getOwnedTool(id || '', user.id);

  if (!tool) {
    return (
      <div className="container section text-center" style={{ maxWidth: '480px', padding: '60px 0' }}>
        <Shield size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px auto' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          You do not have permission to manage this tool listing or the tool ID does not exist.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Determine current active edit parameters (loads pending changes draft if available)
  const currentDraft = tool.pendingChanges || {};
  const isApproved = tool.status === 'approved';

  // State hooks for form fields
  const [name, setName] = useState(currentDraft.name ?? tool.name);
  const [tagline, setTagline] = useState(currentDraft.tagline ?? tool.tagline);
  const [description, setDescription] = useState(currentDraft.description ?? tool.description);
  const [websiteUrl, setWebsiteUrl] = useState(currentDraft.websiteUrl ?? tool.websiteUrl);
  const [categorySlug, setCategorySlug] = useState(currentDraft.categorySlug ?? tool.categorySlug);
  const [subCategory, setSubCategory] = useState(currentDraft.subCategory ?? tool.subCategory);
  
  const [tagsInput, setTagsInput] = useState((currentDraft.tags ?? tool.tags ?? []).join(', '));
  const [pricing, setPricing] = useState(currentDraft.pricing ?? tool.pricing);
  const [pricingUrl, setPricingUrl] = useState(currentDraft.pricingUrl ?? tool.pricingUrl ?? '');
  
  const [platforms, setPlatforms] = useState<string[]>(currentDraft.platforms ?? tool.platforms ?? []);
  const [featuresInput, setFeaturesInput] = useState((currentDraft.features ?? tool.features ?? []).join(', '));
  const [useCasesInput, setUseCasesInput] = useState((currentDraft.useCases ?? tool.useCases ?? []).join(', '));
  
  const [logoUrl, setLogoUrl] = useState(currentDraft.logoUrl ?? tool.logoUrl);
  const [screenshotInput, setScreenshotInput] = useState((currentDraft.screenshotUrls ?? tool.screenshotUrls ?? []).join(', '));
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePlatformChange = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter((p) => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Tool Name is required.';
    if (!tagline.trim()) newErrors.tagline = 'Short description (tagline) is required.';
    if (!description.trim()) newErrors.description = 'Full description is required.';
    
    if (!websiteUrl.trim()) {
      newErrors.websiteUrl = 'Website URL is required.';
    } else {
      try {
        new URL(websiteUrl);
      } catch (_) {
        newErrors.websiteUrl = 'Please enter a valid URL (starting with http:// or https://).';
      }
    }
    
    if (!categorySlug) newErrors.categorySlug = 'Please select a category.';
    if (!pricing) newErrors.pricing = 'Pricing type is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const collectFields = () => {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const features = featuresInput.split(',').map((f) => f.trim()).filter(Boolean);
    const useCases = useCasesInput.split(',').map((u) => u.trim()).filter(Boolean);
    const screenshotUrls = screenshotInput.split(',').map((s) => s.trim()).filter(Boolean);

    return {
      name,
      tagline,
      description,
      websiteUrl,
      categorySlug,
      subCategory,
      tags,
      pricing,
      pricingUrl,
      platforms: platforms as any,
      features,
      useCases,
      logoUrl,
      screenshotUrls,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fields = collectFields();

    if (isApproved) {
      // Save draft within pendingChanges copy to keep published live version intact
      updateTool(tool.id, {
        pendingChanges: {
          ...fields,
          status: 'draft',
        }
      }, user.id);
    } else {
      // For new draft listings, edit the main fields directly
      updateTool(tool.id, {
        ...fields,
        status: 'draft',
      }, user.id);
    }

    setSuccessMsg('Draft modifications saved successfully.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fields = collectFields();

    if (isApproved) {
      // Set edit parameters to pending moderation status
      updateTool(tool.id, {
        pendingChanges: {
          ...fields,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        }
      }, user.id);
    } else {
      // Submit new tool directly
      updateTool(tool.id, {
        ...fields,
        status: 'pending',
      }, user.id);
    }

    setSuccessMsg('Listing updates successfully submitted for administrator review.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      navigate('/dashboard/tools');
    }, 1500);
  };

  // Status message rendering helper
  const getStatusLabelText = () => {
    if (isApproved) {
      if (tool.pendingChanges) {
        if (tool.pendingChanges.status === 'pending') return 'Pending Review (Proposed Edits)';
        if (tool.pendingChanges.status === 'needs_changes') return 'Changes Requested (Proposed Edits)';
        if (tool.pendingChanges.status === 'rejected') return 'Rejected (Proposed Edits)';
        return 'Approved (with Draft Edits)';
      }
      return 'Approved';
    }
    
    switch (tool.status) {
      case 'draft': return 'Draft';
      case 'pending': return 'Pending Review';
      case 'needs_changes': return 'Changes Requested';
      case 'rejected': return 'Rejected';
      default: return tool.status.toUpperCase();
    }
  };

  return (
    <div className="container section">
      <SEOHead title={`Edit ${tool.name} — AIFynest`} description="Submit revisions for your listing." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <img src={logoUrl} alt={name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>Edit {name}</h1>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Listing Status: <strong>{getStatusLabelText()}</strong>
            </span>
          </div>
        </div>
        <Link to="/dashboard/tools" className="btn btn-outline btn-sm">
          &lt; Back to Tools
        </Link>
      </div>

      {successMsg && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: 'var(--text-sm)' }}>
          {successMsg}
        </div>
      )}

      {/* Admin Notes banner if Needs Changes is set */}
      {((isApproved && tool.pendingChanges?.status === 'needs_changes' && tool.pendingChanges?.adminNotes) || (!isApproved && tool.status === 'needs_changes' && tool.adminNotes)) && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-gold-light)', border: '1px solid var(--color-gold)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-xs)', color: 'var(--color-gold)', fontWeight: 'bold' }}>⚠️ Revisions Requested by Moderator</h4>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            "{isApproved ? tool.pendingChanges?.adminNotes : tool.adminNotes}"
          </p>
        </div>
      )}

      {/* Rejection Banner if Rejected is set */}
      {((isApproved && tool.pendingChanges?.status === 'rejected' && tool.pendingChanges?.rejectionReason) || (!isApproved && tool.status === 'rejected' && tool.rejectionReason)) && (
        <div style={{ padding: '16px', backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Proposed Revisions Rejected</h4>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            "{isApproved ? tool.pendingChanges?.rejectionReason : tool.rejectionReason}"
          </p>
        </div>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="edit-tool-form">
        {/* Section 1: Basic info */}
        <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            Basic Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Tool Name *</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ChatGPT" />
              {errors.name && <span style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Short Tagline / Headline *</label>
              <input type="text" className="form-input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. AI-powered chatbot assistant for content generation" />
              {errors.tagline && <span style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.tagline}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Full Description *</label>
              <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Detailed explanation of features, value propositions, and helper configurations..." />
              {errors.description && <span style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Website URL *</label>
              <input type="text" className="form-input" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
              {errors.websiteUrl && <span style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.websiteUrl}</span>}
            </div>
          </div>
        </div>

        {/* Section 2: Taxonomy */}
        <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            Category & Tags
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-cols-2">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Primary Category *</label>
              <select className="form-input" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              {errors.categorySlug && <span style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.categorySlug}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Subcategory</label>
              <input type="text" className="form-input" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="e.g. Code Editor, Chatbot" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Tags (comma-separated)</label>
            <input type="text" className="form-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. writing, AI assistant, automation" />
          </div>
        </div>

        {/* Section 3: Pricing */}
        <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            Pricing Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-cols-2">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Pricing Type *</label>
              <select className="form-input" value={pricing} onChange={(e) => setPricing(e.target.value as any)}>
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="free-trial">Free Trial</option>
                <option value="contact-sales">Contact Sales</option>
              </select>
              {errors.pricing && <span style={{ color: 'var(--color-danger)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.pricing}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Pricing Plan URL</label>
              <input type="text" className="form-input" value={pricingUrl} onChange={(e) => setPricingUrl(e.target.value)} placeholder="https://example.com/pricing" />
            </div>
          </div>
        </div>

        {/* Section 4: Specifications */}
        <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            Features & Platforms
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Supported Platforms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {['Web', 'Windows', 'Mac', 'Linux', 'iOS', 'Android', 'API'].map((p) => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
                    <input type="checkbox" checked={platforms.includes(p)} onChange={() => handlePlatformChange(p)} />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Key Features (comma-separated)</label>
              <input type="text" className="form-input" value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} placeholder="e.g. Chat history, API support, Markdown rendering" />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Common Use Cases (comma-separated)</label>
              <input type="text" className="form-input" value={useCasesInput} onChange={(e) => setUseCasesInput(e.target.value)} placeholder="e.g. Content writing, Customer support" />
            </div>
          </div>
        </div>

        {/* Section 5: Media resources */}
        <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            Media Attachments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Logo URL</label>
              <input type="text" className="form-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Screenshots (comma-separated URLs)</label>
              <input type="text" className="form-input" value={screenshotInput} onChange={(e) => setScreenshotInput(e.target.value)} placeholder="https://example.com/screenshot1.png, https://example.com/screenshot2.png" />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={handleSaveDraft} className="btn btn-outline" style={{ minWidth: '120px' }}>
            Save Draft
          </button>
          <button type="button" onClick={handleSubmitReview} className="btn btn-primary" style={{ minWidth: '160px' }}>
            Submit for Review
          </button>
        </div>
      </form>
    </div>
  );
};
