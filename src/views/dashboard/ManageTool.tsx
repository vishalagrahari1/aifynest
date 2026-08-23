/* src/views/dashboard/ManageTool.tsx */
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Shield } from '../../components/shared/Icons';

export const ManageTool: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getOwnedTool } = useDatabase();

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

  return (
    <div className="container section">
      <SEOHead title={`Manage ${tool.name} — AIFynest`} description={`Edit configuration of ${tool.name}.`} />
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
        <img
          src={tool.logoUrl}
          alt={tool.name}
          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>Manage {tool.name}</h1>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Status: {tool.status.toUpperCase()}</span>
        </div>
      </div>

      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', marginBottom: '12px' }}>
          Listing Control Panel Placeholder
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
          Ownership of <strong>{tool.name}</strong> by <strong>{user.email}</strong> has been successfully verified. Complete listing editing parameters, pricing plan configurations, and screenshot media management will be enabled in Step 3.
        </p>
        <Link to="/dashboard/tools" className="btn btn-outline">
          &lt; Back to Tools List
        </Link>
      </div>
    </div>
  );
};
