/* src/context/DatabaseContext.tsx */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Tool,
  Category,
  Review,
  Campaign,
  Payment,
  Notification,
  AuditLog,
  AffiliateLink,
  Collection,
  AnalyticsEvent,
  BlogPost,
} from '../utils/seedData';
import { calculateTrendingScores } from '../utils/trendingAlgorithm';
import { supabase } from '../utils/supabase';

// Seed lists for localStorage prototype mode
import {
  initialTools,
  initialCategories,
  initialReviews,
  initialCampaigns,
  initialPayments,
  initialBlogPosts,
  initialCollections,
  initialAuditLogs,
  initialAffiliateLinks,
  initialNotifications,
} from '../utils/seedData';

interface DatabaseContextType {
  tools: Tool[];
  categories: Category[];
  reviews: Review[];
  campaigns: Campaign[];
  payments: Payment[];
  analyticsEvents: AnalyticsEvent[];
  claims: any[];
  blogPosts: BlogPost[];
  collections: Collection[];
  auditLogs: AuditLog[];
  affiliateLinks: AffiliateLink[];
  notifications: Notification[];

  // Write actions
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
  getToolAnalytics: (toolId: string, actorId: string) => AnalyticsEvent[] | null;
  getOwnerAnalytics: (ownerId: string, actorId: string) => AnalyticsEvent[];
  getPlatformAnalytics: (actorId: string) => AnalyticsEvent[];
  bulkImportTools: (importedToolsData: any[]) => number;
  bulkUpdateToolsStatus: (ids: string[], newStatus: Tool['status']) => void;
  bulkDeleteTools: (ids: string[]) => void;

  // Affiliate links
  addAffiliateLink: (link: Omit<AffiliateLink, 'id' | 'clicks' | 'conversions' | 'revenue'>) => AffiliateLink;
  updateAffiliateLink: (id: string, updatedFields: Partial<AffiliateLink>) => void;
  deleteAffiliateLink: (id: string) => void;

  // Notifications
  addNotification: (userId: string, title: string, message: string, type: Notification['type']) => void;
  markNotificationRead: (id: string) => void;
  seedTenToolsPerCategory: () => number;
  getOwnedTools: (userId: string) => Tool[];
  getOwnedTool: (toolId: string, userId: string) => Tool | null;
  canManageTool: (toolId: string, userId: string) => boolean;
  dbError: string | null;

  // Step 11 Monetization
  ownerWallet: { availableBalance: number; currency: string } | null;
  ledger: any[];
  fundCampaign: (campaignId: string, amount: number) => Promise<void>;
  simulateTopup: (amount: number) => Promise<void>;
  verifyPayment: (paymentId: string) => Promise<void>;
  approveCampaign: (campaignId: string) => Promise<void>;
  adjustWalletBalance: (ownerId: string, amount: number, reason: string) => Promise<void>;

