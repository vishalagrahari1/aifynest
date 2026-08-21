/* src/views/Login.tsx */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/shared/SEOHead';

interface LoginProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Login: React.FC<LoginProps> = ({ onToast }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      onToast('Logged in successfully! Welcome back to AIFynest.', 'success');
      navigate('/dashboard');
    } else {
      onToast('Invalid email address or password credentials.', 'error');
    }
  };

  const handleGoogleLogin = () => {
    onToast('Redirecting to Google Login services (mocked)...', 'info');
    setTimeout(async () => {
      // Login with standard John Doe or create new user
      const success = await login('john@gmail.com', 'password123');
      if (success) {
        onToast('Logged in successfully with Google account!', 'success');
        navigate('/dashboard');
      }
    }, 1200);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    onToast('A simulated password reset email has been sent to ' + (email || 'your email address') + '.', 'info');
  };

  const handleQuickLogin = async (role: 'admin' | 'owner' | 'user') => {
    let testEmail = 'john@gmail.com';
    if (role === 'admin') testEmail = 'mevishal1130@gmail.com';
    else if (role === 'owner') testEmail = 'owner@synthesia.io';

    setIsLoading(true);
    const success = await login(testEmail, 'password123');
    setIsLoading(false);

    if (success) {
      onToast(`Logged in successfully as ${role.toUpperCase()}!`, 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="container section" style={{ maxWidth: '440px' }}>
      <SEOHead title="Login to AIFynest" description="Sign in to your AIFynest account to manage listings and reviews." />

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 30px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 6px 0' }}>Welcome back to AIFynest</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: '1.4', margin: 0 }}>
            Sign in to manage your tools, saved lists, reviews, and analytics.
          </p>
        </div>

        {/* Social Login */}
        <button onClick={handleGoogleLogin} className="btn btn-outline w-full" style={socialBtnStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div style={separatorStyle}>
          <span style={{ background: 'var(--bg-card)', padding: '0 10px', color: 'var(--text-muted)' }}>Or continue with email</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <a
                href="#forgot"
                onClick={handleForgotPassword}
                style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary)' }}
              >
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full" style={{ marginTop: '8px', padding: '12px' }}>
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

        {/* Quick Testing login buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Quick fill testing credentials:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <button onClick={() => handleQuickLogin('admin')} className="btn btn-outline btn-sm" style={{ padding: '6px 4px', fontSize: '10px' }}>
              Admin
            </button>
            <button onClick={() => handleQuickLogin('owner')} className="btn btn-outline btn-sm" style={{ padding: '6px 4px', fontSize: '10px' }}>
              Owner
            </button>
            <button onClick={() => handleQuickLogin('user')} className="btn btn-outline btn-sm" style={{ padding: '6px 4px', fontSize: '10px' }}>
              User
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--text-xs)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <Link to="/signup" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

const socialBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  marginBottom: '20px',
};

const separatorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '18px 0',
  position: 'relative',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  width: '100%',
  borderBottom: '1px solid var(--border-color)',
  lineHeight: '0.1em',
};
