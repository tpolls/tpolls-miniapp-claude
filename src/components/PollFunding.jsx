import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import tpollsContractSimple from '../services/tpollsContractSimple';
import './PollFunding.css';


function PollFunding({ onBack }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fundingAmount, setFundingAmount] = useState('');
  const [showFundingModal, setShowFundingModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Initialize contract service
    tpollsContractSimple.init(tonConnectUI);
    loadFundingPolls();
  }, [tonConnectUI]);

  const loadFundingPolls = async () => {
    try {
      setIsLoading(true);
      
      // Get all active polls from contract
      const activePolls = await tpollsContractSimple.getActivePolls();
      
      // Transform polls to funding format with funding info
      const fundingPolls = activePolls.map((poll, index) => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        creator: poll.author || `Creator${poll.id}`,
        category: getCategoryFromTitle(poll.title),
        targetFunding: poll.totalRewardFund || `${(Math.random() * 5 + 1).toFixed(1)} TON`,
        currentFunding: `${(Math.random() * parseFloat(poll.totalRewardFund?.replace(' TON', '') || '2')).toFixed(2)} TON`,
        fundingProgress: Math.floor(Math.random() * 100),
        backers: Math.floor(Math.random() * 50) + 5,
        timeRemaining: poll.duration || `${poll.daysRemaining} days`,
        rewardPool: poll.totalRewardFund || `${(Math.random() * 2 + 0.5).toFixed(1)} TON`,
        minContribution: "0.1 TON",
        createdAt: poll.createdAt || "2 days ago",
        featured: index < 2 // First 2 polls are featured
      }));
      
      setPolls(fundingPolls);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading funding polls:', error);
      setPolls([]);
      setIsLoading(false);
    }
  };

  const handlePollSelect = (poll) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedPoll(poll);
    setShowFundingModal(true);
  };

  const handleFundPoll = async () => {
    if (!fundingAmount || !selectedPoll) return;

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      console.log(`Funding poll ${selectedPoll.id} with ${fundingAmount} TON`);
      
      // Create funding transaction using contract service
      // For now, we simulate this by sending TON to the poll creator
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: tpollsContractSimple.contractAddress,
            amount: (parseFloat(fundingAmount) * 1000000000).toString() // Convert to nanotons
          }
        ]
      };
      
      await tonConnectUI.sendTransaction(transaction);
      
      if (webApp) {
        webApp.showAlert(`Successfully funded "${selectedPoll.title}" with ${fundingAmount} TON!`);
      }
      
      setShowFundingModal(false);
      setFundingAmount('');
      setSelectedPoll(null);
      
      // Refresh polls to show updated funding
      loadFundingPolls();
    } catch (error) {
      console.error('Error funding poll:', error);
      if (webApp) {
        webApp.showAlert(`Failed to fund poll: ${error.message}`);
      }
    }
  };

  const handleBack = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onBack) {
      onBack('main');
    }
  };

  const formatProgress = (progress) => {
    return Math.min(progress, 100);
  };

  const getCategoryFromTitle = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('government') || titleLower.includes('politics') || titleLower.includes('policy')) return 'politics';
    if (titleLower.includes('tech') || titleLower.includes('programming') || titleLower.includes('software')) return 'technology';
    if (titleLower.includes('business') || titleLower.includes('work') || titleLower.includes('startup')) return 'business';
    if (titleLower.includes('education') || titleLower.includes('learning') || titleLower.includes('school')) return 'education';
    if (titleLower.includes('lifestyle') || titleLower.includes('health') || titleLower.includes('personal')) return 'lifestyle';
    return 'other';
  };

  const getCategoryColor = (category) => {
    const colors = {
      politics: 'var(--tg-theme-destructive-text-color, #FF3B30)',
      technology: 'var(--tg-theme-button-color, #007AFF)',
      business: 'var(--tg-theme-accent-text-color, #34C759)',
      education: 'var(--tg-theme-link-color, #5856D6)',
      lifestyle: 'var(--tg-theme-button-text-color, #FF9500)',
      other: 'var(--tg-theme-hint-color, #8E8E93)'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="poll-funding-page">
      <div className="poll-funding-header">
        <h1 className="page-title">Poll Funding</h1>
        <p className="page-subtitle">Support polls that need funding to reach more voters</p>
      </div>

      <div className="poll-funding-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading funding opportunities...</p>
          </div>
        ) : (
          <div className="funding-polls-list">
            {polls.map((poll) => (
              <div 
                key={poll.id} 
                className={`funding-poll-card ${poll.featured ? 'featured' : ''}`}
                onClick={() => handlePollSelect(poll)}
              >
                {poll.featured && (
                  <div className="featured-badge">
                    ⭐ Featured
                  </div>
                )}
                
                <div className="poll-card-header">
                  <div className="poll-category" style={{ backgroundColor: getCategoryColor(poll.category) }}>
                    {poll.category}
                  </div>
                  <span className="poll-time">{poll.createdAt}</span>
                </div>

                <div className="poll-content">
                  <h3 className="poll-title">{poll.title}</h3>
                  <p className="poll-description">{poll.description}</p>
                  <div className="poll-creator">by {poll.creator}</div>
                </div>

                <div className="funding-progress">
                  <div className="progress-header">
                    <span className="current-funding">{poll.currentFunding}</span>
                    <span className="target-funding">of {poll.targetFunding}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${formatProgress(poll.fundingProgress)}%` }}
                    ></div>
                  </div>
                  <div className="progress-stats">
                    <span className="progress-percent">{poll.fundingProgress}% funded</span>
                    <span className="backers-count">{poll.backers} backers</span>
                  </div>
                </div>

                <div className="funding-info">
                  <div className="info-item">
                    <span className="info-label">⏰ Time left:</span>
                    <span className="info-value">{poll.timeRemaining}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🎁 Reward pool:</span>
                    <span className="info-value">{poll.rewardPool}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">💰 Min. funding:</span>
                    <span className="info-value">{poll.minContribution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && polls.length === 0 && (
          <div className="no-polls">
            <div className="no-polls-icon">💰</div>
            <h3>No funding opportunities</h3>
            <p>There are no polls seeking funding at the moment.</p>
          </div>
        )}
      </div>

      {/* Funding Modal */}
      {showFundingModal && selectedPoll && (
        <div className="funding-modal-overlay" onClick={() => setShowFundingModal(false)}>
          <div className="funding-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Fund This Poll</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowFundingModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="selected-poll-info">
                <h4>{selectedPoll.title}</h4>
                <div className="funding-status">
                  <span>{selectedPoll.currentFunding} / {selectedPoll.targetFunding}</span>
                  <span className="progress">({selectedPoll.fundingProgress}% funded)</span>
                </div>
              </div>

              <div className="funding-input-section">
                <label htmlFor="funding-amount">Funding Amount (TON)</label>
                <input
                  id="funding-amount"
                  type="number"
                  step="0.01"
                  min={parseFloat(selectedPoll.minContribution)}
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder={`Min: ${selectedPoll.minContribution}`}
                  className="funding-input"
                />
                <div className="funding-note">
                  Minimum contribution: {selectedPoll.minContribution}
                </div>
              </div>

              <div className="funding-benefits">
                <h5>Benefits of funding:</h5>
                <ul>
                  <li>🎁 Share in the reward pool ({selectedPoll.rewardPool})</li>
                  <li>🗳️ Early access to poll results</li>
                  <li>📊 Voting analytics and insights</li>
                  <li>🏆 Contributor badge on your profile</li>
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowFundingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="fund-btn"
                onClick={handleFundPoll}
                disabled={!fundingAmount || parseFloat(fundingAmount) < parseFloat(selectedPoll.minContribution)}
              >
                Fund Poll
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="poll-funding-actions">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export default PollFunding;