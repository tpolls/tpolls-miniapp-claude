import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContractSimple from '../services/tpollsContractSimple';
import './PollResults.css';

function PollResults({ onBack, pollId = null }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [poll, setPoll] = useState(null);
  const [pollResults, setPollResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    tpollsContractSimple.init(tonConnectUI).then(() => {
      if (pollId) {
        loadPollResults(pollId);
      }
    }).catch(error => {
      console.error('Failed to initialize contract:', error);
      setError('Failed to initialize contract');
    });
  }, [tonConnectUI, pollId]);

  const loadPollResults = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load poll details and results
      const pollData = await tpollsContractSimple.getPoll(id);
      const results = await tpollsContractSimple.getPollResults(id);
      console.log('poll results', results)
      
      setPoll(pollData);
      setPollResults(results);
    } catch (error) {
      console.error('Error loading poll results:', error);
      setError(`Failed to load poll results: ${error.message}`);
    } finally {
      setIsLoading(false);
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

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getWinningOption = () => {
    if (!pollResults || !pollResults.options) return null;
    
    let maxVotes = 0;
    let winningOption = null;
    
    pollResults.options.forEach(option => {
      if (option.votes > maxVotes) {
        maxVotes = option.votes;
        winningOption = option;
      }
    });
    
    return winningOption;
  };

  if (!pollId) {
    return (
      <div className="poll-results-page">
        <div className="poll-results-header">
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <h1 className="page-title">Poll Results</h1>
        </div>
        <div className="poll-results-content">
          <div className="no-poll-selected">
            <div className="no-poll-icon">📊</div>
            <h3>No poll selected</h3>
            <p>Please select a poll to view its results.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-results-page">
      <div className="poll-results-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <h1 className="page-title">Poll Results</h1>
      </div>

      <div className="poll-results-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading results...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Failed to load results</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => loadPollResults(pollId)}>
              Retry
            </button>
          </div>
        ) : poll && pollResults ? (
          <div className="results-container">
            <div className="poll-info-card">
              <h2 className="poll-title">{poll.title}</h2>
              <div className="poll-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Votes:</span>
                  <span className="stat-value">{pollResults.totalVotes}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Status:</span>
                  <span className={`stat-value status-${poll.status}`}>
                    {poll.status}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Reward Fund:</span>
                  <span className="stat-value">{poll.totalRewardFund}</span>
                </div>
              </div>
            </div>

            {pollResults.totalVotes > 0 ? (
              <div className="results-visualization">
                <h3>Vote Distribution</h3>
                <div className="options-results">
                  {pollResults.options.map((option, index) => {
                    const percentage = calculatePercentage(option.votes, pollResults.totalVotes);
                    const isWinner = getWinningOption()?.id === option.id;
                    
                    return (
                      <div key={option.id || index} className={`option-result ${isWinner ? 'winner' : ''}`}>
                        <div className="option-header">
                          <span className="option-text">{option.text}</span>
                          <span className="option-percentage">{percentage}%</span>
                          {isWinner && <span className="winner-badge">🏆</span>}
                        </div>
                        <div className="vote-bar-container">
                          <div 
                            className="vote-bar" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="vote-count">{option.votes} votes</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="no-votes">
                <div className="no-votes-icon">🗳️</div>
                <h3>No votes yet</h3>
                <p>This poll hasn't received any votes yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">
            <div className="no-data-icon">📊</div>
            <h3>No data available</h3>
            <p>Unable to load poll data.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PollResults;