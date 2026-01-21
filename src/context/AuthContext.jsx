// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // ✅ Refs to prevent duplicate API calls
  const googleLoginInProgressRef = useRef(false);
  const authCheckInProgressRef = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Prevent duplicate auth checks
    if (authCheckInProgressRef.current) {
      return;
    }
    authCheckInProgressRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        setIsAuthenticated(false);
        setLoading(false);
        authCheckInProgressRef.current = false;
        return;
      }
      
      const response = await authAPI.checkAuth();
      
      if (response.data.authenticated) {
        const userData = response.data.user || JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      
      const status = error.response?.status;
      const errorType = error.response?.data?.error;
      
      if (status === 401) {
        clearAuth();
      } else if (status === 403 && errorType === 'password_reset_required') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.is_google_user || userData.signup_method === 'google') {
              console.log('Google user detected - allowing through');
              setUser(userData);
              setIsAuthenticated(true);
              setLoading(false);
              authCheckInProgressRef.current = false;
              return;
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
        clearAuth();
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } catch (e) {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      }
    } finally {
      setLoading(false);
      authCheckInProgressRef.current = false;
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionid');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingVerificationEmail');
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.data.success) {
        const { token, sessionid, user: userData } = response.data;
        
        if (token) localStorage.setItem('token', token);
        if (sessionid) localStorage.setItem('sessionid', sessionid);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.data.error,
        requires_verification: response.data.requires_verification,
        email: response.data.email
      };
    } catch (error) {
      const errorData = error.response?.data || {};
      return { 
        success: false, 
        error: errorData.error || 'Login failed',
        requires_verification: errorData.requires_verification,
        email: errorData.email
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.data.success) {
        if (response.data.requires_verification) {
          return { 
            success: true, 
            requires_verification: true,
            message: response.data.message 
          };
        }
        
        const { token, sessionid, user: newUser } = response.data;
        
        if (token) localStorage.setItem('token', token);
        if (sessionid) localStorage.setItem('sessionid', sessionid);
        if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.data.error,
        requires_verification: response.data.requires_verification
      };
    } catch (error) {
      const errorData = error.response?.data || {};
      return { 
        success: false, 
        error: errorData.error || 'Registration failed',
        requires_verification: errorData.requires_verification
      };
    }
  };

  // ✅ FIXED: Prevent duplicate Google login calls
  const googleLogin = async (code) => {
    // Prevent duplicate calls
    if (googleLoginInProgressRef.current) {
      console.log('⚠️ Google login already in progress, skipping duplicate call');
      return { success: false, error: 'Login already in progress' };
    }
    
    googleLoginInProgressRef.current = true;
    
    try {
      console.log('🔐 AuthContext: Calling googleLogin API');
      const response = await authAPI.googleLogin(code);
      
      if (response.data.success) {
        const { token, sessionid, user: userData } = response.data;
        
        if (token) localStorage.setItem('token', token);
        if (sessionid) localStorage.setItem('sessionid', sessionid);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Google login successful in AuthContext');
        return { success: true };
      }
      
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('❌ Google login error in AuthContext:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Google login failed' 
      };
    } finally {
      // Reset after a short delay to allow for legitimate retries
      setTimeout(() => {
        googleLoginInProgressRef.current = false;
      }, 2000);
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await authAPI.verifyEmail(token);
      
      if (response.data.success) {
        const { token: authToken, sessionid, user: userData } = response.data;
        
        if (authToken) localStorage.setItem('token', authToken);
        if (sessionid) localStorage.setItem('sessionid', sessionid);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
        
        localStorage.removeItem('pendingVerificationEmail');
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.data.error,
        expired: response.data.expired,
        email: response.data.email
      };
    } catch (error) {
      const errorData = error.response?.data || {};
      return { 
        success: false, 
        error: errorData.error || 'Verification failed',
        expired: errorData.expired,
        email: errorData.email
      };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await authAPI.resendVerification(email);
      return { 
        success: response.data.success, 
        message: response.data.message,
        error: response.data.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send email' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    googleLogin,
    verifyEmail,
    resendVerification,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;