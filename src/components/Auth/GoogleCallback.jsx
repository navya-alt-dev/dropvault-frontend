// src/components/Auth/GoogleCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        // Check for OAuth errors
        if (errorParam) {
          console.error('Google OAuth error:', errorParam);
          setStatus('error');
          setError('Google authentication was cancelled or failed');
          toast.error('Google authentication cancelled');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Check if code exists
        if (!code) {
          console.error('No authorization code received');
          setStatus('error');
          setError('No authorization code received from Google');
          toast.error('Authentication failed - no code received');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('📧 Google callback - processing code...');

        // Check if googleLogin function exists
        if (typeof googleLogin !== 'function') {
          console.error('googleLogin is not a function:', googleLogin);
          setStatus('error');
          setError('Authentication system error');
          toast.error('Authentication system error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Call the googleLogin function from AuthContext
        const result = await googleLogin(code);

        if (result.success) {
          console.log('✅ Google login successful');
          setStatus('success');
          toast.success('Welcome to DropVault!');
          
          // Small delay before redirect
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else {
          console.error('Google login failed:', result.error);
          setStatus('error');
          setError(result.error || 'Authentication failed');
          toast.error(result.error || 'Google login failed');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('Google callback error:', err);
        setStatus('error');
        setError(err.message || 'An unexpected error occurred');
        toast.error('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, googleLogin, navigate]);

  return (
    <div className="google-callback-page">
      <style>{`
        .google-callback-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
        }
        
        .callback-container {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        
        .callback-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .callback-icon.processing {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        }
        
        .callback-icon.success {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
        }
        
        .callback-icon.error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .callback-icon svg {
          width: 40px;
          height: 40px;
        }
        
        .callback-icon.success svg {
          stroke: #10b981;
        }
        
        .callback-icon.error svg {
          stroke: #ef4444;
        }
        
        .callback-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        
        .callback-message {
          color: #64748b;
          font-size: 0.9375rem;
        }
        
        .callback-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 0.5rem;
        }
      `}</style>

      <div className="callback-container">
        {/* Processing State */}
        {status === 'processing' && (
          <>
            <div className="callback-icon processing">
              <div className="spinner"></div>
            </div>
            <h2 className="callback-title">Signing you in...</h2>
            <p className="callback-message">Please wait while we complete your Google sign-in.</p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <div className="callback-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="callback-title">Welcome!</h2>
            <p className="callback-message">Redirecting to your dashboard...</p>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div className="callback-icon error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="callback-title">Authentication Failed</h2>
            <p className="callback-message">Redirecting to login page...</p>
            {error && <p className="callback-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;