  // Step 12 UX & Trust Workflows
  verificationRequests: any[];
  reports: any[];
  submitReport: (toolId: string, reason: string, details: string) => Promise<void>;
  resolveReport: (reportId: string, status: 'resolved' | 'dismissed') => Promise<void>;
  requestToolVerification: (toolId: string, notes: string) => Promise<void>;
  approveToolVerification: (requestId: string) => Promise<void>;
  revokeToolVerification: (toolId: string, reason: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const useSupabase = !import.meta.env.VITE_SUPABASE_URL?.includes('placeholder-url');

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [ownerWallet, setOwnerWallet] = useState<{ availableBalance: number; currency: string } | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // DB Row to frontend UI model mapper helpers
  const mapToolRow = (t: any): Tool => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    tagline: t.tagline,
    description: t.description,
    categorySlug: t.category_slug,
    subCategory: t.sub_category,
    pricing: t.pricing,
    pricingUrl: t.pricing_url || '',
    platforms: t.platforms || [],
    pricingPlans: t.pricing_plans || [],
    features: t.features || [],
    useCases: t.use_cases || [],
    pros: t.pros || [],
    cons: t.cons || [],
    logoUrl: t.logo_url,
    screenshotUrls: t.screenshot_urls || [],
    videoUrl: t.video_url || '',
    websiteUrl: t.website_url,
    rating: Number(t.rating || 0.0),
    reviewCount: Number(t.review_count || 0),
    isVerified: t.is_verified || false,
    isFeatured: t.is_featured || false,
    isSponsored: t.is_sponsored || false,
    status: t.status,
    ownerId: t.owner_id,
    claimStatus: t.claim_status,
    lastUpdated: t.last_updated,
    tags: t.tags || [],
    verification_status: t.verification_status || 'unverified',
  });

  const fetchDatabaseState = async () => {
    if (!useSupabase) return;
    setDbError(null);
    try {
      // 1. Categories
      const { data: catData } = await supabase.from('categories').select('*').order('name');
      if (catData) {
        setCategories(catData.map(c => ({
          name: c.name,
          slug: c.slug,
          iconName: c.icon_name,
          description: c.description,
          subcategories: c.subcategories || [],
        })));
      }

      // 2. Tools & Submissions (Hybrid list compilation)
      const { data: toolsData } = await supabase.from('tools').select('*');
      const { data: subsData } = await supabase.from('tool_submissions').select('*');

      let compiledTools: Tool[] = [];
      if (toolsData) {
        compiledTools = toolsData.map(t => mapToolRow(t));
      }

      if (subsData) {
        subsData.forEach((sub: any) => {
          if (sub.status === 'pending' || sub.status === 'needs_changes' || sub.status === 'draft' || sub.status === 'rejected') {
            if (sub.tool_id === null) {
              // Synthesize as virtual tool record for the moderation UI
              compiledTools.push({
                id: sub.id, // Submission ID for verification trigger mapping!
                name: sub.name,
                slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                tagline: sub.tagline,
                description: sub.description,
                categorySlug: sub.category_slug,
                subCategory: sub.sub_category,
                pricing: sub.pricing as any,
                pricingUrl: sub.pricing_url || '',
                platforms: sub.platforms || ['Web'],
                pricingPlans: [],
                features: sub.features || [],
                useCases: sub.use_cases || [],
                pros: [],
                cons: [],
                logoUrl: sub.logo_url,
                screenshotUrls: sub.screenshot_urls || [],
                videoUrl: sub.video_url || '',
                websiteUrl: sub.website_url,
                rating: 0,
                reviewCount: 0,
                isVerified: false,
                isFeatured: false,
                isSponsored: false,
                status: sub.status, // submission status
                ownerId: sub.submitter_id,
                claimStatus: 'unclaimed',
                lastUpdated: sub.updated_at || sub.created_at,
                tags: sub.tags || [],
                adminNotes: sub.admin_notes,
                rejectionReason: sub.rejection_reason,
              });
            } else {
              // Proposed updates edit submission. Find live tool and attach pendingChanges patch
              const idx = compiledTools.findIndex(t => t.id === sub.tool_id);
              if (idx !== -1) {
                compiledTools[idx] = {
                  ...compiledTools[idx],
                  pendingChanges: {
                    id: sub.id, // submission ID for rpc trigger
                    name: sub.name,
                    tagline: sub.tagline,
                    description: sub.description,
                    categorySlug: sub.category_slug,
                    subCategory: sub.sub_category,
                    pricing: sub.pricing as any,
                    pricingUrl: sub.pricing_url || '',
                    platforms: sub.platforms || [],
                    features: sub.features || [],
                    useCases: sub.use_cases || [],
                    logoUrl: sub.logo_url,
                    screenshotUrls: sub.screenshot_urls || [],
                    videoUrl: sub.video_url || '',
                    websiteUrl: sub.website_url,
                    tags: sub.tags || [],
                    status: sub.status,
                    adminNotes: sub.admin_notes,
                    rejectionReason: sub.rejection_reason,
                    submittedAt: sub.created_at,
                  }
                };
              }
            }
          }
        });
      }
      setTools(compiledTools);

      // 3. Claims
      const { data: claimsData } = await supabase.from('tool_claims').select('*');
      if (claimsData) {
        setClaims(claimsData.map(c => ({
          id: c.id,
          toolId: c.tool_id,
          claimantId: c.claimant_id,
          companyName: c.company_name,
          workEmail: c.work_email,
          verificationInfo: c.verification_info,
          proofUrl: c.proof_url,
          status: c.status,
          submittedAt: c.submitted_at,
          reviewedAt: c.reviewed_at,
          reviewedBy: c.reviewed_by,
        })));
      }

      // 4. Reviews
      const { data: revData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (revData) {
        setReviews(revData.map(r => ({
          id: r.id,
          toolId: r.tool_id,
          userId: r.user_id,
          userName: 'User',
          rating: Number(r.rating),
          ratingDimensions: {
            easeOfUse: Number(r.ease_of_use || r.rating),
            valueForMoney: Number(r.value_for_money || r.rating),
            features: Number(r.features || r.rating),
            performance: Number(r.performance || r.rating)
          },
          title: 'Review Title',
          comment: r.content,
          pros: '',
          cons: '',
          date: r.created_at,
          status: (r.status === 'flagged' ? 'flagged' : 'approved') as any
        })));
      }

      // 5. Campaigns & Payments
      const { data: campData } = await supabase.from('campaigns').select('*');
      if (campData) {
        setCampaigns(campData.map(c => ({
          id: c.id,
          toolId: c.tool_id,
          campaignName: c.campaign_name,
          placement: c.placement as any,
          startDate: c.created_at,
          endDate: c.created_at,
          budget: Number(c.budget),
          remainingBudget: Number(c.remaining_budget),
          spent: Number(c.spent),
          cpc: 0.5,
          cpm: 5.0,
          impressions: 0,
          clicks: 0,
          status: c.status as any
        })));
      }
      const { data: payData } = await supabase.from('payments').select('*');
      if (payData) {
        setPayments(payData.map(p => ({
          id: p.id,
          campaignId: p.campaign_id,
          userId: p.owner_id || 'admin-id',
          amount: Number(p.amount),
          date: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: p.status as any,
          invoiceNumber: p.provider_payment_id || p.id,
          type: (p.payment_type || 'sponsorship') as any,
          description: `Provider: ${p.provider || 'manual'}`
        })));
      }

      // 6. Notifications
      const { data: notifData } = await supabase.from('notifications').select('*').order('date', { ascending: false });
      if (notifData) {
        setNotifications(notifData.map(n => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          read: n.read,
          type: n.type as any,
          date: n.date,
        })));
      }

      // 7. Audit logs
      const { data: logData } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (logData) {
        setAuditLogs(logData.map(l => ({
          id: l.id,
          userId: l.user_id,
          userName: l.user_name,
          action: l.action,
          details: l.details,
          timestamp: l.timestamp,
        })));
      }

      // 8. Analytics (Filtered by RLS automatically)
      const { data: eventsData } = await supabase.from('analytics_events').select('*').order('timestamp', { ascending: false });
      if (eventsData) {
        setAnalyticsEvents(eventsData.map(e => ({
          id: e.id,
          eventType: e.event_type as any,
          toolId: e.tool_id,
          timestamp: e.timestamp,
          sessionId: e.session_id || '',
          userId: e.user_id || undefined,
          referrer: e.referrer || '',
          device: e.device as any,
          browser: e.browser || '',
          path: e.path || '',
        })));
      }

      // 9. Wallet & Ledger Topup logs
      try {
        const { data: walletData } = await supabase.from('owner_wallets').select('*');
        if (walletData && walletData.length > 0) {
          setOwnerWallet({
            availableBalance: Number(walletData[0].available_balance),
            currency: walletData[0].currency
          });
        } else {
          setOwnerWallet(null);
        }
      } catch (wErr) {
        console.warn('Wallet not initialized yet:', wErr);
      }

      try {
        const { data: ledgerData } = await supabase.from('financial_ledger').select('*').order('created_at', { ascending: false });
        if (ledgerData) {
          setLedger(ledgerData);
        } else {
          setLedger([]);
        }
      } catch (lErr) {
        console.warn('Ledger not initialized yet:', lErr);
      }

      try {
        const { data: verifData } = await supabase.from('tool_verification_requests').select('*');
        if (verifData) {
          setVerificationRequests(verifData);
        } else {
          setVerificationRequests([]);
        }
      } catch (vErr) {
        console.warn('Verification requests read failed:', vErr);
      }

      try {
        const { data: reportsData } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
        if (reportsData) {
          setReports(reportsData);
        } else {
          setReports([]);
        }
      } catch (rErr) {
        console.warn('Reports read failed:', rErr);
      }

    } catch (err: any) {
      console.error('Failed to sync Supabase databases states:', err);
      setDbError(err.message || 'Database connection error.');
    }
  };

  // Synchronize dynamic updates on tab focuses / mounts
  useEffect(() => {
    if (useSupabase) {
      fetchDatabaseState();
    } else {
      const loadOrSeed = <T,>(key: string, seed: T): T => {
        const data = localStorage.getItem(key);
        if (data) return JSON.parse(data) as T;
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
    }
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Audit Logs Logging
  const logAdminAction = async (userId: string, userName: string, action: string, details: string) => {
    if (useSupabase) {
      await supabase.from('audit_logs').insert({
        user_id: userId === 'admin-id' ? null : userId,
        user_name: userName,
        action,
        details,
      });
      fetchDatabaseState();
    } else {
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
    }
  };

  // --- TOOL OPERATIONS ---
  const addTool = (toolData: Omit<Tool, 'id' | 'rating' | 'reviewCount' | 'isVerified' | 'isFeatured' | 'isSponsored' | 'status' | 'claimStatus' | 'lastUpdated'> & { status?: Tool['status'] }) => {
    if (useSupabase) {
      const runAdd = async () => {
        // Insert sandbox submission record (pending approval, not directly into public tools)
        await supabase.from('tool_submissions').insert({
          name: toolData.name,
          tagline: toolData.tagline,
          description: toolData.description,
          category_slug: toolData.categorySlug,
          sub_category: toolData.subCategory,
          pricing: toolData.pricing,
          pricing_url: toolData.pricingUrl,
          platforms: toolData.platforms,
          features: toolData.features,
          use_cases: toolData.useCases,
          logo_url: toolData.logoUrl,
          screenshot_urls: toolData.screenshotUrls,
          video_url: toolData.videoUrl || null,
          website_url: toolData.websiteUrl,
          tags: toolData.tags,
          status: 'pending',
          submitter_id: toolData.ownerId || 'admin-id',
        });
        fetchDatabaseState();
      };
      runAdd();
      return { ...toolData, id: 'temp-id', rating: 0, reviewCount: 0, isVerified: false, isFeatured: false, isSponsored: false, status: 'pending', claimStatus: 'unclaimed', lastUpdated: '' } as Tool;
    } else {
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

      addNotification(
        'admin-id',
        'New AI Tool Submission',
        `A new tool "${newTool.name}" was submitted for review.`,
        'submission'
      );

      return newTool;
    }
  };

  const canManageTool = (toolId: string, userId: string): boolean => {
    const tool = tools.find((t) => t.id === toolId);
    if (!tool) return false;
    
    // Check local fallback
    if (!useSupabase) {
      const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
      const actor = users.find((u: any) => u.id === userId);
      return actor?.role === 'admin' || tool.ownerId === userId;
    }
    return true; // Enforced at database level by Supabase RLS
  };

  const getOwnedTools = (userId: string): Tool[] => {
    if (useSupabase) {
      // RLS selects auto filter profiles records
      return tools.filter((t) => t.ownerId === userId);
    }
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
    if (useSupabase) {
      return tool.ownerId === userId ? tool : null;
    }
    const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
    const actor = users.find((u: any) => u.id === userId);
    if (actor?.role === 'admin' || tool.ownerId === userId) {
      return tool;
    }
    return null;
  };

  const updateTool = (id: string, updatedFields: Partial<Tool>, actorId?: string) => {
    if (useSupabase) {
      const runUpdate = async () => {
        // Enforce secure sandbox edits:
        // Admin edits directly update tools. Owner edits submit to sandbox tool_submissions.
        const { data: pData } = await supabase.from('profiles').select('role').eq('id', actorId).single();
        const isAdminUser = pData && pData.role === 'admin';

        if (isAdminUser) {
          await supabase.from('tools').update({
            name: updatedFields.name,
            tagline: updatedFields.tagline,
            description: updatedFields.description,
            category_slug: updatedFields.categorySlug,
            sub_category: updatedFields.subCategory,
            pricing: updatedFields.pricing,
            pricing_url: updatedFields.pricingUrl,
            platforms: updatedFields.platforms,
            logo_url: updatedFields.logoUrl,
            screenshot_urls: updatedFields.screenshotUrls,
            website_url: updatedFields.websiteUrl,
            tags: updatedFields.tags,
            status: updatedFields.status,
            is_verified: updatedFields.isVerified,
            is_sponsored: updatedFields.isSponsored,
          }).eq('id', id);
        } else {
          // Owner edit submission proposal sandbox insert
          const liveTool = tools.find(t => t.id === id);
          if (liveTool && liveTool.ownerId === actorId) {
            await supabase.from('tool_submissions').insert({
              tool_id: id,
              submitter_id: actorId,
              name: updatedFields.name || liveTool.name,
              tagline: updatedFields.tagline || liveTool.tagline,
              description: updatedFields.description || liveTool.description,
              category_slug: updatedFields.categorySlug || liveTool.categorySlug,
              sub_category: updatedFields.subCategory || liveTool.subCategory,
              pricing: updatedFields.pricing || liveTool.pricing,
              pricing_url: updatedFields.pricingUrl || liveTool.pricingUrl,
              platforms: updatedFields.platforms || liveTool.platforms,
              logo_url: updatedFields.logoUrl || liveTool.logoUrl,
              screenshot_urls: updatedFields.screenshotUrls || liveTool.screenshotUrls,
              video_url: liveTool.videoUrl || null,
              website_url: updatedFields.websiteUrl || liveTool.websiteUrl,
              tags: updatedFields.tags || liveTool.tags,
              features: liveTool.features || [],
              use_cases: liveTool.useCases || [],
              status: 'pending',
            });
          }
        }
        fetchDatabaseState();
      };
      runUpdate();
    } else {
      if (actorId && !canManageTool(id, actorId)) return;
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
    }
  };

  const deleteTool = (id: string, actorId?: string) => {
    if (useSupabase) {
      const runDel = async () => {
        // Enforce soft deletion status update
        await supabase.from('tools').update({ status: 'archived' }).eq('id', id);
        fetchDatabaseState();
      };
      runDel();
    } else {
      if (actorId && !canManageTool(id, actorId)) return;
      const updated = tools.filter((t) => t.id !== id);
      setTools(updated);
      saveToStorage('ai_tools', updated);
    }
  };

  const approveTool = (id: string, adminId: string, _adminName: string) => {
    if (useSupabase) {
      const runApprove = async () => {
        // Invoke atomic server-side RPC transaction function
        const { error } = await supabase.rpc('approve_submission', {
          sub_id: id,
          notes: 'Approved by admin',
        });
        if (error) {
          console.error('Error approving submission RPC:', error.message);
        } else {
          // Fetch submission details to send notification
          const { data: subData } = await supabase.from('tool_submissions').select('submitter_id, name').eq('id', id).single();
          if (subData && subData.submitter_id) {
            addNotification(
              subData.submitter_id,
              'Tool Listing Approved! 🎉',
              `Your submission for "${subData.name}" has been approved and published.`,
              'submission'
            );
          }
        }
        fetchDatabaseState();
      };
      runApprove();
    } else {
      const tool = tools.find((t) => t.id === id);
      if (!tool) return;

      if (tool.pendingChanges) {
        const { status, adminNotes, rejectionReason, submittedAt, ...changes } = tool.pendingChanges;
        updateTool(id, {
          ...changes,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: _adminName,
          pendingChanges: undefined,
        });
      } else {
        updateTool(id, {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: _adminName,
        });
      }

      if (tool.ownerId) {
        addNotification(
          tool.ownerId,
          'Tool Listing Approved! 🎉',
          `Your updates or submission for "${tool.name}" have been approved.`,
          'submission'
        );
      }
      logAdminAction(adminId, _adminName, 'Approve Tool', `Approved tool: ${tool.name}`);
    }
  };

  const rejectTool = (id: string, adminId: string, adminName: string, reason: string) => {
    if (useSupabase) {
      const runReject = async () => {
        await supabase.from('tool_submissions').update({
          status: 'rejected',
          rejection_reason: reason,
          admin_notes: reason,
          updated_at: nowISO(),
        }).eq('id', id);

        const { data: subData } = await supabase.from('tool_submissions').select('submitter_id, name').eq('id', id).single();
        if (subData && subData.submitter_id) {
          addNotification(
            subData.submitter_id,
            'Tool Submission Rejected ❌',
            `Your updates or submission for "${subData.name}" was not approved. Reason: "${reason}".`,
            'submission'
          );
        }
        logAdminAction(adminId, adminName, 'Reject Tool', `Rejected submission: ID ${id}. Reason: ${reason}`);
      };
      runReject();
    } else {
      const tool = tools.find((t) => t.id === id);
      if (!tool) return;

      if (tool.status === 'approved') {
        updateTool(id, {
          pendingChanges: {
            ...tool.pendingChanges,
            status: 'rejected',
            rejectionReason: reason,
          }
        });
      } else {
        updateTool(id, {
          status: 'rejected',
          rejectionReason: reason,
        });
      }

      if (tool.ownerId) {
        addNotification(
          tool.ownerId,
          'Tool Submission Rejected ❌',
          `Your updates or submission for "${tool.name}" was not approved. Reason: "${reason}".`,
          'submission'
        );
      }
      logAdminAction(adminId, adminName, 'Reject Tool', `Rejected tool listing updates: ${tool.name}. Reason: ${reason}`);
    }
  };

  const requestChanges = (id: string, adminId: string, adminName: string, notes: string) => {
    if (useSupabase) {
      const runRequest = async () => {
        await supabase.from('tool_submissions').update({
          status: 'needs_changes',
          admin_notes: notes,
          updated_at: nowISO(),
        }).eq('id', id);

        const { data: subData } = await supabase.from('tool_submissions').select('submitter_id, name').eq('id', id).single();
        if (subData && subData.submitter_id) {
          addNotification(
            subData.submitter_id,
            'Changes Requested ⚠️',
            `Revision request for "${subData.name}": "${notes}". Please revise and resubmit.`,
            'submission'
          );
        }
        logAdminAction(adminId, adminName, 'Request Revisions', `Requested changes for submission ID ${id}. Notes: ${notes}`);
      };
      runRequest();
    } else {
      const tool = tools.find((t) => t.id === id);
      if (!tool) return;

      if (tool.status === 'approved') {
        updateTool(id, {
          pendingChanges: {
            ...tool.pendingChanges,
            status: 'needs_changes',
            adminNotes: notes,
          }
        });
      } else {
        updateTool(id, {
          status: 'needs_changes',
          adminNotes: notes,
        });
      }

      if (tool.ownerId) {
        addNotification(
          tool.ownerId,
          'Changes Requested ⚠️',
          `Revision request for "${tool.name}": "${notes}".`,
          'submission'
        );
      }
      logAdminAction(adminId, adminName, 'Request Revisions', `Requested revisions for tool: ${tool.name}. Notes: ${notes}`);
    }
  };

  // Helper date format string
  const nowISO = () => new Date().toISOString();

  // --- CLAIM LISTING OPERATIONS ---
  const claimListing = (toolId: string, userId: string, company: string, email: string, info: string) => {
    if (useSupabase) {
      const runClaim = async () => {
        await supabase.from('tool_claims').insert({
          tool_id: toolId,
          claimant_id: userId,
          company_name: company,
          work_email: email,
          verification_info: info,
          status: 'pending',
        });
        
        // Notify admin
        addNotification(
          'admin-id',
          'New Listing Claim Request',
          `Owner request claim verification submitted for tool. Email: ${email}`,
          'claim'
        );
        fetchDatabaseState();
      };
      runClaim();
    } else {
      const newClaim = {
        id: Math.random().toString(36).substr(2, 9),
        toolId,
        claimantId: userId,
        companyName: company,
        workEmail: email,
        verificationInfo: info,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      const updated = [newClaim, ...claims];
      setClaims(updated);
      saveToStorage('ai_claims', updated);

      addNotification(
        'admin-id',
        'New Listing Claim Request',
        `A new claim was submitted for verification. Email: ${email}`,
        'claim'
      );
    }
  };

  const approveClaim = (claimId: string) => {
    if (useSupabase) {
      const runApproveClaim = async () => {
        const { error } = await supabase.rpc('approve_claim', {
          claim_id: claimId,
        });

        if (error) {
          console.error('Error approving claim RPC:', error.message);
        } else {
          const { data: claimData } = await supabase.from('tool_claims').select('claimant_id').eq('id', claimId).single();
          if (claimData && claimData.claimant_id) {
            addNotification(
              claimData.claimant_id,
              'Claim Approved! 🎉',
              'Your tool listing ownership claim has been approved. You can now manage it.',
              'claim'
            );
          }
        }
        fetchDatabaseState();
      };
      runApproveClaim();
    } else {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return;

      const updatedClaims = claims.map((c) => (c.id === claimId ? { ...c, status: 'approved', reviewedAt: new Date().toISOString() } : c));
      setClaims(updatedClaims);
      saveToStorage('ai_claims', updatedClaims);

      const updatedTools = tools.map((t) => (t.id === claim.toolId ? { ...t, ownerId: claim.claimantId, claimStatus: 'claimed' as const } : t));
      setTools(updatedTools);
      saveToStorage('ai_tools', updatedTools);

      const users = JSON.parse(localStorage.getItem('ai_users') || '[]');
      const updatedUsers = users.map((u: any) => (u.id === claim.claimantId ? { ...u, role: 'owner' } : u));
      localStorage.setItem('ai_users', JSON.stringify(updatedUsers));

      addNotification(
        claim.claimantId,
        'Claim Approved! 🎉',
        'Your tool listing ownership claim has been approved.',
        'claim'
      );
    }
  };

  const rejectClaim = (claimId: string) => {
    if (useSupabase) {
      const runRejectClaim = async () => {
        await supabase.from('tool_claims').update({
          status: 'rejected',
          reviewed_at: nowISO(),
        }).eq('id', claimId);

        const { data: claimData } = await supabase.from('tool_claims').select('claimant_id').eq('id', claimId).single();
        if (claimData && claimData.claimant_id) {
          addNotification(
            claimData.claimant_id,
            'Claim Denied ❌',
            'Your tool listing ownership claim was rejected.',
            'claim'
          );
        }
        fetchDatabaseState();
      };
      runRejectClaim();
    } else {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return;

      const updated = claims.map((c) => (c.id === claimId ? { ...c, status: 'rejected', reviewedAt: new Date().toISOString() } : c));
      setClaims(updated);
      saveToStorage('ai_claims', updated);

      addNotification(
        claim.claimantId,
        'Claim Denied ❌',
        'Your tool listing ownership claim was rejected.',
        'claim'
      );
    }
  };

  // --- REVIEWS OPERATIONS ---
  const addReview = (
    toolId: string,
    userId: string,
    userName: string,
    review: { rating: number; title: string; comment: string; pros: string; cons: string; ratingDimensions: { easeOfUse: number; valueForMoney: number; features: number; performance: number } }
  ) => {
    if (useSupabase) {
      const runAddRev = async () => {
        await supabase.from('reviews').insert({
          tool_id: toolId,
          user_id: userId,
          content: review.comment,
          rating: review.rating,
          ease_of_use: review.ratingDimensions.easeOfUse,
          value_for_money: review.ratingDimensions.valueForMoney,
          features: review.ratingDimensions.features,
          performance: review.ratingDimensions.performance,
          status: 'approved',
        });

        // Recalculate average rating & review count for the live tool
        const { data: toolRevs } = await supabase.from('reviews').select('rating').eq('tool_id', toolId).eq('status', 'approved');
        if (toolRevs) {
          const count = toolRevs.length;
          const avg = count > 0 ? parseFloat((toolRevs.reduce((acc, r) => acc + Number(r.rating), 0) / count).toFixed(1)) : 0;
          await supabase.from('tools').update({ rating: avg, review_count: count }).eq('id', toolId);
        }

        // Notify tool owner
        const tool = tools.find((t) => t.id === toolId);
        if (tool && tool.ownerId) {
          addNotification(
            tool.ownerId,
            'New Customer Review ★',
            `Your tool "${tool.name}" received a new ${review.rating}-star review.`,
            'review'
          );
        }
        fetchDatabaseState();
      };
      runAddRev();
    } else {
      const newReview: Review = {
        id: Math.random().toString(36).substr(2, 9),
        toolId,
        userId,
        userName,
        rating: review.rating,
        ratingDimensions: review.ratingDimensions,
        title: review.title,
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        date: new Date().toISOString(),
        status: 'approved',
      };

      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);
      saveToStorage('ai_reviews', updatedReviews);

      const tool = tools.find((t) => t.id === toolId);
      if (tool) {
        const toolRevs = updatedReviews.filter((r) => r.toolId === toolId);
        const count = toolRevs.length;
        const avg = parseFloat((toolRevs.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1));

        updateTool(toolId, {
          rating: avg,
          reviewCount: count,
        });

        if (tool.ownerId) {
          addNotification(
            tool.ownerId,
            'New Customer Review ★',
            `Your tool "${tool.name}" received a new review.`,
            'review'
          );
        }
      }
    }
  };

  const flagReview = (id: string) => {
    if (useSupabase) {
      const runFlag = async () => {
        await supabase.from('reviews').update({ status: 'flagged' }).eq('id', id);
        fetchDatabaseState();
      };
      runFlag();
    } else {
      const updated = reviews.map((r) => (r.id === id ? { ...r, status: 'flagged' as const } : r));
      setReviews(updated);
      saveToStorage('ai_reviews', updated);
    }
  };

  const deleteReview = (id: string) => {
    if (useSupabase) {
      const runDelRev = async () => {
        await supabase.from('reviews').delete().eq('id', id);
        fetchDatabaseState();
      };
      runDelRev();
    } else {
      const updated = reviews.filter((r) => r.id !== id);
      setReviews(updated);
      saveToStorage('ai_reviews', updated);
    }
  };

  // --- COLLECTIONS & FAVORITES ---
  const addCollection = (userId: string, name: string, description: string, isPublic: boolean, toolIds: string[]) => {
    const newCollection: Collection = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      name,
      description,
      isPublic,
      tools: toolIds,
      dateCreated: new Date().toISOString(),
    };
    const updated = [...collections, newCollection];
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
    if (useSupabase) {
      const runToggle = async () => {
        const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', userId).eq('tool_id', toolId).maybeSingle();
        if (existing) {
          await supabase.from('favorites').delete().eq('id', existing.id);
        } else {
          await supabase.from('favorites').insert({ user_id: userId, tool_id: toolId });
        }
        trackEvent('favorite', toolId);
        fetchDatabaseState();
      };
      runToggle();
    } else {
      const userFavorites = collections.find((c) => c.userId === userId && c.name === 'My Favorites');
      if (userFavorites) {
        const isFav = userFavorites.tools.includes(toolId);
        const updatedTools = isFav
          ? userFavorites.tools.filter((id) => id !== toolId)
          : [...userFavorites.tools, toolId];

        const updatedCollections = collections.map((c) =>
          c.id === userFavorites.id ? { ...c, tools: updatedTools } : c
        );
        setCollections(updatedCollections);
        saveToStorage('ai_collections', updatedCollections);
      } else {
        addCollection(userId, 'My Favorites', 'Default bookmarked tools', false, [toolId]);
      }
      trackEvent('favorite', toolId);
    }
  };

  // --- SPONSORSHIPS CAMPAIGNS ---
  const addCampaign = (campData: Omit<Campaign, 'id' | 'remainingBudget' | 'spent' | 'impressions' | 'clicks' | 'status'>) => {
    const newCamp: Campaign = {
      ...campData,
      id: Math.random().toString(36).substr(2, 9),
      remainingBudget: 0,
      spent: 0,
      impressions: 0,
      clicks: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      cpc: 0.20,
      cpm: 5.0,
      status: 'draft',
    };
    if (useSupabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase.from('campaigns').insert({
          tool_id: campData.toolId,
          campaign_name: campData.campaignName,
          placement: campData.placement,
          cpc_bid: 0.20,
          daily_budget: 10.00,
          total_budget: 0.00,
          spent: 0.00,
          remaining_budget: 0.00,
          status: 'draft',
          owner_id: user.id,
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).then(() => fetchDatabaseState());
      });
    } else {
      const updated = [newCamp, ...campaigns];
      setCampaigns(updated);
      saveToStorage('ai_campaigns', updated);
    }
    return newCamp;
  };

  const updateCampaign = (id: string, updatedFields: Partial<Campaign>) => {
    if (useSupabase) {
      supabase.from('campaigns').update({
        status: updatedFields.status,
      }).eq('id', id).then(() => fetchDatabaseState());
      return;
    }
    const updated = campaigns.map((c) => {
      if (c.id === id) {
        const nextCamp = { ...c, ...updatedFields };
        if (nextCamp.remainingBudget <= 0) {
          nextCamp.status = 'paused';
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

  const fundCampaign = async (campaignId: string, amount: number) => {
    if (useSupabase) {
      const { error } = await supabase.rpc('fund_campaign', {
        p_campaign_id: campaignId,
        p_amount: amount
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const simulateTopup = async (amount: number) => {
    if (useSupabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const tempTxId = 'mock_tx_' + Math.random().toString(36).substr(2, 9);
      const { error } = await supabase.rpc('simulate_wallet_deposit', {
        p_owner_id: user.id,
        p_amount: amount,
        p_provider: 'manual_simulator',
        p_provider_payment_id: tempTxId
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const verifyPayment = async (paymentId: string) => {
    if (useSupabase) {
      const { error } = await supabase.rpc('verify_payment', {
        p_payment_id: paymentId
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const approveCampaign = async (campaignId: string) => {
    if (useSupabase) {
      const { error } = await supabase.rpc('approve_campaign', {
        p_campaign_id: campaignId
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const adjustWalletBalance = async (ownerId: string, amount: number, reason: string) => {
    if (useSupabase) {
      const { error } = await supabase.rpc('adjust_wallet_balance', {
        p_owner_id: ownerId,
        p_amount: amount,
        p_reason: reason
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const submitReport = async (toolId: string, reason: string, details: string) => {
    if (useSupabase) {
      let sessId = localStorage.getItem('aifynest_report_sess');
      if (!sessId) {
        sessId = 'sess_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('aifynest_report_sess', sessId);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('reports').insert({
        tool_id: toolId,
        reporter_user_id: user?.id || null,
        session_id: sessId,
        reason,
        details,
        status: 'pending'
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const resolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (useSupabase) {
      const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const requestToolVerification = async (toolId: string, notes: string) => {
    if (useSupabase) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('tool_verification_requests').insert({
        tool_id: toolId,
        owner_id: user?.id,
        status: 'pending',
        notes
      });
      if (error) throw error;
      
      setTools(prev => prev.map(t => t.id === toolId ? { ...t, verification_status: 'pending' as any } : t));
      await fetchDatabaseState();
    }
  };

  const approveToolVerification = async (requestId: string) => {
    if (useSupabase) {
      const { error } = await supabase.rpc('approve_tool_verification', {
        p_request_id: requestId
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const revokeToolVerification = async (toolId: string, reason: string) => {
    if (useSupabase) {
      const { error } = await supabase.rpc('revoke_tool_verification', {
        p_tool_id: toolId,
        p_reason: reason
      });
      if (error) throw error;
      await fetchDatabaseState();
    }
  };

  const recordPayment = (payData: Omit<Payment, 'id' | 'date' | 'invoiceNumber'>) => {
    const newPay: Payment = {
      ...payData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: 'INV-' + Math.floor(Math.random() * 90000 + 10000),
      userId: 'admin-id',
      status: 'success',
      type: 'sponsorship',
    };
    if (useSupabase) {
      supabase.from('payments').insert({
        campaign_id: payData.campaignId,
        date: newPay.date,
        invoice_number: newPay.invoiceNumber,
        description: payData.description,
        amount: payData.amount,
      }).then(() => fetchDatabaseState());
    } else {
      const updated = [newPay, ...payments];
      setPayments(updated);
      saveToStorage('ai_payments', updated);

      addNotification(
        'admin-id',
        'Payment Received',
        `Sponsorship purchase recorded. Amount: $${payData.amount}`,
        'payment'
      );
    }
  };

  // --- ANALYTICS EVENTS LOGGING ---
  const trackEvent = (
    eventType: AnalyticsEvent['eventType'],
    toolId?: string,
    categorySlug?: string,
    query?: string,
    referrer?: string,
    campaignId?: string
  ) => {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics_session_id', sessionId);
    }

    let userId: string | undefined = undefined;
    const sessionRaw = localStorage.getItem('ai_user_session');
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        if (parsed && parsed.id) userId = parsed.id;
      } catch (_) {}
    }

    const getBrowserName = () => {
      const ua = navigator.userAgent;
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
      if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
      if (ua.includes('Trident')) return 'Internet Explorer';
      if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge';
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Safari')) return 'Safari';
      return 'Other';
    };
    const browser = getBrowserName();
    const path = window.location.pathname;
    const device = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

    if (useSupabase) {
      supabase.from('analytics_events').insert({
        event_type: eventType,
        tool_id: toolId || null,
        session_id: sessionId,
        user_id: userId || null,
        referrer: referrer || document.referrer || 'Direct',
        device,
        browser,
        path,
      }).then(() => fetchDatabaseState());
    } else {
      const isSponsorImpression = eventType === 'sponsored_impression';
      const isSponsorClick = eventType === 'sponsored_click' || eventType === 'tool_click' || eventType === 'affiliate_click';

      const newEvent: AnalyticsEvent = {
        id: Math.random().toString(36).substr(2, 9),
        eventType,
        toolId,
        categorySlug,
        query,
        timestamp: new Date().toISOString(),
        referrer: referrer || document.referrer || 'Direct',
        device: device as any,
        country: undefined,
        campaignId,
        sessionId,
        userId,
        browser,
        path,
      };

      const updated = [newEvent, ...analyticsEvents];
      setAnalyticsEvents(updated);
      saveToStorage('ai_analytics_events', updated);

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

          if (charge > 0) updateCampaign(camp.id, updateData);
        });
      }

      if (eventType === 'affiliate_click' && toolId) {
        const links = affiliateLinks.map((l) => (l.toolId === toolId ? { ...l, clicks: l.clicks + 1 } : l));
        setAffiliateLinks(links);
        saveToStorage('ai_affiliates', links);
      }
    }
  };

  const getToolAnalytics = (toolId: string, _actorId: string): AnalyticsEvent[] | null => {
    // If Supabase mode is active, the analyticsEvents is already pre-filtered by database RLS rules
    return analyticsEvents.filter((e) => e.toolId === toolId);
  };

  const getOwnerAnalytics = (ownerId: string, actorId: string): AnalyticsEvent[] => {
    if (ownerId !== actorId) {
      throw new Error('Access Denied: Owner ID mismatch.');
    }
    // Filter locally out of RLS returned events list
    const ownedToolIds = tools.filter((t) => t.ownerId === ownerId).map((t) => t.id);
    return analyticsEvents.filter((e) => e.toolId && ownedToolIds.includes(e.toolId));
  };

  const getPlatformAnalytics = (_actorId: string): AnalyticsEvent[] => {
    // Enforced at RLS database layer
    return analyticsEvents;
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

  // --- BULK SEED & BULK ACTIONS WRITE CORES ---
  const seedTenToolsPerCategory = (): number => {
    const dateStr = new Date().toISOString().split('T')[0];
    const generatedTools: Tool[] = [];

    categories.forEach((cat) => {
      for (let i = 1; i <= 10; i++) {
        const name = `${cat.name} Optimizer ${i}`;
        const slug = `${cat.slug}-optimizer-${i}`;
        generatedTools.push({
          id: Math.random().toString(36).substr(2, 9),
          name,
          slug,
          tagline: `Advanced AI systems for ${cat.name.toLowerCase()} automations.`,
          description: `Optimize your operations using modern neural networks engineered for ${cat.name.toLowerCase()} metrics. Features high throughput batch configurations.`,
          categorySlug: cat.slug,
          subCategory: cat.subcategories[i % cat.subcategories.length] || 'General',
          pricing: i % 2 === 0 ? 'freemium' : 'free-trial',
          pricingUrl: 'https://aifynest.com/pricing',
          platforms: ['Web', 'Mac'],
          pricingPlans: [],
          features: [
            `Streamlined ${cat.name.toLowerCase()} automations`,
            `Collaborative asset sharing`,
            `Performance reporting`
          ],
          useCases: [
            `Standardizing ${cat.name.toLowerCase()} processes`,
            `Collaborative asset creation`,
            `Scale metrics reporting`
          ],
          pros: ['Intuitive layout', 'High performance reasoning', 'Extensive templates'],
          cons: ['Requires active network connectivity', 'High pricing for white-label licenses'],
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
      if (useSupabase) {
        // Batch write to Supabase
        const runBulk = async () => {
          const rows = generatedTools.map(t => ({
            name: t.name,
            slug: t.slug,
            tagline: t.tagline,
            description: t.description,
            category_slug: t.categorySlug,
            sub_category: t.subCategory,
            pricing: t.pricing,
            pricing_url: t.pricingUrl,
            platforms: t.platforms,
            features: t.features,
            use_cases: t.useCases,
            logo_url: t.logoUrl,
            screenshot_urls: t.screenshotUrls,
            website_url: t.websiteUrl,
            rating: t.rating,
            review_count: t.reviewCount,
            is_verified: t.isVerified,
            is_featured: t.isFeatured,
            status: 'approved',
            claim_status: 'unclaimed',
            tags: t.tags,
          }));
          await supabase.from('tools').insert(rows);
          fetchDatabaseState();
        };
        runBulk();
      } else {
        const updatedTools = [...tools, ...generatedTools];
        setTools(updatedTools);
        localStorage.setItem('ai_tools', JSON.stringify(updatedTools));
        logAdminAction('admin-id', 'System Admin', 'Bulk Seeding', `Generated ${generatedTools.length} mock tools.`);
      }
      return generatedTools.length;
    }
    return 0;
  };

  const bulkImportTools = (importedToolsData: any[]): number => {
    if (useSupabase) {
      const runBatch = async () => {
        try {
          // Enforce draft/pending status security defaults during batch inserts
          const rows = importedToolsData.map(item => {
            // Normalize and sanitize category slug to match database references (lowercase, hyphens instead of spaces)
            const cleanCategory = (item.categorySlug || '').toLowerCase().trim().replace(/\s+/g, '-');
            return {
              name: item.name,
              tagline: item.tagline || '',
              description: item.description || '',
              category_slug: cleanCategory,
              sub_category: item.subCategory || 'General',
              pricing: item.pricing || 'free',
              website_url: item.websiteUrl,
              logo_url: item.logoUrl || '',
              status: 'draft', // Enforce draft default status rule
              tags: Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
              features: Array.isArray(item.features) ? item.features : typeof item.features === 'string' ? item.features.split(',').map((f: string) => f.trim()).filter(Boolean) : [],
              use_cases: Array.isArray(item.useCases) ? item.useCases : typeof item.useCases === 'string' ? item.useCases.split(',').map((u: string) => u.trim()).filter(Boolean) : [],
              platforms: Array.isArray(item.platforms) ? item.platforms : typeof item.platforms === 'string' ? item.platforms.split(',').map((p: string) => p.trim()).filter(Boolean) : ['Web'],
            };
          });
          
          const { error } = await supabase.from('tools').insert(rows);
          if (error) {
            console.error('Error inserting bulk tools batch:', error.message, error.details);
            alert('Import Failed: ' + error.message + '\nDetails: ' + (error.details || 'Make sure category slugs match your categories exactly (e.g. "image-generation", "writing")'));
          } else {
            fetchDatabaseState();
            alert('Success! ' + importedToolsData.length + ' tools imported successfully as drafts.');
          }
        } catch (err: any) {
          console.error('Exception during bulk tools import:', err);
          alert('Import Error: ' + err.message);
        }
      };
      runBatch();
      return importedToolsData.length;
    } else {
      const dateStr = new Date().toISOString().split('T')[0];
      const generatedSlugs = new Set<string>();

      const newTools: Tool[] = importedToolsData.map((item) => {
        let baseSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!baseSlug) baseSlug = 'tool';
        let slug = baseSlug;
        let counter = 2;
        while (tools.some((t) => t.slug === slug) || generatedSlugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        generatedSlugs.add(slug);

        const parsedTags = Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
        const parsedFeatures = Array.isArray(item.features) ? item.features : typeof item.features === 'string' ? item.features.split(',').map((f: string) => f.trim()).filter(Boolean) : [];
        const parsedUseCases = Array.isArray(item.useCases) ? item.useCases : typeof item.useCases === 'string' ? item.useCases.split(',').map((u: string) => u.trim()).filter(Boolean) : [];
        const parsedPlatforms = Array.isArray(item.platforms) ? item.platforms : typeof item.platforms === 'string' ? item.platforms.split(',').map((p: string) => p.trim()).filter(Boolean) : ['Web'];

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          slug,
          tagline: item.tagline || '',
          description: item.description || '',
          categorySlug: item.categorySlug,
          subCategory: item.subCategory || '',
          pricing: item.pricing || 'free',
          pricingUrl: item.pricingUrl || '',
          platforms: parsedPlatforms,
          pricingPlans: [],
          features: parsedFeatures,
          useCases: parsedUseCases,
          pros: [],
          cons: [],
          logoUrl: item.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60',
          screenshotUrls: item.screenshotUrls || [],
          websiteUrl: item.websiteUrl,
          rating: 0,
          reviewCount: 0,
          isVerified: false,
          isFeatured: false,
          isSponsored: false,
          status: item.status || 'draft',
          ownerId: null,
          claimStatus: 'unclaimed',
          lastUpdated: dateStr,
          tags: parsedTags,
        };
      });

      const updatedTools = [...tools, ...newTools];
      setTools(updatedTools);
      saveToStorage('ai_tools', updatedTools);
      logAdminAction('admin-id', 'System Admin', 'Bulk Import', `Imported ${newTools.length} tools.`);
      return newTools.length;
    }
  };

  const bulkUpdateToolsStatus = (ids: string[], newStatus: Tool['status']) => {
    if (useSupabase) {
      const runBulkStatus = async () => {
        await supabase.from('tools').update({ status: newStatus }).in('id', ids);
        fetchDatabaseState();
      };
      runBulkStatus();
    } else {
      const updated = tools.map((t) => ids.includes(t.id) ? { ...t, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : t);
      setTools(updated);
      saveToStorage('ai_tools', updated);
      logAdminAction('admin-id', 'System Admin', 'Bulk Update Status', `Updated status of ${ids.length} tools to ${newStatus}.`);
    }
  };

  const bulkDeleteTools = (ids: string[]) => {
    if (useSupabase) {
      const runBulkDel = async () => {
        // Enforce soft deletion status update
        await supabase.from('tools').update({ status: 'archived' }).in('id', ids);
        fetchDatabaseState();
      };
      runBulkDel();
    } else {
      const updated = tools.filter((t) => !ids.includes(t.id));
      setTools(updated);
      saveToStorage('ai_tools', updated);
      logAdminAction('admin-id', 'System Admin', 'Bulk Delete', `Deleted ${ids.length} tools.`);
    }
  };

  // --- AFFILIATE LINKS MANAGER ---
  const addAffiliateLink = (linkData: Omit<AffiliateLink, 'id' | 'clicks' | 'conversions' | 'revenue'>) => {
    const newLink: AffiliateLink = {
      ...linkData,
      id: Math.random().toString(36).substr(2, 9),
      clicks: 0,
      conversions: 0,
      revenue: 0,
    };
    const updated = [newLink, ...affiliateLinks];
    setAffiliateLinks(updated);
    saveToStorage('ai_affiliates', updated);
    return newLink;
  };

  const updateAffiliateLink = (id: string, updatedFields: Partial<AffiliateLink>) => {
    const updated = affiliateLinks.map((l) => (l.id === id ? { ...l, ...updatedFields } : l));
    setAffiliateLinks(updated);
    saveToStorage('ai_affiliates', updated);
  };

  const deleteAffiliateLink = (id: string) => {
    const updated = affiliateLinks.filter((l) => l.id !== id);
    setAffiliateLinks(updated);
    saveToStorage('ai_affiliates', updated);
  };

  // --- NOTIFICATIONS DISPATCH ---
  const addNotification = (userId: string, title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      read: false,
      type,
      date: new Date().toISOString(),
    };
    if (useSupabase) {
      supabase.from('notifications').insert({
        user_id: userId === 'admin-id' ? '00000000-0000-0000-0000-000000000000' : userId, // fallback uuid representation
        title,
        message,
        read: false,
        type,
      }).then(() => fetchDatabaseState());
    } else {
      const updated = [newNotif, ...notifications];
      setNotifications(updated);
      saveToStorage('ai_notifications', updated);
    }
  };

  const markNotificationRead = (id: string) => {
    if (useSupabase) {
      supabase.from('notifications').update({ read: true }).eq('id', id).then(() => fetchDatabaseState());
    } else {
      const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications(updated);
      saveToStorage('ai_notifications', updated);
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        dbError,
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
        getToolAnalytics,
        getOwnerAnalytics,
        getPlatformAnalytics,
        bulkImportTools,
        bulkUpdateToolsStatus,
        bulkDeleteTools,
        addAffiliateLink,
        updateAffiliateLink,
        deleteAffiliateLink,
        addNotification,
        markNotificationRead,
        seedTenToolsPerCategory,
        getOwnedTools,
        getOwnedTool,
        canManageTool,
        ownerWallet,
        ledger,
        fundCampaign,
        simulateTopup,
        verifyPayment,
        approveCampaign,
        adjustWalletBalance,
        verificationRequests,
        reports,
        submitReport,
        resolveReport,
        requestToolVerification,
        approveToolVerification,
        revokeToolVerification,
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
