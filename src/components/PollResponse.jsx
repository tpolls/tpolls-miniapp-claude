import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContract from '../services/tpollsContract';
import './PollResponse.css';

function PollResponse({ poll, onBack, onSubmitResponse }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Initialize contract service
    tpollsContract.init(tonConnectUI);
  }, [tonConnectUI]);

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
      const result = await tpollsContract.voteOnPoll(poll.id, selectedOption);
      
      if (result.success) {
        const response = {
          pollId: poll.id,
          selectedOption: selectedOption,
          optionText: poll.options[selectedOption],
          timestamp: new Date().toISOString(),
          transactionHash: result.transactionHash
        };

        alert('Vote submitted successfully! You may receive rewards after the poll ends.');
        
        if (onSubmitResponse) {
          onSubmitResponse(response);
        }
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
        <div className="wallet-info-top">
          <WalletMenu />
        </div>
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
      <div className="wallet-info-top">
        <WalletMenu />
      </div>
      
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
            <h2>{poll.question}</h2>
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