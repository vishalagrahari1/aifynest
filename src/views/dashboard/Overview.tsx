/* src/views/dashboard/Overview.tsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { StarRating } from '../../components/shared/StarRating';
import { Modal } from '../../components/shared/Modal';
import {
  Heart,
  Eye,
  MousePointer,
  TrendingUp
} from '../../components/shared/Icons';

interface OwnerDashboardProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onToast }) => {
  const {
    tools,
    reviews,
    campaigns,
    payments,
    notifications,
    addCampaign,
    recordPayment,
    updateTool,
    collections,
    analyticsEvents,
    markNotificationRead,
  } = useDatabase();
  const { user } = useAuth();

  // Tab tracker for Builder View: 'overview' | 'listings' | 'analytics' | 'reviews' | 'promotions' | 'billing' | 'settings' | 'notifications'
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'analytics' | 'reviews' | 'promotions' | 'billing' | 'settings' | 'notifications'>('overview');

  // Active Selected Tool ID dropdown tracker (supports "all" or specific tool)
  const [activeToolId, setActiveToolId] = useState<string>('all');

  // Analytics Timeframe range
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Respond review ID state
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingToolId, setEditingToolId] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPricing, setEditPricing] = useState<'free' | 'freemium' | 'paid' | 'free-trial' | 'contact-sales'>('free');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoToolId, setPromoToolId] = useState('');
  const [promoCampaignName, setPromoCampaignName] = useState('');
  const [promoPlacement, setPromoPlacement] = useState<'featured' | 'sponsored-search' | 'homepage-featured' | 'category' | 'newsletter'>('homepage-featured');
  const [promoBudget, setPromoBudget] = useState(100);
  const [promoCoupon, setPromoCoupon] = useState('');

  // Authentication check
  if (!user) {
    return (
      <div className="container section text-center">
        <h2>Authentication Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Please log in to manage your AI tools, saved items, reviews, and analytics.
        </p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  const isBuilder = user.role === 'owner' || user.role === 'admin';

  // For Regular Users: Fetch bookmarked favorites, reviews
  const userFavoritesCollection = collections.find((c) => c.userId === user.id && c.name === 'My Favorites');
  const favoritedTools = tools.filter((t) => userFavoritesCollection?.tools.includes(t.id) && t.status === 'approved');
  const userReviews = reviews.filter((r) => r.userId === user.id);


  // For Builders: Fetch claimed/submitted tools
  const ownerTools = tools.filter((t) => t.ownerId === user.id);
  const ownerToolIds = ownerTools.map((t) => t.id);

  // Analytics Dynamic Calculations
  const getSelectedAnalytics = (toolId: string) => {
    let listIds = ownerToolIds;
    if (toolId !== 'all') {
      listIds = [toolId];
    }

    const viewsEvents = analyticsEvents.filter((e) => e.eventType === 'tool_view' && listIds.includes(e.toolId || ''));
    const directClicks = analyticsEvents.filter((e) => e.eventType === 'tool_click' && listIds.includes(e.toolId || ''));
    const affiliateClicks = analyticsEvents.filter((e) => e.eventType === 'affiliate_click' && listIds.includes(e.toolId || ''));
    
    const views = viewsEvents.length || (ownerTools.length * 314 + 120);
    const clicks = directClicks.length + affiliateClicks.length || (ownerTools.length * 42 + 25);
    const affClicks = affiliateClicks.length || (ownerTools.length * 15 + 8);
    const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;
    const saves = collections.filter((c) => c.name === 'My Favorites').reduce((acc, col) => {
      return acc + col.tools.filter((id) => listIds.includes(id)).length;
    }, 0) || (ownerTools.length * 8 + 4);
    
    const ratingCount = reviews.filter((r) => listIds.includes(r.toolId) && r.status === 'approved').length;
    const impressions = views * 8 + 240;

    return { views, clicks, affClicks, ctr, saves, ratingCount, impressions };
  };

  const activeAnalytics = getSelectedAnalytics(activeToolId);

  // Builder alerts
  const builderNotifs = notifications.filter((n) => n.userId === user.id);
  const unreadCount = builderNotifs.filter((n) => !n.read).length;

  // Filter reviews for owner tools
  const ownerReviews = reviews.filter((r) => ownerToolIds.includes(r.toolId));
  // Filter campaigns for owner tools
  const ownerCampaigns = campaigns.filter((c) => ownerToolIds.includes(c.toolId));
  // Filter payments
  const ownerPayments = payments.filter((p) => p.userId === user.id);

  // Edit Listing Action
  const handleEditClick = (toolId: string) => {
    const t = tools.find((tool) => tool.id === toolId);
    if (t) {
      setEditingToolId(toolId);
      setEditTagline(t.tagline);
      setEditDesc(t.description);
      setEditPricing(t.pricing);
      setEditWebsiteUrl(t.websiteUrl);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTool(editingToolId, {
      tagline: editTagline,
      description: editDesc,
      pricing: editPricing,
      websiteUrl: editWebsiteUrl,
      // Whenever owner edits, keep status as pending so admins re-review if approved, or flag draft
      status: 'pending',
    });
    setIsEditModalOpen(false);
    onToast('Listing revised and submitted back for moderator approval!', 'success');
  };

  // Launch Campaign Promotion Action
  const handleLaunchPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoToolId) {
      onToast('Please select a tool listing to promote.', 'error');
      return;
    }

    let cpcVal = 0;
    let cpmVal = 0;
    if (promoPlacement === 'sponsored-search') cpcVal = 1.5;
    else if (promoPlacement === 'category') cpcVal = 1.0;
    else if (promoPlacement === 'homepage-featured') cpmVal = 12.0;

    const camp = addCampaign({
      toolId: promoToolId,
      campaignName: promoCampaignName || `${tools.find((t) => t.id === promoToolId)?.name} Promotion`,
      placement: promoPlacement,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: promoBudget,
      cpc: cpcVal,
      cpm: cpmVal,
    });

    recordPayment({
      campaignId: camp.id,
      userId: user.id,
      amount: promoBudget,
      type: 'sponsorship',
      description: `Sponsored campaign "${camp.campaignName}" placement fee.`,
      status: 'success',
    });

    setIsPromoModalOpen(false);
    onToast('Sponsorship purchased successfully! Campaign is active.', 'success');
  };

  // Submit response reply to review
  const handleAddReply = (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const all = JSON.parse(localStorage.getItem('ai_reviews') || '[]');
    const updated = all.map((r: any) => {
      if (r.id === reviewId) {
        const replies = r.replies || [];
        return {
          ...r,
          replies: [
            ...replies,
            {
              userId: user.id,
              userName: `${user.name} (Owner)`,
              comment: replyText,
              date: new Date().toISOString().split('T')[0],
            },
          ],
        };
      }
      return r;
    });
    localStorage.setItem('ai_reviews', JSON.stringify(updated));
    
    // update context state
    const revObj = reviews.find((r) => r.id === reviewId);
    if (revObj) {
      revObj.replies = [
        ...(revObj.replies || []),
        {
          userId: user.id,
          userName: `${user.name} (Owner)`,
          comment: replyText,
          date: new Date().toISOString().split('T')[0],
        },
      ];
    }

    setReplyText('');
    setReplyReviewId(null);
    onToast('Response response published to public listing page.', 'success');
  };

  // Chart Coordinates calculation for Views vs Clicks graph
  const getGraphCoordinates = () => {
    const days = analyticsTimeframe === '7d' ? 7 : analyticsTimeframe === '30d' ? 30 : analyticsTimeframe === '90d' ? 90 : 12;
    const viewsPoints: string[] = [];
    const clicksPoints: string[] = [];
    const stepX = 420 / (days - 1);
    
    // Simulate curves based on active tool metrics
    const seedViews = activeAnalytics.views;
    const seedClicks = activeAnalytics.clicks;

    for (let i = 0; i < days; i++) {
      const x = i * stepX;
      const wave = Math.sin(i * 0.5) * 0.4 + 0.6;
      const rand = Math.random() * 0.2 + 0.9;
      
      const curViews = Math.round((seedViews / days) * wave * rand);
      const curClicks = Math.round((seedClicks / days) * wave * rand);
      
      const yViews = 150 - Math.min(130, curViews * 12);
      const yClicks = 150 - Math.min(130, curClicks * 12);

      viewsPoints.push(`${x},${yViews}`);
      clicksPoints.push(`${x},${yClicks}`);
    }

    return {
      viewsPath: `M ${viewsPoints.join(' L ')}`,
      clicksPath: `M ${clicksPoints.join(' L ')}`,
      pointsCount: days,
    };
  };

  const chartPaths = getGraphCoordinates();

  return (
    <div className="container section">
      <SEOHead title="Developer Dashboard — AIFynest" description="Manage listings submissions, checkout campaigns analytics, billing information." />

      {/* 1. VISITOR / GENERAL USER PROFILE PORTAL */}
      {!isBuilder && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }} className="dashboard-grid">
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              Welcome back, {user.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: '32px' }}>
              Manage saved bookmarked tools, review lists, and directory preferences.
            </p>

            {/* Saved Bookmarks Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={16} style={{ color: 'var(--color-danger)' }} />
                <span>My Saved Bookmarks ({favoritedTools.length})</span>
              </h3>

              {favoritedTools.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
                  {favoritedTools.map((tool) => (
                    <div key={tool.id} style={{ display: 'flex', gap: '12px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                      <img src={tool.logoUrl} alt="logo" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)' }}>
                          <Link to={`/tools/${tool.slug}`} style={{ color: 'var(--text-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                            {tool.name}
                          </Link>
                        </h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineClamp: 1, WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {tool.tagline}
                        </p>
                        <Link to={`/go/${tool.slug}`} className="btn btn-outline btn-xs" target="_blank" style={{ display: 'inline-flex' }}>
                          Visit Tool
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  You haven't bookmarked any tools yet. Explore listings to save favorites.
                </div>
              )}
            </div>

            {/* My Written Reviews */}
            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>
                My Ratings & Reviews ({userReviews.length})
              </h3>
              {userReviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userReviews.map((rev) => (
                    <div key={rev.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong>⭐ {rev.rating} / 5</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rev.date}</span>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{rev.title}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No reviews submitted yet.
                </div>
              )}
            </div>
          </div>

          {/* User Sidebar */}
          <div>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: '0 0 16px 0' }}>Interested Categories</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map((int) => (
                    <span key={int} style={{ fontSize: 'var(--text-xs)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '20px', textTransform: 'capitalize' }}>
                      {int}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No preferred tags chosen.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BUILDER / AI COMPANY DASHBOARD */}
      {isBuilder && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }} className="dashboard-grid">
          {/* Navigation panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px', letterSpacing: '0.05em' }}>
              AIFynest BUILDER DECK
            </div>
            {[
              { id: 'overview', name: 'Overview Panel', count: 0 },
              { id: 'listings', name: `My Tools (${ownerTools.length})`, count: 0 },
              { id: 'analytics', name: 'Analytics Console', count: 0 },
              { id: 'reviews', name: 'User Reviews', count: ownerReviews.length },
              { id: 'promotions', name: 'Sponsored CPC', count: 0 },
              { id: 'billing', name: 'Billing Invoices', count: 0 },
              { id: 'notifications', name: 'Alert Center', count: unreadCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
                }}
              >
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span style={{ backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '10px' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Builder contents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header info card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  Welcome back, {user.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>
                  Manage multiple listings status, check CPC conversions and referral charts.
                </p>
              </div>
              
              {/* Multi-tool selection dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Focus Tool:</span>
                <select className="form-input" value={activeToolId} onChange={(e) => setActiveToolId(e.target.value)} style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
                  <option value="all">All Managed Tools ({ownerTools.length})</option>
                  {ownerTools.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TAB 1: BUILDER OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Stats board */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="stats-box-grid">
                  <div style={builderStatBox}>
                    <Eye size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{activeAnalytics.views}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Listing Page Views</span>
                  </div>
                  <div style={builderStatBox}>
                    <MousePointer size={18} style={{ color: 'var(--color-success)' }} />
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{activeAnalytics.clicks}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Outbound Click Referrals</span>
                  </div>
                  <div style={builderStatBox}>
                    <TrendingUp size={18} style={{ color: 'var(--color-gold)' }} />
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{activeAnalytics.ctr}%</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Referral CTR</span>
                  </div>
                  <div style={builderStatBox}>
                    <Heart size={18} style={{ color: 'var(--color-danger)' }} />
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{activeAnalytics.saves}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>User Saves Bookmarks</span>
                  </div>
                </div>

                {/* Submissions checklist status */}
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', marginBottom: '12px' }}>My Managed Listings</h3>
                  {ownerTools.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {ownerTools.map((tool) => {
                        const toolStats = getSelectedAnalytics(tool.id);
                        return (
                          <div
                            key={tool.id}
                            style={{
                              padding: '16px',
                              backgroundColor: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <img src={tool.logoUrl} alt={tool.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                              <div>
                                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{tool.name}</h4>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tool.subCategory}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold' }}>{toolStats.views}</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Views</span>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold' }}>{toolStats.clicks}</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Clicks</span>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold' }}>{toolStats.ctr}%</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>CTR</span>
                              </div>
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
                                }}
                              >
                                {tool.status.toUpperCase()}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Link to={`/tools/${tool.slug}`} className="btn btn-outline btn-xs">View Preview</Link>
                              <button onClick={() => handleEditClick(tool.id)} className="btn btn-outline btn-xs">Edit</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: '0 0 16px 0' }}>You haven't submitted any tools to AIFynest yet.</p>
                      <Link to="/submit-tool" className="btn btn-primary btn-sm">+ Submit Your First Tool</Link>
                    </div>
                  )}
                </div>

                {/* Revision Note Banner if Needs Changes is active */}
                {ownerTools.some((t) => t.status === 'needs_changes') && (
                  <div style={{ padding: '16px', backgroundColor: 'var(--color-gold-light)', border: '1px solid var(--color-gold)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-xs)', color: 'var(--color-gold)', fontWeight: 'bold' }}>⚠️ Revisions Action Required</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                      One of your submissions has requested updates from the moderation team. Go to the "Alert Center" or notifications panel to inspect the admin notes and resubmit.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY DETAILED LISTINGS EDITOR */}
            {activeTab === 'listings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: 0 }}>Manage Listings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ownerTools.map((tool) => (
                    <div key={tool.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img src={tool.logoUrl} alt="logo" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>{tool.name}</h4>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Status: <strong>{tool.status.toUpperCase()}</strong></span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleEditClick(tool.id)} className="btn btn-outline btn-sm">Edit Listing</button>
                        <button onClick={() => { setPromoToolId(tool.id); setIsPromoModalOpen(true); }} className="btn btn-gold btn-sm">Sponsor Ads</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: DETAILED PERFORMANCE ANALYTICS */}
            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: 0 }}>Traffic & Referral Analytics</h3>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Outbound clicks history metrics</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setAnalyticsTimeframe(range)}
                        className={`btn btn-xs ${analyticsTimeframe === range ? 'btn-primary' : 'btn-outline'}`}
                      >
                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Line Graph */}
                <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Weekly Trends: Views vs Clicks</span>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></span>
                        Views
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--color-success)', borderRadius: '50%' }}></span>
                        Referrals
                      </span>
                    </div>
                  </div>
                  
                  <svg viewBox="0 0 420 150" style={{ width: '100%', height: '180px', overflow: 'visible' }}>
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="420" y2="30" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
                    <line x1="0" y1="90" x2="420" y2="90" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
                    <line x1="0" y1="140" x2="420" y2="140" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />

                    {/* Views path */}
                    <path d={chartPaths.viewsPath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
                    {/* Clicks path */}
                    <path d={chartPaths.clicksPath} fill="none" stroke="var(--color-success)" strokeWidth="2" />
                  </svg>
                </div>

                {/* Break-down details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Top Traffic Referrers</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Google Search</span>
                        <strong>48%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>AIFynest Category Directories</span>
                        <strong>32%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Direct Referrals / Newsletter</span>
                        <strong>20%</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Device Distributions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>💻 Desktop Computer</span>
                        <strong>64%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>📱 Mobile Phones</span>
                        <strong>30%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>📟 Tablet Devices</span>
                        <strong>6%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MY LISTING REVIEWS & REPLIES */}
            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: 0 }}>Reviews for My Tools</h3>
                {ownerReviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {ownerReviews.map((rev) => (
                      <div key={rev.id} style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold' }}>{rev.userName} on {tools.find((t) => t.id === rev.toolId)?.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rev.date}</span>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <StarRating rating={rev.rating} size={12} />
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>"{rev.title}"</p>
                        <p style={{ margin: '0 0 16px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rev.comment}</p>
                        
                        {/* Display replies */}
                        {rev.replies && rev.replies.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                            {rev.replies.map((rep, idx) => (
                              <div key={idx} style={{ fontSize: 'var(--text-xs)' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{rep.userName}</span>: {rep.comment}
                                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{rep.date}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Form */}
                        {replyReviewId === rev.id ? (
                          <form onSubmit={(e) => handleAddReply(e, rev.id)} style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              className="form-input btn-sm"
                              placeholder="Write a reply response..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              required
                            />
                            <button type="submit" className="btn btn-primary btn-sm">Submit</button>
                            <button type="button" onClick={() => setReplyReviewId(null)} className="btn btn-outline btn-sm">Cancel</button>
                          </form>
                        ) : (
                          <button onClick={() => setReplyReviewId(rev.id)} className="btn btn-outline btn-xs">
                            Reply to Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No reviews received yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SPONSORSHIPS PROMOTION */}
            {activeTab === 'promotions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: 0 }}>CPC Sponsored Promotions</h3>
                  <button onClick={() => { setPromoToolId(ownerTools[0]?.id || ''); setIsPromoModalOpen(true); }} className="btn btn-gold btn-sm">
                    + Launch Ad Placement
                  </button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Campaign Name</th>
                        <th>Placement Scope</th>
                        <th>Budget Spent</th>
                        <th>Impressions</th>
                        <th>Clicks Charged</th>
                        <th>Remaining Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerCampaigns.map((camp) => (
                        <tr key={camp.id}>
                          <td style={{ fontWeight: 'bold' }}>{camp.campaignName}</td>
                          <td>{camp.placement.toUpperCase()}</td>
                          <td style={{ color: 'var(--color-danger)' }}>${Math.round(camp.spent)}</td>
                          <td>{camp.impressions}</td>
                          <td>{camp.clicks}</td>
                          <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>${Math.round(camp.remainingBudget)}</td>
                          <td>
                            <span className={`badge ${camp.status === 'active' ? 'badge-approved' : 'badge-pending'}`}>
                              {camp.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: BILLING INVOICES */}
            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: 0 }}>Billing Ledger</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice Date</th>
                        <th>Invoice Number</th>
                        <th>Description Parameter</th>
                        <th>Paid Charge</th>
                        <th>Receipt Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerPayments.map((pay) => (
                        <tr key={pay.id}>
                          <td>{pay.date}</td>
                          <td style={{ fontWeight: 'bold' }}>{pay.invoiceNumber}</td>
                          <td>{pay.description}</td>
                          <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>${pay.amount}</td>
                          <td><span className="badge badge-verified">PAID (SUCCESS)</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 7: BUILDER ALERTS CENTER */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: 0 }}>Builder Alert Notifications</h3>
                {builderNotifs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {builderNotifs.map((notif) => (
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
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', display: 'block' }}>
                            {notif.title}
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {notif.message}
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {notif.date}
                          </span>
                        </div>
                        {!notif.read && (
                          <button onClick={() => markNotificationRead(notif.id)} className="btn btn-xs btn-primary">
                            Dismiss
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No alerts in notification center.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT LISTING MODAL SHEET */}
      <Modal isOpen={isEditModalOpen} title="Revise Submission Listing" onClose={() => setIsEditModalOpen(false)}>
        <form onSubmit={handleEditSubmit} style={{ padding: '12px', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input type="text" className="form-input" required value={editTagline} onChange={(e) => setEditTagline(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input type="url" className="form-input" required value={editWebsiteUrl} onChange={(e) => setEditWebsiteUrl(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pricing Scope</label>
              <select className="form-input" value={editPricing} onChange={(e) => setEditPricing(e.target.value as any)}>
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="free-trial">Free Trial</option>
                <option value="contact-sales">Contact Sales</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Full Description</label>
              <textarea className="form-input" rows={4} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">Resubmit Listing</button>
            </div>
          </form>
      </Modal>

      {/* SPONSOR BUDGET MODAL CHECKOUT */}
      <Modal isOpen={isPromoModalOpen} title="Purchase Sponsored Placements" onClose={() => setIsPromoModalOpen(false)}>
        <form onSubmit={handleLaunchPromo} style={{ padding: '12px', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>
              Advertise your AI tool on premium organic search entries, homepage cards, and newsletters.
            </p>
            
            <div className="form-group">
              <label className="form-label">Target Tool</label>
              <select className="form-input" value={promoToolId} onChange={(e) => setPromoToolId(e.target.value)}>
                {ownerTools.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ad Campaign Name</label>
              <input type="text" className="form-input" placeholder="Launch Campaign Boost" value={promoCampaignName} onChange={(e) => setPromoCampaignName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Placement Target Option</label>
              <select className="form-input" value={promoPlacement} onChange={(e) => setPromoPlacement(e.target.value as any)}>
                <option value="homepage-featured">Homepage Featured Banner ($12.00 CPM)</option>
                <option value="sponsored-search">Sponsored Search Cards ($1.50 CPC)</option>
                <option value="category">Category Directories Sidebars ($1.00 CPC)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Ad Budget Scope ($)</label>
                <input type="number" className="form-input" min={50} max={5000} value={promoBudget} onChange={(e) => setPromoBudget(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Coupon Code (Promo)</label>
                <input type="text" className="form-input" value={promoCoupon} onChange={(e) => setPromoCoupon(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsPromoModalOpen(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-gold) 0%, #d97706 100%)', border: 'none' }}>
                Complete Checkout
              </button>
            </div>
          </form>
      </Modal>
    </div>
  );
};

const builderStatBox: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};
