import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import { getActiveContract, getActiveConfig, USE_SIMPLE_CONTRACT } from '../config/contractConfig';
import { transformVoteDataForSimpleContract, transformVoteDataForComplexContract } from '../utils/contractDataTransformer';
import './PollResponse.css';

function PollResponse({ poll, onBack, onSubmitResponse }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gaslessInfo, setGaslessInfo] = useState(null);
  const [useGaslessVoting, setUseGaslessVoting] = useState(true);

  // Get active contract service and configuration
  const contractService = getActiveContract();
  const contractConfig = getActiveConfig();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Initialize contract service
    contractService.init(tonConnectUI);
    
    // Load gasless voting information (only for complex contract)
    if (contractConfig.features.hasGaslessVoting) {
      loadGaslessInfo();
    }
  }, [tonConnectUI]);

  const loadGaslessInfo = async () => {
    try {
      if (contractService.getGaslessVotingInfo) {
        const info = await contractService.getGaslessVotingInfo();
        setGaslessInfo(info);
      }
    } catch (error) {
      console.error('Error loading gasless info:', error);
    }
  };

  const handleOptionSelect = (optionIndex) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedOption(optionIndex);
  };

  const handleSubmit = async () => {
    if (selectedOption === null || isSubmitting) return;

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    setIsSubmitting(true);

    try {
      // Prepare vote data based on contract type
      let voteResult;
      // Simple contract voting (no gasless option)
      voteResult = await contractService.voteOnPoll(poll.id, selectedOption);
      console.log(`🗳️ Voting with ${contractConfig.name} (simplified voting)`);
     
      const result = voteResult;
      
      if (result.success) {
        const response = {
          pollId: poll.id,
          selectedOption: selectedOption,
          optionText: poll.options[selectedOption],
          timestamp: new Date().toISOString(),
          transactionHash: result.transactionHash,
          gasless: result.gasless
        };

        const successMessage = result.gasless 
          ? 'Vote submitted successfully (gasless)! No transaction fees charged. You may receive rewards after the poll ends.'
          : 'Vote submitted successfully! You may receive rewards after the poll ends.';
        
        // Show brief success message, then transition to home page
        if (webApp) {
          webApp.showAlert(successMessage);
        } else {
          alert(successMessage);
        }
        
        // Transition to home page after brief delay
        setTimeout(() => {
          if (onSubmitResponse) {
            onSubmitResponse(response);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert(`Failed to submit vote: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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

  if (!poll) {
    return (
      <div className="poll-response-page">
        <div className="error-state">
          <h2>Poll not found</h2>
          <p>The selected poll could not be loaded.</p>
          <button className="back-btn" onClick={handleBack}>
            Back to Polls
          </button>
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
            <span className="poll-author">by {poll.author}</span>
            <span className="poll-time">{poll.createdAt}</span>
          </div>
          
          <div className="poll-question">
            <h2>{poll.title}</h2>
          </div>

          <div className="poll-options">
            {poll.options.map((option, index) => (
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
                  {option}
                </div>
              </div>
            ))}
          </div>

          <div className="poll-stats">
            <span className="vote-count">{poll.totalVotes} votes so far</span>
          </div>

          {gaslessInfo && gaslessInfo.available && poll.gaslessEnabled && (
            <div className="gasless-info">
              <div className="gasless-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={useGaslessVoting}
                    onChange={(e) => setUseGaslessVoting(e.target.checked)}
                  />
                  <span className="toggle-text">
                    🆓 Use gasless voting (recommended)
                  </span>
                </label>
              </div>
              {useGaslessVoting && (
                <div className="gasless-benefits">
                  <div className="benefit-item">
                    <span className="benefit-icon">💰</span>
                    <span className="benefit-text">Save {gaslessInfo.estimatedGasSaved}</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">⚡</span>
                    <span className="benefit-text">{gaslessInfo.benefitMessage}</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">👤</span>
                    <span className="benefit-text">Poll creator enabled gasless voting</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {poll.gaslessEnabled === false && (
            <div className="gasless-unavailable">
              <div className="unavailable-note">
                <span className="note-icon">ℹ️</span>
                <span>Poll creator opted for traditional voting. Transaction fees apply.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="poll-response-actions">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
        <button 
          className={`submit-btn ${selectedOption === null ? 'disabled' : ''} ${isSubmitting ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={selectedOption === null || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading-spinner"></span>
              Submitting...
            </>
          ) : (
            'Submit Vote'
          )}
        </button>
      </div>
    </div>
  );
}

export default PollResponse;