/* src/components/layout/Footer.tsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InstagramIcon, PinterestIcon, XIcon, GitHubIcon, FacebookIcon } from '../shared/Icons';


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
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/logo.png"
                alt="AIFynest"
                style={{
                  height: '30px',
                  width: 'auto',
                  maxHeight: '30px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
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
            <Link to="/about" style={footerLinkStyle}>About AIFynest</Link>
            <Link to="/contact" style={footerLinkStyle}>Contact & Support</Link>
            <Link to="/terms" style={footerLinkStyle}>Terms & Conditions</Link>
            <Link to="/privacy" style={footerLinkStyle}>Privacy Policy</Link>
            <Link to="/refund-policy" style={footerLinkStyle}>Refund Policy</Link>
            <Link to="/disclosure" style={footerLinkStyle}>Ad Disclosure</Link>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '30px 0' }} />

        {/* Bottom copyright alignment */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }} className="footer-bottom">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} AIFynest. All rights reserved.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <a
              href="https://x.com/aifynest"
              target="_blank"
              rel="noopener noreferrer"
              title="AIFynest on X (Twitter)"
              aria-label="AIFynest on X"
              style={socialLinkStyle}
              className="social-footer-icon"
            >
              <XIcon size={16} />
            </a>
            <a
              href="https://www.instagram.com/aifynest/"
              target="_blank"
              rel="noopener noreferrer"
              title="AIFynest on Instagram"
              aria-label="AIFynest on Instagram"
              style={socialLinkStyle}
              className="social-footer-icon"
            >
              <InstagramIcon size={17} />
            </a>
            <a
              href="https://in.pinterest.com/aifynest/"
              target="_blank"
              rel="noopener noreferrer"
              title="AIFynest on Pinterest"
              aria-label="AIFynest on Pinterest"
              style={socialLinkStyle}
              className="social-footer-icon"
            >
              <PinterestIcon size={17} />
            </a>
            <a
              href="https://github.com/aifynest"
              target="_blank"
              rel="noopener noreferrer"
              title="AIFynest on GitHub"
              aria-label="AIFynest on GitHub"
              style={socialLinkStyle}
              className="social-footer-icon"
            >
              <GitHubIcon size={17} />
            </a>
            <a
              href="https://www.facebook.com/aifynes"
              target="_blank"
              rel="noopener noreferrer"
              title="AIFynest on Facebook"
              aria-label="AIFynest on Facebook"
              style={socialLinkStyle}
              className="social-footer-icon"
            >
              <FacebookIcon size={17} />
            </a>
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
        .social-footer-icon:hover {
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
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

const socialLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
};
