// src/pages/VerifyEmailPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../styles/auth.css';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link - no token provided');
        return;
      }

      try {
        const result = await verifyEmail(token);
        
        if (result.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          toast.success('Email verified! Redirecting to dashboard...');
          
          // Clear pending verification email
          localStorage.removeItem('pendingVerificationEmail');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          if (result.expired) {
            setStatus('expired');
            setEmail(result.email || '');
          } else {
            setStatus('error');
          }
          setMessage(result.error || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verify();
  }, [searchParams, navigate, verifyEmail]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Please sign up again to get a new verification email');
      navigate('/signup');
      return;
    }
    
    localStorage.setItem('pendingVerificationEmail', email);
    navigate('/verify-pending', { state: { email } });
  };

  return (
    <div className="auth-page">
      {/* Background Effects */}
      <div className="auth-bg">
        <div className="auth-bg-shape auth-bg-shape-1"></div>
        <div className="auth-bg-shape auth-bg-shape-2"></div>
        <div className="auth-bg-shape auth-bg-shape-3"></div>
      </div>

      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <Link to="/" className="auth-logo">
              <div className="auth-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span>DropVault</span>
            </Link>
            
            <h1 className="auth-branding-title">
              {status === 'success' ? 'Welcome!' : 'Email Verification'}
            </h1>
            
            <p className="auth-branding-text">
              {status === 'success' 
                ? 'Your account is ready to use.' 
                : 'Verifying your email address...'}
            </p>
          </div>
        </div>

        {/* Right Side - Verification Status */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            
            {/* Verifying State */}
            {status === 'verifying' && (
              <>
                <div className="verify-icon-container">
                  <div className="verify-icon verify-icon-loading">
                    <span className="verify-spinner"></span>
                  </div>
                </div>
                <div className="auth-form-header">
                  <h2>Verifying your email...</h2>
                  <p>Please wait while we verify your email address.</p>
                </div>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <div className="verify-icon-container">
                  <div className="verify-icon verify-icon-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="auth-form-header">
                  <h2>Email Verified!</h2>
                  <p>{message}</p>
                </div>
                <div className="verify-redirect-text">
                  <span className="verify-spinner-small"></span>
                  Redirecting to dashboard...
                </div>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="verify-icon-container">
                  <div className="verify-icon verify-icon-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="auth-form-header">
                  <h2>Verification Failed</h2>
                  <p>{message}</p>
                </div>
                <Link to="/signup" className="auth-submit-btn">
                  Try signing up again
                </Link>
                <p className="auth-footer-text">
                  Already have an account?{' '}
                  <Link to="/login" className="auth-link">Sign in</Link>
                </p>
              </>
            )}

            {/* Expired State */}
            {status === 'expired' && (
              <>
                <div className="verify-icon-container">
                  <div className="verify-icon verify-icon-expired">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="auth-form-header">
                  <h2>Link Expired</h2>
                  <p>{message}</p>
                </div>
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={handleResend}
                >
                  Send new verification email
                </button>
                <p className="auth-footer-text">
                  <Link to="/login" className="auth-link">Back to login</Link>
                </p>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;