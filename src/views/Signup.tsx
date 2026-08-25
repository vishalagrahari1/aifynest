import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/shared/SEOHead';

export const Signup: React.FC<{ onToast: (msg: string, type?: 'success' | 'error' | 'info') => void }> = ({ onToast }) => {
  const { signup, updateUserInterests, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'form' | 'onboarding'>('form');
  
  // Registration Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [role, setRole] = useState<'user' | 'owner'>('user');
  const [isLoading, setIsLoading] = useState(false);
  
  // Onboarding Selection States
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  const interestsList = [
    'Writing', 'Marketing', 'Coding', 'Design', 'Video', 'Image Generation',
    'Productivity', 'Business', 'Education', 'Research', 'Sales', 'SEO',
    'Automation', 'Audio'
  ];

  // Helper to calculate password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'var(--border-color)' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'var(--color-danger)' };
    if (score <= 3) return { score, label: 'Medium', color: 'var(--color-gold)' };
    return { score, label: 'Strong', color: 'var(--color-success)' };
  };

  const strength = getPasswordStrength(password);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      onToast('Passwords do not match.', 'error');
      return;
    }
    if (!acceptTerms) {
      onToast('You must accept the Terms of Service and Privacy Policy.', 'error');
      return;
    }

    setIsLoading(true);
    const res = await signup(name, email, password, role);
    setIsLoading(false);

    if (res.success) {
      onToast('Account initialized! Please verify your email.', 'success');
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      onToast(res.error || 'An account with this email address already exists.', 'error');
    }
  };

  const handleToggleInterest = (interest: string) => {
    const normalInterest = interest.toLowerCase();
    if (selectedInterests.includes(normalInterest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== normalInterest));
    } else {
      setSelectedInterests([...selectedInterests, normalInterest]);
    }
  };

  const handleOnboardingComplete = () => {
    if (user) {
      updateUserInterests(user.id, selectedInterests);
    }
    onToast('Onboarding completed! Enjoy AIFynest.', 'success');
    navigate('/dashboard');
  };

  const handleSkipOnboarding = () => {
    onToast('Skipped onboarding. You can update interests in Settings.', 'info');
    navigate('/dashboard');
  };

  const handleGoogleSignup = () => {
    onToast('Redirecting to Google Account services (mocked)...', 'info');
    setTimeout(async () => {
      const mockName = 'Google Explorer';
      const mockEmail = 'explorer_' + Math.floor(Math.random()*1000) + '@gmail.com';
      const res = await signup(mockName, mockEmail, 'google_sso_pass_123', 'user');
      if (res.success) {
        onToast('Successfully signed up with Google Account!', 'success');
        setStep('onboarding');
      } else {
        onToast(res.error || 'Failed to sign up with Google.', 'error');
      }
    }, 1200);
  };

  return (
    <div className="container section" style={{ maxWidth: '520px' }}>
      <SEOHead title="Join AIFynest" description="Create an account on AIFynest to discover, compare, and review AI tools." />

      {step === 'form' && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 6px 0' }}>Join AIFynest</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>
              Discover, save, compare, and review the best AI tools.
            </p>
          </div>

          {/* Social Sign Up */}
          <button onClick={handleGoogleSignup} className="btn btn-outline w-full" style={socialBtnStyle}>
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

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {showPassword ? 'Hide' : 'Show'} Password
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 6 characters"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              {/* Password strength indicator */}
              {password && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', height: '4px', gap: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: strength.score === 0 ? '0%' : strength.score <= 2 ? '33%' : strength.score <= 4 ? '66%' : '100%', backgroundColor: strength.color, transition: 'width var(--transition-fast)' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: strength.color, fontWeight: 'bold', marginTop: '2px', display: 'block' }}>
                    Password strength: {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Role</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="signup-role"
                    checked={role === 'user'}
                    onChange={() => setRole('user')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>Regular Discovery User</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="signup-role"
                    checked={role === 'owner'}
                    onChange={() => setRole('owner')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>AI Tool Owner / Builder</span>
                </label>
              </div>
            </div>

            {/* Terms and conditions acceptance */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                id="accept-terms-check"
              />
              <label htmlFor="accept-terms-check" style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', cursor: 'pointer' }}>
                I accept the <a href="#terms" style={{ color: 'var(--color-primary)' }}>Terms of Service</a> and <a href="#privacy" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>.
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full" style={{ marginTop: '8px', padding: '12px' }}>
              {isLoading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
            <Link to="/login" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
              Log in
            </Link>
          </div>
        </div>
      )}

      {/* Personalization Onboarding Screen */}
      {step === 'onboarding' && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 6px 0' }}>What are you interested in?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>
              Select interests to personalize your AIFynest discovery experience.
            </p>
          </div>

          {/* Grid Selection */}
          <div style={interestsGridStyle}>
            {interestsList.map((interest) => {
              const isSelected = selectedInterests.includes(interest.toLowerCase());
              return (
                <button
                  key={interest}
                  onClick={() => handleToggleInterest(interest)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--bg-primary)',
                    color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: isSelected ? 'var(--font-bold)' : 'var(--font-medium)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'center',
                  }}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={handleSkipOnboarding} className="btn btn-outline flex-1" style={{ justifyContent: 'center' }}>
              Skip for now
            </button>
            <button onClick={handleOnboardingComplete} className="btn btn-primary flex-1" style={{ justifyContent: 'center' }}>
              Save & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '40px 30px',
  boxShadow: 'var(--shadow-md)',
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

const interestsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '10px',
  maxHeight: '300px',
  overflowY: 'auto',
  paddingRight: '6px',
  marginTop: '10px',
};
