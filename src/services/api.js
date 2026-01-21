// src/services/api.js - FIXED VERSION
import axios from 'axios';
import toast from 'react-hot-toast';

// ==================== API BASE URL ====================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dropvault-backend.onrender.com';

console.log('🌍 API Base URL:', API_BASE_URL);

// ==================== AXIOS INSTANCE ====================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token && token !== 'session-based-auth' && token !== 'session-based') {
      config.headers.Authorization = `Token ${token}`;
    }
    
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token && token !== 'session-based'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
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
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionid');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup') &&
          !window.location.pathname.includes('/verify')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  // ✅ FIXED: Added /api/ prefix
  login: async (credentials) => {
    console.log('🔐 Attempting login');
    const response = await api.post('/api/login/', credentials);
    
    if (response.data.success) {
      const { token, sessionid, user } = response.data;
      if (token) localStorage.setItem('token', token);
      if (sessionid) localStorage.setItem('sessionid', sessionid);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response;
  },
  
  // ✅ FIXED: Added /api/ prefix
  register: async (userData) => {
    console.log('📝 Attempting registration');
    const response = await api.post('/api/signup/', userData);
    return response;
  },
  
  // ✅ FIXED: Changed from /auth/google/ to /api/auth/google/
  googleLogin: async (code) => {
    console.log('🔐 Google OAuth - calling /api/auth/google/');
    const response = await api.post('/api/auth/google/', { code });
    
    if (response.data.success) {
      const { token, sessionid, user } = response.data;
      if (token) localStorage.setItem('token', token);
      if (sessionid) localStorage.setItem('sessionid', sessionid);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response;
  },
  
  // ✅ FIXED: Added /api/ prefix
  verifyEmail: async (token) => {
    console.log('✉️ Verifying email');
    return api.get(`/api/verify-email-token/?token=${token}`);
  },
  
  // ✅ FIXED: Added /api/ prefix
  resendVerification: async (email) => {
    console.log('📧 Resending verification to:', email);
    return api.post('/api/resend-verification/', { email });
  },
  
  // ✅ FIXED: Added /api/ prefix
  logout: async () => {
    console.log('🚪 Logging out');
    try {
      await api.post('/api/logout/');
    } catch (e) {
      console.log('Logout API failed, clearing local storage');
    }
    localStorage.removeItem('token');
    localStorage.removeItem('sessionid');
    localStorage.removeItem('user');
  },
  
  // ✅ FIXED: Added /api/ prefix
  checkAuth: async () => {
    console.log('🔍 Checking auth');
    return api.get('/api/auth/check/');
  },
  
  // ✅ FIXED: Added /api/ prefix
  getProfile: async () => {
    return api.get('/api/user/');
  },
  
  // ✅ FIXED: Added /api/ prefix
  forgotPassword: async (email) => {
    return api.post('/api/forgot-password/', { email });
  },
  
  // ✅ FIXED: Added /api/ prefix
  resetPassword: async (token, password) => {
    return api.post('/api/reset-password/', { token, password });
  },
};

// ==================== FILE API ====================
export const fileAPI = {
  getAllFiles: () => {
    console.log('📁 Getting all files');
    return api.get('/api/list/');
  },
  
  uploadFile: (formData, onUploadProgress) => {
    console.log('📤 Uploading file');
    return api.post('/api/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
      onUploadProgress,
    });
  },
  
  deleteFile: (fileId) => {
    console.log('🗑️ Deleting file:', fileId);
    return api.delete(`/api/delete/${fileId}/`);
  },
  
  getTrash: () => {
    console.log('🗑️ Getting trash');
    return api.get('/api/trash/');
  },
  
  restoreFile: (fileId) => {
    console.log('♻️ Restoring file:', fileId);
    return api.post(`/api/restore/${fileId}/`);
  },
  
  permanentDelete: (fileId) => {
    return api.delete(`/api/trash/permanent/${fileId}/`);
  },
  
  emptyTrash: () => {
    return api.delete('/api/trash/empty/');
  },
  
  shareFile: (fileId, data) => {
    return api.post(`/api/share/${fileId}/`, data);
  },
  
  shareViaEmail: (fileId, data) => {
    return api.post(`/api/share/${fileId}/email/`, data);
  },
  
  getSharedFiles: () => {
    return api.get('/api/shared/');
  },
  
  downloadFile: async (fileId) => {
    return api.get(`/api/download/${fileId}/`, { responseType: 'blob' });
  },
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: () => {
    console.log('📊 Getting dashboard stats');
    return api.get('/api/dashboard/');
  },
  
  getStorage: () => {
    return api.get('/api/user/storage/');
  },
};

// ==================== NOTIFICATIONS API ====================
export const notificationsAPI = {
  getAll: () => {
    return api.get('/api/notifications/');
  },
  
  markAsRead: (notificationId) => {
    return api.post(`/api/notifications/${notificationId}/read/`);
  },
  
  markAllAsRead: () => {
    return api.post('/api/notifications/read-all/');
  },
  
  delete: (notificationId) => {
    return api.delete(`/api/notifications/${notificationId}/delete/`);
  },
};

// ==================== SETTINGS API ====================
export const settingsAPI = {
  updateProfile: (data) => api.put('/api/user/profile/', data),
  updatePassword: (data) => api.put('/api/user/password/', data),
  getPreferences: () => api.get('/api/user/preferences/'),
  updatePreferences: (data) => api.put('/api/user/preferences/', data),
};

export default api;