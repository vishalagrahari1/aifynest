/* src/views/VerifyEmail.tsx */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { SEOHead } from '../components/shared/SEOHead';

interface VerifyEmailProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ onToast }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read email from query parameters or fallback to logged in user email
  const initialEmail = searchParams.get('email') || user?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Changing email typo
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(initialEmail);

  // Sync state if search parameter or user context changes
  useEffect(() => {
    const currentEmail = searchParams.get('email') || user?.email || '';
    if (currentEmail && currentEmail !== email) {
      setEmail(currentEmail);
      setNewEmail(currentEmail);
    }
  }, [searchParams, user]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      onToast('Verification code must be exactly 6 digits.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'signup',
      });

      if (error) {
        // Fallback check if it was generated under email type
        console.warn('Signup verify failed, trying magiclink/email type fallback...', error.message);
        const fallbackRes = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otp.trim(),
          type: 'email',
        });

        if (fallbackRes.error) {
          onToast(fallbackRes.error.message || 'Verification failed. Incorrect or expired code.', 'error');
          setIsVerifying(false);
          return;
        }
      }

      onToast('Email verified successfully! Welcome aboard.', 'success');
      
      // Explicitly trigger session refresh to ensure email_confirmed_at is fetched
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Force session refresh
        await supabase.auth.refreshSession();
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'An unexpected error occurred during verification.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        onToast(error.message, 'error');
      } else {
        onToast('Verification code resent successfully! Please check your inbox.', 'success');
        setCooldown(60); // 60-second cooldown timer
      }
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Failed to resend verification code.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail.trim() === email.trim()) {
      setIsChangingEmail(false);
      return;
    }

    if (user) {
      // User is logged in: update email on auth user object
      setIsVerifying(true);
      try {
        const { error } = await supabase.auth.updateUser({
          email: newEmail.trim(),
        });

        if (error) {
          onToast(error.message, 'error');
        } else {
          onToast('Email updated successfully! A verification code has been sent to ' + newEmail, 'success');
          setEmail(newEmail);
          setSearchParams({ email: newEmail });
          setIsChangingEmail(false);
          setCooldown(60);
        }
      } catch (err: any) {
        console.error(err);
        onToast(err.message || 'Failed to update email address.', 'error');
      } finally {
        setIsVerifying(false);
      }
    } else {
      // User is not logged in: redirect to signup with pre-filled corrected email
      onToast('Redirecting to sign up with corrected email...', 'info');
      navigate(`/signup?email=${encodeURIComponent(newEmail.trim())}`);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: '440px' }}>
      <SEOHead title="Verify Email" description="Confirm your email verification code to activate your account." />

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
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>✉️</div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 8px 0' }}>Verify Your Email</h2>
          
          {!isChangingEmail ? (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                We sent a 6-digit confirmation code to:
              </p>
              <div 
                style={{ 
                  display: 'inline-block',
                  padding: '6px 14px', 
                  borderRadius: 'var(--radius-full)', 
                  backgroundColor: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  fontWeight: 'bold',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary)',
                  marginBottom: '14px',
                  wordBreak: 'break-all'
                }}
              >
                {email || 'your registered email'}
              </div>
              <div>
                <button
                  onClick={() => setIsChangingEmail(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Change email / Correct typo
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdateEmail} style={{ marginTop: '12px' }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <input
                  type="email"
                  required
                  placeholder="Correct email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="form-input"
                  style={{ fontSize: 'var(--text-xs)', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsChangingEmail(false)}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  {user ? 'Update Email' : 'Signup Again'}
                </button>
              </div>
            </form>
          )}
        </div>

        {!isChangingEmail && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '8px',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isVerifying || otp.length !== 6} 
              className="btn btn-primary w-full" 
              style={{ padding: '12px', justifyContent: 'center' }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="btn btn-outline w-full"
              style={{ padding: '12px', justifyContent: 'center' }}
            >
              {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--text-xs)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Want to try another account? </span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/login');
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontWeight: 'bold', 
              color: 'var(--color-primary)', 
              cursor: 'pointer',
              padding: 0
            }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};
