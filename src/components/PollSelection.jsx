import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContract from '../services/tpollsContract';
import './PollSelection.css';

// Mock data for demonstration
const mockPolls = [
  {
    id: 1,
    question: "What's your favorite programming language?",
    options: ["JavaScript", "Python", "Java", "C++"],
    author: "Developer123",
    createdAt: "2 hours ago",
    totalVotes: 42
  },
  {
    id: 2,
    question: "Which framework should we use for our next project?",
    options: ["React", "Vue", "Angular", "Svelte"],
    author: "TeamLead",
    createdAt: "5 hours ago",
    totalVotes: 28
  },
  {
    id: 3,
    question: "What's the best time for team meetings?",
    options: ["Morning (9-11 AM)", "Afternoon (2-4 PM)", "Evening (6-8 PM)"],
    author: "ProjectManager",
    createdAt: "1 day ago",
    totalVotes: 15
  },
  {
    id: 4,
    question: "Which feature should we prioritize next?",
    options: ["Dark mode", "Mobile app", "API improvements", "Better analytics"],
    author: "ProductOwner",
    createdAt: "2 days ago",
    totalVotes: 67
  }
];

function PollSelection({ onBack, onPollSelect }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Initialize contract service
    tpollsContract.init(tonConnectUI);
    loadPolls();
  }, [tonConnectUI]);

  const loadPolls = async () => {
    try {
      setIsLoading(true);
      const activePolls = await tpollsContract.getActivePolls();
      setPolls(activePolls);
    } catch (error) {
      console.error('Error loading polls:', error);
      // Fallback to mock data if contract fails
      setPolls(mockPolls);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePollSelect = (poll) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedPoll(poll);
  };

  const handleRespond = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onPollSelect && selectedPoll) {
      onPollSelect(selectedPoll);
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
      <div className="wallet-info-top">
        <WalletMenu />
      </div>
      
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
        ) : (
          <div className="polls-list">
            {polls.map((poll) => (
            <div 
              key={poll.id} 
              className={`poll-card ${selectedPoll?.id === poll.id ? 'selected' : ''}`}
              onClick={() => handlePollSelect(poll)}
            >
              <div className="poll-card-header">
                <h3 className="poll-question">{poll.question}</h3>
                <div className="poll-meta">
                  <span className="poll-author">by {poll.author}</span>
                  <span className="poll-time">{poll.createdAt}</span>
                </div>
              </div>
              
              <div className="poll-options-preview">
                {poll.options.slice(0, 3).map((option, index) => (
                  <div key={index} className="poll-option-preview">
                    <div className="option-radio-preview"></div>
                    <span className="option-text-preview">{option}</span>
                  </div>
                ))}
                {poll.options.length > 3 && (
                  <div className="more-options">+{poll.options.length - 3} more</div>
                )}
              </div>

              <div className="poll-stats">
                <span className="vote-count">{poll.totalVotes} votes</span>
              </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && polls.length === 0 && (
          <div className="no-polls">
            <div className="no-polls-icon">📊</div>
            <h3>No polls available</h3>
            <p>There are no polls to respond to at the moment.</p>
          </div>
        )}
      </div>

      <div className="poll-selection-actions">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
        <button 
          className={`respond-btn ${!selectedPoll ? 'disabled' : ''}`}
          onClick={handleRespond}
          disabled={!selectedPoll}
        >
          Respond
        </button>
      </div>
    </div>
  );
}

export default PollSelection;