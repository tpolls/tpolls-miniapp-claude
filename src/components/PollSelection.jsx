import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContract from '../services/tpollsContract';
import './PollSelection.css';

// Mock data for demonstration
const mockPolls = [
  {
    id: 1,
    title: "What's your favorite programming language?",
    description: "Help us understand which programming language is most popular among developers in our community.",
    options: ["JavaScript", "Python", "Java", "C++"],
    author: "Developer123",
    createdAt: "2 hours ago",
    totalResponses: 42,
    totalRewardFund: "0.5 TON",
    daysRemaining: 3,
    duration: "7 days"
  },
  {
    id: 2,
    title: "Which framework should we use for our next project?",
    description: "We're starting a new frontend project and need to decide on the best framework for our team.",
    options: ["React", "Vue", "Angular", "Svelte"],
    author: "TeamLead",
    createdAt: "5 hours ago",
    totalResponses: 28,
    totalRewardFund: "1.2 TON",
    daysRemaining: 5,
    duration: "7 days"
  },
  {
    id: 3,
    title: "What's the best time for team meetings?",
    description: "Trying to find the optimal meeting time that works for everyone across different time zones.",
    options: ["Morning (9-11 AM)", "Afternoon (2-4 PM)", "Evening (6-8 PM)"],
    author: "ProjectManager",
    createdAt: "1 day ago",
    totalResponses: 15,
    totalRewardFund: "0.3 TON",
    daysRemaining: 1,
    duration: "3 days"
  },
  {
    id: 4,
    title: "Which feature should we prioritize next?",
    description: "Our product roadmap has several exciting features planned. Help us decide which one to tackle first.",
    options: ["Dark mode", "Mobile app", "API improvements", "Better analytics"],
    author: "ProductOwner",
    createdAt: "2 days ago",
    totalResponses: 67,
    totalRewardFund: "2.1 TON",
    daysRemaining: 0,
    duration: "Ended"
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
        ) : (
          <div className="polls-list">
            {polls.map((poll) => (
            <div 
              key={poll.id} 
              className={`poll-card ${selectedPoll?.id === poll.id ? 'selected' : ''}`}
              onClick={() => handlePollSelect(poll)}
            >
              <div className="poll-card-header">
                <h3 className="poll-title">{poll.title}</h3>
                <p className="poll-description">{poll.description}</p>
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
        )}

        {!isLoading && polls.length === 0 && (
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