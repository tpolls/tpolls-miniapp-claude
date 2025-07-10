import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContract from '../services/tpollsContract';
import './PollFunding.css';

// Mock data for polls seeking funding
const mockFundingPolls = [
  {
    id: 1,
    title: "Should we implement universal basic income in our city?",
    description: "A comprehensive study on the feasibility and impact of UBI implementation at the municipal level.",
    creator: "CityCouncil",
    category: "politics",
    targetFunding: "5.0 TON",
    currentFunding: "2.3 TON",
    fundingProgress: 46,
    backers: 12,
    timeRemaining: "6 days",
    rewardPool: "1.5 TON",
    minContribution: "0.1 TON",
    createdAt: "2 days ago",
    featured: true
  },
  {
    id: 2,
    title: "Best programming framework for startups in 2024?",
    description: "Help determine the most effective development framework for early-stage technology companies.",
    creator: "TechStartups",
    category: "technology",
    targetFunding: "3.0 TON",
    currentFunding: "1.8 TON",
    fundingProgress: 60,
    backers: 8,
    timeRemaining: "4 days",
    rewardPool: "0.8 TON",
    minContribution: "0.05 TON",
    createdAt: "1 day ago",
    featured: false
  },
  {
    id: 3,
    title: "What's the future of remote work post-pandemic?",
    description: "Research into long-term remote work trends and their impact on productivity and work-life balance.",
    creator: "WorkResearch",
    category: "business",
    targetFunding: "8.0 TON",
    currentFunding: "3.2 TON",
    fundingProgress: 40,
    backers: 15,
    timeRemaining: "12 days",
    rewardPool: "2.0 TON",
    minContribution: "0.2 TON",
    createdAt: "5 days ago",
    featured: false
  },
  {
    id: 4,
    title: "Should cryptocurrency be taught in high schools?",
    description: "Educational initiative to assess the need for blockchain and crypto curriculum in secondary education.",
    creator: "EduInnovators",
    category: "education",
    targetFunding: "4.5 TON",
    currentFunding: "4.1 TON",
    fundingProgress: 91,
    backers: 23,
    timeRemaining: "2 days",
    rewardPool: "1.2 TON",
    minContribution: "0.1 TON",
    createdAt: "1 week ago",
    featured: true
  }
];

function PollFunding({ onBack, onPollSelect }) {
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
    tpollsContract.init(tonConnectUI);
    loadFundingPolls();
  }, [tonConnectUI]);

  const loadFundingPolls = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from contract
      // For now, use mock data
      setTimeout(() => {
        setPolls(mockFundingPolls);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading funding polls:', error);
      setPolls(mockFundingPolls);
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
      // In a real implementation, this would call the contract to fund the poll
      console.log(`Funding poll ${selectedPoll.id} with ${fundingAmount} TON`);
      
      // Mock funding transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      onBack();
    }
  };

  const formatProgress = (progress) => {
    return Math.min(progress, 100);
  };

  const getCategoryColor = (category) => {
    const colors = {
      politics: '#FF6B6B',
      technology: '#4ECDC4',
      business: '#45B7D1',
      education: '#96CEB4',
      lifestyle: '#FECA57',
      other: '#A8A8A8'
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