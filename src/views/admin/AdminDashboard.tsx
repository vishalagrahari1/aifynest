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
    getPlatformAnalytics,
    getToolAnalytics,
    bulkImportTools,
    bulkUpdateToolsStatus,
    bulkDeleteTools,
    seedTenToolsPerCategory,
  } = useDatabase();
  const { user } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'tools' | 'import' | 'affiliates' | 'claims' | 'reviews' | 'analytics' | 'notifications' | 'logs' | 'pending_review' | 'changes_requested'>('overview');

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
  const [adminTimeframe, setAdminTimeframe] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [adminSelectedToolId, setAdminSelectedToolId] = useState<string>('');

  // CSV Import states
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [importStatusMode, setImportStatusMode] = useState<'draft' | 'pending'>('draft');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ success: number; duplicates: number; failed: number; failedRows: any[] } | null>(null);
  const [selectedImportRows, setSelectedImportRows] = useState<Set<number>>(new Set());
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

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

  // Platform event filtering by timeframe
  const getFilteredPlatformEvents = () => {
    const events = getPlatformAnalytics(user.id);
    if (adminTimeframe === 'all') return events;

    const now = new Date();
    let daysLimit = 30;
    if (adminTimeframe === '7d') daysLimit = 7;
    if (adminTimeframe === '90d') daysLimit = 90;
    if (adminTimeframe === '1y') daysLimit = 365;

    const limitDate = new Date();
    limitDate.setDate(now.getDate() - daysLimit);
    return events.filter((e) => new Date(e.timestamp) >= limitDate);
  };
  const filteredPlatformEvents = getFilteredPlatformEvents();

  const getAdminOverviewStats = () => {
    const events = filteredPlatformEvents;
    const views = events.filter((e) => e.eventType === 'tool_view').length;
    const clicks = events.filter((e) => e.eventType === 'website_click' || e.eventType === 'tool_click' || e.eventType === 'affiliate_click').length;
    const ctr = views > 0 ? parseFloat(((clicks / views) * 100).toFixed(2)) : 0;
    const favorites = events.filter((e) => e.eventType === 'favorite').length;
    const reviewsSubmitted = events.filter((e) => e.eventType === 'review_submitted').length;
    const searchImpressions = events.filter((e) => e.eventType === 'search_impression').length;

    const usersList = JSON.parse(localStorage.getItem('ai_users') || '[]');
    const totalUsers = usersList.length;
    const totalOwners = usersList.filter((u: any) => u.role === 'owner').length;
    const totalPublishedTools = tools.filter((t) => t.status === 'approved').length;

    return {
      views,
      clicks,
      ctr,
      favorites,
      reviewsSubmitted,
      searchImpressions,
      totalUsers,
      totalOwners,
      totalPublishedTools,
    };
  };
  const adminStats = getAdminOverviewStats();

  // Ranking calculation helper
  const getSortedRankedTools = () => {
    const events = filteredPlatformEvents;
    return [...tools].map((tool) => {
      const tEvents = events.filter((e) => e.toolId === tool.id);
      const views = tEvents.filter((e) => e.eventType === 'tool_view').length;
      const clicks = tEvents.filter((e) => e.eventType === 'website_click' || e.eventType === 'tool_click' || e.eventType === 'affiliate_click').length;
      const saves = tEvents.filter((e) => e.eventType === 'favorite').length;
      const reviewsCount = tEvents.filter((e) => e.eventType === 'review_submitted').length;
      const ctr = views > 0 ? parseFloat(((clicks / views) * 100).toFixed(2)) : 0;
      return { tool, views, clicks, saves, reviewsCount, ctr };
    }).sort((a, b) => {
      if (analyticsSort === 'views') return b.views - a.views;
      if (analyticsSort === 'clicks') return b.clicks - a.clicks;
      if (analyticsSort === 'saves') return b.saves - a.saves;
      if (analyticsSort === 'ctr') return b.ctr - a.ctr;
      return b.reviewsCount - a.reviewsCount;
    });
  };

  const getTopCategories = () => {
    const events = filteredPlatformEvents;
    const categoryStats: Record<string, { views: number; clicks: number; favorites: number }> = {};

    categories.forEach((cat) => {
      categoryStats[cat.slug] = { views: 0, clicks: 0, favorites: 0 };
    });

    events.forEach((e) => {
      if (e.toolId) {
        const tool = tools.find((t) => t.id === e.toolId);
        if (tool && tool.categorySlug in categoryStats) {
          const cat = tool.categorySlug;
          if (e.eventType === 'tool_view') categoryStats[cat].views++;
          else if (e.eventType === 'website_click' || e.eventType === 'tool_click' || e.eventType === 'affiliate_click') categoryStats[cat].clicks++;
          else if (e.eventType === 'favorite') categoryStats[cat].favorites++;
        }
      }
    });

    return Object.entries(categoryStats).map(([slug, stats]) => {
      const catObj = categories.find((c) => c.slug === slug);
      return {
        name: catObj ? catObj.name : slug,
        slug,
        ...stats,
      };
    }).sort((a, b) => b.views - a.views);
  };

  const getAdminTrafficSources = () => {
    const events = filteredPlatformEvents;
    const counts = { Google: 0, 'Directory Search': 0, Direct: 0, Social: 0, Referral: 0, Other: 0 };
    events.forEach((e) => {
      const ref = (e.referrer || '').toLowerCase();
      if (ref.includes('google')) counts.Google++;
      else if (ref.includes('directory')) counts['Directory Search']++;
      else if (ref.includes('direct') || ref === '') counts.Direct++;
      else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('linkedin') || ref.includes('instagram')) counts.Social++;
      else if (ref.includes('referral') || ref.includes('.') || ref.includes('http')) counts.Referral++;
      else counts.Other++;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([name, val]) => ({
      name,
      percentage: total > 0 ? Math.round((val / total) * 100) : 0,
    }));
  };

  const getSelectedToolAnalyticsData = () => {
    if (!adminSelectedToolId) return null;
    const events = getToolAnalytics(adminSelectedToolId, user.id);
    if (!events) return null;

    const viewsEvents = events.filter((e) => e.eventType === 'tool_view');
    const clicksEvents = events.filter((e) => e.eventType === 'website_click' || e.eventType === 'tool_click' || e.eventType === 'affiliate_click');
    const favoritesEvents = events.filter((e) => e.eventType === 'favorite');
    const reviewsEvents = events.filter((e) => e.eventType === 'review_submitted');

    const views = viewsEvents.length;
    const clicks = clicksEvents.length;
    const ctr = views > 0 ? parseFloat(((clicks / views) * 100).toFixed(2)) : 0;
    const favorites = favoritesEvents.length;
    const reviewsCount = reviewsEvents.length;

    const trafficCounts = { Google: 0, 'Directory Search': 0, Direct: 0, Social: 0, Referral: 0, Other: 0 };
    events.forEach((e) => {
      const ref = (e.referrer || '').toLowerCase();
      if (ref.includes('google')) trafficCounts.Google++;
      else if (ref.includes('directory')) trafficCounts['Directory Search']++;
      else if (ref.includes('direct') || ref === '') trafficCounts.Direct++;
      else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('linkedin') || ref.includes('instagram')) trafficCounts.Social++;
      else if (ref.includes('referral') || ref.includes('.') || ref.includes('http')) trafficCounts.Referral++;
      else trafficCounts.Other++;
    });

    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
    events.forEach((e) => {
      if (e.device === 'desktop') deviceCounts.desktop++;
      else if (e.device === 'mobile') deviceCounts.mobile++;
      else if (e.device === 'tablet') deviceCounts.tablet++;
    });

    return {
      views,
      clicks,
      ctr,
      favorites,
      reviewsCount,
      traffic: Object.entries(trafficCounts).map(([name, val]) => ({ name, count: val })),
      devices: deviceCounts,
    };
  };
  // --- BULK IMPORT HELPERS ---
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let cell = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(cell);
          cell = '';
        } else if (char === '\r' || char === '\n') {
          row.push(cell);
          cell = '';
          if (row.length > 1 || row[0] !== '') {
            result.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          cell += char;
        }
      }
    }
    if (cell !== '' || row.length > 0) {
      row.push(cell);
      result.push(row);
    }
    return result;
  };

  const normalizeDomain = (url: string): string => {
    let u = (url || '').trim().toLowerCase();
    u = u.replace(/^(https?:\/\/)?(www\.)?/, '');
    u = u.replace(/\/$/, '');
    return u;
  };

  const handleCSVUpload = (text: string) => {
    const parsed = parseCSV(text);
    if (parsed.length === 0) return;
    const headers = parsed[0].map((h) => h.trim());
    const rows = parsed.slice(1);
    setCsvHeaders(headers);
    setCsvRows(rows);

    const targetFields = [
      { key: 'name', names: ['name', 'title', 'tool_name', 'tool name'] },
      { key: 'websiteUrl', names: ['website_url', 'website url', 'url', 'website', 'link'] },
      { key: 'categorySlug', names: ['category', 'category_slug', 'category slug', 'cat'] },
      { key: 'description', names: ['description', 'desc', 'full_description'] },
      { key: 'tagline', names: ['tagline', 'short_description', 'subtitle'] },
      { key: 'subCategory', names: ['subcategory', 'sub_category', 'sub category'] },
      { key: 'pricing', names: ['pricing', 'pricing_type', 'pricing type'] },
      { key: 'logoUrl', names: ['logo', 'logo_url', 'logo url'] },
      { key: 'features', names: ['features', 'features_list'] },
      { key: 'useCases', names: ['use_cases', 'use cases'] },
      { key: 'platforms', names: ['platforms', 'devices'] },
      { key: 'tags', names: ['tags', 'keywords'] },
    ];

    const mapping: Record<string, string> = {};
    targetFields.forEach((f) => {
      const matchedHeader = headers.find((h) => f.names.includes(h.toLowerCase()));
      if (matchedHeader) {
        mapping[f.key] = matchedHeader;
      }
    });
    setColumnMappings(mapping);

    const indices = new Set<number>();
    rows.forEach((_, idx) => indices.add(idx));
    setSelectedImportRows(indices);
    setImportResult(null);
  };

  const getRowData = (rowIndex: number): Record<string, string> => {
    const row = csvRows[rowIndex] || [];
    const data: Record<string, string> = {};
    Object.entries(columnMappings).forEach(([targetKey, csvHeader]) => {
      const headerIdx = csvHeaders.indexOf(csvHeader);
      if (headerIdx !== -1) {
        data[targetKey] = (row[headerIdx] || '').trim();
      }
    });
    return data;
  };

  const validateAndAnalyzeCSV = () => {
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    const rowsAnalysis: { rowIndex: number; name: string; websiteUrl: string; category: string; validationStatus: 'valid' | 'duplicate' | 'invalid'; errors: string[] }[] = [];

    csvRows.forEach((_, idx) => {
      const data = getRowData(idx);
      const name = data.name || '';
      const url = data.websiteUrl || '';
      const category = data.categorySlug || '';
      const description = data.description || '';

      const errors: string[] = [];
      if (!name) errors.push('Missing Tool Name');
      if (!url) {
        errors.push('Missing Website URL');
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errors.push('Invalid URL format');
      }
      if (!category) errors.push('Missing Category');
      if (!description) errors.push('Missing Description');

      // Check category mapping
      const mappedCategory = categoryMappings[category] || category;
      const categoryExists = categories.some((c) => c.slug === mappedCategory.toLowerCase());
      if (category && !categoryExists) {
        errors.push(`Unknown category: "${category}" (requires mapping)`);
      }

      // Duplicate Check
      let isDuplicate = false;
      if (url) {
        const normDomain = normalizeDomain(url);
        const exactMatch = tools.some((t) => normalizeDomain(t.websiteUrl) === normDomain);
        const possibleMatchName = name ? tools.some((t) => t.name.toLowerCase() === name.toLowerCase()) : false;

        if (exactMatch) {
          isDuplicate = true;
          errors.push('Exact Duplicate: Domain already registered.');
        } else if (possibleMatchName) {
          isDuplicate = true;
          errors.push('Possible Duplicate: Matching tool name registered.');
        }
      }

      let status: 'valid' | 'duplicate' | 'invalid' = 'valid';
      if (errors.length > 0 && !isDuplicate) {
        const categoryErrorsOnly = errors.every((e) => e.includes('Unknown category'));
        if (categoryErrorsOnly) {
          status = 'valid';
        } else {
          status = 'invalid';
          invalidCount++;
        }
      } else if (isDuplicate) {
        status = 'duplicate';
        duplicateCount++;
      } else {
        validCount++;
      }

      rowsAnalysis.push({
        rowIndex: idx,
        name,
        websiteUrl: url,
        category,
        validationStatus: status,
        errors,
      });
    });

    return {
      validCount,
      duplicateCount,
      invalidCount,
      rowsAnalysis,
    };
  };

  const executeBulkImport = () => {
    setIsImporting(true);

    const { rowsAnalysis } = validateAndAnalyzeCSV();
    const selectedRowsToImport = rowsAnalysis.filter(
      (r) => selectedImportRows.has(r.rowIndex) && r.validationStatus !== 'invalid'
    );

    const itemsToImport: any[] = [];
    const failedRows: any[] = [];
    let successCount = 0;
    let duplicateCount = 0;

    const validPricing = ['free', 'freemium', 'paid', 'free-trial', 'contact-sales'];

    selectedRowsToImport.forEach((analysis) => {
      const data = getRowData(analysis.rowIndex);
      
      if (analysis.validationStatus === 'duplicate') {
        duplicateCount++;
        return;
      }

      const mappedCategory = categoryMappings[data.categorySlug] || data.categorySlug;
      const pricingType = data.pricing ? data.pricing.toLowerCase() : 'free';
      const finalPricing = validPricing.includes(pricingType) ? pricingType : 'free';

      itemsToImport.push({
        name: data.name,
        tagline: data.tagline || '',
        description: data.description || '',
        categorySlug: mappedCategory.toLowerCase(),
        subCategory: data.subCategory || '',
        pricing: finalPricing,
        websiteUrl: data.websiteUrl,
        logoUrl: data.logoUrl || '',
        status: importStatusMode,
        tags: data.tags || '',
        features: data.features || '',
        useCases: data.useCases || '',
        platforms: data.platforms || '',
      });

      successCount++;
    });

    rowsAnalysis.forEach((r) => {
      if (r.validationStatus === 'invalid' || !selectedImportRows.has(r.rowIndex)) {
        failedRows.push(getRowData(r.rowIndex));
      }
    });

    if (itemsToImport.length > 0) {
      const chunkArray = (arr: any[], size: number) => {
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        return result;
      };
      const batches = chunkArray(itemsToImport, 250);
      for (const batch of batches) {
        bulkImportTools(batch);
      }
    }

    setImportResult({
      success: successCount,
      duplicates: duplicateCount,
      failed: failedRows.length,
      failedRows,
    });
    setIsImporting(false);
    onToast(`Bulk import complete. Imported ${successCount} listings!`, 'success');
  };

  const exportFailedRows = () => {
    if (!importResult || importResult.failedRows.length === 0) return;
    const headers = ['name', 'websiteUrl', 'categorySlug', 'description', 'tagline', 'subCategory', 'pricing', 'logoUrl', 'features', 'useCases', 'platforms', 'tags'];
    const csvContent = [
      headers.join(','),
      ...importResult.failedRows.map((row) => 
        headers.map((field) => `"${(row[field] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'failed_import_rows.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupLocalStorage = () => {
    const keys = [
      'ai_tools',
      'ai_categories',
      'ai_reviews',
      'ai_campaigns',
      'ai_payments',
      'ai_claims',
      'ai_blog_posts',
      'ai_collections',
      'ai_audit_logs',
      'ai_notifications',
      'ai_analytics_events',
      'ai_users'
    ];
    const backup: Record<string, any> = {};
    keys.forEach((k) => {
      const data = localStorage.getItem(k);
      if (data) {
        backup[k] = JSON.parse(data);
      }
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aifynest_localstorage_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('LocalStorage database backup downloaded successfully!', 'success');
  };

  const selectedToolStats = getSelectedToolAnalyticsData();

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
            { id: 'import', name: 'Import CSV', count: 0 },
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
                    onClick={handleBackupLocalStorage} 
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                  >
                    <span>💾 Backup LocalStorage</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('import')} 
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>📥 Import CSV</span>
                  </button>
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

              {/* Bulk Actions Control Bar */}
              {selectedTools.size > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-primary-light)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    Selected {selectedTools.size} Tools
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        bulkUpdateToolsStatus(Array.from(selectedTools), 'approved');
                        setSelectedTools(new Set());
                        onToast(`Successfully published ${selectedTools.size} tools!`, 'success');
                      }}
                      className="btn btn-primary btn-xs"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => {
                        bulkUpdateToolsStatus(Array.from(selectedTools), 'pending');
                        setSelectedTools(new Set());
                        onToast(`Submitted ${selectedTools.size} tools for review.`, 'success');
                      }}
                      className="btn btn-outline btn-xs"
                    >
                      Submit for Review
                    </button>
                    <button
                      onClick={() => {
                        bulkUpdateToolsStatus(Array.from(selectedTools), 'archived');
                        setSelectedTools(new Set());
                        onToast(`Archived ${selectedTools.size} tools.`, 'success');
                      }}
                      className="btn btn-outline btn-xs"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to permanently delete ${selectedTools.size} selected tools?`)) {
                          bulkDeleteTools(Array.from(selectedTools));
                          setSelectedTools(new Set());
                          onToast(`Successfully deleted ${selectedTools.size} tools.`, 'success');
                        }
                      }}
                      className="btn btn-outline btn-xs"
                      style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedTools(new Set())}
                      className="btn btn-outline btn-xs"
                    >
                      Cancel Selection
                    </button>
                  </div>
                </div>
              )}

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              const pageIds = filteredTools.map((t) => t.id);
                              setSelectedTools(new Set(pageIds));
                            } else {
                              setSelectedTools(new Set());
                            }
                          }}
                          checked={filteredTools.length > 0 && filteredTools.every((t) => selectedTools.has(t.id))}
                        />
                      </th>
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
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedTools.has(tool.id)}
                            onChange={(e) => {
                              const newSelection = new Set(selectedTools);
                              if (e.target.checked) {
                                newSelection.add(tool.id);
                              } else {
                                newSelection.delete(tool.id);
                              }
                              setSelectedTools(newSelection);
                            }}
                          />
                        </td>
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
                            <option value="archived">Archived</option>
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

          {/* TAB 8: BULK IMPORT WORKSPACE */}
          {activeTab === 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>Bulk AI Tools Importer</h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Upload CSV templates to map, validate, and batch import hundreds of AI tool listings as drafts.</span>
              </div>

              {/* 1. CSV File Upload Section */}
              <div style={{ padding: '24px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
                <input
                  type="file"
                  accept=".csv"
                  id="csv-file-uploader"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          handleCSVUpload(event.target.result as string);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <label htmlFor="csv-file-uploader" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span>📂 Choose CSV File</span>
                </label>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                  Supported fields: name (req), websiteUrl (req), categorySlug (req), description (req), tagline, subCategory, pricing, logoUrl, features, useCases, platforms, tags.
                </p>
                {csvRows.length > 0 && (
                  <div style={{ marginTop: '14px', fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'bold' }}>
                    Loaded {csvRows.length} rows from CSV file!
                  </div>
                )}
              </div>

              {/* 2. Column Mapping Block */}
              {csvHeaders.length > 0 && (
                <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Column Mappings</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                      { key: 'name', label: 'Tool Name (Required)' },
                      { key: 'websiteUrl', label: 'Website URL (Required)' },
                      { key: 'categorySlug', label: 'Category Slug (Required)' },
                      { key: 'description', label: 'Description (Required)' },
                      { key: 'tagline', label: 'Tagline' },
                      { key: 'subCategory', label: 'Subcategory' },
                      { key: 'pricing', label: 'Pricing Model' },
                      { key: 'logoUrl', label: 'Logo Image URL' },
                      { key: 'features', label: 'Features (comma list)' },
                      { key: 'useCases', label: 'Use Cases (comma list)' },
                      { key: 'platforms', label: 'Platforms' },
                      { key: 'tags', label: 'Tags' },
                    ].map((f) => (
                      <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{f.label}</label>
                        <select
                          className="form-input btn-xs"
                          value={columnMappings[f.key] || ''}
                          onChange={(e) => setColumnMappings({ ...columnMappings, [f.key]: e.target.value })}
                        >
                          <option value="">-- Do Not Map --</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Category Mappings block */}
              {csvRows.length > 0 && (
                <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Category Mapping Deck</h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Map custom text categories found in your CSV file to directory's official slugs.
                  </p>
                  
                  {/* Extract unique categories in CSV rows */}
                  {(() => {
                    const uniqueCsvCategories = Array.from(new Set(csvRows.map((_, i) => getRowData(i).categorySlug).filter(Boolean)));
                    const unknownCsvCategories = uniqueCsvCategories.filter(cat => 
                      !categories.some(c => c.slug === (categoryMappings[cat] || cat).toLowerCase())
                    );

                    if (unknownCsvCategories.length === 0) {
                      return <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>All CSV categories mapped successfully!</div>;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {unknownCsvCategories.map((csvCat) => (
                          <div key={csvCat} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', minWidth: '150px' }}>"{csvCat}" ➔</span>
                            <select
                              className="form-input btn-xs"
                              value={categoryMappings[csvCat] || ''}
                              onChange={(e) => setCategoryMappings({ ...categoryMappings, [csvCat]: e.target.value })}
                              style={{ width: '200px' }}
                            >
                              <option value="">-- Select Map Target --</option>
                              {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 4. Analysis & Validation Ledger Section */}
              {csvRows.length > 0 && (() => {
                const { validCount, duplicateCount, invalidCount, rowsAnalysis } = validateAndAnalyzeCSV();
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Summary metrics header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Rows</div>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{csvRows.length}</div>
                      </div>
                      <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-success)', marginBottom: '4px' }}>Valid Rows</div>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-success)' }}>{validCount}</div>
                      </div>
                      <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-warning)', marginBottom: '4px' }}>Duplicates Found</div>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-warning)' }}>{duplicateCount}</div>
                      </div>
                      <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-danger)', marginBottom: '4px' }}>Invalid Rows</div>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-danger)' }}>{invalidCount}</div>
                      </div>
                    </div>

                    {/* Import Options Toolbar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-card)',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Import tools status:</span>
                          <select
                            className="form-input btn-sm"
                            value={importStatusMode}
                            onChange={(e) => setImportStatusMode(e.target.value as any)}
                            style={{ width: 'auto' }}
                          >
                            <option value="draft">Draft (Recommended)</option>
                            <option value="pending">Pending Review</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          disabled={isImporting || selectedImportRows.size === 0}
                          onClick={executeBulkImport}
                          className="btn btn-primary"
                        >
                          {isImporting ? 'Importing...' : `Confirm & Import (${selectedImportRows.size} rows)`}
                        </button>
                        {importResult && importResult.failed > 0 && (
                          <button
                            onClick={exportFailedRows}
                            className="btn btn-outline"
                          >
                            📥 Export Failed Rows ({importResult.failed})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Import results feedback summary card */}
                    {importResult && (
                      <div style={{ padding: '16px', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)' }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>Import Task Complete</h5>
                        <ul style={{ fontSize: '11px', margin: 0, paddingLeft: '16px', display: 'flex', gap: '20px' }}>
                          <li>Success imports: <strong>{importResult.success}</strong></li>
                          <li>Duplicates skipped: <strong>{importResult.duplicates}</strong></li>
                          <li>Failed rows: <strong>{importResult.failed}</strong></li>
                        </ul>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allIndices = new Set<number>();
                                    rowsAnalysis.forEach(r => allIndices.add(r.rowIndex));
                                    setSelectedImportRows(allIndices);
                                  } else {
                                    setSelectedImportRows(new Set());
                                  }
                                }}
                                checked={selectedImportRows.size === rowsAnalysis.length}
                              />
                            </th>
                            <th>Tool Name</th>
                            <th>Website Url</th>
                            <th>Category</th>
                            <th>Pricing</th>
                            <th>Status</th>
                            <th>Warnings/Errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rowsAnalysis.map((analysis) => {
                            const data = getRowData(analysis.rowIndex);
                            
                            return (
                              <tr key={analysis.rowIndex} style={{
                                opacity: selectedImportRows.has(analysis.rowIndex) ? 1 : 0.6,
                                backgroundColor: analysis.validationStatus === 'invalid' ? 'rgba(239, 68, 68, 0.05)' : analysis.validationStatus === 'duplicate' ? 'rgba(245, 158, 11, 0.05)' : 'inherit'
                              }}>
                                <td style={{ textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    disabled={analysis.validationStatus === 'invalid'}
                                    checked={selectedImportRows.has(analysis.rowIndex) && analysis.validationStatus !== 'invalid'}
                                    onChange={(e) => {
                                      const next = new Set(selectedImportRows);
                                      if (e.target.checked) {
                                        next.add(analysis.rowIndex);
                                      } else {
                                        next.delete(analysis.rowIndex);
                                      }
                                      setSelectedImportRows(next);
                                    }}
                                  />
                                </td>
                                <td style={{ fontWeight: 'bold' }}>{analysis.name || '(Empty)'}</td>
                                <td>{analysis.websiteUrl || '(Empty)'}</td>
                                <td>{analysis.category || '(Empty)'}</td>
                                <td>{data.pricing || 'free'}</td>
                                <td>
                                  <span className={`badge ${analysis.validationStatus === 'valid' ? 'badge-approved' : analysis.validationStatus === 'duplicate' ? 'badge-pending' : 'badge-rejected'}`}>
                                    {analysis.validationStatus.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ color: analysis.validationStatus === 'invalid' ? 'var(--color-danger)' : 'var(--text-secondary)', fontSize: '10px' }}>
                                  {analysis.errors.join(' | ') || 'Passed validation'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: 0 }}>AIFynest Analytics Deck</h3>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Platform-wide traffic tracking and user logs database metrics.</span>
                </div>
                
                {/* Timeframe selector */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setAdminTimeframe(range)}
                      className={`btn btn-xs ${adminTimeframe === range ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === '1y' ? '12 Months' : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform metrics counters cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="stats-box-grid">
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Platform Views</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.views}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Platform Clicks</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.clicks}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Platform CTR</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.ctr}%</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Favorites Logged</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.favorites}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reviews Submitted</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.reviewsSubmitted}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Search Impressions</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.searchImpressions}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Registered Users</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.totalUsers}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tool Owners</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.totalOwners}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Published AI Tools</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{adminStats.totalPublishedTools}</div>
                </div>
              </div>

              {/* Drill-down Tool Analytics Selector Section */}
              <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>🔍 Drill-down Tool Analytics Inspector</h4>
                  <select
                    className="form-input btn-sm"
                    value={adminSelectedToolId}
                    onChange={(e) => setAdminSelectedToolId(e.target.value)}
                    style={{ width: 'auto', padding: '6px 12px' }}
                  >
                    <option value="">-- Select an AI Tool --</option>
                    {tools.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} (owner-id: {t.ownerId || 'unclaimed'})</option>
                    ))}
                  </select>
                </div>

                {selectedToolStats ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: 'var(--text-xs)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>Performance Summary:</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span>Profile Views</span>
                        <strong>{selectedToolStats.views}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span>Website Redirect Clicks</span>
                        <strong>{selectedToolStats.clicks}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span>Outbound CTR</span>
                        <strong>{selectedToolStats.ctr}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span>Favorites Bookmarks</span>
                        <strong>{selectedToolStats.favorites}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                        <span>Reviews Count</span>
                        <strong>{selectedToolStats.reviewsCount}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>Traffic Sources Breakdown:</div>
                      {selectedToolStats.traffic.map((src) => (
                        <div key={src.name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                          <span>{src.name}</span>
                          <strong>{src.count} actions</strong>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span>Devices: Desktop / Mobile / Tablet</span>
                        <strong>{selectedToolStats.devices.desktop} / {selectedToolStats.devices.mobile} / {selectedToolStats.devices.tablet}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px 0', fontSize: 'var(--text-xs)' }}>
                    Please select a tool listing from the dropdown selector list above to review granular metrics.
                  </div>
                )}
              </div>

              {/* Split Category list & Referral Traffic Column */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Top Platform Categories</h4>
                  <div className="table-container">
                    <table className="data-table" style={{ fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>Category Name</th>
                          <th style={{ textAlign: 'center' }}>Views</th>
                          <th style={{ textAlign: 'center' }}>Clicks</th>
                          <th style={{ textAlign: 'center' }}>Saves</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTopCategories().slice(0, 5).map((cat) => (
                          <tr key={cat.slug}>
                            <td><strong>{cat.name}</strong></td>
                            <td style={{ textAlign: 'center' }}>{cat.views}</td>
                            <td style={{ textAlign: 'center' }}>{cat.clicks}</td>
                            <td style={{ textAlign: 'center' }}>{cat.favorites}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Traffic Referral Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
                    {getAdminTrafficSources().map((src) => (
                      <div key={src.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span>{src.name}</span>
                        <strong>{src.percentage}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analytics Rank Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>AI Listings Ranking Grid</h4>
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

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ranking</th>
                        <th>AI Tool</th>
                        <th style={{ textAlign: 'center' }}>Page Views</th>
                        <th style={{ textAlign: 'center' }}>Clicks</th>
                        <th style={{ textAlign: 'center' }}>CTR</th>
                        <th style={{ textAlign: 'center' }}>Favorites</th>
                        <th style={{ textAlign: 'center' }}>Reviews</th>
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
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.views}</td>
                          <td style={{ textAlign: 'center' }}>{item.clicks}</td>
                          <td style={{ textAlign: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>{item.ctr}%</td>
                          <td style={{ textAlign: 'center' }}>❤ {item.saves}</td>
                          <td style={{ textAlign: 'center' }}>★ {item.reviewsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
