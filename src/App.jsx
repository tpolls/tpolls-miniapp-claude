import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import Welcome from './components/Welcome';
import MainApp from './components/MainApp';
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
import { hasUserInteracted, initializeUserHistory, recordPollCreation, recordPollResponse, markOnboardingCompleted } from './utils/userHistory';
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
          setCurrentPage('getting-started');
        }
      } else {
        setWalletAddress(null);
        setCurrentPage('getting-started');
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  const handleLogin = (walletInfo) => {
    setCurrentPage('main');
  };

  const handleContinue = () => {
    // Mark that user has started the onboarding process
    if (walletAddress) {
      markOnboardingCompleted(walletAddress);
    }
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
    setCurrentPage('getting-started');
  };

  const handleBottomNavigation = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="app">
      {currentPage === 'getting-started' && (
        <GettingStarted onContinue={handleContinue} />
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
      {currentPage === 'main' && isConnected && (
        <MainApp onLogout={handleLogout} onRerunGettingStarted={handleRerunGettingStarted} />
      )}
      {currentPage === 'user-settings' && isConnected && (
        <UserSettings onBack={handleBottomNavigation} onRerunGettingStarted={handleRerunGettingStarted} />
      )}
      {currentPage === 'poll-funding' && isConnected && (
        <PollFunding onBack={handleBottomNavigation} />
      )}
      {currentPage === 'poll-administration' && isConnected && (
        <PollAdministration onBack={handleBottomNavigation} />
      )}
      {currentPage === 'telegram-ui-examples' && isConnected && (
        <TelegramUIExamples onBack={handleBottomNavigation} />
      )}
      {currentPage === 'telegram-ui-poll-creation' && isConnected && (
        <TelegramUIPollCreation onPollCreate={handlePollCreate} onBack={handleBottomNavigation} />
      )}
      
      {isConnected && (
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