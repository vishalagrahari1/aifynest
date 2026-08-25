/* src/views/admin/DataQualityAudit.tsx */
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/shared/Modal';
import { supabase } from '../../utils/supabase';

interface DataQualityAuditProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const calculateQualityScore = (tool: any) => {
  let score = 0;
  
  if (tool.name && tool.name.trim() !== '') score += 10;
  if (tool.description && tool.description.trim() !== '') score += 15;
  if (tool.websiteUrl && tool.websiteUrl.trim() !== '') score += 10;
  if (tool.logoUrl && tool.logoUrl.trim() !== '') score += 10;
  if (tool.tagline && tool.tagline.trim() !== '') score += 10;
  
  // Features array check
  const features = tool.features || [];
  if (features && Array.isArray(features) && features.length > 0) score += 15;
  
  // Use cases array check
  const useCases = tool.useCases || [];
  if (useCases && Array.isArray(useCases) && useCases.length > 0) score += 15;
  
  if (tool.categorySlug && tool.categorySlug.trim() !== '') score += 5;
  if (tool.pricing && tool.pricing.trim() !== '') score += 5;
  
  // Tags array check
  const tags = tool.tags || [];
  if (tags && Array.isArray(tags) && tags.length > 0) score += 5;
  
  let rating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor' = 'Poor';
  if (score >= 90) rating = 'Excellent';
  else if (score >= 75) rating = 'Good';
  else if (score >= 50) rating = 'Needs Improvement';
  
  return { score, rating };
};

