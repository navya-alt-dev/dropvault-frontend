// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';  // ✅ ADD THIS IMPORT

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

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // Verify with backend
        const response = await authAPI.checkAuth();
        
        if (response.data.authenticated) {
          setUser(response.data.user || JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear storage
          clearAuth();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuth();
    } finally {
      setLoading(false);
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
      console.error('Login error:', error);
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
        // Check if verification is required
        if (response.data.requires_verification) {
          return { 
            success: true, 
            requires_verification: true,
            message: response.data.message 
          };
        }
        
        // Direct login (for Google OAuth)
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
      console.error('Register error:', error);
      const errorData = error.response?.data || {};
      
      return { 
        success: false, 
        error: errorData.error || 'Registration failed',
        requires_verification: errorData.requires_verification
      };
    }
  };

  const googleLogin = async (code) => {
    try {
      const response = await authAPI.googleLogin(code);
      
      if (response.data.success) {
        const { token, sessionid, user: userData } = response.data;
        
        if (token) localStorage.setItem('token', token);
        if (sessionid) localStorage.setItem('sessionid', sessionid);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Google login failed' 
      };
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
        
        // Clear pending verification email
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
      console.error('Verify email error:', error);
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
      console.error('Resend verification error:', error);
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