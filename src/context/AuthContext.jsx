// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://dropvault-backend.onrender.com';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
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
      // Verify token is still valid
      verifyAuth(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

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

  // ==================== REGISTER ====================
  const register = async (userData) => {
    try {
      console.log('📝 Registering user:', userData.email);
      
      const response = await authAPI.register(userData);
      
      console.log('📝 Registration response:', response.data);
      
      if (response.data.success) {
        if (response.data.requires_verification) {
          // Email verification required
          return {
            success: true,
            requires_verification: true,
            email: userData.email,
            message: response.data.message
          };
        } else if (response.data.token) {
          // Direct login (Google OAuth)
          setUser(response.data.user);
          setIsAuthenticated(true);
          return {
            success: true,
            requires_verification: false
          };
        }
      }
      
      return {
        success: false,
        error: response.data.error || 'Registration failed'
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  // ==================== LOGIN ====================
  const login = async (credentials) => {
    try {
      console.log('🔐 Logging in:', credentials.email);
      
      const response = await fetch(`${API_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Successful login
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.sessionid) {
          localStorage.setItem('sessionid', data.sessionid);
        }
        return { success: true };
      } else if (response.status === 403 && data.requires_verification) {
        // Email not verified
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

  // ==================== GOOGLE LOGIN ==================== 
  // ✅ FIXED: Named as 'googleLogin' to match GoogleCallback.jsx
  const googleLogin = async (code) => {
    try {
      console.log('🔐 Google login with code');
      
      const response = await fetch(`${API_URL}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Google login successful');
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.sessionid) {
          localStorage.setItem('sessionid', data.sessionid);
        }
        return { success: true };
      } else {
        console.error('❌ Google login failed:', data.error);
        return { 
          success: false, 
          error: data.error || 'Google login failed' 
        };
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  // ==================== VERIFY EMAIL ====================
  const verifyEmail = async (verificationToken) => {
    try {
      console.log('✉️ Verifying email with token');
      
      const response = await fetch(`${API_URL}/api/verify-email-token/?token=${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Email verified, log user in
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.sessionid) {
          localStorage.setItem('sessionid', data.sessionid);
        }
        localStorage.removeItem('pendingVerificationEmail');
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Verification failed',
          expired: data.expired,
          email: data.email
        };
      }
    } catch (error) {
      console.error('Verify email error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  // ==================== RESEND VERIFICATION ====================
  const resendVerification = async (email) => {
    try {
      console.log('📧 Resending verification to:', email);
      const response = await authAPI.resendVerification(email);
      return response.data;
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to resend verification email'
      };
    }
  };
  // ==================== LOGOUT ====================
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

  // Compute isAuthenticated from token and user
  const isAuthenticated = !!token && !!user;

  // ✅ IMPORTANT: All functions must be in the value object
  const value = {
    user,
    setUser,
    token,
    setToken,
    loading,
    isAuthenticated,
    // Auth functions
    login,
    register,
    googleLogin,        // ✅ This is what GoogleCallback uses
    loginWithGoogle: googleLogin,  // ✅ Alias for backward compatibility
    verifyEmail,
    resendVerification,
    logout,
  };

  // Debug log
  console.log('🔧 AuthContext loaded:', {
    hasUser: !!user,
    hasToken: !!token,
    isAuthenticated,
    functions: Object.keys(value).filter(k => typeof value[k] === 'function')
  });

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      register,
      logout,
      checkAuth,
      resendVerification,
    }}>
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

export default AuthContext;