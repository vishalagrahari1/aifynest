/* src/views/AffiliateRedirect.tsx */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles } from '../components/shared/Icons';

interface AffiliateRedirectProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AffiliateRedirect: React.FC<AffiliateRedirectProps> = ({ onToast }) => {
  const { slug } = useParams<{ slug: string }>();
  const { tools, trackEvent } = useDatabase();
  const navigate = useNavigate();
  const [toolName, setToolName] = useState('AI Tool');

  useEffect(() => {
    if (!slug) {
      navigate('/', { replace: true });
      return;
    }

    const toolObj = tools.find((t) => t.slug === slug);
    if (!toolObj) {
      onToast('The requested tool listing could not be found.', 'error');
      navigate('/', { replace: true });
      return;
    }

    setToolName(toolObj.name);

    // Track the analytics outbound click
    const isAffiliateActive = toolObj.affiliateStatus === 'active' && toolObj.affiliateUrl;
    const finalUrl = isAffiliateActive ? toolObj.affiliateUrl! : toolObj.websiteUrl;
    const eventType = isAffiliateActive ? 'affiliate_click' : 'tool_click';

    trackEvent(eventType, toolObj.id, toolObj.categorySlug, undefined, document.referrer);

    // Redirect timeout to ensure visual wow & compliance exposure
    const timer = setTimeout(() => {
      window.location.replace(finalUrl);
    }, 1500);

    return () => clearTimeout(timer);
  }, [slug, tools, navigate, onToast, trackEvent]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '24px',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, var(--color-primary-light) 0%, transparent 70%)',
      }}
    >
      <SEOHead title={`Redirecting to ${toolName} — AIFynest`} description="Connecting you with top AI developers safely." />

      {/* Floating Network Glow & Loading Anim */}
      <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '32px' }}>
        <div
          className="pulse-glow"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            opacity: 0.15,
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '20px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          <Sparkles size={36} className="spinning-icon" />
        </div>
      </div>

      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 8px 0' }}>
        Connecting to {toolName}
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '400px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
        Setting up your secure referral connection. You will be redirected shortly...
      </p>

      {/* FTC Disclosure */}
      <div
        style={{
          maxWidth: '480px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: '1.4',
        }}
      >
        ℹ️ <strong>Affiliate Disclosure:</strong> AIFynest may earn a small referral commission when you purchase through certain links. This helps support our directory listings validation.
      </div>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.2; }
          70%, 100% { transform: scale(1.6); opacity: 0; }
        }
        .spinning-icon {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
