import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContractSimple from '../services/tpollsContractSimple';
import { useToast } from '../contexts/ToastContext';
import './PollResponse.css';
import './PollResults.css';

const StandAlonePollResponse = ({ pollId, onBack, onSubmitResponse }) => {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const { showSuccess, showError } = useToast();
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollData, setPollData] = useState(null);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Load poll data from the chain
    loadPoll();
  }, [pollId, tonConnectUI]);

  const loadPoll = async () => {
    if (!pollId) {
      setError('No poll ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Initialize contract service
      await tpollsContractSimple.init(tonConnectUI);
      
      // Get the specific poll by ID
      const poll = await tpollsContractSimple.getPoll(pollId);
      console.log('Loaded poll:', poll);
      
      if (poll) {
        setPollData(poll);
      } else {
        setError('Poll not found');
      }
    } catch (error) {
      console.error('Error loading poll:', error);
      setError(`Failed to load poll: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPollResults = async () => {
    try {
      setResultsLoading(true);
      
      // Load poll details and results
      const results = await tpollsContractSimple.getPollResults(pollId);
      console.log('poll results', results);
      
      setPollResults(results);
    } catch (error) {
      console.error('Error loading poll results:', error);
      showError(`Failed to load poll results: ${error.message}`);
    } finally {
      setResultsLoading(false);
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

  const handleCloseResults = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setShowResults(false);
  };

  const handleOptionSelect = (optionIndex) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedOption(optionIndex);
  };

  const handleSubmit = async () => {
    if (selectedOption === null) {
      showError('Please select an option');
      return;
    }

    if (!tonConnectUI.account) {
      showError('Please connect your wallet to vote');
      return;
    }

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      // Submit vote to the contract
      const result = await tpollsContractSimple.voteOnPoll(pollId, selectedOption);
      
      if (result.success) {
        const response = {
          pollId: pollId,
          selectedOption: selectedOption,
          optionText: pollData.options[selectedOption],
          timestamp: new Date().toISOString(),
          transactionHash: result.transactionHash
        };

        showSuccess('Vote submitted successfully!');
        
        // Show results modal instead of external navigation
        setShowResults(true);
        loadPollResults();
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      showError(`Failed to submit vote: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="poll-response-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="poll-response-page">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!pollData) {
    return (
      <div className="poll-response-page">
        <div className="error-state">
          <h2>Poll not found</h2>
          <p>The requested poll could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-response-page">
      <div className="poll-response-header">
        <h1 className="page-title">Respond to Poll</h1>
      </div>

      <div className="poll-response-content">
        <div className="poll-card">
          <div className="poll-meta">
            <span className="poll-author">by {pollData.author || 'Unknown'}</span>
            <span className="poll-time">{pollData.createdAt || new Date(pollData.created).toLocaleDateString()}</span>
          </div>
          
          <div className="poll-question">
            <h2>{pollData.title}</h2>
          </div>

          {pollData.description && (
            <div className="poll-description">
              <p>{pollData.description}</p>
            </div>
          )}

          <div className="poll-options">
            {pollData.options.map((option, index) => (
              <div 
                key={index}
                className={`poll-option ${selectedOption === index ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(index)}
              >
                <div className="option-radio">
                  <div className={`radio-circle ${selectedOption === index ? 'checked' : ''}`}>
                    {selectedOption === index && <div className="radio-dot"></div>}
                  </div>
                </div>
                <div className="option-text">
                  {typeof option === 'string' ? option : option.text}
                </div>
              </div>
            ))}
          </div>

          <div className="poll-stats">
            <span className="vote-count">{pollData.totalVotes || 0} votes so far</span>
          </div>

          {!tonConnectUI.account && (
            <div className="wallet-notice">
              Connect your wallet to vote
            </div>
          )}
        </div>
      </div>

      <div className="poll-response-actions">
        <button 
          className={`submit-btn ${selectedOption === null || !tonConnectUI.account ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={selectedOption === null || !tonConnectUI.account}
        >
          Submit Vote
        </button>
        
        <button
          className="view-results-btn"
          onClick={() => {
            loadPollResults();
            setShowResults(true);
          }}
        >
          📊 View Results
        </button>
      </div>

      {/* Results Modal */}
      {showResults && (
        <div className="modal-overlay" onClick={handleCloseResults}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Poll Results</h2>
              <button className="modal-close" onClick={handleCloseResults}>×</button>
            </div>
            
            <div className="modal-body">
              {resultsLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading results...</p>
                </div>
              ) : pollResults ? (
                <div className="results-container">
                  <div className="poll-info-card">
                    <h3 className="poll-title">{pollData.title}</h3>
                    <div className="poll-stats">
                      <div className="stat-item">
                        <span className="stat-label">Total Votes:</span>
                        <span className="stat-value">{pollResults.totalVotes}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Status:</span>
                        <span className={`stat-value status-${pollData.status}`}>
                          {pollData.status}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Reward Fund:</span>
                        <span className="stat-value">{pollData.totalRewardFund}</span>
                      </div>
                    </div>
                  </div>

                  {pollResults.totalVotes > 0 ? (
                    <div className="results-visualization">
                      <h4>Vote Distribution</h4>
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
                      <h4>No votes yet</h4>
                      <p>This poll hasn't received any votes yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="error-state">
                  <div className="error-icon">⚠️</div>
                  <p>Unable to load results</p>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="modal-close-btn" onClick={handleCloseResults}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandAlonePollResponse;