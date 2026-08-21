/* src/components/layout/Footer.tsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';


export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate saving email locally to newsletter subscribers list
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    if (subscribers.includes(email)) {
      setToastMessage('You are already subscribed to our newsletter!');
    } else {
      subscribers.push(email);
      localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
      setToastMessage('Success! Welcome to our weekly AI newsletter.');
      setEmail('');
    }
  };

  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '60px 0 30px 0',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '40px',
            marginBottom: '40px',
          }}
          className="footer-grid"
        >
          {/* Logo & Newsletter Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="footer-col-1">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)', textDecoration: 'none' }}>
              <div style={{ background: 'var(--gradient-brand)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <span style={{ fontWeight: 800 }}>
                <span>AI</span><span style={{ color: 'var(--color-primary)' }}>Fynest</span>
              </span>
            </Link>
            <p style={{ lineHeight: '1.6', fontSize: 'var(--text-xs)' }}>
              Discover, save, compare, and review the best artificial intelligence tools to accelerate your workflow, creative projects, and SaaS operations.
            </p>
            {/* Newsletter form */}
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                Subscribe to our Weekly Digest
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    flex: 1,
                    outline: 'none',
                  }}
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 12px' }}>
                  Join
                </button>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                * We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </div>

          {/* Links Column 1: Discover */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Discover</h4>
            <Link to="/ai-tools" style={footerLinkStyle}>All AI Tools</Link>
            <Link to="/categories" style={footerLinkStyle}>Explore Categories</Link>
            <Link to="/trending" style={footerLinkStyle}>Trending Listings</Link>
            <Link to="/new" style={footerLinkStyle} >Recently Added</Link>
            <Link to="/collections" style={footerLinkStyle}>Curated Stacks</Link>
            <Link to="/compare" style={footerLinkStyle}>Compare Tools</Link>
          </div>

          {/* Links Column 2: Listings & Builders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>For AI Builders</h4>
            <Link to="/submit-tool" style={footerLinkStyle}>Submit a Tool</Link>
            <Link to="/claim" style={footerLinkStyle}>Claim Your Listing</Link>
            <Link to="/advertise" style={footerLinkStyle}>Promote Your Tool</Link>
            <Link to="/advertise" style={footerLinkStyle}>Advertising</Link>
            <Link to="/pricing" style={footerLinkStyle}>Developer API</Link>
          </div>

          {/* Links Column 3: Trust & Legal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Trust & Transparency</h4>
            <a href="#editorial-guidelines" style={footerLinkStyle}>Editorial Guidelines</a>
            <a href="#reviews-policy" style={footerLinkStyle}>Review Policy</a>
            <a href="#advertising-disclosure" style={footerLinkStyle}>Ad Disclosure</a>
            <a href="#privacy" style={footerLinkStyle}>Privacy Policy</a>
            <a href="#terms" style={footerLinkStyle}>Terms of Service</a>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '30px 0' }} />

        {/* Bottom copyright alignment */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }} className="footer-bottom">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} AIFynest. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--text-xs)' }}>
            <a href="#twitter" style={{ color: 'var(--text-muted)' }}>Twitter / X</a>
            <a href="#github" style={{ color: 'var(--text-muted)' }}>GitHub</a>
            <a href="#discord" style={{ color: 'var(--text-muted)' }}>Discord Community</a>
          </div>
        </div>
      </div>

      {/* Render Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            zIndex: 10000,
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
          }}
        >
          {toastMessage}
          <button 
            onClick={() => setToastMessage(null)}
            style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 'bold' }}
          >
            Close
          </button>
        </div>
      )}

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .footer-col-1 {
            grid-column: 1 / -1;
          }
        }
        footer a {
          transition: color var(--transition-fast);
        }
        footer a:hover {
          color: var(--color-primary) !important;
        }
      `}</style>
    </footer>
  );
};

const footerLinkStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  transition: 'color var(--transition-fast)',
};