export const DataQualityAudit: React.FC<DataQualityAuditProps> = ({ onToast }) => {
  const { tools, updateTool, logAdminAction } = useDatabase();
  const { user } = useAuth();

  // Selected filter group tab
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'duplicates_name' | 'duplicates_domain' | 'invalid_url' | 'missing_content'>('all');

  // Local pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting for content table
  const [sortField, setSortField] = useState<'name' | 'score'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Ignored duplicate IDs (held in state for session overrides)
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  // Merge modal states
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeGroup, setMergeGroup] = useState<any[]>([]);
  const [survivingId, setSurvivingId] = useState<string>('');
  const [isSubmittingMerge, setIsSubmittingMerge] = useState(false);

  // URL fix confirmation states
  const [isFixUrlModalOpen, setIsFixUrlModalOpen] = useState(false);
  const [targetFixTool, setTargetFixTool] = useState<any | null>(null);

  // Archive confirmation states
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [targetArchiveTool, setTargetArchiveTool] = useState<any | null>(null);

  // Inline edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any | null>(null);
  const [editFields, setEditFields] = useState({
    tagline: '',
    logoUrl: '',
    tags: '',
    features: '',
    useCases: ''
  });

  // Normalize Domain Helper
  const getNormalizedDomain = (urlStr: string): string => {
    if (!urlStr) return '';
    try {
      let clean = urlStr.trim().toLowerCase();
      clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
      clean = clean.replace(/\/$/, '');
      return clean;
    } catch (_) {
      return '';
    }
  };

  // ----------------------------------------------------
  // Calculated Auditor Metrics
  // ----------------------------------------------------
  const stats = useMemo(() => {
    let total = tools.length;
    let approved = tools.filter(t => t.status === 'approved').length;
    let draft = tools.filter(t => t.status === 'draft').length;
    let pending = tools.filter(t => t.status === 'pending').length;
    let rejected = tools.filter(t => t.status === 'rejected').length;
    let archived = tools.filter(t => t.status === 'archived').length;

    // Duplicates Names counting
    const nameCounts: Record<string, number> = {};
    tools.forEach(t => {
      if (t.status === 'archived') return;
      const n = t.name.trim().toLowerCase();
      nameCounts[n] = (nameCounts[n] || 0) + 1;
    });
    const dupNames = Object.values(nameCounts).filter(c => c > 1).length;

    // Duplicate Domains counting
    const domainCounts: Record<string, number> = {};
    tools.forEach(t => {
      if (t.status === 'archived' || !t.websiteUrl) return;
      const dom = getNormalizedDomain(t.websiteUrl);
      if (dom) {
        domainCounts[dom] = (domainCounts[dom] || 0) + 1;
      }
    });
    const dupDomains = Object.values(domainCounts).filter(c => c > 1).length;

    // Invalid URLs
    const invalidUrlCount = tools.filter(t => t.status !== 'archived' && t.websiteUrl && !t.websiteUrl.trim().startsWith('http')).length;

    // Missing fields metrics
    let missingFeatures = tools.filter(t => t.status !== 'archived' && (!t.features || t.features.length === 0)).length;
    let missingUseCases = tools.filter(t => t.status !== 'archived' && (!t.useCases || t.useCases.length === 0)).length;
    let missingTags = tools.filter(t => t.status !== 'archived' && (!t.tags || t.tags.length === 0)).length;
    let missingLogos = tools.filter(t => t.status !== 'archived' && (!t.logoUrl || t.logoUrl.trim() === '')).length;

    return {
      total, approved, draft, pending, rejected, archived,
      dupNames, dupDomains, invalidUrlCount,
      missingFeatures, missingUseCases, missingTags, missingLogos
    };
  }, [tools]);

  // Group duplicate names
  const duplicateNameGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    tools.forEach(t => {
      if (t.status === 'archived' || ignoredIds.has(t.id)) return;
      const key = t.name.trim().toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups)
      .filter(([_, list]) => list.length > 1)
      .map(([name, list]) => ({ name, list }));
  }, [tools, ignoredIds]);

  // Group duplicate domains
  const duplicateDomainGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    tools.forEach(t => {
      if (t.status === 'archived' || !t.websiteUrl || ignoredIds.has(t.id)) return;
      const key = getNormalizedDomain(t.websiteUrl);
      if (key) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      }
    });
    return Object.entries(groups)
      .filter(([_, list]) => list.length > 1)
      .map(([domain, list]) => ({ domain, list }));
  }, [tools, ignoredIds]);

  // Invalid website URL list
  const invalidUrlsList = useMemo(() => {
    return tools.filter(t => t.status !== 'archived' && t.websiteUrl && !t.websiteUrl.trim().startsWith('http'));
  }, [tools]);

  // Missing content list (and scores)
  const missingContentList = useMemo(() => {
    const list = tools.filter(t => 
      t.status !== 'archived' && (
        (!t.features || t.features.length === 0) ||
        (!t.useCases || t.useCases.length === 0) ||
        (!t.tags || t.tags.length === 0) ||
        (!t.logoUrl || t.logoUrl.trim() === '') ||
        (!t.tagline || t.tagline.trim() === '')
      )
    ).map(t => {
      const { score, rating } = calculateQualityScore(t);
      return { tool: t, score, rating };
    });

    // Apply sorting
    return list.sort((a, b) => {
      let compare = 0;
      if (sortField === 'name') {
        compare = a.tool.name.localeCompare(b.tool.name);
      } else if (sortField === 'score') {
        compare = a.score - b.score;
      }
      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [tools, sortField, sortOrder]);

  // ----------------------------------------------------
  // Actions Handlers
  // ----------------------------------------------------

  const handleFixUrlClick = (tool: any) => {
    setTargetFixTool(tool);
    setIsFixUrlModalOpen(true);
  };

  const executeFixUrl = async () => {
    if (!targetFixTool || !user) return;
    const correctedUrl = `https://${targetFixTool.websiteUrl.trim()}`;
    
    try {
      // 1. Update live tools table using authenticated context
      await updateTool(targetFixTool.id, { websiteUrl: correctedUrl }, user.id);
      
      // 2. Add audit log entries
      logAdminAction(
        user.id,
        user.email || 'Admin',
        'Data Quality - Fix URL',
        `Corrected tool '${targetFixTool.name}' (ID: ${targetFixTool.id}) website URL protocol to: ${correctedUrl}`
      );

      onToast(`URL corrected successfully for ${targetFixTool.name}`, 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Failed to update website URL.', 'error');
    } finally {
      setIsFixUrlModalOpen(false);
      setTargetFixTool(null);
    }
  };

  const handleArchiveClick = (tool: any) => {
    setTargetArchiveTool(tool);
    setIsArchiveModalOpen(true);
  };

  const executeArchive = async () => {
    if (!targetArchiveTool || !user) return;

    try {
      await updateTool(targetArchiveTool.id, { status: 'archived' }, user.id);
      logAdminAction(
        user.id,
        user.email || 'Admin',
        'Data Quality - Archive',
        `Archived tool '${targetArchiveTool.name}' (ID: ${targetArchiveTool.id})`
      );
      onToast(`Tool '${targetArchiveTool.name}' successfully archived.`, 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Failed to archive tool.', 'error');
    } finally {
      setIsArchiveModalOpen(false);
      setTargetArchiveTool(null);
    }
  };

  const handleIgnoreClick = (toolId: string) => {
    setIgnoredIds(prev => {
      const next = new Set(prev);
      next.add(toolId);
      return next;
    });
    onToast('Item ignored for this session.', 'info');
  };

  const handleMergeClick = (groupList: any[]) => {
    setMergeGroup(groupList);
    setSurvivingId(groupList[0]?.id || '');
    setIsMergeModalOpen(true);
  };

  const executeMerge = async () => {
    if (!survivingId || !user) return;
    setIsSubmittingMerge(true);

    const survivor = mergeGroup.find(t => t.id === survivingId);
    const duplicates = mergeGroup.filter(t => t.id !== survivingId);

    try {
      for (const dup of duplicates) {
        // A. Move reviews
        const { error: revErr } = await supabase
          .from('reviews')
          .update({ tool_id: survivingId })
          .eq('tool_id', dup.id);
        if (revErr) console.warn('Failed to reassign reviews:', revErr.message);

        // B. Move Claims
        const { error: claimErr } = await supabase
          .from('tool_claims')
          .update({ tool_id: survivingId })
          .eq('tool_id', dup.id);
        if (claimErr) console.warn('Failed to reassign claims:', claimErr.message);

        // C. Reassign owner if survivor lacks owner and duplicate has one
        if (dup.ownerId && !survivor.ownerId) {
          await updateTool(survivingId, { ownerId: dup.ownerId }, user.id);
          survivor.ownerId = dup.ownerId; // Sync memory
        }

        // D. Set duplicate tool to archived status
        await updateTool(dup.id, { status: 'archived' }, user.id);

        // E. Log individual actions
        logAdminAction(
          user.id,
          user.email || 'Admin',
          'Data Quality - Merge Group',
          `Merged duplicate tool '${dup.name}' (ID: ${dup.id}) into surviving tool '${survivor.name}' (ID: ${survivingId})`
        );
      }

      onToast(`Successfully merged ${mergeGroup.length - 1} duplicate(s) into '${survivor.name}'`, 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'An error occurred during merging.', 'error');
    } finally {
      setIsSubmittingMerge(false);
      setIsMergeModalOpen(false);
      setMergeGroup([]);
    }
  };

  const handleEditClick = (tool: any) => {
    setEditingTool(tool);
    setEditFields({
      tagline: tool.tagline || '',
      logoUrl: tool.logoUrl || '',
      tags: tool.tags?.join(', ') || '',
      features: tool.features?.join(', ') || '',
      useCases: tool.useCases?.join(', ') || ''
    });
    setIsEditModalOpen(true);
  };

  const executeInlineEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool || !user) return;

    const parseList = (str: string) => str.split(',').map(x => x.trim()).filter(x => x.length > 0);

    try {
      await updateTool(editingTool.id, {
        tagline: editFields.tagline.trim(),
        logoUrl: editFields.logoUrl.trim(),
        tags: parseList(editFields.tags),
        features: parseList(editFields.features),
        useCases: parseList(editFields.useCases)
      }, user.id);

      logAdminAction(
        user.id,
        user.email || 'Admin',
        'Data Quality - Inline Edit',
        `Updated content parameters for '${editingTool.name}' (ID: ${editingTool.id})`
      );

      onToast(`Successfully updated metadata values for '${editingTool.name}'`, 'success');
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Failed to update metadata.', 'error');
    }
  };

  // ----------------------------------------------------
  // Pagination & Filtering Logic
  // ----------------------------------------------------
  const paginatedData = useMemo(() => {
    let rawList: any[] = [];
    
    if (activeSubTab === 'duplicates_name') rawList = duplicateNameGroups;
    else if (activeSubTab === 'duplicates_domain') rawList = duplicateDomainGroups;
    else if (activeSubTab === 'invalid_url') rawList = invalidUrlsList;
    else if (activeSubTab === 'missing_content') rawList = missingContentList;
    else {
      // Default: All problems mixed
      rawList = [
        ...invalidUrlsList.map(item => ({ type: 'url', ...item })),
        ...missingContentList.map(item => ({ type: 'content', ...item.tool, score: item.score, rating: item.rating }))
      ];
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = rawList.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(rawList.length / itemsPerPage);

    return { paginated, totalPages, totalCount: rawList.length };
  }, [activeSubTab, currentPage, duplicateNameGroups, duplicateDomainGroups, invalidUrlsList, missingContentList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Dashboard Quality Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>TOTAL ACTIVE LISTINGS</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px' }}>{stats.total}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Approved: {stats.approved} │ Draft: {stats.draft}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 'bold' }}>DUPLICATE COLLISIONS</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: 'var(--color-danger)' }}>{stats.dupNames + stats.dupDomains}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Name Dupes: {stats.dupNames} │ Domain Dupes: {stats.dupDomains}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 'bold' }}>FORMATTING ERRORS</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: 'var(--color-warning)' }}>{stats.invalidUrlCount}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Invalid URL prefixes detected.</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold' }}>MISSING ATTRIBUTES</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: 'var(--color-primary)' }}>{stats.missingFeatures}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Missing Features / Use Cases.</div>
        </div>
      </div>

      {/* 2. Filter Navigation Tab Row */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {[
          { id: 'all', name: 'All Problems' },
          { id: 'duplicates_name', name: `Duplicate Names (${duplicateNameGroups.length})` },
          { id: 'duplicates_domain', name: `Duplicate Domains (${duplicateDomainGroups.length})` },
          { id: 'invalid_url', name: `Invalid URLs (${invalidUrlsList.length})` },
          { id: 'missing_content', name: `Missing Content (${missingContentList.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveSubTab(t.id as any);
              setCurrentPage(1);
            }}
            className={`btn btn-sm ${activeSubTab === t.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* 3. Filter Table / Results rendering */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
        
        {/* DUPLICATE NAMES RENDER */}
        {activeSubTab === 'duplicates_name' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)' }}>Duplicate Name Groups</h3>
            {paginatedData.paginated.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No duplicate name conflicts detected.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {paginatedData.paginated.map((group: any) => (
                  <div key={group.name} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Conflict Name: &ldquo;{group.list[0].name}&rdquo; ({group.list.length} hits)</span>
                      <button onClick={() => handleMergeClick(group.list)} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                        Merge Group
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th>Tool Name</th>
                            <th>ID</th>
                            <th>Website</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.list.map((item: any) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{item.id.substring(0, 8)}...</td>
                              <td><a href={item.websiteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{item.websiteUrl}</a></td>
                              <td>{item.categorySlug}</td>
                              <td><span className={`badge badge-${item.status === 'approved' ? 'success' : 'secondary'}`}>{item.status}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => handleArchiveClick(item)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '2px 6px', fontSize: '9px' }}>Archive</button>
                                  <button onClick={() => handleIgnoreClick(item.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)', padding: '2px 6px', fontSize: '9px' }}>Ignore</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DUPLICATE DOMAINS RENDER */}
        {activeSubTab === 'duplicates_domain' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)' }}>Duplicate Domain Groups</h3>
            {paginatedData.paginated.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No domain conflicts detected.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {paginatedData.paginated.map((group: any) => (
                  <div key={group.domain} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Domain Conflict: {group.domain} ({group.list.length} hits)</span>
                      <button onClick={() => handleMergeClick(group.list)} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                        Merge Group
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th>Tool Name</th>
                            <th>ID</th>
                            <th>Website</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.list.map((item: any) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{item.id.substring(0, 8)}...</td>
                              <td><a href={item.websiteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{item.websiteUrl}</a></td>
                              <td><span className={`badge badge-${item.status === 'approved' ? 'success' : 'secondary'}`}>{item.status}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => handleArchiveClick(item)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '2px 6px', fontSize: '9px' }}>Archive</button>
                                  <button onClick={() => handleIgnoreClick(item.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)', padding: '2px 6px', fontSize: '9px' }}>Ignore</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVALID URL RENDER */}
        {activeSubTab === 'invalid_url' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)' }}>Invalid Destination URLs</h3>
            {paginatedData.paginated.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>All tool destination URLs have correct HTTP protocol prefixes.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                  <thead>
                    <tr>
                      <th>Tool Name</th>
                      <th>Current URL</th>
                      <th>Suggested Correction</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.paginated.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                        <td style={{ color: 'var(--color-danger)' }}>{item.websiteUrl}</td>
                        <td style={{ color: 'var(--color-success)' }}>https://{item.websiteUrl}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleFixUrlClick(item)} className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }}>Fix URL</button>
                            <button onClick={() => handleArchiveClick(item)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '4px 10px' }}>Archive</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MISSING CONTENT QUALITY RENDER */}
        {activeSubTab === 'missing_content' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Content Quality Score Auditor</h3>
              
              {/* Sort triggers */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sort by:</span>
                <button
                  onClick={() => {
                    setSortField('score');
                    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  Quality Score {sortField === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => {
                    setSortField('name');
                    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr>
                    <th>Tool Name</th>
                    <th>Quality Score</th>
                    <th>Missing Attributes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.paginated.map((item: any) => {
                    const missing = [];
                    if (!item.tool.tagline) missing.push('Tagline');
                    if (!item.tool.logoUrl) missing.push('Logo');
                    if (!item.tool.features || item.tool.features.length === 0) missing.push('Features');
                    if (!item.tool.useCases || item.tool.useCases.length === 0) missing.push('Use Cases');
                    if (!item.tool.tags || item.tool.tags.length === 0) missing.push('Tags');

                    // Badge color matching
                    let badgeColor = 'var(--color-danger)';
                    if (item.rating === 'Excellent') badgeColor = 'var(--color-success)';
                    else if (item.rating === 'Good') badgeColor = 'var(--color-primary)';
                    else if (item.rating === 'Needs Improvement') badgeColor = 'var(--color-warning)';

                    return (
                      <tr key={item.tool.id}>
                        <td style={{ fontWeight: 'bold' }}>{item.tool.name}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>{item.score}/100</span>
                            <span 
                              style={{ 
                                fontSize: '9px', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                backgroundColor: badgeColor + '22',
                                color: badgeColor,
                                fontWeight: 'bold',
                                border: `1px solid ${badgeColor}44`
                              }}
                            >
                              {item.rating}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-danger)', fontSize: '11px' }}>
                          {missing.join(', ')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditClick(item.tool)} className="btn btn-primary btn-sm" style={{ padding: '3px 8px', fontSize: '10px' }}>Inline Edit</button>
                            <button onClick={() => handleArchiveClick(item.tool)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '3px 8px', fontSize: '10px' }}>Archive</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MIXED PROBLEMS RENDER (ALL TAB) */}
        {activeSubTab === 'all' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)' }}>All Active Quality Flags</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Tool Name</th>
                    <th>Quality Score</th>
                    <th>Issue Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data quality flags active.</td>
                    </tr>
                  ) : (
                    paginatedData.paginated.map((item: any) => {
                      const isUrl = item.type === 'url';
                      return (
                        <tr key={item.id}>
                          <td>
                            <span className={`badge badge-${isUrl ? 'danger' : 'warning'}`}>
                              {isUrl ? 'URL' : 'Content'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                          <td>
                            {isUrl ? '-' : `${item.score}/100`}
                          </td>
                          <td style={{ color: isUrl ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                            {isUrl ? `Protocol missing: ${item.websiteUrl}` : `Needs missing features/use cases/logo.`}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {isUrl ? (
                                <button onClick={() => handleFixUrlClick(item)} className="btn btn-primary btn-sm" style={{ padding: '3px 8px', fontSize: '10px' }}>Fix URL</button>
                              ) : (
                                <button onClick={() => handleEditClick(item)} className="btn btn-primary btn-sm" style={{ padding: '3px 8px', fontSize: '10px' }}>Edit</button>
                              )}
                              <button onClick={() => handleArchiveClick(item)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '3px 8px', fontSize: '10px' }}>Archive</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Pagination Footer */}
        {paginatedData.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Showing {Math.min(paginatedData.totalCount, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(paginatedData.totalCount, currentPage * itemsPerPage)} of {paginatedData.totalCount} items
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              <button
                disabled={currentPage === paginatedData.totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* 5. OVERLAYS & CONFIRMATION MODALS */}
      {/* ==================================================== */}

      {/* A. FIX URL MODAL */}
      <Modal isOpen={isFixUrlModalOpen} onClose={() => setIsFixUrlModalOpen(false)} title="Confirm URL Auto-Correction">
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: '12px' }}>
            Are you sure you want to correct the destination URL protocol for <strong>{targetFixTool?.name}</strong>?
          </p>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><span style={{ color: 'var(--color-danger)' }}>From:</span> {targetFixTool?.websiteUrl}</div>
            <div><span style={{ color: 'var(--color-success)' }}>To:</span> https://{targetFixTool?.websiteUrl}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button onClick={() => setIsFixUrlModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button onClick={executeFixUrl} className="btn btn-primary btn-sm">Confirm Fix</button>
          </div>
        </div>
      </Modal>

      {/* B. ARCHIVE MODAL */}
      <Modal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} title="Confirm Archive Listing">
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
            Are you sure you want to archive <strong>{targetArchiveTool?.name}</strong>?
          </p>
          <div style={{ padding: '10px 14px', margin: '14px 0', borderLeft: '4px solid var(--color-warning)', backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', fontSize: '11px', borderRadius: 'var(--radius-sm)' }}>
            ⚠️ <strong>Action Details:</strong> Archiving removes the listing from the public directory instantly but preserves user reviews, analytics, and metadata. This action is recorded in the admin audit log.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button onClick={() => setIsArchiveModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button onClick={executeArchive} className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'white' }}>Archive Tool</button>
          </div>
        </div>
      </Modal>

      {/* C. MERGE CONFIRMATION MODAL */}
      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Duplicate Conflict Group">
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: '14px' }}>
            Multiple duplicates detected for this group. Select the <strong>Surviving Tool</strong> (all user reviews, claims, and ownership files will be transferred to it, and other duplicates will be archived).
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {mergeGroup.map((item) => (
              <label 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer',
                  backgroundColor: survivingId === item.id ? 'var(--color-primary-light)' : 'transparent',
                  borderColor: survivingId === item.id ? 'var(--color-primary)' : 'var(--border-color)'
                }}
              >
                <input
                  type="radio"
                  name="survivor"
                  value={item.id}
                  checked={survivingId === item.id}
                  onChange={() => setSurvivingId(item.id)}
                />
                <div style={{ fontSize: 'var(--text-xs)' }}>
                  <strong>{item.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({item.id.substring(0, 8)})</span>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Website: {item.websiteUrl} │ Status: {item.status}</div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button disabled={isSubmittingMerge} onClick={() => setIsMergeModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button disabled={isSubmittingMerge || !survivingId} onClick={executeMerge} className="btn btn-primary btn-sm">
              {isSubmittingMerge ? 'Merging...' : 'Confirm Merge'}
            </button>
          </div>
        </div>
      </Modal>

      {/* D. INLINE EDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Inline Metadata Editor: ${editingTool?.name}`}>
        <form onSubmit={executeInlineEdit} style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Tagline</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              value={editFields.tagline} 
              onChange={e => setEditFields(prev => ({ ...prev, tagline: e.target.value }))} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              value={editFields.logoUrl} 
              onChange={e => setEditFields(prev => ({ ...prev, logoUrl: e.target.value }))} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input 
              type="text" 
              className="form-input" 
              value={editFields.tags} 
              onChange={e => setEditFields(prev => ({ ...prev, tags: e.target.value }))} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Features (comma separated)</label>
            <textarea 
              rows={3} 
              className="form-input" 
              value={editFields.features} 
              onChange={e => setEditFields(prev => ({ ...prev, features: e.target.value }))} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Use Cases (comma separated)</label>
            <textarea 
              rows={3} 
              className="form-input" 
              value={editFields.useCases} 
              onChange={e => setEditFields(prev => ({ ...prev, useCases: e.target.value }))} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
