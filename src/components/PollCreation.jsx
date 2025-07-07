import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContract from '../services/tpollsContract';
import './PollCreation.css';

function PollCreation({ onBack, onPollCreate }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '']
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleQuestionChange = (e) => {
    setFormData({
      ...formData,
      question: e.target.value
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, '']
      });
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions
      });
    }
  };

  const handleCreate = async () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (!formData.question.trim() || !formData.options.every(opt => opt.trim())) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);

    try {
      const pollData = {
        title: formData.question,
        description: 'Poll created via tPolls miniapp',
        options: formData.options.filter(opt => opt.trim()),
        duration: 86400, // 24 hours
        rewardPerVote: '0.001', // 0.001 TON per vote
        totalFunding: '0.05' // 0.05 TON total funding for testing
      };

      const result = await tpollsContract.createPoll(pollData);
      
      if (result.success) {
        setToastMessage('Poll created successfully!');
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          if (onPollCreate) {
            onPollCreate(result.pollData);
          }
        }, 1500); // Reduced time before redirect
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert(`Failed to create poll: ${error.message}`);
    } finally {
      setIsCreating(false);
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

  const isFormValid = formData.question.trim() && formData.options.every(opt => opt.trim());

  return (
    <div className="poll-creation-page">
      <div className="wallet-info-top">
        <WalletMenu />
      </div>
      
      <div className="poll-creation-header">
        <h1 className="page-title">Creating Polls</h1>
      </div>

      <div className="poll-creation-content">
        <div className="poll-form-section">
          <div className="poll-form">
            <div className="form-group">
              <label htmlFor="question">Poll Question</label>
              <input
                type="text"
                id="question"
                value={formData.question}
                onChange={handleQuestionChange}
                placeholder="Enter your poll question"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Poll Options</label>
              <div className="poll-options-list">
                {formData.options.map((option, index) => (
                  <div key={index} className="poll-option-item">
                    <div className="option-radio">
                      <div className="radio-button"></div>
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="option-input"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="remove-option-btn"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="add-option-btn"
                >
                  + Add Option
                </button>
              )}
            </div>

            <button
              onClick={handleCreate}
              disabled={!isFormValid || isCreating}
              className={`create-poll-btn ${!isFormValid || isCreating ? 'disabled' : ''} ${isCreating ? 'loading' : ''}`}
            >
              {isCreating ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Poll...
                </>
              ) : (
                'Create Poll'
              )}
            </button>
          </div>
        </div>

      </div>

      <div className="poll-creation-actions">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
      </div>

      {showToast && (
        <div className="toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default PollCreation;