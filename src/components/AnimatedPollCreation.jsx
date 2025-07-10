import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import Lottie from 'lottie-react';
import WalletMenu from './WalletMenu';
import tpollsContract from '../services/tpollsContract';
import creatorAnimation from '../assets/creator.json';
import './PollCreation.css';
import './AnimatedPollCreation.css';

function AnimatedPollCreation({ onBack, onPollCreate }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    subject: '',
    description: '',
    category: '',
    votingPeriod: 24, // hours
    
    // Step 2: Options
    options: ['', ''],
    
    // Step 3: Configuration
    fundingSource: 'self-funded', // 'self-funded' or 'crowdfunded'
    openImmediately: true,
    rewardDistribution: 'equal-share', // 'equal-share' or 'fixed'
    enableGaslessResponses: true // Enable gasless voting for responses
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [characterState, setCharacterState] = useState('idle'); // 'idle', 'thinking', 'excited', 'working'

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

  // Update character state based on form interactions
  useEffect(() => {
    if (isCreating) {
      setCharacterState('working');
    } else if (currentStep === 3) {
      setCharacterState('excited');
    } else if (formData.subject || formData.description) {
      setCharacterState('thinking');
    } else {
      setCharacterState('idle');
    }
  }, [currentStep, formData.subject, formData.description, isCreating]);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
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

  const handleNext = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateFees = () => {
    const baseFunding = 0.05; // Base funding amount
    const baseAdminFee = 0.05; // 5% base administration fee
    const gaslessAdminFee = 0.01; // Additional 1% for gasless responses
    
    const adminFeeRate = formData.enableGaslessResponses 
      ? baseAdminFee + gaslessAdminFee // 6% total for gasless
      : baseAdminFee; // 5% for regular
    
    const adminFeeAmount = baseFunding * adminFeeRate;
    const totalCost = baseFunding + adminFeeAmount + 0.01; // +0.01 for gas
    
    return {
      baseFunding,
      adminFeeRate: adminFeeRate * 100, // Convert to percentage
      adminFeeAmount,
      totalCost,
      gaslessEnabled: formData.enableGaslessResponses
    };
  };

  const handleCreate = async () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (!formData.subject.trim() || !formData.options.every(opt => opt.trim())) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);

    try {
      const feeCalculation = calculateFees();
      
      const pollData = {
        title: formData.subject,
        description: formData.description || 'Poll created via tPolls miniapp',
        options: formData.options.filter(opt => opt.trim()),
        duration: formData.votingPeriod * 3600, // Convert hours to seconds
        rewardPerVote: '0.001', // 0.001 TON per vote
        totalFunding: feeCalculation.totalCost.toFixed(3), // Use calculated total cost
        category: formData.category,
        fundingSource: formData.fundingSource,
        openImmediately: formData.openImmediately,
        rewardDistribution: formData.rewardDistribution,
        enableGaslessResponses: formData.enableGaslessResponses,
        feeBreakdown: feeCalculation
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

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.subject.trim() && formData.description.trim() && formData.category.trim();
      case 2:
        return formData.options.every(opt => opt.trim()) && formData.options.length >= 2;
      case 3:
        return true; // All fields have defaults
      default:
        return false;
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Poll Options';
      case 3: return 'Poll Configuration';
      default: return 'Creating Poll';
    }
  };

  const getCharacterMessage = () => {
    switch (characterState) {
      case 'thinking':
        return "Great! I can see you're building something interesting...";
      case 'excited':
        return "Fantastic! We're almost ready to launch your poll!";
      case 'working':
        return "Creating your poll on the blockchain...";
      default:
        return "Hi! I'm here to help you create an amazing poll!";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">Basic Information</h2>
            <div className="form-group">
              <label htmlFor="subject">Poll Subject</label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter poll subject"
                className="form-input animated-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your poll"
                className="form-input form-textarea animated-input"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="form-input animated-input"
              >
                <option value="">Select category</option>
                <option value="technology">Technology</option>
                <option value="entertainment">Entertainment</option>
                <option value="sports">Sports</option>
                <option value="politics">Politics</option>
                <option value="business">Business</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="votingPeriod">Voting Period (hours)</label>
              <select
                id="votingPeriod"
                value={formData.votingPeriod}
                onChange={(e) => handleInputChange('votingPeriod', parseInt(e.target.value))}
                className="form-input animated-input"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
                <option value={168}>1 week</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2 className="step-title">Poll Options</h2>
            <div className="form-group">
              <label>Add your poll options</label>
              <div className="poll-options-list">
                {formData.options.map((option, index) => (
                  <div key={index} className="poll-option-item animated-option">
                    <div className="option-radio">
                      <div className="radio-button animated-radio"></div>
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="option-input animated-input"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="remove-option-btn animated-button"
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
                  className="add-option-btn animated-button"
                >
                  + Add Option
                </button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2 className="step-title">Poll Configuration</h2>
            <div className="form-group">
              <label>Source of Funds</label>
              <div className="radio-group">
                <label className="radio-option animated-radio-option">
                  <input
                    type="radio"
                    name="fundingSource"
                    value="self-funded"
                    checked={formData.fundingSource === 'self-funded'}
                    onChange={(e) => handleInputChange('fundingSource', e.target.value)}
                  />
                  <span>Self-funded</span>
                </label>
                <label className="radio-option animated-radio-option">
                  <input
                    type="radio"
                    name="fundingSource"
                    value="crowdfunded"
                    checked={formData.fundingSource === 'crowdfunded'}
                    onChange={(e) => handleInputChange('fundingSource', e.target.value)}
                  />
                  <span>Crowdfunded</span>
                </label>
              </div>
            </div>

            {formData.fundingSource === 'self-funded' && (
              <div className="form-group">
                <label className="checkbox-label animated-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.openImmediately}
                    onChange={(e) => handleInputChange('openImmediately', e.target.checked)}
                  />
                  <span>Open poll immediately</span>
                </label>
              </div>
            )}

            <div className="form-group">
              <label>Reward Distribution</label>
              <div className="radio-group">
                <label className="radio-option animated-radio-option">
                  <input
                    type="radio"
                    name="rewardDistribution"
                    value="equal-share"
                    checked={formData.rewardDistribution === 'equal-share'}
                    onChange={(e) => handleInputChange('rewardDistribution', e.target.value)}
                  />
                  <span>Equal share (split total fund equally)</span>
                </label>
                <label className="radio-option animated-radio-option">
                  <input
                    type="radio"
                    name="rewardDistribution"
                    value="fixed"
                    checked={formData.rewardDistribution === 'fixed'}
                    onChange={(e) => handleInputChange('rewardDistribution', e.target.value)}
                  />
                  <span>Fixed reward per response</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label gasless-responses-toggle animated-checkbox">
                <input
                  type="checkbox"
                  checked={formData.enableGaslessResponses}
                  onChange={(e) => handleInputChange('enableGaslessResponses', e.target.checked)}
                />
                <span>🆓 Enable gasless responses (recommended)</span>
              </label>
              <div className="gasless-info-text">
                {formData.enableGaslessResponses 
                  ? "Users can vote without paying transaction fees. Additional 1% admin fee applies."
                  : "Users will pay their own transaction fees when voting."
                }
              </div>
            </div>

            <div className="fee-breakdown animated-breakdown">
              <h3>Fee Breakdown</h3>
              <div className="fee-item">
                <span className="fee-label">Base funding:</span>
                <span className="fee-value">0.05 TON</span>
              </div>
              <div className="fee-item">
                <span className="fee-label">Administration fee ({calculateFees().adminFeeRate}%):</span>
                <span className="fee-value">{calculateFees().adminFeeAmount.toFixed(4)} TON</span>
              </div>
              <div className="fee-item">
                <span className="fee-label">Gas fees:</span>
                <span className="fee-value">0.01 TON</span>
              </div>
              <div className="fee-item total-fee">
                <span className="fee-label">Total cost:</span>
                <span className="fee-value">{calculateFees().totalCost.toFixed(3)} TON</span>
              </div>
              {formData.enableGaslessResponses && (
                <div className="gasless-benefit-note">
                  <span className="benefit-icon">💡</span>
                  <span>Extra 1% fee covers gasless voting infrastructure for your poll responders</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="poll-creation-page animated-poll-creation">
      <div className="poll-creation-header">
        <h1 className="page-title animated-title">Creating Polls</h1>
        <div className="step-indicator">
          <span className="step-text">Step {currentStep} of 3</span>
        </div>
      </div>

      <div className="poll-creation-content">
        <div className="animated-character-section">
          <div className="character-container">
            <div className="character-animation">
              <Lottie 
                animationData={creatorAnimation}
                style={{ width: 120, height: 120 }}
                loop={true}
                autoplay={true}
              />
            </div>
            <div className="character-message">
              <div className="message-bubble">
                {getCharacterMessage()}
              </div>
            </div>
          </div>
        </div>

        <div className="poll-form-section">
          <div className="poll-form animated-form">
            {renderStepContent()}
          </div>
        </div>
      </div>

      <div className="poll-creation-actions">
        <div className="action-buttons">
          {currentStep > 1 && (
            <button className="back-btn animated-button" onClick={handlePrevious}>
              Previous
            </button>
          )}
          
          {currentStep < 3 ? (
            <button 
              className={`next-btn animated-button ${!isStepValid() ? 'disabled' : ''}`}
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!isStepValid() || isCreating}
              className={`create-poll-btn animated-button ${!isStepValid() || isCreating ? 'disabled' : ''} ${isCreating ? 'loading' : ''}`}
            >
              {isCreating ? (
                <>
                  <span className="loading-spinner animated-spinner"></span>
                  Creating Poll...
                </>
              ) : (
                'Create Poll'
              )}
            </button>
          )}
        </div>
        
        <button className="cancel-btn animated-button" onClick={handleBack}>
          Cancel
        </button>
      </div>

      {showToast && (
        <div className="toast animated-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default AnimatedPollCreation;