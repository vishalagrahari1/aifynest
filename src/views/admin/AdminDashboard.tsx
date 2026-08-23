/* src/views/admin/AdminDashboard.tsx */
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Modal } from '../../components/shared/Modal';
import { StarRating } from '../../components/shared/StarRating';
import {
  Shield,
  Layout,
  Settings,
  DollarSign,
  Award,
  Check,
  Search,
  Eye,
  MousePointer,
  TrendingUp,
  Plus,
  MessageSquare
} from '../../components/shared/Icons';

export const AdminDashboard: React.FC<{ onToast: (msg: string, type?: 'success' | 'error' | 'info') => void }> = ({ onToast }) => {
  const {
    tools,
    categories,
    claims,
    reviews,
    auditLogs,
    affiliateLinks,
    notifications,
    collections,
    approveTool,
    rejectTool,
    requestChanges,
    updateTool,
    deleteTool,
    approveClaim,
    rejectClaim,
    deleteReview,
    addAffiliateLink,
    deleteAffiliateLink,
    markNotificationRead,
    analyticsEvents,
    seedTenToolsPerCategory,
  } = useDatabase();
  const { user } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'tools' | 'affiliates' | 'claims' | 'reviews' | 'analytics' | 'notifications' | 'logs' | 'pending_review' | 'changes_requested'>('overview');

  // Filters for submissions moderation table
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'needs_changes'>('all');
  const [subCatFilter, setSubCatFilter] = useState<string>('all');
  const [subSearch, setSubSearch] = useState<string>('');

  // Filters for tools index list
  const [toolsStatusFilter, setToolsStatusFilter] = useState<string>('all');
  const [toolsSearch, setToolsSearch] = useState<string>('');

  // Filters for Pending Review tab
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingTypeFilter, setPendingTypeFilter] = useState<'all' | 'new' | 'edit'>('all');

  // Split-screen Reviewing State
  const [reviewingTool, setReviewingTool] = useState<any | null>(null);
  
  // Left-pane form states for split screen
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editPricing, setEditPricing] = useState<'free' | 'freemium' | 'paid' | 'free-trial' | 'contact-sales'>('free');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [editFeatures, setEditFeatures] = useState('');
  const [editUseCases, setEditUseCases] = useState('');
  const [editAffiliateUrl, setEditAffiliateUrl] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editMetaDescription, setEditMetaDescription] = useState('');

  // Rejection/Revision modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Affiliate creation modal
  const [isAffModalOpen, setIsAffModalOpen] = useState(false);
  const [affToolId, setAffToolId] = useState('');
  const [affUrl, setAffUrl] = useState('');
  const [affNetwork, setAffNetwork] = useState('PartnerStack');
  const [affProgName, setAffProgName] = useState('');
  const [affTrackingId, setAffTrackingId] = useState('');
  const [affCommission, setAffCommission] = useState(15);

  // Sorting rank columns inside Platform Analytics
  const [analyticsSort, setAnalyticsSort] = useState<'views' | 'clicks' | 'ctr' | 'saves'>('views');

  // Verify access privileges
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="container section text-center" style={{ maxWidth: '480px' }}>
        <Shield size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px auto' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          You do not have administrative permissions required to access the moderator console.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Homepage
        </Link>
      </div>
    );
  }

  // Pre-seeded lists calculations
  const pendingReviews = reviews.filter((r) => r.status === 'pending' || r.status === 'flagged');
  const unreadNotifs = notifications.filter((n) => !n.read && n.userId === 'admin-id');

  // Real stats calculation
  const pendingNewCount = tools.filter((t) => t.status === 'pending').length;
  const pendingEditsCount = tools.filter((t) => t.status === 'approved' && t.pendingChanges?.status === 'pending').length;
  const pendingClaimsCount = claims.filter((c) => c.status === 'pending').length;
  const changesRequestedCount = tools.filter((t) => t.status === 'needs_changes' || (t.status === 'approved' && t.pendingChanges?.status === 'needs_changes')).length;
  const rejectedCount = tools.filter((t) => t.status === 'rejected' || (t.status === 'approved' && t.pendingChanges?.status === 'rejected')).length;

  const pendingReviewList = tools.filter((t) => 
    t.status === 'pending' || 
    (t.status === 'approved' && t.pendingChanges?.status === 'pending')
  );

  const filteredPendingList = tools.filter((t) => {
    const isNew = t.status === 'pending';
    const isEdit = t.status === 'approved' && t.pendingChanges?.status === 'pending';
    if (!isNew && !isEdit) return false;

    // Type filter
    if (pendingTypeFilter === 'new' && !isNew) return false;
    if (pendingTypeFilter === 'edit' && !isEdit) return false;

    // Search filter
    if (pendingSearch.trim()) {
      const q = pendingSearch.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredChangesRequestedList = tools.filter((t) => {
    const isNewRequested = t.status === 'needs_changes';
    const isEditRequested = t.status === 'approved' && t.pendingChanges?.status === 'needs_changes';
    return isNewRequested || isEditRequested;
  });

  const isEditReview = reviewingTool && reviewingTool.status === 'approved' && reviewingTool.pendingChanges;

  const renderChangeIndicator = (currentValue: any, proposedValue: any) => {
    const isDifferent = JSON.stringify(currentValue) !== JSON.stringify(proposedValue);
    if (isDifferent) {
      return (
        <span
          className="badge"
          style={{
            fontSize: '9px',
            backgroundColor: 'var(--color-warning-light)',
            color: 'var(--color-warning)',
            marginLeft: '8px',
            fontWeight: 'bold',
            padding: '2px 6px'
          }}
        >
          Changed
        </span>
      );
    }
    return null;
  };

  const handleOpenReview = (tool: any) => {
    setReviewingTool(tool);
    const source = tool.pendingChanges || tool;
    setEditName(source.name);
    setEditTagline(source.tagline);
    setEditDescription(source.description);
    setEditCategory(source.categorySlug);
    setEditSubCategory(source.subCategory);
    setEditPricing(source.pricing);
    setEditWebsiteUrl(source.websiteUrl);
    setEditLogoUrl(source.logoUrl);
    setEditPlatforms(source.platforms || []);
    setEditFeatures(source.features?.join(', ') || '');
    setEditUseCases(source.useCases?.join(', ') || '');
    setEditAffiliateUrl(source.affiliateUrl || '');
    setEditSeoTitle(source.seoTitle || '');
    setEditMetaDescription(source.metaDescription || '');
  };

  const handleSaveReviewDraft = () => {
    if (!reviewingTool) return;
    const cleanList = (str: string) => str.split(',').map((x) => x.trim()).filter((x) => x.length > 0);
    
    if (isEditReview) {
      updateTool(reviewingTool.id, {
        pendingChanges: {
          ...reviewingTool.pendingChanges,
          name: editName,
          tagline: editTagline,
          description: editDescription,
          categorySlug: editCategory,
          subCategory: editSubCategory,
          pricing: editPricing,
          websiteUrl: editWebsiteUrl,
          logoUrl: editLogoUrl,
          platforms: editPlatforms as any,
          features: cleanList(editFeatures),
          useCases: cleanList(editUseCases),
          affiliateUrl: editAffiliateUrl || undefined,
          affiliateStatus: editAffiliateUrl ? 'active' : 'inactive',
          seoTitle: editSeoTitle || undefined,
          metaDescription: editMetaDescription || undefined,
          status: 'pending',
        }
      }, user.id);
    } else {
      updateTool(reviewingTool.id, {
        name: editName,
        tagline: editTagline,
        description: editDescription,
        categorySlug: editCategory,
        subCategory: editSubCategory,
        pricing: editPricing,
        websiteUrl: editWebsiteUrl,
        logoUrl: editLogoUrl,
        platforms: editPlatforms as any,
        features: cleanList(editFeatures),
        useCases: cleanList(editUseCases),
        affiliateUrl: editAffiliateUrl || undefined,
        affiliateStatus: editAffiliateUrl ? 'active' : 'inactive',
        seoTitle: editSeoTitle || undefined,
        metaDescription: editMetaDescription || undefined,
      }, user.id);
    }
    
    onToast(`Draft listing parameters updated for "${editName}".`, 'success');
    setReviewingTool(null);
  };

  const handleApproveSubmission = () => {
    if (!reviewingTool) return;
    if (window.confirm(`Are you sure you want to publish "${editName}" to the public directory?`)) {
      // Sync edits first
      const cleanList = (str: string) => str.split(',').map((x) => x.trim()).filter((x) => x.length > 0);
      updateTool(reviewingTool.id, {
        name: editName,
        tagline: editTagline,
        description: editDescription,
        categorySlug: editCategory,
        subCategory: editSubCategory,
        pricing: editPricing,
        websiteUrl: editWebsiteUrl,
        logoUrl: editLogoUrl,
        platforms: editPlatforms as any,
        features: cleanList(editFeatures),
        useCases: cleanList(editUseCases),
        affiliateUrl: editAffiliateUrl || undefined,
        affiliateStatus: editAffiliateUrl ? 'active' : 'inactive',
        seoTitle: editSeoTitle || undefined,
        metaDescription: editMetaDescription || undefined,
      }, user.id);

      approveTool(reviewingTool.id, user.id, user.name);
      onToast(`Tool approved and published successfully at /tools/${reviewingTool.slug}`, 'success');
      setReviewingTool(null);
    }
  };

  const handleRejectSubmission = () => {
    if (!reviewingTool || !rejectionNotes.trim()) return;
    rejectTool(reviewingTool.id, user.id, user.name, rejectionNotes);
    onToast(`Tool submission rejected. Submitter notified.`, 'info');
    setIsRejectModalOpen(false);
    setRejectionNotes('');
    setReviewingTool(null);
  };

  const handleRequestRevision = () => {
    if (!reviewingTool || !revisionNotes.trim()) return;
    requestChanges(reviewingTool.id, user.id, user.name, revisionNotes);
    onToast(`Revision request sent to the builder listing owner.`, 'success');
    setIsRevisionModalOpen(false);
    setRevisionNotes('');
    setReviewingTool(null);
  };

  // Claim operations
  const handleApproveClaim = (id: string, name: string) => {
    approveClaim(id);
    onToast(`Claim approved. Ownership assigned for ${name}.`, 'success');
  };

  const handleRejectClaim = (id: string) => {
    rejectClaim(id);
    onToast('Claim request rejected.', 'info');
  };

  // Review approvals
  const handleApproveReview = (id: string) => {
    const all = JSON.parse(localStorage.getItem('ai_reviews') || '[]');
    const upd = all.map((r: any) => (r.id === id ? { ...r, status: 'approved' } : r));
    localStorage.setItem('ai_reviews', JSON.stringify(upd));
    onToast('Review approved and rating scores updated!', 'success');
  };

  // Affiliate creation trigger
  const handleAddAffiliate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!affToolId || !affUrl.trim()) {
      onToast('Please select a target tool and provide the affiliate URL.', 'error');
      return;
    }
    const toolObj = tools.find((t) => t.id === affToolId);
    if (!toolObj) return;

    addAffiliateLink({
      toolId: affToolId,
      originalUrl: toolObj.websiteUrl,
      affiliateUrl: affUrl,
      network: affNetwork,
      programName: affProgName || `${toolObj.name} Program`,
      trackingId: affTrackingId,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      commissionPercent: affCommission,
      cookieDuration: 60,
    });

    onToast(`Affiliate link assigned to ${toolObj.name}!`, 'success');
    setIsAffModalOpen(false);
    setAffUrl('');
    setAffProgName('');
    setAffTrackingId('');
  };

  const handleBulkSeed = () => {
    const seededCount = seedTenToolsPerCategory();
    if (seededCount > 0) {
      onToast(`Successfully generated and published ${seededCount} mock tools across categories!`, 'success');
    } else {
      onToast('Directory is already seeded with generated tools.', 'info');
    }
  };

  // Filtered submissions
  const filteredSubmissions = tools.filter((tool) => {
    if (subStatusFilter !== 'all' && tool.status !== subStatusFilter) return false;
    if (subCatFilter !== 'all' && tool.categorySlug !== subCatFilter) return false;
    if (subSearch.trim()) {
      const query = subSearch.toLowerCase();
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.slug.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Filtered general tools
  const filteredTools = tools.filter((tool) => {
    if (toolsStatusFilter !== 'all' && tool.status !== toolsStatusFilter) return false;
    if (toolsSearch.trim()) {
      return tool.name.toLowerCase().includes(toolsSearch.toLowerCase());
    }
    return true;
  });

  // Ranking calculation helper
  const getSortedRankedTools = () => {
    return [...tools].map((tool) => {
      const tEvents = analyticsEvents.filter((e) => e.toolId === tool.id);
      const views = tEvents.filter((e) => e.eventType === 'tool_view').length;
      const clicks = tEvents.filter((e) => e.eventType === 'tool_click' || e.eventType === 'affiliate_click').length;
      const saves = collections.filter((c) => c.name === 'My Favorites' && c.tools.includes(tool.id)).length;
      const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;
      return { tool, views, clicks, saves, ctr };
    }).sort((a, b) => {
      if (analyticsSort === 'views') return b.views - a.views;
      if (analyticsSort === 'clicks') return b.clicks - a.clicks;
      if (analyticsSort === 'saves') return b.saves - a.saves;
      return b.ctr - a.ctr;
    });
  };

  return (
    <div className="container section">
      <SEOHead title="Admin Console — AIFynest" description="Manage submissions, listing claims, customer reviews, and sponsored affiliate networks." />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }} className="dashboard-grid">
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px', letterSpacing: '0.05em' }}>
            ADMIN CONTROL DECK
          </div>
          {[
            { id: 'overview', name: 'Overview', count: 0 },
            { id: 'tools', name: 'All Tools', count: 0 },
            { id: 'pending_review', name: 'Pending Review', count: pendingNewCount + pendingEditsCount },
            { id: 'changes_requested', name: 'Changes Requested', count: changesRequestedCount },
            { id: 'claims', name: 'Claims', count: pendingClaimsCount },
            { id: 'submissions', name: 'Submissions', count: 0 },
            { id: 'affiliates', name: 'Affiliates Linker', count: 0 },
            { id: 'reviews', name: 'Moderation', count: pendingReviews.length },
            { id: 'notifications', name: 'Notifications', count: unreadNotifs.length },
            { id: 'logs', name: 'Audit Logs', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setReviewingTool(null);
                setActiveTab(tab.id as any);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                fontSize: 'var(--text-xs)',
                fontWeight: activeTab === tab.id ? 'var(--font-bold)' : 'var(--font-medium)',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === tab.id ? 'var(--color-primary-light)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background var(--transition-fast)',
              }}
            >
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    backgroundColor: tab.id === 'submissions' ? 'var(--color-warning)' : 'var(--color-primary)',
                    color: 'white',
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Console Workspace Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={24} style={{ color: 'var(--color-primary)' }} />
                <span>Admin Console</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: '4px 0 0 0' }}>
                System Administration panel for mevishal1130@gmail.com
              </p>
            </div>
            {unreadNotifs.length > 0 && (
              <button onClick={() => setActiveTab('notifications')} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}>
                <MessageSquare size={12} />
                <span>{unreadNotifs.length} Alerts</span>
              </button>
            )}
          </div>

          {/* SPLIT SCREEN PREVIEW OVERLAY */}
          {reviewingTool && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                marginTop: '10px',
                boxShadow: 'var(--shadow-lg)',
                animation: 'fade-in-overlay 0.2s ease-out'
              }}
            >
              {/* Left Column Pane */}
              {!isEditReview ? (
                /* Left Pane: Form Editor for new tool submission */
                <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '12px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Edit Submission Details</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Status: {reviewingTool.status.toUpperCase()}</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Tool Name</label>
                      <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tagline</label>
                      <input type="text" className="form-input" value={editTagline} onChange={(e) => setEditTagline(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Description</label>
                      <textarea rows={4} className="form-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-input" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subcategory</label>
                        <input type="text" className="form-input" value={editSubCategory} onChange={(e) => setEditSubCategory(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Pricing Type</label>
                        <select className="form-input" value={editPricing} onChange={(e) => setEditPricing(e.target.value as any)}>
                          <option value="free">Free</option>
                          <option value="freemium">Freemium</option>
                          <option value="paid">Paid</option>
                          <option value="free-trial">Free Trial</option>
                          <option value="contact-sales">Contact Sales</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Logo Image URL</label>
                        <input type="text" className="form-input" value={editLogoUrl} onChange={(e) => setEditLogoUrl(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Original Destination URL</label>
                      <input type="url" className="form-input" value={editWebsiteUrl} onChange={(e) => setEditWebsiteUrl(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Affiliate Referral URL (Assigned Network Target)</label>
                      <input type="url" className="form-input" value={editAffiliateUrl} onChange={(e) => setEditAffiliateUrl(e.target.value)} placeholder="https://example.com/?ref=aifynest" />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>SEO Configuration METADATA</span>
                      <div className="form-group" style={{ marginTop: '8px' }}>
                        <label className="form-label">SEO Title Tags</label>
                        <input type="text" className="form-input" value={editSeoTitle} onChange={(e) => setEditSeoTitle(e.target.value)} placeholder="AIFynest custom header override" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Meta Description</label>
                        <input type="text" className="form-input" value={editMetaDescription} onChange={(e) => setEditMetaDescription(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Features list (comma separated)</label>
                        <input type="text" className="form-input" value={editFeatures} onChange={(e) => setEditFeatures(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Use Cases list (comma separated)</label>
                        <input type="text" className="form-input" value={editUseCases} onChange={(e) => setEditUseCases(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Left Pane: Read-only current live version for edits comparison */
                <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '12px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    CURRENT LIVE VERSION
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: 'var(--text-xs)' }}>
                    <div>
                      <strong>Logo:</strong>
                      <img src={reviewingTool.logoUrl} style={{ width: '40px', height: '40px', borderRadius: '4px', display: 'block', marginTop: '6px', objectFit: 'cover' }} />
                    </div>
                    <div><strong>Tool Name:</strong> <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{reviewingTool.name}</p></div>
                    <div><strong>Tagline:</strong> <p style={{ margin: '4px 0 0 0' }}>{reviewingTool.tagline}</p></div>
                    <div><strong>Description:</strong> <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{reviewingTool.description}</p></div>
                    <div><strong>Website URL:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--color-primary)' }}>{reviewingTool.websiteUrl}</p></div>
                    <div><strong>Category:</strong> <p style={{ margin: '4px 0 0 0' }}>{reviewingTool.categorySlug} &gt; {reviewingTool.subCategory}</p></div>
                    <div><strong>Pricing:</strong> <p style={{ margin: '4px 0 0 0' }}>{reviewingTool.pricing} ({reviewingTool.pricingUrl})</p></div>
                    <div><strong>Platforms:</strong> <p style={{ margin: '4px 0 0 0' }}>{reviewingTool.platforms?.join(', ')}</p></div>
                    <div><strong>Features:</strong> <p style={{ margin: '4px 0 0 0' }}>{reviewingTool.features?.join(', ')}</p></div>
                    <div><strong>Use Cases:</strong> <p style={{ margin: '4px 0 0 0' }}>{reviewingTool.useCases?.join(', ')}</p></div>
                    {reviewingTool.screenshotUrls && reviewingTool.screenshotUrls.length > 0 && (
                      <div>
                        <strong>Screenshots:</strong>
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '6px' }}>
                          {reviewingTool.screenshotUrls.map((url: string, i: number) => (
                            <img key={i} src={url} style={{ height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Right Column Pane */}
              {!isEditReview ? (
                /* Right Pane: Live Visual Preview for new tool submission */
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={16} />
                    <span>AIFynest Mock Live Profile Preview</span>
                  </h3>
                  
                  {/* Simulating public ToolDetail UI Frame */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'var(--bg-primary)' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <img src={editLogoUrl || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100'} alt="logo" style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{editName || 'Tool Title'}</span>
                          <span style={{ fontSize: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px' }}>Verified</span>
                        </h2>
                        <span className="badge badge-pricing">{editPricing.toUpperCase()}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>{editTagline || 'Tagline placeholder'}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>{editDescription || 'No description provided.'}</p>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                      <button className="btn btn-primary btn-sm w-full" disabled>Visit Tool ↗</button>
                      <button className="btn btn-outline btn-sm" disabled>❤</button>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>AIFynest may earn a commission when you purchase through certain links.</span>

                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', margin: '0 0 8px 0' }}>Integrations & Features</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {editFeatures.split(',').map((f, i) => f.trim() && (
                          <span key={i} style={{ fontSize: '10px', backgroundColor: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '4px' }}>{f.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
                    ⚙️ <strong>Search Engine Preview (SERP)</strong>
                    <div style={{ color: '#1a0dab', fontSize: '14px', textDecoration: 'underline', marginTop: '6px' }}>
                      {editSeoTitle || `${editName} | Discover the Best AI Tools on AIFynest`}
                    </div>
                    <div style={{ color: '#006621', fontSize: '11px' }}>
                      https://aifynest.com/tools/{reviewingTool.slug}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {editMetaDescription || editTagline || 'SERP Meta description snippet preview.'}
                    </div>
                  </div>
                </div>
              ) : (
                /* Right Pane: Proposed Changes Form for edits comparison */
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    PROPOSED CHANGES (EDITABLE)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Tool Name</span>
                        {renderChangeIndicator(reviewingTool.name, editName)}
                      </label>
                      <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Tagline</span>
                        {renderChangeIndicator(reviewingTool.tagline, editTagline)}
                      </label>
                      <input type="text" className="form-input" value={editTagline} onChange={(e) => setEditTagline(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Full Description</span>
                        {renderChangeIndicator(reviewingTool.description, editDescription)}
                      </label>
                      <textarea rows={4} className="form-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Category</span>
                          {renderChangeIndicator(reviewingTool.categorySlug, editCategory)}
                        </label>
                        <select className="form-input" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Subcategory</span>
                          {renderChangeIndicator(reviewingTool.subCategory, editSubCategory)}
                        </label>
                        <input type="text" className="form-input" value={editSubCategory} onChange={(e) => setEditSubCategory(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Pricing Type</span>
                          {renderChangeIndicator(reviewingTool.pricing, editPricing)}
                        </label>
                        <select className="form-input" value={editPricing} onChange={(e) => setEditPricing(e.target.value as any)}>
                          <option value="free">Free</option>
                          <option value="freemium">Freemium</option>
                          <option value="paid">Paid</option>
                          <option value="free-trial">Free Trial</option>
                          <option value="contact-sales">Contact Sales</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Logo URL</span>
                          {renderChangeIndicator(reviewingTool.logoUrl, editLogoUrl)}
                        </label>
                        <input type="text" className="form-input" value={editLogoUrl} onChange={(e) => setEditLogoUrl(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Destination URL</span>
                        {renderChangeIndicator(reviewingTool.websiteUrl, editWebsiteUrl)}
                      </label>
                      <input type="url" className="form-input" value={editWebsiteUrl} onChange={(e) => setEditWebsiteUrl(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Features list (comma separated)</label>
                        <input type="text" className="form-input" value={editFeatures} onChange={(e) => setEditFeatures(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Use Cases list (comma separated)</label>
                        <input type="text" className="form-input" value={editUseCases} onChange={(e) => setEditUseCases(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Control Bar */}
              <div
                style={{
                  gridColumn: 'span 2',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '20px',
                  marginTop: '10px',
                }}
              >
                <button onClick={() => setReviewingTool(null)} className="btn btn-outline">
                  Cancel Review
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleSaveReviewDraft} className="btn btn-outline" style={{ color: 'var(--color-info)', borderColor: 'var(--color-info)' }}>
                    Save Draft
                  </button>
                  <button onClick={() => setIsRevisionModalOpen(true)} className="btn btn-outline" style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}>
                    Request Changes
                  </button>
                  <button onClick={() => setIsRejectModalOpen(true)} className="btn btn-outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                    Reject Submission
                  </button>
                  <button onClick={handleApproveSubmission} className="btn btn-primary">
                    Approve & Publish Tool
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD INDEX */}
          {activeTab === 'overview' && !reviewingTool && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }} className="stats-box-grid">
                <div style={adminStatBox}>
                  <Layout size={20} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{pendingNewCount}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Pending Tools</span>
                </div>
                <div style={adminStatBox}>
                  <Settings size={20} style={{ color: 'var(--color-info)' }} />
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{pendingEditsCount}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Pending Edits</span>
                </div>
                <div style={adminStatBox}>
                  <Award size={20} style={{ color: 'var(--color-gold)' }} />
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{pendingClaimsCount}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Pending Claims</span>
                </div>
                <div style={adminStatBox}>
                  <TrendingUp size={20} style={{ color: 'var(--color-warning)' }} />
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{changesRequestedCount}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Changes Requested</span>
                </div>
                <div style={adminStatBox}>
                  <Shield size={20} style={{ color: 'var(--color-danger)' }} />
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{rejectedCount}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Rejected</span>
                </div>
              </div>

              {/* Submissions Action List */}
              <div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Immediate Moderation Alerts</span>
                  <button onClick={() => setActiveTab('pending_review')} className="btn btn-outline btn-xs" style={{ fontSize: '10px' }}>View Pending Queue</button>
                </h3>
                {pendingReviewList.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Type</th>
                          <th>Pricing</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingReviewList.slice(0, 5).map((tool) => (
                          <tr key={tool.id}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={tool.logoUrl} alt={tool.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                              <span style={{ fontWeight: 'bold' }}>{tool.name}</span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: tool.pendingChanges ? 'var(--color-info-light)' : 'var(--color-primary-light)',
                                  color: tool.pendingChanges ? 'var(--color-info)' : 'var(--color-primary)',
                                  fontSize: '10px'
                                }}
                              >
                                {tool.pendingChanges ? 'Listing Edit' : 'New Listing'}
                              </span>
                            </td>
                            <td><span className="badge badge-pricing">{tool.pricing}</span></td>
                            <td>{tool.pendingChanges?.submittedAt ? tool.pendingChanges.submittedAt.split('T')[0] : tool.lastUpdated}</td>
                            <td>
                              <button onClick={() => handleOpenReview(tool)} className="btn btn-primary btn-xs">Review Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    🟢 Clean Queue. No pending submissions require moderation reviews.
                  </div>
                )}
              </div>

              {/* Recent Activity Log */}
              <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: '0 0 16px 0' }}>
                  Recent Moderation Activity
                </h3>
                {auditLogs && auditLogs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {auditLogs.slice(0, 10).map((log: any) => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', fontSize: 'var(--text-xs)' }}>
                        <div>
                          <strong style={{ color: 'var(--color-primary)' }}>{log.action}</strong> - {log.details}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {log.timestamp.split('T')[0]} by {log.userName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', margin: 0 }}>
                    No moderation actions logged yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADVANCED SUBMISSIONS TABLE */}
          {activeTab === 'submissions' && !reviewingTool && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>Advanced Submissions Queue</h3>
                
                {/* Advanced filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select className="form-input btn-sm" value={subStatusFilter} onChange={(e) => setSubStatusFilter(e.target.value as any)} style={{ width: 'auto', padding: '6px 12px' }}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="needs_changes">Needs Changes</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select className="form-input btn-sm" value={subCatFilter} onChange={(e) => setSubCatFilter(e.target.value)} style={{ width: 'auto', padding: '6px 12px' }}>
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input btn-sm"
                      placeholder="Search submissions..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      style={{ paddingLeft: '32px', width: '200px' }}
                    />
                    <Search size={12} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              {filteredSubmissions.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tool</th>
                        <th>Submitted By</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Submitted Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((tool) => (
                        <tr key={tool.id}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={tool.logoUrl} alt={tool.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                            <div>
                              <span style={{ fontWeight: 'bold', display: 'block' }}>{tool.name}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{tool.pricing.toUpperCase()}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{tool.ownerId ? 'Verified Owner' : 'Unclaimed Submit'}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>owner-id: {tool.ownerId || 'N/A'}</span>
                            </div>
                          </td>
                          <td>{tool.categorySlug.toUpperCase()}</td>
                          <td>
                            <span
                              className={`badge`}
                              style={{
                                fontSize: '10px',
                                backgroundColor:
                                  tool.status === 'approved'
                                    ? 'var(--color-success-light)'
                                    : tool.status === 'pending'
                                    ? 'var(--color-warning-light)'
                                    : tool.status === 'needs_changes'
                                    ? 'var(--color-gold-light)'
                                    : 'var(--color-danger-light)',
                                color:
                                  tool.status === 'approved'
                                    ? 'var(--color-success)'
                                    : tool.status === 'pending'
                                    ? 'var(--color-warning)'
                                    : tool.status === 'needs_changes'
                                    ? 'var(--color-gold)'
                                    : 'var(--color-danger)',
                                border: '1px solid currentColor',
                              }}
                            >
                              {tool.status.toUpperCase()}
                            </span>
                          </td>
                          <td>{tool.lastUpdated}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleOpenReview(tool)} className="btn btn-outline btn-xs">
                                Review & Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                  No tools found matching current filter parameters.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOOLS GENERAL INDEX LIST */}
          {activeTab === 'tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>Tools Master Index</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button 
                    onClick={handleBulkSeed} 
                    className="btn btn-primary btn-sm"
                    style={{ background: 'linear-gradient(135deg, var(--color-gold) 0%, #d97706 100%)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>⚡ Seed 10 Tools per Category</span>
                  </button>
                  <select className="form-input btn-sm" value={toolsStatusFilter} onChange={(e) => setToolsStatusFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">All statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="needs_changes">Needs Changes</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <input
                    type="text"
                    className="form-input btn-sm"
                    placeholder="Search all listings..."
                    value={toolsSearch}
                    onChange={(e) => setToolsSearch(e.target.value)}
                    style={{ width: '180px' }}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Slug</th>
                      <th>Rating</th>
                      <th>Organic Verified</th>
                      <th>Sponsored Ad</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map((tool) => (
                      <tr key={tool.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={tool.logoUrl} alt={tool.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span style={{ fontWeight: 'bold' }}>{tool.name}</span>
                        </td>
                        <td>/tools/{tool.slug}</td>
                        <td>⭐ {tool.rating} ({tool.reviewCount})</td>
                        <td>
                          <button
                            onClick={() => updateTool(tool.id, { isVerified: !tool.isVerified }, user.id)}
                            className={`btn btn-xs ${tool.isVerified ? 'btn-primary' : 'btn-outline'}`}
                          >
                            {tool.isVerified ? 'Verified' : 'Verify'}
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => updateTool(tool.id, { isSponsored: !tool.isSponsored }, user.id)}
                            className={`btn btn-xs ${tool.isSponsored ? 'btn-gold' : 'btn-outline'}`}
                          >
                            {tool.isSponsored ? 'Sponsored' : 'Boost'}
                          </button>
                        </td>
                        <td>
                          <select
                            value={tool.status}
                            onChange={(e) => updateTool(tool.id, { status: e.target.value as any }, user.id)}
                            className="form-input btn-xs"
                            style={{ width: 'auto', padding: '2px' }}
                          >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="needs_changes">Needs Changes</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleOpenReview(tool)} className="btn btn-outline btn-xs">Edit</button>
                            <button onClick={() => { if (window.confirm('Delete permanently?')) deleteTool(tool.id, user.id); }} className="btn btn-outline btn-xs" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AFFILIATE LINKER & CONVERSIONS */}
          {activeTab === 'affiliates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>Affiliate Management Network</h3>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Configure controlled redirects and track click CTR commissions</span>
                </div>
                <button onClick={() => setIsAffModalOpen(true)} className="btn btn-primary btn-sm">
                  <Plus size={12} />
                  <span>Assign Affiliate Link</span>
                </button>
              </div>

              {/* Stats Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={adminStatBox}>
                  <DollarSign size={20} style={{ color: 'var(--color-success)' }} />
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                    ${affiliateLinks.reduce((acc, l) => acc + l.revenue, 0)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Estimated Platform Commission</span>
                </div>
                <div style={adminStatBox}>
                  <MousePointer size={20} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                    {affiliateLinks.reduce((acc, l) => acc + l.clicks, 0)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Outbound Clicks</span>
                </div>
                <div style={adminStatBox}>
                  <TrendingUp size={20} style={{ color: 'var(--color-gold)' }} />
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                    {affiliateLinks.reduce((acc, l) => acc + l.conversions, 0)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Tracked Conversions</span>
                </div>
              </div>

              {/* Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Network</th>
                      <th>Redirect Trigger</th>
                      <th>Affiliate link</th>
                      <th>Clicks</th>
                      <th>Conversions</th>
                      <th>Commission</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliateLinks.map((link) => {
                      const tObj = tools.find((t) => t.id === link.toolId);
                      return (
                        <tr key={link.id}>
                          <td style={{ fontWeight: 'bold' }}>{tObj?.name || 'Unknown Tool'}</td>
                          <td>
                            <span style={{ fontSize: '11px', backgroundColor: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '4px' }}>
                              {link.network}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-primary)', fontSize: '11px' }}>/go/{tObj?.slug}</td>
                          <td style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.affiliateUrl}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{link.clicks}</td>
                          <td>{link.conversions}</td>
                          <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                            {link.commissionPercent ? `${link.commissionPercent}%` : `$${link.commissionFixed}`}
                          </td>
                          <td>
                            <button onClick={() => { if (window.confirm('Disable affiliate setup?')) deleteAffiliateLink(link.id); }} className="btn btn-outline btn-xs" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                              Disable
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Broken Links Simulation Alerts */}
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} />
                  <span>Broker Link Validator: All 2 target affiliate nodes are returning 200 HTTP OK.</span>
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: DOMAIN CLAIMS MODERATION QUEUE */}
          {activeTab === 'claims' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>Ownership Claims Console</h3>
              {claims.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tool</th>
                        <th>Claimant</th>
                        <th>Company Domain</th>
                        <th>Verification Email</th>
                        <th>Proof Details</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((claim) => {
                        const toolObj = tools.find((t) => t.id === claim.toolId);
                        return (
                          <tr key={claim.id}>
                            <td style={{ fontWeight: 'bold' }}>{toolObj?.name || 'Unknown Tool'}</td>
                            <td>{claim.verificationEmail ? claim.verificationEmail.split('@')[0] : 'Unknown'}</td>
                            <td>{claim.domain || 'N/A'}</td>
                            <td>{claim.verificationEmail}</td>
                            <td style={{ fontSize: '10px', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {claim.message}
                            </td>
                            <td>{claim.date}</td>
                            <td style={{ textTransform: 'capitalize' }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: '10px',
                                  backgroundColor:
                                    claim.status === 'approved'
                                      ? 'var(--color-success-light)'
                                      : claim.status === 'pending'
                                      ? 'var(--color-warning-light)'
                                      : 'var(--color-danger-light)',
                                  color:
                                    claim.status === 'approved'
                                      ? 'var(--color-success)'
                                      : claim.status === 'pending'
                                      ? 'var(--color-warning)'
                                      : 'var(--color-danger)',
                                }}
                              >
                                {claim.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {claim.status === 'pending' ? (
                                <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleApproveClaim(claim.id, toolObj?.name || '')}
                                    className="btn btn-primary btn-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectClaim(claim.id)}
                                    className="btn btn-outline btn-xs"
                                    style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vetted</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No ownership claim requests found.
                </div>
              )}
            </div>
          )}

          {activeTab === 'pending_review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>Pending Review Queue</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    placeholder="Search pending items..."
                    style={{ width: '200px', padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                  />
                  <select
                    className="form-input"
                    value={pendingTypeFilter}
                    onChange={(e) => setPendingTypeFilter(e.target.value as any)}
                    style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                  >
                    <option value="all">All Types</option>
                    <option value="new">New Listings</option>
                    <option value="edit">Listing Edits</option>
                  </select>
                </div>
              </div>

              {filteredPendingList.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tool</th>
                        <th>Owner</th>
                        <th>Type</th>
                        <th>Current Status</th>
                        <th>Last Updated</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingList.map((tool) => (
                        <tr key={tool.id}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                            <img src={tool.logoUrl} alt={tool.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                            <span>{tool.name}</span>
                          </td>
                          <td>{tool.ownerId ? `Owner: ${tool.ownerId}` : 'Unclaimed'}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: tool.pendingChanges ? 'var(--color-info-light)' : 'var(--color-primary-light)',
                                color: tool.pendingChanges ? 'var(--color-info)' : 'var(--color-primary)',
                                fontSize: '10px'
                              }}
                            >
                              {tool.pendingChanges ? 'Listing Edit' : 'New Listing'}
                            </span>
                          </td>
                          <td>
                            <span style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                              {tool.pendingChanges ? 'Pending Changes' : 'Pending Review'}
                            </span>
                          </td>
                          <td>{tool.lastUpdated}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => handleOpenReview(tool)} className="btn btn-primary btn-xs">
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No items in the pending review queue.
                </div>
              )}
            </div>
          )}

          {activeTab === 'changes_requested' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>Changes Requested Queue</h3>
              {filteredChangesRequestedList.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tool</th>
                        <th>Type</th>
                        <th>Feedback / Notes</th>
                        <th>Last Updated</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChangesRequestedList.map((tool) => {
                        const notes = tool.pendingChanges ? tool.pendingChanges.adminNotes : tool.adminNotes;
                        return (
                          <tr key={tool.id}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                              <img src={tool.logoUrl} alt={tool.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                              <span>{tool.name}</span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: tool.pendingChanges ? 'var(--color-info-light)' : 'var(--color-primary-light)',
                                  color: tool.pendingChanges ? 'var(--color-info)' : 'var(--color-primary)',
                                  fontSize: '10px'
                                }}
                              >
                                {tool.pendingChanges ? 'Listing Edit' : 'New Listing'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '11px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {notes || 'No notes specified.'}
                            </td>
                            <td>{tool.lastUpdated}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button onClick={() => handleOpenReview(tool)} className="btn btn-outline btn-xs">
                                Inspect / Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No listings currently in changes requested state.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CUSTOMER REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>Flagged & Pending Customer Reviews</h3>
              {pendingReviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingReviews.map((rev) => {
                    const toolObj = tools.find((t) => t.id === rev.toolId);
                    return (
                      <div key={rev.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>{rev.userName} on {toolObj?.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rev.date}</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <StarRating rating={rev.rating} size={12} />
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>"{rev.title}"</p>
                        <p style={{ margin: '0 0 14px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{rev.comment}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => handleApproveReview(rev.id)} className="btn btn-primary btn-sm">Approve & Publish</button>
                          <button onClick={() => deleteReview(rev.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>Delete Review</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  🟢 Review moderation queue is clear.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PLATFORM-WIDE ANALYTICS & RANKING */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>AIFynest Analytics Deck</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['views', 'clicks', 'ctr', 'saves'] as const).map((col) => (
                    <button
                      key={col}
                      onClick={() => setAnalyticsSort(col)}
                      className={`btn btn-xs ${analyticsSort === col ? 'btn-primary' : 'btn-outline'}`}
                      style={{ textTransform: 'uppercase' }}
                    >
                      Sort: {col}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analytics Rank Matrix */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ranking #</th>
                      <th>AI Tool</th>
                      <th>Status</th>
                      <th>Page Views</th>
                      <th>Outbound Clicks</th>
                      <th>CTR (%)</th>
                      <th>Saved (Saves)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedRankedTools().map((item, idx) => (
                      <tr key={item.tool.id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>#{idx + 1}</td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={item.tool.logoUrl} alt="logo" style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'cover' }} />
                          <strong>{item.tool.name}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>{item.tool.status}</span>
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{item.views}</td>
                        <td>{item.clicks}</td>
                        <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{item.ctr}%</td>
                        <td>❤ {item.saves}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: ADMIN NOTIFICATIONS CENTRE */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>Administrative Action Alerts</h3>
              
              {notifications.filter((n) => n.userId === 'admin-id').length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notifications
                    .filter((n) => n.userId === 'admin-id')
                    .map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          backgroundColor: notif.read ? 'var(--bg-card)' : 'var(--color-primary-light)',
                          border: `1px solid ${notif.read ? 'var(--border-color)' : 'var(--color-primary)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block' }}>
                            {notif.title}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {notif.message}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            {notif.date}
                          </span>
                        </div>
                        {!notif.read && (
                          <button onClick={() => markNotificationRead(notif.id)} className="btn btn-xs btn-primary">
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No administrative alerts.
                </div>
              )}
            </div>
          )}

          {/* TAB 9: PLATFORM AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>System Moderation Logs</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Moderator</th>
                      <th>Action Logged</th>
                      <th>Summary Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.timestamp}</td>
                        <td style={{ fontWeight: 'bold' }}>{log.userName}</td>
                        <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{log.action}</td>
                        <td>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REJECT MODAL PROMPT FOR REASON */}
      <Modal isOpen={isRejectModalOpen} title="Reject Submission" onClose={() => setIsRejectModalOpen(false)}>
        <div style={{ padding: '12px', minWidth: '320px' }}>
          <textarea
            className="form-input"
            rows={4}
            value={rejectionNotes}
            onChange={(e) => setRejectionNotes(e.target.value)}
            placeholder="Provide clear reasons so the submitter can understand..."
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsRejectModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button onClick={handleRejectSubmission} className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)', border: 'none' }}>Reject Submission</button>
          </div>
        </div>
      </Modal>

      {/* REVISION NOTES MODAL */}
      <Modal isOpen={isRevisionModalOpen} title="Request Revisions" onClose={() => setIsRevisionModalOpen(false)}>
        <div style={{ padding: '12px', minWidth: '320px' }}>
          <textarea
            className="form-input"
            rows={4}
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="What specifically needs to be revised? (e.g. Please upload actual dashboard screenshots)..."
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsRevisionModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button onClick={handleRequestRevision} className="btn btn-primary">Send Revision Request</button>
          </div>
        </div>
      </Modal>

      {/* AFFILIATE LINK LINKING MODAL */}
      <Modal isOpen={isAffModalOpen} title="Assign Affiliate Program" onClose={() => setIsAffModalOpen(false)}>
        <form onSubmit={handleAddAffiliate} style={{ padding: '12px', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Assign Affiliate Referral Program</h3>
            
            <div className="form-group">
              <label className="form-label">Target Tool</label>
              <select className="form-input" value={affToolId} onChange={(e) => setAffToolId(e.target.value)}>
                <option value="">-- Choose AI Listing --</option>
                {tools.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} (id: {t.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Affiliate Referral URL</label>
              <input type="url" className="form-input" required value={affUrl} onChange={(e) => setAffUrl(e.target.value)} placeholder="https://example.com/?ref=aifynest" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Affiliate Network</label>
                <select className="form-input" value={affNetwork} onChange={(e) => setAffNetwork(e.target.value)}>
                  <option value="Direct Program">Direct Program</option>
                  <option value="PartnerStack">PartnerStack</option>
                  <option value="Impact">Impact</option>
                  <option value="CJ">CJ Affiliate</option>
                  <option value="ShareASale">ShareASale</option>
                  <option value="Other Program">Other Network</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Program Name</label>
                <input type="text" className="form-input" value={affProgName} onChange={(e) => setAffProgName(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Tracking ID</label>
                <input type="text" className="form-input" value={affTrackingId} onChange={(e) => setAffTrackingId(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Commission Fee (%)</label>
                <input type="number" className="form-input" value={affCommission} onChange={(e) => setAffCommission(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsAffModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Establish Referral Node</button>
            </div>
          </form>
        </Modal>

      {/* Styled definitions */}
      <style>{`
        .pulse-glow {
          box-shadow: 0 0 30px rgba(124, 58, 237, 0.4);
        }
        @keyframes fade-in-overlay {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

const adminStatBox: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};
