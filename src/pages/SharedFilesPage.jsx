// src/pages/SharedFilesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import { fileAPI } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/shared.css';

const SharedFilesPage = () => {
  const [sharedByMe, setSharedByMe] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('byMe');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const fetchSharedFiles = async () => {
    try {
      const response = await fileAPI.getSharedFiles();
      setSharedByMe(response.data.shared_by_me || response.data.shared || []);
      setSharedWithMe(response.data.shared_with_me || []);
    } catch (error) {
      toast.error('Failed to load shared files');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (shareUrl) => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleRevokeAccess = async (shareId) => {
    if (!window.confirm('Revoke access to this file?')) return;
    
    try {
      await fileAPI.revokeShare(shareId);
      toast.success('Access revoked successfully');
      fetchSharedFiles();
    } catch (error) {
      toast.error('Failed to revoke access');
    }
  };

  const getStatusBadge = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffHours = (expiry - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { class: 'expired', text: 'Expired' };
    } else if (diffHours < 24) {
      return { class: 'expiring', text: 'Expiring soon' };
    } else {
      return { class: 'active', text: 'Active' };
    }
  };

  const getPermissionBadge = (permission) => {
    const badges = {
      view: { class: 'view', text: 'View', icon: '👁️' },
      edit: { class: 'edit', text: 'Edit', icon: '✏️' },
      download: { class: 'download', text: 'Download', icon: '⬇️' }
    };
    return badges[permission] || badges.view;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['mp4', 'mov'].includes(ext)) return '🎬';
    return '📄';
  };

  const currentFiles = activeTab === 'byMe' ? sharedByMe : sharedWithMe;

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading shared files...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="shared-page">
        {/* Header */}
        <div className="shared-header">
          <div className="shared-header-content">
            <h1>Shared Files</h1>
            <p className="page-subtitle">Manage files you've shared and files shared with you</p>
          </div>
          <button className="btn-share-new" onClick={() => navigate('/myfiles')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Share a File
          </button>
        </div>

        {/* Stats Cards */}
        <div className="shared-stats">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-number">{sharedByMe.length}</span>
              <span className="stat-label">Shared by You</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-number">{sharedWithMe.length}</span>
              <span className="stat-label">Shared with You</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-number">{sharedByMe.filter(f => getStatusBadge(f.expiry).class === 'active').length}</span>
              <span className="stat-label">Active Links</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="shared-tabs">
          <button 
            className={`shared-tab ${activeTab === 'byMe' ? 'active' : ''}`}
            onClick={() => setActiveTab('byMe')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Shared by You
            <span className="tab-count">{sharedByMe.length}</span>
          </button>
          <button 
            className={`shared-tab ${activeTab === 'withMe' ? 'active' : ''}`}
            onClick={() => setActiveTab('withMe')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Shared with You
            <span className="tab-count">{sharedWithMe.length}</span>
          </button>
        </div>

        {/* Content */}
        <div className="shared-content">
          {currentFiles.length > 0 ? (
            <div className="shared-list">
              {currentFiles.map(file => {
                const status = getStatusBadge(file.expiry);
                const permission = getPermissionBadge(file.permission);
                
                return (
                  <div key={file.id} className="shared-card">
                    <div className="shared-card-left">
                      <div className="shared-file-icon">
                        {getFileIcon(file.filename)}
                      </div>
                      <div className="shared-file-info">
                        <h4 className="shared-file-name">{file.filename}</h4>
                        <div className="shared-file-meta">
                          {activeTab === 'byMe' && file.shared_to && (
                            <span className="shared-to">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {file.shared_to}
                            </span>
                          )}
                          {activeTab === 'withMe' && file.shared_by && (
                            <span className="shared-by">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              From: {file.shared_by}
                            </span>
                          )}
                          <span className="shared-date">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(file.shared_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shared-card-right">
                      <div className="shared-badges">
                        <span className={`badge badge-permission ${permission.class}`}>
                          {permission.icon} {permission.text}
                        </span>
                        <span className={`badge badge-status ${status.class}`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <div className="shared-expiry">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Expires: {formatDate(file.expiry)}
                      </div>
                      
                      <div className="shared-actions">
                        {activeTab === 'byMe' && (
                          <>
                            <button 
                              className="btn-action copy"
                              onClick={() => handleCopyLink(file.share_url)}
                              title="Copy Link"
                            >
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                            <button 
                              className="btn-action revoke"
                              onClick={() => handleRevokeAccess(file.id)}
                              title="Revoke Access"
                            >
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          </>
                        )}
                        {activeTab === 'withMe' && (
                          <button 
                            className="btn-action view"
                            onClick={() => window.open(file.share_url, '_blank')}
                            title="View File"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="shared-empty">
              <div className="empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3>
                {activeTab === 'byMe' 
                  ? "You haven't shared any files yet" 
                  : "No files have been shared with you"}
              </h3>
              <p>
                {activeTab === 'byMe'
                  ? "Share files from My Files to collaborate with others"
                  : "When someone shares a file with you, it will appear here"}
              </p>
              {activeTab === 'byMe' && (
                <button className="btn-go-files" onClick={() => navigate('/myfiles')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Go to My Files
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SharedFilesPage;