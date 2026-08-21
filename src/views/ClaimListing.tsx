/* src/views/ClaimListing.tsx */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/shared/SEOHead';
import { Award, ShieldAlert } from '../components/shared/Icons';

interface ClaimListingProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ClaimListing: React.FC<ClaimListingProps> = ({ onToast }) => {
  const [searchParams] = useSearchParams();
  const { tools, claimListing, claims } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  const toolIdParam = searchParams.get('toolId') || '';

  const [toolId, setToolId] = useState(toolIdParam);
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (toolIdParam) {
      setToolId(toolIdParam);
    }
  }, [toolIdParam]);

  const targetTool = tools.find((t) => t.id === toolId);

  // List of unclaimed tools for dropdown select if no parameter
  const unclaimedTools = tools.filter((t) => t.claimStatus === 'unclaimed' && t.status === 'approved');

  // Verify if a claim is already pending for this tool
  const isClaimPending = claims.some((c) => c.toolId === toolId && c.status === 'pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onToast('Please log in to submit a claim request.', 'error');
      navigate('/login');
      return;
    }
    if (!toolId) {
      onToast('Please select a tool listing to claim.', 'error');
      return;
    }
    if (targetTool?.claimStatus === 'claimed') {
      onToast('This listing has already been verified and claimed by an owner.', 'error');
      return;
    }
    if (isClaimPending) {
      onToast('A claim request for this tool is already pending evaluation.', 'error');
      return;
    }

    claimListing(toolId, user.id, email, domain, message);

    onToast('Claim request submitted successfully! Admins will verify credentials.', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="container section" style={{ maxWidth: '600px' }}>
      <SEOHead
        title="Claim Your AI Tool Listing"
        description="Verify ownership of your product listing, edit features lists, response to user reviews, and unlock advertising channels."
      />

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '12px',
              borderRadius: 'var(--radius-full)',
              marginBottom: '16px',
            }}
          >
            <Award size={24} />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: '0 0 8px 0' }}>
            Claim Your AI Tool
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Connect your listings to your dashboard to edit pages, view CTR analytics, and sponsor campaigns.
          </p>
        </div>

        {!user ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '20px' }}>
              You must create an account or sign in to verify owner credentials.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tool Selection */}
            <div className="form-group">
              <label className="form-label">Selected AI Tool *</label>
              {targetTool ? (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <img
                    src={targetTool.logoUrl}
                    alt={targetTool.name}
                    style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-xs)', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{targetTool.name}</span>
                </div>
              ) : (
                <select
                  required
                  value={toolId}
                  onChange={(e) => setToolId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select a listing...</option>
                  {unclaimedTools.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Verification details */}
            <div className="form-group">
              <label className="form-label">Corporate Email Address *</label>
              <input
                type="email"
                required
                placeholder="owner@companyname.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                * Must match your tools corporate domain address to verify credentials.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Official Domain *</label>
              <input
                type="text"
                required
                placeholder="companyname.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Verification Message / Proof of Ownership</label>
              <textarea
                rows={4}
                placeholder="Explain who you are in the organization and describe proof (e.g. domain register, linkedin link, or meta tag implementation)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-textarea"
              />
            </div>

            {/* Trust disclaimer */}
            <div
              style={{
                backgroundColor: 'var(--color-info-light)',
                border: '1px solid var(--color-info)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '11px',
                lineHeight: '1.4',
                color: 'var(--text-secondary)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <ShieldAlert size={20} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
              <div>
                Our trust safety editors verify company domain emails or TXT registers manually. Evaluation results will update on your dashboard within 24 hours.
              </div>
            </div>

            <button
              type="submit"
              disabled={isClaimPending}
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: '12px' }}
            >
              {isClaimPending ? 'Evaluation Request Pending' : 'Submit Claim Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
