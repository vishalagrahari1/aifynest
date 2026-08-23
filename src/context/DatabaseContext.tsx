/* src/context/DatabaseContext.tsx */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialCategories,
  initialTools,
  initialReviews,
  initialCampaigns,
  initialPayments,
  initialBlogPosts,
  initialCollections,
  initialAuditLogs,
  initialAffiliateLinks,
  initialNotifications,
} from '../utils/seedData';
import type {
  Tool,
  Category,
  Review,
  Campaign,
  Payment,
  AnalyticsEvent,
  Claim,
  BlogPost,
  Collection,
  AuditLog,
  AffiliateLink,
  Notification,
} from '../utils/seedData';
import { calculateTrendingScores } from '../utils/trendingAlgorithm';

interface DatabaseContextType {
  tools: Tool[];
  categories: Category[];
  reviews: Review[];
  campaigns: Campaign[];
  payments: Payment[];
  analyticsEvents: AnalyticsEvent[];
  claims: Claim[];
  blogPosts: BlogPost[];
  collections: Collection[];
  auditLogs: AuditLog[];
  affiliateLinks: AffiliateLink[];
  notifications: Notification[];
  
  addTool: (tool: Omit<Tool, 'id' | 'rating' | 'reviewCount' | 'isVerified' | 'isFeatured' | 'isSponsored' | 'status' | 'claimStatus' | 'lastUpdated'> & { status?: Tool['status'] }) => Tool;
  updateTool: (id: string, updatedFields: Partial<Tool>, actorId?: string) => void;
  deleteTool: (id: string, actorId?: string) => void;
  approveTool: (id: string, adminId: string, adminName: string) => void;
  rejectTool: (id: string, adminId: string, adminName: string, reason: string) => void;
  requestChanges: (id: string, adminId: string, adminName: string, notes: string) => void;
  claimListing: (toolId: string, userId: string, verificationEmail: string, domain: string, message: string) => void;
  approveClaim: (claimId: string) => void;
  rejectClaim: (claimId: string) => void;
  
  // Reviews
  addReview: (toolId: string, userId: string, userName: string, review: { rating: number; title: string; comment: string; pros: string; cons: string; ratingDimensions: { easeOfUse: number; valueForMoney: number; features: number; performance: number } }) => void;
  flagReview: (id: string) => void;
  deleteReview: (id: string) => void;

