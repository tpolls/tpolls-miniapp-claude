import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import tpollsContractSimple from '../services/tpollsContractSimple';
import './ManagePolls.css';

const ManagePolls = ({ onBack }) => {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [polls, setPolls] = useState([]);
  const [userPolls, setUserPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, closed, mine

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    loadPolls();
  }, [tonConnectUI]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize contract service
      await tpollsContractSimple.init(tonConnectUI);
      
      // Get all active polls
      const allPolls = await tpollsContractSimple.getActivePolls();
      setPolls(allPolls);
      
      // Filter polls created by current user
      if (tonConnectUI.account?.address) {
        const currentUserAddress = tonConnectUI.account.address;
        const userCreatedPolls = allPolls.filter(poll => 
          poll.author === currentUserAddress || 
          poll.creator === currentUserAddress ||
          poll.author?.includes(currentUserAddress.slice(0, 6))
        );
        setUserPolls(userCreatedPolls);
      }
      
    } catch (error) {
      console.error('Error loading polls:', error);
      setError(`Failed to load polls: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePollSelect = (poll) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedPoll(poll);
  };

  const handleStatusUpdate = async (pollId, newStatus) => {
    try {
      setUpdatingStatus(true);
      setError(null);
      
      // Note: This is a placeholder for blockchain status update
      // In a real contract, you would call a method like updatePollStatus
      console.log(`Updating poll ${pollId} status to ${newStatus}`);
      
      // For now, we'll simulate the update
      // In a real implementation, you would call:
      // await tpollsContractSimple.updatePollStatus(pollId, newStatus);
      
      // Update local state
      const updatedPolls = polls.map(poll => 
        poll.id === pollId ? { ...poll, status: newStatus, isActive: newStatus === 'active' } : poll
      );
      setPolls(updatedPolls);
      
      const updatedUserPolls = userPolls.map(poll => 
        poll.id === pollId ? { ...poll, status: newStatus, isActive: newStatus === 'active' } : poll
      );
      setUserPolls(updatedUserPolls);
      
      if (selectedPoll?.id === pollId) {
        setSelectedPoll({ ...selectedPoll, status: newStatus, isActive: newStatus === 'active' });
      }
      
      if (webApp) {
        webApp.HapticFeedback.notificationOccurred('success');
      }
      
    } catch (error) {
      console.error('Error updating poll status:', error);
      setError(`Failed to update poll status: ${error.message}`);
      
      if (webApp) {
        webApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    onBack();
  };

  const getFilteredPolls = () => {
    let filtered = [];
    
    switch (filter) {
      case 'mine':
        filtered = userPolls;
        break;
      case 'active':
        filtered = polls.filter(poll => poll.isActive && poll.status !== 'closed');
        break;
      case 'closed':
        filtered = polls.filter(poll => poll.status === 'closed' || !poll.isActive);
        break;
      default:
        filtered = polls;
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'paused': return '#ffc107';
      case 'closed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'paused': return '🟡';
      case 'closed': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="manage-polls-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your polls...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-polls-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Polls</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadPolls}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredPolls = getFilteredPolls();

  return (
    <div className="manage-polls-page">
      <div className="manage-polls-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <h1 className="page-title">Manage Your Polls</h1>
      </div>

      <div className="manage-polls-content">
        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Polls ({polls.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'mine' ? 'active' : ''}`}
            onClick={() => setFilter('mine')}
          >
            My Polls ({userPolls.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-tab ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed
          </button>
        </div>

        {/* Polls List */}
        <div className="polls-list">
          {filteredPolls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Polls Found</h3>
              <p>
                {filter === 'mine' 
                  ? "You haven't created any polls yet."
                  : "No polls found for this filter."
                }
              </p>
            </div>
          ) : (
            filteredPolls.map((poll) => (
              <div 
                key={poll.id} 
                className={`poll-card ${selectedPoll?.id === poll.id ? 'selected' : ''}`}
                onClick={() => handlePollSelect(poll)}
              >
                <div className="poll-card-header">
                  <h3 className="poll-title">{poll.title}</h3>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: getStatusColor(poll.status || (poll.isActive ? 'active' : 'closed')) + '20',
                      color: getStatusColor(poll.status || (poll.isActive ? 'active' : 'closed'))
                    }}
                  >
                    {getStatusIcon(poll.status || (poll.isActive ? 'active' : 'closed'))}
                    {poll.status || (poll.isActive ? 'active' : 'closed')}
                  </span>
                </div>
                
                <div className="poll-info">
                  <div className="poll-info-row">
                    <span className="info-label">ID:</span>
                    <span className="info-value">#{poll.id}</span>
                  </div>
                  <div className="poll-info-row">
                    <span className="info-label">Responses:</span>
                    <span className="info-value">{poll.totalResponses || 0}</span>
                  </div>
                  <div className="poll-info-row">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{poll.createdAt}</span>
                  </div>
                  <div className="poll-info-row">
                    <span className="info-label">Author:</span>
                    <span className="info-value">{poll.author}</span>
                  </div>
                </div>
                
                <div className="poll-options-preview">
                  <span className="options-label">{poll.options?.length || 0} options</span>
                  <div className="options-list">
                    {poll.options?.slice(0, 3).map((option, index) => (
                      <span key={index} className="option-tag">{option}</span>
                    ))}
                    {poll.options?.length > 3 && <span className="option-more">+{poll.options.length - 3} more</span>}
                  </div>
                </div>

                {/* Poll Management Actions */}
                {selectedPoll?.id === poll.id && (
                  <div className="poll-actions">
                    <div className="status-actions">
                      <h4>Change Status</h4>
                      <div className="status-buttons">
                        <button 
                          className="status-btn active"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(poll.id, 'active');
                          }}
                          disabled={updatingStatus}
                        >
                          🟢 Active
                        </button>
                        <button 
                          className="status-btn paused"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(poll.id, 'paused');
                          }}
                          disabled={updatingStatus}
                        >
                          🟡 Paused
                        </button>
                        <button 
                          className="status-btn closed"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(poll.id, 'closed');
                          }}
                          disabled={updatingStatus}
                        >
                          🔴 Closed
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePolls;