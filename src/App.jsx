import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import Welcome from './components/Welcome';
import MainApp from './components/MainApp';
import OnboardingCarousel from './components/OnboardingCarousel';
import GettingStarted from './components/GettingStarted';
import AnimationModeSelection from './components/AnimationModeSelection';
import RoleSelection from './components/RoleSelection';
import PollCreation from './components/PollCreation';
import AnimatedPollCreation from './components/AnimatedPollCreation';
import PollSelection from './components/PollSelection';
import PollResponse from './components/PollResponse';
import UserSettings from './components/UserSettings';
import PollFunding from './components/PollFunding';
import PollAdministration from './components/PollAdministration';
import BottomNavigation from './components/BottomNavigation';
import TelegramUIExamples from './components/examples/TelegramUIExamples';
import TelegramUIPollCreation from './components/TelegramUIPollCreation';
import { hasUserInteracted, initializeUserHistory, recordPollCreation, recordPollResponse, markOnboardingCompleted, resetOnboarding } from './utils/userHistory';
import { getAnimationMode } from './utils/animationMode';
import './components/Welcome.css';
import './components/MainApp.css';
import './components/GettingStarted.css';
import './components/AnimationModeSelection.css';
import './components/RoleSelection.css';
import './components/PollCreation.css';
import './components/AnimatedPollCreation.css';
import './components/PollSelection.css';
import './components/PollResponse.css';
import './components/UserSettings.css';
import './components/PollFunding.css';
import './components/PollAdministration.css';
import './components/BottomNavigation.css';
import './components/WalletMenu.css';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [currentPage, setCurrentPage] = useState('getting-started');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [animationMode, setAnimationMode] = useState('static');

  useEffect(() => {
    // Load animation mode preference
    setAnimationMode(getAnimationMode());
    
    // Set up global navigation functions for MainApp
    window.navigateToExamples = () => setCurrentPage('telegram-ui-examples');
    window.navigateToTelegramUIPollCreation = () => setCurrentPage('telegram-ui-poll-creation');
    window.navigateToPollAdmin = () => setCurrentPage('poll-administration');
    
    // Check initial wallet connection state
    if (tonConnectUI.account) {
      const address = tonConnectUI.account.address;
      setWalletAddress(address);
      setIsConnected(true);
      
      // Initialize user history if new user
      initializeUserHistory(address);
      
      // Check if user has previous interactions
      if (hasUserInteracted(address)) {
        // Returning user - go to dashboard
        setCurrentPage('main');
      } else {
        // New user - go to onboarding
        setCurrentPage('onboarding');
      }
    } else {
      // No wallet connected - show main page with connection option
      setCurrentPage('main');
    }
    
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      setIsConnected(!!walletInfo);
      
      if (walletInfo) {
        const address = walletInfo.account.address;
        setWalletAddress(address);
        
        // Initialize user history if new user
        initializeUserHistory(address);
        
        // Check if user has previous interactions
        if (hasUserInteracted(address)) {
          // Returning user - go to dashboard
          setCurrentPage('main');
        } else {
          // New user - go to onboarding
          setCurrentPage('onboarding');
        }
      } else {
        setWalletAddress(null);
        setCurrentPage('main');
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  const handleLogin = (walletInfo) => {
    setCurrentPage('main');
  };

  const handleContinue = () => {
    // User starts onboarding process, continue to welcome page
    setCurrentPage('role-selection');
  };

  const handleGettingStartedContinue = () => {
    setCurrentPage('role-selection');
  };

  const handleAnimationModeSelect = (mode) => {
    setAnimationMode(mode);
    setCurrentPage('role-selection');
  };

  const handleBackToAnimationMode = () => {
    setCurrentPage('animation-mode-selection');
  };

  const handleRoleSelect = (role) => {
    // Mark onboarding as completed when user selects their role
    if (walletAddress) {
      markOnboardingCompleted(walletAddress);
    }
    
    if (role === 'creator') {
      setCurrentPage('poll-creation');
    } else {
      setCurrentPage('poll-selection');
    }
  };

  const handleBackToGettingStarted = () => {
    setCurrentPage('main');
  };

  const handleBackToRoleSelection = () => {
    setCurrentPage('role-selection');
  };

  const handlePollCreate = (pollData) => {
    console.log('Poll created:', pollData);
    
    // Record poll creation in user history
    if (walletAddress) {
      recordPollCreation(walletAddress, pollData);
    }
    
    setCurrentPage('main');
  };

  const handlePollSelect = (pollData) => {
    console.log('Poll selected:', pollData);
    setSelectedPoll(pollData);
    setCurrentPage('poll-response');
  };

  const handlePollResponse = (responseData) => {
    console.log('Poll response submitted:', responseData);
    
    // Record poll response in user history
    if (walletAddress) {
      recordPollResponse(walletAddress, responseData);
    }
    
    setCurrentPage('main');
  };

  const handleBackToPollSelection = () => {
    setCurrentPage('poll-selection');
  };

  const handleLogout = () => {
    setCurrentPage('getting-started');
    setIsConnected(false);
    setWalletAddress(null);
  };

  const handleRerunGettingStarted = () => {
    // Reset onboarding status and restart the flow
    if (walletAddress) {
      resetOnboarding(walletAddress);
    }
    setCurrentPage('onboarding');
  };

  const handleBottomNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleManagePolls = () => {
    setCurrentPage('manage-polls');
  };

  return (
    <div className="app">
      {currentPage === 'onboarding' && (
        <OnboardingCarousel onComplete={handleContinue} />
      )}
      {currentPage === 'getting-started-wallet' && (
        <GettingStarted onContinue={handleGettingStartedContinue} />
      )}
      {currentPage === 'animation-mode-selection' && (
        <AnimationModeSelection onModeSelect={handleAnimationModeSelect} onBack={handleBackToGettingStarted} />
      )}
      {currentPage === 'role-selection' && (
        <RoleSelection onRoleSelect={handleRoleSelect} onBack={handleBackToGettingStarted} />
      )}
      {currentPage === 'poll-creation' && (
        animationMode === 'animated' ? (
          <AnimatedPollCreation onPollCreate={handlePollCreate} onBack={handleBackToRoleSelection} />
        ) : (
          <PollCreation onPollCreate={handlePollCreate} onBack={handleBackToRoleSelection} />
        )
      )}
      {currentPage === 'poll-selection' && (
        <PollSelection onPollSelect={handlePollSelect} onBack={handleBackToRoleSelection} />
      )}
      {currentPage === 'poll-response' && (
        <PollResponse poll={selectedPoll} onSubmitResponse={handlePollResponse} onBack={handleBackToPollSelection} />
      )}
      {currentPage === 'welcome' && (
        <Welcome onLogin={handleLogin} />
      )}
      {currentPage === 'main' && (
        <MainApp 
          isConnected={isConnected}
          onLogout={handleLogout} 
          onRerunGettingStarted={handleRerunGettingStarted} 
          onPollSelect={handlePollSelect} 
        />
      )}
      {currentPage === 'user-settings' && isConnected && (
        <UserSettings onBack={handleBottomNavigation} onRerunGettingStarted={handleRerunGettingStarted} onManagePolls={handleManagePolls} />
      )}
      {currentPage === 'manage-polls' && isConnected && (
        <div style={{padding: '20px', textAlign: 'center'}}>
          <h1>Manage Polls</h1>
          <p>Manage Polls page coming soon!</p>
          <button onClick={() => handleBottomNavigation('user-settings')}>← Back to Profile</button>
        </div>
      )}
      {currentPage === 'poll-funding' && isConnected && (
        <PollFunding onBack={handleBottomNavigation} />
      )}
      {currentPage === 'poll-administration' && isConnected && (
        <PollAdministration onBack={handleBottomNavigation} />
      )}
      {currentPage === 'telegram-ui-poll-creation' && isConnected && (
        <TelegramUIPollCreation onPollCreate={handlePollCreate} onBack={handleBottomNavigation} />
      )}
      
      {isConnected && !['onboarding', 'getting-started-wallet', 'animation-mode-selection', 'welcome'].includes(currentPage) && (
        <BottomNavigation 
          currentPage={currentPage} 
          onNavigate={handleBottomNavigation} 
        />
      )}
    </div>
  );
}

function AppWithProvider() {
  return (
    <TonConnectUIProvider manifestUrl="https://tpolls.vercel.app/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}

export default AppWithProvider;