  // Collections
  addCollection: (userId: string, name: string, description: string, isPublic: boolean, tools: string[]) => void;
  updateCollection: (id: string, updatedFields: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  toggleFavoriteTool: (userId: string, toolId: string) => void;

  // Campaigns
  addCampaign: (campaign: Omit<Campaign, 'id' | 'remainingBudget' | 'spent' | 'impressions' | 'clicks' | 'status'>) => Campaign;
  updateCampaign: (id: string, updatedFields: Partial<Campaign>) => void;
  recordPayment: (payment: Omit<Payment, 'id' | 'date' | 'invoiceNumber'>) => void;

  // Analytics
  trackEvent: (eventType: AnalyticsEvent['eventType'], toolId?: string, categorySlug?: string, query?: string, referrer?: string, campaignId?: string) => void;
  getTrendingTools: (limit?: number) => Tool[];
  logAdminAction: (userId: string, userName: string, action: string, details: string) => void;

  // Affiliate link management
  addAffiliateLink: (link: Omit<AffiliateLink, 'id' | 'clicks' | 'conversions' | 'revenue'>) => AffiliateLink;
  updateAffiliateLink: (id: string, updatedFields: Partial<AffiliateLink>) => void;
  deleteAffiliateLink: (id: string) => void;

  // Notifications
  addNotification: (userId: string, title: string, message: string, type: Notification['type']) => void;
  markNotificationRead: (id: string) => void;

  // Bulk Seed Operations
  seedTenToolsPerCategory: () => number;

  // Security & Data Access Helpers
  getOwnedTools: (userId: string) => Tool[];
  getOwnedTool: (toolId: string, userId: string) => Tool | null;
  canManageTool: (toolId: string, userId: string) => boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize and load databases
  useEffect(() => {
    const loadOrSeed = <T,>(key: string, seed: T): T => {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    };

    setTools(loadOrSeed('ai_tools', initialTools));
    setCategories(loadOrSeed('ai_categories', initialCategories));
    setReviews(loadOrSeed('ai_reviews', initialReviews));
    setCampaigns(loadOrSeed('ai_campaigns', initialCampaigns));
    setPayments(loadOrSeed('ai_payments', initialPayments));
    setAnalyticsEvents(loadOrSeed('ai_analytics_events', []));
    setClaims(loadOrSeed('ai_claims', []));
    setBlogPosts(loadOrSeed('ai_blog_posts', initialBlogPosts));
    setCollections(loadOrSeed('ai_collections', initialCollections));
    setAuditLogs(loadOrSeed('ai_audit_logs', initialAuditLogs));
    setAffiliateLinks(loadOrSeed('ai_affiliates', initialAffiliateLinks));
    setNotifications(loadOrSeed('ai_notifications', initialNotifications));
  }, []);

  // Synchronize database states dynamically across multiple open tabs in real-time
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.newValue) {
        try {
          if (e.key === 'ai_tools') setTools(JSON.parse(e.newValue));
          if (e.key === 'ai_claims') setClaims(JSON.parse(e.newValue));
          if (e.key === 'ai_reviews') setReviews(JSON.parse(e.newValue));
          if (e.key === 'ai_campaigns') setCampaigns(JSON.parse(e.newValue));
          if (e.key === 'ai_payments') setPayments(JSON.parse(e.newValue));
          if (e.key === 'ai_notifications') setNotifications(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error synchronizing database storage:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Save changes to localStorage helper
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Log Administrative Action
  const logAdminAction = (userId: string, userName: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveToStorage('ai_audit_logs', updated);
  };

  // --- TOOL OPERATIONS ---
  const addTool = (toolData: Omit<Tool, 'id' | 'rating' | 'reviewCount' | 'isVerified' | 'isFeatured' | 'isSponsored' | 'status' | 'claimStatus' | 'lastUpdated'> & { status?: Tool['status'] }) => {
    const newTool: Tool = {
      ...toolData,
      id: Math.random().toString(36).substr(2, 9),
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      isFeatured: false,
      isSponsored: false,
      status: toolData.status || 'pending',
      claimStatus: toolData.ownerId ? 'claimed' : 'unclaimed',
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    const updated = [newTool, ...tools];
    setTools(updated);
    saveToStorage('ai_tools', updated);

    // Notify admins
    addNotification(
      'admin-id',
      'New AI Tool Submission',
      `A new tool "${newTool.name}" was submitted for review by owner/submitter.`,
      'submission'
    );

    return newTool;
  };

  const canManageTool = (toolId: string, userId: string): boolean => {
    const tool = tools.find((t) => t.id === toolId);
    if (!tool) return false;
    const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
    const actor = users.find((u: any) => u.id === userId);
    return actor?.role === 'admin' || tool.ownerId === userId;
  };

  const getOwnedTools = (userId: string): Tool[] => {
    const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
    const actor = users.find((u: any) => u.id === userId);
    if (actor?.role === 'admin') {
      return tools;
    }
    return tools.filter((t) => t.ownerId === userId);
  };

  const getOwnedTool = (toolId: string, userId: string): Tool | null => {
    const tool = tools.find((t) => t.id === toolId);
    if (!tool) return null;
    const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
    const actor = users.find((u: any) => u.id === userId);
    if (actor?.role === 'admin' || tool.ownerId === userId) {
      return tool;
    }
    return null;
  };

  const updateTool = (id: string, updatedFields: Partial<Tool>, actorId?: string) => {
    if (actorId && !canManageTool(id, actorId)) {
      console.warn(`Unauthorized update attempt on tool ${id} by user ${actorId}`);
      return;
    }
    const updated = tools.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          ...updatedFields,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
      return t;
    });
    setTools(updated);
    saveToStorage('ai_tools', updated);
  };

  const deleteTool = (id: string, actorId?: string) => {
    if (actorId && !canManageTool(id, actorId)) {
      console.warn(`Unauthorized delete attempt on tool ${id} by user ${actorId}`);
      return;
    }
    const updated = tools.filter((t) => t.id !== id);
    setTools(updated);
    saveToStorage('ai_tools', updated);
  };

  const approveTool = (id: string, adminId: string, adminName: string) => {
    updateTool(id, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminName,
    });
    const tool = tools.find((t) => t.id === id);
    if (tool && tool.ownerId) {
      addNotification(
        tool.ownerId,
        'Tool Listing Approved! 🎉',
        `Your submission "${tool.name}" has been approved and published to AIFynest.`,
        'submission'
      );
    }
    logAdminAction(adminId, adminName, 'Approve Tool', `Approved tool listing: ${tool?.name || 'Unknown'}`);
  };

  const rejectTool = (id: string, adminId: string, adminName: string, reason: string) => {
    updateTool(id, {
      status: 'rejected',
      rejectionReason: reason,
    });
    const tool = tools.find((t) => t.id === id);
    if (tool && tool.ownerId) {
      addNotification(
        tool.ownerId,
        'Tool Submission Rejected ❌',
        `Your submission "${tool.name}" was not approved. Reason: "${reason}".`,
        'submission'
      );
    }
    logAdminAction(adminId, adminName, 'Reject Tool', `Rejected tool listing: ${tool?.name || 'Unknown'}. Reason: ${reason}`);
  };

  const requestChanges = (id: string, adminId: string, adminName: string, notes: string) => {
    updateTool(id, {
      status: 'needs_changes',
      adminNotes: notes,
    });
    const tool = tools.find((t) => t.id === id);
    if (tool && tool.ownerId) {
      addNotification(
        tool.ownerId,
        'Changes Requested ⚠️',
        `Revision request for "${tool.name}": "${notes}". Please revise and resubmit.`,
        'submission'
      );
    }
    logAdminAction(adminId, adminName, 'Request Revisions', `Requested revisions for tool: ${tool?.name || 'Unknown'}. Notes: ${notes}`);
  };

  // --- CLAIM MANAGEMENT ---
  const claimListing = (toolId: string, userId: string, verificationEmail: string, domain: string, message: string) => {
    const newClaim: Claim = {
      id: Math.random().toString(36).substr(2, 9),
      toolId,
      userId,
      status: 'pending',
      verificationEmail,
      domain,
      message,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newClaim, ...claims];
    setClaims(updated);
    saveToStorage('ai_claims', updated);

    // Update tool claimStatus
    updateTool(toolId, { claimStatus: 'pending' });

    // Notify Admin
    addNotification(
      'admin-id',
      'New Claim Request',
      `Owner claim request submitted for listing domain: ${domain}.`,
      'claim'
    );
  };

  const approveClaim = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (claim) {
      const updatedClaims = claims.map((c) => (c.id === claimId ? { ...c, status: 'approved' as const } : c));
      setClaims(updatedClaims);
      saveToStorage('ai_claims', updatedClaims);

      // Assign ownerId to tool
      updateTool(claim.toolId, {
        claimStatus: 'claimed',
        ownerId: claim.userId,
      });

      // Notify Owner
      addNotification(
        claim.userId,
        'Listing Claim Approved!',
        `Your ownership claim has been verified. You can now manage analytics and billing options.`,
        'claim'
      );
    }
  };

