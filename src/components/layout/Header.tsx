/* src/components/layout/Header.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Layout } from '../shared/Icons';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { user, logout, isOwner, isAdmin } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Apply theme class to document
  useEffect(() => {
    const savedTheme = localStorage.getItem('ai_theme') as 'light' | 'dark' | null;
    const activeTheme = savedTheme || 'dark';
    setTheme(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ai_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--glass-bg)',
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all var(--transition-normal)',
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        {/* Brand Logo: AI + Fynest (Network/Nest visual icon) */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div
            style={{
              background: 'var(--gradient-brand)',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Unique network/grid icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', gap: '2px' }}>
            <span style={{ color: 'var(--text-primary)' }}>AI</span>
            <span style={{ color: 'var(--color-primary)' }}>Fynest</span>
          </span>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
          className="desktop-nav"
        >
          <Link to="/ai-tools" style={navLinkStyle}>Discover</Link>
          <Link to="/ai-tools" style={navLinkStyle}>Categories</Link>
          <Link to="/trending" style={navLinkStyle}>Trending</Link>
          <Link to="/new" style={navLinkStyle}>New Tools</Link>
          <Link to="/collections" style={navLinkStyle}>Collections</Link>
          <Link to="/compare" style={navLinkStyle}>Compare</Link>
          <Link to="/blog" style={navLinkStyle}>Blog</Link>
        </nav>

        {/* Right Action stack: Outlined Login, Prominent Get Started, Visually distinct Submit Tool */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Selector */}
          <button
            onClick={toggleTheme}
            className="btn-icon theme-btn"
            title="Toggle theme"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          {/* Conditional actions based on auth state */}
          {user ? (
            /* Logged In State */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="desktop-actions">
              {/* If builder/admin role: show quick admin navigation inline as a cohesive group */}
              {(isOwner() || isAdmin()) && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '2px', 
                    marginRight: '8px',
                    padding: '3px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }} 
                  className="builder-links"
                >
                  <Link 
                    to="/dashboard" 
                    className={`builder-tab ${location.pathname === '/dashboard' && !location.search.includes('tab=') ? 'builder-tab-active' : ''}`}
                    style={{ textDecoration: 'none' }}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/dashboard?tab=listings" 
                    className={`builder-tab ${location.search.includes('tab=listings') ? 'builder-tab-active' : ''}`}
                    style={{ textDecoration: 'none' }}
                  >
                    My Tools
                  </Link>
                  <Link 
                    to="/dashboard?tab=analytics" 
                    className={`builder-tab ${location.search.includes('tab=analytics') ? 'builder-tab-active' : ''}`}
                    style={{ textDecoration: 'none' }}
                  >
                    Analytics
                  </Link>
                </div>
              )}

              {/* + Submit Your AI Tool primary CTA */}
              <Link
                to="/submit-tool"
                className="btn btn-primary btn-sm submit-action-btn"
                title="List your AI tool on AIFynest"
                style={{ padding: '8px 16px', gap: '4px' }}
              >
                <span>+ Submit Tool</span>
              </Link>

              {/* Profile Avatar Dropdown */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="btn btn-outline"
                  style={{ gap: '8px', padding: '8px 14px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center' }}
                >
                  <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      width: '190px',
                      backgroundColor: 'var(--bg-card)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '6px',
                      zIndex: 1000,
                    }}
                  >
                    <Link to="/dashboard" className={`dropdown-link ${location.pathname === '/dashboard' && !location.search.includes('tab=') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                      <Layout size={14} style={{ flexShrink: 0 }} />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/dashboard?tab=saved" className={`dropdown-link ${location.search.includes('tab=saved') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                      <User size={14} style={{ flexShrink: 0 }} />
                      <span>Saved Tools</span>
                    </Link>
                    <Link to="/dashboard?tab=reviews" className={`dropdown-link ${location.search.includes('tab=reviews') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                      <User size={14} style={{ flexShrink: 0 }} />
                      <span>My Reviews</span>
                    </Link>
                    {isOwner() && (
                      <Link to="/dashboard?tab=listings" className={`dropdown-link ${location.search.includes('tab=listings') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                        <Layout size={14} style={{ flexShrink: 0 }} />
                        <span>My Tools</span>
                      </Link>
                    )}
                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 6px' }} />
                    <button
                      onClick={handleLogout}
                      className="dropdown-link dropdown-logout"
                      style={{
                        border: 'none',
                        background: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <LogOut size={14} style={{ flexShrink: 0 }} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged Out State */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-actions">
              {/* Outlined Login with icon */}
              <Link to="/login" className="btn btn-outline btn-sm login-header-btn" style={loginBtnStyle}>
                <User size={14} />
                <span>Log in</span>
              </Link>

              {/* Visually prominent Filled Sign Up (Get Started) */}
              <Link to="/signup" className="btn btn-primary btn-sm signup-header-btn" style={signUpBtnStyle}>
                <span>Get Started</span>
              </Link>

              {/* Visually distinct + Submit Your AI Tool business CTA */}
              <Link
                to="/submit-tool"
                className="btn btn-sm submit-action-btn"
                title="List your AI tool on AIFynest"
                style={submitCtaStyle}
              >
                <span>+ Submit Your AI Tool</span>
              </Link>
            </div>
          )}

          {/* Tablet/Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon mobile-menu-btn"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--bg-primary)',
            zIndex: 99,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            borderTop: '1px solid var(--border-color)',
            animation: 'fade-in-overlay 150ms ease-out',
          }}
        >
          {/* Navigation Links */}
          <Link to="/ai-tools" style={mobileNavLinkStyle}>Discover</Link>
          <Link to="/ai-tools" style={mobileNavLinkStyle}>Categories</Link>
          <Link to="/trending" style={mobileNavLinkStyle}>Trending</Link>
          <Link to="/new" style={mobileNavLinkStyle}>New Tools</Link>
          <Link to="/collections" style={mobileNavLinkStyle}>Collections</Link>
          <Link to="/compare" style={mobileNavLinkStyle}>Compare</Link>
          <Link to="/blog" style={mobileNavLinkStyle}>Blog</Link>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

          {/* Mobile Auth Actions */}
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/login" className="btn btn-outline w-full" style={{ padding: '12px', justifyContent: 'center' }}>
                <User size={16} />
                <span>Log in</span>
              </Link>
              <Link to="/signup" className="btn btn-primary w-full" style={{ padding: '12px', justifyContent: 'center' }}>
                <span>Get Started</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/dashboard" style={mobileNavLinkStyle}>Dashboard</Link>
              {isOwner() && <Link to="/dashboard?tab=listings" style={mobileNavLinkStyle}>My Tools</Link>}
              <button
                onClick={handleLogout}
                className="btn btn-outline w-full"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '10px', justifyContent: 'center' }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* Submit Tool - Visually distinct full-width CTA at the bottom of drawer */}
          <Link
            to="/submit-tool"
            className="btn w-full"
            style={{
              marginTop: 'auto',
              padding: '14px',
              justifyContent: 'center',
              background: 'var(--gradient-brand)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-bold)',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center',
            }}
          >
            <span>+ Submit Your AI Tool</span>
          </Link>
        </div>
      )}

      {/* Embedded CSS rules for responsive hiding and hover triggers */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .desktop-actions { display: none !important; }
        }
        
        /* Smooth outlined Login hover transitions */
        .login-header-btn:hover {
          background-color: var(--bg-secondary) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
        }

        /* Nav links hovers */
        .desktop-nav a:hover {
          color: var(--color-primary) !important;
        }

        /* Dropdown Links Layout & Styling */
        .dropdown-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          font-size: var(--text-xs);
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          box-sizing: border-box;
        }

        .dropdown-link svg {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .dropdown-link:hover {
          background-color: var(--bg-tertiary) !important;
          color: var(--color-primary) !important;
        }

        .dropdown-link:hover svg {
          color: var(--color-primary) !important;
        }

        .dropdown-link-active {
          background-color: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
          font-weight: var(--font-bold);
        }

        .dropdown-link-active svg {
          color: var(--color-primary) !important;
        }

        .dropdown-logout {
          color: var(--color-danger) !important;
        }

        .dropdown-logout svg {
          color: var(--color-danger) !important;
          opacity: 0.8;
        }

        .dropdown-logout:hover {
          background-color: rgba(239, 68, 68, 0.08) !important;
          color: var(--color-danger) !important;
        }

        /* Builder Dashboard Tab Group Widget styling */
        .builder-tab {
          font-size: 11px !important;
          font-weight: var(--font-semibold) !important;
          color: var(--text-secondary) !important;
          padding: 6px 12px !important;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
        }

        .builder-tab:hover {
          background-color: rgba(255, 255, 255, 0.06);
          color: var(--text-primary) !important;
        }

        .builder-tab-active {
          background-color: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
          font-weight: var(--font-bold);
        }
      `}</style>
    </header>
  );
};

const navLinkStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--text-secondary)',
  transition: 'color var(--transition-fast)',
  textDecoration: 'none',
};


const mobileNavLinkStyle: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-primary)',
  padding: '8px 0',
  borderBottom: '1px solid var(--border-color)',
  textDecoration: 'none',
};


const loginBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  gap: '6px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
};

const signUpBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  boxShadow: 'var(--shadow-sm)',
};

const submitCtaStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  // Make it distinct: gold or brand-accented gradient outline/fill
  background: 'linear-gradient(135deg, var(--color-gold) 0%, #d97706 100%)',
  color: 'white',
  border: 'none',
  boxShadow: 'var(--shadow-sm)',
};
