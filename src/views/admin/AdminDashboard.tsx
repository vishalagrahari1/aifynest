/* src/views/admin/AdminDashboard.tsx */
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Modal } from '../../components/shared/Modal';
import { StarRating } from '../../components/shared/StarRating';
import { DataQualityAudit } from './DataQualityAudit';
import { getToolLogoUrl, handleLogoError } from '../../utils/toolHelpers';
import { MarkdownRenderer } from '../../components/shared/MarkdownRenderer';
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
    blogPosts,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
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
    campaigns,
    ledger,
    adjustWalletBalance,
    reports,
    verificationRequests,
    resolveReport,
    approveToolVerification,
    revokeToolVerification,
    sponsorships,
  } = useDatabase();
  const { user } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'tools' | 'blog' | 'import' | 'affiliates' | 'claims' | 'reviews' | 'analytics' | 'notifications' | 'logs' | 'pending_review' | 'changes_requested' | 'data_quality' | 'monetization' | 'financial_ledger' | 'reports' | 'verification_requests'>('overview');

  // Filters for submissions moderation table
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'needs_changes'>('all');
  const [subCatFilter, setSubCatFilter] = useState<string>('all');
  const [subSearch, setSubSearch] = useState<string>('');

  // Filters for tools index list
  const [toolsStatusFilter, setToolsStatusFilter] = useState<string>('all');
  const [toolsSearch, setToolsSearch] = useState<string>('');

  // Blog management states
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCatFilter, setBlogCatFilter] = useState('all');
  const [blogStatusFilter, setBlogStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlogSlug, setEditingBlogSlug] = useState<string | null>(null);
  const [blogStatusInput, setBlogStatusInput] = useState<'draft' | 'published'>('published');
  const [blogTitleInput, setBlogTitleInput] = useState('');
  const [blogSlugInput, setBlogSlugInput] = useState('');
  const [blogCategoryInput, setBlogCategoryInput] = useState('AI Image Generation');
  const [blogAuthorInput, setBlogAuthorInput] = useState('AIFynest Editorial Team');
  const [blogReadTimeInput, setBlogReadTimeInput] = useState('8 min read');
  const [blogImageInput, setBlogImageInput] = useState('');
  const [blogExcerptInput, setBlogExcerptInput] = useState('');
  const [blogContentInput, setBlogContentInput] = useState('');
  const [savedCursorPos, setSavedCursorPos] = useState<{ start: number; end: number } | null>(null);
  const [studioActiveTab, setStudioActiveTab] = useState<'content' | 'meta' | 'seo'>('content');
  const [isSlugLocked, setIsSlugLocked] = useState<boolean>(true);

  // IMAGE INSERTER MODAL STATES
  const [isInsertImageModalOpen, setIsInsertImageModalOpen] = useState(false);
  const [insertImageUrlInput, setInsertImageUrlInput] = useState('');
  const [insertImageAltInput, setInsertImageAltInput] = useState('');

  // TABLE BUILDER & CONVERTER MODAL & INLINE PANEL STATES
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [showInlineTablePanel, setShowInlineTablePanel] = useState(false);
  const [showInlineImagePanel, setShowInlineImagePanel] = useState(false);
  const [tableActiveTab, setTableActiveTab] = useState<'paste' | 'builder'>('paste');
  const [tablePasteRawText, setTablePasteRawText] = useState('');
  const [tableGridRows, setTableGridRows] = useState(4);
  const [tableGridCols, setTableGridCols] = useState(3);
  const [tableGridData, setTableGridData] = useState<string[][]>([
    ['Header 1', 'Header 2', 'Header 3'],
    ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
    ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
    ['Row 3, Cell 1', 'Row 3, Cell 2', 'Row 3, Cell 3'],
  ]);

  const updateCursorPosition = () => {
    const textarea = document.getElementById('blog-content-textarea') as HTMLTextAreaElement;
    if (textarea) {
      setSavedCursorPos({ start: textarea.selectionStart, end: textarea.selectionEnd });
    }
  };

  const handleLocalImageUpload = (file: File, target: 'modal' | 'cover' | 'editor') => {
    if (!file || !file.type.startsWith('image/')) {
      onToast('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG)', 'error');
      return;
    }
    
    // Create short clean Blob Object URL (only ~50 chars) instead of 500,000 chars of base64 text!
    const cleanUrl = URL.createObjectURL(file);
    const cleanAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    if (target === 'modal') {
      setInsertImageUrlInput(cleanUrl);
      if (!insertImageAltInput.trim()) setInsertImageAltInput(cleanAlt);
      onToast(`Image "${file.name}" loaded cleanly!`, 'success');
    } else if (target === 'cover') {
      setBlogImageInput(cleanUrl);
      onToast(`Cover image set to "${file.name}"!`, 'success');
    } else if (target === 'editor') {
      const markdownImg = `\n\n![${cleanAlt}](${cleanUrl})\n\n`;
      insertMarkdownSnippet(markdownImg);
      onToast(`Image "${file.name}" inserted cleanly into article!`, 'success');
    }
  };

  // Helper to remove any accidental massive base64 image strings from article content
  const cleanBase64FromArticleText = (text: string): string => {
    if (!text.includes('data:image/')) return text;
    // Replace Markdown data:image base64 URLs with clean placeholder image links
    let count = 0;
    const cleaned = text.replace(/!\[(.*?)\]\(data:image\/[^;]+;base64,[^)]+\)/gi, (_, alt) => {
      count++;
      const caption = alt.trim() || `Article Image ${count}`;
      return `![${caption}](/images/sample-tool-1.png)`;
    }).replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/gi, () => {
      return '/images/sample-tool-1.png';
    });
    return cleaned;
  };

  const parseRawTableToMarkdown = (raw: string): string => {
    if (!raw.trim()) return '';
    const lines = raw.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return '';

    // Detect delimiter: tab \t, pipe |, comma , or 2+ spaces
    const firstLine = lines[0];
    let delimiter: string | RegExp = '\t';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes('|')) {
      delimiter = '|';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    } else {
      delimiter = /\s{2,}/;
    }

    const rows = lines.map(line => {
      let cells = line.split(delimiter).map(c => c.trim().replace(/^\||\|$/g, '').trim());
      if (cells.length > 1 && cells[0] === '') cells.shift();
      if (cells.length > 1 && cells[cells.length - 1] === '') cells.pop();
      return cells;
    }).filter(row => row.length > 0);

    if (rows.length === 0) return '';

    const maxCols = Math.max(...rows.map(r => r.length));

    let md = '\n\n';
    const header = rows[0];
    while (header.length < maxCols) header.push(`Col ${header.length + 1}`);
    md += '| ' + header.join(' | ') + ' |\n';
    md += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every(c => /^[-:|]+$/.test(c))) continue; // Skip existing markdown separator lines
      while (row.length < maxCols) row.push('');
      md += '| ' + row.join(' | ') + ' |\n';
    }
    md += '\n';
    return md;
  };

  const insertMarkdownSnippet = (snippet: string, wrapper = '', wrapperEnd = wrapper) => {
    const textarea = document.getElementById('blog-content-textarea') as HTMLTextAreaElement;
    let start = 0;
    let end = 0;

    if (savedCursorPos && savedCursorPos.start <= blogContentInput.length) {
      start = savedCursorPos.start;
      end = savedCursorPos.end;
    } else if (textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    } else {
      start = blogContentInput.length;
      end = blogContentInput.length;
    }

    const text = blogContentInput;
    const selected = text.substring(start, end);

    let replacement = '';
    if (wrapper) {
      replacement = `${wrapper}${selected || 'text'}${wrapperEnd}`;
    } else {
      replacement = snippet;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setBlogContentInput(newText);

    const newPos = start + replacement.length;
    setSavedCursorPos({ start: newPos, end: newPos });

    // Recalculate read time
    const words = newText.trim().split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(1, Math.ceil(words / 220));
    setBlogReadTimeInput(`${estMinutes} min read`);

    setTimeout(() => {
      const el = document.getElementById('blog-content-textarea') as HTMLTextAreaElement;
      if (el) {
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

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

  const ADMIN_EMAILS = ['mevishal1130@gmail.com', 'aifynestofficial@gmail.com'];
  const isAuthorizedAdmin = user.role === 'admin' || ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (!isAuthorizedAdmin) {
    return (
      <div className="container section text-center" style={{ maxWidth: '480px' }}>
        <Shield size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px auto' }} />
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          You do not have administrative permissions required to access the moderator console. Only authorized administrators can log in to the admin panel.
        </p>
        <Link to="/login" className="btn btn-primary">
          Log In as Admin
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

    const categorySlugs = new Set(categories.map(c => c.slug));
    const unmappedCategories = new Set<string>();

    selectedRowsToImport.forEach((analysis) => {
      const data = getRowData(analysis.rowIndex);
      const mappedCategory = (categoryMappings[data.categorySlug] || data.categorySlug || '').toLowerCase().trim().replace(/\s+/g, '-');
      if (!categorySlugs.has(mappedCategory)) {
        unmappedCategories.add(data.categorySlug || 'unspecified');
      }
    });

    if (unmappedCategories.size > 0) {
      setIsImporting(false);
      alert('Cannot Import: Please choose a valid target category mapping for: ' + Array.from(unmappedCategories).join(', '));
      return;
    }

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

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }} className="dashboard-grid admin-dashboard-grid">
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="admin-sidebar">
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px', letterSpacing: '0.05em' }} className="admin-sidebar-deck-label">
            ADMIN CONTROL DECK
          </div>
          {[
            { id: 'overview', name: 'Overview', count: 0 },
            { id: 'tools', name: 'All Tools', count: 0 },
            { id: 'blog', name: '📰 Blog Articles', count: blogPosts ? blogPosts.length : 0 },
            { id: 'import', name: 'Import CSV', count: 0 },
            { id: 'pending_review', name: 'Pending Review', count: pendingNewCount + pendingEditsCount },
            { id: 'changes_requested', name: 'Changes Requested', count: changesRequestedCount },
            { id: 'claims', name: 'Claims', count: pendingClaimsCount },
            { id: 'submissions', name: 'Submissions', count: 0 },
            { id: 'data_quality', name: 'Data Quality', count: 0 },
            { id: 'affiliates', name: 'Affiliates Linker', count: 0 },
            { id: 'reviews', name: 'Moderation', count: pendingReviews.length },
            { id: 'reports', name: 'Reported Listings', count: reports ? reports.filter(r => r.status === 'pending').length : 0 },
            { id: 'verification_requests', name: 'Verification Queue', count: verificationRequests ? verificationRequests.filter(v => v.status === 'pending').length : 0 },
            { id: 'notifications', name: 'Notifications', count: unreadNotifs.length },
            { id: 'monetization', name: 'Monetization Queue', count: campaigns ? campaigns.filter(c => c.status === 'pending').length : 0 },
            { id: 'financial_ledger', name: 'Financial Ledger', count: 0 },
            { id: 'logs', name: 'Audit Logs', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setReviewingTool(null);
                setActiveTab(tab.id as any);
              }}
              className={`admin-sidebar-tab-btn ${activeTab === tab.id ? 'admin-sidebar-tab-active' : ''}`}
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
                System Administration panel for aifynestofficial@gmail.com
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
              className="admin-review-overlay"
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
                className="admin-review-bottom-bar"
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
                              <img src={getToolLogoUrl(tool)} alt={tool.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => handleLogoError(e, tool.name)} />
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
                            <img src={getToolLogoUrl(tool)} alt={tool.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => handleLogoError(e, tool.name)} />
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
                          <img src={getToolLogoUrl(tool)} alt={tool.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => handleLogoError(e, tool.name)} />
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

          {/* TAB: BLOG & ARTICLES CMS MANAGER */}
          {activeTab === 'blog' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📰 Blog & Article Publishing Manager
                  </h3>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    Create, edit, publish, and manage long-form SEO articles, buying guides, and AI tool roundups.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingBlogSlug(null);
                    setBlogTitleInput('');
                    setBlogSlugInput('');
                    setBlogCategoryInput('AI Image Generation');
                    setBlogAuthorInput('AIFynest Editorial Team');
                    setBlogReadTimeInput('8 min read');
                    setBlogImageInput('');
                    setBlogExcerptInput('');
                    setBlogContentInput('');
                    setBlogStatusInput('draft');
                    setIsBlogModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  <span>Write & Create Article</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  placeholder="Search articles by title or slug..."
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-xs)', flex: 1, minWidth: '220px' }}
                />
                <select
                  value={blogCatFilter}
                  onChange={(e) => setBlogCatFilter(e.target.value)}
                  style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-xs)', fontWeight: '600' }}
                >
                  <option value="all">All Categories</option>
                  <option value="AI Image Generation">AI Image Generation</option>
                  <option value="AI Productivity">AI Productivity</option>
                  <option value="AI Writing">AI Writing</option>
                  <option value="AI Coding">AI Coding</option>
                  <option value="AI Video">AI Video</option>
                  <option value="AI Business">AI Business</option>
                  <option value="AI Study & Education">AI Study & Education</option>
                </select>
                <select
                  value={blogStatusFilter}
                  onChange={(e) => setBlogStatusFilter(e.target.value as any)}
                  style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-xs)', fontWeight: '600' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published Only</option>
                  <option value="draft">Drafts Only</option>
                </select>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Total Articles: <strong>{blogPosts ? blogPosts.length : 0}</strong>
                </span>
              </div>

              {/* Articles Table */}
              <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Banner</th>
                      <th>Article Title & Slug</th>
                      <th>Status</th>
                      <th>Category</th>
                      <th>Author</th>
                      <th>Date</th>
                      <th>Read Time</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(blogPosts || [])
                      .filter((b) => {
                        const matchQuery = !blogSearch.trim() || b.title.toLowerCase().includes(blogSearch.toLowerCase()) || b.slug.toLowerCase().includes(blogSearch.toLowerCase());
                        const matchCat = blogCatFilter === 'all' || b.category === blogCatFilter;
                        const matchStatus = blogStatusFilter === 'all' || (blogStatusFilter === 'draft' ? b.status === 'draft' : b.status !== 'draft');
                        return matchQuery && matchCat && matchStatus;
                      })
                      .map((post) => (
                        <tr key={post.slug}>
                          <td>
                            <img
                              src={post.image || '/logo.png'}
                              alt={post.title}
                              style={{ width: '48px', height: '36px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{post.title}</div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>/blog/{post.slug}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                backgroundColor: post.status === 'draft' ? '#fef3c7' : '#dcfce7',
                                color: post.status === 'draft' ? '#b45309' : '#15803d',
                                border: `1px solid ${post.status === 'draft' ? '#fde68a' : '#bbf7d0'}`,
                              }}
                            >
                              {post.status === 'draft' ? '📝 Draft' : '🟢 Published'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-featured" style={{ fontSize: '10px' }}>{post.category || 'General'}</span>
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{post.author || 'Editorial Team'}</td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{post.date}</td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{post.readTime}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Eye size={12} /> View
                              </a>
                              <button
                                onClick={() => {
                                  setEditingBlogSlug(post.slug);
                                  setBlogTitleInput(post.title);
                                  setBlogSlugInput(post.slug);
                                  setBlogCategoryInput(post.category || 'AI Image Generation');
                                  setBlogAuthorInput(post.author || 'AIFynest Editorial Team');
                                  setBlogReadTimeInput(post.readTime || '8 min read');
                                  setBlogImageInput(post.image || '');
                                  setBlogExcerptInput(post.excerpt || '');
                                  setBlogContentInput(post.content || '');
                                  setBlogStatusInput(post.status === 'draft' ? 'draft' : 'published');
                                  setIsBlogModalOpen(true);
                                }}
                                className="btn btn-outline btn-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete article "${post.title}" permanently?`)) {
                                    deleteBlogPost(post.slug);
                                    onToast(`Article "${post.title}" deleted.`, 'info');
                                  }
                                }}
                                className="btn btn-outline btn-xs"
                                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                              >
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
                            <img src={getToolLogoUrl(tool)} alt={tool.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => handleLogoError(e, tool.name)} />
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
                              <img src={getToolLogoUrl(tool)} alt={tool.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => handleLogoError(e, tool.name)} />
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
                            <img src={getToolLogoUrl(item.tool)} alt="logo" style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'cover' }} onError={(e) => handleLogoError(e, item.tool.name)} />
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

          {/* TAB: SPONSORSHIPS & PAYMENTS MANAGEMENT */}
          {activeTab === 'monetization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>Sponsorships & Payments Management</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Monitor fixed-duration sponsorship performance, review transactions, and audit payment provider statuses.
                </span>
              </div>

              {/* Sponsorship Statistics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="stats-box-grid">
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>Active Sponsorships</span>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-success)' }}>
                    {sponsorships ? sponsorships.filter(s => s.status === 'active').length : 0}
                  </span>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>Pending Sponsorships</span>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                    {sponsorships ? sponsorships.filter(s => s.status === 'pending').length : 0}
                  </span>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>Expired Sponsorships</span>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    {sponsorships ? sponsorships.filter(s => s.status === 'expired').length : 0}
                  </span>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block' }}>Total Revenue</span>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    ${sponsorships ? sponsorships.filter(s => s.payment_status === 'paid').reduce((acc, s) => acc + (s.price || 0), 0).toFixed(2) : '0.00'} <span style={{ fontSize: '10px' }}>USD</span>
                  </span>
                </div>
              </div>

              {/* Sponsorships Table */}
              <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>All Sponsorship Records</h4>
                {sponsorships && sponsorships.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                          <th style={{ padding: '10px' }}>Tool</th>
                          <th style={{ padding: '10px' }}>Owner</th>
                          <th style={{ padding: '10px' }}>Plan</th>
                          <th style={{ padding: '10px' }}>Amount</th>
                          <th style={{ padding: '10px' }}>Payment Status</th>
                          <th style={{ padding: '10px' }}>Sponsorship Status</th>
                          <th style={{ padding: '10px' }}>Starts</th>
                          <th style={{ padding: '10px' }}>Expires</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sponsorships.map((s) => {
                          const t = tools.find((tool) => tool.id === s.tool_id);
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{t?.name || s.tool_id.slice(0, 8)}</td>
                              <td style={{ padding: '10px' }}>{s.owner_id.slice(0, 8)}...</td>
                              <td style={{ padding: '10px' }}>{s.duration_days} Days</td>
                              <td style={{ padding: '10px' }}>${s.price?.toFixed(2)} USD</td>
                              <td style={{ padding: '10px', textTransform: 'capitalize' }}>
                                <span className={`badge ${s.payment_status === 'paid' ? 'badge-approved' : 'badge-pending'}`}>
                                  {s.payment_status}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textTransform: 'capitalize' }}>
                                <span className={`badge ${s.status === 'active' ? 'badge-approved' : s.status === 'expired' ? 'badge-rejected' : 'badge-pending'}`}>
                                  {s.status} {s.is_manual_override && '(Override)'}
                                </span>
                              </td>
                              <td style={{ padding: '10px' }}>{s.starts_at ? new Date(s.starts_at).toLocaleDateString() : '—'}</td>
                              <td style={{ padding: '10px' }}>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>
                                {s.status === 'pending' && (
                                  <button
                                    onClick={async () => {
                                      const reason = window.prompt('Enter mandatory reason for Super Admin Emergency Manual Override:');
                                      if (reason && reason.trim()) {
                                        try {
                                          const { supabase } = await import('../../utils/supabase');
                                          const { error } = await supabase.rpc('emergency_manual_override_activation', {
                                            p_sponsorship_id: s.id,
                                            p_reason: reason.trim()
                                          });
                                          if (error) throw error;
                                          onToast('Super Admin Override Activated with mandatory audit log reason.', 'success');
                                        } catch (err: any) {
                                          onToast(err.message || 'Override failed', 'error');
                                        }
                                      }
                                    }}
                                    className="btn btn-outline btn-xs"
                                    style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold-hover)', fontSize: '10px' }}
                                  >
                                    Super Admin Override
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: '20px 0' }}>
                    No sponsorship records found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: REPORTED LISTINGS */}
          {activeTab === 'reports' && (
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🚩 Reported Listings Flagged by Users
              </h2>
              {reports && reports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reports.map((rep) => {
                    const reportedTool = tools.find(t => t.id === rep.tool_id);
                    return (
                      <div key={rep.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: rep.status === 'pending' ? '#ef444405' : 'transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                              {reportedTool ? reportedTool.name : 'Unknown Tool'} ({rep.reason})
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              Reported At: {new Date(rep.created_at).toLocaleString()} | Reporter User ID: {rep.reporter_user_id || 'Anonymous Guest'}
                            </span>
                            <p style={{ margin: '8px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                              <strong>Details provided:</strong> {rep.details || 'No additional explanation details.'}
                            </p>
                            <span className={`badge`} style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', backgroundColor: rep.status === 'pending' ? 'var(--color-warning-light)' : 'var(--color-success-light)', color: rep.status === 'pending' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                              Status: {rep.status.toUpperCase()}
                            </span>
                          </div>
                          {rep.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={async () => {
                                  try {
                                    await resolveReport(rep.id, 'resolved');
                                    onToast('Report status updated to RESOLVED.', 'success');
                                  } catch (err: any) {
                                    onToast(err.message || 'Action failed', 'error');
                                  }
                                }}
                                className="btn btn-primary btn-xs"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await resolveReport(rep.id, 'dismissed');
                                    onToast('Report DISMISSED.', 'success');
                                  } catch (err: any) {
                                    onToast(err.message || 'Action failed', 'error');
                                  }
                                }}
                                className="btn btn-outline btn-xs"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  No reports logged yet.
                </div>
              )}
            </div>
          )}

          {/* TAB: VERIFICATION QUEUE */}
          {activeTab === 'verification_requests' && (
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ Tool Verification Submission Queue
              </h2>
              {verificationRequests && verificationRequests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {verificationRequests.map((req) => {
                    const targetTool = tools.find(t => t.id === req.tool_id);
                    return (
                      <div key={req.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                              {targetTool ? targetTool.name : 'Unknown Tool'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              Owner ID: {req.owner_id} | Created: {new Date(req.created_at).toLocaleString()}
                            </span>
                            <p style={{ margin: '8px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                              <strong>Owner notes:</strong> {req.notes || 'No supporting proof logs provided.'}
                            </p>
                            <span className={`badge`} style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', backgroundColor: req.status === 'pending' ? 'var(--color-warning-light)' : req.status === 'approved' ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: req.status === 'pending' ? 'var(--color-warning)' : req.status === 'approved' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              Status: {req.status.toUpperCase()}
                            </span>
                          </div>
                          {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={async () => {
                                  try {
                                    await approveToolVerification(req.id);
                                    onToast('Verification request APPROVED! Listing badge updated.', 'success');
                                  } catch (err: any) {
                                    onToast(err.message || 'Approval failed', 'error');
                                  }
                                }}
                                className="btn btn-primary btn-xs"
                              >
                                Approve & Verify
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await revokeToolVerification(req.tool_id, 'Admin rejected verification request.');
                                    onToast('Verification request REJECTED.', 'success');
                                  } catch (err: any) {
                                    onToast(err.message || 'Rejection failed', 'error');
                                  }
                                }}
                                className="btn btn-outline btn-xs"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {req.status === 'approved' && (
                            <button
                              onClick={async () => {
                                try {
                                  await revokeToolVerification(req.tool_id, 'Revoked by administrator manually.');
                                  onToast('Verification status REVOKED.', 'success');
                                } catch (err: any) {
                                  onToast(err.message || 'Revocation failed', 'error');
                                }
                              }}
                              className="btn btn-outline btn-xs"
                              style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                            >
                              Revoke Verification
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  No verification requests logged.
                </div>
              )}
            </div>
          )}

          {/* TAB: GLOBAL FINANCIAL LEDGER */}
          {activeTab === 'financial_ledger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>Global Financial Ledger</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Platform append-only transactional accounting log.</span>
                </div>
              </div>

              {/* Administrative Adjustment Form */}
              <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>Create Compensating Balance Adjustment</h4>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const ownerId = fd.get('owner_id') as string;
                    const amount = Number(fd.get('adj_amount'));
                    const reason = fd.get('adj_reason') as string;
                    try {
                      await adjustWalletBalance(ownerId, amount, reason);
                      onToast('Administrative adjustment applied and ledgered successfully!', 'success');
                      e.currentTarget.reset();
                    } catch (err: any) {
                      onToast(err.message || 'Adjustment failed', 'error');
                    }
                  }}
                  style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Target Owner Profile ID</span>
                    <input name="owner_id" type="text" className="form-input btn-sm" placeholder="UUID" required style={{ width: '220px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Amount (Positive/Negative)</span>
                    <input name="adj_amount" type="number" step="0.01" className="form-input btn-sm" placeholder="e.g. -50.00" required style={{ width: '120px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Audit adjustment Notes</span>
                    <input name="adj_reason" type="text" className="form-input btn-sm" placeholder="Reason details..." required style={{ width: '280px' }} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Apply Adjustment
                  </button>
                </form>
              </div>

              {/* Global Ledger Entries list */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>All Ledger Transactions</h4>
                {ledger && ledger.length > 0 ? (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                          <th style={{ padding: '10px 14px' }}>Date</th>
                          <th style={{ padding: '10px 14px' }}>Owner ID</th>
                          <th style={{ padding: '10px 14px' }}>Transaction Type</th>
                          <th style={{ padding: '10px 14px' }}>Reference</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((item: any) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleString()}</td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{item.owner_id}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.transaction_type}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{item.reference_id || item.id}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 'bold', color: Number(item.amount) > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {Number(item.amount) > 0 ? '+' : ''}${Number(item.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                    No ledger transactions found in the global platform logs.
                  </div>
                )}
              </div>
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

          {/* TAB 10: DATA QUALITY AUDIT */}
          {activeTab === 'data_quality' && (
            <DataQualityAudit onToast={onToast} />
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

      {/* STATE-OF-THE-ART ARTICLE PUBLISHING STUDIO SUITE (EXACT CMS SCREENSHOT DESIGN) */}
      {isBlogModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#ffffff',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fade-in-overlay 0.2s ease-out',
            color: '#0f172a',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* TOP CONTROL BAR (MATCHING SCREENSHOT TOP BAR) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 32px',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          >
            {/* Left Status Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#64748b' }}>
              <div>
                Status:{' '}
                <strong style={{ color: blogStatusInput === 'draft' ? '#d97706' : '#15803d' }}>
                  {blogStatusInput === 'draft' ? '📝 Draft' : '🟢 Published'}
                </strong>
              </div>
              <div>
                Last Modified: <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!blogTitleInput.trim() || !blogSlugInput.trim() || !blogContentInput.trim()) {
                    onToast('Title, Slug, and Article Content are required.', 'error');
                    return;
                  }
                  const cleanSlug = blogSlugInput.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
                  const estMinutes = Math.max(1, Math.ceil(blogContentInput.trim().split(/\s+/).filter(Boolean).length / 220));
                  const postData: any = {
                    slug: cleanSlug,
                    title: blogTitleInput.trim(),
                    category: blogCategoryInput,
                    author: blogAuthorInput.trim() || 'AIFynest Editorial Team',
                    readTime: blogReadTimeInput.trim() || `${estMinutes} min read`,
                    image: blogImageInput.trim() || '/images/best-ai-image-upscale-tools-2026.jpg',
                    excerpt: blogExcerptInput.trim() || blogTitleInput.trim(),
                    content: blogContentInput,
                    status: 'draft',
                    date: new Date().toISOString().split('T')[0]
                  };

                  if (editingBlogSlug) {
                    updateBlogPost(editingBlogSlug, postData);
                    onToast(`Article "${postData.title}" saved as Draft!`, 'info');
                  } else {
                    addBlogPost(postData);
                    onToast(`Article "${postData.title}" created as Draft!`, 'info');
                  }
                  setBlogStatusInput('draft');
                  setIsBlogModalOpen(false);
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '8px 16px',
                  fontWeight: '600',
                  fontSize: '13px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                💾 Save as Draft
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!blogTitleInput.trim() || !blogSlugInput.trim() || !blogContentInput.trim()) {
                    onToast('Title, Slug, and Article Content are required.', 'error');
                    return;
                  }
                  const cleanSlug = blogSlugInput.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
                  const estMinutes = Math.max(1, Math.ceil(blogContentInput.trim().split(/\s+/).filter(Boolean).length / 220));
                  const postData: any = {
                    slug: cleanSlug,
                    title: blogTitleInput.trim(),
                    category: blogCategoryInput,
                    author: blogAuthorInput.trim() || 'AIFynest Editorial Team',
                    readTime: blogReadTimeInput.trim() || `${estMinutes} min read`,
                    image: blogImageInput.trim() || '/images/best-ai-image-upscale-tools-2026.jpg',
                    excerpt: blogExcerptInput.trim() || blogTitleInput.trim(),
                    content: blogContentInput,
                    status: 'published',
                    date: new Date().toISOString().split('T')[0]
                  };

                  if (editingBlogSlug) {
                    updateBlogPost(editingBlogSlug, postData);
                    onToast(`Article "${postData.title}" published live!`, 'success');
                  } else {
                    addBlogPost(postData);
                    onToast(`Article "${postData.title}" published live!`, 'success');
                  }
                  setBlogStatusInput('published');
                  setIsBlogModalOpen(false);
                }}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  fontWeight: '600',
                  fontSize: '13px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                🚀 {editingBlogSlug && blogStatusInput === 'published' ? 'Update & Publish' : 'Publish Live'}
              </button>

              <button
                type="button"
                onClick={() => setIsBlogModalOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
                title="Close Editor"
              >
                ✕
              </button>
            </div>
          </div>

          {/* MAIN CMS CONTENT & SIDEBAR WORKSPACE */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
            {/* LEFT MAIN EDITING COLUMN */}
            <div style={{ padding: '32px 48px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title Field */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>
                  Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter article title..."
                  value={blogTitleInput}
                  onChange={(e) => {
                    setBlogTitleInput(e.target.value);
                    if (!editingBlogSlug || !isSlugLocked) {
                      setBlogSlugInput(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* CMS Navigation Tabs (Content | Meta | SEO) */}
              <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setStudioActiveTab('content')}
                  style={{
                    padding: '10px 0',
                    fontSize: '14px',
                    fontWeight: studioActiveTab === 'content' ? '600' : '400',
                    color: studioActiveTab === 'content' ? '#0f172a' : '#64748b',
                    border: 'none',
                    borderBottom: studioActiveTab === 'content' ? '2px solid #0f172a' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => setStudioActiveTab('meta')}
                  style={{
                    padding: '10px 0',
                    fontSize: '14px',
                    fontWeight: studioActiveTab === 'meta' ? '600' : '400',
                    color: studioActiveTab === 'meta' ? '#0f172a' : '#64748b',
                    border: 'none',
                    borderBottom: studioActiveTab === 'meta' ? '2px solid #0f172a' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Meta
                </button>
                <button
                  type="button"
                  onClick={() => setStudioActiveTab('seo')}
                  style={{
                    padding: '10px 0',
                    fontSize: '14px',
                    fontWeight: studioActiveTab === 'seo' ? '600' : '400',
                    color: studioActiveTab === 'seo' ? '#0f172a' : '#64748b',
                    border: 'none',
                    borderBottom: studioActiveTab === 'seo' ? '2px solid #0f172a' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  SEO
                </button>
              </div>

              {/* TAB 1: CONTENT TAB */}
              {studioActiveTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Hero Image Dropzone Box (Exact match from screenshot) */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>
                      Hero Image
                    </label>
                    <div
                      style={{
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        padding: '24px',
                        backgroundColor: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: '#64748b',
                        fontSize: '13px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <label className="btn btn-outline btn-xs" style={{ cursor: 'pointer', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: '500', padding: '6px 14px', borderRadius: '4px' }}>
                        Create New
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleLocalImageUpload(e.target.files[0], 'cover');
                          }}
                        />
                      </label>
                      <span>or</span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Enter Hero Image URL:', blogImageInput);
                          if (url !== null) setBlogImageInput(url);
                        }}
                        style={{
                          backgroundColor: '#e2e8f0',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          fontWeight: '500',
                          padding: '6px 14px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Choose from existing
                      </button>
                      <span style={{ color: '#94a3b8' }}>or drag and drop a file</span>
                      {blogImageInput && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                          <img src={blogImageInput} alt="Hero" style={{ height: '36px', width: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>✓ Image Attached</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FORMATTING TOOLBAR (EXACT MATCH SCREENSHOT) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button type="button" onClick={() => insertMarkdownSnippet('## ')} className="btn btn-outline btn-xs" style={{ border: 'none', color: '#475569', fontWeight: 'bold' }}>+ ▾</button>
                    <button type="button" onClick={() => insertMarkdownSnippet('### ')} className="btn btn-outline btn-xs" style={{ border: 'none', color: '#475569', fontWeight: 'bold' }}>T ▾</button>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <button type="button" onClick={() => insertMarkdownSnippet('', '**')} style={{ border: 'none', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', padding: '4px 8px', color: '#0f172a' }}>B</button>
                    <button type="button" onClick={() => insertMarkdownSnippet('', '*')} style={{ border: 'none', background: 'transparent', fontStyle: 'italic', cursor: 'pointer', padding: '4px 8px', color: '#0f172a' }}>I</button>
                    <button type="button" onClick={() => insertMarkdownSnippet('', '<u>', '</u>')} style={{ border: 'none', background: 'transparent', textDecoration: 'underline', cursor: 'pointer', padding: '4px 8px', color: '#0f172a' }}>U</button>
                    <button type="button" onClick={() => insertMarkdownSnippet('', '`')} style={{ border: 'none', background: 'transparent', fontFamily: 'monospace', cursor: 'pointer', padding: '4px 8px', color: '#0f172a' }}>&lt;&gt;</button>
                    <button type="button" onClick={() => insertMarkdownSnippet('[Link Title](https://example.com)')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px', color: '#0f172a' }}>🔗</button>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <button
                      type="button"
                      onClick={() => setShowInlineTablePanel(!showInlineTablePanel)}
                      style={{
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      📊 Table Converter
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInlineImagePanel(!showInlineImagePanel)}
                      style={{
                        backgroundColor: '#f5f3ff',
                        color: '#7c3aed',
                        border: '1px solid #ddd6fe',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      🖼️ Upload Image
                    </button>
                    {blogContentInput.includes('data:image/') && (
                      <button
                        type="button"
                        onClick={() => {
                          const cleaned = cleanBase64FromArticleText(blogContentInput);
                          setBlogContentInput(cleaned);
                          onToast('Cleaned massive base64 image code from article text!', 'success');
                        }}
                        style={{
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        title="Remove massive base64 image text and replace with clean image links"
                      >
                        🧹 Clean Base64 Text
                      </button>
                    )}
                    <button type="button" onClick={() => insertMarkdownSnippet('> Quote text here...\n')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px', color: '#0f172a' }}>💬</button>
                    <button type="button" onClick={() => insertMarkdownSnippet('## Frequently Asked Questions\n\n### What is ...?\n\nAnswer paragraph here...\n')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px', color: '#0f172a' }}>❓ FAQ</button>
                  </div>

                  {/* EXPANDABLE INLINE TABLE PASTE & CONVERTER PANEL */}
                  {showInlineTablePanel && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>
                          📋 EASY TABLE PASTE & CONVERTER
                        </span>
                        <button type="button" onClick={() => setShowInlineTablePanel(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>✕</button>
                      </div>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Paste raw unformatted table text from Excel, Google Sheets, ChatGPT, or Word..."
                        value={tablePasteRawText}
                        onChange={(e) => setTablePasteRawText(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px' }}
                      />
                      <button
                        type="button"
                        style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-end' }}
                        onClick={() => {
                          if (!tablePasteRawText.trim()) return onToast('Please paste table text first.', 'error');
                          const mdTable = parseRawTableToMarkdown(tablePasteRawText);
                          insertMarkdownSnippet(mdTable);
                          onToast('Table inserted!', 'success');
                          setTablePasteRawText('');
                          setShowInlineTablePanel(false);
                        }}
                      >
                        ⚡ Convert & Insert Table at Cursor
                      </button>
                    </div>
                  )}

                  {/* EXPANDABLE INLINE IMAGE UPLOADER PANEL */}
                  {showInlineImagePanel && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #ddd6fe', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b21a8' }}>
                          🖼️ INLINE IMAGE UPLOADER
                        </span>
                        <button type="button" onClick={() => setShowInlineImagePanel(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}>
                          📁 Select Image File
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleLocalImageUpload(e.target.files[0], 'modal');
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          className="form-input btn-sm"
                          placeholder="or paste direct URL..."
                          value={insertImageUrlInput}
                          onChange={(e) => setInsertImageUrlInput(e.target.value)}
                          style={{ flex: 1, fontSize: '12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
                        />
                        <button
                          type="button"
                          style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                          onClick={() => {
                            if (!insertImageUrlInput.trim()) return onToast('Please enter an image URL', 'error');
                            const imgMarkdown = `\n\n![${insertImageAltInput.trim() || 'Article Image'}](${insertImageUrlInput.trim()})\n\n`;
                            insertMarkdownSnippet(imgMarkdown);
                            onToast('Image inserted!', 'success');
                            setInsertImageUrlInput('');
                            setShowInlineImagePanel(false);
                          }}
                        >
                          🚀 Insert Image
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MARKDOWN TEXTAREA WRITING AREA */}
                  <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '2px solid #e2e8f0', paddingLeft: '16px', minHeight: '380px' }}>
                    <textarea
                      id="blog-content-textarea"
                      value={blogContentInput}
                      onSelect={updateCursorPosition}
                      onClick={updateCursorPosition}
                      onKeyUp={updateCursorPosition}
                      onFocus={updateCursorPosition}
                      onPaste={(e) => {
                        // 1. Check if user pasted an image file directly from clipboard
                        const items = e.clipboardData?.items;
                        if (items) {
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.startsWith('image/')) {
                              const file = items[i].getAsFile();
                              if (file) {
                                e.preventDefault();
                                handleLocalImageUpload(file, 'editor');
                                return;
                              }
                            }
                          }
                        }
                        // 2. Check if pasted text contains raw base64 data URLs
                        const pastedText = e.clipboardData?.getData('text') || '';
                        if (pastedText.includes('data:image/')) {
                          e.preventDefault();
                          const cleanedText = cleanBase64FromArticleText(pastedText);
                          insertMarkdownSnippet(cleanedText);
                          onToast('Pasted content inserted cleanly without base64 image bloat!', 'success');
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        if (e.dataTransfer.files?.[0] && e.dataTransfer.files[0].type.startsWith('image/')) {
                          e.preventDefault();
                          handleLocalImageUpload(e.dataTransfer.files[0], 'editor');
                        }
                      }}
                      onChange={(e) => {
                        setBlogContentInput(e.target.value);
                        updateCursorPosition();
                        const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
                        setBlogReadTimeInput(`${Math.max(1, Math.ceil(words / 220))} min read`);
                      }}
                      placeholder="Start typing, or press '/' for commands..."
                      style={{
                        flex: 1,
                        width: '100%',
                        minHeight: '380px',
                        padding: '12px 0',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '15px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        lineHeight: '1.7',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: META TAB */}
              {studioActiveTab === 'meta' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px', display: 'block' }}>
                      Article Excerpt / Summary
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Short summary for homepage cards..."
                      value={blogExcerptInput}
                      onChange={(e) => setBlogExcerptInput(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px', display: 'block' }}>
                        Category
                      </label>
                      <select
                        className="form-input"
                        value={blogCategoryInput}
                        onChange={(e) => setBlogCategoryInput(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="AI Image Generation">AI Image Generation</option>
                        <option value="AI Productivity">AI Productivity</option>
                        <option value="AI Writing">AI Writing</option>
                        <option value="AI Coding">AI Coding</option>
                        <option value="AI Video">AI Video</option>
                        <option value="AI Business">AI Business</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px', display: 'block' }}>
                        Estimated Read Time
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={blogReadTimeInput}
                        onChange={(e) => setBlogReadTimeInput(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEO TAB */}
              {studioActiveTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px', display: 'block' }}>
                      SEO Meta Description
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Meta description for Google & LLM search indexing..."
                      value={blogExcerptInput}
                      onChange={(e) => setBlogExcerptInput(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>Google Search Result Preview:</span>
                    <h4 style={{ margin: '6px 0 2px 0', fontSize: '16px', color: '#1a0dab' }}>{blogTitleInput || 'Article Title'} - AIFynest</h4>
                    <span style={{ fontSize: '12px', color: '#006621' }}>https://aifynest.com/blog/{blogSlugInput || 'slug'}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#545454' }}>{blogExcerptInput || 'Meta description placeholder...'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR COLUMN (EXACT MATCH SCREENSHOT) */}
            <div
              style={{
                borderLeft: '1px solid #e2e8f0',
                padding: '32px 24px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                overflowY: 'auto',
              }}
            >
              {/* Published At */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>
                  Published At
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value="October 6th 2026"
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 14px',
                      fontSize: '13px',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8' }}>📅</span>
                </div>
              </div>

              {/* Authors */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>
                  Authors
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={blogAuthorInput}
                    onChange={(e) => setBlogAuthorInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '16px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reviewers / Category */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>
                  Reviewers / Category
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={blogCategoryInput}
                    onChange={(e) => setBlogCategoryInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="AI Image Generation">AI Image Generation</option>
                    <option value="AI Productivity">AI Productivity</option>
                    <option value="AI Writing">AI Writing</option>
                    <option value="AI Coding">AI Coding</option>
                  </select>
                  <button
                    type="button"
                    style={{
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '16px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Publishing Status Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                  Publishing Status
                </label>
                <select
                  value={blogStatusInput}
                  onChange={(e) => setBlogStatusInput(e.target.value as 'draft' | 'published')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: blogStatusInput === 'draft' ? '#b45309' : '#15803d',
                    backgroundColor: blogStatusInput === 'draft' ? '#fef3c7' : '#dcfce7',
                    border: `1px solid ${blogStatusInput === 'draft' ? '#fde68a' : '#bbf7d0'}`,
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="published">🟢 Published (Live on Site)</option>
                  <option value="draft">📝 Draft (Hidden from Site)</option>
                </select>
              </div>

              {/* Slug Field with Unlock Link */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569', margin: 0 }}>
                    Slug
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSlugLocked(!isSlugLocked)}
                    style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    {isSlugLocked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
                <input
                  type="text"
                  disabled={isSlugLocked}
                  value={blogSlugInput}
                  onChange={(e) => setBlogSlugInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: isSlugLocked ? '#64748b' : '#0f172a',
                    backgroundColor: isSlugLocked ? '#f1f5f9' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED INSERT IMAGE AT CURSOR MODAL */}
      <Modal
        isOpen={isInsertImageModalOpen}
        title="🖼️ Insert Image into Article"
        onClose={() => setIsInsertImageModalOpen(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!insertImageUrlInput.trim()) {
              onToast('Please enter an image URL', 'error');
              return;
            }
            const altText = insertImageAltInput.trim() || 'Article Image';
            const imgMarkdown = `\n\n![${altText}](${insertImageUrlInput.trim()})\n\n`;
            insertMarkdownSnippet(imgMarkdown);
            onToast('Image inserted into article!', 'success');
            setInsertImageUrlInput('');
            setInsertImageAltInput('');
            setIsInsertImageModalOpen(false);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '460px', maxWidth: '600px' }}
        >
          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
            📍 Inserting at Cursor Position: <strong>Pos {savedCursorPos?.start ?? 0}</strong>
          </div>

          {/* File Upload Dropzone */}
          <div
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-tertiary)',
              cursor: 'pointer',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleLocalImageUpload(e.dataTransfer.files[0], 'modal');
            }}
          >
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
              📁 Drag & Drop Local Image File or Click Below
            </p>
            <label className="btn btn-outline btn-xs" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Choose File from Computer
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleLocalImageUpload(e.target.files[0], 'modal');
                }}
              />
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Image Direct URL or Upload Data URL *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. https://img.photiu.ai/pimgs/header_banner.webp or /images/upscale.jpg"
              value={insertImageUrlInput}
              onChange={(e) => setInsertImageUrlInput(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alt Text / Caption (for SEO & Accessibility)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Photiu AI Image Upscaler Interface"
              value={insertImageAltInput}
              onChange={(e) => setInsertImageAltInput(e.target.value)}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              QUICK SAMPLE / RECENT IMAGES:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => {
                  setInsertImageUrlInput('https://img.photiu.ai/pimgs/header_banner.webp');
                  setInsertImageAltInput('Photiu AI Photo Editor Banner');
                }}
              >
                📸 Photiu Banner
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => {
                  setInsertImageUrlInput('https://img.photiu.ai/pimgs/images/home_entrance/image_upscale.webp');
                  setInsertImageAltInput('AI Image Upscaler 4K');
                }}
              >
                🔍 AI 4K Upscaler
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => {
                  setInsertImageUrlInput('/images/best-ai-image-upscale-tools-2026.jpg');
                  setInsertImageAltInput('Best AI Image Upscale Tools 2026');
                }}
              >
                🖼️ Image Upscale Cover
              </button>
            </div>
          </div>

          {/* Live Thumbnail Preview */}
          {insertImageUrlInput.trim() && (
            <div style={{ marginTop: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                IMAGE PREVIEW:
              </label>
              <div style={{ padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <img
                  src={insertImageUrlInput.trim()}
                  alt="Preview"
                  style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsInsertImageModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-primary), #a855f7)', border: 'none', fontWeight: 'bold' }}>
              🚀 Insert Image at Cursor
            </button>
          </div>
        </form>
      </Modal>

      {/* DEDICATED EASY TABLE BUILDER & PASTE CONVERTER MODAL */}
      <Modal
        isOpen={isTableModalOpen}
        title="📊 Easy Table Builder & Paste Converter"
        onClose={() => setIsTableModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '550px', maxWidth: '750px' }}>
          {/* Tab selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', paddingBottom: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${tableActiveTab === 'paste' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTableActiveTab('paste')}
              style={{ fontWeight: 'bold' }}
            >
              📋 Paste Raw Table / Text Converter
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tableActiveTab === 'builder' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTableActiveTab('builder')}
              style={{ fontWeight: 'bold' }}
            >
              ✏️ Interactive Grid Builder
            </button>
          </div>

          {tableActiveTab === 'paste' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Paste raw table text from Excel, Google Sheets, ChatGPT, or websites below. It auto-detects tabs, pipes, commas, or spaces!
              </p>
              <textarea
                className="form-input"
                rows={7}
                placeholder="Paste raw table text here...\nExample:\nFeature\tAdobe Super\tRemini\tTopaz\nPhoto Upscaling\tExcellent\tExcellent\tGood"
                value={tablePasteRawText}
                onChange={(e) => setTablePasteRawText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />

              {/* Live Parsed Preview */}
              {tablePasteRawText.trim() && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    CONVERTED TABLE PREVIEW:
                  </label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <MarkdownRenderer content={parseRawTableToMarkdown(tablePasteRawText)} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsTableModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', fontWeight: 'bold' }}
                  onClick={() => {
                    if (!tablePasteRawText.trim()) {
                      onToast('Please paste raw table text first', 'error');
                      return;
                    }
                    const mdTable = parseRawTableToMarkdown(tablePasteRawText);
                    insertMarkdownSnippet(mdTable);
                    onToast('Table converted and inserted into article!', 'success');
                    setTablePasteRawText('');
                    setIsTableModalOpen(false);
                  }}
                >
                  ⚡ Convert & Insert Table at Cursor
                </button>
              </div>
            </div>
          ) : (
            /* Grid Builder Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Columns:</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={tableGridCols}
                    onChange={(e) => {
                      const cols = Math.max(1, Math.min(8, parseInt(e.target.value) || 1));
                      setTableGridCols(cols);
                      setTableGridData(prev => prev.map(row => {
                        const newRow = [...row];
                        while (newRow.length < cols) newRow.push(`Cell ${newRow.length + 1}`);
                        return newRow.slice(0, cols);
                      }));
                    }}
                    className="form-input btn-xs"
                    style={{ width: '60px', marginLeft: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Rows:</label>
                  <input
                    type="number"
                    min={2}
                    max={15}
                    value={tableGridRows}
                    onChange={(e) => {
                      const rows = Math.max(2, Math.min(15, parseInt(e.target.value) || 2));
                      setTableGridRows(rows);
                      setTableGridData(prev => {
                        const newGrid = [...prev];
                        while (newGrid.length < rows) {
                          newGrid.push(Array(tableGridCols).fill('').map((_, i) => `Row ${newGrid.length}, Cell ${i + 1}`));
                        }
                        return newGrid.slice(0, rows);
                      });
                    }}
                    className="form-input btn-xs"
                    style={{ width: '60px', marginLeft: '6px' }}
                  />
                </div>
              </div>

              {/* Visual Matrix Grid Inputs */}
              <div style={{ overflowX: 'auto', maxHeight: '250px', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {Array.from({ length: tableGridCols }).map((_, colIdx) => (
                        <th key={colIdx} style={{ padding: '4px' }}>
                          <input
                            type="text"
                            className="form-input btn-xs"
                            placeholder={`Header ${colIdx + 1}`}
                            value={tableGridData[0]?.[colIdx] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTableGridData(prev => {
                                const next = prev.map(r => [...r]);
                                if (!next[0]) next[0] = [];
                                next[0][colIdx] = val;
                                return next;
                              });
                            }}
                            style={{ fontWeight: 'bold', borderColor: 'var(--color-primary)' }}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableGridData.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {Array.from({ length: tableGridCols }).map((_, colIdx) => (
                          <td key={colIdx} style={{ padding: '4px' }}>
                            <input
                              type="text"
                              className="form-input btn-xs"
                              placeholder={`R${rowIdx + 1} C${colIdx + 1}`}
                              value={row[colIdx] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTableGridData(prev => {
                                  const next = prev.map(r => [...r]);
                                  if (!next[rowIdx + 1]) next[rowIdx + 1] = [];
                                  next[rowIdx + 1][colIdx] = val;
                                  return next;
                                });
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsTableModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), #a855f7)', border: 'none', fontWeight: 'bold' }}
                  onClick={() => {
                    let md = '\n\n';
                    const headerRow = tableGridData[0] || [];
                    md += '| ' + headerRow.map(h => h || 'Col').join(' | ') + ' |\n';
                    md += '| ' + Array(headerRow.length).fill('---').join(' | ') + ' |\n';
                    tableGridData.slice(1).forEach(row => {
                      md += '| ' + row.map(cell => cell || '').join(' | ') + ' |\n';
                    });
                    md += '\n';
                    insertMarkdownSnippet(md);
                    onToast('Custom table inserted into article!', 'success');
                    setIsTableModalOpen(false);
                  }}
                >
                  🚀 Insert Custom Grid Table at Cursor
                </button>
              </div>
            </div>
          )}
        </div>
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
