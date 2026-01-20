// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://dropvault-backend.onrender.com';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      verifyAuth(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Add verifyEmail method
  const verifyEmail = async (token) => {
    try {
      const response = await authAPI.verifyEmail(token);
      
      if (response.data.success) {
        // Store auth tokens
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        if (response.data.sessionid) {
          localStorage.setItem('sessionid', response.data.sessionid);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user);
        }
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.data.error,
        expired: response.data.expired,
        email: response.data.email
      };
    } catch (error) {
      console.error('Verify email error:', error);
      const data = error.response?.data || {};
      return { 
        success: false, 
        error: data.error || 'Verification failed',
        expired: data.expired,
        email: data.email
      };
    }
  };

  // Add resendVerification method
  const resendVerification = async (email) => {
    try {
      const response = await authAPI.resendVerification(email);
      return { 
        success: response.data.success, 
        error: response.data.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send email' 
      };
    }
  };

  const verifyAuth = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/check/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      
      const data = await response.json();
      
      if (data.authenticated) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Auth verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.requires_verification) {
          return {
            success: true,
            requires_verification: true,
            email: userData.email,
          };
        } else if (data.token) {
          // Direct login
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          return { success: true };
        }
      }
      
      return {
        success: false,
        error: data.error || 'Registration failed',
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.sessionid) {
          localStorage.setItem('sessionid', data.sessionid);
        }
        return { success: true };
      } else if (response.status === 403 && data.requires_verification) {
        return { 
          success: false, 
          requires_verification: true,
          email: data.email,
          error: data.error || 'Please verify your email first'
        };
      } else {
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  const loginWithGoogle = async (code) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.sessionid) {
          localStorage.setItem('sessionid', data.sessionid);
        }
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Google login failed' 
        };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionid');
    localStorage.removeItem('pendingVerificationEmail');
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      handleLogout();
    }
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    setUser,
    token,
    setToken,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};