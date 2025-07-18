import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContractSimple from '../services/tpollsContractSimple';
import './PollAdministration.css';

// Mock data for development - replace with actual contract calls
const mockUserPolls = [
  {
    id: 1,
    title: "What's your favorite programming language?",
    description: "Help us understand the preferences of our developer community",
    category: "technology",
    status: "active",
    totalResponses: 156,
    totalFunding: "2.5 TON",
    targetFunding: "5.0 TON",
    fundingProgress: 50,
    duration: "5 days left",
    rewardPool: "1.2 TON",
    createdAt: "3 days ago",
    gaslessEnabled: true,
    options: ["JavaScript", "Python", "Rust", "Go", "TypeScript"]
  },
  {
    id: 2,
    title: "Best time for team meetings?",
    description: "Finding the optimal meeting time for our distributed team",
    category: "business",
    status: "funding",
    totalResponses: 0,
    totalFunding: "0.8 TON",
    targetFunding: "3.0 TON",
    fundingProgress: 27,
    duration: "Not started",
    rewardPool: "0.5 TON",
    createdAt: "1 week ago",
    gaslessEnabled: false,
    options: ["9 AM UTC", "2 PM UTC", "6 PM UTC", "Flexible"]
  }
];

function PollAdministration({ onBack, onPollSelect }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Initialize contract service
    tpollsContractSimple.init(tonConnectUI);
    loadUserPolls();
  }, [tonConnectUI]);

  const loadUserPolls = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch user's polls from contract
      // For now, use mock data
      setTimeout(() => {
        setPolls(mockUserPolls);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading user polls:', error);
      setPolls(mockUserPolls);
      setIsLoading(false);
    }
  };

  const handleStatusChange = (poll) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedPoll(poll);
    setNewStatus(poll.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedPoll || !newStatus) return;

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      // In a real implementation, this would call the contract to update poll status
      console.log(`Updating poll ${selectedPoll.id} status from ${selectedPoll.status} to ${newStatus}`);
      
      // Mock status update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      setPolls(prevPolls => 
        prevPolls.map(poll => 
          poll.id === selectedPoll.id 
            ? { ...poll, status: newStatus }
            : poll
        )
      );
      
      if (webApp) {
        webApp.showAlert(`Poll status updated to "${newStatus}" successfully!`);
      }
      
      setShowStatusModal(false);
      setSelectedPoll(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating poll status:', error);
      if (webApp) {
        webApp.showAlert(`Failed to update poll status: ${error.message}`);
      }
    }
  };

  const handleBack = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onBack) {
      onBack();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#FF9500',
      funding: '#007AFF',
      active: '#34C759',
      closed: '#8E8E93'
    };
    return colors[status] || colors.new;
  };

  const getStatusIcon = (status) => {
    const icons = {
      new: '🆕',
      funding: '💰',
      active: '✅',
      closed: '🔒'
    };
    return icons[status] || icons.new;
  };

  const getAvailableStatusTransitions = (currentStatus) => {
    const transitions = {
      new: ['funding', 'active', 'closed'],
      funding: ['active', 'closed'],
      active: ['closed'],
      closed: [] // No transitions allowed from closed
    };
    return transitions[currentStatus] || [];
  };

  const filteredPolls = filterStatus === 'all' 
    ? polls 
    : polls.filter(poll => poll.status === filterStatus);

  const getStatusDescription = (status) => {
    const descriptions = {
      new: 'Draft poll, not yet published',
      funding: 'Seeking funding from community',
      active: 'Currently accepting responses',
      closed: 'Poll ended, results available'
    };
    return descriptions[status] || '';
  };

  return (
    <div className="poll-admin-page">
      <div className="poll-admin-header">
        <h1 className="page-title">My Polls</h1>
        <p className="page-subtitle">Manage and administer your created polls</p>
      </div>

      <div className="poll-admin-filters">
        <div className="filter-buttons">
          {['all', 'new', 'funding', 'active', 'closed'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? '📊 All' : `${getStatusIcon(status)} ${status.charAt(0).toUpperCase() + status.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      <div className="poll-admin-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your polls...</p>
          </div>
        ) : (
          <div className="admin-polls-list">
            {filteredPolls.map((poll) => (
              <div key={poll.id} className={`admin-poll-card status-${poll.status}`}>
                <div className="poll-card-header">
                  <div className="poll-status-badge" style={{ backgroundColor: getStatusColor(poll.status) }}>
                    {getStatusIcon(poll.status)} {poll.status.toUpperCase()}
                  </div>
                  <span className="poll-time">{poll.createdAt}</span>
                </div>

                <div className="poll-content">
                  <h3 className="poll-title">{poll.title}</h3>
                  <p className="poll-description">{poll.description}</p>
                  <div className="poll-category">Category: {poll.category}</div>
                </div>

                <div className="poll-stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">📊 Responses</span>
                    <span className="stat-value">{poll.totalResponses}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">💰 Funding</span>
                    <span className="stat-value">{poll.totalFunding}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">⏰ Duration</span>
                    <span className="stat-value">{poll.duration}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">🎁 Rewards</span>
                    <span className="stat-value">{poll.rewardPool}</span>
                  </div>
                </div>

                {poll.status === 'funding' && (
                  <div className="funding-progress">
                    <div className="progress-header">
                      <span>Funding Progress</span>
                      <span>{poll.fundingProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${poll.fundingProgress}%` }}
                      ></div>
                    </div>
                    <div className="funding-amounts">
                      <span>{poll.totalFunding} / {poll.targetFunding}</span>
                    </div>
                  </div>
                )}

                <div className="poll-options-preview">
                  <div className="options-header">Poll Options:</div>
                  <div className="options-list">
                    {poll.options.slice(0, 3).map((option, index) => (
                      <span key={index} className="option-tag">
                        {option}
                      </span>
                    ))}
                    {poll.options.length > 3 && (
                      <span className="more-options">+{poll.options.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="poll-actions">
                  <div className="poll-features">
                    {poll.gaslessEnabled && (
                      <span className="feature-tag">⚡ Gasless</span>
                    )}
                  </div>
                  
                  {getAvailableStatusTransitions(poll.status).length > 0 ? (
                    <button 
                      className="status-change-btn"
                      onClick={() => handleStatusChange(poll)}
                    >
                      Change Status
                    </button>
                  ) : (
                    <span className="status-final">Final Status</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredPolls.length === 0 && (
          <div className="no-polls">
            <div className="no-polls-icon">📊</div>
            <h3>No polls found</h3>
            <p>
              {filterStatus === 'all' 
                ? "You haven't created any polls yet." 
                : `No polls with status "${filterStatus}".`}
            </p>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedPoll && (
        <div className="status-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Poll Status</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowStatusModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="selected-poll-info">
                <h4>{selectedPoll.title}</h4>
                <div className="current-status">
                  Current status: 
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedPoll.status) }}>
                    {getStatusIcon(selectedPoll.status)} {selectedPoll.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="status-selection">
                <label>Select new status:</label>
                <div className="status-options">
                  {getAvailableStatusTransitions(selectedPoll.status).map(status => (
                    <button
                      key={status}
                      className={`status-option ${newStatus === status ? 'selected' : ''}`}
                      onClick={() => setNewStatus(status)}
                      style={{ borderColor: getStatusColor(status) }}
                    >
                      <div className="status-option-icon" style={{ color: getStatusColor(status) }}>
                        {getStatusIcon(status)}
                      </div>
                      <div className="status-option-content">
                        <div className="status-option-name">{status.toUpperCase()}</div>
                        <div className="status-option-desc">{getStatusDescription(status)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {newStatus && newStatus !== selectedPoll.status && (
                <div className="status-change-info">
                  <h5>What happens when you change to "{newStatus}":</h5>
                  <ul>
                    {newStatus === 'funding' && (
                      <>
                        <li>📢 Poll will be listed in funding marketplace</li>
                        <li>💰 Users can contribute to poll funding</li>
                        <li>⏳ Voting starts when funding target is reached</li>
                      </>
                    )}
                    {newStatus === 'active' && (
                      <>
                        <li>🗳️ Poll becomes available for voting</li>
                        <li>📊 Responses will be collected and tracked</li>
                        <li>🎁 Reward distribution begins after poll ends</li>
                      </>
                    )}
                    {newStatus === 'closed' && (
                      <>
                        <li>🔒 Poll stops accepting new responses</li>
                        <li>📈 Final results are calculated and published</li>
                        <li>💰 Rewards are distributed to participants</li>
                        <li>⚠️ This action cannot be undone</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button 
                className="update-btn"
                onClick={handleUpdateStatus}
                disabled={!newStatus || newStatus === selectedPoll.status}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="poll-admin-actions">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export default PollAdministration;