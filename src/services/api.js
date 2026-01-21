// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';

import {
  mockAuthAPI,
  mockFileAPI,
  mockDashboardAPI,
  mockSettingsAPI
} from './mockApi';

// ==================== ENVIRONMENT CHECK ====================
const isDevelopment = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

const FORCE_REAL_API = process.env.NODE_ENV === 'production' || 
                        window.location.hostname.includes('onrender.com');

const FINAL_USE_MOCK = FORCE_REAL_API ? false : isDevelopment;

console.log('🌍 Environment Check:');
console.log('  - Hostname:', window.location.hostname);
console.log('  - Is Development:', isDevelopment);
console.log('  - Force Real API:', FORCE_REAL_API);
console.log('  - Using Mock API:', FINAL_USE_MOCK);
console.log('  - API Base URL:', API_BASE_URL);

// ==================== AXIOS INSTANCE ====================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// ==================== SINGLE REQUEST INTERCEPTOR (FIXED) ====================
api.interceptors.request.use(
  (config) => {
    // Get stored credentials
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('sessionid');
    
    // Add Authorization header if we have a valid token
    if (token && token !== 'session-based-auth' && token !== 'session-based') {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Add session ID as backup (now allowed in CORS)
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token && token !== 'session-based',
      hasSessionId: !!sessionId
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      success: response.data?.success
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing auth');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionid');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 - Email verification required
    if (error.response?.status === 403) {
      const data = error.response.data;
      if (data?.requires_verification) {
        console.log('📧 Email verification required');
        // Store email for verification page
        if (data.email) {
          localStorage.setItem('pending_verification_email', data.email);
        }
        window.location.href = '/verify-pending';
      }
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = FINAL_USE_MOCK ? mockAuthAPI : {
  login: async (credentials) => {
    console.log('🔐 Attempting login to:', `${API_BASE_URL}/login/`);
    const response = await api.post('/login/', credentials);
    
    if (response.data.success) {
      const { token, sessionid, user } = response.data;
      if (token) localStorage.setItem('token', token);
      if (sessionid) localStorage.setItem('sessionid', sessionid);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ Login successful, stored auth tokens');
    }
    
    return response;
  },
  
  register: async (userData) => {
    console.log('📝 Attempting registration to:', `${API_BASE_URL}/signup/`);
    const response = await api.post('/signup/', userData);
    
    // Don't store tokens yet - wait for email verification
    if (response.data.requires_verification) {
      console.log('📧 Registration successful - verification required');
      localStorage.setItem('pending_verification_email', userData.email);
    } else if (response.data.success && response.data.token) {
      // Only store if no verification required (shouldn't happen for email signup)
      const { token, sessionid, user } = response.data;
      if (token) localStorage.setItem('token', token);
      if (sessionid) localStorage.setItem('sessionid', sessionid);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response;
  },
  
  googleLogin: async (code) => {
    console.log('🔐 Google OAuth with code');
    const response = await api.post('/auth/google/', { code });
    
    if (response.data.success) {
      const { token, sessionid, user } = response.data;
      if (token) localStorage.setItem('token', token);
      if (sessionid) localStorage.setItem('sessionid', sessionid);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response;
  },

  verifyEmail: async (token) => {
    console.log('✉️ Verifying email with token');
    return api.get(`/verify-email-token/?token=${token}`);
  },

  resendVerification: async (email) => {
    console.log('📧 Resending verification to:', email);
    return api.post('/resend-verification/', { email });
  },

  logout: async () => {
    console.log('🚪 Logging out');
    try {
      await api.post('/logout/');
    } catch (e) {
      console.log('Logout API call failed, clearing local storage anyway');
    }
    localStorage.removeItem('token');
    localStorage.removeItem('sessionid');
    localStorage.removeItem('user');
    localStorage.removeItem('pending_verification_email');
  },
  
  getProfile: () => {
    console.log('👤 Getting profile');
    return api.get('/user/');
  },
  
  checkAuth: () => {
    console.log('🔍 Checking auth status');
    return api.get('/auth/check/');
  },
  
  forgotPassword: (email) => {
    return api.post('/forgot-password/', { email });
  },
  
  resetPassword: (token, password) => {
    return api.post('/reset-password/', { token, password });
  },
  
  setPassword: (password, confirmPassword) => {
    return api.post('/set-password/', { password, confirm_password: confirmPassword });
  },
};

// ==================== FILE API ====================
export const fileAPI = FINAL_USE_MOCK ? mockFileAPI : {
  getAllFiles: () => {
    console.log('📁 Getting all files');
    return api.get('/list/');
  },
  
  uploadFile: (formData, onUploadProgress) => {
    console.log('📤 Uploading file');
    return api.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 minutes for uploads
      onUploadProgress,
    });
  },
  
  deleteFile: (fileId) => {
    console.log('🗑️ Deleting file:', fileId);
    return api.delete(`/delete/${fileId}/`);
  },
  
  getTrash: () => {
    console.log('🗑️ Getting trash');
    return api.get('/trash/');
  },
  
  restoreFile: (fileId) => {
    console.log('♻️ Restoring file:', fileId);
    return api.post(`/restore/${fileId}/`);
  },
  
  permanentDelete: (fileId) => {
    console.log('🔥 Permanently deleting:', fileId);
    return api.delete(`/trash/permanent/${fileId}/`);
  },
  
  emptyTrash: () => {
    console.log('🗑️ Emptying trash');
    return api.delete('/trash/empty/');
  },
  
  shareFile: (fileId, data) => {
    console.log('🔗 Sharing file:', fileId);
    return api.post(`/share/${fileId}/`, data);
  },
  
  shareViaEmail: (fileId, data) => {
    console.log('📧 Sharing via email:', fileId);
    return api.post(`/share/${fileId}/email/`, data);
  },
  
  getSharedFiles: () => {
    console.log('🔗 Getting shared files');
    return api.get('/shared/');
  },
  
  downloadFile: async (fileId) => {
    console.log('⬇️ Downloading file:', fileId);
    return api.get(`/download/${fileId}/`, { responseType: 'blob' });
  },
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = FINAL_USE_MOCK ? mockDashboardAPI : {
  getStats: () => {
    console.log('📊 Getting dashboard stats');
    return api.get('/dashboard/');
  },
  
  getStorage: () => {
    console.log('💾 Getting storage info');
    return api.get('/user/storage/');
  },
};

// ==================== NOTIFICATIONS API ====================
export const notificationsAPI = {
  getAll: () => {
    console.log('🔔 Getting notifications');
    return api.get('/notifications/');
  },
  
  markAsRead: (notificationId) => {
    return api.post(`/notifications/${notificationId}/read/`);
  },
  
  markAllAsRead: () => {
    return api.post('/notifications/read-all/');
  },
  
  delete: (notificationId) => {
    return api.delete(`/notifications/${notificationId}/delete/`);
  },
};

// ==================== SETTINGS API ====================
export const settingsAPI = FINAL_USE_MOCK ? mockSettingsAPI : {
  updateProfile: (data) => api.put('/user/profile/', data),
  updatePassword: (data) => api.put('/user/password/', data),
  getPreferences: () => api.get('/user/preferences/'),
  updatePreferences: (data) => api.put('/user/preferences/', data),
};

export default api;