  const rejectClaim = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (claim) {
      const updatedClaims = claims.map((c) => (c.id === claimId ? { ...c, status: 'rejected' as const } : c));
      setClaims(updatedClaims);
      saveToStorage('ai_claims', updatedClaims);

      updateTool(claim.toolId, { claimStatus: 'unclaimed' });

      addNotification(
        claim.userId,
        'Listing Claim Rejected',
        `Your claim request domain verification failed review checklists.`,
        'claim'
      );
    }
  };

  // --- REVIEW OPERATIONS ---
  const addReview = (
    toolId: string,
    userId: string,
    userName: string,
    reviewData: { rating: number; title: string; comment: string; pros: string; cons: string; ratingDimensions: Review['ratingDimensions'] }
  ) => {
    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      toolId,
      userId,
      userName,
      rating: reviewData.rating,
      ratingDimensions: reviewData.ratingDimensions,
      title: reviewData.title,
      comment: reviewData.comment,
      pros: reviewData.pros,
      cons: reviewData.cons,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    saveToStorage('ai_reviews', updatedReviews);

    // Notify Owner
    const toolObj = tools.find((t) => t.id === toolId);
    if (toolObj && toolObj.ownerId) {
      addNotification(
        toolObj.ownerId,
        'New Listing Review',
        `A user left a rating review for your tool: ${toolObj.name}`,
        'review'
      );
    }
  };

  const flagReview = (id: string) => {
    const updated = reviews.map((r) => (r.id === id ? { ...r, status: 'flagged' as const } : r));
    setReviews(updated);
    saveToStorage('ai_reviews', updated);

    // Notify Admin
    addNotification(
      'admin-id',
      'Review Moderation Flagged',
      `An owner reported a customer review as potential spam. Moderation action needed.`,
      'review'
    );
  };

  const deleteReview = (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    saveToStorage('ai_reviews', updated);
  };

  const updateToolRatingAggregates = (toolId: string, allReviews: Review[]) => {
    const toolReviews = allReviews.filter((r) => r.toolId === toolId && r.status === 'approved');
    const count = toolReviews.length;
    const avg = count > 0 ? Math.round((toolReviews.reduce((acc, r) => acc + r.rating, 0) / count) * 10) / 10 : 0;
    updateTool(toolId, { rating: avg, reviewCount: count });
  };

  // --- COLLECTIONS ---
  const addCollection = (userId: string, name: string, description: string, isPublic: boolean, toolsList: string[]) => {
    const newColl: Collection = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      name,
      description,
      isPublic,
      tools: toolsList,
      dateCreated: new Date().toISOString().split('T')[0],
    };
    const updated = [...collections, newColl];
    setCollections(updated);
    saveToStorage('ai_collections', updated);
  };

  const updateCollection = (id: string, updatedFields: Partial<Collection>) => {
    const updated = collections.map((c) => (c.id === id ? { ...c, ...updatedFields } : c));
    setCollections(updated);
    saveToStorage('ai_collections', updated);
  };

  const deleteCollection = (id: string) => {
    const updated = collections.filter((c) => c.id !== id);
    setCollections(updated);
    saveToStorage('ai_collections', updated);
  };

  const toggleFavoriteTool = (userId: string, toolId: string) => {
    let favoritesList = collections.find((c) => c.userId === userId && c.name === 'My Favorites');
    if (!favoritesList) {
      const newColl: Collection = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        name: 'My Favorites',
        description: 'Bookmarked AI tools catalog.',
        isPublic: false,
        tools: [toolId],
        dateCreated: new Date().toISOString().split('T')[0],
      };
      const updated = [...collections, newColl];
      setCollections(updated);
      saveToStorage('ai_collections', updated);
    } else {
      const alreadySaved = favoritesList.tools.includes(toolId);
      const newTools = alreadySaved
        ? favoritesList.tools.filter((id) => id !== toolId)
        : [...favoritesList.tools, toolId];
      
      updateCollection(favoritesList.id, { tools: newTools });
    }
  };

  // --- AD CAMPAIGNS ---
  const addCampaign = (campData: Omit<Campaign, 'id' | 'remainingBudget' | 'spent' | 'impressions' | 'clicks' | 'status'>) => {
    const newCamp: Campaign = {
      ...campData,
      id: Math.random().toString(36).substr(2, 9),
      remainingBudget: campData.budget,
      spent: 0,
      impressions: 0,
      clicks: 0,
      status: 'active',
    };
    const updated = [...campaigns, newCamp];
    setCampaigns(updated);
    saveToStorage('ai_campaigns', updated);

    // Apply sponsored status immediately to target tool
    updateTool(campData.toolId, { isSponsored: true, isFeatured: true });

    return newCamp;
  };

  const updateCampaign = (id: string, updatedFields: Partial<Campaign>) => {
    const updated = campaigns.map((c) => {
      if (c.id === id) {
        const nextCamp = { ...c, ...updatedFields };
        if (nextCamp.remainingBudget <= 0) {
          nextCamp.status = 'completed';
          // Turn off sponsored flag
          setTimeout(() => {
            updateTool(nextCamp.toolId, { isSponsored: false, isFeatured: false });
          }, 0);
        }
        return nextCamp;
      }
      return c;
    });
    setCampaigns(updated);
    saveToStorage('ai_campaigns', updated);
  };

  const recordPayment = (payData: Omit<Payment, 'id' | 'date' | 'invoiceNumber'>) => {
    const newPay: Payment = {
      ...payData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: 'INV-' + Math.floor(Math.random() * 90000 + 10000),
    };
    const updated = [newPay, ...payments];
    setPayments(updated);
    saveToStorage('ai_payments', updated);

    // Admin notification
    addNotification(
      'admin-id',
      'Payment Received',
      `Sponsorship purchase invoice recorded for builders. Amount: $${payData.amount}`,
      'payment'
    );
  };

  // --- ANALYTICS TRACKING ---
  const trackEvent = (
    eventType: AnalyticsEvent['eventType'],
    toolId?: string,
    categorySlug?: string,
    query?: string,
    referrer?: string,
    campaignId?: string
  ) => {
    const isSponsorImpression = eventType === 'sponsored_impression';
    const isSponsorClick = eventType === 'sponsored_click' || eventType === 'tool_click' || eventType === 'affiliate_click';

    const newEvent: AnalyticsEvent = {
      id: Math.random().toString(36).substr(2, 9),
      eventType,
      toolId,
      categorySlug,
      query,
      timestamp: new Date().toISOString(),
      referrer: referrer || document.referrer || 'Direct Search',
      device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      country: ['US', 'IN', 'GB', 'CA', 'DE', 'FR'][Math.floor(Math.random() * 6)] as any,
      campaignId,
    };

    const updated = [newEvent, ...analyticsEvents];
    setAnalyticsEvents(updated);
    saveToStorage('ai_analytics_events', updated);

    // Budget depletion for sponsored events
    if (toolId && (isSponsorImpression || isSponsorClick)) {
      const activeCampaigns = campaigns.filter((c) => c.toolId === toolId && c.status === 'active');
      activeCampaigns.forEach((camp) => {
        let charge = 0;
        let updateData: Partial<Campaign> = {};

        if (isSponsorClick && camp.cpc > 0) {
          charge = camp.cpc;
          updateData = {
            clicks: camp.clicks + 1,
            spent: camp.spent + charge,
            remainingBudget: camp.remainingBudget - charge,
          };
        } else if (isSponsorImpression && camp.cpm > 0) {
          charge = camp.cpm / 1000;
          updateData = {
            impressions: camp.impressions + 1,
            spent: camp.spent + charge,
            remainingBudget: camp.remainingBudget - charge,
          };
        }

        if (charge > 0) {
          updateCampaign(camp.id, updateData);
        }
      });
    }

    // Auto increment affiliate link clicks count
    if (eventType === 'affiliate_click' && toolId) {
      const links = affiliateLinks.map((l) => (l.toolId === toolId ? { ...l, clicks: l.clicks + 1 } : l));
      setAffiliateLinks(links);
      saveToStorage('ai_affiliates', links);
    }
  };

  const getTrendingTools = (limit = 4): Tool[] => {
    const scores = calculateTrendingScores(tools, analyticsEvents, reviews);
    const sortedTools = [...tools]
      .filter((t) => t.status === 'approved')
      .sort((a, b) => {
        const scoreA = scores.find((s) => s.toolId === a.id)?.score || 0;
        const scoreB = scores.find((s) => s.toolId === b.id)?.score || 0;
        return scoreB - scoreA;
      });
    return sortedTools.slice(0, limit);
  };

  // --- AFFILIATE OPERATIONS ---
  const addAffiliateLink = (linkData: Omit<AffiliateLink, 'id' | 'clicks' | 'conversions' | 'revenue'>) => {
    const newLink: AffiliateLink = {
      ...linkData,
      id: Math.random().toString(36).substr(2, 9),
      clicks: 0,
      conversions: 0,
      revenue: 0,
    };
    const updated = [...affiliateLinks, newLink];
    setAffiliateLinks(updated);
    saveToStorage('ai_affiliates', updated);

    // Sync parameters back to tools list
    updateTool(linkData.toolId, {
      affiliateUrl: linkData.affiliateUrl,
      affiliateStatus: linkData.status,
      affiliateNetwork: linkData.network,
      affiliateProgramName: linkData.programName,
    });

    return newLink;
  };

  const updateAffiliateLink = (id: string, updatedFields: Partial<AffiliateLink>) => {
    const updated = affiliateLinks.map((l) => (l.id === id ? { ...l, ...updatedFields } : l));
    setAffiliateLinks(updated);
    saveToStorage('ai_affiliates', updated);

    const linkObj = updated.find((l) => l.id === id);
    if (linkObj) {
      updateTool(linkObj.toolId, {
        affiliateUrl: linkObj.affiliateUrl,
        affiliateStatus: linkObj.status,
      });
    }
  };

  const deleteAffiliateLink = (id: string) => {
    const linkObj = affiliateLinks.find((l) => l.id === id);
    const updated = affiliateLinks.filter((l) => l.id !== id);
    setAffiliateLinks(updated);
    saveToStorage('ai_affiliates', updated);

    if (linkObj) {
      updateTool(linkObj.toolId, {
        affiliateUrl: undefined,
        affiliateStatus: 'inactive',
      });
    }
  };

  // --- NOTIFICATIONS OPERATIONS ---
  const addNotification = (userId: string, title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      date: new Date().toISOString().split('T')[0],
      read: false,
      type,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveToStorage('ai_notifications', updated);
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveToStorage('ai_notifications', updated);
  };

  // Auto trigger dynamic Aggregates
  useEffect(() => {
    reviews.forEach((r) => {
      if (r.status === 'approved') {
        const tool = tools.find((t) => t.id === r.toolId);
        if (tool && tool.reviewCount === 0) {
          updateToolRatingAggregates(r.toolId, reviews);
        }
      }
    });
  }, [reviews]);

  const seedTenToolsPerCategory = () => {
    const generatedTools: Tool[] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    categories.forEach((cat) => {
      for (let i = 1; i <= 10; i++) {
        const id = `bulk-${cat.slug}-${i}`;
        const prefixes = ['Smart', 'Deep', 'Next', 'Hyper', 'Swift', 'Sync', 'Apex', 'Core', 'Echo', 'Omni'];
        const suffixes = ['AI', 'Studio', 'Flow', 'Bot', 'Assistant', 'Lab', 'Pro', 'Hub', 'Sense', 'Wizard'];
        
        const name = `${prefixes[(i - 1) % prefixes.length]} ${cat.name.replace('AI ', '')} ${suffixes[(i - 1) % suffixes.length]}`;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (tools.some((t) => t.slug === slug || t.id === id)) {
          continue;
        }

        const pricingOptions: Tool['pricing'][] = ['free', 'freemium', 'paid', 'free-trial', 'contact-sales'];
        const pricing = pricingOptions[(i - 1) % pricingOptions.length];

        const features = [
          `Real-time ${cat.name.toLowerCase()} automation`,
          `Semantic contextual analysis`,
          `Cross-platform workflow synchronization`,
          `Custom developer API access`,
        ];

        generatedTools.push({
          id,
          name,
          slug,
          tagline: `Accelerate your ${cat.name.toLowerCase()} tasks with smart models.`,
          description: `${name} is an advanced AI application tailored for ${cat.name.toLowerCase()} workflows. Designed to eliminate bottlenecks, it features a responsive user experience, secure enterprise integrations, and precision output optimization. Generation ${i} brings significant boosts in computing speeds and contextual reasoning.`,
          categorySlug: cat.slug,
          subCategory: cat.subcategories[(i - 1) % cat.subcategories.length] || 'General',
          pricing,
          pricingUrl: `https://${slug}.com/pricing`,
          platforms: ['Web', 'Windows', 'Mac'],
          pricingPlans: [
            { name: 'Starter Plan', price: pricing === 'free' ? '$0' : '$15', billingPeriod: pricing === 'free' ? 'free' : 'monthly', features: ['Core access', '100 generations/mo', 'Community support'] },
            { name: 'Professional Plan', price: pricing === 'free' ? '$0' : '$45', billingPeriod: pricing === 'free' ? 'free' : 'monthly', features: ['Unlimited models access', '5 team members seats', 'Priority processing speed', 'Full API keys'] }
          ],
          features,
          useCases: [
            `Standardizing ${cat.name.toLowerCase()} processes`,
            `Collaborative asset creation and team sharing`,
            `Scale metrics analysis and reporting`
          ],
          pros: ['Intuitive and premium user layout', 'High performance reasoning logic', 'Extensive customizable template parameters'],
          cons: ['Requires active network connectivity', 'High pricing for custom white-label licenses'],
          logoUrl: `https://images.unsplash.com/photo-${1550000000000 + (cat.name.charCodeAt(0) + i) * 8000000}?w=100&h=100&fit=crop`,
          screenshotUrls: [
            `https://images.unsplash.com/photo-${1550000000000 + (cat.name.charCodeAt(0) + i) * 8000000}?w=800&h=500&fit=crop`
          ],
          websiteUrl: `https://${slug}.com`,
          rating: parseFloat((4.0 + (i % 11) * 0.1).toFixed(1)),
          reviewCount: i * 8 + 4,
          isVerified: i % 2 === 0,
          isFeatured: i === 1,
          isSponsored: false,
          status: 'approved',
          ownerId: null,
          claimStatus: 'unclaimed',
          lastUpdated: dateStr,
          tags: [cat.slug, 'bulk-seed', 'ai-automation'],
        });
      }
    });

    if (generatedTools.length > 0) {
      const updatedTools = [...tools, ...generatedTools];
      setTools(updatedTools);
      localStorage.setItem('ai_tools', JSON.stringify(updatedTools));
      logAdminAction('admin-id', 'System Admin', 'Bulk Seeding', `Generated and approved ${generatedTools.length} mock tools across ${categories.length} categories.`);
      return generatedTools.length;
    }
    return 0;
  };

  return (
    <DatabaseContext.Provider
      value={{
        tools,
        categories,
        reviews,
        campaigns,
        payments,
        analyticsEvents,
        claims,
        blogPosts,
        collections,
        auditLogs,
        affiliateLinks,
        notifications,
        addTool,
        updateTool,
        deleteTool,
        approveTool,
        rejectTool,
        requestChanges,
        claimListing,
        approveClaim,
        rejectClaim,
        addReview,
        flagReview,
        deleteReview,
        addCollection,
        updateCollection,
        deleteCollection,
        toggleFavoriteTool,
        addCampaign,
        updateCampaign,
        recordPayment,
        trackEvent,
        getTrendingTools,
        logAdminAction,
        addAffiliateLink,
        updateAffiliateLink,
        deleteAffiliateLink,
        addNotification,
        markNotificationRead,
        seedTenToolsPerCategory,
        getOwnedTools,
        getOwnedTool,
        canManageTool,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
