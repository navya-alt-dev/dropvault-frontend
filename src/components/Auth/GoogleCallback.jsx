// src/components/Auth/GoogleCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://dropvault-backend.onrender.com';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('Google callback received');
    console.log('Code:', code ? 'Present' : 'Missing');
    console.log('Error:', error);

    if (error) {
      console.error('Google OAuth error:', error);
      toast.error('Google login was cancelled or failed');
      navigate('/login');
      return;
    }

    if (code) {
      handleGoogleLogin(code);
    } else {
      toast.error('No authorization code received');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const handleGoogleLogin = async (code) => {
    setStatus('Signing you in...');
    
    try {
      console.log('Sending code to backend...');
      
      const response = await fetch(`${API_URL}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success) {
        // Store auth data
        localStorage.setItem('token', data.token);
        if (data.sessionid) {
          localStorage.setItem('sessionid', data.sessionid);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        }
        setToken(data.token);
        
        toast.success('Welcome to DropVault!');
        navigate('/dashboard');
      } else {
        console.error('Google login failed:', data.error);
        toast.error(data.error || 'Google login failed');
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
        <div style={{
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