import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContractSimple from '../services/tpollsContractSimple';
import './PollSelection.css';


function PollSelection({ onBack, onPollSelect }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Initialize contract service
    tpollsContractSimple.init(tonConnectUI).then(() => {
      loadPolls();
    }).catch(error => {
      console.error('Failed to initialize contract:', error);
      loadPolls(); // Still try to load with fallback data
    });
  }, [tonConnectUI]);

  const loadPolls = async () => {
    debugger
    try {
      setIsLoading(true);
      setError(null);
      const activePolls = await tpollsContractSimple.getActivePolls();
      setPolls(activePolls);
    } catch (error) {
      console.error('Error loading polls:', error);
      setError(`Failed to load polls: ${error.message}`);
      setPolls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePollSelect = (poll) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedPoll(poll);
    
    // Automatically proceed to poll response
    if (onPollSelect) {
      onPollSelect(poll);
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

  return (
    <div className="poll-selection-page">
      <div className="poll-selection-header">
        <h1 className="page-title">Select a Poll</h1>
        <p className="page-subtitle">Choose a poll to respond to</p>
      </div>

      <div className="poll-selection-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading polls...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Failed to load polls</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={loadPolls}>
              Retry
            </button>
          </div>
        ) : polls.length > 0 ? (
          <div className="polls-list">
            {polls.map((poll) => (
            <div 
              key={poll.id} 
              className={`poll-card ${selectedPoll?.id === poll.id ? 'selected' : ''}`}
              onClick={() => handlePollSelect(poll)}
            >
              <div className="poll-card-header">
                <h3 className="poll-title">{poll.title}</h3>
              </div>
              
              <div className="poll-info">
                <div className="poll-info-row">
                  <span className="info-label">Responses:</span>
                  <span className="info-value">{poll.totalResponses}</span>
                </div>
                <div className="poll-info-row">
                  <span className="info-label">Reward Fund:</span>
                  <span className="info-value">{poll.totalRewardFund}</span>
                </div>
                <div className="poll-info-row">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">
                    {poll.daysRemaining > 0 ? `${poll.daysRemaining} days remaining` : poll.duration}
                  </span>
                </div>
              </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-polls">
            <div className="no-polls-icon">📊</div>
            <h3>No polls available</h3>
            <p>There are no polls to respond to at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PollSelection;