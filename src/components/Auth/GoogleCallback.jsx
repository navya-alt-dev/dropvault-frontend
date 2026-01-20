// src/components/Auth/GoogleCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google login was cancelled');
      navigate('/login');
      return;
    }

    if (code) {
      handleGoogleLogin(code);
    } else {
      toast.error('No authorization code received');
      navigate('/login');
    }
  }, [searchParams]);

  const handleGoogleLogin = async (code) => {
    setStatus('Signing you in...');
    
    try {
      const result = await loginWithGoogle(code);
      
      if (result.success) {
        toast.success('Welcome to DropVault!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Google login failed');
        navigate('/login');
      }
    } catch (error) {
      console.error('Google callback error:', error);
      toast.error('Authentication failed. Please try again.');
      navigate('/login');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '3rem',
        borderRadius: '1rem',
        textAlign: 'center'
      }}>
        <div className="verify-spinner" style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem'
        }}></div>
        <h2 style={{ marginBottom: '0.5rem' }}>{status}</h2>
        <p style={{ opacity: 0.8 }}>Please wait...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleCallback;