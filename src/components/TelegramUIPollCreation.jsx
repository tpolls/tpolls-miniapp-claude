import React, { useState, useEffect } from 'react';
import {
  AppRoot,
  Card,
  Cell,
  Section,
  List,
  Input,
  Textarea,
  Button,
  ButtonCell,
  Switch,
  Radio,
  Checkbox,
  Select,
  Placeholder,
  Caption,
  Subheadline,
  Headline,
  Title,
  LargeTitle,
  Avatar,
  Badge,
  Chip,
  Spinner
} from '@telegram-apps/telegram-ui';
import '@telegram-apps/telegram-ui/dist/styles.css';
import { useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import tpollsContract from '../services/tpollsContract';
import { isAnimationEnabled } from '../utils/animationMode';

function TelegramUIPollCreation({ onBack, onPollCreate }) {
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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
      
      // Configure main button
      tg.MainButton.setText('Next Step');
      tg.MainButton.show();
      tg.MainButton.onClick(handleMainButtonClick);
      
      // Configure back button
      tg.BackButton.show();
      tg.BackButton.onClick(handleBackButton);
      
      return () => {
        tg.MainButton.hide();
        tg.BackButton.hide();
      };
    }
    
    // Initialize contract service
    tpollsContract.init(tonConnectUI);
  }, [tonConnectUI]);

  // Update main button based on current step
  useEffect(() => {
    if (webApp) {
      if (currentStep === 3) {
        webApp.MainButton.setText(isCreating ? 'Creating...' : 'Create Poll');
        if (isCreating) {
          webApp.MainButton.showProgress();
        } else {
          webApp.MainButton.hideProgress();
        }
      } else {
        webApp.MainButton.setText('Next Step');
        webApp.MainButton.hideProgress();
      }
      
      // Enable/disable based on validation
      if (isStepValid()) {
        webApp.MainButton.enable();
      } else {
        webApp.MainButton.disable();
      }
    }
  }, [currentStep, formData, isCreating, webApp]);

  const handleMainButtonClick = () => {
    if (currentStep < 3) {
      handleNext();
    } else {
      handleCreate();
    }
  };

  const handleBackButton = () => {
    if (currentStep > 1) {
      handlePrevious();
    } else {
      handleBack();
    }
  };

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
      webApp.HapticFeedback.impactOccurred('medium');
    }
    
    if (!formData.subject.trim() || !formData.options.every(opt => opt.trim())) {
      webApp?.showAlert('Please fill in all required fields');
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
        webApp?.showAlert('Poll created successfully!');
        setTimeout(() => {
          if (onPollCreate) {
            onPollCreate(result.pollData);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      webApp?.showAlert(`Failed to create poll: ${error.message}`);
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Section header="Basic Information">
            <List>
              <Cell multiline>
                <Input
                  header="Poll Subject"
                  placeholder="What should we vote on?"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                />
              </Cell>
              
              <Cell multiline>
                <Textarea
                  header="Description"
                  placeholder="Describe your poll in detail..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </Cell>

              <Cell multiline>
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
              </Cell>

              <Cell multiline>
                <Select
                  header="Voting Period"
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
              </Cell>
            </List>
          </Section>
        );

      case 2:
        return (
          <Section header="Poll Options">
            <List>
              {formData.options.map((option, index) => (
                <Cell
                  key={index}
                  multiline
                  after={
                    formData.options.length > 2 && (
                      <Button
                        mode="plain"
                        size="small"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </Button>
                    )
                  }
                >
                  <Input
                    header={`Option ${index + 1}`}
                    placeholder={`Enter option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                </Cell>
              ))}
            </List>
            
            {formData.options.length < 6 && (
              <div style={{ padding: '16px' }}>
                <Button
                  mode="outlined"
                  size="large"
                  stretched
                  onClick={addOption}
                >
                  Add Option
                </Button>
              </div>
            )}
          </Section>
        );

      case 3:
        return (
          <>
            <Section header="Funding Source">
              <List>
                <Cell
                  Component="label"
                  before={
                    <Radio
                      name="fundingSource"
                      value="self-funded"
                      checked={formData.fundingSource === 'self-funded'}
                      onChange={(e) => handleInputChange('fundingSource', e.target.value)}
                    />
                  }
                >
                  <div>
                    <Subheadline>Self-funded</Subheadline>
                    <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      You fund the poll rewards
                    </Caption>
                  </div>
                </Cell>

                <Cell
                  Component="label"
                  before={
                    <Radio
                      name="fundingSource"
                      value="crowdfunded"
                      checked={formData.fundingSource === 'crowdfunded'}
                      onChange={(e) => handleInputChange('fundingSource', e.target.value)}
                    />
                  }
                >
                  <div>
                    <Subheadline>Crowdfunded</Subheadline>
                    <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      Community funds the rewards
                    </Caption>
                  </div>
                </Cell>
              </List>
            </Section>

            <Section header="Configuration">
              <List>
                {formData.fundingSource === 'self-funded' && (
                  <Cell
                    Component="label"
                    after={
                      <Switch
                        checked={formData.openImmediately}
                        onChange={(e) => handleInputChange('openImmediately', e.target.checked)}
                      />
                    }
                  >
                    <div>
                      <Subheadline>Open immediately</Subheadline>
                      <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                        Start the poll right after creation
                      </Caption>
                    </div>
                  </Cell>
                )}

                <Cell
                  Component="label"
                  after={
                    <Switch
                      checked={formData.enableGaslessResponses}
                      onChange={(e) => handleInputChange('enableGaslessResponses', e.target.checked)}
                    />
                  }
                >
                  <div>
                    <Subheadline>Gasless responses</Subheadline>
                    <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      Users vote without paying gas fees
                    </Caption>
                  </div>
                </Cell>
              </List>
            </Section>

            <Section header="Fee Breakdown">
              <List>
                <Cell
                  after={<Caption level="1">0.05 TON</Caption>}
                >
                  <Subheadline>Base funding</Subheadline>
                </Cell>
                <Cell
                  after={<Caption level="1">{calculateFees().adminFeeAmount.toFixed(4)} TON</Caption>}
                >
                  <Subheadline>Admin fee ({calculateFees().adminFeeRate}%)</Subheadline>
                </Cell>
                <Cell
                  after={<Caption level="1">0.01 TON</Caption>}
                >
                  <Subheadline>Gas fees</Subheadline>
                </Cell>
                <Cell
                  after={<Badge type="number">{calculateFees().totalCost.toFixed(3)} TON</Badge>}
                >
                  <Subheadline style={{ fontWeight: 600 }}>Total cost</Subheadline>
                </Cell>
              </List>
            </Section>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AppRoot>
      <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
          <WalletMenu />
        </div>
        
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '60px', marginBottom: '32px' }}>
          <LargeTitle style={{ marginBottom: '8px' }}>Creating Polls</LargeTitle>
          <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Step {currentStep} of 3
          </Caption>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
          {renderStepContent()}
        </div>

        {/* Progress indicator */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3].map(step => (
              <div
                key={step}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: step <= currentStep 
                    ? 'var(--tg-theme-button-color)' 
                    : 'var(--tg-theme-hint-color)',
                  transition: 'background-color 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AppRoot>
  );
}

export default TelegramUIPollCreation;