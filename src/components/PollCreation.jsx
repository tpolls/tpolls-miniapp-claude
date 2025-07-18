import React, { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import {
  AppRoot,
  Card,
  Cell,
  Section,
  List,
  Input,
  Textarea,
  Button,
  Switch,
  Radio,
  Checkbox,
  Select,
  Caption,
  Subheadline,
  Title,
  LargeTitle
} from '@telegram-apps/telegram-ui';
import '@telegram-apps/telegram-ui/dist/styles.css';
import WalletMenu from './WalletMenu';
import { getActiveContract, getActiveConfig, USE_SIMPLE_CONTRACT } from '../config/contractConfig';
import { transformPollDataForSimpleContract, transformPollDataForComplexContract } from '../utils/contractDataTransformer';
import './PollCreation.css';

function PollCreation({ onBack, onPollCreate }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Get active contract service and configuration
  const contractService = getActiveContract();
  const contractConfig = getActiveConfig();
  
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
    rewardDistribution: 'equal-share' // 'equal-share' or 'fixed'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Initialize contract service
    contractService.init(tonConnectUI);
    
    // Enhanced CSS injection for Telegram UI Switch theming
    const style = document.createElement('style');
    style.id = 'telegram-switch-theme';
    style.textContent = `
      /* Force Telegram UI Switch colors using inline styles and CSS vars */
      [role="switch"] {
        background-color: #48484a !important;
        border: 1px solid #636366 !important;
        --tgui-switch-bg: #48484a !important;
        --tgui-switch-bg-checked: #0a84ff !important;
      }
      
      [role="switch"][aria-checked="true"] {
        background-color: #0a84ff !important;
        border: 1px solid #0a84ff !important;
      }
      
      /* Target switch components more specifically */
      .ai-toggle-container [role="switch"],
      .checkbox-label [role="switch"] {
        background: #48484a !important;
        border: 1px solid #636366 !important;
      }
      
      .ai-toggle-container [role="switch"][aria-checked="true"],
      .checkbox-label [role="switch"][aria-checked="true"] {
        background: #0a84ff !important;
        border: 1px solid #0a84ff !important;
      }
    `;
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById('telegram-switch-theme');
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
    
    document.head.appendChild(style);
    
    // Cleanup function
    return () => {
      const styleToRemove = document.getElementById('telegram-switch-theme');
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, [tonConnectUI]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  }, []);

  const handleOptionChange = useCallback((index, value) => {
    setFormData(prevData => {
      const newOptions = [...prevData.options];
      newOptions[index] = value;
      return {
        ...prevData,
        options: newOptions
      };
    });
  }, []);


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

  const handleNext = async () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    // If moving from Step 1 to Step 2 and AI is enabled, generate options first
    if (currentStep === 1 && useAI) {
      // Check if we already have AI-generated options (not empty default options)
      const hasDefaultOptions = formData.options.length === 2 && 
        formData.options.every(opt => opt.trim() === '');
      
      if (hasDefaultOptions || formData.options.every(opt => opt.trim() === '')) {
        await generateAIOptionsForNext();
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const generateAIOptionsForNext = async () => {
    if (!formData.subject.trim()) {
      setToastMessage('Please enter a poll subject first');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsGeneratingOptions(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_DPOLLS_API || 'http://localhost:3001'}/api/poll-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: formData.subject,
          category: formData.category,
          numOptions: 2
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.options && Array.isArray(result.options)) {
        // Replace current options with AI-generated ones
        setFormData({
          ...formData,
          options: result.options
        });
        
        setToastMessage(`Generated ${result.options.length} AI options!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error generating AI options:', error);
      setToastMessage(`Failed to generate options: ${error.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      // Continue to next step even if AI generation fails
    } finally {
      setIsGeneratingOptions(false);
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
    
    const adminFeeAmount = baseFunding * baseAdminFee;
    const totalCost = baseFunding + adminFeeAmount + 0.01; // +0.01 for gas
    
    return {
      baseFunding,
      adminFeeRate: baseAdminFee * 100, // Convert to percentage
      adminFeeAmount,
      totalCost
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
      
      // Prepare poll data based on contract type
      let pollData = {
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
        feeBreakdown: feeCalculation,
        createdBy: tonConnectUI.account?.address
      };

      // Transform data based on contract type
      if (USE_SIMPLE_CONTRACT) {
        pollData = transformPollDataForSimpleContract(pollData);
        console.log(`🔧 Creating poll with ${contractConfig.name} (simplified data)`);
      } else {
        pollData = transformPollDataForComplexContract(pollData);
        console.log(`🔧 Creating poll with ${contractConfig.name} (full data)`);
      }

      const result = await contractService.createPoll(pollData);
      
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
        return formData.subject.trim() && formData.category.trim();
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="subject">Poll Subject *</label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="What should we vote on?"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your poll in detail..."
                className="form-input form-textarea"
                rows="3"
              />
            </div>

            <div className="form-group ai-toggle-group">
              <div className="switch-container ai-toggle-container">
                <label className="ai-toggle-label">
                  <Switch
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                  />
                  <span className="ai-toggle-text">🤖 Generate options with AI</span>
                </label>
              </div>
              
              {useAI && (
                <div className="ai-generation-section">
                  <p className="ai-description">
                    ✨ AI will automatically generate poll options when you proceed to the next step based on your subject and description.
                  </p>
                  {isGeneratingOptions && (
                    <div className="ai-generating-indicator">
                      <span className="loading-spinner"></span>
                      <span>Generating AI options...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <Select
                header="Category"
                placeholder="Select category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="">Select category</option>
                <option value="technology">Technology</option>
                <option value="entertainment">Entertainment</option>
                <option value="sports">Sports</option>
                <option value="politics">Politics</option>
                <option value="business">Business</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="votingPeriod">Voting Period (hours)</label>
              <Select
                header="Voting Period"
                placeholder="Select duration"
                value={formData.votingPeriod}
                onChange={(e) => handleInputChange('votingPeriod', parseInt(e.target.value))}
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
                <option value={168}>1 week</option>
              </Select>
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
                      <Button
                        mode="plain"
                        size="small"
                        onClick={() => removeOption(index)}
                        style={{ color: 'var(--tg-theme-destructive-text-color)' }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {formData.options.length < 6 && (
                <Button
                  mode="outline"
                  size="medium"
                  stretched
                  onClick={addOption}
                >
                  + Add Option
                </Button>
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
                <label className="radio-option">
                  <Radio
                    name="fundingSource"
                    value="self-funded"
                    checked={formData.fundingSource === 'self-funded'}
                    onChange={(e) => handleInputChange('fundingSource', e.target.value)}
                  />
                  <span>Self-funded</span>
                </label>
                <label className="radio-option">
                  <Radio
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
                <label className="checkbox-label">
                  <Checkbox
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
                <label className="radio-option">
                  <Radio
                    name="rewardDistribution"
                    value="equal-share"
                    checked={formData.rewardDistribution === 'equal-share'}
                    onChange={(e) => handleInputChange('rewardDistribution', e.target.value)}
                  />
                  <span>Equal share (split total fund equally)</span>
                </label>
                <label className="radio-option">
                  <Radio
                    name="rewardDistribution"
                    value="fixed"
                    checked={formData.rewardDistribution === 'fixed'}
                    onChange={(e) => handleInputChange('rewardDistribution', e.target.value)}
                  />
                  <span>Fixed reward per response</span>
                </label>
              </div>
            </div>


            <div className="fee-breakdown">
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppRoot>
      <div className="poll-creation-page">
        <div className="poll-creation-content">
          <div className="poll-form-section">
            <div className="poll-form">
              {renderStepContent()}
            </div>
          </div>
        </div>

        <div className="poll-creation-actions">
          <div className="action-buttons">
            {currentStep > 1 ? (
              <>
                <Button
                  size="large"
                  mode="outline"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    size="large"
                    mode="filled"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="large"
                    mode="filled"
                    onClick={handleCreate}
                    disabled={!isStepValid() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <span className="loading-spinner"></span>
                        Creating Poll...
                      </>
                    ) : (
                      'Create Poll'
                    )}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  size="large"
                  mode="plain"
                  onClick={handleBack}
                >
                  Cancel
                </Button>
                
                <Button
                  size="large"
                  mode="filled"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </div>

        {showToast && (
          <div className="toast">
            {toastMessage}
          </div>
        )}
      </div>
    </AppRoot>
  );
}

export default PollCreation;