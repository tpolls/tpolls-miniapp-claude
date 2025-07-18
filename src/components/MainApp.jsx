import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { clearUserHistory } from '../utils/userHistory';
import WalletMenu from './WalletMenu';
import { getActiveContract, getActiveConfig, USE_SIMPLE_CONTRACT } from '../config/contractConfig';
import { transformPollForUI } from '../utils/contractDataTransformer';

function MainApp({ isConnected, onLogout, onRerunGettingStarted, onPollSelect }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [featuredPolls, setFeaturedPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('Friend');
  const [userStats, setUserStats] = useState({
    pollsVoted: 0,
    rewardsEarned: '0',
    pollsCreated: 0
  });

  // Get active contract service
  const contractService = getActiveContract();
  const contractConfig = getActiveConfig();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
      
      // Get Telegram user info
      const user = tg.initDataUnsafe?.user;
      if (user) {
        const displayName = user.first_name || user.username || 'Friend';
        setUserName(displayName);
      }
    }

    // Initialize contract and load data
    loadFeaturedPolls();
    loadUserStats();
  }, []);

  useEffect(() => {
    if (tonConnectUI) {
      // Initialize active contract service asynchronously
      contractService.init(tonConnectUI).then(() => {
        console.log(`✅ ${contractConfig.name} contract initialized`);
        // Reload polls after contract is initialized
        loadFeaturedPolls();
      }).catch(error => {
        console.error(`Failed to initialize ${contractConfig.name} contract:`, error);
        // Still load featured polls with fallback data
        loadFeaturedPolls();
      });
    }
  }, [tonConnectUI, contractService, contractConfig]);

  const loadFeaturedPolls = async () => {
    try {
      setIsLoading(true);
      const polls = await contractService.getActivePolls();
      
      // Transform poll data using the universal transformer
      const contractType = USE_SIMPLE_CONTRACT ? 'simple' : 'complex';
      const transformedPolls = polls.map(poll => transformPollForUI(poll, contractType));
      
      // Get first 2 polls for featured section
      setFeaturedPolls(transformedPolls.slice(0, 2));
      
      console.log(`✅ Loaded ${transformedPolls.length} polls from ${contractConfig.name} contract`);
    } catch (error) {
      console.error(`Error loading featured polls from ${contractConfig.name}:`, error);
      // Fallback to empty array if contract fails
      setFeaturedPolls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // In a real implementation, you'd fetch user stats from the contract
      // For now, using mock data
      const userAddress = tonConnectUI?.account?.address;
      if (userAddress) {
        // This would be contract calls to get user statistics
        setUserStats({
          pollsVoted: 15,
          rewardsEarned: '$10',
          pollsCreated: 2
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleCreatePoll = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    // Navigation handled by bottom navigation
  };

  const handleBrowsePolls = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    // Navigation handled by bottom navigation
  };

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
    if (onLogout) {
      onLogout();
    }
  };

  const handleClearHistory = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    
    if (window.confirm('Are you sure you want to clear your user history? This will reset your onboarding status.')) {
      clearUserHistory();
      alert('User history cleared successfully!');
      
      // Optionally disconnect and restart onboarding
      handleDisconnect();
    }
  };

  const handleRerunGettingStarted = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (onRerunGettingStarted) {
      onRerunGettingStarted();
    }
  };

  const handleVoteClick = (poll) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    
    if (onPollSelect) {
      onPollSelect(poll);
    }
  };

  const handleFeaturedPollClick = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    // Navigate to poll selection page to see all polls
    if (window.handleBottomNavigation) {
      window.handleBottomNavigation('poll-selection');
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="main-app">
        <div className="home-container">
          {/* Header */}
          <div className="home-header">
            <h1 className="app-title">tPolls</h1>
            <div className="user-greeting">
              <span className="greeting-text">Welcome to tPolls</span>
              <span className="greeting-emoji">👋</span>
            </div>
          </div>

          {/* Wallet Connection Section */}
          <div className="wallet-connection-section">
            <div className="connection-card">
              <div className="connection-icon">🔗</div>
              <h2>Connect Your Wallet</h2>
              <p>Connect your TON wallet to start creating and voting on polls</p>
              <div className="ton-connect-wrapper">
                <TonConnectButton />
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="features-preview">
            <h3>What you can do with tPolls:</h3>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Create and manage polls</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🗳️</span>
                <span>Vote on community polls</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Earn rewards for participation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Gasless voting options</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-app">
      <div className="home-container">
        {/* Header */}
        <div className="home-header">
          <h1 className="app-title">tPolls</h1>
          <div className="user-greeting">
            <span className="greeting-text">Hi {userName}</span>
            <span className="greeting-emoji">👋</span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Polls Voted</div>
            <div className="stat-value">{userStats.pollsVoted}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rewards Earned</div>
            <div className="stat-value">{userStats.rewardsEarned}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Polls Created</div>
            <div className="stat-value">{userStats.pollsCreated}</div>
          </div>
        </div>

        {/* Progress & Rewards */}
        <div className="progress-section">
          <h3 className="section-title">Progress & Rewards</h3>
          <div className="level-card">
            <div className="level-info">
              <span className="level-text">Level 4</span>
              <span className="level-percentage">86%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '86%'}}></div>
            </div>
          </div>
          <div className="rewards-badges">
            <div className="badge gold active">🥇</div>
            <div className="badge silver active">🥈</div>
            <div className="badge bronze inactive">🥉</div>
            <div className="badge diamond active">💎</div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="actions-section">
          <h3 className="section-title">Recommended Actions</h3>
          <div className="action-item" onClick={handleFeaturedPollClick}>
            <span className="action-text">Vote on today's featured poll &gt;</span>
          </div>
        </div>

        {/* Community Highlights */}
        <div className="community-section">
          <h3 className="section-title">Community Highlights</h3>
          <div className="community-subtitle">Explore the most popular surveys</div>
          
          {isLoading ? (
            <div className="loading-polls">
              <div className="poll-preview">
                <div className="poll-question">Loading polls...</div>
                <button className="vote-btn" disabled>Vote</button>
              </div>
            </div>
          ) : featuredPolls.length > 0 ? (
            featuredPolls.map((poll) => (
              <div key={poll.id} className="poll-preview">
                <div className="poll-question">{poll.title}</div>
                <button 
                  className="vote-btn"
                  onClick={() => handleVoteClick(poll)}
                >
                  Vote
                </button>
              </div>
            ))
          ) : (
            <div className="no-polls">
              <div className="poll-preview">
                <div className="poll-question">No active polls available</div>
                <button className="vote-btn" disabled>Vote</button>
              </div>
            </div>
          )}
        </div>

        {/* Debug Section - Hidden in production */}
        <div className="debug-section" style={{display: 'none'}}>
          <button 
            className="action-btn secondary small"
            onClick={handleRerunGettingStarted}
          >
            <span className="btn-icon">🔄</span>
            Re-run Getting Started
          </button>
          
          <button 
            className="action-btn danger small"
            onClick={handleClearHistory}
          >
            <span className="btn-icon">🗑️</span>
            Clear History (Debug)
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainApp;