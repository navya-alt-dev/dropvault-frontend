// src/App.jsx - COMBINED VERSION
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// ==================== IMPORT PAGES ====================
// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyPendingPage from './pages/VerifyPendingPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import MyFilesPage from './pages/MyFilesPage';
import UploadPage from './pages/UploadPage';
import SharedPage from './pages/SharedPage';
import SettingsPage from './pages/SettingsPage';
import TrashPage from './pages/TrashPage';

// Auth Components
import GoogleCallback from './components/Auth/GoogleCallback';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Environment variables (works with both Vite and CRA)
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || 
                         process.env?.REACT_APP_GOOGLE_CLIENT_ID || 
                         '';

const API_URL = import.meta.env?.VITE_API_URL || 
                process.env?.REACT_APP_API_URL || 
                'https://dropvault-backend.onrender.com';

function App() {
  useEffect(() => {
    console.log('🚀 DropVault Starting...');
    console.log('   API URL:', API_URL);
    console.log('   Google Client ID:', GOOGLE_CLIENT_ID ? 'Configured' : 'Not Set');
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                borderRadius: '0.75rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                duration: 5000,
              },
            }}
          />
          
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<SignupPage />} /> {/* Alias for signup */}
            <Route path="/verify-pending" element={<VerifyPendingPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/google-callback" element={<GoogleCallback />} />
            
            {/* ==================== PROTECTED ROUTES WITH LAYOUT ==================== */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/myfiles" element={<MyFilesPage />} />
              <Route path="/shared" element={<SharedPage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            
            {/* ==================== FALLBACK ==================== */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;